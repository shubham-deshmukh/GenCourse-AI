import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import User from '../models/User.js';
import { generateCourseOutline, generateLessonDetails } from '../services/courseGenerationService.js';
import { mapLimit } from '../utils/promiseUtils.js';
import mongoose from 'mongoose';
import fs from 'fs';

// Track in-progress course generations to prevent concurrent duplicate generation runs
const activeGenerations = new Set();

// Pre-seeded template lookup list for fallback matching
const COURSE_PRESETS = {
  'Intro to React Hooks': 'Intro to React Hooks',
  'Basics of Copyright Law': 'Basics of Copyright Law',
  'Quantum Mechanics for Beginners': 'Quantum Mechanics for Beginners',
  'Acoustic Guitar 101': 'Acoustic Guitar 101'
};

const generateMockCourseData = (title) => {
  const isProgramming = /react|hook|js|javascript|typescript|code|programming|developer|software|coding/i.test(title);
  return {
    title,
    description: `A comprehensive curriculum about ${title}, compiled dynamically by GenCourse AI's LLM engine.`,
    resources: [
      { name: `${title.replace(/\s+/g, '_')}_Cheat_Sheet.pdf`, size: '2.8 MB', type: 'PDF' },
      { name: isProgramming ? `${title.replace(/\s+/g, '_')}_Exercise_Code.zip` : `${title.replace(/\s+/g, '_')}_Study_Guide.pdf`, size: '4.2 MB', type: isProgramming ? 'ZIP' : 'PDF' }
    ],
    quizzes: [
      {
        id: `quiz-${Date.now()}-1`,
        question: isProgramming 
          ? `What is the fundamental concept of ${title}?`
          : `Which of the following best describes the core principle of ${title}?`,
        options: isProgramming
          ? [
              `Understanding its core syntax and parameters`,
              `Configuring external networks and databases`,
              `Deploying production servers and caching layers`,
              `Managing user billing and authentication preferences`
            ]
          : [
              `The foundational guidelines and practical applications`,
              `Writing system configurations and server scripts`,
              `Debugging code compiling errors`,
              `Developing reactive software functions`
            ],
        correctIndex: 0,
        explanation: isProgramming
          ? `The foundational concepts of ${title} require understanding its core elements and specifications before building advanced features.`
          : `The core principles of ${title} must be fully understood in their historical and practical contexts before moving on to advanced case studies.`
      },
      {
        id: `quiz-${Date.now()}-2`,
        question: isProgramming
          ? `Which tool or approach is recommended for managing state/actions in ${title}?`
          : `Which strategy is most effective for studying and applying ${title}?`,
        options: isProgramming
          ? [
              `Using browser cookie parameters`,
              `Utilizing dedicated built-in lifecycle and hook methods`,
              `Manually rewriting compile logs`,
              `Re-routing API gateways`
            ]
          : [
              `Reviewing historical archives and system logs`,
              `Analyzing key case studies and structured methodologies`,
              `Compiling sample binary assets`,
              `Executing local test scripts`
            ],
        correctIndex: 1,
        explanation: isProgramming
          ? `Best practices for ${title} specify using the dedicated built-in architecture for managing reactive states and operations.`
          : `Studying ${title} is most effective when analyzing structured methodologies and documented case studies.`
      }
    ],
    modules: [
      {
        title: 'Module 1: Foundations of ' + title,
        lessons: [
          {
            title: `1.1 Introduction to ${title}`,
            objectives: isProgramming
              ? [
                  `Understand the core rationale behind ${title}`,
                  `Identify the primary prerequisites and system requirements`,
                  `Configure your local environment for development`
                ]
              : [
                  `Understand the historical context and importance of ${title}`,
                  `Identify the core definitions and key terminology`,
                  `Analyze the initial scope and basic tenets of the field`
                ],
            videoSearchQuery: `introduction to ${title} tutorial beginner guide`,
            content: {
              en: `${title} represents a major paradigm shift. In this lesson, we cover the core concepts, historical background, and initial foundational setups.\n\n### Key Takeaways:\n- Understand the core principles of ${title}.\n- Study historical case studies and guidelines.\n- Apply initial definitions to basic scenarios.`,
              mr: `${title} हा एक महत्त्वाचा बदल दर्शवतो. या पाठात, आपण मूलभूत संकल्पना, ऐतिहासिक पार्श्वभूमी आणि सुरुवातीच्या मूलभूत गोष्टींचा अभ्यास करू.`,
              hi: `${title} एक महत्वपूर्ण बदलाव का प्रतिनिधित्व करता है। इस पाठ में, हम बुनियादी अवधारणाओं, ऐतिहासिक पृष्ठभूमि और शुरुआती बुनियादी व्यवस्थाओं को कवर करेंगे।`
            },
            script: `Welcome to Lesson 1.1. In this video, we will explore why we study ${title} and how it provides structured, foundational capability.`,
            videoSlide: `Introduction to ${title}: Core Principles & History`
          },
          {
            title: isProgramming ? `1.2 Building Your First Project` : `1.2 Core Methodologies in Practice`,
            objectives: isProgramming
              ? [
                  `Create a basic project directory and configuration file`,
                  `Write and run a simple test program`,
                  `Debug common configuration and compiling errors`
                ]
              : [
                  `Apply basic principles to a real-world scenario`,
                  `Organize study notes and key case studies`,
                  `Evaluate common structural errors in early-stage practices`
                ],
            videoSearchQuery: isProgramming ? `how to build a project with ${title} code example` : `practical application of ${title} examples`,
            content: {
              en: isProgramming
                ? `Let's construct a simple project using ${title}.\n\n\`\`\`javascript\n// Sample configuration\nconst config = {\n  name: "${title}",\n  version: "1.0.0",\n  active: true\n};\nconsole.log("Welcome to " + config.name);\n\`\`\`\nRun this script in your local environment and observe the printed output logs.`
                : `To successfully apply the concepts of ${title}, start by setting up a dedicated research workspace or journal. Track key dates, primary definitions, and case studies. Documenting your observations systematically will help solidify your understanding of these core principles.`,
              mr: isProgramming ? `चला ${title} चा वापर करून एक साधा प्रकल्प तयार करूया.` : `चला ${title} चा वापर करून एक व्यावहारिक कार्यप्रवाह तयार करूया.`,
              hi: isProgramming ? `आइए ${title} का उपयोग करके एक सरल परियोजना बनाएं।` : `आइए ${title} का उपयोग करके एक व्यावहारिक कार्यप्रवाह बनाएं।`
            },
            script: isProgramming 
              ? `Let's write some code! In this lesson, we will set up our workspace, initialize a configuration file, and execute our first script.`
              : `Let's look at real-world applications. In this lesson, we will walk through practical methodologies and review standard case studies.`,
            videoSlide: isProgramming ? `First Project Setup: Configuration & Execution` : `Core Methodologies: Practical Case Studies`
          }
        ]
      },
      {
        title: isProgramming ? 'Module 2: Advanced Mechanics' : 'Module 2: Advanced Concepts & Case Studies',
        lessons: [
          {
            title: isProgramming ? `2.1 Optimizing Performance` : `2.1 Deep Dive & Future Trends`,
            objectives: isProgramming
              ? [
                  `Analyze rendering profiles and resource leaks`,
                  `Implement memoization or cache patterns`,
                  `Review checklist guidelines for production deployment`
                ]
              : [
                  `Explore complex scenarios and edge cases in ${title}`,
                  `Understand future industry trends and global applications`,
                  `Review standard professional guidelines and codes of conduct`
                ],
            videoSearchQuery: isProgramming ? `${title} performance optimization best practices` : `advanced concepts in ${title} expert guide`,
            content: {
              en: isProgramming
                ? `Performance optimization in ${title} requires proper memoization, connection pooling, and asset compilation. Avoid common loops and unnecessary re-renders to ensure high speed.`
                : `Taking a deeper dive into ${title} reveals complex paradigms and future trends. Experts focus on integration standards, global frameworks, and ethical guidelines. Staying up-to-date with emerging methodologies is critical for success in this field.`,
              mr: isProgramming ? `${title} मध्ये कामगिरी सुधारण्यासाठी योग्य मेमोइझेशन आवश्यक आहे.` : `${title} चा सखोल अभ्यास भविष्यातील प्रवाह दर्शवतो.`,
              hi: isProgramming ? `${title} में प्रदर्शन के अनुकूलन के लिए उचित मेमोइजेशन की आवश्यकता होती है।` : `${title} का गहन अध्ययन भविष्य के रुझानों को प्रकट करता है।`
            },
            script: isProgramming 
              ? `Today we discuss optimization. We break down the four critical performance checks to run in your production pipelines.`
              : `Today we examine advanced concepts. We break down future trends and ethical frameworks to consider in your practices.`,
            videoSlide: isProgramming ? `Performance Audits: Speed & Compilation Optimization` : `Future Trends & Advanced Frameworks`
          }
        ]
      }
    ]
  };
};

