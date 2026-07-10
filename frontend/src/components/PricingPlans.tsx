import { Check, Sparkles, Zap, Shield, ArrowRight } from 'lucide-react'

export default function PricingPlans() {
  const handleAuthRedirect = (planType: string) => {
    localStorage.removeItem('gencourse_mock_mode')
    const apiBase = import.meta.env.VITE_API_BASE_URL || ''
    window.location.href = `${apiBase}/auth/login?plan=${planType}`
  }

  const plans = [
    {
      name: 'Free Starter',
      desc: 'Best for curious students and solo self-learners exploring core AI capabilities.',
      price: '₹0',
      period: 'forever',
      cta: 'Get Started Free',
      type: 'free',
      icon: Zap,
      iconColor: 'text-cyan-primary',
      bgGlow: 'bg-cyan-500/3',
      borderColor: 'border-white/5',
      badge: '',
      features: [
        '3 generated AI course outlines / month',
        'Standard interactive simulator player',
        'Single-language course configurations',
        'Community forum support channels'
      ]
    },
    {
      name: 'Premium Educator',
      desc: 'Unlock unlimited generation capabilities, full AI tutoring support, and rich handbook exports.',
      price: '₹3,999',
      period: 'month',
      cta: 'Upgrade to Premium',
      type: 'premium',
      icon: Sparkles,
      iconColor: 'text-purple-primary',
      bgGlow: 'bg-purple-primary/5',
      borderColor: 'border-purple-primary/30 shadow-[0_0_20px_rgba(124,58,237,0.12)]',
      badge: 'Most Popular',
      features: [
        'Unlimited AI course outline generations',
        'Advanced AI Tutor sidebar chat assistant',
        'Multilingual course outline compilations',
        'Export textbook modules as Markdown',
        'Export full course Handbooks as PDF',
        'SCORM & LTI package export downloads'
      ]
    },
    {
      name: 'Academy Enterprise',
      desc: 'For universities, academic institutions, and organizations requiring dedicated controls.',
      price: 'Custom',
      period: 'tailored pricing',
      cta: 'Contact Sales',
      type: 'enterprise',
      icon: Shield,
      iconColor: 'text-amber-400',
      bgGlow: 'bg-amber-500/3',
      borderColor: 'border-white/5',
      badge: '',
      features: [
        'Everything included in Premium Educator',
        'Unlimited seats with individual student portals',
        'Fine-tuned custom LLM integration adapters',
        'Custom brands, colors, and white-labeling',
        '99.9% uptime SLA & dedicated account manager',
        'API endpoint tokens with custom quotas'
      ]
    }
  ]

  return (
    <section id="pricing" className="py-24 bg-[#030014] relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-purple-primary/5 blur-3xl pointer-events-none rounded-full"></div>
      <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-96 h-96 bg-cyan-primary/5 blur-3xl pointer-events-none rounded-full"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="px-3 py-1 rounded-full bg-cyan-primary/10 border border-cyan-primary/20 text-[10px] text-cyan-primary font-bold uppercase tracking-widest block w-fit mx-auto">
            Flexible Billing
          </span>
          <h2 className="font-display font-bold text-3xl md:text-5xl text-white">
            Pricing Plans for Every Creator
          </h2>
          <p className="font-sans text-gray-400 text-xs md:text-sm leading-relaxed">
            Choose the perfect plan to generate interactive curricula, explore modules with AI tutors, and deploy content directly to external LMS systems.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isFeatured = plan.type === 'premium'

            return (
              <div
                key={plan.name}
                className={`relative rounded-3xl p-8 bg-[#09061a]/60 border backdrop-blur-md transition-all duration-300 flex flex-col justify-between gap-8 hover:scale-[1.02] ${plan.borderColor} ${plan.bgGlow}`}
              >
                {/* Featured Badge */}
                {plan.badge && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-primary to-cyan-primary text-white text-[9px] font-bold uppercase tracking-wider shadow-lg animate-pulse">
                    {plan.badge}
                  </span>
                )}

                <div className="space-y-6">
                  {/* Card Header */}
                  <div className="space-y-4">
                    <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${plan.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-white">{plan.name}</h3>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed min-h-[48px]">
                        {plan.desc}
                      </p>
                    </div>
                  </div>

                  {/* Pricing Rate */}
                  <div className="flex items-baseline gap-1.5 border-t border-white/5 pt-5">
                    <span className="font-display font-extrabold text-3xl md:text-4xl text-white">
                      {plan.price}
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium">
                      / {plan.period}
                    </span>
                  </div>

                  {/* Bullet Features */}
                  <ul className="space-y-3 pt-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-300 leading-relaxed font-sans">
                        <Check className="w-4 h-4 text-cyan-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Call To Action */}
                <button
                  onClick={() => handleAuthRedirect(plan.type)}
                  className={`w-full py-3.5 px-4 rounded-2xl text-xs font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 border ${
                    isFeatured
                      ? 'bg-gradient-to-r from-purple-primary to-cyan-primary border-transparent text-white shadow-[0_4px_15px_rgba(124,58,237,0.25)] hover:opacity-95'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>{plan.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
