import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';

// Load environment variables
dotenv.config();

// Sample Data from Frontend
const COURSES_DATABASE = [
  {
    title: 'Intro to React Hooks',
    description: 'Learn modern React state and lifecycle management using hooks like useState, useEffect, and custom hooks.',
    resources: [
      { name: 'React_Hooks_Cheat_Sheet.pdf', size: '2.4 MB', type: 'PDF' },
      { name: 'React_State_Exercise_Code.zip', size: '15.8 MB', type: 'ZIP' },
      { name: 'Hooks_Best_Practices_Slide_Deck.pdf', size: '5.1 MB', type: 'PDF' }
    ],
    quizzes: [
      {
        id: 'rh-q1',
        question: 'What version of React introduced Hooks?',
        options: ['v16.0', 'v16.3', 'v16.8', 'v17.0'],
        correctIndex: 2,
        explanation: 'React Hooks were introduced in version 16.8.0, allowing functional components to handle state and side effects.'
      },
      {
        id: 'rh-q2',
        question: 'Which of the following is a rule of React Hooks?',
        options: [
          'Hooks can be called inside loops',
          'Hooks must only be called at the top level of your component',
          'Hooks must be called inside regular JavaScript helper functions',
          'Hooks can be called conditionally'
        ],
        correctIndex: 1,
        explanation: 'React Hooks must only be called at the top level of functional components (not inside loops, conditions, or nested functions) to preserve hook execution order.'
      },
      {
        id: 'rh-q3',
        question: 'What is the purpose of the dependency array in the useEffect hook?',
        options: [
          'To list components that depend on this hook',
          'To declare variables that trigger a re-render of the parent component',
          'To control when the effect function runs based on value changes',
          'To register cleanups for garbage collection'
        ],
        correctIndex: 2,
        explanation: 'The dependency array controls when the effect executes. If empty [], it runs once on mount. If it contains values, it runs when those values change.'
      }
    ],
    modules: [
      {
        title: 'Module 1: Foundations of Hooks',
        lessons: [
          {
            title: '1.1 The Shift to Functional Components',
            content: {
              en: `React Hooks were introduced in version 16.8 to allow functional components to manage state and side effects. Previously, stateful logic required complex Class Components with 'this' bindings and fragmented lifecycle methods like 'componentDidMount'. Functional components with Hooks are cleaner, shorter, and easier to reuse.\n\n### Key Takeaways:\n- No more 'class' syntax or 'this' context bindings.\n- Logic can be grouped by function rather than lifecycle phase.\n- High-performance execution with simpler component trees.`,
              es: `Los Hooks de React se introdujeron en la versión 16.8 para permitir que los componentes funcionales manejen el estado y los efectos secundarios. Anteriormente, la lógica con estado requería componentes de clase complejos con enlaces 'this' y métodos de ciclo de vida fragmentados. Los componentes funcionales con Hooks son más limpios, cortos y fáciles de reutilizar.`,
              fr: `Les React Hooks ont été introduits dans la version 16.8 pour permettre aux composants fonctionnels de gérer l'état et les effets secondaires. Auparavant, la logique nécessitait des composants de classe complexes avec des liaisons 'this' et des méthodes de vie fragmentées.`
            },
            script: 'Welcome to Lesson 1.1. In this video, we will explore why React shifted from class components to functional components and how Hooks revolutionized the way we write React code.',
            videoSlide: 'Why Hooks? Class Components vs Functional Hooks'
          },
          {
            title: '1.2 Managing State with useState',
            content: {
              en: `The 'useState' hook allows you to declare reactive state variables in functional components. It returns a state value and a setter function.\n\n\`\`\`javascript\nconst [count, setCount] = useState(0);\n\`\`\`\nWhenever 'setCount' is called with a new value, React schedules a re-render of the component to reflect the UI updates immediately.`,
              es: `El hook 'useState' le permite declarar variables de estado reactivas en componentes funcionales. Devuelve un valor de estado y una función de configuración.\n\n\`\`\`javascript\nconst [count, setCount] = useState(0);\n\`\`\`\nCada vez que se llama a 'setCount' con un nuevo valor, React programa un renderizado.`,
              fr: `Le hook 'useState' vous permet de déclarer des variables d'état réactives dans des composants fonctionnels. Il renvoie une valeur d'état et une fonction setter.\n\n\`\`\`javascript\nconst [count, setCount] = useState(0);\n\`\`\`\nChaque fois que 'setCount' est appelé, React planifie un rendu.`
            },
            script: 'Let’s dive into useState. This hook is your bread and butter for handling dynamic data, click events, and state mutations inside functional React components.',
            videoSlide: 'Declaring & Updating State: const [state, setState] = useState(init)'
          }
        ]
      },
      {
        title: 'Module 2: Handling Side Effects',
        lessons: [
          {
            title: '2.1 Mastering the useEffect Hook',
            content: {
              en: `Side effects include fetching data, manually updating the DOM, subscribing to events, and timers. The 'useEffect' hook runs code after the component renders.\n\n### Dependency Array Rules:\n1. **No array**: Runs after every single render.\n2. **Empty array []**: Runs exactly once on mount and cleanups on unmount.\n3. **Variables inside [deps]**: Runs whenever any dependency changes.`,
              es: `Los efectos secundarios incluyen la recuperación de datos, la actualización del DOM, las suscripciones y los temporizadores. El hook 'useEffect' ejecuta código después del renderizado.`,
              fr: `Les effets secondaires comprennent la récupération de données, la mise à jour manuelle du DOM, les abonnements et les minuteurs. Le hook 'useEffect' s'exécute après le rendu.`
            },
            script: 'Side effects are crucial for fetching API data and listening to scroll actions. Today, you will learn how to configure the dependency array in useEffect to avoid infinite loops.',
            videoSlide: 'useEffect: Handling Side Effects & The Dependency Array'
          }
        ]
      }
    ]
  },
  {
    title: 'Basics of Copyright Law',
    description: 'An overview of intellectual property law, understanding ownership, original works, fair use exceptions, and registration.',
    resources: [
      { name: 'Copyright_Fair_Use_Guide.pdf', size: '1.8 MB', type: 'PDF' },
      { name: 'IP_Law_Statutory_Definitions.pdf', size: '3.2 MB', type: 'PDF' }
    ],
    quizzes: [
      {
        id: 'cr-q1',
        question: 'At what point does copyright protection begin for an original work?',
        options: [
          'Automatically when the work is fixed in a tangible medium',
          'Once it is formally registered with the national copyright office',
          'When it is first published or distributed online',
          'Only after the creator attaches a © symbol'
        ],
        correctIndex: 0,
        explanation: 'Copyright protection is automatic and starts the moment an original work is fixed in a tangible medium of expression (written down, recorded, drawn, etc.).'
      },
      {
        id: 'cr-q2',
        question: 'Which of the following describes the "Idea-Expression Dichotomy"?',
        options: [
          'Ideas and expressions receive equal legal protections',
          'Copyright protects the expression of an idea, not the idea itself',
          'Copyright protects concepts, while patents protect expressions',
          'Expressions are free to copy, but ideas require licensing'
        ],
        correctIndex: 1,
        explanation: 'Copyright law protects the specific expression of an idea (e.g. the text of a novel) but never the underlying idea or concept itself.'
      },
      {
        id: 'cr-q3',
        question: 'Which factor is NOT analyzed under the Fair Use doctrine?',
        options: [
          'The purpose and character of the use',
          'The net worth of the copyright creator',
          'The amount and substantiality of the portion used',
          'The effect of the use upon the potential market value'
        ],
        correctIndex: 1,
        explanation: 'Fair Use analyzes four factors: purpose/character of use, nature of work, amount used, and market effect. The creator\'s net worth is completely irrelevant.'
      }
    ],
    modules: [
      {
        title: 'Module 1: Concepts of Intellectual Property',
        lessons: [
          {
            title: '1.1 What is Copyright?',
            content: {
              en: `Copyright is a form of intellectual property law that protects original works of authorship, including literary, dramatic, musical, and artistic works. It grants creators exclusive rights to reproduce, distribute, perform, and adapt their work. Protection begins automatically the moment the work is fixed in a tangible medium of expression.`,
              es: `El derecho de autor es una ley de propiedad intelectual que protege las obras originales de autoría, incluidas las obras literarias, dramáticas y artísticas.`,
              fr: `Le droit d'auteur est une forme de droit de la propriété intellectuelle qui protège les œuvres originales de l'esprit, y compris les œuvres littéraires et artistiques.`
            },
            script: 'Welcome to Basics of Copyright. In this introduction, we explain what copyright protection is, what it covers, and the difference between copyright, trademarks, and patents.',
            videoSlide: 'Copyright Protection: Original Expression Fixed in Tangible Media'
          },
          {
            title: '1.2 Ideas vs. Expression',
            content: {
              en: `A fundamental principle of copyright law is that copyright protects the expression of an idea, not the idea itself. For example, you cannot copyright the idea of a wizard school, but you can copyright the specific characters, dialogue, and text of a book written about a wizard school.`,
              es: `Un principio fundamental de la ley de derechos de autor es que protege la expresión de una idea, no la idea misma.`,
              fr: `Un principe fondamental du droit d'auteur est qu'il protège l'expression d'une idée, non l'idée elle-même.`
            },
            script: 'Let’s look at the crucial distinction between ideas and expressions. You can write your own story about space pirates, but you can’t copy the exact script of Star Wars.',
            videoSlide: 'Idea-Expression Dichotomy: Protecting the Form, Not the Concept'
          }
        ]
      },
      {
        title: 'Module 2: Fair Use Doctrine',
        lessons: [
          {
            title: '2.1 The Four Factors of Fair Use',
            content: {
              en: `Fair use allows limited use of copyrighted material without permission for purposes like criticism, comment, news reporting, teaching, or research. The four factors are:\n1. Purpose and character of the use (transformative vs. commercial).\n2. Nature of the copyrighted work.\n3. Amount and substantiality of the portion used.\n4. Effect of the use upon the potential market value.`,
              es: `El uso legítimo permite el uso limitado de material con derechos de autor sin permiso. Los cuatro factores analizan el propósito, la naturaleza, la cantidad y el efecto del mercado.`,
              fr: `L'usage équitable permet une utilisation limitée d'œuvres protégées sans autorisation. Quatre facteurs guident cette exception.`
            },
            script: 'Today we discuss Fair Use. We break down the four factors legal departments analyze to see if your YouTube video, parody, or article complies with copyright exceptions.',
            videoSlide: 'The Four Factors of Fair Use: Balancing Creators vs Public Interest'
          }
        ]
      }
    ]
  },
  {
    title: 'Quantum Mechanics for Beginners',
    description: 'An intuitive introduction to subatomic physics, wave-particle duality, superposition, and quantum entanglement.',
    resources: [
      { name: 'Quantum_Physics_Cheat_Sheet.pdf', size: '4.2 MB', type: 'PDF' },
      { name: 'Double_Slit_Simulation_Software.zip', size: '28.1 MB', type: 'ZIP' }
    ],
    quizzes: [
      {
        id: 'qm-q1',
        question: 'What does wave-particle duality imply about matter and light?',
        options: [
          'They always behave like solid billard balls',
          'They are strictly waves and never act like particles',
          'They exhibit properties of both waves and particles depending on measurement',
          'They have no physical reality until they travel faster than light'
        ],
        correctIndex: 2,
        explanation: 'Matter and light show wave-like properties (e.g., interference) and particle-like properties (e.g., localized impacts) depending on the observation setup.'
      },
      {
        id: 'qm-q2',
        question: 'What is quantum superposition?',
        options: [
          'A system existing in a combination of multiple states simultaneously until measured',
          'The speed at which quantum particles rotate around an orbit',
          'The state of two particles sharing connected properties across distance',
          'When subatomic particles crash into each other to form heat'
        ],
        correctIndex: 0,
        explanation: 'Superposition means a quantum state exists as a linear combination of all possible outcomes until an observation collapses it into a single state.'
      }
    ],
    modules: [
      {
        title: 'Module 1: The Quantum Revolution',
        lessons: [
          {
            title: '1.1 Wave-Particle Duality',
            content: {
              en: `Light and matter exhibit properties of both waves and particles depending on how they are measured. The famous Double-Slit Experiment proved that electrons, traditionally thought of as solid particles, create interference patterns like waves when not observed.`,
              es: `La luz y la materia muestran propiedades tanto de ondas como de partículas, según cómo se midan.`,
              fr: `La lumière et la matière présentent des propriétés d'ondes et de particules, selon la méthode de mesure.`
            },
            script: 'Welcome to Quantum Mechanics. Today, we witness the strange nature of subatomic reality, where particles act like ripples on a pond when we aren’t looking.',
            videoSlide: 'Wave-Particle Duality & The Double-Slit Experiment'
          },
          {
            title: '1.2 Superposition & Schrödinger’s Cat',
            content: {
              en: `Quantum systems exist in a combination of multiple states simultaneously until a measurement occurs. Schrödinger’s Cat is a thought experiment showing the paradox of a cat being both alive and dead in a sealed box until observed.`,
              es: `Los sistemas cuánticos existen en una combinación de múltiples estados simultáneamente hasta que se realiza una medición.`,
              fr: `Les systèmes quantiques existent dans une combinaison de plusieurs états simultanément jusqu'à la mesure.`
            },
            script: 'Let’s discuss Superposition. What does it mean for an electron to be in multiple places at once, and how did Schrödinger criticize this view with a cat in a box?',
            videoSlide: 'Superposition: Living in Probabilities Until Observed'
          }
        ]
      }
    ]
  },
  {
    title: 'Acoustic Guitar 101',
    description: 'A practical roadmap for starting acoustic guitar: tuning, essential chord shapes, and rhythmic strumming patterns.',
    resources: [
      { name: 'Guitar_Chords_Basic_Chart.pdf', size: '3.6 MB', type: 'PDF' },
      { name: 'Rhythm_Strumming_Patterns_Tracks.zip', size: '12.4 MB', type: 'ZIP' }
    ],
    quizzes: [
      {
        id: 'ag-q1',
        question: 'What is the standard tuning of an acoustic guitar, from 6th (thickest) string to 1st (thinnest)?',
        options: ['E-A-D-G-B-E', 'D-A-D-G-B-E', 'E-B-G-D-A-E', 'E-A-D-G-C-F'],
        correctIndex: 0,
        explanation: 'Standard acoustic guitar tuning is E-A-D-G-B-E. A popular mnemonic is "Eddie Ate Dynamite, Good Bye Eddie".'
      },
      {
        id: 'ag-q2',
        question: 'Which part of the guitar contains the frets?',
        options: ['The Soundboard', 'The Bridge', 'The Neck (Fretboard)', 'The Headstock'],
        correctIndex: 2,
        explanation: 'Frets are metal strips placed along the neck (fretboard) of the guitar, allowing the guitarist to change the pitch of the strings.'
      }
    ],
    modules: [
      {
        title: 'Module 1: The Anatomy & Tuning',
        lessons: [
          {
            title: '1.1 Anatomy of the Acoustic Guitar',
            content: {
              en: `Understanding your instrument is key. The acoustic guitar consists of the body (soundboard, soundhole, bridge), the neck (fretboard, frets), and the headstock (tuning pegs). Knowing how these elements amplify vibration helps you control your tone.`,
              es: `Comprender su instrumento es clave. La guitarra acústica consta del cuerpo, el mástil y el clavijero.`,
              fr: `Comprendre votre instrument est essentiel. La guitare acoustique se compose de la caisse, du manche et de la tête.`
            },
            script: 'Hey everyone, welcome to Guitar 101. Today we are walking through the physical parts of the acoustic guitar and showing you how it amplifies string frequencies.',
            videoSlide: 'Guitar Anatomy: Soundboard, Frets, and Mechanical Tuning'
          },
          {
            title: '1.2 Standard Tuning (EADGBE)',
            content: {
              en: `Acoustic guitars are standardly tuned to E-A-D-G-B-E from the thickest string (6th) to the thinnest string (1st). Common mnemonics include "Eddie Ate Dynamite, Good Bye Eddie". Constant tuning training builds pitching skills.`,
              es: `Las guitarras acústicas se afinan de forma estándar a Mi-La-Re-Sol-Si-Mi (EADGBE).`,
              fr: `Les guitarras acoustiques sont généralement accordées en Mi-La-Ré-Sol-Si-Mi (EADGBE).`
            },
            script: 'Let’s tune up. Grab your tuner, and we will tune each of the six strings to E-A-D-G-B-E using our machine heads step by step.',
            videoSlide: 'Standard Tuning Mnemonic: Eddie Ate Dynamite, Good Bye Eddie'
          }
        ]
      }
    ]
  }
];

