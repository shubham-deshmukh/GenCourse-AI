import {
  BookOpen,
  Video,
  FileDown,
  Languages,
  Award,
  Zap
} from 'lucide-react'

const FEATURE_LIST = [
  {
    icon: Zap,
    title: 'Instant Curriculum Architect',
    desc: 'Input any text prompt and our agent compiles a fully structured learning curriculum including outcomes and dependencies.',
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
  },
  {
    icon: BookOpen,
    title: 'Deep Modular Lesson Books',
    desc: 'Each module contains extensive textbook-style reading sheets with code highlights, key takeaways, and summary points.',
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
  },
  {
    icon: Video,
    title: 'Curated Video Lectures',
    desc: 'Automatically curates and integrates highly relevant YouTube lectures and tutorials to supplement each lesson module with visual learning.',
    color: 'text-pink-400 bg-pink-500/10 border-pink-500/20'
  },
  {
    icon: FileDown,
    title: 'Exportable Workbooks',
    desc: 'Automatically package generated lessons and cheat sheets into beautiful, downloadable PDF files for offline learning.',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  },
  {
    icon: Languages,
    title: 'Instant Multilingualism',
    desc: 'Seamlessly translate your generated modules and slide decks into multiple languages with precise technical terms preservation.',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
  },
  {
    icon: Award,
    title: 'Automated Quizzes',
    desc: 'AI builds comprehensive knowledge checkups and interactive questionnaires aligned directly to your target objectives.',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
  }
]

export default function Features() {
  return (
    <section id="features" className="py-24 bg-[#030014] relative">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] rounded-full bg-purple-primary/5 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-cyan-primary/5 blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-cyan-primary uppercase tracking-widest bg-cyan-primary/10 px-3 py-1 rounded-full border border-cyan-primary/20">
            Core Features
          </span>
          <h2 className="font-display font-bold text-3xl md:text-5xl text-white mt-4 mb-4">
            Everything You Need To Teach
          </h2>
          <p className="font-sans text-gray-400 text-lg max-w-2xl mx-auto">
            From outlines to assessments, GenCourse AI delivers ready-to-publish learning systems in seconds.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURE_LIST.map((feat) => {
            const Icon = feat.icon
            return (
              <div
                key={feat.title}
                className="glass-card rounded-2xl p-8 border border-white/5 flex flex-col justify-between"
              >
                <div>
                  {/* Icon Frame */}
                  <div className={`inline-flex p-3 rounded-xl border mb-6 ${feat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  {/* Text details */}
                  <h3 className="font-display font-bold text-lg text-white mb-3">
                    {feat.title}
                  </h3>
                  <p className="font-sans text-sm text-gray-400 leading-relaxed mb-6">
                    {feat.desc}
                  </p>
                </div>

                <div className="pt-2">
                  <span className="text-xs font-semibold text-cyan-300 hover:text-white transition flex items-center gap-1 cursor-pointer">
                    Learn more &rarr;
                  </span>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
