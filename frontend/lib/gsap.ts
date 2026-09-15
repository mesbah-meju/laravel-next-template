'use client';

import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export { gsap, useGSAP };

export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const animations = {
  fadeIn: (target: gsap.DOMTarget, vars: gsap.TweenVars = {}) => {
    if (prefersReducedMotion()) {
      return gsap.set(target, { opacity: 1, ...vars });
    }
    return gsap.fromTo(
      target,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', ...vars }
    );
  },

  reveal: (target: gsap.DOMTarget, vars: gsap.TweenVars = {}) => {
    if (prefersReducedMotion()) {
      return gsap.set(target, { opacity: 1, ...vars });
    }
    return gsap.fromTo(
      target,
      { opacity: 0, scale: 0.96 },
      { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out', ...vars }
    );
  },

  staggerList: (targets: gsap.DOMTarget, vars: gsap.TweenVars = {}) => {
    if (prefersReducedMotion()) {
      return gsap.set(targets, { opacity: 1, ...vars });
    }
    return gsap.fromTo(
      targets,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out', ...vars }
    );
  },
};
