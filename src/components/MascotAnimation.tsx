import { useId } from 'react';

export default function MascotAnimation({ className = '' }: { className?: string }) {
  const uid = useId();
  return (
    <div className={`relative ${className}`} style={{ maxWidth: 640 }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1024 1536"
        role="img"
        aria-labelledby={`${uid}-title ${uid}-desc`}
        className="w-full h-auto"
      >
        <title id={`${uid}-title`}>Animated Dawnwire D Bot</title>
        <desc id={`${uid}-desc`}>A glossy blue and white floating robot mascot with cat-like ears, glowing blinking eyes, animated arms, body, ears, chest D emblem, and thruster.</desc>

        <defs>
          <linearGradient id={`${uid}-shell`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff"/>
            <stop offset="0.34" stopColor="#e9f3ff"/>
            <stop offset="0.7" stopColor="#fbfdff"/>
            <stop offset="1" stopColor="#a7c9ff"/>
          </linearGradient>
          <linearGradient id={`${uid}-shellShade`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff"/>
            <stop offset="0.62" stopColor="#edf6ff"/>
            <stop offset="1" stopColor="#8fbaff"/>
          </linearGradient>
          <linearGradient id={`${uid}-blueMetal`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#07106a"/>
            <stop offset="0.22" stopColor="#1337dd"/>
            <stop offset="0.48" stopColor="#048cff"/>
            <stop offset="0.7" stopColor="#1535da"/>
            <stop offset="1" stopColor="#050953"/>
          </linearGradient>
          <linearGradient id={`${uid}-blueMetalReverse`} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#07106a"/>
            <stop offset="0.25" stopColor="#1943ec"/>
            <stop offset="0.54" stopColor="#08a9ff"/>
            <stop offset="0.78" stopColor="#1640df"/>
            <stop offset="1" stopColor="#060a55"/>
          </linearGradient>
          <radialGradient id={`${uid}-visor`} cx="50%" cy="42%" r="70%">
            <stop offset="0" stopColor="#0a3dcf"/>
            <stop offset="0.48" stopColor="#06177f"/>
            <stop offset="1" stopColor="#02083b"/>
          </radialGradient>
          <radialGradient id={`${uid}-eye`} cx="38%" cy="32%" r="66%">
            <stop offset="0" stopColor="#dfffff"/>
            <stop offset="0.22" stopColor="#77fbff"/>
            <stop offset="0.68" stopColor="#16d9ff"/>
            <stop offset="1" stopColor="#00a2ee"/>
          </radialGradient>
          <linearGradient id={`${uid}-earBlue`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fd77c8"/>
            <stop offset="0.18" stopColor="#5d51ff"/>
            <stop offset="0.52" stopColor="#0f7cff"/>
            <stop offset="1" stopColor="#0a0f73"/>
          </linearGradient>
          <linearGradient id={`${uid}-earInner`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ecf6ff"/>
            <stop offset="0.45" stopColor="#57d9ff"/>
            <stop offset="1" stopColor="#696eff"/>
          </linearGradient>
          <linearGradient id={`${uid}-thruster`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f8ffff"/>
            <stop offset="0.3" stopColor="#86efff"/>
            <stop offset="0.7" stopColor="#1d9cff"/>
            <stop offset="1" stopColor="#4f45ec"/>
          </linearGradient>
          <linearGradient id={`${uid}-cyanGlow`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#00d9ff" stopOpacity="0"/>
            <stop offset="0.5" stopColor="#c9ffff" stopOpacity="0.92"/>
            <stop offset="1" stopColor="#00d9ff" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id={`${uid}-amazonGrad`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff9900"/>
            <stop offset="1" stopColor="#ff6600"/>
          </linearGradient>
          <linearGradient id={`${uid}-graphGrad`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#00d4ff" stopOpacity="0"/>
            <stop offset="1" stopColor="#00d4ff" stopOpacity="0.7"/>
          </linearGradient>
          <linearGradient id={`${uid}-cartGrad`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#232f3e"/>
            <stop offset="1" stopColor="#131921"/>
          </linearGradient>
          <linearGradient id={`${uid}-primeGrad`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#00a8e1"/>
            <stop offset="1" stopColor="#0077b6"/>
          </linearGradient>
          <filter id={`${uid}-shadow`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="18"/>
          </filter>
          <filter id={`${uid}-softGlow`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="10" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id={`${uid}-eyeGlow`} x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="18" result="b1"/>
            <feGaussianBlur stdDeviation="5" in="SourceGraphic" result="b2"/>
            <feMerge><feMergeNode in="b1"/><feMergeNode in="b2"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id={`${uid}-blueDrop`} x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#001a7a" floodOpacity="0.45"/>
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#29d8ff" floodOpacity="0.38"/>
          </filter>
          <filter id={`${uid}-shellDrop`} x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="14" stdDeviation="16" floodColor="#052a90" floodOpacity="0.36"/>
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#d7f7ff" floodOpacity="0.8"/>
          </filter>
          <filter id={`${uid}-smallGlow`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id={`${uid}-orangeGlow`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <clipPath id={`${uid}-visorClip`}>
            <path d="M343 420 C386 391 438 409 478 420 C500 426 524 426 546 420 C588 408 640 390 681 420 C716 446 727 492 719 535 C711 579 679 611 634 612 C594 613 567 598 541 595 C522 593 501 593 482 595 C456 598 428 614 388 612 C342 610 312 578 305 534 C298 491 309 447 343 420Z"/>
          </clipPath>
        </defs>

        <style>{`
          @keyframes botFloat {
            0%,100% { transform: translateY(0) rotate(-0.35deg); }
            50% { transform: translateY(-18px) rotate(0.55deg); }
          }
          @keyframes botBreathe {
            0%,100% { transform: scale(1); }
            50% { transform: scale(1.008,1.012); }
          }
          @keyframes botLeftArm {
            0%,100% { transform: rotate(2deg); }
            50% { transform: rotate(-8deg); }
          }
          @keyframes botRightArm {
            0%,100% { transform: rotate(-2deg); }
            50% { transform: rotate(8deg); }
          }
          @keyframes botLeftEar {
            0%,100% { transform: rotate(-1deg); }
            50% { transform: rotate(-4deg); }
          }
          @keyframes botRightEar {
            0%,100% { transform: rotate(1deg); }
            50% { transform: rotate(4deg); }
          }
          @keyframes botBlink {
            0%, 43%, 46%, 48%, 100% { transform: scaleY(1); }
            44%, 47% { transform: scaleY(0.08); }
          }
          @keyframes botEyePulse {
            0%,100% { opacity: .92; filter: brightness(1); }
            50% { opacity: 1; filter: brightness(1.24); }
          }
          @keyframes botChestPulse {
            0%,100% { opacity: .28; }
            50% { opacity: .75; }
          }
          @keyframes botDPulse {
            0%,100% { transform: scale(1); }
            50% { transform: scale(1.035); }
          }
          @keyframes botThruster {
            0%,100% { transform: scaleY(.92) scaleX(.96); opacity: .92; }
            50% { transform: scaleY(1.08) scaleX(1.03); opacity: 1; }
          }
          @keyframes botSparkle {
            0%,100% { opacity: .25; transform: scale(.7); }
            50% { opacity: 1; transform: scale(1.25); }
          }
          @keyframes elemFloat1 {
            0%,100% { transform: translateY(0); }
            50% { transform: translateY(-14px); }
          }
          @keyframes elemFloat2 {
            0%,100% { transform: translateY(0); }
            50% { transform: translateY(-12px); }
          }
          @keyframes elemFloat3 {
            0%,100% { transform: translateY(0); }
            50% { transform: translateY(-16px); }
          }
          @keyframes elemFloat4 {
            0%,100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          @keyframes elemFloat5 {
            0%,100% { transform: translateY(0); }
            50% { transform: translateY(-18px); }
          }
          @keyframes bar1 {
            0%,100% { transform: scaleY(0.5); }
            50% { transform: scaleY(1); }
          }
          @keyframes bar2 {
            0%,100% { transform: scaleY(0.35); }
            50% { transform: scaleY(0.8); }
          }
          @keyframes bar3 {
            0%,100% { transform: scaleY(0.65); }
            50% { transform: scaleY(1); }
          }
          @keyframes bar4 {
            0%,100% { transform: scaleY(0.25); }
            50% { transform: scaleY(0.7); }
          }
          @keyframes cartBounce {
            0%,100% { transform: translateY(0) rotate(0deg); }
            30% { transform: translateY(-10px) rotate(-4deg); }
            60% { transform: translateY(0) rotate(0deg); }
            80% { transform: translateY(-5px) rotate(3deg); }
          }
          @keyframes badgePulse {
            0%,100% { transform: scale(1); }
            50% { transform: scale(1.06); }
          }
          @keyframes trendUp {
            0%,100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
          @keyframes starPop {
            0%,100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.25); opacity: 0.85; }
          }
          @keyframes starPop2 {
            0%,100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.15); opacity: 0.9; }
          }
          @keyframes priceFloat {
            0%,100% { transform: translateX(0) rotate(0deg); }
            50% { transform: translateX(-8px) rotate(-3deg); }
          }
          @keyframes glowDot {
            0%,100% { opacity: 0.15; transform: scale(0.7); }
            50% { opacity: 0.85; transform: scale(1.4); }
          }
          @keyframes linePulse {
            0%,100% { opacity: 0.2; }
            50% { opacity: 0.9; }
          }
          @keyframes arrowBounce {
            0%,100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          @keyframes discountPulse {
            0%,100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,107,107,0.4); }
            50% { transform: scale(1.04); }
          }
          .bot-float { transform-origin: 512px 720px; animation: botFloat 4.8s ease-in-out infinite; }
          .bot-body { transform-origin: 512px 820px; animation: botBreathe 4.8s ease-in-out infinite; }
          .bot-left-arm { transform-box: fill-box; transform-origin: 86% 16%; animation: botLeftArm 3.9s ease-in-out infinite; }
          .bot-right-arm { transform-box: fill-box; transform-origin: 14% 16%; animation: botRightArm 3.9s ease-in-out infinite; }
          .bot-left-ear { transform-box: fill-box; transform-origin: 72% 90%; animation: botLeftEar 5.6s ease-in-out infinite; }
          .bot-right-ear { transform-box: fill-box; transform-origin: 28% 90%; animation: botRightEar 5.6s ease-in-out infinite; }
          .bot-eye { transform-box: fill-box; transform-origin: center; animation: botBlink 5.8s linear infinite, botEyePulse 2.1s ease-in-out infinite; }
          .bot-spark-l { animation: botSparkle 2.5s ease-in-out infinite; }
          .bot-spark-r { animation: botSparkle 2.5s ease-in-out .7s infinite; }
          .bot-chest-glow { animation: botChestPulse 2.8s ease-in-out infinite; }
          .bot-d-mark { transform-box: fill-box; transform-origin: center; animation: botDPulse 2.8s ease-in-out infinite; }
          .bot-thruster-core { transform-box: fill-box; transform-origin: 50% 0%; animation: botThruster 1.15s ease-in-out infinite; }
          .bot-spark1 { animation: botSparkle 2.2s ease-in-out infinite; }
          .bot-spark2 { animation: botSparkle 2.8s ease-in-out .8s infinite; }
          .bot-spark3 { animation: botSparkle 2.4s ease-in-out 1.4s infinite; }
          .ef-1 { animation: elemFloat1 4.5s ease-in-out infinite; }
          .ef-2 { animation: elemFloat2 4s ease-in-out infinite; }
          .ef-3 { animation: elemFloat3 5s ease-in-out infinite; }
          .ef-4 { animation: elemFloat4 4.8s ease-in-out infinite; }
          .ef-5 { animation: elemFloat5 5.5s ease-in-out infinite .5s; }
          .bar-a { transform-box: fill-box; transform-origin: center bottom; animation: bar1 2.5s ease-in-out infinite; }
          .bar-b { transform-box: fill-box; transform-origin: center bottom; animation: bar2 2.8s ease-in-out infinite; }
          .bar-c { transform-box: fill-box; transform-origin: center bottom; animation: bar3 2.2s ease-in-out infinite; }
          .bar-d { transform-box: fill-box; transform-origin: center bottom; animation: bar4 3.2s ease-in-out infinite; }
          .amz-cart { animation: cartBounce 4.2s ease-in-out infinite; }
          .amz-badge { animation: badgePulse 3.2s ease-in-out infinite; transform-origin: center; }
          .amz-trend { animation: trendUp 2.8s ease-in-out infinite; }
          .amz-star-1 { animation: starPop 1.8s ease-in-out infinite; }
          .amz-star-2 { animation: starPop2 2s ease-in-out infinite .25s; }
          .amz-star-3 { animation: starPop 2.2s ease-in-out infinite .5s; }
          .amz-star-4 { animation: starPop2 1.9s ease-in-out infinite .75s; }
          .amz-star-5 { animation: starPop 2.1s ease-in-out infinite 1s; }
          .amz-price { animation: priceFloat 3.8s ease-in-out infinite; }
          .amz-dot { animation: glowDot 2.8s ease-in-out infinite; }
          .amz-dot-2 { animation: glowDot 3.2s ease-in-out infinite .7s; }
          .amz-dot-3 { animation: glowDot 2.5s ease-in-out infinite 1.4s; }
          .amz-line { animation: linePulse 2.4s ease-in-out infinite; }
          .amz-arrow { animation: arrowBounce 2s ease-in-out infinite; }
          .amz-discount { animation: discountPulse 2.6s ease-in-out infinite; transform-origin: center; }
          @media (prefers-reduced-motion: reduce) {
            * { animation: none !important; }
          }
        `}</style>

        <g className="bot-float">
          <g className="bot-left-ear" filter={`url(#${uid}-blueDrop)`}>
            <path d="M283 389 C268 331 269 257 289 224 C301 204 321 210 349 226 C384 246 423 283 453 321 C436 350 408 378 377 400 C340 426 300 424 283 389Z" fill={`url(#${uid}-earBlue)`} stroke="#4ba8ff" strokeWidth="3"/>
            <path d="M309 350 C299 308 304 262 319 244 C332 229 350 246 374 266 C403 291 423 315 436 337 C420 353 402 373 379 385 C347 403 319 390 309 350Z" fill={`url(#${uid}-earInner)`} opacity=".94"/>
            <path d="M291 244 C280 281 282 330 293 361" fill="none" stroke="#ffb4e4" strokeWidth="8" strokeLinecap="round" opacity=".54"/>
            <path d="M319 235 C351 249 398 290 430 331" fill="none" stroke="#8cf7ff" strokeWidth="5" strokeLinecap="round" opacity=".65"/>
          </g>

          <g className="bot-right-ear" filter={`url(#${uid}-blueDrop)`}>
            <path d="M741 389 C756 331 755 257 735 224 C723 204 703 210 675 226 C640 246 601 283 571 321 C588 350 616 378 647 400 C684 426 724 424 741 389Z" fill={`url(#${uid}-earBlue)`} stroke="#4ba8ff" strokeWidth="3"/>
            <path d="M715 350 C725 308 720 262 705 244 C692 229 674 246 650 266 C621 291 601 315 588 337 C604 353 622 373 645 385 C677 403 705 390 715 350Z" fill={`url(#${uid}-earInner)`} opacity=".94"/>
            <path d="M733 244 C744 281 742 330 731 361" fill="none" stroke="#b2c8ff" strokeWidth="8" strokeLinecap="round" opacity=".54"/>
            <path d="M705 235 C673 249 626 290 594 331" fill="none" stroke="#8cf7ff" strokeWidth="5" strokeLinecap="round" opacity=".65"/>
          </g>

          {/* AMAZON SALES GRAPH - left side, enlarged */}
          <g className="ef-1">
            <g transform="translate(40, 440)">
              <rect x="0" y="0" width="220" height="140" rx="16" fill="#0a1628" stroke="#00d4ff" strokeWidth="1.5" opacity="0.85"/>
              <text x="14" y="24" fill="#00d4ff" fontSize="13" fontFamily="Arial" fontWeight="bold" letter-spacing="1">SALES ANALYTICS</text>
              <rect className="bar-a" x="28" y="55" width="22" height="70" rx="5" fill={`url(#${uid}-graphGrad)`} stroke="#00d4ff" strokeWidth="1.2"/>
              <rect className="bar-b" x="62" y="75" width="22" height="50" rx="5" fill={`url(#${uid}-graphGrad)`} stroke="#00d4ff" strokeWidth="1.2"/>
              <rect className="bar-c" x="96" y="30" width="22" height="95" rx="5" fill={`url(#${uid}-graphGrad)`} stroke="#00d4ff" strokeWidth="1.2"/>
              <rect className="bar-d" x="130" y="60" width="22" height="65" rx="5" fill={`url(#${uid}-graphGrad)`} stroke="#00d4ff" strokeWidth="1.2"/>
              <rect className="bar-a" x="164" y="40" width="22" height="85" rx="5" fill={`url(#${uid}-graphGrad)`} stroke="#00d4ff" strokeWidth="1.2"/>
              <path className="amz-line" d="M39 58 L73 88 L107 42 L141 72 L175 56" fill="none" stroke="#00ff88" strokeWidth="2.5" strokeDasharray="5 3"/>
              <circle cx="39" cy="58" r="3.5" fill="#00ff88"/>
              <circle cx="107" cy="42" r="3.5" fill="#00ff88"/>
              <circle cx="175" cy="56" r="3.5" fill="#00ff88"/>
              <text x="14" y="137" fill="#4cecff" fontSize="12" fontFamily="Arial">Revenue ↑ 127%</text>
            </g>
          </g>

          {/* SHOPPING CART - bottom left, enlarged */}
          <g className="amz-cart">
            <g transform="translate(60, 900)">
              <rect x="0" y="0" width="180" height="110" rx="16" fill={`url(#${uid}-cartGrad)`} stroke="#ff9900" strokeWidth="2" opacity="0.92" filter={`url(#${uid}-blueDrop)`}/>
              <path d="M-4 14 L25 14 L40 60 L95 60 L120 14" fill="none" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="35" cy="80" r="8" fill="none" stroke="#ffffff" strokeWidth="3.5"/>
              <circle cx="80" cy="80" r="8" fill="none" stroke="#ffffff" strokeWidth="3.5"/>
              <path d="M10 4 C25 -10 55 -10 70 4" fill="none" stroke="#ff9900" strokeWidth="4" strokeLinecap="round"/>
              <text x="18" y="48" fill="#ffffff" fontSize="13" fontFamily="Arial" fontWeight="bold">AMAZON CART</text>
              <rect x="130" y="10" width="38" height="38" rx="19" fill="#ff9900"/>
              <text x="137" y="36" fill="#131921" fontSize="20" fontFamily="Arial" fontWeight="bold">1</text>
            </g>
          </g>

          {/* BEST SELLER BADGE - top right, enlarged */}
          <g className="amz-badge">
            <g transform="translate(710, 200)">
              <rect x="0" y="0" width="260" height="78" rx="39" fill={`url(#${uid}-amazonGrad)`} opacity="0.92" filter={`url(#${uid}-orangeGlow)`}/>
              <rect x="4" y="4" width="252" height="70" rx="35" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.4"/>
              <text x="50" y="32" fill="#ffffff" fontSize="15" fontFamily="Arial" fontWeight="bold">⭐ BEST SELLER</text>
              <text x="55" y="56" fill="#fff5e6" fontSize="14" fontFamily="Arial">#1 in Computers & Tablets</text>
              <circle cx="22" cy="39" r="15" fill="#ffffff" opacity="0.2"/>
              <text x="13" y="45" fill="#ff9900" fontSize="18" fontFamily="Arial" fontWeight="bold">#1</text>
              <path className="amz-arrow" d="M230 20 L245 30 L230 40" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
            </g>
          </g>

          {/* STAR RATING - right side, enlarged */}
          <g className="ef-2">
            <g transform="translate(720, 480)">
              <g className="amz-star-1">
                <path d="M18 2 L22 16 L37 16 L25 25 L29 39 L18 30 L7 39 L11 25 L-1 16 L14 16 Z" fill="#ff9900" stroke="#cc7a00" strokeWidth="1"/>
              </g>
              <g className="amz-star-2" transform="translate(44, 0)">
                <path d="M18 2 L22 16 L37 16 L25 25 L29 39 L18 30 L7 39 L11 25 L-1 16 L14 16 Z" fill="#ff9900" stroke="#cc7a00" strokeWidth="1"/>
              </g>
              <g className="amz-star-3" transform="translate(88, 0)">
                <path d="M18 2 L22 16 L37 16 L25 25 L29 39 L18 30 L7 39 L11 25 L-1 16 L14 16 Z" fill="#ff9900" stroke="#cc7a00" strokeWidth="1"/>
              </g>
              <g className="amz-star-4" transform="translate(132, 0)">
                <path d="M18 2 L22 16 L37 16 L25 25 L29 39 L18 30 L7 39 L11 25 L-1 16 L14 16 Z" fill="#ff9900" stroke="#cc7a00" strokeWidth="1"/>
              </g>
              <g className="amz-star-5" transform="translate(176, 0)">
                <path d="M18 2 L22 16 L37 16 L25 25 L29 39 L18 30 L7 39 L11 25 L-1 16 L14 16 Z" fill="#ff9900" stroke="#cc7a00" strokeWidth="1"/>
              </g>
              <text x="10" y="56" fill="#ffbb33" fontSize="14" fontFamily="Arial" fontWeight="bold">4.9 ⭐ (2,847)</text>
            </g>
          </g>

          {/* TRENDING SEARCH - right middle, enlarged */}
          <g className="amz-trend">
            <g transform="translate(740, 680)">
              <rect x="0" y="0" width="200" height="130" rx="16" fill="#0a1628" stroke="#00ff88" strokeWidth="1.5" opacity="0.85"/>
              <text x="12" y="22" fill="#00ff88" fontSize="12" fontFamily="Arial" fontWeight="bold">TRENDING NOW</text>
              <path d="M10 90 L40 65 L65 75 L95 40 L125 50 L155 20 L180 30" fill="none" stroke="#00ff88" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
              <polygon points="175,18 185,28 168,28" fill="#00ff88"/>
              <circle cx="155" cy="20" r="4" fill="#00ff88"/>
              <circle cx="95" cy="40" r="4" fill="#00ff88"/>
              <circle cx="40" cy="65" r="4" fill="#00ff88"/>
              <circle cx="70" cy="105" r="18" fill="none" stroke="#4cecff" strokeWidth="3" opacity="0.7"/>
              <path d="M82 118 L95 131" stroke="#4cecff" strokeWidth="3.5" strokeLinecap="round" opacity="0.7"/>
            </g>
          </g>

          {/* PRICE DISCOUNT - bottom right, enlarged */}
          <g className="amz-discount">
            <g transform="translate(660, 940)">
              <rect x="0" y="0" width="240" height="80" rx="40" fill="#ff6b6b" opacity="0.9" filter={`url(#${uid}-orangeGlow)`}/>
              <rect x="4" y="4" width="232" height="72" rx="36" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.3"/>
              <text x="18" y="34" fill="#ffffff" fontSize="18" fontFamily="Arial" fontWeight="bold">🔥 UP TO 45% OFF</text>
              <text x="22" y="58" fill="#ffe0e0" fontSize="14" fontFamily="Arial">Limited Time Amazon Deal</text>
              <path d="M200 28 L220 40 L200 52" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
            </g>
          </g>

          {/* AMAZON'S CHOICE BADGE - left, enlarged */}
          <g className="ef-5">
            <g transform="translate(50, 750)">
              <rect x="0" y="0" width="170" height="48" rx="24" fill="#1a1a2e" stroke="#ff9900" strokeWidth="2" opacity="0.95"/>
              <text x="16" y="30" fill="#ff9900" fontSize="13" fontFamily="Arial" fontWeight="bold">Amazon's Choice</text>
              <path d="M148 16 L160 24 L148 32" fill="none" stroke="#ff9900" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
            </g>
          </g>

          {/* PRIME BADGE - top left area, enlarged */}
          <g className="ef-4">
            <g transform="translate(70, 320)">
              <rect x="0" y="0" width="110" height="44" rx="22" fill={`url(#${uid}-primeGrad)`} opacity="0.92" filter={`url(#${uid}-blueDrop)`}/>
              <text x="14" y="28" fill="#ffffff" fontSize="14" fontFamily="Arial" fontWeight="bold">PRIME</text>
              <path d="M88 18 L100 22 L88 27" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
            </g>
          </g>

          {/* SEARCH GLASS - left upper, enlarged */}
          <g className="ef-3">
            <g transform="translate(52, 560)">
              <circle cx="30" cy="30" r="26" fill="#0a3dcf" opacity="0.3" filter={`url(#${uid}-softGlow)`}/>
              <circle cx="30" cy="30" r="22" fill="none" stroke="#4cecff" strokeWidth="4" opacity="0.8"/>
              <path d="M46 46 L62 62" stroke="#4cecff" strokeWidth="4.5" strokeLinecap="round" opacity="0.8"/>
            </g>
          </g>

          {/* GLOWING DOTS */}
          <circle className="amz-dot" cx="280" cy="380" r="6" fill="#00ff88" filter={`url(#${uid}-smallGlow)`}/>
          <circle className="amz-dot-2" cx="720" cy="380" r="5" fill="#00d4ff" filter={`url(#${uid}-smallGlow)`}/>
          <circle className="amz-dot-3" cx="900" cy="620" r="4.5" fill="#ff9900" filter={`url(#${uid}-orangeGlow)`}/>
          <circle className="amz-dot" cx="880" cy="420" r="3.5" fill="#ff6b6b" filter={`url(#${uid}-smallGlow)`}/>

          <g className="bot-body">
            <g className="bot-left-arm" filter={`url(#${uid}-blueDrop)`}>
              <path d="M326 704 C282 732 241 768 197 802 C182 814 180 835 194 849 C212 868 254 865 290 850 C325 835 350 807 362 775 C370 752 360 720 326 704Z" fill={`url(#${uid}-blueMetalReverse)`}/>
              <path d="M321 724 C286 749 253 778 218 806 C203 818 208 837 228 838 C268 841 317 818 340 778 C352 756 347 735 321 724Z" fill="#2a72ff" opacity=".34"/>
              <path d="M205 817 C241 839 301 816 334 777" fill="none" stroke="#8eeeff" strokeWidth="6" strokeLinecap="round" opacity=".42"/>
            </g>

            <g className="bot-right-arm" filter={`url(#${uid}-blueDrop)`}>
              <path d="M698 704 C742 732 783 768 827 802 C842 814 844 835 830 849 C812 868 770 865 734 850 C699 835 674 807 662 775 C654 752 664 720 698 704Z" fill={`url(#${uid}-blueMetal)`}/>
              <path d="M703 724 C738 749 771 778 806 806 C821 818 816 837 796 838 C756 841 707 818 684 778 C672 756 677 735 703 724Z" fill="#2a72ff" opacity=".34"/>
              <path d="M819 817 C783 839 723 816 690 777" fill="none" stroke="#8eeeff" strokeWidth="6" strokeLinecap="round" opacity=".42"/>
            </g>

            <path d="M347 671 C389 646 635 646 677 671 C707 689 714 738 707 804 L687 967 C678 1034 614 1090 512 1090 C410 1090 346 1034 337 967 L317 804 C310 738 317 689 347 671Z" fill={`url(#${uid}-shellShade)`} stroke="#8bb8ff" strokeWidth="3" filter={`url(#${uid}-shellDrop)`}/>
            <path d="M330 861 C379 888 645 888 694 861 L687 926 C635 954 389 954 337 926Z" fill={`url(#${uid}-blueMetal)`} stroke="#1cd0ff" strokeWidth="2"/>
            <path d="M342 880 C394 902 630 902 682 880" fill="none" stroke="#8ff3ff" strokeWidth="8" opacity=".58"/>
            <path d="M353 923 C403 949 621 949 671 923 L656 986 C643 1042 588 1076 512 1076 C436 1076 381 1042 368 986Z" fill={`url(#${uid}-shellShade)`}/>
            <path d="M384 1006 C425 1047 599 1047 640 1006" fill="none" stroke="#d8f8ff" strokeWidth="8" strokeLinecap="round" opacity=".64"/>
            <ellipse cx="512" cy="1043" rx="84" ry="21" fill="#66e8ff" opacity=".23" filter={`url(#${uid}-smallGlow)`}/>
            <path d="M370 759 C400 730 624 730 654 759 C671 776 674 836 655 860 C627 895 397 895 369 860 C350 836 353 776 370 759Z" fill={`url(#${uid}-blueMetalReverse)`} stroke="#0bd5ff" strokeWidth="3" filter={`url(#${uid}-blueDrop)`}/>
            <path d="M391 775 C436 758 588 758 633 775" fill="none" stroke="#87f0ff" strokeWidth="7" strokeLinecap="round" opacity=".43"/>
            <ellipse className="bot-chest-glow" cx="512" cy="824" rx="112" ry="58" fill="#14d8ff" opacity=".34" filter={`url(#${uid}-softGlow)`}/>
            <g className="bot-d-mark" filter={`url(#${uid}-smallGlow)`}>
              <path fill="#ffffff" fillRule="evenodd" d="M468 764 H529 C591 764 622 789 622 824 C622 859 591 884 529 884 H468 Z M501 790 V858 H527 C566 858 587 845 587 824 C587 803 566 790 527 790 Z"/>
              <path d="M473 771 H526 C577 771 605 790 611 816" fill="none" stroke="#c7f7ff" strokeWidth="5" strokeLinecap="round" opacity=".75"/>
            </g>
            <path d="M329 333 C375 295 649 295 695 333 C747 376 768 455 758 539 C750 611 717 674 666 704 C614 734 410 734 358 704 C307 674 274 611 266 539 C256 455 277 376 329 333Z" fill={`url(#${uid}-shell)`} stroke="#89b7ff" strokeWidth="3" filter={`url(#${uid}-shellDrop)`}/>
            <path d="M475 316 C486 307 538 307 549 316 L547 348 C544 376 528 385 512 385 C496 385 480 376 477 348Z" fill={`url(#${uid}-blueMetal)`} stroke="#135cff" strokeWidth="2"/>
            <path d="M489 322 C502 317 522 317 535 322" fill="none" stroke="#84f2ff" strokeWidth="5" strokeLinecap="round" opacity=".6"/>
            <path d="M336 404 C385 371 437 387 479 400 C500 406 524 406 545 400 C589 387 640 372 688 404 C731 433 746 487 736 540 C726 597 689 635 636 636 C592 637 560 620 537 617 C520 615 504 615 487 617 C464 620 432 637 388 636 C335 635 298 597 288 540 C278 487 293 433 336 404Z" fill={`url(#${uid}-blueMetal)`} stroke="#54e7ff" strokeWidth="5"/>
            <path d="M343 420 C386 391 438 409 478 420 C500 426 524 426 546 420 C588 408 640 390 681 420 C716 446 727 492 719 535 C711 579 679 611 634 612 C594 613 567 598 541 595 C522 593 501 593 482 595 C456 598 428 614 388 612 C342 610 312 578 305 534 C298 491 309 447 343 420Z" fill={`url(#${uid}-visor)`} stroke="#0aaeff" strokeWidth="3"/>
            <ellipse cx="512" cy="502" rx="184" ry="97" fill="#0056ff" opacity=".16" filter={`url(#${uid}-softGlow)`} clipPath={`url(#${uid}-visorClip)`}/>
            <path d="M355 430 C420 398 465 442 525 426 C578 411 627 388 679 427" fill="none" stroke="#67dcff" strokeWidth="7" strokeLinecap="round" opacity=".38" clipPath={`url(#${uid}-visorClip)`}/>
            <path d="M536 441 C581 416 633 408 677 438 C651 438 626 453 607 471 C581 468 555 458 536 441Z" fill="#d7f8ff" opacity=".55" clipPath={`url(#${uid}-visorClip)`}/>
            <g className="bot-eye" filter={`url(#${uid}-eyeGlow)`}>
              <circle cx="425" cy="505" r="38" fill={`url(#${uid}-eye)`}/>
              <circle cx="414" cy="493" r="10" fill="#ffffff" opacity=".86"/>
              <ellipse cx="425" cy="518" rx="28" ry="12" fill="#00beff" opacity=".26"/>
            </g>
            <g className="bot-eye" filter={`url(#${uid}-eyeGlow)`}>
              <circle cx="599" cy="505" r="38" fill={`url(#${uid}-eye)`}/>
              <circle cx="588" cy="493" r="10" fill="#ffffff" opacity=".86"/>
              <ellipse cx="599" cy="518" rx="28" ry="12" fill="#00beff" opacity=".26"/>
            </g>
            <circle className="bot-spark-l" cx="477" cy="485" r="3.7" fill="#3ff5ff" filter={`url(#${uid}-smallGlow)`}/>
            <circle className="bot-spark-r" cx="535" cy="478" r="3.3" fill="#3ff5ff" filter={`url(#${uid}-smallGlow)`}/>
            <circle cx="505" cy="466" r="2" fill="#bafcff" opacity=".7"/>
            <circle cx="551" cy="513" r="2" fill="#bafcff" opacity=".58"/>
            <path d="M286 584 C326 668 393 700 512 700 C631 700 698 668 738 584 C729 644 701 694 657 718 C603 747 421 747 367 718 C323 694 295 644 286 584Z" fill={`url(#${uid}-blueMetal)`}/>
            <path d="M300 619 C345 686 414 711 512 711 C610 711 679 686 724 619" fill="none" stroke="#53ecff" strokeWidth="8" opacity=".65"/>
            <path d="M323 655 C374 699 435 716 512 716 C589 716 650 699 701 655" fill="none" stroke="#eaffff" strokeWidth="3" opacity=".5"/>
            <path d="M309 390 C284 436 282 500 294 548" fill="none" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" opacity=".5"/>
            <path d="M697 366 C724 405 739 454 737 495" fill="none" stroke="#d8f8ff" strokeWidth="7" strokeLinecap="round" opacity=".48"/>
            <path d="M389 337 C450 314 572 314 635 337" fill="none" stroke="#ffffff" strokeWidth="9" strokeLinecap="round" opacity=".62"/>
            <path d="M365 725 C405 744 619 744 659 725" fill="none" stroke="#d7f8ff" strokeWidth="5" opacity=".55"/>
            <circle className="bot-spark1" cx="404" cy="350" r="3" fill="#8effff" filter={`url(#${uid}-smallGlow)`}/>
            <circle className="bot-spark2" cx="641" cy="365" r="2.8" fill="#8effff" filter={`url(#${uid}-smallGlow)`}/>
            <circle className="bot-spark3" cx="576" cy="331" r="2.4" fill="#ffffff" filter={`url(#${uid}-smallGlow)`}/>
          </g>

          <g filter={`url(#${uid}-softGlow)`}>
            <path d="M446 1072 C460 1051 564 1051 578 1072 C589 1089 571 1114 551 1128 C534 1140 490 1140 473 1128 C453 1114 435 1089 446 1072Z" fill={`url(#${uid}-blueMetal)`} stroke="#51eaff" strokeWidth="3"/>
            <path className="bot-thruster-core" d="M468 1110 C483 1093 541 1093 556 1110 C571 1128 557 1168 540 1191 C530 1204 494 1204 484 1191 C467 1168 453 1128 468 1110Z" fill={`url(#${uid}-thruster)`} stroke="#7af6ff" strokeWidth="3"/>
            <path d="M486 1118 C496 1108 528 1108 538 1118 C546 1128 536 1161 526 1175 C520 1183 504 1183 498 1175 C488 1161 478 1128 486 1118Z" fill="#e8ffff" opacity=".48"/>
          </g>
        </g>
      </svg>
    </div>
  );
}
