'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Drives the landing page's motion:
 *  - Lenis smooth scrolling, synced to GSAP's ticker + ScrollTrigger
 *  - smooth scroll-to-section when a nav anchor (href="#…") is clicked
 *  - scroll-reveal animations for [data-animate] elements and staggered
 *    [data-animate-group] > [data-animate-item] groups
 * Renders nothing; it only orchestrates effects. Respects reduced-motion.
 */
export default function LandingMotion() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    gsap.registerPlugin(ScrollTrigger)

    // Reduced motion: leave content visible, use native anchor scrolling.
    if (reduce) {
      const onClickNative = (e: MouseEvent) => {
        const a = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null
        if (!a) return
        const id = a.getAttribute('href') ?? ''
        if (id.length < 2) return
        const el = document.querySelector(id)
        if (!el) return
        e.preventDefault()
        el.scrollIntoView({ behavior: 'auto', block: 'start' })
      }
      document.addEventListener('click', onClickNative)
      return () => document.removeEventListener('click', onClickNative)
    }

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true })

    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    // Smooth scroll to in-page sections from any hash link.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null
      if (!a) return
      const id = a.getAttribute('href') ?? ''
      if (id.length < 2) return
      const el = document.querySelector(id)
      if (!el) return
      e.preventDefault()
      lenis.scrollTo(el as HTMLElement, { offset: -24, duration: 1.2 })
    }
    document.addEventListener('click', onClick)

    const ctx = gsap.context(() => {
      // Single elements
      gsap.utils.toArray<HTMLElement>('[data-animate]').forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 28,
          duration: 0.85,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 86%', once: true },
        })
      })
      // Staggered groups
      gsap.utils.toArray<HTMLElement>('[data-animate-group]').forEach((group) => {
        const items = group.querySelectorAll('[data-animate-item]')
        if (!items.length) return
        gsap.from(items, {
          opacity: 0,
          y: 32,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.09,
          scrollTrigger: { trigger: group, start: 'top 82%', once: true },
        })
      })
    })

    // Layout settled — make sure triggers measure correctly.
    ScrollTrigger.refresh()

    return () => {
      document.removeEventListener('click', onClick)
      gsap.ticker.remove(raf)
      ctx.revert()
      ScrollTrigger.getAll().forEach((t) => t.kill())
      lenis.destroy()
    }
  }, [])

  return null
}
