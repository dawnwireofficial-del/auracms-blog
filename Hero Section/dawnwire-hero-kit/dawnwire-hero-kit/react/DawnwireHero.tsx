import { useEffect } from 'react';
import '../css/dawnwire-hero-theme.css';
import { initDawnwireHeroMotion } from '../js/dawnwire-hero-motion';

const cards = [
  ['deal', '/dawnwire/svg/live-deals.svg', 'Live Amazon deals'],
  ['review', '/dawnwire/svg/verified-reviews.svg', 'Verified reviews'],
  ['drop', '/dawnwire/svg/price-drops.svg', 'Price drops today'],
  ['lab', '/dawnwire/svg/lab-benchmarks.svg', 'Lab benchmarks'],
  ['rating', '/dawnwire/svg/top-pick.svg', 'Top product rating'],
  ['category', '/dawnwire/svg/categories-covered.svg', 'Categories covered'],
] as const;

export default function DawnwireHero() {
  useEffect(() => initDawnwireHeroMotion(), []);

  return (
    <section className="dw-hero" aria-labelledby="dw-hero-title">
      <div className="dw-hero__noise" aria-hidden="true" />
      <div className="dw-hero__container">
        <div className="dw-hero__content">
          <div className="dw-eyebrow">✦ AI-Powered Discovery Engine &amp; Live Amazon Deals</div>
          <h1 id="dw-hero-title">
            Amazon Product Reviews &amp;<br />
            <span className="dw-gradient-text">AI-Powered Buying Guides.</span>
          </h1>
          <p className="dw-hero__copy">
            DawnWire scans verified Amazon reviews, technical specifications and independent benchmarks to surface stronger product picks and useful price drops.
          </p>
          <div className="dw-hero__actions">
            <a className="dw-btn dw-btn--primary" href="/ai-product-finder">⚡ Launch AI Product Finder</a>
            <a className="dw-btn dw-btn--secondary" href="/ask-ai">▣ Ask AI Assistant</a>
          </div>
          <div className="dw-trust-list" aria-label="Key benefits">
            <span><i className="dw-trust-dot">♧</i> 24/7 Price Drop Alerts</span>
            <span><i className="dw-trust-dot">✓</i> Verified Buyer Analysis</span>
            <span><i className="dw-trust-dot">↗</i> Direct Amazon Links</span>
          </div>
        </div>

        <div className="dw-visual" aria-label="Animated product intelligence overview">
          <img className="dw-visual__orbit" src="/dawnwire/svg/orbit-background.svg" alt="" />
          <img className="dw-visual__platform" src="/dawnwire/svg/robot-platform.svg" alt="" />
          <img className="dw-visual__mascot" src="/images/dawnwire-bot.webp" alt="DawnWire AI assistant mascot" />
          {cards.map(([name, src, alt]) => (
            <div className={`dw-card dw-card--${name}`} key={name}>
              <img src={src} alt={alt} />
            </div>
          ))}
        </div>
      </div>

      <div className="dw-proof-strip" aria-label="DawnWire research principles">
        <div className="dw-proof"><span className="dw-proof__icon">✓</span><span><strong>Independent &amp; Unbiased</strong><small>No paid reviews. Ever.</small></span></div>
        <div className="dw-proof"><span className="dw-proof__icon">▥</span><span><strong>Real Data, Real Insights</strong><small>Verified reviews &amp; lab tests</small></span></div>
        <div className="dw-proof"><span className="dw-proof__icon">▣</span><span><strong>Secure &amp; Transparent</strong><small>Your trust is our priority</small></span></div>
        <div className="dw-proof"><span className="dw-proof__icon">✦</span><span><strong>AI That Works for You</strong><small>Smarter picks, every time</small></span></div>
      </div>
    </section>
  );
}
