import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useAuth0 } from '@auth0/auth0-react'
import { useAuthStore } from '../store/useAuthStore'
import {
  FolderOpen,
  Plus,
  Key,
  Settings,
  LogOut,
  Clock,
  ChevronRight,
  ChevronLeft,
  Send,
  MessageSquare,
  X,
  Layers,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react'
import InteractiveSimulator from './InteractiveSimulator'

export default function PremiumDashboard() {
  const { logout } = useAuth0()
  const { user } = useAuthStore()
  
  const [activeTab, setActiveTab] = useState<'library' | 'generate' | 'integrations' | 'settings'>('library')
  const [isAiOpen, setIsAiOpen] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  
  // Quiz and simulator control
  const [simulatorPrompt, setSimulatorPrompt] = useState('Intro to React Hooks')
  const [simulatorIsGenerating, setSimulatorIsGenerating] = useState(false)
  const [selectedCourseForPlayer, setSelectedCourseForPlayer] = useState<string | null>(null)
  
  // Integrations state
  const [showApiKey, setShowApiKey] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  
  // AI tutor chat states
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    { sender: 'ai', text: 'Hello! I am your AI Course Tutor. Select any course in your library or ask me any question about lessons.', time: '09:00 AM' }
  ])
  const [chatInput, setChatInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, isAiOpen])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userMsg = { sender: 'user' as const, text: chatInput, time: timeString }
    
    setChatMessages(prev => [...prev, userMsg])
    setChatInput('')

    // Simulated responses
    setTimeout(() => {
      let aiResponseText = "That's a great question! I am analyzing the generated course outline database to formulate a comprehensive answer for you."
      
      const lowerInput = chatInput.toLowerCase()
      if (lowerInput.includes('react') || lowerInput.includes('hook')) {
        aiResponseText = "React Hooks let you use state and other React features without writing a class. Remember the Rules of Hooks: call them only at the top level and only from React function components."
      } else if (lowerInput.includes('copyright') || lowerInput.includes('law')) {
        aiResponseText = "Under copyright law, protection begins automatically when a work is fixed in a tangible medium. You don't have to register or use the © symbol to get protection, although doing so helps in legal enforcement."
      } else if (lowerInput.includes('quantum')) {
        aiResponseText = "Wave-particle duality is a central concept in quantum mechanics. It states that every particle or quantum entity may be described as either a particle or a wave, depending on the observation method."
      } else if (lowerInput.includes('guitar')) {
        aiResponseText = "Standard tuning for a guitar is E-A-D-G-B-E. When practicing rhythm strumming, focus on keeping your wrist loose and maintaining a steady down-up stroke pattern."
      }

      setChatMessages(prev => [...prev, {
        sender: 'ai',
        text: aiResponseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
    }, 1000)
  }

  const copyApiKey = () => {
    navigator.clipboard.writeText('gc_live_9f82d2c18d3a7741e9b25fbc705a6')
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  // Fallback list of mock user courses presets
  const userCoursesPresets = [
    {
      title: 'Intro to React Hooks',
      progress: 66,
      lessonsCount: 3,
      completedCount: 2,
      category: 'Development',
      level: 'Intermediate',
      bannerGradient: 'from-blue-600/20 to-purple-600/20 border-blue-500/20',
      tagColor: 'bg-blue-500/10 text-blue-300 border-blue-500/20'
    },
    {
      title: 'Basics of Copyright Law',
      progress: 0,
      lessonsCount: 3,
      completedCount: 0,
      category: 'Legal Studies',
      level: 'Beginner',
      bannerGradient: 'from-amber-600/20 to-orange-600/20 border-amber-500/20',
      tagColor: 'bg-amber-500/10 text-amber-300 border-amber-500/20'
    },
    {
      title: 'Quantum Mechanics for Beginners',
      progress: 100,
      lessonsCount: 2,
      completedCount: 2,
      category: 'Physics',
      level: 'Advanced',
      bannerGradient: 'from-cyan-600/20 to-emerald-600/20 border-cyan-500/20',
      tagColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
    },
    {
      title: 'Acoustic Guitar 101',
      progress: 50,
      lessonsCount: 2,
      completedCount: 1,
      category: 'Music',
      level: 'Beginner',
      bannerGradient: 'from-rose-600/20 to-pink-600/20 border-rose-500/20',
      tagColor: 'bg-rose-500/10 text-rose-300 border-rose-500/20'
    }
  ]

  const [courses, setCourses] = useState<any[]>([])
  const [isCoursesLoading, setIsCoursesLoading] = useState(true)

  const fetchCourses = async () => {
    try {
      setIsCoursesLoading(true)
      const response = await axios.get('http://localhost:5000/api/courses')
      setCourses(response.data)
    } catch (error) {
      console.error('Error fetching courses from database:', error)
      // fallback
      const mockMapped = userCoursesPresets.map((c, idx) => ({
        _id: `mock-${idx}`,
        title: c.title,
        description: '',
        modules: Array.from({ length: c.lessonsCount }).map((_, mIdx) => ({
          title: `Module ${mIdx + 1}`,
          lessons: Array.from({ length: 1 })
        })),
        resources: [],
        quizzes: []
      }))
      setCourses(mockMapped)
    } finally {
      setIsCoursesLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const getCourseDecorations = (title: string, index: number) => {
    if (title.includes('React Hooks')) {
      return {
        category: 'Development',
        level: 'Intermediate',
        bannerGradient: 'from-blue-600/20 to-purple-600/20 border-blue-500/20',
        tagColor: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
        completedCount: 2,
        progress: 66
      }
    }
    if (title.includes('Copyright')) {
      return {
        category: 'Legal Studies',
        level: 'Beginner',
        bannerGradient: 'from-amber-600/20 to-orange-600/20 border-amber-500/20',
        tagColor: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
        completedCount: 0,
        progress: 0
      }
    }
    if (title.includes('Quantum')) {
      return {
        category: 'Physics',
        level: 'Advanced',
        bannerGradient: 'from-cyan-600/20 to-emerald-600/20 border-cyan-500/20',
        tagColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
        completedCount: 2,
        progress: 100
      }
    }
    if (title.includes('Guitar')) {
      return {
        category: 'Music',
        level: 'Beginner',
        bannerGradient: 'from-rose-600/20 to-pink-600/20 border-rose-500/20',
        tagColor: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
        completedCount: 1,
        progress: 50
      }
    }

    const categories = ['AI & Data', 'Business', 'Design', 'General Study']
    const levels = ['Beginner', 'Intermediate', 'Advanced']
    const gradients = [
      'from-violet-600/20 to-fuchsia-600/20 border-violet-500/20',
      'from-emerald-600/20 to-teal-600/20 border-emerald-500/20',
      'from-indigo-600/20 to-blue-600/20 border-indigo-500/20',
      'from-pink-600/20 to-rose-600/20 border-pink-500/20'
    ]
    const tagColors = [
      'bg-violet-500/10 text-violet-300 border-violet-500/20',
      'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
      'bg-pink-500/10 text-pink-300 border-pink-500/20'
    ]

    const modIdx = index % 4
    return {
      category: categories[modIdx],
      level: levels[index % 3],
      bannerGradient: gradients[modIdx],
      tagColor: tagColors[modIdx],
      completedCount: 0,
      progress: 0
    }
  }

  return (
    <div className="flex h-screen bg-[#030014] text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.03),transparent_40%)] pointer-events-none"></div>

      {/* Pane 1: Left Navigation Sidebar */}
      <aside
        className={`border-r border-white/5 bg-[#030014]/65 backdrop-blur-xl flex flex-col justify-between shrink-0 hidden md:flex transition-all duration-300 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className={`transition-all duration-300 flex-1 flex flex-col min-h-0 ${isSidebarCollapsed ? 'p-4 space-y-6' : 'p-6 space-y-8'}`}>
          {/* Logo & Project Title */}
          {!isSidebarCollapsed ? (
            <div className="flex items-center justify-between pb-5 border-b border-white/5 gap-2">
              <div className="flex items-center gap-2.5 cursor-pointer group px-1">
                <div className="relative">
                  <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-purple-primary to-cyan-primary opacity-75 blur-sm group-hover:opacity-100 transition duration-300"></div>
                  <div className="relative p-1.5 rounded-lg bg-black flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-cyan-primary animate-pulse" />
                  </div>
                </div>
                <span className="font-display font-bold text-base tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  GenCourse<span className="text-purple-primary">AI</span>
                </span>
              </div>
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition cursor-pointer"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3.5 pb-5 border-b border-white/5">
              <div
                className="relative cursor-pointer group"
                onClick={() => setIsSidebarCollapsed(false)}
                title="Expand Sidebar"
              >
                <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-purple-primary to-cyan-primary opacity-75 blur-sm group-hover:opacity-100 transition duration-300"></div>
                <div className="relative p-1.5 rounded-lg bg-black flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-cyan-primary animate-pulse" />
                </div>
              </div>
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition cursor-pointer"
                title="Expand Sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Menu Items */}
          <div className="space-y-1.5">
            {!isSidebarCollapsed && (
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider pl-3 block mb-3">
                Workspace Hub
              </span>
            )}
            
            <button
              onClick={() => {
                setActiveTab('library')
                setSelectedCourseForPlayer(null)
              }}
              className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all duration-300 border cursor-pointer ${
                isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
              } ${
                activeTab === 'library' && !selectedCourseForPlayer
                  ? 'bg-purple-primary/10 border-purple-primary/30 text-white shadow-[0_0_15px_rgba(124,58,237,0.08)]'
                  : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              title={isSidebarCollapsed ? "My Course Library" : undefined}
            >
              <FolderOpen className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>My Course Library</span>}
            </button>

            <button
              onClick={() => {
                setActiveTab('generate')
                setSelectedCourseForPlayer(null)
              }}
              className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all duration-300 border cursor-pointer ${
                isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
              } ${
                activeTab === 'generate'
                  ? 'bg-purple-primary/10 border-purple-primary/30 text-white shadow-[0_0_15px_rgba(124,58,237,0.08)]'
                  : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              title={isSidebarCollapsed ? "Create New Course" : undefined}
            >
              <Plus className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Create New Course</span>}
            </button>

            <button
              onClick={() => {
                setActiveTab('integrations')
                setSelectedCourseForPlayer(null)
              }}
              className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all duration-300 border cursor-pointer ${
                isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
              } ${
                activeTab === 'integrations'
                  ? 'bg-purple-primary/10 border-purple-primary/30 text-white shadow-[0_0_15px_rgba(124,58,237,0.08)]'
                  : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              title={isSidebarCollapsed ? "API & Integrations" : undefined}
            >
              <Key className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>API & Integrations</span>}
            </button>

            <button
              onClick={() => {
                setActiveTab('settings')
                setSelectedCourseForPlayer(null)
              }}
              className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all duration-300 border cursor-pointer ${
                isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
              } ${
                activeTab === 'settings'
                  ? 'bg-purple-primary/10 border-purple-primary/30 text-white shadow-[0_0_15px_rgba(124,58,237,0.08)]'
                  : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              title={isSidebarCollapsed ? "Account Settings" : undefined}
            >
              <Settings className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Account Settings</span>}
            </button>
          </div>

          {/* Quick Metrics */}
          {!selectedCourseForPlayer && !isSidebarCollapsed && (
            <div className="p-4 rounded-xl border border-white/5 bg-white/2 space-y-3">
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">
                Resource Usage
              </span>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>AI Outline Tokens</span>
                  <span>45k / 100k</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-primary to-cyan-primary h-full w-[45%]"></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>SCORM Exports</span>
                  <span>4 / 10</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-primary to-cyan-primary h-full w-[40%]"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer User Details */}
        <div className={`border-t border-white/5 bg-black/20 flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'p-3 items-center gap-4' : 'p-4 gap-3'
        }`}>
          <div className="flex items-center gap-3 w-full justify-center">
            <img
              src={user?.picture || 'https://via.placeholder.com/150'}
              alt={user?.name || 'User profile'}
              className="w-9 h-9 rounded-full border border-purple-primary/30 object-cover shrink-0"
              title={isSidebarCollapsed ? `${user?.name} (${user?.email})` : undefined}
            />
            {!isSidebarCollapsed && (
              <div className="truncate flex-1">
                <h4 className="text-xs font-semibold text-white truncate">{user?.name}</h4>
                <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            className={`border border-red-500/20 hover:bg-red-500/5 text-red-400 hover:text-red-300 text-xs font-semibold transition cursor-pointer flex items-center justify-center ${
              isSidebarCollapsed ? 'p-2 rounded-xl w-9 h-9' : 'w-full py-2 rounded-lg gap-1.5'
            }`}
            title={isSidebarCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            {!isSidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Pane 2: Central Workspace Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin scrollbar-thumb-white/10 flex flex-col justify-between">
        <div className="w-full max-w-6xl mx-auto flex-1">
          {/* Active Course Player Integration */}
          {selectedCourseForPlayer ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedCourseForPlayer(null)}
                  className="text-xs font-semibold text-gray-400 hover:text-white transition flex items-center gap-1 cursor-pointer"
                >
                  ← Back to Library
                </button>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Active Student Portal</span>
                </div>
              </div>
              <InteractiveSimulator
                prompt={selectedCourseForPlayer}
                setPrompt={() => {}}
                isGenerating={false}
                setIsGenerating={() => {}}
                minimal={true}
                hideInput={true}
              />
            </div>
          ) : (
            <>
              {/* Tab 1: Library View */}
              {activeTab === 'library' && (
                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="font-display font-bold text-2xl md:text-3xl text-gradient-purple-cyan">
                        Student Academy Vault
                      </h2>
                      <p className="font-sans text-gray-400 text-xs mt-1">
                        Resume where you left off or deploy new outlines to external LMS setups.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('generate')}
                      className="px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-primary to-cyan-primary text-white text-xs font-bold transition hover:opacity-95 shadow-[0_4px_12px_rgba(124,58,237,0.2)] hover:scale-[1.02] cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Generate Course</span>
                    </button>
                  </div>

                  {/* Course Cards Grid */}
                  {isCoursesLoading ? (
                    <div className="col-span-2 flex flex-col items-center justify-center py-20 text-gray-500">
                      <div className="w-8 h-8 border-2 border-purple-primary/20 border-t-purple-primary rounded-full animate-spin mb-4"></div>
                      <p className="text-xs">Loading academy courses...</p>
                    </div>
                  ) : courses.length === 0 ? (
                    <div className="col-span-2 text-center py-20 text-gray-500 border border-dashed border-white/10 rounded-2xl bg-white/1">
                      <p className="text-xs">Your course library is empty. Click "Generate Course" to build one!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                      {courses.map((course, idx) => {
                        const dec = getCourseDecorations(course.title, idx)
                        const totalLessons = (course.modules || []).reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0)

                        return (
                          <div
                            key={course._id || course.title}
                            className={`p-5 rounded-2xl border bg-gradient-to-br ${dec.bannerGradient} transition-all duration-300 flex flex-col justify-between gap-6 shadow-lg relative overflow-hidden`}
                          >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/1 rounded-full blur-2xl pointer-events-none"></div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-start gap-3">
                                <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider ${dec.tagColor}`}>
                                  {dec.category}
                                </span>
                                <span className="text-[10px] text-gray-400 font-semibold">{dec.level}</span>
                              </div>
                              <h3 className="font-display font-bold text-lg text-white leading-tight">{course.title}</h3>
                            </div>

                            <div className="space-y-4">
                              {/* Progress */}
                              <div className="space-y-1.5">
                                <div className="flex justify-between text-xs text-gray-400">
                                  <span className="flex items-center gap-1 text-[11px]">
                                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                                    {dec.completedCount}/{totalLessons} lessons complete
                                  </span>
                                  <span className="font-bold text-white">{dec.progress}%</span>
                                </div>
                                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-purple-primary to-cyan-primary h-full transition-all duration-300"
                                    style={{ width: `${dec.progress}%` }}
                                  ></div>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => setSelectedCourseForPlayer(course.title)}
                                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/8 text-white text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1 hover:scale-[1.01]"
                                >
                                  <span>{dec.progress === 100 ? 'Review Course' : dec.progress === 0 ? 'Start Course' : 'Resume Course'}</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Create Course Simulator Embed */}
              {activeTab === 'generate' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display font-bold text-2xl md:text-3xl text-gradient-purple-cyan">
                      Synthesize Curriculum Outline
                    </h2>
                    <p className="font-sans text-gray-400 text-xs mt-1">
                      Configure details and trigger our LLM compiler to construct new course panels.
                    </p>
                  </div>
                  <div className="glass-panel border-white/10 p-6 rounded-3xl bg-black/30">
                    <InteractiveSimulator
                      prompt={simulatorPrompt}
                      setPrompt={setSimulatorPrompt}
                      isGenerating={simulatorIsGenerating}
                      setIsGenerating={setSimulatorIsGenerating}
                      minimal={true}
                      onSimulationComplete={fetchCourses}
                    />
                  </div>
                </div>
              )}

              {/* Tab 3: Integrations & Credentials */}
              {activeTab === 'integrations' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="font-display font-bold text-2xl md:text-3xl text-gradient-purple-cyan">
                      API Access & Integrations
                    </h2>
                    <p className="font-sans text-gray-400 text-xs mt-1">
                      Deploy generated course nodes directly into Moodle, Canvas, or custom LTI systems.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* SCORM Config */}
                    <div className="glass-panel border-white/10 p-5 rounded-2xl bg-black/20 flex flex-col justify-between gap-6">
                      <div className="space-y-3">
                        <div className="p-2 w-max rounded-lg bg-purple-primary/10 border border-purple-primary/20 text-purple-300">
                          <Layers className="w-5 h-5" />
                        </div>
                        <h3 className="font-display font-bold text-base text-white">SCORM 1.2 / 2004 Compiler</h3>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          Package custom outlines with tracking assets to easily upload into LMS systems. All tests, quiz tracking, and lesson checks are preserved.
                        </p>
                      </div>
                      <div className="p-3 bg-white/2 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                        <span className="text-gray-400">Export Standard</span>
                        <span className="font-semibold text-white">SCORM 2004 (4th Ed)</span>
                      </div>
                    </div>

                    {/* API keys */}
                    <div className="glass-panel border-white/10 p-5 rounded-2xl bg-black/20 space-y-4">
                      <div className="p-2 w-max rounded-lg bg-cyan-primary/10 border border-cyan-primary/20 text-cyan-300">
                        <Key className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-base text-white">Developer API Tokens</h3>
                        <p className="text-xs text-gray-400 leading-relaxed mt-1">
                          Automate generation pipelines via simple cURL scripts in your pipeline servers.
                        </p>
                      </div>

                      <div className="pt-2">
                        <div className="flex p-2 bg-black/45 rounded-xl border border-white/8 items-center justify-between gap-3 font-mono text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <Lock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                            <span className="truncate text-gray-400 font-mono">
                              {showApiKey ? 'gc_live_9f82d2c18d3a7741e9b25fbc705a6' : '••••••••••••••••••••••••••••••••••••'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition cursor-pointer"
                            >
                              {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={copyApiKey}
                              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition cursor-pointer relative"
                            >
                              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Billing Settings */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display font-bold text-2xl md:text-3xl text-gradient-purple-cyan">
                      Account Preferences & Billing
                    </h2>
                    <p className="font-sans text-gray-400 text-xs mt-1">
                      Manage subscriptions, update payment cards, and review LLM generation credits.
                    </p>
                  </div>

                  <div className="glass-panel border-white/10 p-6 rounded-2xl bg-black/20 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
                      <div>
                        <span className="px-2 py-0.5 rounded-md bg-purple-primary/10 border border-purple-primary/20 text-[9px] text-purple-300 font-bold uppercase tracking-wider">
                          Active Plan
                        </span>
                        <h3 className="font-display font-bold text-lg text-white mt-1.5">Premium Educator Workspace</h3>
                        <p className="text-xs text-gray-400 mt-1">Renewal scheduled on July 1, 2026 ($49/month)</p>
                      </div>
                      <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold transition cursor-pointer">
                        Manage Plan
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-white/2 rounded-xl border border-white/5 space-y-1">
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Course Quota</span>
                        <p className="text-xl font-bold text-white">Unlimited</p>
                      </div>
                      <div className="p-4 bg-white/2 rounded-xl border border-white/5 space-y-1">
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Token Reset</span>
                        <p className="text-xl font-bold text-white">28 Days Left</p>
                      </div>
                      <div className="p-4 bg-white/2 rounded-xl border border-white/5 space-y-1">
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Connected LTI Nodes</span>
                        <p className="text-xl font-bold text-white">3 / 10</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info bar */}
        {!selectedCourseForPlayer && (
          <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] text-gray-500 font-sans">
            <div>
              <span>Enterprise Deployment Hook: </span>
              <span className="text-emerald-400 font-semibold shadow-emerald-500/5 font-mono">active_deploy_88a</span>
            </div>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition">LTI Docs</a>
              <span>•</span>
              <a href="#" className="hover:text-white transition">SCORM Packaging API</a>
            </div>
          </div>
        )}
      </main>

      {/* Pane 3: Right Collapsible AI Tutor Panel */}
      <aside
        className={`border-l border-white/5 bg-[#030014]/65 backdrop-blur-xl shrink-0 transition-all duration-300 relative flex flex-col justify-between ${
          isAiOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-primary" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">AI Tutor Assistant</h3>
          </div>
          <button
            onClick={() => setIsAiOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-thumb-white/10 pr-2">
          {chatMessages.map((m, idx) => {
            const isAi = m.sender === 'ai'
            return (
              <div key={idx} className={`flex flex-col ${isAi ? 'items-start' : 'items-end'} space-y-1.5`}>
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[85%] border ${
                    isAi
                      ? 'bg-purple-primary/5 border-purple-primary/10 text-gray-300 rounded-tl-sm'
                      : 'bg-gradient-to-r from-purple-primary to-cyan-primary border-transparent text-white rounded-tr-sm shadow-md'
                  }`}
                >
                  <p>{m.text}</p>
                </div>
                <span className="text-[9px] text-gray-500 font-semibold px-1 font-mono">{m.time}</span>
              </div>
            )
          })}
          <div ref={chatEndRef}></div>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-black/20 shrink-0 flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask AI tutor..."
            className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-primary/50 transition-all duration-300"
          />
          <button
            type="submit"
            className="p-2 rounded-xl bg-gradient-to-r from-purple-primary to-cyan-primary text-white hover:scale-105 transition cursor-pointer flex items-center justify-center shadow-lg"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </aside>

      {/* Floating Toggle Button for AI Panel when closed */}
      {!isAiOpen && (
        <button
          onClick={() => setIsAiOpen(true)}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-gradient-to-r from-purple-primary to-cyan-primary text-white hover:scale-110 transition shadow-2xl z-40 cursor-pointer flex items-center justify-center"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
