(function () {
  "use strict";

  const config = {
    revealDistance: 76,
    revealDuration: 1.15,
    sectionDuration: 1.35,
    letterStagger: 0.018,
    cardTilt: 8,
    magneticStrength: 0.28,
    particleCountDesktop: 78,
    particleCountTablet: 44,
    particleCountMobile: 32,
    particleCountLow: 14,
    particleFpsDesktop: 48,
    particleFpsMobile: 28,
    smoothScrollLerp: 0.075,
    resizeDebounce: 140,
  };

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const isTouch = window.matchMedia?.("(pointer: coarse)")?.matches;
  const device = getMotionDeviceProfile();
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  window.SIERRAZUL_PREMIUM_MOTION = { ...config, device };
  window.SierraAzulPremiumMotion = window.SIERRAZUL_PREMIUM_MOTION;

  if (prefersReducedMotion) {
    document.documentElement.classList.add("reduced-motion");
    return;
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add("premium-motion");
    document.documentElement.classList.add(device.className);
    document.body.classList.add(device.className);
    optimizeMedia();
    createScrollProgress();
    createAmbientParticles();
    createPremiumCursor();
    preparePremiumClasses();
    splitPremiumHeadings();
    initSmoothScroll();
    initGsapMotion();
    initMicroInteractions();
  });

  function createScrollProgress() {
    const progress = document.createElement("div");
    let ticking = false;
    progress.className = "premium-scroll-progress";
    document.body.prepend(progress);

    const update = () => {
      ticking = false;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const value = total > 0 ? window.scrollY / total : 0;
      progress.style.transform = `scaleX(${Math.min(Math.max(value, 0), 1)})`;
      document.body.style.setProperty("--premium-depth", value.toFixed(4));
    };

    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", debounce(requestUpdate, config.resizeDebounce));
  }

  function createAmbientParticles() {
    if (device.disableParticles) return;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: true });
    const particles = [];
    const pointer = { x: -9999, y: -9999 };
    const targetFrameMs = 1000 / device.particleFps;
    let animationId = 0;
    let lastFrame = 0;

    if (!context) return;

    canvas.className = "premium-particles";
    document.body.appendChild(canvas);

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, device.maxParticleDpr);
      canvas.width = Math.floor(window.innerWidth * ratio);
      canvas.height = Math.floor(window.innerHeight * ratio);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const desiredCount = device.particleCount;
      particles.length = 0;
      for (let index = 0; index < desiredCount; index += 1) {
        particles.push(createParticle());
      }
    };

    const createParticle = () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -0.08 - Math.random() * 0.18,
      radius: 0.7 + Math.random() * 2.2,
      alpha: 0.18 + Math.random() * 0.52,
      hue: Math.random() > 0.62 ? "241, 182, 132" : "127, 231, 227",
    });

    const shouldPause = () => document.hidden || document.body.classList.contains("site-locked");

    const animate = (time = 0) => {
      if (shouldPause()) {
        animationId = 0;
        return;
      }

      if (time - lastFrame < targetFrameMs) {
        animationId = requestAnimationFrame(animate);
        return;
      }

      lastFrame = time;
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particles.forEach((particle) => {
        const dx = particle.x - pointer.x;
        const dy = particle.y - pointer.y;
        const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 1);

        if (distance < 170) {
          particle.x += (dx / distance) * 0.34;
          particle.y += (dy / distance) * 0.34;
        }

        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.y < -20 || particle.x < -20 || particle.x > window.innerWidth + 20) {
          Object.assign(particle, createParticle(), { y: window.innerHeight + 20 });
        }

        context.beginPath();
        context.fillStyle = `rgba(${particle.hue}, ${particle.alpha})`;
        context.shadowColor = `rgba(${particle.hue}, 0.72)`;
        context.shadowBlur = 14;
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;
      });

      animationId = requestAnimationFrame(animate);
    };

    const resume = () => {
      if (animationId || shouldPause()) return;
      lastFrame = 0;
      animationId = requestAnimationFrame(animate);
    };

    window.addEventListener("pointermove", (event) => {
      if (device.lowPower) return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    }, { passive: true });

    window.addEventListener("resize", debounce(() => {
      resize();
      resume();
    }, config.resizeDebounce));
    document.addEventListener("visibilitychange", resume);

    const lockObserver = new MutationObserver(resume);
    lockObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    resize();
    resume();
  }

  function createPremiumCursor() {
    if (isTouch || device.lowPower) return;

    const ring = document.createElement("div");
    const dot = document.createElement("div");
    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const current = { x: pointer.x, y: pointer.y };

    ring.className = "premium-cursor";
    dot.className = "premium-cursor-dot";
    document.body.append(ring, dot);

    window.addEventListener("pointermove", (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
    }, { passive: true });

    const animate = () => {
      current.x += (pointer.x - current.x) * 0.16;
      current.y += (pointer.y - current.y) * 0.16;
      ring.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(animate);
    };

    animate();
  }

  function preparePremiumClasses() {
    document.querySelectorAll(".site-header, main > section, .footer").forEach((section, index) => {
      section.classList.add("pm-cinema-section", `pm-section-${index % 5}`);
    });

    document.querySelectorAll([
      ".hero-content",
      ".hero-status",
      ".section-heading",
      ".maintenance-visual-copy",
      ".metric-grid article",
      ".project-card",
      ".team-grid article",
      ".person-card",
      ".amenity-card",
      ".amenity-detail-grid",
      ".rules-panel",
      ".timeline",
      ".timeline article",
      ".footer > *",
    ].join(",")).forEach((element) => {
      element.classList.add("pm-reveal");
    });

    document.querySelectorAll(".project-card, .metric-grid article, .team-grid article, .amenity-card, .timeline article, .visual-kpis span").forEach((card) => {
      card.classList.add("pm-depth-card", "pm-lux-border");
    });

    document.querySelector(".project-board")?.classList.add("pm-slider-3d");
    document.querySelector(".timeline")?.classList.add("pm-timeline-active");

    document.querySelectorAll(".person-card, .amenity-card, .project-photo-preview, .hud-chip").forEach((element) => {
      if (!device.lowPower) element.classList.add("pm-floating-object");
    });

    document.querySelectorAll(".primary-action, .secondary-action, .admin-launch, .icon-button, .secondary-link, .nav-links a").forEach((element) => {
      element.classList.add("pm-magnetic");
    });
  }

  function splitPremiumHeadings() {
    document.querySelectorAll(".hero h1, .maintenance-visual-copy h2, .section-heading h2").forEach((heading) => {
      if (heading.dataset.splitReady) return;
      const text = heading.textContent.trim();
      heading.dataset.splitReady = "true";
      heading.classList.add("pm-text-ready");
      heading.setAttribute("aria-label", text);
      heading.innerHTML = text.split(" ").map((word) => {
        const letters = [...word].map((letter) => `<span class="pm-char">${escapeHtml(letter)}</span>`).join("");
        return `<span class="pm-word" aria-hidden="true">${letters}</span>`;
      }).join(" ");
    });
  }

  function initSmoothScroll() {
    if (!window.Lenis) return;

    const lenis = new window.Lenis({
      lerp: config.smoothScrollLerp,
      wheelMultiplier: 0.9,
      touchMultiplier: 1,
      smoothWheel: true,
      smoothTouch: false,
    });

    window.SierraAzulLenis = lenis;

    if (ScrollTrigger) {
      lenis.on("scroll", () => ScrollTrigger.update());
    }

    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };

    requestAnimationFrame(raf);
  }

  function initGsapMotion() {
    if (!gsap || !ScrollTrigger) {
      initNativeMotion();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true, limitCallbacks: true });

    gsap.set(".pm-reveal", {
      autoAlpha: 0,
      y: config.revealDistance,
      scale: 0.985,
      filter: "blur(16px)",
    });

    ScrollTrigger.batch(".pm-reveal", {
      start: "top 86%",
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: config.revealDuration,
          ease: "expo.out",
          stagger: 0.08,
        });
      },
    });

    document.querySelectorAll(".pm-text-ready").forEach((heading) => {
      const chars = heading.querySelectorAll(".pm-char");
      gsap.set(chars, {
        autoAlpha: 0,
        yPercent: 115,
        rotateX: -72,
        filter: "blur(12px)",
      });
      gsap.to(chars, {
        autoAlpha: 1,
        yPercent: 0,
        rotateX: 0,
        filter: "blur(0px)",
        duration: 1.05,
        ease: "expo.out",
        stagger: config.letterStagger,
        scrollTrigger: {
          trigger: heading,
          start: "top 88%",
          once: true,
        },
      });
    });

    document.querySelectorAll("main > section").forEach((section, index) => {
      gsap.fromTo(section, {
        clipPath: index % 2 === 0 ? "inset(10% 0 0 0)" : "inset(0 0 10% 0)",
      }, {
        clipPath: "inset(0% 0 0% 0)",
        duration: config.sectionDuration,
        ease: "expo.out",
        scrollTrigger: {
          trigger: section,
          start: "top 88%",
          once: true,
        },
      });
    });

    gsap.utils.toArray(".project-card .progress span").forEach((bar) => {
      const targetWidth = bar.style.width || getComputedStyle(bar).width;
      gsap.fromTo(bar, { width: "0%" }, {
        width: targetWidth,
        duration: 1.4,
        ease: "expo.out",
        scrollTrigger: {
          trigger: bar.closest(".project-card"),
          start: "top 78%",
          once: true,
        },
      });
    });

    gsap.from(".timeline article", {
      x: 72,
      rotateY: -10,
      autoAlpha: 0,
      filter: "blur(12px)",
      duration: 1,
      ease: "expo.out",
      stagger: 0.16,
      scrollTrigger: {
        trigger: ".timeline",
        start: "top 78%",
        once: true,
      },
    });

    ScrollTrigger.matchMedia({
      "(min-width: 900px)": () => {
        gsap.timeline({
          scrollTrigger: {
            trigger: ".command-mode",
            start: "top top",
            end: "+=130%",
            scrub: 0.8,
            pin: true,
          },
        })
          .to(".maintenance-3d-scene", { scale: 1.14, xPercent: -7, rotate: 0.01, ease: "none" }, 0)
          .to(".maintenance-visual-copy", { yPercent: -12, autoAlpha: 0.86, ease: "none" }, 0)
          .to(".hud-chip-one", { x: -80, y: 50, ease: "none" }, 0)
          .to(".hud-chip-two", { x: 90, y: -60, ease: "none" }, 0)
          .to(".hud-chip-three", { x: 70, y: -80, ease: "none" }, 0);
      },
    });

    const velocityTo = gsap.quickTo(document.body, "--premium-velocity", {
      duration: 0.45,
      ease: "power3.out",
    });

    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        const velocity = Math.min(Math.abs(self.getVelocity()) / 4200, 1);
        velocityTo(velocity);
      },
    });

    gsap.to(".site-header", {
      backgroundPosition: "56% 50%",
      ease: "none",
      scrollTrigger: {
        trigger: ".site-header",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });

    gsap.utils.toArray(".amenity-card img, .amenity-gallery img").forEach((image) => {
      gsap.to(image, {
        yPercent: -8,
        scale: 1.08,
        ease: "none",
        scrollTrigger: {
          trigger: image,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    });

    ScrollTrigger.refresh();
  }

  function initNativeMotion() {
    document.body.classList.add("premium-native");

    const revealElements = [...document.querySelectorAll(".pm-reveal")];
    revealElements.forEach((element, index) => {
      element.style.setProperty("--pm-delay", `${Math.min(index % 7, 6) * 74}ms`);
      element.style.setProperty("--pm-direction", index % 3 === 0 ? "-1" : "1");
    });

    document.querySelectorAll(".pm-text-ready").forEach((heading) => {
      heading.querySelectorAll(".pm-char").forEach((char, index) => {
        char.style.setProperty("--char-index", index);
      });
    });

    document.querySelectorAll(".project-card .progress span").forEach((bar) => {
      bar.dataset.targetWidth = bar.style.width || "0%";
      bar.style.width = "0%";
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const target = entry.target;

        target.classList.add("pm-native-visible");
        target.querySelectorAll?.(".pm-text-ready").forEach((heading) => {
          heading.classList.add("pm-text-visible");
        });

        if (target.classList.contains("pm-text-ready")) {
          target.classList.add("pm-text-visible");
        }

        if (target.classList.contains("timeline")) {
          target.classList.add("pm-timeline-visible");
        }

        target.querySelectorAll?.(".progress span").forEach((bar) => {
          requestAnimationFrame(() => {
            bar.style.width = bar.dataset.targetWidth || "";
          });
        });

        observer.unobserve(target);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });

    revealElements.forEach((element) => observer.observe(element));
    document.querySelectorAll(".pm-text-ready, .timeline").forEach((element) => observer.observe(element));

    initNativeScrollDepth();
    initNativeSmoothAnchors();
  }

  function initNativeScrollDepth() {
    let lastY = window.scrollY;
    let velocity = 0;
    let ticking = false;
    const parallaxImages = [...document.querySelectorAll(".amenity-card img, .amenity-gallery img")];
    const visibleParallaxImages = new Set();

    const update = () => {
      ticking = false;
      const currentY = window.scrollY;
      velocity += (Math.min(Math.abs(currentY - lastY) / 90, 1) - velocity) * 0.12;
      lastY = currentY;
      document.body.style.setProperty("--premium-velocity", velocity.toFixed(4));

      visibleParallaxImages.forEach((image) => {
        const rect = image.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        const progress = (rect.top / window.innerHeight - 0.5) * -device.parallaxDepth;
        image.style.transform = `translate3d(0, ${progress}px, 0) scale(1.055)`;
      });
    };

    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visibleParallaxImages.add(entry.target);
        } else {
          visibleParallaxImages.delete(entry.target);
        }
      });
      requestUpdate();
    }, { rootMargin: "180px 0px" });

    parallaxImages.forEach((image) => imageObserver.observe(image));

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", debounce(requestUpdate, config.resizeDebounce));
    document.addEventListener("visibilitychange", requestUpdate);
    requestUpdate();
  }

  function initNativeSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (event) => {
        const id = anchor.getAttribute("href");
        const target = id && id.length > 1 ? document.querySelector(id) : null;
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function initMicroInteractions() {
    document.querySelectorAll(".pm-depth-card").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        if (isTouch || device.lowPower) return;
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--pm-shine-x", `${event.clientX - rect.left}px`);
        card.style.setProperty("--pm-shine-y", `${event.clientY - rect.top}px`);
        card.style.transform = `perspective(1100px) rotateX(${(-y * config.cardTilt).toFixed(2)}deg) rotateY(${(x * config.cardTilt).toFixed(2)}deg) translate3d(0, -8px, 24px)`;
      });

      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });

      card.addEventListener("pointerdown", () => {
        if (!isTouch) return;
        card.classList.add("pm-touch-active");
      }, { passive: true });

      card.addEventListener("pointerup", () => {
        card.classList.remove("pm-touch-active");
      }, { passive: true });

      card.addEventListener("pointercancel", () => {
        card.classList.remove("pm-touch-active");
      }, { passive: true });
    });

    document.querySelectorAll(".pm-magnetic").forEach((element) => {
      element.addEventListener("pointermove", (event) => {
        if (isTouch) return;
        const rect = element.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * config.magneticStrength;
        const y = (event.clientY - rect.top - rect.height / 2) * config.magneticStrength;

        if (gsap) {
          gsap.to(element, { x, y, duration: 0.45, ease: "expo.out" });
        } else {
          element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }
      });

      element.addEventListener("pointerleave", () => {
        if (gsap) {
          gsap.to(element, { x: 0, y: 0, duration: 0.65, ease: "elastic.out(1, 0.45)" });
        } else {
          element.style.transform = "";
        }
      });

      element.addEventListener("pointerdown", () => {
        if (!isTouch) return;
        element.classList.add("pm-touch-active");
      }, { passive: true });

      element.addEventListener("pointerup", () => {
        element.classList.remove("pm-touch-active");
      }, { passive: true });

      element.addEventListener("pointercancel", () => {
        element.classList.remove("pm-touch-active");
      }, { passive: true });
    });
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getMotionDeviceProfile() {
    const width = window.innerWidth || 1280;
    const coarse = window.matchMedia?.("(pointer: coarse)")?.matches;
    const saveData = navigator.connection?.saveData;
    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory;
    const mobile = width <= 760 || coarse;
    const tablet = width > 760 && width <= 1100 && coarse;
    const lowPower = saveData
      || width <= 420
      || (mobile && (cores <= 2 || (typeof memory === "number" && memory <= 2)));
    const particleCount = lowPower
      ? config.particleCountLow
      : mobile
        ? config.particleCountMobile
        : tablet
          ? config.particleCountTablet
          : config.particleCountDesktop;

    return {
      mobile,
      tablet,
      lowPower,
      saveData: Boolean(saveData),
      className: lowPower ? "motion-low-power" : mobile ? "motion-mobile" : tablet ? "motion-tablet" : "motion-desktop",
      particleCount,
      particleFps: mobile || lowPower ? config.particleFpsMobile : config.particleFpsDesktop,
      maxParticleDpr: lowPower ? 1 : mobile ? 1.15 : 1.5,
      parallaxDepth: lowPower ? 4 : mobile ? 7 : 16,
      disableParticles: Boolean(saveData),
    };
  }

  function optimizeMedia() {
    document.querySelectorAll("img").forEach((image, index) => {
      if (index > 1 && image.loading !== "eager") image.loading = "lazy";
      image.decoding = "async";
      image.setAttribute("draggable", "false");
    });
  }

  function debounce(callback, delay) {
    let timeout;
    return (...args) => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => callback(...args), delay);
    };
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
})();
