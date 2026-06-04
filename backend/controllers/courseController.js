import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import User from '../models/User.js';
import { generateCourseOutline, generateLessonDetails } from '../services/llmService.js';
import mongoose from 'mongoose';
import fs from 'fs';

// Pre-seeded template lookup list for fallback matching
const COURSE_PRESETS = {
  'Intro to React Hooks': 'Intro to React Hooks',
  'Basics of Copyright Law': 'Basics of Copyright Law',
  'Quantum Mechanics for Beginners': 'Quantum Mechanics for Beginners',
  'Acoustic Guitar 101': 'Acoustic Guitar 101'
};

const generateMockCourseData = (title) => {
  return {
    title,
    description: `A comprehensive curriculum about ${title}, compiled dynamically by GenCourse AI's LLM engine.`,
    resources: [
      { name: `${title.replace(/\s+/g, '_')}_Cheat_Sheet.pdf`, size: '2.8 MB', type: 'PDF' },
      { name: `${title.replace(/\s+/g, '_')}_Exercise_Code.zip`, size: '14.2 MB', type: 'ZIP' }
    ],
    quizzes: [
      {
        id: `quiz-${Date.now()}-1`,
        question: `What is the fundamental concept of ${title}?`,
        options: [
          `Understanding its core syntax and parameters`,
          `Configuring external networks and databases`,
          `Deploying production servers and caching layers`,
          `Managing user billing and authentication preferences`
        ],
        correctIndex: 0,
        explanation: `The foundational concepts of ${title} require understanding its core elements and specifications before building advanced features.`
      },
      {
        id: `quiz-${Date.now()}-2`,
        question: `Which tool or approach is recommended for managing state/actions in ${title}?`,
        options: [
          `Using browser cookie parameters`,
          `Utilizing dedicated built-in lifecycle and hook methods`,
          `Manually rewriting compile logs`,
          `Re-routing API gateways`
        ],
        correctIndex: 1,
        explanation: `Best practices for ${title} specify using the dedicated built-in architecture for managing reactive states and operations.`
      }
    ],
    modules: [
      {
        title: 'Module 1: Foundations of ' + title,
        lessons: [
          {
            title: `1.1 Introduction to ${title}`,
            objectives: [
              `Understand the core rationale behind ${title}`,
              `Identify the primary prerequisites and system requirements`,
              `Configure your local environment for development`
            ],
            videoSearchQuery: `introduction to ${title} tutorial beginner guide`,
            content: {
              en: `${title} represents a major paradigm shift. In this lesson, we cover the core concepts, historical background, and initial installation setups.\n\n### Key Takeaways:\n- Understand the core constraints of ${title}.\n- Configure local settings and compilers.\n- Test basic setup examples.`,
              es: `${title} representa un cambio de paradigma importante. En esta lección, cubrimos los conceptos básicos, los antecedentes históricos y las configuraciones de instalación iniciales.`,
              fr: `${title} représente un changement de paradigme majeur. Dans cette leçon, nous couvrons les concepts de base, le contexte historique et les configurations d'installation initiales.`
            },
            script: `Welcome to Lesson 1.1. In this video, we will explore why we use ${title} and how it provides structured, high-performance capability.`,
            videoSlide: `Introduction to ${title}: Core Principles & History`
          },
          {
            title: `1.2 Building Your First Project`,
            objectives: [
              `Create a basic project directory and configuration file`,
              `Write and run a simple test program`,
              `Debug common configuration and compiling errors`
            ],
            videoSearchQuery: `how to build a project with ${title} code example`,
            content: {
              en: `Let's construct a simple project using ${title}.\n\n\`\`\`javascript\n// Sample configuration\nconst config = {\n  name: "${title}",\n  version: "1.0.0",\n  active: true\n};\nconsole.log("Welcome to " + config.name);\n\`\`\`\nRun this script in your local environment and observe the printed output logs.`,
              es: `Construyamos un proyecto simple usando ${title}.`,
              fr: `Construisons un projet simple en utilisant ${title}.`
            },
            script: `Let's write some code! In this lesson, we will set up our workspace, initialize a configuration file, and execute our first script.`,
            videoSlide: `First Project Setup: Configuration & Execution`
          }
        ]
      },
      {
        title: 'Module 2: Advanced Mechanics',
        lessons: [
          {
            title: `2.1 Optimizing Performance`,
            objectives: [
              `Analyze rendering profiles and resource leaks`,
              `Implement memoization or cache patterns`,
              `Review checklist guidelines for production deployment`
            ],
            videoSearchQuery: `${title} performance optimization best practices`,
            content: {
              en: `Performance optimization in ${title} requires proper memoization, connection pooling, and asset compilation. Avoid common loops and unnecessary re-renders to ensure high speed.`,
              es: `La optimización del rendimiento en ${title} requiere una memorización adecuada.`,
              fr: `L'optimisation des performances dans ${title} nécessite une mémorisation appropriée.`
            },
            script: `Today we discuss optimization. We break down the four critical performance checks to run in your production pipelines.`,
            videoSlide: `Performance Audits: Speed & Compilation Optimization`
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
    const courses = await Course.find()
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
      resources: [],
      quizzes: [],
      modules: []
    });

    await course.save();

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

  try {
    const course = await Course.findById(id);
    if (!course) {
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

    let isRealAI = false;
    let cOutline;

    if (process.env.OLLAMA_BASE_URL || process.env.GEMINI_API_KEY) {
      try {
        console.log(`🤖 Compiling outline for "${course.title}" via LLM...`);
        sendEvent('status', { message: 'Compiling curriculum outline via LLM...' });
        cOutline = await generateCourseOutline(course.title);
        isRealAI = true;
      } catch (err) {
        console.error('❌ LLM outline generation failed, falling back to mock:', err.message);
        sendEvent('status', { message: 'LLM outline generation failed, falling back to mock...' });
      }
    }

    if (!isRealAI) {
      console.log(`🤖 Generating mock outline fallback for "${course.title}"...`);
      sendEvent('status', { message: 'Generating mock outline fallback...' });
      cOutline = generateMockCourseData(course.title);
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

    course.modules = moduleIds;
    await course.save();

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

    // Stage 3: Generate detailed lesson content for each chapter one by one
    for (let mIdx = 0; mIdx < savedModules.length; mIdx++) {
      const { doc: moduleDoc, lessonTitles } = savedModules[mIdx];

      console.log(`📦 Generating lessons for module: "${moduleDoc.title}"...`);
      sendEvent('status', { message: `Generating lessons for module: "${moduleDoc.title}"...` });

      const lessonIds = [];

      for (let lIdx = 0; lIdx < lessonTitles.length; lIdx++) {
        const lessonTitle = lessonTitles[lIdx];
        console.log(`  📖 Generating lesson ${mIdx + 1}.${lIdx + 1}: "${lessonTitle}"...`);
        sendEvent('status', { message: `Generating lesson: "${lessonTitle}"...` });

        let lessonDetails;
        if (isRealAI) {
          try {
            const cleanCourse = { title: course.title, description: course.description };
            const cleanModule = { title: moduleDoc.title, lessonTitles: lessonTitles };
            lessonDetails = await generateLessonDetails(cleanCourse, cleanModule, lessonTitle);
          } catch (err) {
            console.error(`  ❌ Failed to generate lesson details for "${lessonTitle}":`, err.message);
          }
        } else {
          // Find the corresponding lesson object in the mock modules
          const mockModule = cOutline.modules?.[mIdx];
          const mockLesson = mockModule?.lessons?.[lIdx];
          if (mockLesson) {
            lessonDetails = mockLesson;
          }
        }

        // Fallback to mock data or templates if generation failed
        if (!lessonDetails) {
          const mockFallbackData = generateMockCourseData(course.title);
          const mockLesson = mockFallbackData.modules?.[mIdx]?.lessons?.[lIdx];
          if (mockLesson) {
            lessonDetails = mockLesson;
          } else {
            lessonDetails = {
              title: lessonTitle,
              objectives: [
                `Understand the core concepts of ${lessonTitle}`,
                `Learn best practices and practical applications`
              ],
              videoSearchQuery: `${lessonTitle} tutorial lecture`,
              content: {
                en: `### Introduction to ${lessonTitle}\n\nThis lesson covers the fundamentals, concepts, and key principles of **${lessonTitle}** as part of the course **${course.title}**.\n\n### Key Takeaways:\n- Understand the architectural role of ${lessonTitle}.\n- Discover best practices for working with this component.\n- Build and configure basic projects successfully.`,
                es: `### Introducción a ${lessonTitle}\n\nEsta lección cubre los fundamentos y conceptos clave de **${lessonTitle}**.`,
                fr: `### Introduction à ${lessonTitle}\n\nEsta lección cubre los fundamentos y conceptos clave de **${lessonTitle}**.`
              },
              script: `Welcome to this video lecture. In this lesson, we will explore the core concepts of ${lessonTitle} and how it fits into the overall architecture.`,
              videoSlide: `Visual slide showing core concepts of ${lessonTitle}`
            };
          }
        }

        // Save Lesson to DB
        let content = lessonDetails?.content;
        if (!content || typeof content !== 'object') {
          content = {
            en: `Detailed content for ${lessonTitle} is currently being updated.`,
            es: `El contenido para ${lessonTitle} se está actualizando.`,
            fr: `Le contenu pour ${lessonTitle} est en cours de mise à jour.`
          };
        } else {
          // Make sure required language keys are present
          if (!content.en) {
            content.en = `Detailed content for ${lessonTitle} is currently being updated.`;
          }
          if (!content.es) {
            content.es = `El contenido para ${lessonTitle} se está actualizando.`;
          }
          if (!content.fr) {
            content.fr = `Le contenu pour ${lessonTitle} est en cours de mise à jour.`;
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
        lessonIds.push(lessonDoc._id);

        // Update module lessons list in DB
        moduleDoc.lessons.push(lessonDoc._id);
        await moduleDoc.save();

        // Stream this generated lesson directly to the client
        sendEvent('lesson', {
          moduleId: moduleDoc._id,
          lesson: lessonDoc
        });
      }
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

