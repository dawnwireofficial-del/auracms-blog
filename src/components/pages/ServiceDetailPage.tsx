import React from 'react';
import { Check, ArrowRight, AlertTriangle, Lightbulb, Briefcase, Mail, Phone, ArrowLeft } from 'lucide-react';
import ScrollReveal from '../ScrollReveal';
import { StaggerContainer, StaggerItem, HoverScale } from '../ScrollReveal';

interface ServiceDetailPageProps {
  serviceSlug: string;
  onNavigate: (route: string, param?: string) => void;
}

const serviceData: Record<string, {
  title: string;
  headline: string;
  subheadline: string;
  problem: string;
  solution: string;
  includes: string[];
  bestFor: string[];
  cta: string;
  ctaRoute: string;
}> = {
  'content-strategy': {
    title: 'Content Strategy',
    headline: 'Content Strategy for SaaS, AI, and Technology Brands',
    subheadline: 'Turn expertise into search visibility, trust, and qualified demand with a focused content strategy.',
    problem: 'Most tech companies publish content without a clear strategy. The result is low traffic, weak rankings, scattered topics, and content that does not support business goals.',
    solution: 'DawnWire builds content systems around search intent, buyer awareness, topical authority, product relevance, and conversion opportunities.',
    includes: ['Content audit', 'Keyword research', 'Topic cluster planning', 'Search intent mapping', 'Content calendar', 'Internal linking strategy', 'Article briefs', 'Conversion recommendations'],
    bestFor: ['SaaS brands', 'AI startups', 'Developer tools', 'Marketing software companies', 'Agencies', 'B2B service providers'],
    cta: 'Plan My Content Strategy',
    ctaRoute: 'advertise',
  },
  'affiliate-marketing': {
    title: 'Affiliate Marketing',
    headline: 'Affiliate Marketing Systems for Technology Brands',
    subheadline: 'Create review, comparison, and buying-guide funnels that attract high-intent readers and convert them into customers.',
    problem: 'Many affiliate campaigns fail because they rely on generic promotion instead of trust, search intent, product education, and conversion structure.',
    solution: 'DawnWire creates affiliate-friendly content assets that help readers compare tools, understand value, and take action.',
    includes: ['Product review pages', 'Comparison pages', 'Buying guides', 'Affiliate disclosure setup', 'CTA strategy', 'Tracking recommendations', 'SEO planning', 'Newsletter placement options'],
    bestFor: ['SaaS products', 'AI tools', 'Web hosting platforms', 'SEO tools', 'Marketing software', 'Productivity tools', 'Developer platforms'],
    cta: 'Build My Affiliate Campaign',
    ctaRoute: 'advertise',
  },
  'seo-growth': {
    title: 'SEO Growth',
    headline: 'SEO Growth for Technology Websites',
    subheadline: 'Improve organic visibility with technical SEO, content planning, internal linking, and search-focused website structure.',
    problem: 'Many websites have useful services and content, but weak structure, unclear topics, technical issues, and poor internal linking prevent them from ranking.',
    solution: 'DawnWire helps organize your website around topics, search intent, technical health, and conversion paths.',
    includes: ['SEO audit', 'Index cleanup recommendations', 'Sitemap review', 'Robots.txt review', 'Metadata recommendations', 'Internal linking plan', 'Keyword mapping', 'Content gap analysis', 'Technical SEO checklist'],
    bestFor: ['Blogs', 'SaaS websites', 'Affiliate websites', 'Technology publishers', 'Business websites', 'Service companies'],
    cta: 'Improve My SEO',
    ctaRoute: 'advertise',
  },
  'product-reviews': {
    title: 'Technical Product Reviews',
    headline: 'Technical Product Reviews That Build Trust',
    subheadline: 'Help buyers understand your product with clear, useful, and structured review content.',
    problem: 'Most product reviews are either too promotional or too shallow. Readers need practical information, honest context, and clear use cases.',
    solution: 'DawnWire creates transparent product reviews that explain features, audience fit, strengths, limitations, pricing context, and best use cases.',
    includes: ['Product overview', 'Best use cases', 'Key features', 'Pros', 'Limitations', 'Pricing overview', 'Alternatives', 'Who should use it', 'Final verdict'],
    bestFor: ['AI tools', 'SaaS platforms', 'Developer tools', 'SEO tools', 'Marketing platforms', 'Productivity software'],
    cta: 'Submit a Product for Review',
    ctaRoute: 'submit-product',
  },
  'website-strategy': {
    title: 'Website Strategy',
    headline: 'Website Strategy for Clearer Positioning and Better Conversions',
    subheadline: 'Improve your website structure, messaging, trust signals, and conversion flow.',
    problem: 'Many business websites fail because visitors cannot quickly understand what the company does, who it helps, why it matters, or what to do next.',
    solution: 'DawnWire helps structure pages around clarity, trust, user intent, and conversion.',
    includes: ['Homepage messaging review', 'Landing page structure', 'CTA recommendations', 'Service page layout', 'Trust signal improvements', 'Funnel recommendations', 'SEO page structure', 'Copy direction'],
    bestFor: ['Consultants', 'Agencies', 'SaaS companies', 'Tech startups', 'Affiliate businesses', 'Digital service providers'],
    cta: 'Improve My Website',
    ctaRoute: 'advertise',
  },
};