const seedDB = async () => {
  try {
    // 1. Establish DB Connection
    await connectDB();

    console.log('🧹 Clearing existing collections...');
    await User.deleteMany({});
    await Course.deleteMany({});
    await Module.deleteMany({});
    await Lesson.deleteMany({});
    console.log('✅ Collections cleared.');

    // 2. Create Instructor User
    console.log('👤 Creating default instructor user...');
    const instructor = await User.create({
      name: 'Dr. Jane Doe',
      email: 'instructor@gencourse.ai',
      picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      auth0Sub: 'auth0|instructor_jane_doe',
      role: 'instructor'
    });
    console.log(`✅ Instructor user created: ${instructor.name} (${instructor._id})`);

    // 3. Populate Courses, Modules, and Lessons
    console.log('📚 Seeding courses database...');
    for (const cData of COURSES_DATABASE) {
      console.log(`\n📖 Processing Course: "${cData.title}"`);

      // Create Course
      const course = new Course({
        title: cData.title,
        description: cData.description,
        creator: instructor._id,
        resources: cData.resources,
        quizzes: cData.quizzes,
        modules: []
      });

      // Save course initially to get id
      await course.save();

      const moduleIds = [];

      for (let mIdx = 0; mIdx < cData.modules.length; mIdx++) {
        const mData = cData.modules[mIdx];
        console.log(`  📦 Creating Module: "${mData.title}"`);

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
          console.log(`    📄 Creating Lesson: "${lData.title}"`);

          const lessonDoc = new Lesson({
            moduleId: moduleDoc._id,
            title: lData.title,
            content: lData.content,
            script: lData.script,
            videoSlide: lData.videoSlide,
            order: lIdx
          });

          await lessonDoc.save();
          lessonIds.push(lessonDoc._id);
        }

        // Link lessons back to Module
        moduleDoc.lessons = lessonIds;
        await moduleDoc.save();

        moduleIds.push(moduleDoc._id);
      }

      // Link modules back to Course
      course.modules = moduleIds;
      await course.save();

      // Enroll instructor as proof-of-concept
      instructor.enrolledCourses.push(course._id);
      await instructor.save();

      console.log(`✅ Seeded Course "${course.title}" successfully with ${course.modules.length} modules!`);
    }

    console.log('\n🎉 Database Seeding Complete!');
    process.exit(0);
  } catch (error) {
    console.error(`❌ Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedDB();
