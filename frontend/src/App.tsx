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

export default function App() {
  const [prompt, setPrompt] = useState('Intro to React Hooks')
  const [isGenerating, setIsGenerating] = useState(false)

  const { isAuthenticated, setAuthState } = useAuthStore()

  useEffect(() => {
    // Check for token or error in URL hash
    const hash = window.location.hash;
    if (hash) {
      if (hash.startsWith('#token=')) {
        const token = hash.split('#token=')[1];
        localStorage.setItem('gencourse_token', token);
        // Clear mock mode if switching to real token auth
        localStorage.removeItem('gencourse_mock_mode');
      } else if (hash.startsWith('#error=')) {
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
      } catch (err) {
        // If unauthenticated or token expires, clean up storage and state
        localStorage.removeItem('gencourse_token');
        setAuthState(null, false, false);
      }
    };

    checkAuth();
  }, [setAuthState])

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