/**
 * @desc    Get all courses populated with modules and lessons
 * @route   GET /api/courses
 * @access  Public
 */
export const getCourses = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : { creator: req.user._id };
    const courses = await Course.find(query)
      .populate({
        path: 'modules',
        options: { sort: { order: 1 } },
        populate: {
          path: 'lessons',
          options: { sort: { order: 1 } }
        }
      })
      .sort({ createdAt: -1 });

    res.json(courses);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new course or return existing one
 * @route   POST /api/courses
 * @access  Public
 */
export const createCourse = async (req, res, next) => {
  try {
    const { title } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ message: 'Course title is required' });
    }

    const trimmedTitle = title.trim();

    // Create shell Course structure in database
    const course = new Course({
      title: trimmedTitle,
      description: `Course shell initialized for "${trimmedTitle}". Outline and lessons will stream in shortly.`,
      creator: req.user._id,
      resources: [],
      quizzes: [],
      modules: []
    });

    await course.save();

    // Add course to user's enrolledCourses list
    req.user.enrolledCourses.push(course._id);
    await req.user.save();

    console.log(`🆕 Created new course shell for "${trimmedTitle}": ${course._id}`);
    res.status(202).json({
      message: 'Course creation initiated',
      courseId: course._id,
      title: course.title
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    SSE stream course generation (outline and lessons)
 * @route   GET /api/courses/:id/stream
 * @access  Public
 */
export const streamCourse = async (req, res, next) => {
  const { id } = req.params;

  if (activeGenerations.has(id)) {
    console.log(`⚠️ Generation already in progress for course ${id}. Skipping duplicate request.`);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    res.write(`event: status\ndata: ${JSON.stringify({ message: 'Generation already in progress...' })}\n\n`);
    res.end();
    return;
  }

  activeGenerations.add(id);

  try {
    const course = await Course.findById(id);
    if (!course) {
      activeGenerations.delete(id);
      return res.status(404).json({ message: 'Course not found' });
    }

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (event, data) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    console.log(`🔗 Established SSE stream for course: "${course.title}" (${course._id})`);
    sendEvent('status', { message: 'Generation started' });

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured (GEMINI_API_KEY).');
    }

    console.log(`🤖 Compiling outline for "${course.title}" via LLM...`);
    sendEvent('status', { message: 'Compiling curriculum outline via LLM...' });

    let cOutline;
    try {
      cOutline = await generateCourseOutline(course.title);
    } catch (err) {
      console.error('❌ LLM outline generation failed:', err.message);
      throw new Error(`LLM outline generation failed: ${err.message}`);
    }

    // Stage 2: Save Course Outline / Modules to DB & Stream
    console.log(`💾 Saving generated course outline to DB...`);
    course.title = cOutline.title || course.title;
    course.description = cOutline.description || `A comprehensive course on ${course.title}.`;
    
    // Sanitize resources to avoid validation errors due to missing fields from weaker LLMs
    let resources = cOutline.resources;
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

    // Sanitize quizzes to avoid validation errors
    let quizzes = cOutline.quizzes;
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

    const moduleIds = [];
    const savedModules = [];

    // Ensure modules list is valid
    if (!cOutline.modules || !Array.isArray(cOutline.modules) || cOutline.modules.length === 0) {
      cOutline.modules = [
        {
          title: 'Module 1: Introduction to ' + course.title,
          lessonTitles: ['1.1 Getting Started', '1.2 Core Concepts']
        }
      ];
    }

    for (let mIdx = 0; mIdx < cOutline.modules.length; mIdx++) {
      const mData = cOutline.modules[mIdx];
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
      if (!Array.isArray(lessonTitles)) {
        lessonTitles = [];
      }
      lessonTitles = lessonTitles
        .map(t => typeof t === 'string' ? t.trim() : '')
        .filter(t => t.length > 0);

      if (lessonTitles.length === 0) {
        lessonTitles = [`${mIdx + 1}.1 Core Foundations`];
      }

      savedModules.push({
        doc: moduleDoc,
        lessonTitles: lessonTitles
      });
    }

    // Retrieve the most up-to-date course document to prevent version mismatch/VersionError
    const freshCourse = await Course.findById(course._id);
    if (!freshCourse) {
      throw new Error(`Course document not found for ID: ${course._id}`);
    }

    freshCourse.title = course.title;
    freshCourse.description = course.description;
    freshCourse.resources = course.resources;
    freshCourse.quizzes = course.quizzes;
    freshCourse.modules = moduleIds;

    await freshCourse.save();

    // Populate modules for the initial structure
    const populatedCourse = await Course.findById(course._id).populate({
      path: 'modules',
      options: { sort: { order: 1 } }
    });

    const outlineData = populatedCourse.toObject();
    for (let mIdx = 0; mIdx < outlineData.modules.length; mIdx++) {
      const mod = outlineData.modules[mIdx];
      const savedMod = savedModules.find(sm => sm.doc._id.toString() === mod._id.toString());
      if (savedMod) {
        mod.lessons = savedMod.lessonTitles.map((title, lIdx) => ({
          title: title,
          order: lIdx,
          isPlaceholder: true
        }));
      }
    }

    sendEvent('outline', outlineData);

    // Stage 3: Generate detailed lesson content for each chapter in parallel with a concurrency limit
    const lessonTasks = [];
    for (let mIdx = 0; mIdx < savedModules.length; mIdx++) {
      const { doc: moduleDoc, lessonTitles } = savedModules[mIdx];
      for (let lIdx = 0; lIdx < lessonTitles.length; lIdx++) {
        lessonTasks.push({
          moduleDoc,
          lessonTitle: lessonTitles[lIdx],
          lIdx,
          mIdx,
          lessonTitles
        });
      }
    }

    const concurrencyLimit = parseInt(process.env.CONCURRENT_GENERATION_LIMIT, 10) || 2;
    console.log(`🚀 Processing ${lessonTasks.length} lessons in parallel with concurrency limit of ${concurrencyLimit}...`);
    sendEvent('status', { message: `Generating all module lessons concurrently...` });

    const generatedResults = await mapLimit(lessonTasks, concurrencyLimit, async (task) => {
      const { moduleDoc, lessonTitle, lIdx, mIdx, lessonTitles } = task;
      console.log(`  📖 Generating lesson ${mIdx + 1}.${lIdx + 1}: "${lessonTitle}"...`);
      sendEvent('status', { message: `Generating lesson: "${lessonTitle}"...` });

      const cleanCourse = { title: course.title, description: course.description };
      const cleanModule = { title: moduleDoc.title, lessonTitles: lessonTitles };

      let lessonDetails;
      try {
        lessonDetails = await generateLessonDetails(cleanCourse, cleanModule, lessonTitle);
      } catch (err) {
        console.error(`  ❌ Failed to generate lesson details for "${lessonTitle}":`, err.message);
        throw new Error(`Failed to generate lesson details for "${lessonTitle}": ${err.message}`);
      }

      // Save Lesson to DB
      let content = lessonDetails?.content;
      if (!content || typeof content !== 'object') {
        content = {
          en: `Detailed content for ${lessonTitle} is currently being updated.`,
          mr: `${lessonTitle} साठी तपशीलवार सामग्री सध्या अद्यतनित केली जात आहे.`,
          hi: `${lessonTitle} के लिए विस्तृत सामग्री वर्तमान में अपडेट की जा रही है।`
        };
      } else {
        // Make sure required language keys are present
        if (!content.en) {
          content.en = `Detailed content for ${lessonTitle} is currently being updated.`;
        }
        if (!content.mr) {
          content.mr = `${lessonTitle} साठी तपशीलवार सामग्री सध्या अद्यतनित केली जात आहे.`;
        }
        if (!content.hi) {
          content.hi = `${lessonTitle} के लिए विस्तृत सामग्री वर्तमान में अपडेट की जा रही है।`;
        }

        // Clean up duplicate/combined markdown headers (e.g., "## ### Header" -> "## Header")
        const normalizeHeaders = (text) => {
          if (typeof text !== 'string') return text;
          return text.replace(/^(#+)\s+(#+)\s*/gm, (m, p1) => p1 + ' ');
        };
        content.en = normalizeHeaders(content.en);
        content.mr = normalizeHeaders(content.mr);
        content.hi = normalizeHeaders(content.hi);

        // If not a programming course, strip any accidentally generated code blocks or placeholders
        const isProgramming = /react|hook|js|javascript|typescript|code|programming|developer|software|coding|python|java|html|css|sql|rust|c\+\+/i.test(course.title);
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
        moduleId: moduleDoc._id,
        title: lessonDetails?.title || lessonTitle,
        content: content,
        objectives: lessonDetails?.objectives || [],
        videoSearchQuery: lessonDetails?.videoSearchQuery || '',
        script: lessonDetails?.script || '',
        videoSlide: lessonDetails?.videoSlide || '',
        order: lIdx
      });

      await lessonDoc.save();

      // Stream this generated lesson directly to the client immediately
      sendEvent('lesson', {
        moduleId: moduleDoc._id,
        lesson: lessonDoc
      });

      return {
        moduleId: moduleDoc._id,
        lessonId: lessonDoc._id,
        order: lIdx
      };
    });

    // Update modules lessons list in DB after all parallel generation tasks complete
    // to prevent mongoose concurrent update VersionError
    for (const { doc: moduleDoc } of savedModules) {
      const moduleLessons = generatedResults
        .filter((res) => res.moduleId.toString() === moduleDoc._id.toString())
        .sort((a, b) => a.order - b.order)
        .map((res) => res.lessonId);

      moduleDoc.lessons = moduleLessons;
      await moduleDoc.save();
    }

    // Final populated course to finalize SSE connection
    const finalCourse = await Course.findById(course._id).populate({
      path: 'modules',
      options: { sort: { order: 1 } },
      populate: {
        path: 'lessons',
        options: { sort: { order: 1 } }
      }
    });

    console.log(`✅ Fully generated course "${course.title}" and saved to DB.`);
    sendEvent('complete', finalCourse);
    res.end();

  } catch (error) {
    console.error('❌ SSE Course Generation Error:', error);
    if (res.headersSent) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`);
      res.end();
    } else {
      next(error);
    }
  } finally {
    activeGenerations.delete(id);
  }
};

/**
 * @desc    Delete a course and all associated modules, lessons, and user references
 * @route   DELETE /api/courses/:id
 * @access  Public
 */
export const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Course ID format' });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const courseId = course._id;
    console.log(`🧹 Deleting course: "${course.title}" (${courseId})`);

    // 1. Find all associated modules
    const modules = await Module.find({ courseId });
    const moduleIds = modules.map((m) => m._id);

    // 2. Find all lessons associated with these modules
    const lessons = await Lesson.find({ moduleId: { $in: moduleIds } });
    const lessonIds = lessons.map((l) => l._id);

    // 3. Delete lessons from DB
    if (lessonIds.length > 0) {
      await Lesson.deleteMany({ _id: { $in: lessonIds } });
      console.log(`  🗑️ Deleted ${lessonIds.length} lessons.`);
    }

    // 4. Delete modules from DB
    if (moduleIds.length > 0) {
      await Module.deleteMany({ _id: { $in: moduleIds } });
      console.log(`  🗑️ Deleted ${moduleIds.length} modules.`);
    }

    // 5. Clean up User profiles (pull course and lesson references)
    await User.updateMany(
      {},
      {
        $pull: {
          enrolledCourses: courseId,
          completedLessons: { $in: lessonIds }
        }
      }
    );
    console.log(`  👤 Cleaned up enrolled courses and completed lessons from user profiles.`);

    // 6. Delete the Course itself
    await Course.findByIdAndDelete(courseId);
    console.log(`✅ Successfully deleted course "${course.title}".`);

    res.json({ message: 'Course and all related data successfully deleted' });
  } catch (error) {
    next(error);
  }
};

