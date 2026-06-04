import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import {
  BookOpen,
  Download,
  CheckCircle,
  Terminal,
  Cpu,
  Globe,
  Sliders,
  FileText,
  Search,
  Map,
  HelpCircle,
  Layers,
  Sparkles,
  Check,
} from 'lucide-react'
import { useGenerationStore } from '../store/useGenerationStore'

interface PremiumInteractiveSimulatorProps {
  prompt: string
  setPrompt: (val: string) => void
  minimal?: boolean
  hideInput?: boolean
  onSimulationComplete?: () => void
}

// Sample Data Structure
interface Lesson {
  _id?: string
  isPlaceholder?: boolean
  title: string
  content: {
    en: string
    es: string
    fr: string
  }
  script: string
  videoSlide: string
}

interface Module {
  _id?: string
  title: string
  lessons: Lesson[]
}

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface CourseData {
  _id?: string
  title: string
  description: string
  modules: Module[]
  resources: { name: string; size: string; type: string }[]
  quizzes: QuizQuestion[]
}

export const COURSES_DATABASE: Record<string, CourseData> = {
  'Intro to React Hooks': {
    title: 'Intro to React Hooks',
    description: 'Learn modern React state and lifecycle management using hooks like useState, useEffect, and custom hooks.',
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
    ],
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
    ]
  },
  'Basics of Copyright Law': {
    title: 'Basics of Copyright Law',
    description: 'An overview of intellectual property law, understanding ownership, original works, fair use exceptions, and registration.',
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
    ],
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
    ]
  },
  'Quantum Mechanics for Beginners': {
    title: 'Quantum Mechanics for Beginners',
    description: 'An intuitive introduction to subatomic physics, wave-particle duality, superposition, and quantum entanglement.',
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
    ],
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
    ]
  },
  'Acoustic Guitar 101': {
    title: 'Acoustic Guitar 101',
    description: 'A practical roadmap for starting acoustic guitar: tuning, essential chord shapes, and rhythmic strumming patterns.',
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
    ],
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
    ]
  }
}

const QUICK_SUGGESTIONS = [
  { topic: 'Intro to React Hooks', label: 'React Hooks', icon: '⚛️' },
  { topic: 'Basics of Copyright Law', label: 'Copyright Law', icon: '⚖️' },
  { topic: 'Quantum Mechanics for Beginners', label: 'Quantum Mechanics', icon: '⚛️' },
  { topic: 'Acoustic Guitar 101', label: 'Acoustic Guitar', icon: '🎸' }
]

