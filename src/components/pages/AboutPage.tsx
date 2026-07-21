import React from 'react';
import ScrollReveal from '../ScrollReveal';
import { StaggerContainer, StaggerItem, HoverScale } from '../ScrollReveal';
import {
  ArrowRight, Check, Brain, Cpu, Globe, Zap, TrendingUp, Star,
  Quote, Target, Shield, Layers, Users, BarChart3, Search,
} from 'lucide-react';

const coverageAreas = [
  { icon: Brain, title: 'AI & Machine Learning', desc: 'Deep dives into LLMs, agentic AI, prompt engineering, and the future of intelligent software.' },
  { icon: Cpu, title: 'SaaS & Developer Tools', desc: 'Honest reviews of productivity platforms, dev tools, CI/CD, and cloud services.' },
  { icon: Globe, title: 'SEO & Content Strategy', desc: 'Actionable guides on technical SEO, link building, content marketing, and SERP tactics.' },
  { icon: Zap, title: 'Affiliate Marketing', desc: 'Proven frameworks for building passive income through ethical affiliate partnerships.' },
  { icon: TrendingUp, title: 'Digital Growth', desc: 'Growth hacking, conversion optimization, analytics, and go-to-market strategy.' },
  { icon: Layers, title: 'Web Development', desc: 'Modern frontend & backend stacks, architecture patterns, and deployment best practices.' },
];

const stats = [
  { value: '+300%', label: 'Growing Organic Traffic', icon: BarChart3 },
  { value: '50K+', label: 'Monthly Readers', icon: Users },
  { value: '200+', label: 'In-Depth Reviews', icon: Search },
  { value: '98%', label: 'Reader Satisfaction', icon: Star },
];

const audience = [
  'SaaS companies', 'AI startups', 'Developer tools', 'Marketing platforms',
  'Founders', 'Agencies', 'Affiliate marketers', 'Business owners', 'Technology buyers',
];

