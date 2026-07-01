import Job from './Job.js';
import GeminiWorker from './GeminiWorker.js';
import OllamaWorker from './OllamaWorker.js';
import generationEvents from './eventEmitter.js';
import Course from '../../models/Course.js';
import Module from '../../models/Module.js';
import Lesson from '../../models/Lesson.js';
import { getCourseOutlinePrompt, getLessonDetailsPrompt } from '../courseGenerationService.js';
import { parseJSONSafely } from '../../utils/jsonUtils.js';
import { getEnv } from '../../config/env.js';

/**
 * Singleton Coordinator managing course generation job orchestration,
 * worker dispatching, global throttling, database persistence, and SSE event publication.
 */
class LessonScheduler {
  constructor() {
    const geminiConcurrency = parseInt(getEnv('CONCURRENT_GENERATION_LIMIT', '2'), 10);
    this.queue = [];
    this.workers = [
      new GeminiWorker({ name: 'GeminiPrimaryWorker', maxConcurrency: geminiConcurrency }),
      new OllamaWorker({ name: 'OllamaFallbackWorker', maxConcurrency: 1 })
    ];

    // Tick the scheduler loop every 1 second to inspect queues and free workers
    this.intervalId = setInterval(() => this.tick(), 1000);
  }

  /**
   * Enqueues an outline generation job for a newly created course shell
   * @param {string} courseId 
   * @param {string} topic 
   */
  async addCourse(courseId, topic) {
    console.log(`[LessonScheduler] Enqueuing outline generation for course "${topic}" (${courseId})`);
    
    // Set initial course state in DB
    await Course.findByIdAndUpdate(courseId, {
      status: 'outline_generating',
      progress: {
        totalLessons: 0,
        completedLessons: 0,
        currentStatusMessage: 'Curriculum outline generation queued...'
      }
    });

    const job = new Job({
      id: `outline-${courseId}`,
      courseId,
      type: 'outline',
      priority: 1, // High Priority
      payload: {
        systemPrompt: 'You are an expert curriculum designer. You must respond with a raw JSON object matching the requested schema. Do not include markdown code block syntax. Be concise.',
        userPrompt: getCourseOutlinePrompt(topic),
        jsonMode: true,
        temperature: 0.1
      }
    });

    this.queue.push(job);
    this.emitEvent(courseId, 'status', { message: 'Outline generation queued...' });
    
    // Trigger immediate scheduling check
    this.tick();
  }

  /**
   * Core scheduling execution loop
   */
  tick() {
    // 1. Identify active available workers
    const availableWorkers = this.workers.filter(w => w.isAvailable());
    if (availableWorkers.length === 0) return;

    // Sort available workers to ensure primary provider is chosen first
    const primaryProvider = getEnv('PRIMARY_LLM_PROVIDER', 'gemini');
    availableWorkers.sort((a, b) => {
      if (a.provider === primaryProvider && b.provider !== primaryProvider) return -1;
      if (a.provider !== primaryProvider && b.provider === primaryProvider) return 1;
      return 0;
    });

    // 2. Retrieve pending jobs
    const pendingJobs = this.queue.filter(j => j.status === 'pending');
    if (pendingJobs.length === 0) return;

    // 3. Process High Priority Jobs (Outlines) first in FIFO order
    const highPriorityJobs = pendingJobs.filter(j => j.priority === 1);
    while (highPriorityJobs.length > 0 && availableWorkers.length > 0) {
      const job = highPriorityJobs.shift();
      const worker = availableWorkers.shift();
      this.dispatch(job, worker);
    }

    // 4. Process Normal Priority Jobs (Lessons) using Round-Robin by Course
    const normalPriorityJobs = pendingJobs.filter(j => j.priority === 2);
    if (normalPriorityJobs.length > 0 && availableWorkers.length > 0) {
      const groupedJobs = this.groupByCourse(normalPriorityJobs);
      const courseIds = Object.keys(groupedJobs);

      let courseIdx = 0;
      while (availableWorkers.length > 0 && courseIds.length > 0) {
        const activeCourseId = courseIds[courseIdx % courseIds.length];
        const courseJobs = groupedJobs[activeCourseId];

        if (courseJobs.length > 0) {
          const job = courseJobs.shift();
          const worker = availableWorkers.shift();
          this.dispatch(job, worker);
        } else {
          // Remove course from active queue list if no jobs remain
          courseIds.splice(courseIdx % courseIds.length, 1);
          continue;
        }
        courseIdx++;
      }
    }
  }

  /**
   * Helper to group an array of jobs by their courseId
   * @param {Job[]} jobs 
   * @returns {object}
   */
  groupByCourse(jobs) {
    return jobs.reduce((acc, job) => {
      if (!acc[job.courseId]) {
        acc[job.courseId] = [];
      }
      acc[job.courseId].push(job);
      return acc;
    }, {});
  }

