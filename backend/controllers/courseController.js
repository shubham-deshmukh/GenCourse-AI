import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import User from '../models/User.js';
import scheduler from '../services/scheduler/lesson/LessonScheduler.js';
import pdfScheduler from '../services/scheduler/pdf/PdfScheduler.js';
import generationEvents from '../services/scheduler/eventEmitter.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getEnv } from '../config/env.js';


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

    // Trigger decoupled background course generation scheduling (non-blocking)
    scheduler.addCourse(course._id.toString(), trimmedTitle);

    console.log(`🆕 Created new course shell and enqueued generation for "${trimmedTitle}": ${course._id}`);
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

  try {
    // 1. Query the course document with populated modules and lessons
    const course = await Course.findById(id).populate({
      path: 'modules',
      options: { sort: { order: 1 } },
      populate: {
        path: 'lessons',
        options: { sort: { order: 1 } }
      }
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // 2. Establish Server-Sent Events (SSE) connection
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (event, data) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    console.log(`🔗 Established SSE stream connection for course: "${course.title}" (${course._id})`);
    sendEvent('status', { message: 'Connected to course generation pipeline...' });

    // 3. Catch-Up Phase: Send historical outline and completed lessons if already generated
    if (course.status !== 'outline_generating') {
      const outlineData = course.toObject();
      const populatedModules = [];

      for (const mod of course.modules) {
        const modObj = mod.toObject ? mod.toObject() : mod;

        // Retrieve completed lessons from MongoDB
        const completedLessons = await Lesson.find({ moduleId: mod._id }).sort({ order: 1 });

        // Retrieve pending/processing lesson jobs from scheduler queue to build placeholder list
        const pendingJobs = scheduler.queue.filter(
          j => j.courseId === id &&
               j.type === 'lesson' &&
               j.payload.moduleId.toString() === mod._id.toString()
        );

        const lessonsList = [];

        // Add already generated lessons
        for (const l of completedLessons) {
          lessonsList.push(l.toObject());
        }

        // Add pending lessons as placeholders for the frontend outline
        for (const job of pendingJobs) {
          lessonsList.push({
            title: job.payload.targetLessonTitle,
            order: job.payload.lIdx,
            isPlaceholder: true
          });
        }

        // Sort by their sequential order index
        lessonsList.sort((a, b) => a.order - b.order);
        modObj.lessons = lessonsList;
        populatedModules.push(modObj);
      }

      outlineData.modules = populatedModules;

      // Stream curriculum outline structure to frontend
      sendEvent('outline', outlineData);

      // Stream individual completed lessons to frontend
      for (const mod of populatedModules) {
        for (const lesson of mod.lessons) {
          if (!lesson.isPlaceholder) {
            sendEvent('lesson', {
              moduleId: mod._id,
              lesson
            });
          }
        }
      }
    }

    // 4. Handle Terminal Course States
    if (course.status === 'completed') {
      sendEvent('complete', course);
      res.end();
      return;
    }

    if (course.status === 'failed') {
      sendEvent('error', { message: course.progress.currentStatusMessage || 'Course generation failed.' });
      res.end();
      return;
    }

    // 5. Subscription Phase: Listen for live updates from global scheduler singleton
    const listener = (event) => {
      sendEvent(event.type, event.data);
      if (event.type === 'complete' || event.type === 'error') {
        res.end();
        generationEvents.off(`course:${id}`, listener);
      }
    };

    generationEvents.on(`course:${id}`, listener);

    // Safely unsubscribe to prevent memory leaks when client closes/drops the socket
    req.on('close', () => {
      console.log(`🔌 SSE stream connection closed for course: ${id}`);
      generationEvents.off(`course:${id}`, listener);
    });

  } catch (error) {
    console.error('❌ SSE Course Stream Connection Error:', error);
    if (res.headersSent) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`);
      res.end();
    } else {
      next(error);
    }
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

/**
 * @desc    Trigger PDF generation in background queue
 * @route   POST /api/courses/:id/pdf
 * @access  Private
 */
export const generateCoursePdf = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Course ID format' });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Security: Only course creator can trigger PDF generation
    if (course.creator && course.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to export this course' });
    }

    // Safety constraint: Only completed courses can be exported
    if (course.status !== 'completed') {
      return res.status(400).json({ message: 'Download button is allowed only when course generation completes.' });
    }

    // Enqueue PDF generation job
    await pdfScheduler.addPdfJob(id);

    res.status(202).json({
      message: 'PDF generation enqueued',
      pdfStatus: 'queued'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Securely download generated course PDF
 * @route   GET /api/courses/:id/download-pdf
 * @access  Private
 */
export const downloadCoursePdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    const __dirname = path.dirname(fileURLToPath(import.meta.url));

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Course ID format' });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Security: Only course creator can download
    if (course.creator && course.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to download this course' });
    }

    const filePath = path.join(__dirname, '../storage/pdfs', `${id}.pdf`);

    // Verify physical file exists on VPS disk
    try {
      await fs.promises.access(filePath);
    } catch {
      return res.status(404).json({ message: 'PDF file not generated or missing' });
    }

    // Stream download safely with clean file naming
    const safeTitle = course.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    res.download(filePath, `gencourse_${safeTitle}.pdf`);
  } catch (error) {
    next(error);
  }
};