export default function PremiumInteractiveSimulator({
  prompt,
  setPrompt,
  minimal = false,
  hideInput = false,
  onSimulationComplete
}: PremiumInteractiveSimulatorProps) {
  const {
    isGenerating: globalIsGenerating,
    progress: globalProgress,
    logs: globalLogs,
    currentStepIndex: globalCurrentStepIndex,
    activeCourse: globalActiveCourse,
    startGeneration
  } = useGenerationStore()

  const [localActiveCourse, setLocalActiveCourse] = useState<CourseData | null>(null)
  const isGenerating = hideInput ? false : globalIsGenerating
  const progress = hideInput ? 0 : globalProgress
  const logs = hideInput ? [] : globalLogs
  const currentStepIndex = hideInput ? -1 : globalCurrentStepIndex
  const activeCourse = hideInput ? localActiveCourse : globalActiveCourse

  const [activeModuleIndex, setActiveModuleIndex] = useState(0)
  const [activeLessonIndex, setActiveLessonIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<'content' | 'quiz' | 'downloads'>('content')
  const [language, setLanguage] = useState<'en' | 'es' | 'fr'>('en')

  // Video player simulation
  const [isPlayingVideo, setIsPlayingVideo] = useState(false)
  const [, setVideoProgress] = useState(0)
  const videoTimerRef = useRef<any>(null)

  // Interactive tracking states
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({})
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({})

  // Quiz interaction states
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({})
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({})

  // Telemetry Console Ref
  const logsContainerRef = useRef<HTMLDivElement>(null)

  const steps = [
    { title: 'Topic Analyzer', desc: 'Analyzing keywords, target audience & goals', icon: Search },
    { title: 'Curriculum Planner', desc: 'Generating structured modules and outline', icon: Map },
    { title: 'Lesson Generator', desc: 'Synthesizing textbook chapters & scripts', icon: BookOpen },
    { title: 'Quiz Builder', desc: 'Building concept reviews & quizzes', icon: HelpCircle },
    { title: 'Publishing Layer', desc: 'Compiling localized pages & PDFs', icon: Layers }
  ]

  // Auto scroll telemetry logs
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight
    }
  }, [logs])

  // Handle video playback
  useEffect(() => {
    if (isPlayingVideo) {
      videoTimerRef.current = setInterval(() => {
        setVideoProgress((prev) => {
          if (prev >= 100) {
            setIsPlayingVideo(false)
            return 0
          }
          return prev + 2
        })
      }, 150)
    } else {
      if (videoTimerRef.current) clearInterval(videoTimerRef.current)
    }

    return () => {
      if (videoTimerRef.current) clearInterval(videoTimerRef.current)
    }
  }, [isPlayingVideo])

  const handleManualTrigger = (e: React.FormEvent) => {
    e.preventDefault()
    startGeneration(prompt || 'Intro to React Hooks', onSimulationComplete)
  }

  // Load default/selected course matching prompt on page load or when prompt shifts
  useEffect(() => {
    let active = true
    const loadCourseData = async () => {
      // Only auto-load if in player mode (hideInput is true)
      if (!isGenerating && prompt && hideInput) {
        try {
          // Fetch existing courses and match by title (case-insensitive)
          const response = await axios.get('http://localhost:5000/api/courses')
          const matchedCourse = response.data.find(
            (c: any) => c.title.toLowerCase() === prompt.toLowerCase()
          )

          if (matchedCourse) {
            if (active) {
              setLocalActiveCourse(matchedCourse)
            }
          } else {
            console.warn(`Course matching "${prompt}" not found in DB, falling back to local preset.`)
            const matchingCourse = COURSES_DATABASE[prompt] || COURSES_DATABASE['Intro to React Hooks']
            if (active) {
              setLocalActiveCourse({
                ...matchingCourse,
                title: prompt
              })
            }
          }
        } catch (error) {
          console.error('Error loading course from database:', error)
          const matchingCourse = COURSES_DATABASE[prompt] || COURSES_DATABASE['Intro to React Hooks']
          if (active) {
            setLocalActiveCourse({
              ...matchingCourse,
              title: prompt
            })
          }
        }
      }
    }
    loadCourseData()
    return () => {
      active = false
    }
  }, [prompt, hideInput])

  const currentLesson = activeCourse?.modules?.[activeModuleIndex]?.lessons?.[activeLessonIndex]
  const lessonKey = activeCourse ? `${activeCourse.title}-${activeModuleIndex}-${activeLessonIndex}` : ''
  const isLessonDone = completedLessons[lessonKey]

  const formatLogLine = (line: string) => {
    if (!line || typeof line !== 'string') return <span className="text-gray-400">Processing...</span>
    if (line.startsWith('[ANALYZE]')) {
      return (
        <span className="text-gray-400">
          <span className="text-cyan-400 font-semibold mr-1.5">[ANALYZE]</span>
          {line.replace('[ANALYZE]', '')}
        </span>
      )
    }
    if (line.startsWith('[PLANNER]')) {
      return (
        <span className="text-gray-400">
          <span className="text-purple-400 font-semibold mr-1.5">[PLANNER]</span>
          {line.replace('[PLANNER]', '')}
        </span>
      )
    }
    if (line.startsWith('[LESSON-GEN]')) {
      return (
        <span className="text-gray-400">
          <span className="text-pink-400 font-semibold mr-1.5">[LESSON-GEN]</span>
          {line.replace('[LESSON-GEN]', '')}
        </span>
      )
    }
    if (line.startsWith('[QUIZ-BUILDER]')) {
      return (
        <span className="text-gray-400">
          <span className="text-yellow-400 font-semibold mr-1.5">[QUIZ-BUILDER]</span>
          {line.replace('[QUIZ-BUILDER]', '')}
        </span>
      )
    }
    if (line.startsWith('[PUBLISH-LAYER]')) {
      return (
        <span className="text-gray-400">
          <span className="text-orange-400 font-semibold mr-1.5">[PUBLISH-LAYER]</span>
          {line.replace('[PUBLISH-LAYER]', '')}
        </span>
      )
    }
    if (line.startsWith('[SYSTEM]')) {
      return (
        <span className="text-emerald-400 font-semibold shadow-emerald-500/10 drop-shadow-sm">
          {line}
        </span>
      )
    }
    return <span className="text-gray-400">{line}</span>
  }

  const parseInlineMarkdown = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-200">$1</em>')
      .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-cyan-300">$1</code>')
  }

  const renderFormattedContent = (contentString: string) => {
    const parts = contentString.split('\n')
    let isInsideCodeBlock = false
    let codeContent: string[] = []

    return parts.map((part, index) => {
      // Check if it's code block start/end
      if (part.trim().startsWith('```')) {
        if (isInsideCodeBlock) {
          isInsideCodeBlock = false
          const codeText = codeContent.join('\n')
          codeContent = []
          return (
            <div key={index} className="my-5 rounded-xl border border-white/10 bg-black/60 overflow-hidden font-mono text-xs shadow-2xl">
              <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#ff5f56]"></span>
                  <span className="w-2 h-2 rounded-full bg-[#ffbd2e]"></span>
                  <span className="w-2 h-2 rounded-full bg-[#27c93f]"></span>
                </div>
                <span className="text-[10px] text-gray-500 font-medium font-sans">JavaScript</span>
              </div>
              <div className="p-4 overflow-x-auto text-gray-300 leading-relaxed font-mono whitespace-pre text-xs">
                {codeText.split('\n').map((line, lIdx) => {
                  const styledLine = line.replace(
                    /('[^']*'|`[^`]*`|"[^"]*")|\b(const|let|var|import|from|return)\b|\b(useState|useEffect|useRef|setCount|useCallback|useMemo)\b|\b(\d+)\b/g,
                    (match, pStr, pKey, pHook, pNum) => {
                      if (pStr) return `<span class="text-cyan-400">${pStr}</span>`;
                      if (pKey) return `<span class="text-purple-400 font-semibold">${pKey}</span>`;
                      if (pHook) return `<span class="text-yellow-400 font-medium">${pHook}</span>`;
                      if (pNum) return `<span class="text-pink-400">${pNum}</span>`;
                      return match;
                    }
                  )
                  return (
                    <div key={lIdx} dangerouslySetInnerHTML={{ __html: styledLine || '&nbsp;' }} />
                  )
                })}
              </div>
            </div>
          )
        } else {
          isInsideCodeBlock = true
          return null
        }
      }

      if (isInsideCodeBlock) {
        codeContent.push(part)
        return null
      }

      // Headers
      if (part.trim().startsWith('###')) {
        return (
          <h5 key={index} className="text-white text-sm font-bold font-display mt-5 mb-2.5 flex items-center gap-2" dangerouslySetInnerHTML={{ __html: `<span class="w-1 h-3.5 rounded-full bg-purple-primary shrink-0"></span>${parseInlineMarkdown(part.replace('###', '').trim())}` }} />
        )
      }
      if (part.trim().startsWith('##')) {
        return (
          <h4 key={index} className="text-white text-base font-bold font-display mt-6 mb-3 flex items-center gap-2" dangerouslySetInnerHTML={{ __html: `<span class="w-1 h-4 rounded-full bg-cyan-primary shrink-0"></span>${parseInlineMarkdown(part.replace('##', '').trim())}` }} />
        )
      }
      if (part.trim().startsWith('#')) {
        return (
          <h3 key={index} className="text-white text-lg font-bold font-display mt-7 mb-4" dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(part.replace('#', '').trim()) }} />
        )
      }

      // Bullet items
      if (part.trim().startsWith('-')) {
        return (
          <div key={index} className="flex items-start gap-2 my-2 pl-1 text-gray-300 text-xs">
            <Check className="w-3.5 h-3.5 text-cyan-primary shrink-0 mt-0.5" />
            <span dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(part.replace('-', '').trim()) }} />
          </div>
        )
      }

      // Numbered list items
      if (/^\d+\.\s/.test(part.trim())) {
        const number = part.match(/^\d+/)?.[0]
        const text = part.replace(/^\d+\.\s/, '').trim()
        return (
          <div key={index} className="flex items-start gap-2 my-2 pl-1 text-gray-300 text-xs">
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-purple-primary/20 text-purple-300 text-[9px] font-bold shrink-0 mt-0.5">
              {number}
            </span>
            <span dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(text) }} />
          </div>
        )
      }

      // Normal text paragraphs
      if (part.trim() === '') return null
      return (
        <p key={index} className="my-2.5 text-gray-300 leading-relaxed font-sans text-xs" dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(part) }} />
      )
    })
  }



  const startDownload = (name: string) => {
    if (downloadProgress[name] !== undefined) return

    setDownloadProgress(prev => ({ ...prev, [name]: 0 }))

    let currentProgress = 0
    const timer = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 15) + 5
      if (currentProgress >= 100) {
        clearInterval(timer)
        setDownloadProgress(prev => ({ ...prev, [name]: 100 }))

        setTimeout(() => {
          setDownloadProgress(prev => {
            const next = { ...prev }
            delete next[name]
            return next
          })
        }, 3000)
      }
    }, 150)
  }

  return (
    <section id="demo" className={minimal ? 'relative z-10 w-full' : 'py-24 bg-[#030014] relative'}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes soundwave {
          0%, 100% { height: 4px; }
          50% { height: 20px; }
        }
        .soundwave-bar {
          animation: soundwave 1.2s ease-in-out infinite;
        }
      `}} />
      {!minimal && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(124,58,237,0.08),transparent_50%)] pointer-events-none"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.08),transparent_50%)] pointer-events-none"></div>
        </>
      )}

      <div className={minimal ? 'w-full' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'}>
        {!minimal && (
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl md:text-5xl text-gradient-purple-cyan mb-4">
              Premium Generator Workspace
            </h2>
            <p className="font-sans text-gray-400 text-lg max-w-2xl mx-auto">
              Enter a custom topic and watch our AI pipeline generate lessons, scripts, and multi-language worksheets in real-time.
            </p>
          </div>
        )}

        {/* Input Bar inside workspace */}
        {!hideInput && (
          <div className="max-w-xl mx-auto mb-12">
            <form onSubmit={handleManualTrigger} className="flex gap-2 p-1.5 rounded-full bg-white/2 border border-white/8 backdrop-blur-md focus-within:border-purple-primary/50 focus-within:shadow-[0_0_20px_rgba(124,58,237,0.15)] transition-all duration-300">
              <div className="flex-1 flex items-center pl-3">
                <Search className="w-4 h-4 text-gray-500 mr-2 shrink-0" />
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Intro to React Hooks"
                  className="w-full bg-transparent border-none text-white text-sm focus:outline-none placeholder-gray-500"
                  disabled={isGenerating}
                />
              </div>
              <button
                type="submit"
                disabled={isGenerating}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-primary to-cyan-primary hover:from-purple-600 hover:to-cyan-500 disabled:opacity-50 text-white text-xs font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-[0_4px_12px_rgba(124,58,237,0.25)] hover:shadow-[0_4px_20px_rgba(124,58,237,0.4)] btn-glow"
              >
                {isGenerating ? (
                  <>
                    <span>Generating...</span>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  </>
                ) : (
                  <>
                    <span>Generate</span>
                    <Cpu className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Quick suggest chips */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider self-center mr-1">
                Suggested Topics:
              </span>
              {QUICK_SUGGESTIONS.map((sug) => {
                const isSelected = prompt === sug.topic
                return (
                  <button
                    key={sug.topic}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => {
                      setPrompt(sug.topic)
                      startGeneration(sug.topic, onSimulationComplete)
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-1.5 border cursor-pointer ${isSelected
                        ? 'bg-purple-primary/20 border-purple-primary/40 text-purple-300 shadow-[0_0_10px_rgba(124,58,237,0.15)]'
                        : 'bg-white/2 hover:bg-white/5 border-white/5 hover:border-white/10 text-gray-400 hover:text-white'
                      }`}
                  >
                    <span>{sug.icon}</span>
                    <span>{sug.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Horizontal Progress Pipeline */}
        {!hideInput && (
          <div className="mb-8">
            <div className="glass-panel rounded-2xl p-4 border border-white/10 bg-black/40 backdrop-blur-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 shrink-0">
                  <Sliders className="w-5 h-5 text-purple-primary" />
                  <h3 className="font-display text-xs font-bold text-white uppercase tracking-wider">
                    Pipeline Workflow
                  </h3>
                </div>

                <div className="flex-1 flex flex-wrap items-center justify-center md:justify-end gap-x-4 gap-y-2 md:gap-x-6 lg:gap-x-8">
                  {steps.map((step, idx) => {
                    const isDone = currentStepIndex > idx
                    const isActive = currentStepIndex === idx
                    const StepIcon = step.icon

                    return (
                      <div key={step.title} className="flex items-center gap-2 group">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all duration-300 ${isDone
                              ? 'bg-cyan-primary/20 border-cyan-primary text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                              : isActive
                                ? 'bg-purple-primary/20 border-purple-primary text-purple-300 shadow-[0_0_8px_rgba(124,58,237,0.3)] animate-pulse'
                                : 'bg-white/2 border-white/5 text-gray-500'
                            }`}
                        >
                          {isDone ? (
                            <Check className="w-3.5 h-3.5 text-cyan-400" />
                          ) : (
                            <StepIcon className={`w-3.5 h-3.5 ${isActive ? 'animate-pulse text-purple-400' : 'text-gray-500'}`} />
                          )}
                        </div>

                        <div>
                          <h4 className={`text-xs font-semibold ${isActive ? 'text-white font-bold' : isDone ? 'text-gray-300' : 'text-gray-500'}`}>
                            {step.title}
                          </h4>
                        </div>

                        {idx !== steps.length - 1 && (
                          <div className="hidden sm:block text-gray-700 font-bold text-[10px] pl-2 select-none">
                            ➔
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Progress bar */}
              {isGenerating && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1.5">
                    <span>Compiling curriculum nodes...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-primary to-cyan-primary h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Work Grid */}
        <div className="grid grid-cols-1 gap-8 items-stretch">

          {/* Right Column: Portal Course Viewer */}
          <div className="col-span-1">
            {isGenerating && !activeCourse ? (
              <div className="glass-panel rounded-3xl p-12 border-white/10 text-center h-full min-h-[620px] flex flex-col justify-center items-center bg-black/40 relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
                <div className="absolute w-48 h-48 bg-purple-primary/10 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>

                <div className="relative mb-8">
                  <div className="w-20 h-20 rounded-full border-4 border-purple-primary/10 border-t-purple-primary animate-spin"></div>
                  <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-purple-primary/10 border border-purple-primary/30 flex items-center justify-center">
                    <Cpu className="w-6 h-6 text-purple-300 animate-pulse" />
                  </div>
                </div>

                <h3 className="font-display text-2xl font-extrabold text-white mb-3">Assembling Custom Curriculum</h3>
                <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
                  Our LLM agent cluster is researching concepts, writing transcripts, and compiling download resources. Expected build in 10-15 seconds.
                </p>

                <div className="w-48 bg-white/5 h-1.5 rounded-full overflow-hidden mt-8">
                  <div className="bg-gradient-to-r from-purple-primary to-cyan-primary h-full rounded-full animate-[shine_2s_linear_infinite]" style={{ width: '100%', backgroundSize: '200% auto' }}></div>
                </div>
              </div>
            ) : activeCourse ? (
              <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl h-[660px] flex flex-col bg-black/40">

                {/* Course Viewer Header */}
                <div className="p-5 bg-white/2 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-primary/10 border border-cyan-primary/20 text-cyan-300">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded-md bg-cyan-primary/10 border border-cyan-primary/20 text-[9px] text-cyan-300 font-bold uppercase tracking-wider">
                        Generated Student Portal
                      </span>
                      <h3 className="font-display font-bold text-lg text-white mt-1 leading-tight">
                        {activeCourse.title}
                      </h3>
                    </div>
                  </div>

                  {/* Language switch */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/8 self-start sm:self-auto">
                    <Globe className="w-4 h-4 text-cyan-primary shrink-0" />
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as any)}
                      className="bg-transparent border-none text-xs text-white focus:outline-none cursor-pointer pr-4 font-semibold font-sans"
                    >
                      <option value="en" className="bg-[#030014] text-white">EN (English)</option>
                      <option value="es" className="bg-[#030014] text-white">ES (Español)</option>
                      <option value="fr" className="bg-[#030014] text-white">FR (Français)</option>
                    </select>
                  </div>
                </div>

                {isGenerating && (
                  <div className="bg-purple-primary/10 border-b border-white/5 px-5 py-2.5 flex items-center justify-between gap-4 animate-pulse select-none">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                      </span>
                      <span className="text-[11px] text-purple-300 font-semibold">Course outline generated. Compiling lessons...</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-gray-500 font-mono">Progress: {progress}%</span>
                      <div className="w-20 bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-primary to-cyan-primary h-full" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Segmented Sliding Tab Control */}
                <div className="p-3 bg-white/1 border-b border-white/5">
                  <div className="flex p-1 bg-black/50 border border-white/5 rounded-xl gap-1">
                    {(['content', 'quiz', 'downloads'] as const).map((tab) => {
                      const isActive = activeTab === tab
                      const getTabConfig = () => {
                        switch (tab) {
                          case 'content': return { label: 'Read Lesson', icon: BookOpen }
                          case 'quiz': return { label: 'Practice Quiz', icon: HelpCircle }
                          case 'downloads': return { label: 'Downloads', icon: Download }
                        }
                      }
                      const config = getTabConfig()
                      const Icon = config.icon

                      return (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer ${isActive
                              ? 'bg-gradient-to-r from-purple-primary/20 to-cyan-primary/20 text-white border border-purple-primary/30 shadow-[0_0_12px_rgba(124,58,237,0.15)]'
                              : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                        >
                          <Icon className={`w-3.5 h-3.5 transition-transform duration-300 ${isActive ? 'scale-110 text-cyan-400' : 'text-gray-400'}`} />
                          <span>{config.label}</span>
                          {tab === 'quiz' && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${isActive ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-gray-500'
                              }`}>
                              {activeCourse?.quizzes?.length || 0}
                            </span>
                          )}
                          {tab === 'downloads' && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-gray-500'
                              }`}>
                              {activeCourse?.resources?.length || 0}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Main Content Split View */}
                <div className="flex flex-1 min-h-0">
                  {/* Left Column: Outline index */}
                  <div className="w-60 border-r border-white/5 bg-[#030014]/40 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 hidden md:block">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Outline Modules</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-white/5 text-[9px] text-gray-400">
                        {(activeCourse?.modules || []).reduce((acc, m) => acc + (m.lessons?.length || 0), 0)} Lessons
                      </span>
                    </div>

                    {activeCourse?.modules?.map((mod, modIdx) => (
                      <div key={mod.title} className="p-2 border-b border-white/5 last:border-b-0">
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-400">{mod.title}</div>
                        <div className="space-y-1 mt-1.5">
                          {mod?.lessons?.map((les, lesIdx) => {
                            const isSelected = activeModuleIndex === modIdx && activeLessonIndex === lesIdx
                            const currentLessonKey = `${activeCourse.title}-${modIdx}-${lesIdx}`
                            const isCompleted = completedLessons[currentLessonKey]

                            return (
                              <button
                                key={les.title}
                                onClick={() => {
                                  setActiveModuleIndex(modIdx)
                                  setActiveLessonIndex(lesIdx)
                                  setVideoProgress(0)
                                  setIsPlayingVideo(false)
                                }}
                                className={`w-full text-left px-2.5 py-2 rounded-xl text-xs transition duration-200 flex items-center justify-between gap-2 border ${les.isPlaceholder ? 'cursor-wait' : 'cursor-pointer'} ${isSelected
                                    ? 'bg-purple-primary/15 border-purple-primary/30 text-white font-medium shadow-[inset_0_0_8px_rgba(124,58,237,0.05)]'
                                    : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                                  }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  {les.isPlaceholder ? (
                                    <div className="w-3 h-3 border-2 border-purple-primary/30 border-t-purple-primary rounded-full animate-spin shrink-0"></div>
                                  ) : isCompleted ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  ) : (
                                    <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-gray-500'}`} />
                                  )}
                                  <span className={`truncate ${les.isPlaceholder ? 'text-gray-500 italic' : ''}`}>
                                    {les.title}
                                  </span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Right Column: Tab details */}
                  <div className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 bg-[#030014]/20 flex flex-col justify-between">

                    <div>
                      {/* Outline Select for mobile devices */}
                      <div className="mb-4 md:hidden">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Select Lesson</label>
                        <select
                          value={`${activeModuleIndex}-${activeLessonIndex}`}
                          onChange={(e) => {
                            const [m, l] = e.target.value.split('-').map(Number)
                            setActiveModuleIndex(m)
                            setActiveLessonIndex(l)
                            setVideoProgress(0)
                            setIsPlayingVideo(false)
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
                        >
                          {activeCourse?.modules?.map((m, mIdx) =>
                            m.lessons?.map((l, lIdx) => (
                              <option key={`${mIdx}-${lIdx}`} value={`${mIdx}-${lIdx}`} className="bg-[#030014]">
                                {l.title} {l.isPlaceholder ? '(Generating...)' : ''}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      {activeTab === 'content' && currentLesson && (
                        currentLesson.isPlaceholder ? (
                          <div className="space-y-8 animate-pulse select-none">
                            <div className="prose prose-invert max-w-none text-sm text-gray-300 leading-relaxed font-sans">
                              <h4 className="text-white text-lg font-bold font-display mb-4 pb-2 border-b border-white/5 flex items-center gap-2">
                                <div className="w-3.5 h-3.5 border-2 border-purple-primary/30 border-t-purple-primary rounded-full animate-spin shrink-0"></div>
                                <span className="text-gray-400 italic">Generating:</span> {currentLesson.title}
                              </h4>
                              <div className="space-y-4 pt-4">
                                <div className="h-3.5 bg-white/5 rounded-full w-3/4"></div>
                                <div className="h-3.5 bg-white/5 rounded-full w-5/6"></div>
                                <div className="h-3.5 bg-white/5 rounded-full w-2/3"></div>
                                <div className="h-3.5 bg-white/5 rounded-full w-4/5"></div>
                                
                                <div className="my-6 p-5 rounded-2xl border border-white/5 bg-white/2 space-y-4">
                                  <div className="h-3 bg-purple-primary/20 rounded-full w-1/4"></div>
                                  <div className="h-2.5 bg-white/5 rounded-full w-full"></div>
                                  <div className="h-2.5 bg-white/5 rounded-full w-5/6"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-8">
                            <div className="prose prose-invert max-w-none text-sm text-gray-300 leading-relaxed font-sans">
                              <h4 className="text-white text-lg font-bold font-display mb-4 pb-2 border-b border-white/5 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-purple-primary" />
                                {currentLesson.title}
                              </h4>
                              <div className="space-y-4">
                                {renderFormattedContent(currentLesson.content?.[language] || '')}
                              </div>
                            </div>
                          </div>
                        )
                      )}

                      {/* Practice Quiz Tab */}
                      {activeTab === 'quiz' && activeCourse && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <div>
                              <h4 className="text-white text-base font-bold font-display flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-purple-primary" />
                                Interactive Course Review
                              </h4>
                              <p className="text-xs text-gray-400 mt-1">
                                Test your understanding of the generated curriculum.
                              </p>
                            </div>
                            {Object.keys(selectedAnswers).length > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedAnswers({})
                                  setShowExplanation({})
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-gray-400 text-xs font-semibold cursor-pointer transition-all duration-300"
                              >
                                Retake Quiz
                              </button>
                            )}
                          </div>

                          <div className="space-y-6 max-h-[480px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                            {(!activeCourse.quizzes || activeCourse.quizzes.length === 0) ? (
                              <div className="text-center py-12 text-gray-500 italic">
                                {isGenerating ? 'Quizzes are being compiled by the AI generator... Please wait.' : 'No quizzes generated for this course.'}
                              </div>
                            ) : (
                              activeCourse.quizzes.map((q, qIdx) => {
                                const selectedIdx = selectedAnswers[q.id]
                                const isAnswered = selectedIdx !== undefined
                                const isCorrect = isAnswered && selectedIdx === q.correctIndex
                                const explanationVisible = showExplanation[q.id]

                                return (
                                  <div key={q.id} className="p-4 rounded-xl border border-white/5 bg-white/2 space-y-4">
                                    <div className="flex items-start gap-3">
                                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-primary/20 text-purple-300 text-[10px] font-bold shrink-0 mt-0.5">
                                        {qIdx + 1}
                                      </span>
                                      <h5 className="text-sm font-semibold text-white leading-relaxed">{q.question}</h5>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2.5 pl-8">
                                      {q.options.map((opt, oIdx) => {
                                        const isSelected = selectedIdx === oIdx
                                        const isThisOptionCorrect = oIdx === q.correctIndex

                                        let buttonStyles = 'border-white/5 bg-white/2 text-gray-300 hover:bg-white/5 hover:border-white/10'
                                        if (isAnswered) {
                                          if (isSelected) {
                                            buttonStyles = isCorrect
                                              ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
                                              : 'border-rose-500/35 bg-rose-500/10 text-rose-300'
                                          } else if (isThisOptionCorrect) {
                                            buttonStyles = 'border-emerald-500/25 bg-emerald-500/5 text-emerald-400'
                                          } else {
                                            buttonStyles = 'border-transparent bg-transparent text-gray-600 opacity-60 cursor-not-allowed'
                                          }
                                        }

                                        return (
                                          <button
                                            key={opt}
                                            disabled={isAnswered}
                                            onClick={() => {
                                              setSelectedAnswers(prev => ({ ...prev, [q.id]: oIdx }))
                                              setShowExplanation(prev => ({ ...prev, [q.id]: true }))
                                            }}
                                            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 border flex items-center justify-between gap-3 cursor-pointer ${buttonStyles}`}
                                          >
                                            <span>{opt}</span>
                                            {isAnswered && (
                                              <span>
                                                {isThisOptionCorrect ? (
                                                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                                ) : isSelected ? (
                                                  <span className="text-rose-400 font-bold">✕</span>
                                                ) : null}
                                              </span>
                                            )}
                                          </button>
                                        )
                                      })}
                                    </div>

                                    {explanationVisible && (
                                      <div className="mt-3 pl-8">
                                        <div className="p-3 rounded-lg bg-purple-primary/5 border border-purple-primary/10 text-[11px] leading-relaxed text-gray-400 relative overflow-hidden">
                                          <div className="absolute top-0 left-0 w-[2px] h-full bg-purple-primary"></div>
                                          <p className="font-semibold text-purple-300 mb-1 flex items-center gap-1.5">
                                            <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                                            AI Concept Explanation
                                          </p>
                                          <p>{q.explanation}</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })
                            )}
                          </div>
                        </div>
                      )}

                      {/* Downloads Tab */}
                      {activeTab === 'downloads' && (
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-white text-base font-bold font-display flex items-center gap-2">
                              <Download className="w-5 h-5 text-purple-primary" />
                              Generated Resource Packets
                            </h4>
                            <p className="text-xs text-gray-400 mt-1">
                              Download AI-compiled course materials, worksheets, and references.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 gap-3 mt-4">
                            {(!activeCourse?.resources || activeCourse.resources.length === 0) ? (
                              <div className="text-center py-12 text-gray-500 italic">
                                {isGenerating ? 'Compiling worksheets and study resources... Please wait.' : 'No resources generated for this course.'}
                              </div>
                            ) : (
                              (activeCourse?.resources || []).map((res) => {
                                const progressVal = downloadProgress[res.name]
                                const isDownloading = progressVal !== undefined && progressVal < 100
                                const isDownloaded = progressVal === 100

                                return (
                                  <div
                                    key={res.name}
                                    className={`p-4 rounded-xl transition-all duration-300 border ${isDownloaded
                                        ? 'bg-emerald-500/5 border-emerald-500/20'
                                        : isDownloading
                                          ? 'bg-purple-primary/5 border-purple-primary/20'
                                          : 'bg-white/2 border-white/5 hover:border-white/10 hover:bg-white/4'
                                      }`}
                                  >
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-3 truncate">
                                        <div className={`p-2.5 rounded-lg border ${isDownloaded
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                            : isDownloading
                                              ? 'bg-purple-primary/15 border-purple-primary/20 text-purple-300 animate-pulse'
                                              : 'bg-white/5 border-white/5 text-gray-400'
                                          }`}>
                                          <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="truncate">
                                          <h5 className="text-sm font-semibold text-white truncate">{res.name}</h5>
                                          <span className="text-[10px] text-gray-500 font-medium">
                                            {res.type} • {res.size}
                                          </span>
                                        </div>
                                      </div>

                                      <button
                                        onClick={() => startDownload(res.name)}
                                        disabled={isDownloading}
                                        className={`p-2 rounded-lg border transition-all duration-300 cursor-pointer flex items-center justify-center ${isDownloaded
                                            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                                            : isDownloading
                                              ? 'bg-purple-primary/10 border-purple-primary/20 text-purple-300 cursor-not-allowed'
                                              : 'bg-white/5 hover:bg-cyan-primary border-white/10 hover:border-cyan-primary hover:text-black text-gray-300'
                                          }`}
                                      >
                                        {isDownloaded ? (
                                          <Check className="w-4 h-4" />
                                        ) : isDownloading ? (
                                          <div className="w-4 h-4 border-2 border-purple-primary/20 border-t-purple-primary rounded-full animate-spin"></div>
                                        ) : (
                                          <Download className="w-4 h-4" />
                                        )}
                                      </button>
                                    </div>

                                    {/* Progress Bar inside download card */}
                                    {isDownloading && (
                                      <div className="mt-3">
                                        <div className="flex justify-between text-[9px] text-gray-400 mb-1 font-semibold">
                                          <span>Downloading package...</span>
                                          <span>{progressVal}%</span>
                                        </div>
                                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                          <div
                                            className="bg-gradient-to-r from-purple-primary to-cyan-primary h-full transition-all duration-150"
                                            style={{ width: `${progressVal}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    )}

                                    {isDownloaded && (
                                      <div className="mt-2 text-[9px] text-emerald-400 font-semibold flex items-center gap-1 animate-pulse">
                                        <CheckCircle className="w-3 h-3" />
                                        <span>Download completed! File saved to simulated local cache.</span>
                                      </div>
                                    )}
                                  </div>
                                )
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Reader Tab mark as complete button */}
                    {activeTab === 'content' && currentLesson && !currentLesson.isPlaceholder && (
                      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <CheckCircle className={`w-4 h-4 ${isLessonDone ? 'text-emerald-500' : 'text-gray-600'}`} />
                          <span>Status: {isLessonDone ? 'Completed' : 'Incomplete'}</span>
                        </div>
                        <button
                          onClick={() => {
                            setCompletedLessons(prev => ({
                              ...prev,
                              [lessonKey]: !isLessonDone
                            }))
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${isLessonDone
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-purple-primary text-white hover:bg-purple-600 shadow-[0_4px_12px_rgba(124,58,237,0.3)] hover:scale-[1.02] active:scale-[0.98]'
                            }`}
                        >
                          {isLessonDone ? 'Mark as Incomplete' : 'Mark as Complete'}
                          {isLessonDone ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}

                  </div>
                </div>

                {/* Course Viewer footer */}
                <div className="px-6 py-3 bg-white/1 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500 font-sans select-none">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    <span>Academy deployment status: Active</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hover:text-white cursor-pointer transition">SCORM Export</span>
                    <span>•</span>
                    <span className="hover:text-white cursor-pointer transition">LTI v1.3</span>
                    <span>•</span>
                    <span className="hover:text-white cursor-pointer transition">PDF Package</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-12 border-white/10 text-center h-full min-h-[620px] flex flex-col justify-center items-center bg-black/40 relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
                <BookOpen className="w-16 h-16 text-gray-600 mb-4 animate-bounce" />
                <h3 className="font-display text-2xl font-bold text-white mb-2">Generator Workspace Ready</h3>
                <p className="text-gray-400 text-sm max-w-sm">
                  Enter a custom prompt in the input block above to compile the course content dashboard dynamically.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* System Telemetry Console (bottom) */}
        {!hideInput && (
          <div className="mt-8">
            <div className="glass-panel rounded-2xl border border-white/10 bg-black/60 overflow-hidden shadow-2xl flex flex-col min-h-[160px] max-h-[220px]">
              {/* macOS Window Title Bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/5 select-none">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] shadow-[0_0_5px_rgba(255,95,86,0.5)]"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] shadow-[0_0_5px_rgba(255,189,46,0.5)]"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] shadow-[0_0_5px_rgba(39,201,63,0.5)]"></span>
                </div>
                <span className="font-mono text-[9px] text-gray-500 font-semibold tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3 h-3 text-cyan-400" />
                  SYSTEM TELEMETRY CONSOLE
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="font-mono text-[8px] text-emerald-400 uppercase tracking-widest font-bold">Online</span>
                </span>
              </div>

              <div
                ref={logsContainerRef}
                className="flex-1 p-3 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1.5 scrollbar-thin scrollbar-thumb-white/10 pr-2 bg-black/30"
              >
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center text-gray-600 italic py-6">
                    <Sliders className="w-5 h-5 mb-1 opacity-20 text-gray-400" />
                    <p>No operations queued. Ready to generate.</p>
                  </div>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-1">
                      <span className="text-gray-600 shrink-0 select-none mr-2">{(idx + 1).toString().padStart(2, '0')}</span>
                      <div className="break-all">{formatLogLine(log)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
