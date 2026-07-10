import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useAuthStore } from '../store/useAuthStore'
import { useGenerationStore } from '../store/useGenerationStore'
import {
  FolderOpen,
  Plus,
  Settings,
  LogOut,
  Clock,
  ChevronRight,
  Send,
  MessageSquare,
  X,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react'
import PremiumInteractiveSimulator from './PremiumInteractiveSimulator'

export default function PremiumDashboard() {
  const { user } = useAuthStore()
  const isGenerating = useGenerationStore((state) => state.isGenerating)
  const resetGeneration = useGenerationStore((state) => state.resetGeneration)

  const [activeTab, setActiveTab] = useState<'library' | 'generate' | 'settings'>('library')
  const [isAiOpen, setIsAiOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Quiz and simulator control
  const [simulatorPrompt, setSimulatorPrompt] = useState('')
  const [selectedCourseForPlayer, setSelectedCourseForPlayer] = useState<string | null>(null)

  // Click-outside listener for User profile dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false)
      }
    }
    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserDropdownOpen])

  // Active course/lesson context for the AI Tutor
  const [tutorCourseId, setTutorCourseId] = useState<string | null>(null)
  const [tutorLessonId, setTutorLessonId] = useState<string | null>(null)
  const [isTutorLoading, setIsTutorLoading] = useState(false)

  // AI tutor chat states
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    { sender: 'ai', text: 'Hello! I am your AI Course Tutor. Select any course in your library or ask me any question about lessons.', time: '09:00 AM' }
  ])
  const [chatInput, setChatInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Automatically close the AI Tutor panel when exiting the course reader
  useEffect(() => {
    if (!selectedCourseForPlayer) {
      setIsAiOpen(false)
    }
  }, [selectedCourseForPlayer])

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, isAiOpen])

  // Helper to parse inline bolding (**text**) and inline code (`code`)
  const parseInlineMarkdown = (text: string) => {
    const tokens = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return tokens.map((token, index) => {
      if (token.startsWith('**') && token.endsWith('**')) {
        return <strong key={index} className="font-bold text-white">{token.slice(2, -2)}</strong>;
      }
      if (token.startsWith('`') && token.endsWith('`')) {
        return <code key={index} className="bg-black/35 px-1 py-0.5 rounded font-mono text-[10px] text-pink-300 border border-white/5">{token.slice(1, -1)}</code>;
      }
      return token;
    });
  };

  // Helper to parse block-level markdown (headers, lists, code blocks)
  const renderMessageText = (text: string) => {
    if (!text) {return null;}
    const parts = text.split(/(```[a-z]*[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const match = part.match(/```([a-z]*)\n([\s\S]*?)```/i);
        const language = match ? match[1] : '';
        const code = match ? match[2].trim() : part.replace(/```/g, '').trim();
        return (
          <div key={index} className="my-2 bg-black/45 rounded-xl border border-white/8 overflow-hidden font-mono text-[10px]">
            {language && (
              <div className="bg-white/3 px-3 py-1 text-[9px] font-bold text-gray-400 border-b border-white/5 uppercase">
                {language}
              </div>
            )}
            <pre className="p-3 overflow-x-auto text-cyan-300 leading-normal whitespace-pre">
              {code}
            </pre>
          </div>
        );
      }
      const lines = part.split('\n');
      return (
        <div key={index} className="space-y-1.5">
          {lines.map((line, lIdx) => {
            const cleanLine = line.trim();
            if (!cleanLine) {return <div key={lIdx} className="h-2" />;}
            if (cleanLine.startsWith('###')) {
              return <h4 key={lIdx} className="text-sm font-bold text-white mt-2 mb-1">{cleanLine.replace(/^###\s*/, '')}</h4>;
            }
            if (cleanLine.startsWith('##') || cleanLine.startsWith('#')) {
              return <h4 key={lIdx} className="text-sm font-bold text-purple-300 mt-2 mb-1">{cleanLine.replace(/^#+\s*/, '')}</h4>;
            }
            if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
              return (
                <ul key={lIdx} className="list-disc list-inside pl-2 text-gray-300">
                  <li>{parseInlineMarkdown(cleanLine.replace(/^[-*]\s+/, ''))}</li>
                </ul>
              );
            }
            return <p key={lIdx} className="text-gray-300">{parseInlineMarkdown(cleanLine)}</p>;
          })}
        </div>
      );
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || isTutorLoading) {return}

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userMsg = { sender: 'user' as const, text: chatInput, time: timeString }
    const currentInput = chatInput.trim()

    setChatMessages(prev => [...prev, userMsg])
    setChatInput('')
    setIsTutorLoading(true)

    try {
      const response = await axios.post('/api/tutor/chat', {
        message: currentInput,
        courseId: tutorCourseId,
        lessonId: tutorLessonId
      })

      const aiResponseText = response.data?.response || 'I am sorry, I was unable to compile a response.'
      setChatMessages(prev => [...prev, {
        sender: 'ai',
        text: aiResponseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
    } catch (err: any) {
      console.error('Error fetching AI Tutor response:', err)
      const errorMsg = err.response?.data?.message || 'Connection lost. Please make sure the server is online.'
      setChatMessages(prev => [...prev, {
        sender: 'ai',
        text: `⚠️ **Error:** ${errorMsg}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
    } finally {
      setIsTutorLoading(false)
    }
  }


  const [courses, setCourses] = useState<any[]>([])
  const [isCoursesLoading, setIsCoursesLoading] = useState(true)

  const fetchCourses = async () => {
    try {
      setIsCoursesLoading(true)
      const response = await axios.get('/api/courses')
      setCourses(response.data)
    } catch (error) {
      console.error('Error fetching courses from database:', error)
      // fallback
      // const mockMapped = userCoursesPresets.map((c, idx) => ({
      //   _id: `mock-${idx}`,
      //   title: c.title,
      //   description: '',
      //   modules: Array.from({ length: c.lessonsCount }).map((_, mIdx) => ({
      //     title: `Module ${mIdx + 1}`,
      //     lessons: Array.from({ length: 1 })
      //   })),
      //   resources: [],
      //   quizzes: []
      // }))
      // setCourses(mockMapped)
    } finally {
      setIsCoursesLoading(false)
    }
  }

  const handleDeleteCourse = async (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent click from triggering open

    // Check if it's a mock course
    if (courseId.startsWith('mock-')) {
      alert("Mock courses cannot be deleted as they are local presets.")
      return
    }

    const confirmDelete = window.confirm("Are you sure you want to delete this course and all its progress?")
    if (!confirmDelete) {return}

    try {
      await axios.delete(`/api/courses/${courseId}`)
      await fetchCourses()
    } catch (error: any) {
      console.error('Error deleting course:', error)
      const errMsg = error.response?.data?.message || 'Please make sure the backend is running.'
      alert(`Failed to delete course: ${errMsg}`)
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

  const getNextMonthFirstDayString = () => {
    const today = new Date()
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    return nextMonth.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="flex flex-col h-screen bg-[#030014] text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.03),transparent_40%)] pointer-events-none"></div>

      {/* Pane 1: Top Navigation Navbar */}
      <nav className="w-full border-b border-white/5 bg-[#030014]/65 backdrop-blur-xl h-16 flex items-center justify-between px-6 shrink-0 z-40">
        {/* Left Side: Brand Logo */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 cursor-pointer group">
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
        </div>

        {/* Center Side: Tab Navigation Menu (hidden on mobile, since bottom nav is active) */}
        <div className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-white/2 border border-white/5 backdrop-blur-md">
          <button
            onClick={() => {
              setActiveTab('library')
              setSelectedCourseForPlayer(null)
              setTutorCourseId(null)
              setTutorLessonId(null)
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer group border ${
              activeTab === 'library' && !selectedCourseForPlayer
                ? 'bg-cyan-500/10 border-cyan-500/30 text-white shadow-[0_0_15px_rgba(6,182,212,0.12)]'
                : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FolderOpen className={`w-4 h-4 shrink-0 transition-colors duration-300 ${
              activeTab === 'library' && !selectedCourseForPlayer ? 'text-cyan-primary' : 'text-cyan-400/70 group-hover:text-cyan-300'
            }`} />
            <span>My Course Library</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('generate')
              setSimulatorPrompt('')
              setSelectedCourseForPlayer(null)
              setTutorCourseId(null)
              setTutorLessonId(null)
              if (!isGenerating) {
                resetGeneration()
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer group border ${
              activeTab === 'generate'
                ? 'bg-purple-primary/10 border-purple-primary/30 text-white shadow-[0_0_15px_rgba(124,58,237,0.12)]'
                : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {isGenerating ? (
              <div className="w-4 h-4 shrink-0 relative flex items-center justify-center animate-pulse">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500"></span>
              </div>
            ) : (
              <Plus className={`w-4 h-4 shrink-0 transition-colors duration-300 ${
                activeTab === 'generate' ? 'text-purple-primary' : 'text-purple-400/70 group-hover:text-purple-300'
              }`} />
            )}
            <span className="flex items-center gap-2">
              <span>Create New Course</span>
              {isGenerating && (
                <span className="text-[10px] text-purple-300 bg-purple-primary/20 px-1.5 py-0.5 rounded-md font-semibold animate-pulse">
                  Building...
                </span>
              )}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('settings')
              setSelectedCourseForPlayer(null)
              setTutorCourseId(null)
              setTutorLessonId(null)
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer group border ${
              activeTab === 'settings'
                ? 'bg-amber-500/10 border-amber-500/30 text-white shadow-[0_0_15px_rgba(245,158,11,0.12)]'
                : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className={`w-4 h-4 shrink-0 transition-colors duration-300 ${
              activeTab === 'settings' ? 'text-amber-400' : 'text-amber-400/70 group-hover:text-amber-300'
            }`} />
            <span>Account Settings</span>
          </button>
        </div>

        {/* Right Side: Usage & Profile details */}
        <div className="flex items-center gap-4 relative">
          {/* Quick Metrics (visible on desktop only) */}
          <div className="hidden lg:flex items-center gap-3 bg-white/2 border border-white/5 rounded-full px-4 py-1.5 text-[10px]">
            <span className="text-gray-500 font-bold uppercase tracking-wider">AI Tokens:</span>
            <span className="text-gray-300 font-semibold">45k / 100k</span>
            <div className="w-16 bg-white/10 h-1.5 rounded-full overflow-hidden shrink-0">
              <div className="bg-gradient-to-r from-purple-primary to-cyan-primary h-full w-[45%]"></div>
            </div>
          </div>

          {/* User profile dropdown button */}
          <div ref={dropdownRef} className="border-l border-white/5 pl-4 relative">
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-2 hover:opacity-95 transition-all focus:outline-none cursor-pointer"
            >
              <img
                src={user?.picture || 'https://via.placeholder.com/150'}
                alt={user?.name || 'User profile'}
                className="w-8 h-8 rounded-full border border-purple-primary/30 object-cover shrink-0 hover:scale-105 transition"
              />
              <span className="hidden sm:inline text-xs font-semibold text-gray-300 hover:text-white truncate max-w-[100px] select-none">
                {user?.name || 'Guest Admin'}
              </span>
            </button>

            {/* Dropdown Card */}
            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-[#141414] border border-white/10 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-50 overflow-hidden divide-y divide-white/5">
                  {/* Header: User Info */}
                  <div className="p-4 flex gap-3 items-center">
                    {user?.picture ? (
                      <img
                        src={user.picture}
                        alt={user.name || 'User profile'}
                        className="w-10 h-10 rounded-full border border-purple-primary/30 object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-primary to-cyan-primary text-white font-bold flex items-center justify-center text-sm shadow">
                        {(user?.name || 'G').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="truncate flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-white truncate">{user?.name || 'Guest Admin'}</h4>
                        {user?.role === 'admin' && (
                          <span className="px-1.5 py-0.5 rounded-md bg-purple-primary/15 border border-purple-primary/30 text-[8px] text-purple-300 font-bold uppercase tracking-wider select-none">
                            Admin
                          </span>
                        )}
                        {user?.role === 'instructor' && (
                          <span className="px-1.5 py-0.5 rounded-md bg-cyan-primary/15 border border-cyan-primary/30 text-[8px] text-cyan-300 font-bold uppercase tracking-wider select-none">
                            Instructor
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">{user?.email || 'guest@example.com'}</p>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        setActiveTab('settings')
                        setSelectedCourseForPlayer(null)
                        setTutorCourseId(null)
                        setTutorLessonId(null)
                        setIsUserDropdownOpen(false)
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition cursor-pointer text-left"
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('settings')
                        setSelectedCourseForPlayer(null)
                        setTutorCourseId(null)
                        setTutorLessonId(null)
                        setIsUserDropdownOpen(false)
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition cursor-pointer text-left"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                      <span>Preferences</span>
                    </button>
                  </div>

                  {/* Footer Action: Sign Out */}
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false)
                        localStorage.removeItem('gencourse_mock_mode')
                        localStorage.removeItem('gencourse_token')
                        const apiBase = import.meta.env.VITE_API_BASE_URL || ''
                        window.location.href = `${apiBase}/auth/logout`
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/5 transition cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4 text-red-500/70" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
            )}
          </div>
        </div>
      </nav>

      {/* Horizontal Flex Wrapper for Workspace + Desktop Inline AI Tutor */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Pane 2: Central Workspace Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 pb-24 md:pb-8 scrollbar-thin scrollbar-thumb-white/10 flex flex-col justify-between">
          <div className={`${selectedCourseForPlayer ? 'w-full' : 'w-full max-w-6xl mx-auto'} flex-1`}>
          {/* Active Course Player Integration */}
          {selectedCourseForPlayer ? (
            <div className="space-y-6 h-full">
              <PremiumInteractiveSimulator
                prompt={selectedCourseForPlayer}
                setPrompt={() => { }}
                minimal={true}
                hideInput={true}
                onActiveLessonChange={(cId, lId) => {
                  setTutorCourseId(cId)
                  setTutorLessonId(lId)
                }}
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
                  </div>

                  {/* Course Cards Grid */}
                  {isCoursesLoading ? (
                    <div className="col-span-2 flex flex-col items-center justify-center py-20 text-gray-500">
                      <div className="w-8 h-8 border-2 border-purple-primary/20 border-t-purple-primary rounded-full animate-spin mb-4"></div>
                      <p className="text-xs">Loading academy courses...</p>
                    </div>
                  ) : courses.length === 0 ? (
                    <div className="col-span-2 text-center py-20 text-gray-500 border border-dashed border-white/10 rounded-2xl bg-white/1">
                      <p className="text-xs">Your course library is empty. Select "Create New Course" at the top to build your first curriculum!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                      {courses.map((course, idx) => {
                        const dec = getCourseDecorations(course.title, idx)
                        const totalLessons = course.userProgress?.totalLessons ?? (course.modules || []).reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0)
                        const completedCount = course.userProgress?.completedLessons ?? dec.completedCount
                        const progressPercent = course.userProgress?.progress ?? dec.progress

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
                                    {completedCount}/{totalLessons} lessons complete
                                  </span>
                                  <span className="font-bold text-white">{progressPercent}%</span>
                                </div>
                                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-purple-primary to-cyan-primary h-full transition-all duration-300"
                                    style={{ width: `${progressPercent}%` }}
                                  ></div>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => setSelectedCourseForPlayer(course.title)}
                                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/8 text-white text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1 hover:scale-[1.01]"
                                >
                                  <span>{progressPercent === 100 ? 'Review Course' : progressPercent === 0 ? 'Start Course' : 'Resume Course'}</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteCourse(course._id, e)}
                                  className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 transition cursor-pointer flex items-center justify-center"
                                  title="Delete Course"
                                >
                                  <Trash2 className="w-4 h-4" />
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
                    <PremiumInteractiveSimulator
                      prompt={simulatorPrompt}
                      setPrompt={setSimulatorPrompt}
                      minimal={true}
                      onSimulationComplete={fetchCourses}
                      onActiveLessonChange={(cId, lId) => {
                        setTutorCourseId(cId)
                        setTutorLessonId(lId)
                      }}
                    />
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
                        <p className="text-xs text-gray-400 mt-1">Renewal scheduled on {getNextMonthFirstDayString()} (₹3,999/month)</p>
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
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Local LLM Status</span>
                        <p className="text-xl font-bold text-white">Online</p>
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
          <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] text-gray-500 font-sans sm:pr-20">
            <div>
              <span>AI Course Builder Engine: </span>
              <span className="text-emerald-400 font-semibold shadow-emerald-500/5 font-mono">Active (qwen2.5:1.5b-instruct)</span>
            </div>
            <div className="font-mono">
              <span>v1.0.0-rc1</span>
            </div>
          </div>
        )}
        </main>

        {/* Desktop Inline AI Tutor Panel */}
        {isAiOpen && (
          <aside
            className="w-80 bg-[#030014]/65 border-l border-white/5 backdrop-blur-xl flex flex-col justify-between shrink-0 hidden md:flex"
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
                      className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[85%] border ${isAi
                        ? 'bg-purple-primary/5 border-purple-primary/10 text-gray-300 rounded-tl-sm'
                        : 'bg-gradient-to-r from-purple-primary to-cyan-primary border-transparent text-white rounded-tr-sm shadow-md'
                        }`}
                    >
                      {isAi ? (
                        <div className="space-y-1">{renderMessageText(m.text)}</div>
                      ) : (
                        <p>{m.text}</p>
                      )}
                    </div>
                    <span className="text-[9px] text-gray-500 font-semibold px-1 font-mono">{m.time}</span>
                  </div>
                )
              })}
              {isTutorLoading && (
                <div className="flex flex-col items-start space-y-1.5 animate-fade-in">
                  <div className="p-3 rounded-2xl text-xs bg-purple-primary/5 border border-purple-primary/10 text-gray-400 rounded-tl-sm flex items-center gap-1">
                    <span>AI Tutor is thinking</span>
                    <span className="flex gap-0.5 ml-1">
                      <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce"></span>
                    </span>
                  </div>
                </div>
              )}
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
        )}
      </div>

      {/* Pane 3: Mobile Right Collapsible AI Tutor Panel */}
      {isAiOpen && (
        <aside
          className="fixed right-0 top-0 h-full z-45 w-full bg-[#030014]/98 backdrop-blur-xl flex flex-col justify-between shadow-2xl border-l border-white/5 md:hidden"
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
                    className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[85%] border ${isAi
                      ? 'bg-purple-primary/5 border-purple-primary/10 text-gray-300 rounded-tl-sm'
                      : 'bg-gradient-to-r from-purple-primary to-cyan-primary border-transparent text-white rounded-tr-sm shadow-md'
                      }`}
                  >
                    {isAi ? (
                      <div className="space-y-1">{renderMessageText(m.text)}</div>
                    ) : (
                      <p>{m.text}</p>
                    )}
                  </div>
                  <span className="text-[9px] text-gray-500 font-semibold px-1 font-mono">{m.time}</span>
                </div>
              )
            })}
            {isTutorLoading && (
              <div className="flex flex-col items-start space-y-1.5 animate-fade-in">
                <div className="p-3 rounded-2xl text-xs bg-purple-primary/5 border border-purple-primary/10 text-gray-400 rounded-tl-sm flex items-center gap-1">
                  <span>AI Tutor is thinking</span>
                  <span className="flex gap-0.5 ml-1">
                    <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce"></span>
                  </span>
                </div>
              </div>
            )}
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
      )}

      {/* Floating Toggle Button for AI Panel when closed */}
      {!isAiOpen && selectedCourseForPlayer && (
        <button
          onClick={() => setIsAiOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-6 p-3 rounded-full bg-gradient-to-r from-purple-primary to-cyan-primary text-white hover:scale-110 transition shadow-2xl z-30 cursor-pointer flex items-center justify-center"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      )}

      {/* Pane 4: Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#030014]/90 backdrop-blur-md border-t border-white/10 z-40 flex items-center justify-around px-2 shadow-lg">
        <button
          onClick={() => {
            setActiveTab('library')
            setSelectedCourseForPlayer(null)
            setTutorCourseId(null)
            setTutorLessonId(null)
          }}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all duration-200 cursor-pointer ${
            activeTab === 'library' && !selectedCourseForPlayer
              ? 'text-cyan-primary font-semibold'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FolderOpen className={`w-5 h-5 ${activeTab === 'library' && !selectedCourseForPlayer ? 'text-cyan-primary' : 'text-gray-400'}`} />
          <span className="text-[10px] font-bold tracking-wider">Library</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('generate')
            setSimulatorPrompt('')
            setSelectedCourseForPlayer(null)
            setTutorCourseId(null)
            setTutorLessonId(null)
            if (!isGenerating) {
              resetGeneration()
            }
          }}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all duration-200 cursor-pointer relative ${
            activeTab === 'generate' ? 'text-purple-400 font-semibold' : 'text-gray-400 hover:text-white'
          }`}
        >
          {isGenerating ? (
            <div className="w-5 h-5 relative flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
            </div>
          ) : (
            <Plus className={`w-5 h-5 ${activeTab === 'generate' ? 'text-purple-primary' : 'text-gray-400'}`} />
          )}
          <span className="text-[10px] font-bold tracking-wider">
            {isGenerating ? 'Building' : 'Create'}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('settings')
            setSelectedCourseForPlayer(null)
            setTutorCourseId(null)
            setTutorLessonId(null)
          }}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all duration-200 cursor-pointer ${
            activeTab === 'settings' ? 'text-amber-400 font-semibold' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Settings className={`w-5 h-5 ${activeTab === 'settings' ? 'text-amber-400' : 'text-gray-400'}`} />
          <span className="text-[10px] font-bold tracking-wider">Settings</span>
        </button>

        <button
          onClick={() => {
            localStorage.removeItem('gencourse_mock_mode');
            localStorage.removeItem('gencourse_token');
            const apiBase = import.meta.env.VITE_API_BASE_URL || '';
            window.location.href = `${apiBase}/auth/logout`;
          }}
          className="flex flex-col items-center justify-center gap-1 flex-1 py-1 text-red-400 hover:text-red-300 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wider">Logout</span>
        </button>
      </nav>
    </div>
  )
}
