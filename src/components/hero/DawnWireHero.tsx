import { GravityParticleCanvas } from '../common/GravityParticleCanvas';
import MascotAnimation from '../MascotAnimation';

interface DawnWireHeroProps {
  onOpenAiFinder: () => void;
  onOpenChatbot: () => void;
}

const heroCards = [
  { key: 'deal', src: '/dawnwire/svg/live-deals.svg', alt: 'Live Amazon deals', cls: 'dw-card--deal' },
  { key: 'review', src: '/dawnwire/svg/verified-reviews.svg', alt: 'Verified reviews', cls: 'dw-card--review' },
  { key: 'drop', src: '/dawnwire/svg/price-drops.svg', alt: 'Price drops today', cls: 'dw-card--drop' },
  { key: 'lab', src: '/dawnwire/svg/lab-benchmarks.svg', alt: 'Lab benchmarks', cls: 'dw-card--lab' },
  { key: 'rating', src: '/dawnwire/svg/top-pick.svg', alt: 'Top product rating', cls: 'dw-card--rating' },
  { key: 'category', src: '/dawnwire/svg/categories-covered.svg', alt: 'Categories covered', cls: 'dw-card--category' },
] as const;

export default function DawnWireHero({ onOpenAiFinder, onOpenChatbot }: DawnWireHeroProps) {
  return (
    <section className="dw-hero" aria-labelledby="dw-hero-title">
      <div className="dw-hero__noise" aria-hidden="true" />

      {/* Full-hero cursor particles */}
      <div className="dw-hero__particles">
        <GravityParticleCanvas particleCount={45} />
      </div>

      <div className="dw-hero__container">
        {/* LEFT CONTENT — 46% */}
        <div className="dw-hero__content">
          <div className="dw-eyebrow">✦ AI-Powered Discovery Engine &amp; Live Amazon Deals</div>

          <h1 id="dw-hero-title">
            Amazon Product Reviews &amp;<br />
            <span className="dw-gradient-primary">AI-Powered Buying Guides.</span>
          </h1>

          <p className="dw-hero__copy">
            DawnWire scans verified Amazon reviews, technical specifications and independent benchmarks to surface stronger product picks and useful price drops.
          </p>

          <div className="dw-hero__actions">
            <button className="dw-btn dw-btn--primary" onClick={onOpenAiFinder}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              Launch AI Product Finder
            </button>
            <button className="dw-btn dw-btn--secondary" onClick={onOpenChatbot}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Ask AI Assistant
            </button>
          </div>

          <div className="dw-trust-list" aria-label="Key benefits">
            <span>
              <span className="dw-trust-dot">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-6M12 8V4M4.93 10.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h4M18 12h4M4.93 13.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
              </span>
              24/7 Price Drop Alerts
            </span>
            <span>
              <span className="dw-trust-dot">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              Verified Buyer Analysis
            </span>
            <span>
              <span className="dw-trust-dot">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </span>
              Direct Amazon Links
            </span>
          </div>
        </div>

        {/* RIGHT VISUAL — 54% */}
        <div className="dw-visual" aria-label="Animated product intelligence overview">

          {/* Orbit background */}
          <img
            className="dw-visual__orbit"
            src="/dawnwire/svg/orbit-background.svg"
            alt=""
            width="900"
            height="630"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />

          {/* Robot platform below bot */}
          <img
            className="dw-visual__platform"
            src="/dawnwire/svg/robot-platform.svg"
            alt=""
            width="560"
            height="217"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />

          {/* Mascot — center focal object */}
          <MascotAnimation className="dw-visual__mascot" />

          {/* 6 floating glass cards */}
          {heroCards.map((card) => (
            <div className={`dw-card ${card.cls}`} key={card.key}>
              <img src={card.src} alt={card.alt} width="280" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          ))}
        </div>
      </div>

      {/* PROOF STRIP */}
      <div className="dw-proof-strip" aria-label="DawnWire research principles">
        <div className="dw-proof">
          <span className="dw-proof__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </span>
          <span>
            <strong>Independent &amp; Unbiased</strong>
            <small>No paid reviews. Ever.</small>
          </span>
        </div>
        <div className="dw-proof">
          <span className="dw-proof__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
          </span>
          <span>
            <strong>Real Data, Real Insights</strong>
            <small>Verified reviews &amp; lab tests</small>
          </span>
        </div>
        <div className="dw-proof">
          <span className="dw-proof__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </span>
          <span>
            <strong>Secure &amp; Transparent</strong>
            <small>Your trust is our priority</small>
          </span>
        </div>
        <div className="dw-proof">
          <span className="dw-proof__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </span>
          <span>
            <strong>AI That Works for You</strong>
            <small>Smarter picks, every time</small>
          </span>
        </div>
      </div>
    </section>
  );
}
