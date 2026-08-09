import React, { useState, useEffect } from 'react';
import { ArrowRight, Star, Check, ExternalLink, TrendingUp, Award, Briefcase, Code, Palette, Layers, Rocket, MessageSquare, ChevronRight, Zap } from 'lucide-react';
import SeoHelmet from '../SeoHelmet';
import ScrollReveal from '../ScrollReveal';
import { StaggerContainer, StaggerItem, HoverScale } from '../ScrollReveal';
import { proxyImageUrl } from '../../utils/safeRender';

interface PortfolioPageProps {
  onNavigate: (route: string, param?: string) => void;
}

const stats = [
  { value: '150+', label: 'Projects Completed' },
  { value: '10+', label: 'Years Experience' },
  { value: '40+', label: 'Happy Clients' },
  { value: '15+', label: 'Countries Served' },
  { value: '99%', label: 'Client Satisfaction' },
  { value: '20M+', label: 'Organic Impressions' },
  { value: '500K+', label: 'Monthly Users' },
];

const caseStudies = [
  {
    id: 'dawnwire',
    title: 'DawnWire',
    positioning: 'Affiliate Marketing Platform',
    category: 'SEO + Affiliate',
    description: 'A premium content platform helping users discover products through in-depth reviews, buying guides, comparison tables, affiliate recommendations, and expert insights.',
    highlights: ['SEO Optimized', 'Affiliate Engine', 'Product Reviews', 'Buying Guides', 'Comparison Tables', 'Case Studies'],
    techStack: ['WordPress', 'Affiliate Systems', 'SEO', 'Schema', 'Analytics', 'Amazon Affiliate', 'Content Engine'],
    cta: 'View Platform',
    image: '/portfolio/portfolio-image-1.png',
    accent: 'from-blue-600 to-blue-400',
    shadowColor: 'shadow-blue-100/30',
    badgeColor: 'bg-blue-50 text-blue-600',
  },
  {
    id: 'help-me-exit',
    title: 'Help Me Exit',
    positioning: 'AI CRM & Lead Automation',
    category: 'AI Automation \u2022 CRM \u2022 Voice AI',
    description: 'Built automation workflows, AI voice calls, lead nurturing, appointment scheduling, and CRM integrations for the timeshare industry.',
    highlights: ['GoHighLevel Automation', 'AI Voice Calling', 'Twilio Integration', 'CRM Workflows', 'Lead Nurturing', 'Appointment Scheduling'],
    techStack: ['GoHighLevel', 'OpenAI', 'Twilio', 'CRM', 'Automation', 'Webhooks', 'Zapier/Make'],
    cta: 'View Automation',
    image: '/portfolio/help-me-exit.png',
    accent: 'from-dw-blue to-dw-orange',
    shadowColor: 'shadow-orange-100/30',
    badgeColor: 'bg-dw-blue/10 text-dw-blue',
  },
  {
    id: 'datadrivenhq',
    title: 'DataDrivenHQ',
    positioning: 'Digital Growth Agency',
    category: 'Agency Website \u2022 AI Systems \u2022 Internal Automation',
    description: 'Built an agency website, AI systems, internal automations, client dashboards, proposal systems, branding assets, and portfolio management workflows.',
    highlights: ['Agency Website', 'AI Systems', 'Client Dashboards', 'Proposal Automation', 'Branding', 'Portfolio System'],
    techStack: ['WordPress', 'AI Tools', 'Automation', 'CRM', 'Analytics', 'Design Systems', 'Client Dashboards'],
    cta: 'Explore Project',
    image: '/portfolio/portfolio-image-1.png',
    accent: 'from-cyan-600 to-blue-500',
    shadowColor: 'shadow-cyan-100/30',
    badgeColor: 'bg-cyan-50 text-cyan-600',
  },
];

