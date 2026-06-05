'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'

/**
 * Landing-page interactions (ported from the design):
 *  - scroll parallax for the floating money props (drift + spin by data-speed/spin)
 *  - smooth scrolling + anchor scroll-to (Lenis)
 *  - reveal-on-scroll
 *  - nav "scrolled" state
 *  - interactive AI chat demo (scripted, README-grounded ₹ examples)
 * Renders nothing.
 */

type Convo = { penny: string; card?: { label: string; pct: number; note: string } }

const CONVO: Record<string, Convo> = {
  spend: {
    penny: 'You spent <b>₹42,000</b> on food this month — about <b>36%</b> of your spending. Trimming toward 20% would free up roughly <b>₹16,800</b>.',
    card: { label: 'Food', pct: 36, note: '₹42,000 · top category' },
  },
  save: {
    penny: 'Put <b>₹5,000/mo</b> into index funds and build a <b>₹1.5 lakh</b> emergency fund — you&apos;d reach your cushion comfortably within your horizon.',
    card: { label: 'Savings plan', pct: 64, note: '₹3,200 of ₹5,000 target' },
  },
  networth: {
    penny: 'Your net worth is <b>₹12,84,500</b>. Bank holds <b>62%</b> — a little concentrated; some diversification would lower your risk.',
    card: { label: 'Allocation', pct: 62, note: 'Bank-heavy · rebalance?' },
  },
  goals: {
    penny: 'You&apos;re on pace for <b>“Buy a house in 5 years”</b>. Keep saving ₹20,000/mo and you&apos;ll get there on time.',
    card: { label: 'Goal progress', pct: 40, note: 'Long-term · on track' },
  },
}

export default function PennyLandingScripts() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const floaties = Array.from(document.querySelectorAll<HTMLElement>('.floaty'))
    const nav = document.querySelector('.nav-inner')

    const applyParallax = (y: number) => {
      for (const el of floaties) {
        const speed = parseFloat(el.dataset.speed || '0')
        const spin = parseFloat(el.dataset.spin || '0')
        el.style.transform = `translate3d(0,${(-y * speed).toFixed(1)}px,0) rotate(${(y * spin * 0.012).toFixed(2)}deg)`
      }
      if (nav) nav.classList.toggle('scrolled', y > 30)
    }

    let lenis: Lenis | null = null
    let onScroll: (() => void) | null = null

    if (reduce) {
      onScroll = () => applyParallax(window.scrollY || 0)
      window.addEventListener('scroll', onScroll, { passive: true })
      applyParallax(window.scrollY || 0)
    } else {
      lenis = new Lenis({ duration: 1.05, smoothWheel: true })
      lenis.on('scroll', ({ scroll }: { scroll: number }) => applyParallax(scroll))
      const raf = (t: number) => {
        lenis?.raf(t)
        requestAnimationFrame(raf)
      }
      requestAnimationFrame(raf)
      applyParallax(0)
    }

    // Smooth anchor scrolling
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null
      if (!a) return
      const id = a.getAttribute('href') ?? ''
      if (id.length < 2) return
      const target = document.querySelector(id)
      if (!target) return
      e.preventDefault()
      if (lenis) lenis.scrollTo(target as HTMLElement, { offset: -10 })
      else (target as HTMLElement).scrollIntoView()
    }
    document.addEventListener('click', onClick)

    // Reveal on scroll
    const reveals = Array.from(document.querySelectorAll('.penny-root .reveal'))
    let io: IntersectionObserver | null = null
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (entries) => entries.forEach((en) => {
          if (en.isIntersecting) { en.target.classList.add('in'); io?.unobserve(en.target) }
        }),
        { threshold: 0.14, rootMargin: '0px 0px -8% 0px' }
      )
      reveals.forEach((r) => io!.observe(r))
    } else {
      reveals.forEach((r) => r.classList.add('in'))
    }

    // Chat demo
    const chat = document.getElementById('penny-chat')
    const promptWrap = document.getElementById('penny-prompts')
    let busy = false

    const mk = (tag: string, cls: string, html?: string) => {
      const n = document.createElement(tag)
      n.className = cls
      if (html != null) n.innerHTML = html
      return n
    }
    const addBubble = (node: HTMLElement) => {
      chat?.appendChild(node)
      requestAnimationFrame(() => node.classList.add('show'))
      if (chat) chat.scrollTop = chat.scrollHeight
    }
    const ask = (key: string, label: string) => {
      if (busy || !CONVO[key] || !chat || !promptWrap) return
      busy = true
      promptWrap.querySelectorAll('.prompt-chip').forEach((c) => ((c as HTMLButtonElement).disabled = true))
      addBubble(mk('div', 'bubble user', label))
      setTimeout(() => {
        const typing = mk('div', 'typing', '<span></span><span></span><span></span>')
        chat.appendChild(typing)
        chat.scrollTop = chat.scrollHeight
        setTimeout(() => {
          chat.removeChild(typing)
          const c = CONVO[key]
          let html = c.penny
          if (c.card) {
            html += `<div class="mini-card"><div style="font-size:12px;color:var(--p-muted);font-family:var(--font-pmono);letter-spacing:.04em">${c.card.label}</div><div class="bar"><i style="width:${c.card.pct}%"></i></div><div style="font-size:12.5px;color:var(--ink-dim)">${c.card.note}</div></div>`
          }
          addBubble(mk('div', 'bubble penny', html))
          busy = false
          promptWrap.querySelectorAll('.prompt-chip').forEach((cc) => {
            if ((cc as HTMLElement).dataset.asked !== '1') (cc as HTMLButtonElement).disabled = false
          })
        }, 1050)
      }, 420)
    }
    const onChip = (e: Event) => {
      const chip = (e.target as HTMLElement).closest('.prompt-chip') as HTMLButtonElement | null
      if (!chip || chip.disabled) return
      chip.dataset.asked = '1'
      ask(chip.getAttribute('data-key') || '', chip.textContent?.trim() || '')
      chip.disabled = true
    }
    promptWrap?.addEventListener('click', onChip)
    if (chat && !chat.childElementCount) {
      const arrowDown = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>'
      const greet = mk('div', 'bubble penny', `Hi — I'm <b>Penny</b>. Ask me anything about your money. ${arrowDown}`)
      chat.appendChild(greet)
      greet.classList.add('show')
    }

    return () => {
      document.removeEventListener('click', onClick)
      if (onScroll) window.removeEventListener('scroll', onScroll)
      promptWrap?.removeEventListener('click', onChip)
      io?.disconnect()
      lenis?.destroy()
    }
  }, [])

  return null
}
