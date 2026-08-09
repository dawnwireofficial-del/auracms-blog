import React from 'react';

// DawnWire Official DW Monogram Logo Mark
export const DawnWireLogoMark: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => {
  return (
    <img
      src="/logo/dw-mark.png"
      alt="DawnWire"
      className={`object-contain select-none ${className}`}
      draggable={false}
    />
  );
};

// DawnWire Brand Logo Component
export const DawnWireLogo: React.FC<{ className?: string; iconOnly?: boolean; tagline?: boolean }> = ({ className = 'h-9', iconOnly = false, tagline = false }) => {
  return (
    <a href="/" className={`flex items-center gap-2.5 font-bold tracking-tight select-none cursor-pointer group ${className}`}>
      <DawnWireLogoMark className="w-9 h-9 shrink-0 group-hover:scale-105 transition-transform duration-300" />
      {!iconOnly && (
        <div className="flex flex-col leading-none">
          <div className="text-2xl font-black tracking-tight font-display flex items-center">
            <span className="text-dw-navy dark:text-white">DAWN</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-dw-blue to-dw-orange">WIRE</span>
          </div>
          {tagline && (
            <span className="text-[9px] uppercase tracking-[0.22em] font-black text-dw-blue dark:text-dw-orange opacity-90 mt-1">
              Discover. Compare. Buy Smart.
            </span>
          )}
        </div>
      )}
    </a>
  );
};

// Animated DawnWire Hero Chatbot SVG
export const HeroChatbotIllustration: React.FC<{ className?: string }> = ({ className = 'w-full max-w-md' }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-orange-500/10 to-dw-blue/20 rounded-full blur-3xl animate-pulse -z-10" />

      <svg viewBox="0 0 400 360" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto drop-shadow-2xl">
        {/* Floating Data Lines */}
        <path d="M40 100 Q120 70 200 100 T360 100" stroke="url(#paint0_linear)" strokeWidth="2" strokeDasharray="6 6" className="animate-[dash_20s_linear_infinite]" />
        <path d="M20 280 Q140 250 240 280 T380 280" stroke="url(#paint1_linear)" strokeWidth="2" strokeDasharray="4 4" />

        {/* Floating Product Cards around Bot */}
        {/* Card 1 - Rating */}
        <g className="animate-[bounce_6s_ease-in-out_infinite]">
          <rect x="20" y="40" width="110" height="50" rx="12" fill="white" className="dark:fill-slate-800" filter="drop-shadow(0 10px 15px rgba(0,0,0,0.1))" />
          <circle cx="42" cy="65" r="12" fill="#FEF3C7" />
          <path d="M42 59L43.5 63.5H48L44.5 66L45.8 70.5L42 67.8L38.2 70.5L39.5 66L36 63.5H40.5L42 59Z" fill="#F59E0B" />
          <text x="62" y="62" fill="#0F172A" className="dark:fill-slate-100" fontSize="12" fontWeight="bold">4.9 / 5.0</text>
          <text x="62" y="74" fill="#64748B" fontSize="9">Amazon Score</text>
        </g>

        {/* Card 2 - Deal Badge */}
        <g className="animate-[bounce_7s_ease-in-out_infinite_1s]">
          <rect x="270" y="180" width="110" height="54" rx="12" fill="#0A1F44" className="shadow-lg" />
          <rect x="280" y="192" width="40" height="18" rx="6" fill="#F97316" />
          <text x="286" y="204" fill="white" fontSize="9" fontWeight="bold">-25%</text>
          <text x="280" y="222" fill="#38BDF8" fontSize="11" fontWeight="bold">Check Deal</text>
        </g>

        {/* Central Robot Character */}
        <g className="animate-[float_4s_ease-in-out_infinite]">
          {/* Head Outer Frame */}
          <rect x="130" y="110" width="140" height="110" rx="36" fill="#0A1F44" stroke="#3B82F6" strokeWidth="4" />
          {/* Antenna */}
          <line x1="200" y1="110" x2="200" y2="85" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
          <circle cx="200" cy="80" r="10" fill="#F97316" className="animate-ping" />
          <circle cx="200" cy="80" r="8" fill="#F97316" />

          {/* Visor Screen */}
          <rect x="145" y="130" width="110" height="65" rx="20" fill="#020617" />

          {/* Animated Visor Eyes */}
          <circle cx="175" cy="162" r="12" fill="#38BDF8" className="animate-pulse" />
          <circle cx="177" cy="160" r="4" fill="white" />
          <circle cx="225" cy="162" r="12" fill="#38BDF8" className="animate-pulse" />
          <circle cx="227" cy="160" r="4" fill="white" />

          {/* Smile / Soundwave Mouth */}
          <path d="M185 180 Q200 188 215 180" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />

          {/* Bot Body Chassis */}
          <rect x="150" y="230" width="100" height="70" rx="24" fill="#1E293B" stroke="#3B82F6" strokeWidth="3" />
          {/* DawnWire Emblem on Chest */}
          <circle cx="200" cy="265" r="14" fill="#0A1F44" stroke="#F97316" strokeWidth="2" />
          <polygon points="196,260 206,265 196,270" fill="#F97316" />
        </g>

        {/* Gradients */}
        <defs>
          <linearGradient id="paint0_linear" x1="40" y1="100" x2="360" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6" stopOpacity="0.2" />
            <stop offset="0.5" stopColor="#F97316" />
            <stop offset="1" stopColor="#3B82F6" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="paint1_linear" x1="20" y1="280" x2="380" y2="280" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F97316" stopOpacity="0.2" />
            <stop offset="1" stopColor="#3B82F6" stopOpacity="0.8" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

// Trust Badges
export const TrustBadges: React.FC = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Independent Reviews</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">100% unbiased testing</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-xl">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Live Price Sync</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Fresh Amazon prices</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-dw-blue/10 text-dw-blue dark:bg-blue-900/40 dark:text-blue-400 rounded-xl">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">AI Assistant</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Tailored product finder</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Direct Amazon Links</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Secure Amazon associate</p>
        </div>
      </div>
    </div>
  );
};

// Category SVG Icons lookup
export const CategoryIcon: React.FC<{ icon: string; className?: string }> = ({ icon, className = 'w-5 h-5' }) => {
  switch (icon) {
    case 'headphone':
    case 'headphones':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 00-14 0m14 0a6 6 0 01-6 6M5 11a6 6 0 016-6m-6 6v5a2 2 0 002 2h2a2 2 0 002-2v-5m8 0v5a2 2 0 01-2 2h-2a2 2 0 01-2-2v-5" />
        </svg>
      );
    case 'coffee':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" />
        </svg>
      );
    case 'baby':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'sparkle':
    case 'sparkles':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      );
    case 'activity':
    case 'watch':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'car':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4zM3 9l2-4h14l2 4M3 9h18v6H3V9z" />
        </svg>
      );
    case 'briefcase':
    case 'armchair':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 'cpu':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M3 9h2m-2 6h2m14-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      );
    default:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
  }
};
