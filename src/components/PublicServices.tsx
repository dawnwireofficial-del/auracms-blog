import React, { useState, useEffect } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { ServiceItem } from '../types';
import SeoHelmet from './SeoHelmet';
import Breadcrumbs from './Breadcrumbs';

interface PublicServicesProps {
  slug?: string;
  onNavigate: (route: string, param?: string) => void;
}

export default function PublicServices({ slug, onNavigate }: PublicServicesProps) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [activeService, setActiveService] = useState<ServiceItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/public/services');
        if (res.ok) {
          const list = await res.json();
          setServices(list);
          if (slug) setActiveService(list.find((s: any) => s.slug === slug || s.id === slug) || null);
        }
      } catch (e) { console.error(e) }
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) return <div className="max-w-4xl mx-auto px-4 md:px-6 py-20 text-center text-sm text-slate-500">Loading...</div>;

  // Single service view
  if (slug && activeService) {
    const s = activeService;
    const features = s.includes || [];
    return (
      <>
        <SeoHelmet title={s.title} description={s.overview || ''} canonical={`/service/${s.slug || s.id}`} ogType="website" />
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
          <div className="bg-white dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-700/60 rounded-xl shadow-sm p-8 md:p-10 space-y-6">
            <Breadcrumbs items={[{ label: 'Home', onClick: () => onNavigate('home') }, { label: 'Services', onClick: () => onNavigate('services') }, { label: s.title }]} />
            <h1 className="font-display font-bold text-3xl md:text-4xl text-slate-900 dark:text-white tracking-tight">{s.title}</h1>
            {s.overview && <p className="text-slate-800 dark:text-zinc-300 leading-relaxed text-sm">{s.overview}</p>}
            {features.length > 0 && (
              <div>
                <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-3">What's Included</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-800 dark:text-zinc-200">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> {f}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Service listing page
  return (
    <>
      <SeoHelmet title="Services" description="Professional services offered by DawnWire" canonical="/services" ogType="website" />
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <div className="text-center mb-12">
          <h1 className="font-display font-bold text-3xl md:text-4xl text-slate-900 dark:text-white tracking-tight mb-3">Our Services</h1>
          <p className="text-slate-500 dark:text-zinc-400 max-w-2xl mx-auto">Professional solutions tailored to your business needs.</p>
        </div>

        {services.length === 0 ? (
          <p className="text-center text-sm text-slate-500 py-12">No services listed yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(s => (
              <button key={s.id} onClick={() => onNavigate('service-detail', s.slug || s.id)}
                className="text-left bg-white dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-700/60 rounded-xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#246BFF]/10 text-[#246BFF] flex items-center justify-center text-lg mb-4 group-hover:bg-[#246BFF] group-hover:text-white transition-all">
                  {s.icon ? s.icon.charAt(0).toUpperCase() : 'S'}
                </div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white mb-2">{s.title}</h3>
                {s.overview && <p className="text-sm text-slate-500 dark:text-zinc-400 line-clamp-3">{s.overview}</p>}
                <div className="mt-4 text-[#246BFF] text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                  Learn More <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
