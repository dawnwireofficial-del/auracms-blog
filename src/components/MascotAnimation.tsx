import React from 'react';

const styles = `
  .bot {
    transform-origin: 600px 710px;
    animation: jump 2.5s ease-in-out infinite;
  }
  .shadow {
    transform-origin: 600px 1238px;
    animation: shadowPulse 2.5s ease-in-out infinite;
  }
  .head {
    transform-origin: 600px 510px;
    animation: headTurn 3.8s ease-in-out infinite;
  }
  .face-look {
    animation: lookAround 3.8s ease-in-out infinite;
  }
  .blink {
    transform-origin: 600px 533px;
    animation: blink 3.8s ease-in-out infinite;
  }
  .smile {
    animation: smileShift 3.8s ease-in-out infinite;
  }
  .rocket-flame {
    transform-origin: 600px 1086px;
    animation: flameBlast 0.26s ease-in-out infinite alternate;
  }
  .rocket-core {
    transform-origin: 600px 1086px;
    animation: flameCore 0.22s ease-in-out infinite alternate;
  }
  .arms {
    transform-origin: 600px 740px;
    animation: armBounce 2.5s ease-in-out infinite;
  }
  .bodyBob {
    transform-origin: 600px 710px;
    animation: bodyTilt 2.5s ease-in-out infinite;
  }
  @keyframes jump {
    0%, 100% { transform: translateY(0px); }
    15% { transform: translateY(18px); }
    45% { transform: translateY(-58px); }
    60% { transform: translateY(-86px); }
    78% { transform: translateY(-16px); }
  }
  @keyframes shadowPulse {
    0%, 100% { transform: scaleX(1) scaleY(1); opacity: .26; }
    55% { transform: scaleX(.68) scaleY(.72); opacity: .14; }
  }
  @keyframes headTurn {
    0%, 18%, 100% { transform: rotate(0deg); }
    28%, 42% { transform: rotate(-6deg); }
    58%, 74% { transform: rotate(6deg); }
  }
  @keyframes lookAround {
    0%, 18%, 100% { transform: translateX(0px); }
    28%, 42% { transform: translateX(-16px); }
    58%, 74% { transform: translateX(16px); }
  }
  @keyframes blink {
    0%, 12%, 28%, 54%, 78%, 100% { transform: scaleY(1); opacity: 1; }
    14%, 16% { transform: scaleY(.08); opacity: .9; }
    56%, 58% { transform: scaleY(.08); opacity: .9; }
    80%, 82% { transform: scaleY(.08); opacity: .9; }
  }
  @keyframes smileShift {
    0%, 18%, 100% { transform: translateX(0px); }
    28%, 42% { transform: translateX(-8px); }
    58%, 74% { transform: translateX(8px); }
  }
  @keyframes flameBlast {
    0%   { transform: scaleY(.75) scaleX(.88); opacity: .75; }
    100% { transform: scaleY(1.25) scaleX(1.08); opacity: 1; }
  }
  @keyframes flameCore {
    0%   { transform: scaleY(.78) scaleX(.9); opacity: .72; }
    100% { transform: scaleY(1.18) scaleX(1.04); opacity: 1; }
  }
  @keyframes armBounce {
    0%, 100% { transform: translateY(0px); }
    55% { transform: translateY(-8px); }
  }
  @keyframes bodyTilt {
    0%, 100% { transform: rotate(0deg); }
    20% { transform: rotate(-2deg); }
    60% { transform: rotate(2deg); }
  }
`;