  /**
   * Dispatches a job to a worker and coordinates responses and errors
   * @param {Job} job 
   * @param {Worker} worker 
   */
  async dispatch(job, worker) {
    console.log(`[LessonScheduler] Dispatching job "${job.id}" to worker "${worker.name}"`);
    
    // Update DB status to reflect active LLM requests
    if (job.type === 'outline') {
      await Course.findByIdAndUpdate(job.courseId, {
        'progress.currentStatusMessage': 'Generating course outline via LLM...'
      });
      this.emitEvent(job.courseId, 'status', { message: 'Generating curriculum outline via LLM...' });
    } else {
      this.emitEvent(job.courseId, 'status', { message: `Generating lesson: "${job.payload.targetLessonTitle}"...` });
    }

    try {
      const resultText = await worker.execute(job);
      await this.handleJobSuccess(job, resultText);
    } catch (error) {
      console.error(`[LessonScheduler] Job "${job.id}" failed on worker "${worker.name}":`, error.message);
      await this.handleJobFailure(job, error);
    } finally {
      // Re-trigger tick immediately to check for newly freed workers
      this.tick();
    }
  }

  /**
   * Handles successful job generation, parsing responses, updating databases, and enqueuing child tasks
   * @param {Job} job 
   * @param {string} resultText 
   */
  async handleJobSuccess(job, resultText) {
    const parsedData = parseJSONSafely(resultText);
    
    try {
      if (job.type === 'outline') {
        await this.persistOutline(job.courseId, parsedData);
      } else {
        await this.persistLesson(job.courseId, job.payload, parsedData);
      }

      // Remove completed job from the active queue
      this.queue = this.queue.filter(j => j.id !== job.id);
    } catch (err) {
      console.error(`[LessonScheduler] Error persisting success results for job "${job.id}":`, err.message);
      await this.handleJobFailure(job, err);
    }
  }

  /**
   * Handles job failure, evaluating retry constraints and worker cooldown periods
   * @param {Job} job 
   * @param {Error} error 
   */
  async handleJobFailure(job, error) {
    const isFatal = job.status === 'failed'; // Checked after worker registers failure retry increments
    
    if (isFatal) {
      console.error(`[LessonScheduler] Job "${job.id}" permanently failed. Retries exhausted.`);
      
      // Update course DB state to failed
      await Course.findByIdAndUpdate(job.courseId, {
        status: 'failed',
        'progress.currentStatusMessage': `Generation failed: ${error.message}`
      });

      this.emitEvent(job.courseId, 'error', { message: `Generation failed: ${error.message}` });
      
      // Cancel and prune all remaining jobs for this specific course from the queue
      this.queue = this.queue.filter(j => j.courseId !== job.courseId);
    } else {
      console.log(`[LessonScheduler] Job "${job.id}" failed, will retry. Attempt: ${job.retries}/${job.maxRetries}`);
      this.emitEvent(job.courseId, 'status', { 
        message: `Warning: Failed to process task. Retrying (attempt ${job.retries}/${job.maxRetries})...` 
      });
    }
  }

  /**
   * Helper to emit SSE event packets
   * @param {string} courseId 
   * @param {string} eventType 
   * @param {any} data 
   */
  emitEvent(courseId, eventType, data) {
    generationEvents.emit(`course:${courseId}`, { type: eventType, data });
  }

