import { useId } from 'react';

export default function MascotAnimation({ className = '' }: { className?: string }) {
  const uid = useId();
  return (
    <div className={className}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1024 1400"
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
          <filter id={`${uid}-shadow`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="14"/>
          </filter>
          <filter id={`${uid}-softGlow`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id={`${uid}-eyeGlow`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="8" result="b1"/>
            <feGaussianBlur stdDeviation="3" in="SourceGraphic" result="b2"/>
            <feMerge><feMergeNode in="b1"/><feMergeNode in="b2"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id={`${uid}-blueDrop`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#00208a" floodOpacity="0.30"/>
          </filter>
          <filter id={`${uid}-shellDrop`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#042080" floodOpacity="0.28"/>
          </filter>
          <filter id={`${uid}-smallGlow`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <clipPath id={`${uid}-visorClip`}>
            <path d="M343 420 C386 391 438 409 478 420 C500 426 524 426 546 420 C588 408 640 390 681 420 C716 446 727 492 719 535 C711 579 679 611 634 612 C594 613 567 598 541 595 C522 593 501 593 482 595 C456 598 428 614 388 612 C342 610 312 578 305 534 C298 491 309 447 343 420Z"/>
          </clipPath>
        </defs>

        <style>{`
          @keyframes botFloat {
            0%,100% { transform: translateY(0) rotate(-0.35deg); }
            50% { transform: translateY(-14px) rotate(0.55deg); }
          }
          @keyframes botBreathe {
            0%,100% { transform: scale(1); }
            50% { transform: scale(1.006,1.010); }
          }
          @keyframes botLeftArm {
            0%,100% { transform: rotate(2deg); }
            50% { transform: rotate(-6deg); }
          }
          @keyframes botRightArm {
            0%,100% { transform: rotate(-2deg); }
            50% { transform: rotate(6deg); }
          }
          @keyframes botLeftEar {
            0%,100% { transform: rotate(-1deg); }
            50% { transform: rotate(-3deg); }
          }
          @keyframes botRightEar {
            0%,100% { transform: rotate(1deg); }
            50% { transform: rotate(3deg); }
          }
          @keyframes botBlink {
            0%, 43%, 46%, 48%, 100% { transform: scaleY(1); }
            44%, 47% { transform: scaleY(0.08); }
          }
          @keyframes botEyePulse {
            0%,100% { opacity: .92; filter: brightness(1); }
            50% { opacity: 1; filter: brightness(1.18); }
          }
          @keyframes botChestPulse {
            0%,100% { opacity: .25; }
            50% { opacity: .60; }
          }
          @keyframes botDPulse {
            0%,100% { transform: scale(1); }
            50% { transform: scale(1.030); }
          }
          @keyframes botThruster {
            0%,100% { transform: scaleY(.94) scaleX(.97); opacity: .90; }
            50% { transform: scaleY(1.06) scaleX(1.02); opacity: 1; }
          }
          @keyframes botSparkle {
            0%,100% { opacity: .25; transform: scale(.7); }
            50% { opacity: 1; transform: scale(1.2); }
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
          @media (prefers-reduced-motion: reduce) {
            * { animation: none !important; }
          }
        `}</style>

        <g className="bot-float">
          <g className="bot-left-ear" filter={`url(#${uid}-blueDrop)`}>
            <path d="M283 389 C268 331 269 257 289 224 C301 204 321 210 349 226 C384 246 423 283 453 321 C436 350 408 378 377 400 C340 426 300 424 283 389Z" fill={`url(#${uid}-earBlue)`} stroke="#4ba8ff" strokeWidth="2.5"/>
            <path d="M309 350 C299 308 304 262 319 244 C332 229 350 246 374 266 C403 291 423 315 436 337 C420 353 402 373 379 385 C347 403 319 390 309 350Z" fill={`url(#${uid}-earInner)`} opacity=".94"/>
            <path d="M291 244 C280 281 282 330 293 361" fill="none" stroke="#ffb4e4" strokeWidth="6" strokeLinecap="round" opacity=".54"/>
            <path d="M319 235 C351 249 398 290 430 331" fill="none" stroke="#8cf7ff" strokeWidth="4" strokeLinecap="round" opacity=".65"/>
          </g>

          <g className="bot-right-ear" filter={`url(#${uid}-blueDrop)`}>
            <path d="M741 389 C756 331 755 257 735 224 C723 204 703 210 675 226 C640 246 601 283 571 321 C588 350 616 378 647 400 C684 426 724 424 741 389Z" fill={`url(#${uid}-earBlue)`} stroke="#4ba8ff" strokeWidth="2.5"/>
            <path d="M715 350 C725 308 720 262 705 244 C692 229 674 246 650 266 C621 291 601 315 588 337 C604 353 622 373 645 385 C677 403 705 390 715 350Z" fill={`url(#${uid}-earInner)`} opacity=".94"/>
            <path d="M733 244 C744 281 742 330 731 361" fill="none" stroke="#b2c8ff" strokeWidth="6" strokeLinecap="round" opacity=".54"/>
            <path d="M705 235 C673 249 626 290 594 331" fill="none" stroke="#8cf7ff" strokeWidth="4" strokeLinecap="round" opacity=".65"/>
          </g>

          <g className="bot-body">
            <g className="bot-left-arm" filter={`url(#${uid}-blueDrop)`}>
              <path d="M326 704 C282 732 241 768 197 802 C182 814 180 835 194 849 C212 868 254 865 290 850 C325 835 350 807 362 775 C370 752 360 720 326 704Z" fill={`url(#${uid}-blueMetalReverse)`}/>
              <path d="M321 724 C286 749 253 778 218 806 C203 818 208 837 228 838 C268 841 317 818 340 778 C352 756 347 735 321 724Z" fill="#2a72ff" opacity=".34"/>
              <path d="M205 817 C241 839 301 816 334 777" fill="none" stroke="#8eeeff" strokeWidth="5" strokeLinecap="round" opacity=".42"/>
            </g>

            <g className="bot-right-arm" filter={`url(#${uid}-blueDrop)`}>
              <path d="M698 704 C742 732 783 768 827 802 C842 814 844 835 830 849 C812 868 770 865 734 850 C699 835 674 807 662 775 C654 752 664 720 698 704Z" fill={`url(#${uid}-blueMetal)`}/>
              <path d="M703 724 C738 749 771 778 806 806 C821 818 816 837 796 838 C756 841 707 818 684 778 C672 756 677 735 703 724Z" fill="#2a72ff" opacity=".34"/>
              <path d="M819 817 C783 839 723 816 690 777" fill="none" stroke="#8eeeff" strokeWidth="5" strokeLinecap="round" opacity=".42"/>
            </g>

            <path d="M347 671 C389 646 635 646 677 671 C707 689 714 738 707 804 L687 967 C678 1034 614 1090 512 1090 C410 1090 346 1034 337 967 L317 804 C310 738 317 689 347 671Z" fill={`url(#${uid}-shellShade)`} stroke="#8bb8ff" strokeWidth="2.5" filter={`url(#${uid}-shellDrop)`}/>
            <path d="M330 861 C379 888 645 888 694 861 L687 926 C635 954 389 954 337 926Z" fill={`url(#${uid}-blueMetal)`} stroke="#1cd0ff" strokeWidth="1.5"/>
            <path d="M342 880 C394 902 630 902 682 880" fill="none" stroke="#8ff3ff" strokeWidth="6" opacity=".58"/>
            <path d="M353 923 C403 949 621 949 671 923 L656 986 C643 1042 588 1076 512 1076 C436 1076 381 1042 368 986Z" fill={`url(#${uid}-shellShade)`}/>
            <path d="M384 1006 C425 1047 599 1047 640 1006" fill="none" stroke="#d8f8ff" strokeWidth="6" strokeLinecap="round" opacity=".64"/>
            <ellipse cx="512" cy="1043" rx="84" ry="21" fill="#66e8ff" opacity=".23" filter={`url(#${uid}-smallGlow)`}/>
            <path d="M370 759 C400 730 624 730 654 759 C671 776 674 836 655 860 C627 895 397 895 369 860 C350 836 353 776 370 759Z" fill={`url(#${uid}-blueMetalReverse)`} stroke="#0bd5ff" strokeWidth="2.5" filter={`url(#${uid}-blueDrop)`}/>
            <path d="M391 775 C436 758 588 758 633 775" fill="none" stroke="#87f0ff" strokeWidth="6" strokeLinecap="round" opacity=".43"/>
            <ellipse className="bot-chest-glow" cx="512" cy="824" rx="112" ry="58" fill="#14d8ff" opacity=".30" filter={`url(#${uid}-softGlow)`}/>
            <g className="bot-d-mark" filter={`url(#${uid}-smallGlow)`}>
              <path fill="#ffffff" fillRule="evenodd" d="M468 764 H529 C591 764 622 789 622 824 C622 859 591 884 529 884 H468 Z M501 790 V858 H527 C566 858 587 845 587 824 C587 803 566 790 527 790 Z"/>
              <path d="M473 771 H526 C577 771 605 790 611 816" fill="none" stroke="#c7f7ff" strokeWidth="4" strokeLinecap="round" opacity=".60"/>
            </g>
            <path d="M329 333 C375 295 649 295 695 333 C747 376 768 455 758 539 C750 611 717 674 666 704 C614 734 410 734 358 704 C307 674 274 611 266 539 C256 455 277 376 329 333Z" fill={`url(#${uid}-shell)`} stroke="#89b7ff" strokeWidth="2.5" filter={`url(#${uid}-shellDrop)`}/>
            <path d="M475 316 C486 307 538 307 549 316 L547 348 C544 376 528 385 512 385 C496 385 480 376 477 348Z" fill={`url(#${uid}-blueMetal)`} stroke="#135cff" strokeWidth="1.5"/>
            <path d="M489 322 C502 317 522 317 535 322" fill="none" stroke="#84f2ff" strokeWidth="4" strokeLinecap="round" opacity=".6"/>
            <path d="M336 404 C385 371 437 387 479 400 C500 406 524 406 545 400 C589 387 640 372 688 404 C731 433 746 487 736 540 C726 597 689 635 636 636 C592 637 560 620 537 617 C520 615 504 615 487 617 C464 620 432 637 388 636 C335 635 298 597 288 540 C278 487 293 433 336 404Z" fill={`url(#${uid}-blueMetal)`} stroke="#54e7ff" strokeWidth="4"/>
            <path d="M343 420 C386 391 438 409 478 420 C500 426 524 426 546 420 C588 408 640 390 681 420 C716 446 727 492 719 535 C711 579 679 611 634 612 C594 613 567 598 541 595 C522 593 501 593 482 595 C456 598 428 614 388 612 C342 610 312 578 305 534 C298 491 309 447 343 420Z" fill={`url(#${uid}-visor)`} stroke="#0aaeff" strokeWidth="2.5"/>
            <ellipse cx="512" cy="502" rx="184" ry="97" fill="#0056ff" opacity=".14" filter={`url(#${uid}-softGlow)`} clipPath={`url(#${uid}-visorClip)`}/>
            <path d="M355 430 C420 398 465 442 525 426 C578 411 627 388 679 427" fill="none" stroke="#67dcff" strokeWidth="6" strokeLinecap="round" opacity=".30" clipPath={`url(#${uid}-visorClip)`}/>
            <path d="M536 441 C581 416 633 408 677 438 C651 438 626 453 607 471 C581 468 555 458 536 441Z" fill="#d7f8ff" opacity=".45" clipPath={`url(#${uid}-visorClip)`}/>
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
            <path d="M300 619 C345 686 414 711 512 711 C610 711 679 686 724 619" fill="none" stroke="#53ecff" strokeWidth="6" opacity=".65"/>
            <path d="M323 655 C374 699 435 716 512 716 C589 716 650 699 701 655" fill="none" stroke="#eaffff" strokeWidth="2.5" opacity=".5"/>
            <path d="M309 390 C284 436 282 500 294 548" fill="none" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" opacity=".5"/>
            <path d="M697 366 C724 405 739 454 737 495" fill="none" stroke="#d8f8ff" strokeWidth="6" strokeLinecap="round" opacity=".48"/>
            <path d="M389 337 C450 314 572 314 635 337" fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" opacity=".62"/>
            <path d="M365 725 C405 744 619 744 659 725" fill="none" stroke="#d7f8ff" strokeWidth="4" opacity=".55"/>
            <circle className="bot-spark1" cx="404" cy="350" r="3" fill="#8effff" filter={`url(#${uid}-smallGlow)`}/>
            <circle className="bot-spark2" cx="641" cy="365" r="2.8" fill="#8effff" filter={`url(#${uid}-smallGlow)`}/>
            <circle className="bot-spark3" cx="576" cy="331" r="2.4" fill="#ffffff" filter={`url(#${uid}-smallGlow)`}/>

            <g filter={`url(#${uid}-softGlow)`}>
              <path d="M448 1068 C460 1048 564 1048 576 1068 C586 1084 570 1108 551 1122 C534 1134 490 1134 473 1122 C454 1108 438 1084 448 1068Z" fill={`url(#${uid}-blueMetal)`} stroke="#51eaff" strokeWidth="2.5"/>
              <path className="bot-thruster-core" d="M468 1106 C483 1090 541 1090 556 1106 C571 1124 557 1162 540 1184 C530 1197 494 1197 484 1184 C467 1162 453 1124 468 1106Z" fill={`url(#${uid}-thruster)`} stroke="#7af6ff" strokeWidth="2.5"/>
              <path d="M486 1114 C496 1104 528 1104 538 1114 C546 1124 536 1155 526 1168 C520 1176 504 1176 498 1168 C488 1155 478 1124 486 1114Z" fill="#e8ffff" opacity=".48"/>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
