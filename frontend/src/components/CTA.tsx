import { ArrowRight, Sparkles } from 'lucide-react'

export default function CTA() {
  return (
    <section className="py-20 bg-[#030014] relative overflow-hidden">
      {/* Background neon glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.12),transparent_60%)] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="relative rounded-3xl glass-panel border border-white/10 overflow-hidden p-12 md:p-16 text-center shadow-2xl">
          {/* Internal floating background bubbles */}
          <div className="absolute -top-12 -left-12 w-44 h-44 rounded-full bg-purple-primary/10 blur-2xl"></div>
          <div className="absolute -bottom-12 -right-12 w-44 h-44 rounded-full bg-cyan-primary/10 blur-2xl"></div>

          {/* Icon Badge */}
          <div className="inline-flex p-3 rounded-full bg-white/5 border border-white/10 text-cyan-300 mb-6 animate-float">
            <Sparkles className="w-6 h-6 text-cyan-primary" />
          </div>

          {/* Heading */}
          <h2 className="font-display font-bold text-3xl md:text-5xl text-white max-w-2xl mx-auto mb-6 leading-tight">
            Ready to Build Your Structured Learning Experience?
          </h2>

          {/* Description */}
          <p className="font-sans text-gray-400 text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Enter your custom educational topic, choose your preferences, and let our agents construct your complete academy package.
          </p>

          {/* Action Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => {
                localStorage.removeItem('gencourse_mock_mode');
                const apiBase = import.meta.env.VITE_API_BASE_URL || '';
                window.location.href = `${apiBase}/auth/login?screen_hint=signup`;
              }}
              className="btn-glow flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-purple-primary via-indigo-600 to-cyan-primary text-white font-semibold shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="#features"
              className="px-8 py-4 rounded-full border border-white/10 hover:border-white/20 text-gray-300 hover:text-white font-semibold transition cursor-pointer"
            >
              Explore Tech Features
            </a>
          </div>

          {/* Metrics / Social Proof */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-12 border-t border-white/5 max-w-4xl mx-auto">
            <div>
              <span className="block font-display font-extrabold text-2xl text-white">100k+</span>
              <span className="block text-xs text-gray-500 mt-1">Courses Generated</span>
            </div>
            <div>
              <span className="block font-display font-extrabold text-2xl text-white">99.8%</span>
              <span className="block text-xs text-gray-500 mt-1">Linguistics Accuracy</span>
            </div>
            <div>
              <span className="block font-display font-extrabold text-2xl text-white">&lt; 30s</span>
              <span className="block text-xs text-gray-500 mt-1">Compile Time</span>
            </div>
            <div>
              <span className="block font-display font-extrabold text-2xl text-white">4.9/5</span>
              <span className="block text-xs text-gray-500 mt-1">Creator Rating</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