  /**
   * PERSISTENCE LAYER: Save course outline structures, module shells, and enqueue lesson jobs
   * @param {string} courseId 
   * @param {object} outline 
   */
  async persistOutline(courseId, outline) {
    console.log(`[LessonScheduler] Saving course outline to DB for ID: ${courseId}`);
    
    const course = await Course.findById(courseId);
    if (!course) throw new Error(`Course document not found: ${courseId}`);

    course.title = outline.title || course.title;
    course.description = outline.description || `A comprehensive course on ${course.title}.`;
    
    // Sanitize outline resource list
    let resources = outline.resources;
    if (Array.isArray(resources)) {
      resources = resources.map((r, idx) => {
        const name = r.name || `Study_Helper_${idx + 1}.pdf`;
        const type = r.type || (name.toLowerCase().endsWith('.zip') ? 'ZIP' : 'PDF');
        const size = r.size || '1.5 MB';
        return { name, size, type, url: r.url || '' };
      });
    } else {
      resources = [
        { name: `${course.title.replace(/\s+/g, '_')}_Guide.pdf`, size: '2.5 MB', type: 'PDF' }
      ];
    }
    course.resources = resources;

    // Sanitize quiz list
    let quizzes = outline.quizzes;
    if (Array.isArray(quizzes)) {
      quizzes = quizzes.map((q, idx) => {
        const id = q.id || `quiz-${Date.now()}-${idx + 1}`;
        const question = q.question || `What is a key concept of ${course.title}?`;
        let options = q.options;
        if (!Array.isArray(options) || options.length < 2) {
          options = ['Option A', 'Option B', 'Option C', 'Option D'];
        } else {
          options = options.map(opt => typeof opt === 'string' ? opt : String(opt));
        }
        let correctIndex = typeof q.correctIndex === 'number' ? q.correctIndex : 0;
        if (correctIndex < 0 || correctIndex >= options.length) {
          correctIndex = 0;
        }
        return {
          id,
          question,
          options,
          correctIndex,
          explanation: q.explanation || 'Detailed explanation is not provided.'
        };
      });
    } else {
      quizzes = [];
    }
    course.quizzes = quizzes;

    // Create Module shells
    const moduleIds = [];
    const savedModules = [];
    let modulesList = outline.modules;
    
    if (!modulesList || !Array.isArray(modulesList) || modulesList.length === 0) {
      modulesList = [
        {
          title: 'Module 1: Introduction to ' + course.title,
          lessonTitles: ['1.1 Getting Started', '1.2 Core Concepts']
        }
      ];
    }

    for (let mIdx = 0; mIdx < modulesList.length; mIdx++) {
      const mData = modulesList[mIdx];
      const mTitle = mData.title || `Module ${mIdx + 1}: Overview of ${course.title}`;
      const moduleDoc = new Module({
        courseId: course._id,
        title: mTitle,
        order: mIdx,
        lessons: []
      });

      await moduleDoc.save();
      moduleIds.push(moduleDoc._id);

      let lessonTitles = mData.lessonTitles || mData.lessons?.map(l => l.title) || [];
      if (!Array.isArray(lessonTitles)) lessonTitles = [];
      lessonTitles = lessonTitles
        .map(t => typeof t === 'string' ? t.trim() : '')
        .filter(t => t.length > 0);

      if (lessonTitles.length === 0) {
        lessonTitles = [`${mIdx + 1}.1 Core Foundations`];
      }

      savedModules.push({
        doc: moduleDoc,
        lessonTitles
      });
    }

    // Update Course model outline reference
    course.modules = moduleIds;
    course.status = 'lessons_generating';
    
    // Calculate progress tracking values
    const totalLessons = savedModules.reduce((acc, sm) => acc + sm.lessonTitles.length, 0);
    course.progress = {
      totalLessons,
      completedLessons: 0,
      currentStatusMessage: 'Curriculum outline saved. Compiling lesson details...'
    };
    
    await course.save();

    // Stream outline to SSE client immediately so interface unlocks
    const outlineData = course.toObject();
    outlineData.modules = savedModules.map(sm => ({
      _id: sm.doc._id,
      title: sm.doc.title,
      order: sm.doc.order,
      lessons: sm.lessonTitles.map((title, lIdx) => ({
        title,
        order: lIdx,
        isPlaceholder: true
      }))
    }));
    
    this.emitEvent(courseId, 'outline', outlineData);

    // Enqueue normal priority lesson jobs
    for (let mIdx = 0; mIdx < savedModules.length; mIdx++) {
      const { doc: moduleDoc, lessonTitles } = savedModules[mIdx];
      for (let lIdx = 0; lIdx < lessonTitles.length; lIdx++) {
        const lessonTitle = lessonTitles[lIdx];
        const job = new Job({
          id: `lesson-${courseId}-${moduleDoc._id}-${lIdx}`,
          courseId,
          type: 'lesson',
          priority: 2, // Normal Priority
          payload: {
            courseTitle: course.title,
            courseDescription: course.description,
            moduleTitle: moduleDoc.title,
            targetLessonTitle: lessonTitle,
            lessonTitles,
            moduleId: moduleDoc._id,
            lIdx,
            mIdx
          }
        });
        
        // Compile system and user prompts
        job.payload.systemPrompt = 'You are an expert technical writer. You must respond with a raw JSON object matching the requested schema. Do not include markdown code block syntax. Be highly concise and clear.';
        job.payload.userPrompt = getLessonDetailsPrompt(
          { title: course.title, description: course.description },
          { title: moduleDoc.title, lessonTitles },
          lessonTitle
        );
        job.payload.jsonMode = true;
        job.payload.temperature = 0.1;

        this.queue.push(job);
      }
    }

    this.emitEvent(courseId, 'status', { message: 'Generating all module lessons concurrently...' });
  }

