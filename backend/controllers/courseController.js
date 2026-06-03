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

    // Check if course already exists (case-insensitive check)
    const existingCourse = await Course.findOne({
      title: { $regex: new RegExp(`^${trimmedTitle}$`, 'i') }
    }).populate({
      path: 'modules',
      options: { sort: { order: 1 } },
      populate: {
        path: 'lessons',
        options: { sort: { order: 1 } }
      }
    });

    if (existingCourse) {
      console.log(`📚 Found existing course matching "${trimmedTitle}": ${existingCourse._id}`);
      return res.json(existingCourse);
    }

    let cData;
    let isRealAI = false;

    if (process.env.OLLAMA_BASE_URL || process.env.GEMINI_API_KEY) {
      try {
        console.log(`🤖 Compiling curriculum outline for "${trimmedTitle}" via LLM...`);
        const outline = await generateCourseOutline(trimmedTitle);
        console.log(`✅ Outline returned: "${outline.title}" with ${outline.modules?.length} modules.`);

        const modulesData = [];
        for (let mIdx = 0; mIdx < outline.modules.length; mIdx++) {
          const mod = outline.modules[mIdx];
          console.log(`  📦 Module: "${mod.title}" has ${mod.lessonTitles?.length} lessons.`);

          const lessonsList = [];
          for (let lIdx = 0; lIdx < mod.lessonTitles.length; lIdx++) {
            const lessonTitle = mod.lessonTitles[lIdx];
            lessonsList.push({
              title: lessonTitle,
              objectives: [
                `Understand the core concepts of ${lessonTitle}`,
                `Learn best practices and practical applications`
              ],
              videoSearchQuery: `${lessonTitle} tutorial lecture`,
              content: {
                en: `### Introduction to ${lessonTitle}\n\nThis lesson covers the fundamentals, concepts, and key principles of **${lessonTitle}** as part of the course **${outline.title}**.\n\n### Key Takeaways:\n- Understand the architectural role of ${lessonTitle}.\n- Discover best practices for working with this component.\n- Build and configure basic projects successfully.`,
                es: `### Introducción a ${lessonTitle}\n\nEsta lección cubre los fundamentos y conceptos clave de **${lessonTitle}**.`,
                fr: `### Introduction à ${lessonTitle}\n\nCette leçon couvre les principes fondamentaux de **${lessonTitle}**.`
              },
              script: `Welcome to this video lecture. In this lesson, we will explore the core concepts of ${lessonTitle} and how it fits into the overall architecture.`,
              videoSlide: `Visual slide showing core concepts of ${lessonTitle}`
            });
          }

          modulesData.push({
            title: mod.title,
            lessons: lessonsList
          });
        }

        cData = {
          title: outline.title || trimmedTitle,
          description: outline.description || `A dynamic course on ${trimmedTitle}.`,
          resources: outline.resources || [
            { name: `${trimmedTitle.replace(/\s+/g, '_')}_Guide.pdf`, size: '2.5 MB', type: 'PDF' }
          ],
          quizzes: outline.quizzes || [],
          modules: modulesData
        };

        console.log(`💾 Saving generated course structure to DB...`);
        isRealAI = true;
      } catch (err) {
        console.error('❌ Failed to generate course via LLM, falling back to mock data:', err.message);
      }
    }

    if (!isRealAI) {
      console.log(`🤖 Compiling curriculum outline for "${trimmedTitle}" (MOCK FALLBACK)...`);
      cData = generateMockCourseData(trimmedTitle);
    }

    // Save Course structure
    const course = new Course({
      title: cData.title,
      description: cData.description,
      resources: cData.resources,
      quizzes: cData.quizzes,
      modules: []
    });

    await course.save();

    const moduleIds = [];

    // Create Modules and lessons recursively
    for (let mIdx = 0; mIdx < cData.modules.length; mIdx++) {
      const mData = cData.modules[mIdx];
      const moduleDoc = new Module({
        courseId: course._id,
        title: mData.title,
        order: mIdx,
        lessons: []
      });

      await moduleDoc.save();

      const lessonIds = [];
      for (let lIdx = 0; lIdx < mData.lessons.length; lIdx++) {
        const lData = mData.lessons[lIdx];
        const lessonDoc = new Lesson({
          moduleId: moduleDoc._id,
          title: lData.title,
          content: lData.content,
          objectives: lData.objectives || [],
          videoSearchQuery: lData.videoSearchQuery || '',
          script: lData.script,
          videoSlide: lData.videoSlide,
          order: lIdx
        });

        await lessonDoc.save();
        lessonIds.push(lessonDoc._id);
      }

      moduleDoc.lessons = lessonIds;
      await moduleDoc.save();
      moduleIds.push(moduleDoc._id);
    }

    course.modules = moduleIds;
    await course.save();

    // Retrieve fully populated newly created course
    const populatedCourse = await Course.findById(course._id).populate({
      path: 'modules',
      options: { sort: { order: 1 } },
      populate: {
        path: 'lessons',
        options: { sort: { order: 1 } }
      }
    });

    console.log(`✅ Saved new course matching "${trimmedTitle}" in database.`);
    res.status(201).json(populatedCourse);
  } catch (error) {
    next(error);
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

