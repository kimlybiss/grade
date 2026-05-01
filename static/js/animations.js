(function (window, document) {
  'use strict';

  function toElements(targets) {
    if (!targets) return [];
    if (typeof targets === 'string') return Array.from(document.querySelectorAll(targets));
    if (targets instanceof Element) return [targets];
    if (targets instanceof NodeList || Array.isArray(targets)) return Array.from(targets).filter(Boolean);
    return [];
  }

  function onReady(callback) {
    if (typeof callback !== 'function') return;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
      return;
    }
    callback();
  }

  function setPageReady() {
    onReady(() => {
      document.body.classList.add('page-ready');
    });
  }

  function revealOnVisible(targets, options) {
    const elements = toElements(targets);
    if (!elements.length) return;

    const settings = Object.assign({
      threshold: 0.2,
      hiddenClass: 'is-hidden',
      visibleClass: 'is-visible',
      revealClass: '',
      duration: '680ms',
      delay: '0ms',
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      offset: '24px',
      preserveTransform: false
    }, options || {});

    elements.forEach(element => {
      if (element.dataset.gradeRevealPrepared === '1') return;
      element.dataset.gradeRevealPrepared = '1';
      element.classList.add(settings.hiddenClass);
      element.style.opacity = '0';
      if (settings.preserveTransform) {
        element.style.willChange = 'opacity';
      } else {
        element.style.transform = `translate3d(0, ${settings.offset}, 0)`;
        element.style.transitionProperty = 'opacity, transform';
        element.style.transitionDuration = settings.duration;
        element.style.transitionTimingFunction = settings.easing;
        element.style.transitionDelay = settings.delay;
        element.style.willChange = 'opacity, transform';
      }
    });

    const reveal = element => {
      element.classList.remove(settings.hiddenClass);
      element.classList.add(settings.visibleClass);
      if (settings.revealClass) element.classList.add(settings.revealClass);
      element.style.opacity = '1';
      if (settings.preserveTransform) {
        element.style.removeProperty('transform');
      } else {
        element.style.transform = 'translate3d(0, 0, 0)';
      }
      element.style.willChange = 'auto';
    };

    if (typeof IntersectionObserver === 'undefined') {
      window.requestAnimationFrame(() => {
        elements.forEach(reveal);
      });
      return null;
    }

    const observerOptions = Object.assign({ threshold: 0.2 }, options || {});
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    elements.forEach(element => observer.observe(element));
    return observer;
  }

  function setVisibleOnNextFrame(targets, className) {
    const elements = toElements(targets);
    if (!elements.length) return;

    const visibleClass = className || 'is-visible';
    window.requestAnimationFrame(() => {
      elements.forEach(element => element.classList.add(visibleClass));
    });
  }

  function staggerDelays(targets, propertyName, step, maxDelay) {
    const elements = toElements(targets);
    const prop = propertyName || '--delay';
    const delta = Number(step) || 0.04;
    const limit = Number.isFinite(maxDelay) ? maxDelay : 0.36;

    elements.forEach((element, index) => {
      const delay = Math.min(index * delta, limit);
      element.style.setProperty(prop, `${delay}s`);
    });
  }

  function fillProgressBarsOnVisible(target, selector, options) {
    const root = typeof target === 'string' ? document.querySelector(target) : target;
    if (!root || typeof IntersectionObserver === 'undefined') return;

    const progressSelector = selector || '.progress-bar[data-value]';
    const observerOptions = Object.assign({ threshold: 0.5 }, options || {});
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const bars = entry.target.querySelectorAll(progressSelector);
        bars.forEach(bar => {
          const value = bar.getAttribute('data-value');
          if (value != null) bar.style.width = `${value}%`;
        });

        observer.unobserve(entry.target);
      });
    }, observerOptions);

    observer.observe(root);
    return observer;
  }

  function rotateText(target, phrases, options) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    const list = Array.isArray(phrases) ? phrases.filter(Boolean) : [];
    if (!element || !list.length) return null;

    const settings = Object.assign({
      interval: 2600,
      delay: 160,
      className: 'is-changed'
    }, options || {});

    let index = 0;

    const tick = () => {
      element.classList.remove(settings.className);
      window.setTimeout(() => {
        element.textContent = list[index];
        element.classList.add(settings.className);
        index = (index + 1) % list.length;
      }, settings.delay);
    };

    tick();
    return window.setInterval(tick, settings.interval);
  }

  function cycleDocumentTitle(titles, interval) {
    const list = Array.isArray(titles) ? titles.filter(Boolean) : [];
    if (!list.length) return null;

    let index = 0;
    return window.setInterval(() => {
      index = (index + 1) % list.length;
      document.title = list[index];
    }, interval || 4000);
  }

  function parallaxOnMouseMove(target, divisor) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return;

    const ratio = Number(divisor) || 70;
    window.addEventListener('mousemove', event => {
      const x = (window.innerWidth / 2 - event.pageX) / ratio;
      const y = (window.innerHeight / 2 - event.pageY) / ratio;
      element.style.setProperty('--mx', `${x}px`);
      element.style.setProperty('--my', `${y}px`);
    });
  }

  function softHoverCards(targets, options) {
    const elements = toElements(targets);
    if (!elements.length) return;

    const settings = Object.assign({
      tilt: 1.2,
      lift: 6,
      shadowY: 20,
      shadowBlur: 40,
      sheen: 0.02,
      scale: 1.014,
      perspective: 1200
    }, options || {});

    elements.forEach(card => {
      if (card.dataset.gradeHoverBound === '1') return;
      card.dataset.gradeHoverBound = '1';

      let rafId = null;
      let isActive = false;

      card.style.perspective = `${settings.perspective}px`;

      const reset = () => {
        card.classList.remove('is-hovering');
        card.style.setProperty('--hover-translate-y', '0px');
        card.style.setProperty('--hover-scale', '1');
        card.style.setProperty('--hover-rotate-x', '0deg');
        card.style.setProperty('--hover-rotate-y', '0deg');
        card.style.setProperty('--hover-shadow-y', '18px');
        card.style.setProperty('--hover-shadow-blur', '36px');
        card.style.setProperty('--hover-sheen', '0');
        card.style.setProperty('--hover-border-alpha', '0');
        isActive = false;
      };

      const update = event => {
        if (!isActive) return;
        if (rafId) window.cancelAnimationFrame(rafId);
        rafId = window.requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const px = (event.clientX - rect.left) / rect.width;
          const py = (event.clientY - rect.top) / rect.height;
          const dx = (px - 0.5) * 2;
          const dy = (py - 0.5) * 2;
          const subtleLift = Math.max(3, settings.lift - Math.abs(dy) * 1.25);
          const rotateX = (-dy * settings.tilt).toFixed(2);
          const rotateY = (dx * settings.tilt).toFixed(2);
          const sheen = Math.max(0, 1 - (Math.abs(dx) + Math.abs(dy)) / 2);

          card.style.setProperty('--hover-translate-y', `-${subtleLift}px`);
          card.style.setProperty('--hover-scale', String(settings.scale));
          card.style.setProperty('--hover-rotate-x', `${rotateX}deg`);
          card.style.setProperty('--hover-rotate-y', `${rotateY}deg`);
          card.style.setProperty('--hover-shadow-y', `${settings.shadowY}px`);
          card.style.setProperty('--hover-shadow-blur', `${settings.shadowBlur}px`);
          card.style.setProperty('--hover-sheen', `${(sheen * settings.sheen).toFixed(3)}`);
          card.style.setProperty('--hover-border-alpha', '1');
        });
      };

      card.addEventListener('pointerenter', event => {
        isActive = true;
        card.classList.add('is-hovering');
        update(event);
      });

      card.addEventListener('pointermove', update);
      card.addEventListener('pointerleave', reset);
      card.addEventListener('blur', reset);
      reset();
    });
  }

  function redirectEmptyAnchors(targetHref, selector) {
    const fallback = targetHref || '/404.html';
    const query = selector || 'a[href="#"], a[href=""]';
    document.querySelectorAll(query).forEach(anchor => {
      anchor.setAttribute('href', fallback);
    });
  }

  function getNoun(number, one, two, five) {
    let n = Math.abs(number);
    n %= 100;
    if (n >= 5 && n <= 20) return five;
    n %= 10;
    if (n === 1) return one;
    if (n >= 2 && n <= 4) return two;
    return five;
  }

  window.GradeAnimations = {
    onReady,
    setPageReady,
    revealOnVisible,
    setVisibleOnNextFrame,
    staggerDelays,
    fillProgressBarsOnVisible,
    rotateText,
    cycleDocumentTitle,
    parallaxOnMouseMove,
    softHoverCards,
    redirectEmptyAnchors,
    getNoun
  };
})(window, document);
