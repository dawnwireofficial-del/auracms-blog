export default function MascotAnimation({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%" height="100%"
        viewBox="0 0 512 512"
        role="img"
        aria-labelledby="mascot-title mascot-desc"
        className="w-full h-full"
        style={{ maxWidth: 320, maxHeight: 380 }}
      >
        <title id="mascot-title">DawnWire AI Chatbot</title>
        <desc id="mascot-desc">An animated rocket-style chatbot mascot with blinking eyes, pulsing antenna, chat dots, and sparkles.</desc>

        <defs>
          <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2E7CF6"/>
            <stop offset="100%" stopColor="#0A1F44"/>
          </linearGradient>
          <linearGradient id="faceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF"/>
            <stop offset="100%" stopColor="#EAF2FF"/>
          </linearGradient>
          <linearGradient id="flameGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFD66B"/>
            <stop offset="55%" stopColor="#FF8A00"/>
            <stop offset="100%" stopColor="#FF4D00"/>
          </linearGradient>
          <filter id="softShadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="14" stdDeviation="16" floodColor="#0A1F44" floodOpacity="0.22"/>
          </filter>
          <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <style>{`
          .mascot-float { transform-origin: 256px 260px; animation: mascotFloat 3.6s ease-in-out infinite; }
          .mascot-shadow { transform-origin: 256px 438px; animation: mascotShadowPulse 3.6s ease-in-out infinite; }
          .mascot-antenna-dot { transform-origin: 256px 109px; animation: mascotPulse 1.8s ease-in-out infinite; }
          .mascot-eye { transform-box: fill-box; transform-origin: center; animation: mascotBlink 4.2s infinite; }
          .mascot-dot1 { animation: mascotTyping 1.2s ease-in-out infinite; }
          .mascot-dot2 { animation: mascotTyping 1.2s ease-in-out .18s infinite; }
          .mascot-dot3 { animation: mascotTyping 1.2s ease-in-out .36s infinite; }
          .mascot-flame { transform-box: fill-box; transform-origin: 50% 0%; animation: mascotFlame 0.45s ease-in-out infinite alternate; }
          .mascot-spark1 { animation: mascotSparkle 2.4s ease-in-out infinite; }
          .mascot-spark2 { animation: mascotSparkle 2.4s ease-in-out .8s infinite; }
          .mascot-spark3 { animation: mascotSparkle 2.4s ease-in-out 1.4s infinite; }

          @keyframes mascotFloat {
            0%,100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-13px) rotate(1.2deg); }
          }
          @keyframes mascotShadowPulse {
            0%,100% { transform: scaleX(1); opacity:.20; }
            50% { transform: scaleX(.82); opacity:.12; }
          }
          @keyframes mascotPulse {
            0%,100% { transform: scale(1); opacity:1; }
            50% { transform: scale(1.28); opacity:.65; }
          }
          @keyframes mascotBlink {
            0%,44%,48%,100% { transform: scaleY(1); }
            46% { transform: scaleY(.08); }
          }
          @keyframes mascotTyping {
            0%,60%,100% { transform: translateY(0); opacity:.55; }
            30% { transform: translateY(-8px); opacity:1; }
          }
          @keyframes mascotFlame {
            from { transform: scaleY(.88) scaleX(.96); opacity:.9; }
            to { transform: scaleY(1.08) scaleX(1.03); opacity:1; }
          }
          @keyframes mascotSparkle {
            0%,100% { opacity:.2; transform: scale(.7) rotate(0deg); }
            50% { opacity:1; transform: scale(1.15) rotate(18deg); }
          }
          @media (prefers-reduced-motion: reduce) {
            .mascot-float, .mascot-shadow, .mascot-antenna-dot, .mascot-eye,
            .mascot-dot1, .mascot-dot2, .mascot-dot3, .mascot-flame,
            .mascot-spark1, .mascot-spark2, .mascot-spark3 { animation: none !important; }
          }
        `}</style>

        <ellipse className="mascot-shadow" cx="256" cy="438" rx="92" ry="18" fill="#0A1F44"/>

        <g fill="#FF8A00" filter="url(#glow)">
          <path className="mascot-spark1" d="M105 188h12v-12h8v12h12v8h-12v12h-8v-12h-12z"/>
          <path className="mascot-spark2" d="M391 145h9v-9h6v9h9v6h-9v9h-6v-9h-9z"/>
          <path className="mascot-spark3" d="M402 322h11v-11h7v11h11v7h-11v11h-7v-11h-11z"/>
        </g>

        <g className="mascot-float" filter="url(#softShadow)">
          <rect x="252" y="88" width="8" height="35" rx="4" fill="#0A1F44"/>
          <circle className="mascot-antenna-dot" cx="256" cy="82" r="13" fill="#FF8A00"/>
          <circle cx="256" cy="82" r="5" fill="#FFFFFF" opacity=".9"/>

          <path d="M153 284c-28 17-47 46-51 84 27-9 52-7 72 2l18-76z" fill="#0A1F44"/>
          <path d="M359 284c28 17 47 46 51 84-27-9-52-7-72 2l-18-76z" fill="#0A1F44"/>

          <path d="M256 111c-76 0-126 66-126 155 0 79 40 134 98 151h56c58-17 98-72 98-151 0-89-50-155-126-155z" fill="url(#bodyGrad)"/>

          <rect x="166" y="175" width="180" height="133" rx="54" fill="url(#faceGrad)"/>
          <rect x="176" y="185" width="160" height="113" rx="44" fill="none" stroke="#CFE0FF" strokeWidth="5"/>

          <g fill="#0A1F44">
            <ellipse className="mascot-eye" cx="218" cy="231" rx="17" ry="22"/>
            <ellipse className="mascot-eye" cx="294" cy="231" rx="17" ry="22"/>
          </g>
          <g fill="#FFFFFF" opacity=".9">
            <circle cx="212" cy="224" r="5"/>
            <circle cx="288" cy="224" r="5"/>
          </g>

          <path d="M215 266c11 13 26 19 41 19s30-6 41-19" fill="none" stroke="#0A1F44" strokeWidth="9" strokeLinecap="round"/>

          <g transform="translate(301 304)">
            <rect x="0" y="0" width="90" height="58" rx="25" fill="#FFFFFF"/>
            <path d="M22 53l-8 17 22-11" fill="#FFFFFF"/>
            <circle className="mascot-dot1" cx="28" cy="29" r="6" fill="#2E7CF6"/>
            <circle className="mascot-dot2" cx="45" cy="29" r="6" fill="#2E7CF6"/>
            <circle className="mascot-dot3" cx="62" cy="29" r="6" fill="#2E7CF6"/>
          </g>

          <g transform="translate(219 330)">
            <circle cx="37" cy="37" r="34" fill="#FFFFFF" opacity=".98"/>
            <path d="M24 20h17c17 0 28 9 28 24 0 17-12 29-31 29H24V20zm14 12v29h3c10 0 16-6 16-16 0-9-5-13-16-13z" fill="#0A1F44"/>
            <path d="M55 18h14L58 29z" fill="#FF8A00"/>
          </g>

          <path d="M226 409h60l-9 28h-42z" fill="#0A1F44"/>
          <g className="mascot-flame">
            <path d="M239 433c5 18 10 32 17 45 8-13 13-27 17-45z" fill="url(#flameGrad)"/>
            <path d="M248 433c2 13 5 23 8 31 4-8 7-18 9-31z" fill="#FFF3B0" opacity=".95"/>
          </g>
        </g>
      </svg>
    </div>
  );
}
