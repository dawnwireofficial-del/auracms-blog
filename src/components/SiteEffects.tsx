import React, { useEffect, useRef } from 'react';

/**
 * SiteEffects — premium motion layer with GSAP ScrollTrigger:
 *  1. Scroll progress bar (top, gradient)
 *  2. Cursor glow follower (desktop, fine pointers only)
 *  3. Scroll-reveal for [data-reveal] elements (fade-up on enter)
 *  4. GSAP ScrollTrigger premium animations:
 *     - Parallax on hero/background images
 *     - Staggered scale/rotation reveals
 *     - Text word-by-word animations
 *     - Image parallax & scale on scroll
 *     - Counter number animations
 *     - Progress ring animations
 *     - Pin/sticky section effects
 *     - Horizontal scroll sections
 *     - Background color transitions on scroll
 *  All effects respect prefers-reduced-motion and are disabled on touch.
 */
declare global {
  interface Window {
    gsap: any;
    ScrollTrigger: any;
  }
}

export default function SiteEffects() {
  const barRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const parallaxRefs = useRef<HTMLDivElement[]>([]);
  const staggerRefs = useRef<HTMLDivElement[]>([]);
  const textRefs = useRef<HTMLDivElement[]>([]);
  const counterRefs = useRef<HTMLDivElement[]>([]);
  const progressRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const isMobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;

    // Wait for GSAP to be available
    const initGSAP = () => {
      if (!window.gsap || !window.ScrollTrigger || reduced) return;
      
      const gsap = window.gsap;
      const ScrollTrigger = window.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      // ---- 4. PARALLAX on hero/background images ----
      parallaxRefs.current = Array.from(document.querySelectorAll('[data-parallax]'));
      parallaxRefs.current.forEach((el) => {
        const speed = parseFloat(el.getAttribute('data-parallax') || '0.3');
        gsap.to(el, {
          yPercent: -100 * speed,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        });
      });

      // ---- 5. STAGGERED REVEALS with scale/rotation ----
      staggerRefs.current = Array.from(document.querySelectorAll('[data-stagger]'));
      staggerRefs.current.forEach((container) => {
        const children = Array.from(container.querySelectorAll('[data-stagger-item]'));
        if (children.length === 0) return;
        
        gsap.from(children, {
          y: 100,
          scale: 0.8,
          rotation: -5,
          opacity: 0,
          duration: 1.2,
          ease: 'elastic.out(1, 0.5)',
          stagger: 0.15,
          scrollTrigger: {
            trigger: container,
            start: 'top 90%',
            end: 'bottom 10%',
            toggleActions: 'play none none reverse',
            once: false,
          },
        });
      });

      // ---- 6. TEXT WORD-BY-WORD ANIMATIONS ----
      textRefs.current = Array.from(document.querySelectorAll('[data-text-reveal]'));
      textRefs.current.forEach((el) => {
        const text = el.textContent || '';
        const words = text.split(' ').filter(w => w.length > 0);
        if (words.length < 2) return;
        
        const originalHTML = el.innerHTML;
        
        // Split into spans
        el.innerHTML = words.map(w => `<span class="dw-word" style="display:inline-block;opacity:0;transform:translateY(50px) rotateX(-90deg);">${w}</span>`).join(' ');
        const spans = Array.from(el.querySelectorAll('.dw-word'));
        
        gsap.to(spans, {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.8,
          ease: 'power4.out',
          stagger: 0.06,
          scrollTrigger: {
            trigger: el,
            start: 'top 95%',
            toggleActions: 'play none none reverse',
          },
        });
      });

      // ---- 7. IMAGE PARALLAX & SCALE ON SCROLL ----
      document.querySelectorAll('[data-img-parallax]').forEach((img) => {
        const speed = parseFloat(img.getAttribute('data-img-parallax') || '0.3');
        gsap.to(img, {
          scale: 1 + speed * 0.5,
          yPercent: 50 * speed,
          ease: 'none',
          scrollTrigger: {
            trigger: img,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        });
      });

      // ---- 8. COUNTER NUMBER ANIMATIONS ----
      counterRefs.current = Array.from(document.querySelectorAll('[data-counter]'));
      counterRefs.current.forEach((el) => {
        const target = parseInt(el.getAttribute('data-counter') || '0', 10);
        const suffix = el.getAttribute('data-counter-suffix') || '';
        const duration = parseFloat(el.getAttribute('data-counter-duration') || '1.5');
        
        gsap.from({ val: 0 }, {
          val: target,
          duration,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
          onUpdate: function() {
            el.textContent = Math.round(this.targets()[0].val).toLocaleString() + suffix;
          },
        });
      });

      // ---- 9. CIRCULAR PROGRESS RINGS ----
      progressRefs.current = Array.from(document.querySelectorAll('[data-progress]'));
      progressRefs.current.forEach((el) => {
        const progress = parseFloat(el.getAttribute('data-progress') || '0');
        const size = parseInt(el.getAttribute('data-progress-size') || '80', 10);
        const stroke = parseInt(el.getAttribute('data-progress-stroke') || '6', 10);
        const color = el.getAttribute('data-progress-color') || '#246BFF';
        const bgColor = el.getAttribute('data-progress-bg') || 'rgba(36,107,255,0.1)';
        
        // Create SVG if not exists
        if (!el.querySelector('svg')) {
          const radius = (size - stroke) / 2;
          const circumference = 2 * Math.PI * radius;
          el.innerHTML = `
            <svg width="${size}" height="${size}" style="transform:rotate(-90deg)">
              <circle
                r="${radius}"
                cx="${size/2}"
                cy="${size/2}"
                fill="none"
                stroke="${bgColor}"
                stroke-width="${stroke}"
              />
              <circle
                class="dw-progress-circle"
                r="${radius}"
                cx="${size/2}"
                cy="${size/2}"
                fill="none"
                stroke="${color}"
                stroke-width="${stroke}"
                stroke-linecap="round"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${circumference}"
                style="transition:stroke-dashoffset 1.5s cubic-bezier(0.22,1,0.36,1)"
              />
            </svg>
          `;
        }
        
        const circle = el.querySelector('.dw-progress-circle') as SVGCircleElement;
        const radius = (size - stroke) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference * (1 - progress);
        
        ScrollTrigger.create({
          trigger: el,
          start: 'top 85%',
          onEnter: () => {
            if (circle) circle.style.strokeDashoffset = String(offset);
          },
          onLeaveBack: () => {
            if (circle) circle.style.strokeDashoffset = String(circumference);
          },
        });
      });

      // ---- 10. PIN/STICKY SECTION EFFECTS ----
      document.querySelectorAll('[data-pin]').forEach((el) => {
        const pinType = el.getAttribute('data-pin'); // 'top', 'bottom', 'both'
        const pinSpacing = el.getAttribute('data-pin-spacing') !== 'false';
        
        ScrollTrigger.create({
          trigger: el,
          start: 'top top',
          end: 'bottom bottom',
          pin: true,
          pinSpacing,
          pinType: pinType === 'bottom' ? 'bottom' : 'top',
        });
      });

      // ---- 11. HORIZONTAL SCROLL SECTIONS ----
      document.querySelectorAll('[data-horizontal-scroll]').forEach((container) => {
        const wrapper = container.querySelector('[data-horizontal-wrapper]') as HTMLElement;
        if (!wrapper) return;
        
        const scrollWidth = wrapper.scrollWidth;
        const clientWidth = container.clientWidth;
        
        gsap.to(wrapper, {
          x: () => -(scrollWidth - clientWidth),
          ease: 'none',
          scrollTrigger: {
            trigger: container,
            start: 'top top',
            end: () => `+=${scrollWidth - clientWidth}`,
            scrub: 1,
            pin: true,
            pinSpacing: true,
          },
        });
      });

      // ---- 12. BACKGROUND COLOR TRANSITION ON SCROLL ----
      document.querySelectorAll('[data-bg-transition]').forEach((el) => {
        const startColor = el.getAttribute('data-bg-start') || '#ffffff';
        const endColor = el.getAttribute('data-bg-end') || '#0A1F44';
        
        gsap.to(el, {
          backgroundColor: endColor,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
      });

      // Refresh ScrollTrigger on resize
      let resizeTimer: number;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => ScrollTrigger.refresh(), 100);
      });
    };

    // Initialize GSAP - wait for it to be available on window
    const waitForGSAP = () => {
      if (window.gsap && window.ScrollTrigger) {
        initGSAP();
      } else {
        setTimeout(waitForGSAP, 50);
      }
    };
    waitForGSAP();

    // ---- 1. scroll progress ----
    const onScroll = () => {
      if (barRef.current) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
        barRef.current.style.width = pct + '%';
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // ---- 2. cursor glow ----
    let glowVisible = false;
    const onMove = (e: MouseEvent) => {
      if (!glowRef.current) return;
      if (!glowVisible) { glowRef.current.style.opacity = '1'; glowVisible = true; }
      glowRef.current.style.transform = `translate(${e.clientX - 150}px, ${e.clientY - 150}px)`;
    };
    if (finePointer && !reduced && !isMobile) {
      window.addEventListener('mousemove', onMove, { passive: true });
    }

    // ---- 3. scroll reveal (CSS-based) ----
    const cleanups: Array<() => void> = [];
    if (!reduced) {
      const io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('dw-revealed');
            io.unobserve(entry.target);
          }
        }
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

      const observeAll = () => {
        document.querySelectorAll('[data-reveal]:not(.dw-revealed)').forEach(el => io.observe(el));
      };
      observeAll();
      // Re-observe after SPA route changes
      const mo = new MutationObserver(() => observeAll());
      mo.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
      cleanups.push(() => { io.disconnect(); mo.disconnect(); });
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMove);
      cleanups.forEach(fn => fn());
      if (window.ScrollTrigger) {
        window.ScrollTrigger.getAll().forEach((st: any) => st.kill());
      }
    };
  }, []);

  return (
    <>
      {/* Scroll progress bar */}
      <div
        ref={barRef}
        aria-hidden="true"
        className="fixed top-0 left-0 h-[3px] z-[9999] pointer-events-none"
        style={{ width: '0%', background: 'linear-gradient(90deg,#246BFF,#FF8A00)', transition: 'width 0.08s linear' }}
      />
      {/* Cursor glow */}
      <div
        ref={glowRef}
        aria-hidden="true"
        className="fixed top-0 left-0 w-[300px] h-[300px] rounded-full z-[1] pointer-events-none hidden lg:block"
        style={{
          opacity: 0,
          background: 'radial-gradient(circle, rgba(36,107,255,0.07) 0%, rgba(255,138,0,0.04) 40%, transparent 70%)',
          transition: 'opacity 0.4s ease, transform 0.12s ease-out',
        }}
      />
    </>
  );
}