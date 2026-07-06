import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuthStore } from './store/useAuthStore'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import InteractiveSimulator from './components/InteractiveSimulator'
import Workflow from './components/Workflow'
import Features from './components/Features'
import CTA from './components/CTA'
import Footer from './components/Footer'
import PremiumDashboard from './components/PremiumDashboard'

// Set Axios baseURL from environment variables (direct backend connection)
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || '';
axios.defaults.withCredentials = true;

// Configure Axios request interceptor to append headers for auth
axios.interceptors.request.use((config) => {
  const isMock = localStorage.getItem('gencourse_mock_mode') === 'true';
  if (isMock) {
    config.headers['X-Mock-User'] = 'true';
  }

  const token = localStorage.getItem('gencourse_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Configure Axios response interceptor to handle mid-session authentication expiry (401 errors)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and reset authentication state globally
      localStorage.removeItem('gencourse_token');
      useAuthStore.getState().logoutState();
    }
    return Promise.reject(error);
  }
);

export default function App() {
  const [prompt, setPrompt] = useState('Intro to React Hooks')
  const [isGenerating, setIsGenerating] = useState(false)

  const { isAuthenticated, isLoading, setAuthState } = useAuthStore()

  useEffect(() => {
    // Check for error in URL hash
    const hash = window.location.hash;
    if (hash) {
      if (hash.startsWith('#error=')) {
        const errorMsg = decodeURIComponent(hash.split('#error=')[1]);
        console.error('Authentication error:', errorMsg);
        alert(`Authentication failed: ${errorMsg}`);
      }
      // Remove hash from URL without page reload
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    const params = new URLSearchParams(window.location.search);
    const isMockUrl = params.get('mockUser') === 'true';

    // Store mock mode setting in localStorage to persist across reloads
    if (isMockUrl) {
      localStorage.setItem('gencourse_mock_mode', 'true');
      localStorage.removeItem('gencourse_token'); // Clear token if explicitly entering mock mode
    }

    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/auth/me');
        const user = response.data;
        setAuthState(user, true, false);
      } catch (_err) {
        // If unauthenticated or token expires, clean up storage and state
        localStorage.removeItem('gencourse_token');
        setAuthState(null, false, false);
      }
    };

    checkAuth();
  }, [setAuthState])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#030014] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-primary/40 border-t-purple-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleGenerate = (topic?: string) => {
    if (topic) {
      setPrompt(topic)
    }

    setIsGenerating(true)

    // Smooth scroll to the interactive generator simulator
    setTimeout(() => {
      const demoSection = document.getElementById('demo')
      if (demoSection) {
        demoSection.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  return (
    <div className="min-h-screen bg-[#030014] text-white selection:bg-purple-primary/30 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Background glow canvas */}
      <div className="fixed inset-0 bg-[#030014] -z-20"></div>
      <div className="fixed top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-purple-primary/10 via-transparent to-transparent -z-10 blur-3xl pointer-events-none"></div>

      {/* Navigation */}
      {!isAuthenticated && <Navbar />}

      {isAuthenticated ? (
        <PremiumDashboard />
      ) : (
        /* Landing Page Content Blocks */
        <main>
          {/* Hero Section */}
          <Hero
            prompt={prompt}
            setPrompt={setPrompt}
            onGenerate={handleGenerate}
          />

          {/* Live Interactive Simulator Workspace */}
          <InteractiveSimulator
            prompt={prompt}
            setPrompt={setPrompt}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
          />

          {/* AI agent workflow pipeline visualizer */}
          <Workflow />

          {/* Features Grids */}
          <Features />

          {/* CTA Banners */}
          <CTA />
        </main>
      )}

      {/* Footer */}
      {!isAuthenticated && <Footer />}
    </div>
  )
}