const services = [
  { title: 'AI Automation', items: ['OpenAI', 'Chatbots', 'Voice AI', 'Workflows', 'CRM', 'Lead Nurturing'], desc: 'Automated systems that save time, qualify leads, trigger workflows, and improve business operations.', img: '/images/services/ai-automation.png' },
  { title: 'Website Development', items: ['WordPress', 'Next.js', 'React', 'WooCommerce', 'Custom CMS', 'Landing Pages'], desc: 'Fast, scalable, conversion-focused websites built for performance, SEO, and growth.', img: '/images/services/web-dev.png' },
  { title: 'SEO', items: ['Technical SEO', 'Content', 'AEO', 'Schema', 'Core Web Vitals', 'Search Console'], desc: 'Search strategies that improve rankings, crawlability, authority, and organic traffic.', img: '/images/services/seo-icon.png' },
  { title: 'Digital Marketing', items: ['Google Ads', 'Meta Ads', 'Analytics', 'Funnels', 'Automation', 'Retargeting'], desc: 'Campaigns and funnels designed to attract, convert, and retain high-intent customers.', img: '/images/services/digital-marketing.png' },
  { title: 'Custom Plugins', items: ['WordPress Plugins', 'WooCommerce', 'API Integration', 'Automation', 'Custom Dashboards', 'Data Sync'], desc: 'Custom tools, plugins, and integrations that extend website functionality and automate operations.', img: '/images/services/custom-plugins.png' },
  { title: 'Affiliate Systems', items: ['Amazon', 'Comparison Tables', 'Review Engine', 'SEO', 'Buying Guides', 'Tracking'], desc: 'Affiliate platforms built around search intent, review content, comparison flows, and conversion tracking.', img: '/images/services/affiliate-systems.png' },
];

const techStack = ['WordPress', 'WooCommerce', 'Next.js', 'React', 'Tailwind', 'Node.js', 'PHP', 'MySQL', 'Supabase', 'Firebase', 'Google APIs', 'OpenAI', 'Cloudflare', 'Hostinger', 'Vercel', 'GitHub', 'Elementor', 'GoHighLevel', 'Twilio', 'Redis', 'Stripe', 'GA4', 'Google Tag Manager', 'Google Search Console'];

const processSteps = [
  { step: '01', title: 'Discovery', desc: 'Understanding business goals, audience, challenges, and growth opportunities.', icon: Layers },
  { step: '02', title: 'Planning', desc: 'Architecture, wireframes, technical strategy, SEO planning, and project roadmap.', icon: Palette },
  { step: '03', title: 'Design', desc: 'Modern UI/UX focused on clarity, trust, conversions, and brand positioning.', icon: Code },
  { step: '04', title: 'Development', desc: 'Clean, scalable, high-performance development using the right technology stack.', icon: Rocket },
  { step: '05', title: 'Optimization', desc: 'SEO, speed, accessibility, analytics, tracking, automation, and conversion improvements.', icon: TrendingUp },
  { step: '06', title: 'Launch', desc: 'Deployment, monitoring, QA, performance checks, and continuous improvement.', icon: Award },
];

const benefits = [
  '10+ Years Experience', 'Performance First', 'SEO & AEO Focused', 'AI Integration Expert',
  'WordPress Specialist', 'Custom Development', 'Business Automation', 'Long-Term Support',
  'Affiliate Growth Systems', 'eCommerce Optimization', 'Technical Problem Solving', 'Conversion-Focused Strategy',
];