export default function MascotAnimation({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <style>{styles}</style>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1200 1400"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        style={{ maxWidth: 320, maxHeight: 380 }}
      >
        <defs>
          <linearGradient id="botBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff"/>
            <stop offset="55%" stopColor="#F3F7FF"/>
            <stop offset="100%" stopColor="#DCEAFF"/>
          </linearGradient>
          <linearGradient id="botShadow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fefefe"/>
            <stop offset="65%" stopColor="#EAF2FF"/>
            <stop offset="100%" stopColor="#9BC2FF"/>
          </linearGradient>
          <linearGradient id="purple" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6EA2FF"/>
            <stop offset="50%" stopColor="#246BFF"/>
            <stop offset="100%" stopColor="#0A1F44"/>
          </linearGradient>
          <radialGradient id="faceGlow" cx="50%" cy="45%" r="70%">
            <stop offset="0%" stopColor="#0D2B5F"/>
            <stop offset="55%" stopColor="#08152E"/>
            <stop offset="100%" stopColor="#030C10"/>
          </radialGradient>
          <linearGradient id="cyanGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A9ECFF"/>
            <stop offset="45%" stopColor="#4DA3FF"/>
            <stop offset="100%" stopColor="#246BFF"/>
          </linearGradient>
          <radialGradient id="flameOuter" cx="50%" cy="25%" r="70%">
            <stop offset="0%" stopColor="#fff3a8"/>
            <stop offset="40%" stopColor="#ffba49"/>
            <stop offset="78%" stopColor="#ff6d2e"/>
            <stop offset="100%" stopColor="#246BFF" stopOpacity="0.78"/>
          </radialGradient>
          <radialGradient id="flameInner" cx="50%" cy="20%" r="80%">
            <stop offset="0%" stopColor="#ffffff"/>
            <stop offset="45%" stopColor="#cfffff"/>
            <stop offset="100%" stopColor="#4DA3FF" stopOpacity="0.8"/>
          </radialGradient>
          <radialGradient id="groundGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#246BFF" stopOpacity="0.32"/>
            <stop offset="100%" stopColor="#246BFF" stopOpacity="0"/>
          </radialGradient>
          <filter id="softShadow" x="-35%" y="-35%" width="170%" height="170%">
            <feDropShadow dx="0" dy="20" stdDeviation="24" floodColor="#246BFF" floodOpacity="0.20"/>
          </filter>
          <filter id="glowBlue" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="glowFlame" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="10" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <rect width="1200" height="1400" fill="transparent"/>

        <ellipse className="shadow" cx="600" cy="1238" rx="170" ry="46" fill="url(#groundGlow)"/>

        <g className="bot" filter="url(#softShadow)">
          <g className="rocket-flame" filter="url(#glowFlame)">
            <path d="M548 1082 C550 1144 564 1190 600 1256 C636 1190 650 1144 652 1082 C642 1100 624 1110 600 1111 C576 1110 558 1100 548 1082Z" fill="url(#flameOuter)" opacity=".94"/>
          </g>
          <g className="rocket-core" filter="url(#glowBlue)">
            <path d="M575 1090 C578 1135 586 1164 600 1198 C614 1164 622 1135 625 1090 C618 1098 609 1103 600 1103 C591 1103 582 1098 575 1090Z" fill="url(#flameInner)" opacity=".95"/>
          </g>

          <g className="bodyBob">
            <path d="M520 258 C559 184 651 155 736 157 C758 158 768 172 755 188 C730 179 693 182 665 210 C624 251 578 282 536 287 C517 289 508 279 520 258Z" fill="url(#botShadow)" stroke="#BBD3FF" strokeWidth="3"/>
            <path d="M642 184 C695 167 742 171 760 195 C728 184 690 187 664 211 C648 225 632 238 615 250" fill="none" stroke="#246BFF" strokeWidth="16" strokeLinecap="round" opacity=".5"/>

            <g className="head">
              <path d="M332 472 C332 350 435 226 593 214 C766 201 868 323 868 481 C868 608 775 675 596 675 C426 675 332 604 332 472Z" fill="url(#botBody)"/>
              <path d="M337 419 C300 454 296 532 337 576 C322 511 322 465 337 419Z" fill="#246BFF" opacity=".38"/>
              <path d="M863 424 C904 458 902 536 862 579 C876 515 876 471 863 424Z" fill="#246BFF" opacity=".38"/>
              <path d="M367 449 C373 384 413 350 487 350 H702 C788 350 828 396 825 469 C823 550 773 589 689 589 H482 C408 589 362 534 367 449Z" fill="url(#faceGlow)" stroke="#246BFF" strokeWidth="5"/>
              <ellipse cx="400" cy="384" rx="20" ry="11" fill="#fff" opacity=".35" transform="rotate(-38 400 384)"/>
              <ellipse cx="727" cy="383" rx="18" ry="10" fill="#fff" opacity=".2" transform="rotate(30 727 383)"/>

              <g className="face-look">
                <g className="blink">
                  <path d="M402 479 C410 437 456 434 465 479" fill="none" stroke="url(#cyanGlow)" strokeWidth="18" strokeLinecap="round" filter="url(#glowBlue)"/>
                  <path d="M568 479 C576 437 622 434 631 479" fill="none" stroke="url(#cyanGlow)" strokeWidth="18" strokeLinecap="round" filter="url(#glowBlue)"/>
                </g>
                <g className="smile">
                  <path d="M482 519 C496 542 531 545 546 521" fill="none" stroke="url(#cyanGlow)" strokeWidth="9" strokeLinecap="round" filter="url(#glowBlue)"/>
                </g>
              </g>

              <g>
                <circle cx="840" cy="479" r="63" fill="url(#botShadow)" stroke="#BBD3FF" strokeWidth="4"/>
                <circle cx="840" cy="479" r="44" fill="url(#purple)" opacity=".95"/>
                <circle cx="840" cy="479" r="26" fill="#EAF2FF" opacity=".8"/>
                <circle cx="840" cy="479" r="54" fill="none" stroke="#FF8A00" strokeWidth="6" opacity=".42"/>
              </g>

              <g opacity=".58">
                <ellipse cx="332" cy="479" rx="25" ry="56" fill="url(#purple)"/>
                <ellipse cx="332" cy="479" rx="15" ry="42" fill="#DCEAFF"/>
              </g>
            </g>

            <path d="M449 646 C492 677 707 678 754 645 L750 697 C696 727 501 726 455 697Z" fill="url(#purple)"/>
            <path d="M463 665 C524 686 678 687 740 665" fill="none" stroke="#A9ECFF" strokeWidth="10" opacity=".82" filter="url(#glowBlue)"/>

            <path d="M425 689 C463 653 732 654 782 690 C848 736 838 865 802 920 C767 972 684 994 600 992 C494 990 412 954 383 886 C357 824 367 743 425 689Z" fill="url(#botBody)" stroke="#BBD3FF" strokeWidth="4"/>
            <path d="M455 710 C492 745 531 767 601 768 C678 769 726 744 768 706 C822 789 796 902 713 939 C633 975 500 951 437 890 C402 829 413 756 455 710Z" fill="#fff" opacity=".38"/>
            <path d="M441 780 C469 829 519 873 588 878 C646 883 709 865 758 805" fill="none" stroke="#7EA7EF" strokeWidth="4" opacity=".75"/>

            <g transform="translate(0 0)">
              <rect x="524" y="788" width="152" height="70" rx="24" fill="#08152E" opacity="0.96"/>
              <path d="M548 832 C570 804 608 804 629 831 C600 820 575 820 548 832Z" fill="#FF8A00" opacity="0.95"/>
              <path d="M545 826 L578 826 C595 826 606 815 608 801 C618 819 630 834 648 839 L667 803" fill="none" stroke="#FFFFFF" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M646 838 L675 791 L704 838 L730 783" fill="none" stroke="#246BFF" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M730 783 L728 815 M730 783 L700 790" fill="none" stroke="#246BFF" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="590" cy="818" r="18" fill="#FF8A00" opacity="0.35"/>
            </g>

            <circle cx="562" cy="875" r="4" fill="#FF8A00" opacity="0.9"/>
            <circle cx="581" cy="878" r="4" fill="#FF8A00" opacity="0.8"/>
            <circle cx="600" cy="880" r="4" fill="#FF8A00" opacity="0.7"/>

            <g className="arms">
              <g>
                <path d="M386 732 C326 757 279 828 255 880 C245 904 260 923 284 910 C345 876 402 833 425 775 C435 747 416 721 386 732Z" fill="url(#botShadow)" stroke="#BBD3FF" strokeWidth="4"/>
                <path d="M281 871 C321 812 365 772 409 755 C391 812 348 859 281 902Z" fill="url(#purple)" opacity=".88"/>
                <circle cx="398" cy="736" r="33" fill="url(#purple)" opacity=".86"/>
              </g>
              <g>
                <path d="M823 730 C885 755 930 824 954 877 C966 902 949 922 923 909 C863 876 806 832 783 775 C772 746 791 719 823 730Z" fill="url(#botShadow)" stroke="#BBD3FF" strokeWidth="4"/>
                <path d="M926 870 C887 812 843 772 799 756 C818 810 860 857 926 900Z" fill="url(#purple)" opacity=".88"/>
                <circle cx="810" cy="735" r="33" fill="url(#purple)" opacity=".86"/>
              </g>
            </g>

            <path d="M503 940 C543 954 660 958 701 940 C694 987 651 1032 602 1032 C553 1032 512 985 503 940Z" fill="url(#purple)"/>
            <path d="M523 962 C563 974 637 974 681 963" fill="none" stroke="#A9ECFF" strokeWidth="10" opacity=".83" filter="url(#glowBlue)"/>
            <ellipse cx="602" cy="1024" rx="47" ry="20" fill="#0A1F44" opacity=".78"/>
            <ellipse cx="714" cy="718" rx="28" ry="17" fill="#fff" opacity=".62"/>
            <ellipse cx="787" cy="824" rx="16" ry="11" fill="#fff" opacity=".44"/>
          </g>
        </g>
      </svg>
    </div>
  );
}
