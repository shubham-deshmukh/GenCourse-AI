import { Sparkles, Network, BookOpen, CheckSquare, Globe } from 'lucide-react'

const PIPELINE_NODES = [
  {
    icon: Sparkles,
    label: '1. Topic Analyzer',
    desc: 'Analyzes the prompt, target audience, and sets key objectives.',
    color: 'from-purple-500 to-indigo-600'
  },
  {
    icon: Network,
    label: '2. Curriculum Planner',
    desc: 'Designs the module outline, lesson hierarchy, and flows.',
    color: 'from-indigo-600 to-cyan-500'
  },
  {
    icon: BookOpen,
    label: '3. Lesson Generator',
    desc: 'Writes lesson materials, slides, and voiceover scripts.',
    color: 'from-cyan-500 to-teal-500'
  },
  {
    icon: CheckSquare,
    label: '4. Quiz Builder',
    desc: 'Constructs module quizzes and concept verification checks.',
    color: 'from-teal-500 to-emerald-500'
  },
  {
    icon: Globe,
    label: '5. Publishing Layer',
    desc: 'Compiles localized portals, audio files, and exports PDFs.',
    color: 'from-emerald-500 to-purple-500'
  }
]

export default function Workflow() {
  return (
    <section id="workflow" className="py-24 bg-[#030014] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-purple-primary uppercase tracking-widest bg-purple-primary/10 px-3 py-1 rounded-full border border-purple-primary/20">
            Course Pipeline
          </span>
          <h2 className="font-display font-bold text-3xl md:text-5xl text-white mt-4 mb-4">
            How The Course Engine Works
          </h2>
          <p className="font-sans text-gray-400 text-lg max-w-2xl mx-auto">
            Our generation engine coordinates to analyze, plan, write, and publish custom-tailored online courses.
          </p>
        </div>

        {/* Nodes Visualizer */}
        <div className="relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-4 right-4 h-0.5 bg-gradient-to-r from-purple-primary via-cyan-primary to-pink-primary -translate-y-1/2 z-0 opacity-30"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 relative z-10">
            {PIPELINE_NODES.map((node, idx) => {
              const Icon = node.icon
              return (
                <div key={node.label} className="flex flex-col items-center text-center group">
                  
                  {/* Floating Circle Icon */}
                  <div className="relative mb-6">
                    {/* Ring glow */}
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-primary to-cyan-primary opacity-30 group-hover:opacity-100 blur transition-all duration-500"></div>
                    
                    {/* Core circle */}
                    <div className="relative w-16 h-16 rounded-full bg-[#030014] border border-white/10 flex items-center justify-center text-white group-hover:border-cyan-primary transition duration-300">
                      <Icon className="w-6 h-6 text-cyan-200 group-hover:text-cyan-primary transition duration-300" />
                    </div>

                    {/* Step number badge */}
                    <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-to-br from-purple-primary to-cyan-primary text-[10px] font-bold text-white flex items-center justify-center border border-[#030014]">
                      {idx + 1}
                    </div>
                  </div>

                  {/* Title & Info */}
                  <div className="px-2">
                    <h4 className="font-display font-bold text-white text-sm mb-2 group-hover:text-cyan-primary transition duration-300">
                      {node.label}
                    </h4>
                    <p className="font-sans text-[11px] text-gray-400 leading-relaxed">
                      {node.desc}
                    </p>
                  </div>

                </div>
              )
            })}
          </div>
        </div>

        {/* Technical Callout */}
        <div className="mt-16 p-6 rounded-2xl glass-panel border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-primary/10 text-cyan-300 border border-cyan-primary/20">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-display text-sm font-bold text-white">Directed Acyclic Learning Graphs</h4>
              <p className="text-xs text-gray-400 mt-1 max-w-md">
                Course modules are created and organized as structural graphs, matching learning path requirements without duplicates.
              </p>
            </div>
          </div>
          <a
            href="#demo"
            className="px-5 py-2.5 rounded-full border border-white/15 hover:border-cyan-primary/50 text-xs font-semibold text-gray-300 hover:text-white transition cursor-pointer"
          >
            Watch Simulator
          </a>
        </div>

      </div>
    </section>
  )
}
