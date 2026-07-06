import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { Sparkles, Menu, X, ArrowRight } from 'lucide-react'

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

export default function Navbar() {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isMobileMenuOpen
          ? 'py-4 bg-[#030014] border-b border-white/10 shadow-lg'
          : isScrolled
          ? 'py-4 bg-[#030014]/80 backdrop-blur-md border-b border-white/10 shadow-lg'
          : 'py-6 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="relative">
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-purple-primary to-cyan-primary opacity-75 blur-sm group-hover:opacity-100 transition duration-300"></div>
              <div className="relative p-2 rounded-lg bg-black flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-primary animate-pulse" />
              </div>
            </div>
            <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent group-hover:from-white group-hover:to-cyan-200 transition">
              GenCourse<span className="text-purple-primary">AI</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-300 hover:text-white transition-colors duration-200 relative group py-1">
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-primary to-cyan-primary transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#workflow" className="text-sm text-gray-300 hover:text-white transition-colors duration-200 relative group py-1">
              How it Works
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-primary to-cyan-primary transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#demo" className="text-sm text-gray-300 hover:text-white transition-colors duration-200 relative group py-1">
              Interactive Demo
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-primary to-cyan-primary transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition hover:scale-110 duration-200">
              <GithubIcon className="w-5 h-5" />
            </a>
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse"></div>
            ) : isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2.5 focus:outline-none cursor-pointer group/avatar"
                >
                  <img
                    src={user.picture || 'https://via.placeholder.com/150'}
                    alt={user.name || 'User Profile'}
                    className="w-8 h-8 rounded-full border border-purple-primary/40 object-cover group-hover/avatar:border-cyan-primary transition"
                  />
                  <span className="hidden lg:inline text-sm font-medium text-gray-300 group-hover/avatar:text-white transition">
                    {user.name}
                  </span>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-48 rounded-xl glass-panel bg-black border border-white/10 shadow-xl py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-white/5">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Account</p>
                      <p className="text-xs text-gray-300 truncate mt-0.5">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        localStorage.removeItem('gencourse_mock_mode');
                        localStorage.removeItem('gencourse_token');
                        const apiBase = import.meta.env.VITE_API_BASE_URL || '';
                        window.location.href = `${apiBase}/auth/logout`;
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 transition cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  localStorage.removeItem('gencourse_mock_mode');
                  const apiBase = import.meta.env.VITE_API_BASE_URL || '';
                  window.location.href = `${apiBase}/auth/login`;
                }}
                className="text-sm font-semibold text-gray-300 hover:text-white transition cursor-pointer"
              >
                Sign In
              </button>
            )}

            <a
              href="#demo"
              className="btn-glow relative flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-primary via-indigo-600 to-cyan-primary text-sm font-semibold text-white shadow-[0_0_15px_rgba(124,58,237,0.4)] hover:shadow-[0_0_25px_rgba(124,58,237,0.6)] hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              Generate Free Course
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 py-6 bg-[#030014] border-b border-white/10 flex flex-col items-center gap-5 shadow-2xl animate-fade-in">
          <a
            href="#features"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-[90%] py-3 text-center text-lg text-gray-300 hover:text-cyan-primary hover:bg-white/10 active:bg-white/15 rounded-xl transition duration-200"
          >
            Features
          </a>
          <a
            href="#workflow"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-[90%] py-3 text-center text-lg text-gray-300 hover:text-cyan-primary hover:bg-white/10 active:bg-white/15 rounded-xl transition duration-200"
          >
            How it Works
          </a>
          <a
            href="#demo"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-[90%] py-3 text-center text-lg text-gray-300 hover:text-cyan-primary hover:bg-white/10 active:bg-white/15 rounded-xl transition duration-200"
          >
            Interactive Demo
          </a>
          <div className="w-full px-6 flex flex-col gap-4 mt-2">
            {isLoading ? (
              <div className="w-full py-3 bg-white/5 animate-pulse rounded-xl"></div>
            ) : isAuthenticated && user ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={user.picture || 'https://via.placeholder.com/150'}
                    alt={user.name || 'User Profile'}
                    className="w-10 h-10 rounded-full border border-purple-primary object-cover"
                  />
                  <div className="text-center">
                    <p className="text-sm font-bold text-white">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem('gencourse_mock_mode');
                    localStorage.removeItem('gencourse_token');
                    const apiBase = import.meta.env.VITE_API_BASE_URL || '';
                    window.location.href = `${apiBase}/auth/logout`;
                  }}
                  className="w-full py-3 text-center text-red-400 font-semibold border border-red-500/20 rounded-xl hover:bg-red-500/10 active:bg-red-500/20 transition cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  localStorage.removeItem('gencourse_mock_mode');
                  const apiBase = import.meta.env.VITE_API_BASE_URL || '';
                  window.location.href = `${apiBase}/auth/login`;
                }}
                className="w-full py-3 text-center text-gray-300 hover:text-cyan-primary font-semibold border border-white/10 rounded-xl hover:bg-white/10 active:bg-white/15 transition cursor-pointer"
              >
                Sign In
              </button>
            )}

            <a
              href="#demo"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-3 text-center bg-gradient-to-r from-purple-primary to-cyan-primary rounded-xl text-white font-semibold hover:opacity-90 active:scale-[0.98] transition shadow-lg flex items-center justify-center gap-2"
            >
              Generate Free Course
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
