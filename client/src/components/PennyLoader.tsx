'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Penny loading sequence.
 * - First document load: a sphere flips its glyph P → $ → P → ₹, then shrinks
 * and flies into the nav brand logo, revealing the page.
 * - Every client-side route change after that: a quick single spin that fades
 * out at center (snappy page-shift transition).
 *
 * `introComplete` is module-scoped so it survives React StrictMode's dev
 * double-mount (only flips once the cinematic intro actually runs), while still
 * resetting on a real document reload.
 */
let introComplete = false

// Use the image path directly in the sequence array
const SEQ = ['/Penny.webp', '$', '/Penny.webp', '₹']
const ORB_SIZE = 156
const FLIP_MS = 720

export default function PennyLoader() {
  const pathname = usePathname()
  const rootRef = useRef<HTMLDivElement>(null)
  const orbRef = useRef<HTMLDivElement>(null)
  const coinRef = useRef<HTMLDivElement>(null)
  const glyphRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const loader = rootRef.current
    const orb = orbRef.current
    const coin = coinRef.current
    const glyph = glyphRef.current
    if (!loader || !orb || !coin || !glyph) return

    const mode: 'full' | 'quick' = introComplete ? 'quick' : 'full'
    const root = document.documentElement

    let rot = 0
    let finishing = false
    let cancelled = false
    const timers: number[] = []
    const wait = (ms: number) =>
      new Promise<void>((r) => { timers.push(window.setTimeout(r, ms)) })
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Reset to the covering state and start the run.
    loader.classList.remove('done', 'revealing', 'fade-out')
    orb.style.transition = 'transform 1s cubic-bezier(.62,.04,.3,1)'
    orb.style.transform = 'translate(-50%, -50%)'
    coin.style.transition = `transform ${FLIP_MS}ms cubic-bezier(.6,.02,.3,1)`
    coin.style.transform = 'rotateY(0deg)'
    glyph.style.opacity = '1'
    root.classList.add('penny-loading')
    document.body.style.overflow = 'hidden'

    // Smart update: Checks if the string is an image path or plain text glyph
    const dressGlyph = (content: string) => {
      if (content.endsWith('.webp') || content.startsWith('/')) {
        glyph.innerHTML = `<img src="${content}" alt="Penny" style="width: 150px; height: 150px; object-fit: contain; pointer-events: none; padding-left: 10px" />`
      } else {
        glyph.textContent = content
      }
      glyph.style.transform = Math.abs(rot % 360) === 180 ? 'rotateY(180deg)' : 'rotateY(0deg)'
    }

    const flipTo = (next: string) => {
      rot += 180
      coin.style.transform = `rotateY(${rot}deg)`
      timers.push(window.setTimeout(() => { if (!cancelled) glyph.style.opacity = '0' }, FLIP_MS * 0.36))
      timers.push(window.setTimeout(() => {
        if (cancelled) return
        dressGlyph(next)
        glyph.style.opacity = '1'
      }, FLIP_MS * 0.5))
    }

    const hide = () => {
      root.classList.remove('penny-loading')
      timers.push(window.setTimeout(() => {
        if (cancelled) return
        loader.classList.add('done')
        document.body.style.overflow = ''
      }, 300))
    }

    const finishFull = () => {
      if (finishing) return
      finishing = true
      introComplete = true

      const target = document.querySelector<HTMLElement>('.nav-inner .brand .coin-mark')
      let dx = 0, dy = 0, scale = 0.167
      if (target) {
        const r = target.getBoundingClientRect()
        dx = r.left + r.width / 2 - window.innerWidth / 2
        dy = r.top + r.height / 2 - window.innerHeight / 2
        scale = r.width / ORB_SIZE
      }

      if (Math.abs(rot % 360) !== 0) rot += 180
      rot += 360 
      coin.style.transition = 'transform 1s cubic-bezier(.62,.04,.3,1)'
      coin.style.transform = `rotateY(${rot}deg)`
      timers.push(window.setTimeout(() => {
        if (cancelled) return
        // Keep the image in place at settlement to match your brand mark
        dressGlyph('/Penny.webp')
        glyph.style.opacity = '1'
      }, 120))

      loader.classList.add('revealing')        
      orb.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${scale})`
      timers.push(window.setTimeout(() => { if (!cancelled) hide() }, 1000))
    }

    const finishQuick = () => {
      if (finishing) return
      finishing = true
      loader.classList.add('fade-out')
      root.classList.remove('penny-loading')
      timers.push(window.setTimeout(() => { if (!cancelled) hide() }, 420))
    }

    const runFull = async () => {
      dressGlyph(SEQ[0])
      if (reduce) { finishFull(); return }
      await wait(640); if (cancelled) return
      flipTo(SEQ[1]); await wait(1080); if (cancelled) return
      flipTo(SEQ[2]); await wait(1080); if (cancelled) return
      flipTo(SEQ[3]); await wait(1180); if (cancelled) return
      finishFull()
    }

    const runQuick = async () => {
      dressGlyph('/Penny.webp') // Instantly uses the image instead of the code string
      if (reduce) { finishQuick(); return }
      flipTo('₹')                      
      await wait(780); if (cancelled) return
      finishQuick()
    }

    const onClick = () => { if (mode === 'full') finishFull(); else finishQuick() }
    loader.addEventListener('click', onClick) 

    if (mode === 'full') void runFull()
    else void runQuick()

    return () => {
      cancelled = true
      timers.forEach((t) => clearTimeout(t))
      loader.removeEventListener('click', onClick)
      root.classList.remove('penny-loading')
      document.body.style.overflow = ''
    }
  }, [pathname])

  return (
    <div id="penny-loader" ref={rootRef} aria-hidden="true">
      <div className="loader-orb" ref={orbRef}>
        <div className="lo-coin" ref={coinRef}>
          <span className="lo-glyph" ref={glyphRef}>
            {/* Initial Server Render Placeholder */}
            <img src="/Penny.webp" alt="Penny" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
          </span>
        </div>
      </div>
    </div>
  )
}