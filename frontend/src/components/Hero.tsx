import { ArrowRight, Sparkles } from 'lucide-react'

interface HeroProps {
  prompt: string
  setPrompt: (val: string) => void
  onGenerate: (topic?: string) => void
}

const STARTER_PROMPTS = [
  'Intro to React Hooks',
  'Basics of Copyright Law',
  'Quantum Mechanics for Beginners',
  'Acoustic Guitar 101'
]

export default function Hero({ prompt, setPrompt, onGenerate }: HeroProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onGenerate()
  }

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-grid-pattern bg-[#030014]">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] md:w-[800px] md:h-[800px] rounded-full bg-radial from-purple-primary/15 via-transparent to-transparent blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-cyan-primary/10 blur-3xl pointer-events-none animate-pulse-slow"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Floating Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-xs md:text-sm text-cyan-200 border-white/10 mb-8 animate-float">
          <Sparkles className="w-4 h-4 text-cyan-primary animate-pulse" />
          <span>Next-Generation Course Generation Pipeline</span>
        </div>

        {/* Heading */}
        <h1 className="font-display font-extrabold text-4xl md:text-6xl lg:text-7xl leading-tight tracking-tight max-w-5xl mx-auto mb-6">
          Transform Any Topic Into a{' '}
          <span className="text-gradient">Structured Online Course</span>
        </h1>

        {/* Subtext */}
        <p className="font-sans text-gray-400 text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed">
          Input any prompt. Our agentic AI generates a complete course outline, deep modular lessons, audio scripts, PDF learning guides, and multilingual translations instantly.
        </p>

        {/* Generator Input Form */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-8 px-2">
          <div className="relative flex items-center p-1.5 rounded-full bg-white/5 border border-white/10 focus-within:border-purple-primary/50 focus-within:shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all duration-300">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What do you want to learn today? (e.g. Intro to React Hooks)"
              className="w-full px-5 py-3.5 bg-transparent border-none text-white placeholder-gray-500 focus:outline-none text-base md:text-lg"
              required
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-6 py-3.5 md:px-8 rounded-full bg-gradient-to-r from-purple-primary via-indigo-600 to-cyan-primary hover:opacity-95 text-white font-semibold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer whitespace-nowrap"
            >
              Generate
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Starter Prompts */}
        <div className="flex flex-wrap justify-center items-center gap-3 max-w-3xl mx-auto">
          <span className="text-sm text-gray-500 font-medium">Try these:</span>
          {STARTER_PROMPTS.map((starter) => (
            <button
              key={starter}
              onClick={() => onGenerate(starter)}
              className="px-4 py-2 rounded-full glass-card text-xs md:text-sm text-gray-300 hover:text-white cursor-pointer hover:bg-white/10 transition border border-white/5"
            >
              {starter}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
