import React from 'react';
import { ArrowRight, ChevronRight, FileText, ShoppingCart, TrendingUp, Star, Layout } from 'lucide-react';
import ScrollReveal from '../ScrollReveal';
import { StaggerContainer, StaggerItem, HoverScale } from '../ScrollReveal';

const services = [
  { title: 'Content Strategy', icon: FileText, slug: 'content-strategy', problem: 'Most tech companies publish content without a clear strategy.', solution: 'DawnWire builds content systems around search intent and conversion.' },
  { title: 'Affiliate Marketing', icon: ShoppingCart, slug: 'affiliate-marketing', problem: 'Many affiliate campaigns fail due to generic promotion.', solution: 'DawnWire creates affiliate-friendly content assets that convert.' },
  { title: 'SEO Growth', icon: TrendingUp, slug: 'seo-growth', problem: 'Websites with weak structure and technical issues cannot rank.', solution: 'DawnWire organizes websites around topics and search intent.' },
  { title: 'Technical Product Reviews', icon: Star, slug: 'product-reviews', problem: 'Most product reviews are too promotional or too shallow.', solution: 'DawnWire creates transparent, structured, and useful reviews.' },
  { title: 'Website Strategy', icon: Layout, slug: 'website-strategy', problem: 'Visitors cannot quickly understand what a company does.', solution: 'DawnWire structures pages around clarity and conversion.' },
];

export default function ServicesPage({ onNavigate }: { onNavigate: (route: string, param?: string) => void }) {
  return (
    <div className="bg-body-bg dark:bg-zinc-950 min-h-screen font-sans">
      {/* ── Breadcrumb Hero ── */}
      <ScrollReveal variant="fadeDown">
        <section className="relative overflow-hidden bg-gradient-to-r from-primary2 via-primary to-primary3 py-16 md:py-24">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
          </div>
          <div className="Container relative z-10 text-center">
            <nav className="flex justify-center items-center gap-2 text-sm text-white/70 font-sans mb-4">
              <button onClick={() => onNavigate('home')} className="hover:text-white transition-colors">Home</button>
              <span className="text-white/40">/</span>
              <span className="text-white">Pages</span>
              <span className="text-white/40">/</span>
              <span className="text-white font-semibold">Services</span>
            </nav>
            <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-white tracking-tight">
              Growth Services for Technology Brands
            </h1>
            <p className="mt-4 text-white/80 font-sans text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              DawnWire helps technology companies grow with strategic content, search visibility, affiliate campaigns, product reviews, and conversion-focused website improvements.
            </p>
          </div>
        </section>
      </ScrollReveal>

      {/* ── Services List ── */}
      <section className="Container py-16 md:py-24">
        <StaggerContainer>
          <div className="space-y-6">
            {services.map((svc, i) => {
              const Icon = svc.icon;
              return (
                <StaggerItem key={i}>
                  <HoverScale>
                    <div className="group p-6 md:p-8 rounded-br-card bg-white dark:bg-body-bg4/40 border border-primary2/5 dark:border-white/5 hover:border-primary2/30 dark:hover:border-primary2/20 hover:shadow-lg hover:shadow-primary2/5 transition-all duration-300">
                      <div className="flex flex-col md:flex-row md:items-start gap-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary2 to-primary3 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h2 className="font-display font-bold text-xl text-heading dark:text-white mb-3">{svc.title}</h2>
                          <div className="grid sm:grid-cols-2 gap-4 mb-4">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1 block">Problem</span>
                              <p className="text-sm text-text dark:text-zinc-400 font-sans">{svc.problem}</p>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1 block">Solution</span>
                              <p className="text-sm text-text dark:text-zinc-400 font-sans">{svc.solution}</p>
                            </div>
                          </div>
                          <button onClick={() => onNavigate('service-detail', svc.slug)} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary2 transition-colors cursor-pointer">
                            Learn More <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </HoverScale>
                </StaggerItem>
              );
            })}
          </div>
        </StaggerContainer>
      </section>

      {/* ── CTA Section ── */}
      <ScrollReveal variant="fadeUp">
        <section className="Container pb-16 md:pb-24">
          <div className="relative overflow-hidden rounded-br-card bg-gradient-to-r from-primary2 via-primary to-primary3 px-8 py-14 md:py-20 md:px-16 text-center">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-5 left-5 w-48 h-48 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-5 right-5 w-64 h-64 bg-white rounded-full blur-3xl" />
            </div>
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight mb-4">
                Ready to Grow Your Brand?
              </h2>
              <p className="text-white/80 font-sans text-base md:text-lg leading-relaxed mb-8">
                Let's build a content strategy, launch an affiliate campaign, or optimize your website for conversions.
              </p>
              <button onClick={() => onNavigate('advertise')} className="primary-btn bg-white text-primary hover:bg-gray-100 shadow-xl !bg-none !text-primary">
                Start a Growth Project <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}