const allServices: { title: string; slug: string }[] = [
  { title: 'Content Strategy', slug: 'content-strategy' },
  { title: 'Affiliate Marketing', slug: 'affiliate-marketing' },
  { title: 'SEO Growth', slug: 'seo-growth' },
  { title: 'Technical Product Reviews', slug: 'product-reviews' },
  { title: 'Website Strategy', slug: 'website-strategy' },
];

export default function ServiceDetailPage({ serviceSlug, onNavigate }: ServiceDetailPageProps) {
  const data = serviceData[serviceSlug];
  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-16 md:py-24 text-center">
        <h1 className="font-display font-bold text-3xl text-heading dark:text-white mb-4">Service Not Found</h1>
        <p className="text-text mb-6 font-sans">The service you are looking for does not exist.</p>
        <button onClick={() => onNavigate('services')} className="text-primary font-semibold hover:underline cursor-pointer font-sans">View All Services</button>
      </div>
    );
  }

  return (
    <div className="bg-body-bg dark:bg-zinc-950 min-h-screen font-sans">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">
          {/* Left — Main Content */}
          <div className="lg:col-span-2">
            {/* Breadcrumb */}
            <ScrollReveal variant="fadeDown">
              <nav className="flex items-center gap-2 text-xs font-sans text-text dark:text-zinc-400 mb-6">
                <button onClick={() => onNavigate('services')} className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer">
                  <ArrowLeft className="w-3 h-3" /> Services
                </button>
                <span className="text-text2 dark:text-zinc-600">/</span>
                <span className="text-primary font-semibold">{data.title}</span>
              </nav>
            </ScrollReveal>

            {/* Headline */}
            <ScrollReveal variant="fadeUp">
              <h1 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-heading dark:text-white tracking-tight leading-tight mb-4">
                {data.headline}
              </h1>

              {/* Subheadline */}
              <p className="font-sans text-text dark:text-zinc-400 text-base md:text-lg leading-relaxed mb-10">
                {data.subheadline}
              </p>
            </ScrollReveal>

            {/* Problem Section + Solution Section */}
            <StaggerContainer>
              <StaggerItem>
                <div className="flex gap-4 md:gap-6 p-6 md:p-8 rounded-br-card bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 mb-5">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0 mt-1">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-2 block">The Problem</span>
                    <p className="font-sans text-sm text-text dark:text-zinc-400 leading-relaxed">{data.problem}</p>
                  </div>
                </div>
              </StaggerItem>

              <StaggerItem>
                <div className="flex gap-4 md:gap-6 p-6 md:p-8 rounded-br-card bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 mb-12">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 mt-1">
                    <Lightbulb className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-2 block">The Solution</span>
                    <p className="font-sans text-sm text-text dark:text-zinc-400 leading-relaxed">{data.solution}</p>
                  </div>
                </div>
              </StaggerItem>
            </StaggerContainer>

            {/* Includes Checklist */}
            <ScrollReveal variant="fadeLeft">
              <section className="mb-12">
                <h2 className="font-display font-bold text-2xl text-heading dark:text-white mb-6">What's Included</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {data.includes.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-text dark:text-zinc-400 bg-white dark:bg-body-bg4/40 border border-border dark:border-zinc-800 rounded-br-btn p-3">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" /> {item}
                    </div>
                  ))}
                </div>
              </section>
            </ScrollReveal>

            {/* Best For Tags */}
            <ScrollReveal variant="fadeRight">
              <section className="mb-8">
                <h2 className="font-display font-bold text-2xl text-heading dark:text-white mb-6">Best For</h2>
                <div className="flex flex-wrap gap-2">
                  {data.bestFor.map((item, i) => (
                    <span key={i} className="bg-primary/10 dark:bg-primary/5 text-primary text-xs font-semibold font-sans px-3 py-1.5 rounded-br-btn border border-primary/20 dark:border-primary/10">
                      {item}
                    </span>
                  ))}
                </div>
              </section>
            </ScrollReveal>
          </div>

          {/* Right — Sidebar */}
          <div className="lg:col-span-1">
            {/* Service Navigation */}
            <ScrollReveal delay={0}>
              <div className="bg-white dark:bg-body-bg4/40 border border-border dark:border-zinc-800 rounded-br-card p-6 mb-6">
                <h3 className="font-display font-bold text-lg text-heading dark:text-white mb-5 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" /> All Services
                </h3>
                <ul className="space-y-2">
                  {allServices.map((svc) => {
                    const isActive = svc.slug === serviceSlug;
                    return (
                      <li key={svc.slug}>
                        <button
                          onClick={() => !isActive && onNavigate('service-detail', svc.slug)}
                          className={`w-full text-left font-sans text-sm px-4 py-3 rounded-br-btn transition-all cursor-pointer flex items-center justify-between group ${
                            isActive
                              ? 'bg-primary/10 text-primary font-semibold border border-primary/20'
                              : 'text-text dark:text-zinc-400 hover:bg-body-bg dark:hover:bg-zinc-800 hover:text-heading dark:hover:text-white border border-transparent'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-primary' : 'text-text2 dark:bg-zinc-600'}`} />
                            {svc.title}
                          </span>
                          <ArrowRight className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all'}`} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </ScrollReveal>

            {/* CTA */}
            <ScrollReveal delay={100}>
              <div className="bg-white dark:bg-body-bg4/40 border border-border dark:border-zinc-800 rounded-br-card p-6 mb-6">
                <h3 className="font-display font-bold text-lg text-heading dark:text-white mb-3">Ready to Get Started?</h3>
                <p className="font-sans text-sm text-text dark:text-zinc-400 leading-relaxed mb-5">
                  Let's discuss how {data.title.toLowerCase()} can help your business grow.
                </p>
                <HoverScale>
                  <button onClick={() => onNavigate(data.ctaRoute)} className="primary-btn w-full justify-center text-sm cursor-pointer">
                    {data.cta} <ArrowRight className="w-4 h-4" />
                  </button>
                </HoverScale>
              </div>
            </ScrollReveal>

            {/* Contact Info */}
            <ScrollReveal delay={200}>
              <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/10 rounded-br-card p-6">
                <h3 className="font-display font-bold text-lg text-heading dark:text-white mb-5">Get in Touch</h3>
                <div className="space-y-4">
                  <a href="mailto:hello@dawnwire.com" className="flex items-center gap-3 font-sans text-sm text-text dark:text-zinc-400 hover:text-primary transition-colors">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <span>hello@dawnwire.com</span>
                  </a>
                  <div className="flex items-center gap-3 font-sans text-sm text-text dark:text-zinc-400">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                    <span>Reach out via our contact form</span>
                  </div>
                </div>
                <HoverScale>
                  <button onClick={() => onNavigate('advertise')} className="mt-5 primary-btn w-full justify-center text-sm cursor-pointer">
                    Contact Us <ArrowRight className="w-4 h-4" />
                  </button>
                </HoverScale>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
}
