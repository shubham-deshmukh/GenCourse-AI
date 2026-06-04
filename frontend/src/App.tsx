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

// Configure Axios request interceptor to append the X-Mock-User header when mock mode is active
axios.interceptors.request.use((config) => {
  const isMock = localStorage.getItem('gencourse_mock_mode') === 'true';
  if (isMock) {
    config.headers['X-Mock-User'] = 'true';
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
    const params = new URLSearchParams(window.location.search);
    const isMockUrl = params.get('mockUser') === 'true';

    // Store mock mode setting in localStorage to persist across reloads
    if (isMockUrl) {
      localStorage.setItem('gencourse_mock_mode', 'true');
    }

    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/auth/me');
        const user = response.data;
        setAuthState(user, true, false);
      } catch (err) {
        // If unauthenticated or token expires, reset store state
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