export default function PortfolioPage({ onNavigate }: PortfolioPageProps) {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/testimonials')
      .then(r => r.json())
      .then(list => setTestimonials(Array.isArray(list) ? list : []))
      .catch(() => setTestimonials([]))
      .finally(() => setTestimonialsLoading(false));
  }, []);
  return (
    <>
      <SeoHelmet
        title="Portfolio | DawnWire Digital Products, AI Automation, SEO & Web Development"
        description="Explore DawnWire's portfolio of digital products, eCommerce platforms, AI automations, SEO systems, WordPress development, affiliate platforms, and growth-focused websites."
        canonical="/portfolio"
        ogType="website"
      />

      <div className="bg-[#f8f9fc]">
        {/* ===== HERO ===== */}
        <section className="relative overflow-hidden bg-white">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-blue-50/50 to-transparent pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-blue-100/30 blur-3xl pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <ScrollReveal variant="fadeDown">
                  <div className="inline-flex items-center gap-1.5 bg-blue-100/70 rounded-full px-3.5 py-1.5 shadow-sm">
                    <Star className="w-3.5 h-3.5 text-[#246BFF]" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#246BFF]">Portfolio</span>
                  </div>
                  <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-slate-900 dark:text-white tracking-tight leading-tight">
                    Building Digital Products That Deliver Real Results.
                  </h1>
                  <p className="text-lg text-gray-500 leading-relaxed max-w-lg">
                    From custom websites and AI-powered automations to SEO strategies, WordPress development, eCommerce systems, and affiliate platforms, every project is designed with one goal — helping businesses grow faster through technology.
                  </p>
                </ScrollReveal>
                <ScrollReveal variant="fadeUp">
                  <div className="flex flex-wrap gap-4">
                    <button onClick={() => onNavigate('portfolio', caseStudies[0].id)} className="inline-flex items-center gap-2 bg-[#246BFF] hover:bg-blue-600 text-white font-semibold text-sm px-7 py-3.5 rounded-lg shadow-lg shadow-blue-200 hover:shadow-xl transition-all cursor-pointer">
                      View Projects <ArrowRight className="w-4 h-4" />
                    </button>
                    <button onClick={() => onNavigate('contact')} className="inline-flex items-center gap-2 bg-white text-slate-900 dark:text-white font-semibold text-sm px-7 py-3.5 rounded-lg border border-gray-200 hover:border-[#246BFF] hover:text-[#246BFF] shadow-sm hover:shadow-md transition-all cursor-pointer">
                      Let's Work Together
                    </button>
                  </div>
                </ScrollReveal>
              </div>
              <div className="relative">
                <div className="absolute -bottom-4 -right-4 w-full h-full rounded-2xl bg-[#246BFF]/5 border border-[#246BFF]/10" />
                <img src="/portfolio/hero-visual.png" alt="DawnWire portfolio showcase" className="relative w-full h-auto rounded-2xl shadow-2xl shadow-gray-200/60" loading="lazy" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            </div>
          </div>
        </section>

        {/* ===== STATS ===== */}
        <section className="py-16 md:py-20 bg-white border-t border-gray-50">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 md:gap-6">
              {stats.map((s, i) => (
                <div key={i} className="text-center p-4 md:p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <p className="font-display font-bold text-2xl md:text-3xl bg-gradient-to-br from-[#246BFF] to-blue-400 bg-clip-text text-transparent">{s.value}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FEATURED CASE STUDIES ===== */}
        <section className="py-20 md:py-24 bg-[#f8f9fc]">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <div className="inline-flex items-center gap-1.5 bg-blue-100/70 rounded-full px-3.5 py-1.5 shadow-sm mb-4">
                <Briefcase className="w-3.5 h-3.5 text-[#246BFF]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#246BFF]">Featured Projects</span>
              </div>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-slate-900 dark:text-white tracking-tight">Featured Case Studies</h2>
              <p className="text-gray-500 mt-3 leading-relaxed">Real businesses. Real challenges. Real results.</p>
            </div>
            <StaggerContainer>
              <div className="space-y-8">
                {caseStudies.map((project, idx) => (
                  <StaggerItem key={project.id}>
                    <HoverScale>
                      <div className={`group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl ${project.shadowColor} hover:-translate-y-1 transition-all duration-300 overflow-hidden ${idx % 2 === 1 ? 'md:flex md:flex-row-reverse' : 'md:flex'}`}>
                        <div className="md:w-1/2 relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 min-h-[280px]">
                          <img src={project.image} alt={project.title} className="w-full h-full absolute inset-0 object-contain p-4 group-hover:scale-105 transition-transform duration-700" loading="lazy" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                        <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-center">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full inline self-start mb-3 ${project.badgeColor}`}>{project.category}</span>
                          <h3 className="font-display font-bold text-2xl text-slate-900 dark:text-white mb-1">{project.title}</h3>
                          <p className="text-sm text-[#246BFF] font-semibold mb-4">{project.positioning}</p>
                          <p className="text-sm text-gray-500 leading-relaxed mb-5">{project.description}</p>
                          <div className="grid grid-cols-2 gap-2 mb-6">
                            {project.highlights.map((h, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                <span className="text-xs text-gray-600">{h}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-6">
                            {project.techStack.map((t, i) => (
                              <span key={i} className="text-[9px] font-bold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">{t}</span>
                            ))}
                          </div>
                          <button onClick={() => onNavigate('portfolio', project.id)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#246BFF] hover:text-white bg-transparent hover:bg-[#246BFF] border border-[#246BFF] px-5 py-2.5 rounded-lg transition-all self-start cursor-pointer">
                            {project.cta} <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </HoverScale>
                  </StaggerItem>
                ))}
              </div>
            </StaggerContainer>
          </div>
        </section>

        {/* ===== WHAT I BUILD ===== */}
        <section className="py-20 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <div className="inline-flex items-center gap-1.5 bg-blue-100/70 rounded-full px-3.5 py-1.5 shadow-sm mb-4">
                <Zap className="w-3.5 h-3.5 text-[#246BFF]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#246BFF]">Services</span>
              </div>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-slate-900 dark:text-white tracking-tight">What I Build</h2>
              <p className="text-gray-500 mt-3 leading-relaxed">Digital systems designed to improve visibility, automate workflows, generate leads, and scale business growth.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((svc, i) => (
                <div key={i} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-100/20 hover:-translate-y-1 transition-all duration-300 p-6 md:p-8">
                  <div className="flex items-center gap-[18px] mb-6">
                    <div className="w-16 h-16 rounded-[18px] bg-[#eef5ff] flex items-center justify-center shrink-0">
                      <img src={svc.img} alt={svc.title} className="w-10 h-10 object-contain block" loading="lazy" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                    <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">{svc.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed mb-5">{svc.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {svc.items.map((item, j) => (
                      <span key={j} className="text-[9px] font-bold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full hover:bg-[#246BFF] hover:text-white transition-colors">{item}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== TECHNOLOGY STACK ===== */}
        <section className="py-20 md:py-24 bg-[#f8f9fc]">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center gap-1.5 bg-blue-100/70 rounded-full px-3.5 py-1.5 shadow-sm mb-4">
                <Code className="w-3.5 h-3.5 text-[#246BFF]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#246BFF]">Technology Stack</span>
              </div>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-slate-900 dark:text-white tracking-tight">Tools, Platforms, and Technologies I Work With</h2>
              <p className="text-gray-500 mt-3 leading-relaxed">From WordPress and WooCommerce to AI APIs, automation tools, analytics, and modern frontend frameworks.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2.5 max-w-4xl mx-auto">
              {techStack.map((tech, i) => (
                <span key={i} className="bg-white border border-gray-100 text-gray-600 text-[11px] font-bold px-4 py-2 rounded-full shadow-sm hover:border-[#246BFF] hover:text-[#246BFF] hover:shadow-md transition-all duration-200 cursor-default">{tech}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ===== PROCESS ===== */}
        <section className="py-20 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <div className="inline-flex items-center gap-1.5 bg-blue-100/70 rounded-full px-3.5 py-1.5 shadow-sm mb-4">
                <Layers className="w-3.5 h-3.5 text-[#246BFF]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#246BFF]">Process</span>
              </div>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-slate-900 dark:text-white tracking-tight">A Clear Process From Strategy to Launch</h2>
              <p className="text-gray-500 mt-3 leading-relaxed">Every project follows a structured workflow focused on clarity, performance, scalability, and measurable outcomes.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-6">
              {processSteps.map((step, i) => (
                <div key={i} className="relative group">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-100/20 hover:-translate-y-1 transition-all duration-300 p-6 text-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#246BFF] to-blue-400 flex items-center justify-center mx-auto mb-4">
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-[#246BFF] uppercase tracking-wider block mb-1">{step.step}</span>
                    <h3 className="font-display font-bold text-base text-slate-900 dark:text-white mb-2">{step.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                  </div>
                  {i < processSteps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 z-10 text-[#246BFF]">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== WHY WORK WITH ME ===== */}
        <section className="py-20 md:py-24 bg-[#f8f9fc]">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <div className="inline-flex items-center gap-1.5 bg-blue-100/70 rounded-full px-3.5 py-1.5 shadow-sm mb-4">
                <Star className="w-3.5 h-3.5 text-[#246BFF]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#246BFF]">Why DawnWire</span>
              </div>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-slate-900 dark:text-white tracking-tight">Why Work With Me</h2>
              <p className="text-gray-500 mt-3 leading-relaxed">DawnWire combines strategy, development, SEO, AI automation, and digital growth thinking into one execution-focused partner.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-[#246BFF]/20 transition-all">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== TESTIMONIALS ===== */}
        <section className="py-20 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <div className="inline-flex items-center gap-1.5 bg-blue-100/70 rounded-full px-3.5 py-1.5 shadow-sm mb-4">
                <MessageSquare className="w-3.5 h-3.5 text-[#246BFF]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#246BFF]">Testimonials</span>
              </div>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-slate-900 dark:text-white tracking-tight">Trusted by Businesses and Founders</h2>
              <p className="text-gray-500 mt-3 leading-relaxed">Real feedback from clients who trusted DawnWire with websites, automation, SEO, and digital growth.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {testimonialsLoading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 animate-pulse">
                    <div className="h-4 w-20 bg-gray-100 rounded mb-4" />
                    <div className="space-y-2 mb-6">
                      <div className="h-3 bg-gray-100 rounded w-full" />
                      <div className="h-3 bg-gray-100 rounded w-5/6" />
                      <div className="h-3 bg-gray-100 rounded w-4/6" />
                    </div>
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                      <div className="w-10 h-10 rounded-full bg-gray-100" />
                      <div className="space-y-1.5">
                        <div className="h-3 bg-gray-100 rounded w-16" />
                        <div className="h-2 bg-gray-100 rounded w-24" />
                      </div>
                    </div>
                  </div>
                ))
              ) : testimonials.length === 0 ? (
                <div className="col-span-3 text-center py-12">
                  <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Testimonials coming soon.</p>
                </div>
              ) : testimonials.map((t, i) => (
                <div key={t.id || i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 hover:shadow-lg transition-shadow">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(Math.min(t.rating, 5))].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-6 italic">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    {t.avatar_url ? (
                      <img src={proxyImageUrl(t.avatar_url)} alt={t.name} className="w-10 h-10 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#246BFF] to-blue-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {(t.name || '?').charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">{t.role || t.company || ''}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FINAL CTA ===== */}
        <section className="relative py-20 md:py-24 bg-gradient-to-br from-slate-900 via-slate-900 to-[#0d2b5e] overflow-hidden">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />
          <div className="relative max-w-4xl mx-auto px-4 md:px-6 text-center">
            <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-white tracking-tight mb-5">
              Let's Build Something Amazing Together.
            </h2>
            <p className="text-blue-200/80 text-lg leading-relaxed max-w-2xl mx-auto mb-10">
              Whether you need a modern website, AI automation, an affiliate platform, eCommerce optimization, or a complete digital transformation, DawnWire is ready to help.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button onClick={() => onNavigate('contact')} className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-slate-900 dark:text-white font-bold text-sm px-8 py-4 rounded-lg shadow-xl transition-all cursor-pointer">
                Start a Project <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => onNavigate('contact')} className="inline-flex items-center gap-2 bg-transparent hover:bg-white/10 text-white font-semibold text-sm px-8 py-4 rounded-lg border-2 border-white/30 hover:border-white/50 transition-all cursor-pointer">
                Schedule a Call
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