  /**
   * PERSISTENCE LAYER: Save individual lesson contents, checks if course is completed
   * @param {string} courseId 
   * @param {object} payload 
   * @param {object} lessonDetails 
   */
  async persistLesson(courseId, payload, lessonDetails) {
    const { moduleId, targetLessonTitle, lIdx } = payload;
    console.log(`[LessonScheduler] Persisting lesson details for "${targetLessonTitle}" (Module: ${moduleId})`);

    // Clean up content translations
    let content = lessonDetails?.content;
    if (!content || typeof content !== 'object') {
      content = {
        en: `Detailed content for ${targetLessonTitle} is currently being updated.`,
        mr: `${targetLessonTitle} साठी तपशीलवार सामग्री सध्या अद्यतनित केली जात आहे.`,
        hi: `${targetLessonTitle} के लिए विस्तृत सामग्री वर्तमान में अपडेट की जा रही है।`
      };
    } else {
      if (!content.en) content.en = `Detailed content for ${targetLessonTitle} is currently being updated.`;
      if (!content.mr) content.mr = `${targetLessonTitle} साठी तपशीलवार सामग्री सध्या अद्यतनित केली जात आहे.`;
      if (!content.hi) content.hi = `${targetLessonTitle} के लिए विस्तृत सामग्री वर्तमान में अपडेट की जा रही है।`;

      const normalizeHeaders = (text) => {
        if (typeof text !== 'string') return text;
        return text.replace(/^(#+)\s+(#+)\s*/gm, (m, p1) => p1 + ' ');
      };
      content.en = normalizeHeaders(content.en);
      content.mr = normalizeHeaders(content.mr);
      content.hi = normalizeHeaders(content.hi);

      // Clean up code blocks if non-programming course
      const isProgramming = /react|hook|js|javascript|typescript|code|programming|developer|software|coding|python|java|html|css|sql|rust|c\+\+/i.test(payload.courseTitle);
      if (!isProgramming) {
        const stripCodeBlocks = (text) => {
          if (typeof text !== 'string') return text;
          let cleaned = text.replace(/```[a-z]*[\s\S]*?```/g, '');
          cleaned = cleaned.replace(/###?\s*Code\s*Block\s*\(Optional\):?/gi, '');
          cleaned = cleaned.replace(/###?\s*Code\s*Block:?/gi, '');
          cleaned = cleaned.replace(/Code\s*Block\s*\(Optional\):?/gi, '');
          cleaned = cleaned.replace(/Code\s*Block:?/gi, '');
          return cleaned.trim().replace(/\n{3,}/g, '\n\n');
        };
        content.en = stripCodeBlocks(content.en);
        content.mr = stripCodeBlocks(content.mr);
        content.hi = stripCodeBlocks(content.hi);
      }
    }

    const lessonDoc = new Lesson({
      moduleId,
      title: lessonDetails?.title || targetLessonTitle,
      content,
      objectives: lessonDetails?.objectives || [],
      videoSearchQuery: lessonDetails?.videoSearchQuery || '',
      script: lessonDetails?.script || '',
      videoSlide: lessonDetails?.videoSlide || '',
      order: lIdx
    });

    await lessonDoc.save();

    // Stream lesson item immediately to connect clients
    this.emitEvent(courseId, 'lesson', {
      moduleId,
      lesson: lessonDoc
    });

    // Update completed lesson count in DB
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { 
        $inc: { 'progress.completedLessons': 1 },
        'progress.currentStatusMessage': `Generated lesson: "${lessonDoc.title}"`
      },
      { new: true }
    );

    console.log(`[LessonScheduler] Course progress for ${courseId}: ${updatedCourse.progress.completedLessons}/${updatedCourse.progress.totalLessons}`);

    // If all lessons generated, tie lesson array references to modules in DB
    if (updatedCourse.progress.completedLessons >= updatedCourse.progress.totalLessons) {
      console.log(`[LessonScheduler] All lessons completed for course ${courseId}. Finalizing module linkages...`);
      
      for (const mId of updatedCourse.modules) {
        const moduleLessons = await Lesson.find({ moduleId: mId }).sort({ order: 1 });
        await Module.findByIdAndUpdate(mId, {
          lessons: moduleLessons.map(l => l._id)
        });
      }

      // Mark Course completed in database
      updatedCourse.status = 'completed';
      updatedCourse.progress.currentStatusMessage = 'Course curriculum fully generated!';
      await updatedCourse.save();

      // Retrieve final fully populated course document
      const finalCourse = await Course.findById(courseId).populate({
        path: 'modules',
        options: { sort: { order: 1 } },
        populate: {
          path: 'lessons',
          options: { sort: { order: 1 } }
        }
      });

      this.emitEvent(courseId, 'complete', finalCourse);
      console.log(`[LessonScheduler] Course generation complete for "${finalCourse.title}"`);
    }
  }
}

export const scheduler = new LessonScheduler();
export default scheduler;