export default function AboutPage({ onNavigate }: { onNavigate: (route: string, param?: string) => void }) {
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
              <span className="text-white font-semibold">About Us</span>
            </nav>
            <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-white tracking-tight">
              About DawnWire
            </h1>
            <p className="mt-4 text-white/80 font-sans text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Your trusted source for technology analysis, product reviews, and digital growth strategies.
            </p>
          </div>
        </section>
      </ScrollReveal>

      {/* ── 2-Column: Mission & Intro ── */}
      <ScrollReveal variant="fadeUp">
        <section className="Container py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div className="relative">
              <div className="aspect-[4/3] rounded-br-card bg-gradient-to-br from-primary2/20 to-primary3/20 dark:from-primary2/10 dark:to-primary3/10 flex items-center justify-center border border-primary2/10 dark:border-white/5">
                <div className="text-center p-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary2 to-primary3 flex items-center justify-center shadow-lg">
                    <Target className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="font-display font-bold text-heading dark:text-white text-lg">Our Mission</h3>
                  <p className="text-text dark:text-zinc-400 text-sm mt-2 font-sans">
                    Empowering smarter technology decisions
                  </p>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary2/10 dark:bg-primary2/5 rounded-full blur-2xl" />
            </div>
            <div>
              <span className="inline-block text-primary font-semibold text-sm font-display uppercase tracking-widest mb-3">Who We Are</span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-heading dark:text-white tracking-tight mb-6">
                We Make Technology <span className="text-primary">Easier</span> to Understand
              </h2>
              <p className="text-text dark:text-zinc-400 leading-relaxed mb-4 font-sans">
                DawnWire is a technology growth platform focused on helping readers and brands make better decisions around software, AI tools, SEO, affiliate marketing, web development, and digital business growth.
              </p>
              <p className="text-text dark:text-zinc-400 leading-relaxed mb-6 font-sans">
                Our mission is to make technology, software, SEO, and affiliate marketing easier to understand and easier to use for growth. We cut through the noise to deliver actionable insights that drive real results.
              </p>
              <div className="flex flex-wrap gap-3">
                {['Independent', 'Data-Driven', 'Reader-First'].map((tag) => (
                  <span key={tag} className="text-xs font-semibold font-display uppercase tracking-wider px-4 py-1.5 rounded-full bg-primary2/10 dark:bg-primary2/5 text-primary border border-primary2/20 dark:border-primary2/10">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── Coverage / Features Icons ── */}
      <section className="bg-white dark:bg-body-bg3/50 py-16 md:py-24">
        <div className="Container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-block text-primary font-semibold text-sm font-display uppercase tracking-widest mb-3">What We Cover</span>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-heading dark:text-white tracking-tight mb-4">
              Every Angle of <span className="text-primary">Digital Growth</span>
            </h2>
            <p className="text-text dark:text-zinc-400 font-sans leading-relaxed">
              From AI breakthroughs to SEO fundamentals, we cover the full spectrum of modern technology.
            </p>
          </div>
          <StaggerContainer>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {coverageAreas.map((area, i) => {
                const Icon = area.icon;
                return (
                  <StaggerItem>
                    <HoverScale>
                      <div className="group p-6 rounded-br-card bg-body-bg dark:bg-body-bg4/40 border border-primary2/5 dark:border-white/5 hover:border-primary2/30 dark:hover:border-primary2/20 hover:shadow-lg hover:shadow-primary2/5 transition-all duration-300">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary2 to-primary3 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-display font-bold text-heading dark:text-white text-lg mb-2">{area.title}</h3>
                        <p className="text-text dark:text-zinc-400 text-sm font-sans leading-relaxed">{area.desc}</p>
                      </div>
                    </HoverScale>
                  </StaggerItem>
                );
              })}
            </div>
          </StaggerContainer>
        </div>
      </section>

      {/* ── Who We Help ── */}
      <ScrollReveal variant="fadeLeft">
        <section className="Container py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div>
              <span className="inline-block text-primary font-semibold text-sm font-display uppercase tracking-widest mb-3">Who We Help</span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-heading dark:text-white tracking-tight mb-6">
                Built for <span className="text-primary">Builders</span> & Decision Makers
              </h2>
              <p className="text-text dark:text-zinc-400 font-sans leading-relaxed mb-6">
                Whether you're bootstrapping a startup, scaling an agency, or evaluating the next tool for your stack — our content meets you where you are.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {audience.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-text dark:text-zinc-400 font-sans">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" /> {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-br-card bg-gradient-to-br from-primary2/20 to-primary3/20 dark:from-primary2/10 dark:to-primary3/10 flex items-center justify-center border border-primary2/10 dark:border-white/5">
                <div className="text-center p-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary2 to-primary3 flex items-center justify-center shadow-lg">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="font-display font-bold text-heading dark:text-white text-lg">Our Audience</h3>
                  <p className="text-text dark:text-zinc-400 text-sm mt-2 font-sans">Founders, developers, marketers & growth teams</p>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-primary3/10 dark:bg-primary3/5 rounded-full blur-2xl" />
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── Counter Stats ── */}
      <section className="bg-gradient-to-r from-primary2 via-primary to-primary3 py-16 md:py-20">
        <div className="Container">
          <StaggerContainer>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <StaggerItem>
                    <div className="text-center">
                      <Icon className="w-8 h-8 text-white/60 mx-auto mb-3" />
                      <div className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-white tracking-tight mb-1">
                        {stat.value}
                      </div>
                      <p className="text-white/70 font-sans text-sm md:text-base">{stat.label}</p>
                    </div>
                  </StaggerItem>
                );
              })}
            </div>
          </StaggerContainer>
        </div>
      </section>

      {/* ── Editorial Standards ── */}
      <section className="Container py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-primary font-semibold text-sm font-display uppercase tracking-widest mb-3">Our Standards</span>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-heading dark:text-white tracking-tight mb-6">
            Editorial <span className="text-primary">Excellence</span>
          </h2>
          <p className="text-text dark:text-zinc-400 font-sans leading-relaxed mb-8 text-base md:text-lg">
            We are committed to publishing useful, accurate, transparent, and reader-focused content. Our editorial process is designed to help readers understand technology products, SEO strategies, affiliate marketing, AI tools, and digital growth topics with clarity.
          </p>
          <StaggerContainer>
            <div className="grid sm:grid-cols-3 gap-4 mb-10">
              {[
                { icon: Shield, title: 'Fact-Checked', desc: 'Every claim verified against primary sources' },
                { icon: Star, title: 'Hands-On Testing', desc: 'Products tried before they are recommended' },
                { icon: Layers, title: 'Transparent', desc: 'Affiliate links clearly disclosed throughout' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <StaggerItem>
                    <div className="p-5 rounded-br-card bg-body-bg dark:bg-body-bg4/40 border border-primary2/5 dark:border-white/5">
                      <Icon className="w-6 h-6 text-primary mx-auto mb-3" />
                      <h4 className="font-display font-bold text-heading dark:text-white text-sm mb-1">{item.title}</h4>
                      <p className="text-text dark:text-zinc-400 text-xs font-sans">{item.desc}</p>
                    </div>
                  </StaggerItem>
                );
              })}
            </div>
          </StaggerContainer>
          <button onClick={() => onNavigate('editorial-policy')} className="primary-btn mx-auto">
            Read Our Editorial Policy <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── Testimonial / Quote ── */}
      <ScrollReveal variant="scaleUp">
        <section className="bg-white dark:bg-body-bg3/50 py-16 md:py-24">
          <div className="Container max-w-4xl">
            <Quote className="w-12 h-12 text-primary/30 dark:text-primary/20 mx-auto mb-6" />
            <blockquote className="text-center">
              <p className="font-display font-medium text-xl md:text-2xl lg:text-3xl text-heading dark:text-white leading-relaxed tracking-tight mb-8">
                "DawnWire has become our go-to resource for tech stack evaluations. Their reviews are thorough, unbiased, and actually useful for making purchase decisions."
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary2 to-primary3 flex items-center justify-center text-white font-display font-bold text-sm">
                  SK
                </div>
                <div className="text-left">
                  <cite className="font-display font-bold text-heading dark:text-white not-italic text-sm">Sarah Kendrick</cite>
                  <p className="text-text dark:text-zinc-400 text-xs font-sans">CTO, GrowthLayer</p>
                </div>
              </div>
            </blockquote>
          </div>
        </section>
      </ScrollReveal>

      {/* ── CTA Section ── */}
      <ScrollReveal variant="fadeUp">
        <section className="Container py-16 md:py-24">
          <div className="relative overflow-hidden rounded-br-card bg-gradient-to-r from-primary2 via-primary to-primary3 px-8 py-14 md:py-20 md:px-16 text-center">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-5 left-5 w-48 h-48 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-5 right-5 w-64 h-64 bg-white rounded-full blur-3xl" />
            </div>
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight mb-4">
                Ready to Work With Us?
              </h2>
              <p className="text-white/80 font-sans text-base md:text-lg leading-relaxed mb-8">
                Interested in partnering, advertising, or having your product reviewed? We'd love to hear from you.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button onClick={() => onNavigate('advertise')} className="primary-btn bg-white text-primary hover:bg-gray-100 shadow-xl !bg-none !text-primary">
                  Partner With DawnWire <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => onNavigate('contact')} className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold font-display uppercase tracking-wider text-white border-2 border-white/30 hover:border-white/60 hover:bg-white/10 transition-all cursor-pointer">
                  Contact Us <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}
