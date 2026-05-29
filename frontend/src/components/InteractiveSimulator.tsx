import { useState, useEffect, useRef } from 'react'
import {
  BookOpen,
  Play,
  Download,
  CheckCircle,
  Terminal,
  Cpu,
  Globe,
  Sliders,
  FileText,
  Volume2
} from 'lucide-react'

interface InteractiveSimulatorProps {
  prompt: string
  setPrompt: (val: string) => void
  isGenerating: boolean
  setIsGenerating: (val: boolean) => void
}

// Sample Data Structure
interface Lesson {
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
  title: string
  lessons: Lesson[]
}

interface CourseData {
  title: string
  description: string
  modules: Module[]
  resources: { name: string; size: string; type: string }[]
}

const COURSES_DATABASE: Record<string, CourseData> = {
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
              fr: `Les React Hooks ont été introduits dans la version 16.8 pour permettre aux composants fonctionnels de gérer l'état et les effets secondaires. Auparavant, la logique nécessitait des composants de classe complexes avec des liaisons 'this' et des méthodes de cycle de vie fragmentées.`
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
              fr: `Les guitares acoustiques sont généralement accordées en Mi-La-Ré-Sol-Si-Mi (EADGBE).`
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
    ]
  }
}

export default function InteractiveSimulator({
  prompt,
  setPrompt,
  isGenerating,
  setIsGenerating
}: InteractiveSimulatorProps) {
  const [activeCourse, setActiveCourse] = useState<CourseData | null>(null)
  const [activeModuleIndex, setActiveModuleIndex] = useState(0)
  const [activeLessonIndex, setActiveLessonIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<'content' | 'video' | 'downloads'>('content')
  const [language, setLanguage] = useState<'en' | 'es' | 'fr'>('en')
  
  // Pipeline Simulation states
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  
  // Video player simulation
  const [isPlayingVideo, setIsPlayingVideo] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)
  const videoTimerRef = useRef<any>(null)

  const steps = [
    { title: 'Topic Analyzer', desc: 'Analyzing keywords, target audience & goals' },
    { title: 'Curriculum Planner', desc: 'Generating structured modules and outline' },
    { title: 'Lesson Generator', desc: 'Synthesizing textbook chapters & scripts' },
    { title: 'Quiz Builder', desc: 'Building concept reviews & quizzes' },
    { title: 'Assessment Engine', desc: 'Assembling final exams & evaluations' },
    { title: 'Publishing Layer', desc: 'Compiling localized pages & PDFs' }
  ]

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

  const runSimulation = (topic: string) => {
    setActiveCourse(null)
    setCurrentStepIndex(0)
    setProgress(0)
    setIsGenerating(true)
    setLogs([])

    const simulatedLogs = [
      `[ANALYZE] Ingesting prompt: "${topic}"`,
      `[ANALYZE] Defining skill levels, audience personas, and study goals...`,
      `[PLANNER] Building structural graph for course outline...`,
      `[PLANNER] Assembled Outline: 3 major modules, 6 custom chapters.`,
      `[LESSON-GEN] Writing comprehensive lesson textbook content files...`,
      `[LESSON-GEN] Synthesizing voiceover transcripts and slide outlines...`,
      `[QUIZ-BUILDER] Constructing dynamic knowledge checkups for each module...`,
      `[QUIZ-BUILDER] Generated 10 test questions with adaptive hints...`,
      `[ASSESS-ENG] Compiling final exams and grading framework parameters...`,
      `[PUBLISH-LAYER] Processing multilingual localizations (ES, FR, EN)...`,
      `[PUBLISH-LAYER] Packaging offline assets and rendering printable PDF workbooks...`,
      `[SYSTEM] Generation complete. Launching student workspace portal...`
    ]

    let logCounter = 0
    let progressVal = 0

    const interval = setInterval(() => {
      progressVal += 4
      setProgress(progressVal)

      // Add logs incrementally
      if (progressVal % 8 === 0 && logCounter < simulatedLogs.length) {
        setLogs((prev) => [...prev, simulatedLogs[logCounter]])
        logCounter++
      }

      // Advance core workflow steps
      if (progressVal === 16) setCurrentStepIndex(1)
      if (progressVal === 32) setCurrentStepIndex(2)
      if (progressVal === 48) setCurrentStepIndex(3)
      if (progressVal === 64) setCurrentStepIndex(4)
      if (progressVal === 80) setCurrentStepIndex(5)

      if (progressVal >= 100) {
        clearInterval(interval)
        setCurrentStepIndex(6) // all done
        setIsGenerating(false)
        
        // Find course data or default to React Hooks
        const matchingCourse = COURSES_DATABASE[topic] || COURSES_DATABASE['Intro to React Hooks']
        setActiveCourse({
          ...matchingCourse,
          title: topic // dynamic title
        })
        setActiveModuleIndex(0)
        setActiveLessonIndex(0)
        setVideoProgress(0)
        setIsPlayingVideo(false)
        setActiveTab('content')
      }
    }, 150)
  }

  // Hook simulator trigger from Hero or elsewhere
  useEffect(() => {
    // When isGenerating starts, we scroll to demo
    if (isGenerating && currentStepIndex === -1) {
      runSimulation(prompt || 'Intro to React Hooks')
    }
  }, [isGenerating])

  const handleManualTrigger = (e: React.FormEvent) => {
    e.preventDefault()
    runSimulation(prompt || 'Intro to React Hooks')
  }

  // Pre-load default state for user to see on page load
  useEffect(() => {
    setActiveCourse(COURSES_DATABASE['Intro to React Hooks'])
  }, [])

  const currentLesson = activeCourse?.modules[activeModuleIndex]?.lessons[activeLessonIndex]

  return (
    <section id="demo" className="py-24 bg-[#030014] relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(124,58,237,0.08),transparent_50%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.08),transparent_50%)] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-3xl md:text-5xl text-gradient-purple-cyan mb-4">
            Interactive Generator Workspace
          </h2>
          <p className="font-sans text-gray-400 text-lg max-w-2xl mx-auto">
            Test our course engine. Enter a custom topic or watch our AI pipeline assemble lessons, scripts, and multi-language worksheets.
          </p>
        </div>

        {/* Input Bar inside workspace */}
        <div className="max-w-xl mx-auto mb-12">
          <form onSubmit={handleManualTrigger} className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Intro to React Hooks"
              className="w-full px-5 py-3 glass-input text-sm border-white/10"
              disabled={isGenerating}
            />
            <button
              type="submit"
              disabled={isGenerating}
              className="px-6 py-3 rounded-full bg-purple-primary hover:bg-purple-600 disabled:opacity-50 text-white text-sm font-semibold transition flex items-center gap-2 cursor-pointer"
            >
              {isGenerating ? 'Generating...' : 'Simulate'}
              <Cpu className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Main Work Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Progress Pipeline & Logs */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Step-by-Step Generator */}
            <div className="glass-panel rounded-2xl p-6 border-white/10">
              <h3 className="font-display text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-primary animate-pulse" />
                Pipeline Workflow
              </h3>

              <div className="space-y-5">
                {steps.map((step, idx) => {
                  const isDone = currentStepIndex > idx
                  const isActive = currentStepIndex === idx
                  return (
                    <div
                      key={step.title}
                      className={`flex gap-4 p-3 rounded-xl transition duration-300 ${
                        isActive
                          ? 'bg-purple-primary/10 border border-purple-primary/30 shadow-[0_0_15px_rgba(124,58,237,0.1)]'
                          : 'border border-transparent'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold border ${
                            isDone
                              ? 'bg-cyan-primary border-cyan-primary text-black'
                              : isActive
                              ? 'bg-purple-primary border-purple-primary text-white animate-pulse'
                              : 'bg-white/5 border-white/10 text-gray-500'
                          }`}
                        >
                          {isDone ? <CheckCircle className="w-4 h-4 text-black" /> : idx + 1}
                        </div>
                        {idx !== steps.length - 1 && (
                          <div
                            className={`w-[2px] h-8 mt-2 ${
                              isDone ? 'bg-cyan-primary' : 'bg-white/5'
                            }`}
                          ></div>
                        )}
                      </div>
                      <div>
                        <h4
                          className={`text-sm font-semibold transition ${
                            isActive ? 'text-white' : isDone ? 'text-gray-300' : 'text-gray-500'
                          }`}
                        >
                          {step.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">{step.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Progress bar */}
              {isGenerating && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Compiling curriculum nodes...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-primary to-cyan-primary h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Agent terminal logs */}
            <div className="glass-panel rounded-2xl p-6 border-white/10 bg-black/40 flex-1">
              <h3 className="font-display text-sm font-bold text-gray-400 mb-4 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-gray-400" />
                SYSTEM TELEMETRY
              </h3>
              <div className="h-44 overflow-y-auto font-mono text-xs text-green-400/90 space-y-2 scrollbar-thin scrollbar-thumb-white/10 pr-2">
                {logs.length === 0 ? (
                  <p className="text-gray-600 italic">No operations queued. Ready to simulate.</p>
                ) : (
                  logs.map((log, idx) => <p key={idx}>{log}</p>)
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Portal Course Viewer */}
          <div className="lg:col-span-7">
            {isGenerating ? (
              <div className="glass-panel rounded-3xl p-12 border-white/10 text-center h-[580px] flex flex-col justify-center items-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full border-4 border-purple-primary/20 border-t-purple-primary animate-spin"></div>
                  <Cpu className="absolute inset-0 m-auto w-6 h-6 text-purple-primary animate-pulse" />
                </div>
                <h3 className="font-display text-2xl font-bold text-white mb-2">Generating Academic Framework</h3>
                <p className="text-gray-400 text-sm max-w-sm">
                  Our LLM agent cluster is researching references and constructing modules. Expected output in 10-15 seconds.
                </p>
              </div>
            ) : activeCourse ? (
              <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl h-[620px] flex flex-col">
                
                {/* Course Viewer Header */}
                <div className="p-6 bg-white/2 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="px-2.5 py-1 rounded-md bg-cyan-primary/10 border border-cyan-primary/25 text-xs text-cyan-300 font-semibold uppercase tracking-wider">
                      Live Academy Portal
                    </span>
                    <h3 className="font-display font-bold text-xl text-white mt-2 leading-tight">
                      {activeCourse.title}
                    </h3>
                  </div>

                  {/* Language switch and resources */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                      <Globe className="w-4 h-4 text-cyan-primary" />
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as any)}
                        className="bg-transparent border-none text-xs text-white focus:outline-none cursor-pointer"
                      >
                        <option value="en" className="bg-black text-white">English</option>
                        <option value="es" className="bg-black text-white">Español</option>
                        <option value="fr" className="bg-black text-white">Français</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Tabs selection */}
                <div className="flex border-b border-white/5 bg-white/1">
                  <button
                    onClick={() => setActiveTab('content')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition ${
                      activeTab === 'content'
                        ? 'border-purple-primary text-white bg-purple-primary/5'
                        : 'border-transparent text-gray-400 hover:text-white hover:bg-white/2'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    Read Lesson
                  </button>
                  <button
                    onClick={() => setActiveTab('video')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition ${
                      activeTab === 'video'
                        ? 'border-purple-primary text-white bg-purple-primary/5'
                        : 'border-transparent text-gray-400 hover:text-white hover:bg-white/2'
                    }`}
                  >
                    <Play className="w-4 h-4" />
                    Video Script
                  </button>
                  <button
                    onClick={() => setActiveTab('downloads')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition ${
                      activeTab === 'downloads'
                        ? 'border-purple-primary text-white bg-purple-primary/5'
                        : 'border-transparent text-gray-400 hover:text-white hover:bg-white/2'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    Downloads ({activeCourse.resources.length})
                  </button>
                </div>

                {/* Main Content Split View */}
                <div className="flex flex-1 min-h-0">
                  {/* Left Column: Outline index */}
                  <div className="w-56 border-r border-white/5 bg-[#030014]/40 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 hidden md:block">
                    <div className="p-4 border-b border-white/5">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Outline Modules</span>
                    </div>
                    {activeCourse.modules.map((mod, modIdx) => (
                      <div key={mod.title} className="p-2">
                        <div className="px-2 py-1 text-xs font-semibold text-gray-400">{mod.title}</div>
                        <div className="space-y-1 mt-1">
                          {mod.lessons.map((les, lesIdx) => {
                            const isSelected = activeModuleIndex === modIdx && activeLessonIndex === lesIdx
                            return (
                              <button
                                key={les.title}
                                onClick={() => {
                                  setActiveModuleIndex(modIdx)
                                  setActiveLessonIndex(lesIdx)
                                  setVideoProgress(0)
                                  setIsPlayingVideo(false)
                                }}
                                className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition truncate cursor-pointer ${
                                  isSelected
                                    ? 'bg-purple-primary/20 text-white font-medium border-l-2 border-purple-primary'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                              >
                                {les.title}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Right Column: Tab details */}
                  <div className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 bg-[#030014]/20">
                    
                    {/* Outline Select for mobile devices */}
                    <div className="mb-4 md:hidden">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Select Lesson</label>
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
                        {activeCourse.modules.map((m, mIdx) => 
                          m.lessons.map((l, lIdx) => (
                            <option key={`${mIdx}-${lIdx}`} value={`${mIdx}-${lIdx}`} className="bg-black">
                              {l.title}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Reader Tab */}
                    {activeTab === 'content' && currentLesson && (
                      <div className="prose prose-invert max-w-none text-sm text-gray-300 leading-relaxed whitespace-pre-line font-sans">
                        <h4 className="text-white text-lg font-bold font-display mb-4 pb-2 border-b border-white/5 flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-purple-primary" />
                          {currentLesson.title}
                        </h4>
                        <div className="space-y-4">
                          {currentLesson.content[language]}
                        </div>
                      </div>
                    )}

                    {/* Video Tab */}
                    {activeTab === 'video' && currentLesson && (
                      <div className="h-full flex flex-col justify-between">
                        {/* Custom video sandbox renderer */}
                        <div className="relative rounded-2xl aspect-video bg-black/90 border border-white/10 overflow-hidden flex flex-col justify-between p-4 shadow-inner">
                          
                          {/* Visual Slides representation */}
                          <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
                            <div className="px-3 py-1 rounded bg-cyan-primary/20 border border-cyan-primary/40 text-[10px] text-cyan-200 font-bold uppercase tracking-wider mb-3">
                              Generated Slide Asset
                            </div>
                            <p className="font-display font-bold text-sm md:text-base text-white max-w-md">
                              {currentLesson.videoSlide}
                            </p>
                          </div>

                          {/* Controls bar */}
                          <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-4">
                            <button
                              onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                              className="p-2.5 rounded-full bg-cyan-primary text-black hover:scale-105 transition cursor-pointer"
                            >
                              {isPlayingVideo ? (
                                <div className="flex gap-0.5 justify-center items-center">
                                  <div className="w-1.5 h-3 bg-black rounded-sm animate-pulse"></div>
                                  <div className="w-1.5 h-3 bg-black rounded-sm animate-pulse"></div>
                                </div>
                              ) : (
                                <Play className="w-4 h-4 fill-black" />
                              )}
                            </button>

                            {/* Voiceover waveform visual */}
                            <div className="flex-1 flex items-center gap-1">
                              {Array.from({ length: 24 }).map((_, idx) => {
                                const activeHeight = isPlayingVideo 
                                  ? Math.floor(Math.random() * 20) + 4 
                                  : 6
                                return (
                                  <div
                                    key={idx}
                                    className={`flex-1 rounded-full transition-all duration-300 ${
                                      isPlayingVideo ? 'bg-cyan-primary' : 'bg-gray-700'
                                    }`}
                                    style={{ height: `${activeHeight}px` }}
                                  ></div>
                                )
                              })}
                            </div>

                            {/* Audio Badge */}
                            <div className="flex items-center gap-1 text-[10px] text-gray-400">
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>AI voice synth</span>
                            </div>
                          </div>

                          {/* Progress Line */}
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                            <div
                              className="bg-gradient-to-r from-purple-primary to-cyan-primary h-full transition-all"
                              style={{ width: `${videoProgress}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Video voiceover script */}
                        <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/5">
                          <h5 className="text-xs font-semibold text-purple-primary mb-1 uppercase tracking-wider flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Voiceover Transcription
                          </h5>
                          <p className="text-xs text-gray-400 italic leading-relaxed">
                            "{currentLesson.script}"
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Downloads Tab */}
                    {activeTab === 'downloads' && (
                      <div className="space-y-4">
                        <h4 className="text-white text-base font-bold font-display mb-4 pb-2 border-b border-white/5">
                          Printable Course Packets
                        </h4>
                        <p className="text-xs text-gray-400 mb-4">
                          Download worksheets, generated notes, and presentation materials.
                        </p>
                        <div className="grid grid-cols-1 gap-3">
                          {activeCourse.resources.map((res) => (
                            <div
                              key={res.name}
                              className="flex items-center justify-between p-4 rounded-xl bg-white/2 border border-white/5 hover:border-white/15 hover:bg-white/5 transition"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-lg bg-purple-primary/15 border border-purple-primary/20 text-purple-300">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                  <h5 className="text-sm font-semibold text-white">{res.name}</h5>
                                  <span className="text-[10px] text-gray-500">{res.type} • {res.size}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  alert(`Downloading simulated ${res.name}...`)
                                }}
                                className="p-2 rounded-lg bg-white/5 hover:bg-cyan-primary hover:text-black border border-white/10 hover:border-cyan-primary text-gray-300 transition cursor-pointer"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* Course Viewer footer */}
                <div className="p-4 bg-white/1 border-t border-white/5 text-center text-[10px] text-gray-500 font-sans">
                  Ready to deploy structure. Generate custom topics above.
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-12 border-white/10 text-center h-[580px] flex flex-col justify-center items-center">
                <BookOpen className="w-12 h-12 text-gray-600 mb-4 animate-bounce" />
                <h3 className="font-display text-2xl font-bold text-white mb-2">Simulator Workspace Ready</h3>
                <p className="text-gray-400 text-sm max-w-sm">
                  Enter a custom prompt in the input block above to compile the course content dashboard dynamically.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  )
}
