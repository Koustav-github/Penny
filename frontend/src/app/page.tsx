import Link from "next/link";
import {
  Wallet,
  LayoutDashboard,
  Sparkles,
  Search,
  Coins,
  ArrowRightLeft,
  Bot,
  ShieldCheck,
  ArrowRight,
  Check,
} from "lucide-react";
import "./landing.css";
import PennyLandingScripts from "@/components/PennyLandingScripts";

type CSS = React.CSSProperties;

export const metadata = {
  title: "Penny — Your money, finally understood",
  description:
    "Penny is an AI financial assistant that tracks your assets, analyses your finances and turns them into clear, AI-powered advice.",
};

export default function Home() {
  return (
    <div className="penny-root">
      {/* ===================== FLOATING SCENE (parallax) ===================== */}
      <div className="scene" aria-hidden="true">
        <Floaty pos={{ left: "8%", top: 130 }} speed={0.18} spin={1.2} pose="rotateX(14deg) rotateY(-18deg) rotateZ(-8deg)" bob={bob("8s", ".2s", "3deg")}>
          <Card variant="green" label="DEBIT" num="5412  7790  0042  8810" name="Tracked" valid="VALID 09/29" />
        </Floaty>
        <Floaty pos={{ right: "7%", top: 240 }} speed={0.3} spin={-1.6} pose="rotateX(20deg) rotateY(22deg) rotateZ(9deg)" bob={bob("9.5s", ".6s", "-4deg")}>
          <Card variant="dark" label="BLACK" num="4920  1183  6657  2204" name="Net worth" valid="LIVE" />
        </Floaty>
        <Floaty pos={{ left: "18%", top: 560 }} speed={0.42} spin={2.2} pose="rotateX(-10deg) rotateY(26deg) rotateZ(-12deg)" bob={bob("7s", ".1s", "4deg")}>
          <span className="coin coin--gold" style={coin(96, 34)}>₹</span>
        </Floaty>
        <Floaty extra pos={{ right: "20%", top: 610 }} speed={0.55} spin={-2.4} pose="rotateY(-20deg) rotateZ(8deg)" bob={bob("6.4s", ".4s", "6deg")}>
          <span className="token token--btc" style={coin(78, 34)}>₿</span>
        </Floaty>
        <Floaty pos={{ left: "46%", top: 80 }} speed={0.62} spin={1.0} bob={bob("5.5s", ".9s", "0deg")}>
          <span className="orb" style={{ width: 120, height: 120 }} />
        </Floaty>
        <Floaty extra pos={{ left: "4%", top: 780 }} speed={0.5} spin={-1.2} pose="rotateY(16deg) rotateZ(-6deg)" bob={bob("8.8s", ".3s", "-3deg")}>
          <span className="token token--eth" style={coin(66, 30)}>Ξ</span>
        </Floaty>

        <Floaty pos={{ right: "5%", top: 1500 }} speed={0.34} spin={1.5} pose="rotateX(12deg) rotateY(-24deg) rotateZ(7deg)" bob={bob("9s", ".2s", "4deg")}>
          <span className="coin coin--green" style={coin(70, 26)}>P</span>
        </Floaty>
        <Floaty extra pos={{ left: "6%", top: 1750 }} speed={0.48} spin={-2.0} pose="rotateY(28deg) rotateZ(-10deg)" bob={bob("7.6s", ".7s", "5deg")}>
          <span className="coin coin--copper" style={coin(60, 22)}>¢</span>
        </Floaty>
        <Floaty pos={{ left: "2%", top: 2150 }} speed={0.4} spin={1.1} pose="rotateX(16deg) rotateY(20deg) rotateZ(10deg)" bob={bob("10s", ".5s", "-4deg")}>
          <Card variant="gold" label="GOLD" num="3781  8829  1000  55" />
        </Floaty>

        <Floaty extra pos={{ right: "4%", top: 2700 }} speed={0.52} spin={-1.4} bob={bob("6s", ".2s")}>
          <span className="orb orb--dim" style={{ width: 90, height: 90 }} />
        </Floaty>
        <Floaty pos={{ left: "5%", top: 3050 }} speed={0.36} spin={2.0} pose="rotateY(-22deg) rotateZ(8deg)" bob={bob("8.2s", ".6s", "5deg")}>
          <span className="token token--btc" style={coin(58, 26)}>₿</span>
        </Floaty>
        <Floaty extra pos={{ right: "8%", top: 3550 }} speed={0.44} spin={-1.8} pose="rotateX(10deg) rotateY(24deg) rotateZ(-9deg)" bob={bob("9.3s", ".3s", "4deg")}>
          <span className="coin coin--gold" style={coin(64, 24)}>₹</span>
        </Floaty>
        <Floaty pos={{ right: "5%", top: 3950 }} speed={0.38} spin={1.7} pose="rotateY(-26deg) rotateZ(9deg)" bob={bob("8.5s", ".4s", "4deg")}>
          <span className="orb" style={{ width: 80, height: 80 }} />
        </Floaty>
      </div>

      {/* ===================== NAV ===================== */}
      <nav className="nav-inner" aria-label="Primary">
        <Link className="brand" href="#top"><span className="coin-mark">P</span>Penny</Link>
        <div className="nav-links">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#demo">Meet Penny</a>
          <a href="#roadmap">Roadmap</a>
        </div>
        <div className="nav-cta">
          <Link href="/login" className="nav-signin" style={{ fontSize: 14, color: "var(--ink-dim)" }}>Sign in</Link>
          <Link className="btn btn-primary" href="/signup">Get started</Link>
        </div>
      </nav>

      {/* ===================== HERO ===================== */}
      <header className="hero section" id="top">
        <div className="ghost-word">Penny</div>
        <div className="wrap hero-inner">
          <span className="eyebrow">Your AI financial assistant</span>
          <h1>Your money,<br />finally <span className="script">understood.</span></h1>
          <p className="sub">Penny tracks all your assets, analyses your finances, and turns the numbers into clear, AI-powered advice — growing from a personal tracker into a SEBI-compliant robo-adviser.</p>
          <div className="hero-cta">
            <Link className="btn btn-primary" href="/signup">Get started <span className="btn-arrow">→</span></Link>
            <a href="#how" className="btn btn-ghost">See how it works</a>
          </div>
          <div className="hero-trust">
            <span><b>₹0</b> hidden fees</span>
            <span><b>100%</b> data control</span>
            <span><b>Open-source</b> AI</span>
          </div>
        </div>
      </header>

      {/* ===================== HOW IT WORKS ===================== */}
      <section className="how section" id="how">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="eyebrow">How Penny works</span>
            <h2>Three steps to a money mind <span className="script">that never sleeps</span></h2>
          </div>
          <div className="steps">
            <div className="step reveal"><span className="step-line" />
              <div className="step-ico"><Wallet size={22} /></div>
              <h3>Add your money</h3>
              <p>Log bank balances, stocks, crypto, gold and loans. Penny unifies everything into one live net-worth picture.</p>
            </div>
            <div className="step reveal d1"><span className="step-line" />
              <div className="step-ico"><LayoutDashboard size={22} /></div>
              <h3>See the full picture</h3>
              <p>A net-worth dashboard, spending analytics and 6-month trends turn raw numbers into real clarity.</p>
            </div>
            <div className="step reveal d2"><span className="step-line" />
              <div className="step-ico"><Sparkles size={22} /></div>
              <h3>Ask Penny AI</h3>
              <p>Get a plain-language report — where you overspent, where to cut, and how to grow savings — tailored to your goals.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FEATURES ===================== */}
      <section className="features section" id="features">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="eyebrow">Capabilities</span>
            <h2>Everything your money <span className="script">wishes it could tell you</span></h2>
          </div>
          <div className="feat-grid">
            <div className="feat span-2 reveal"><div className="f-ico"><Search size={22} /></div><h3>Spending X-ray</h3><p>See exactly where every rupee went, grouped by category with monthly trends — no more mystery charges.</p></div>
            <div className="feat span-2 reveal d1"><div className="f-ico"><Coins size={22} /></div><h3>Every asset, one view</h3><p>Bank, cash, stocks, crypto, gold and loans rolled into a single net-worth figure.</p></div>
            <div className="feat span-2 reveal d2"><div className="f-ico"><ArrowRightLeft size={22} /></div><h3>Multi-currency</h3><p>Hold and view your wealth in INR, USD, EUR or GBP, with live FX on the way.</p></div>

            <div className="feat span-3 feat-big reveal"><div>
              <div className="f-ico"><Bot size={22} /></div><h3>An adviser grounded in your numbers</h3>
              <p>Penny&apos;s AI reads your real data and writes a tailored report: summary, where you overspent, what to cut, and how to grow savings and net worth.</p></div>
              <div className="stat-row">
                <div className="stat"><div className="n">4</div><div className="l">report types</div></div>
                <div className="stat"><div className="n">₹-aware</div><div className="l">advice, in your currency</div></div>
              </div>
            </div>
            <div className="feat span-3 feat-big reveal d1"><div>
              <div className="f-ico"><ShieldCheck size={22} /></div><h3>Private by design</h3>
              <p>Secure sign-in, read-only by default, and your financial data is never sold. Penny works for you — full stop.</p></div>
              <div className="stat-row">
                <div className="stat"><div className="n">100%</div><div className="l">your data, your control</div></div>
                <div className="stat"><div className="n">0</div><div className="l">data ever sold</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== AI CHAT DEMO ===================== */}
      <section className="demo section" id="demo">
        <div className="wrap">
          <div className="demo-grid">
            <div className="demo-copy reveal">
              <span className="eyebrow">Meet Penny</span>
              <h2>Talk to your money <span className="script">like a person</span></h2>
              <p className="lead">No dashboards to decode. Ask in plain words — Penny answers with the real numbers behind it. Tap a question to see for yourself.{" "}
                <ArrowRight size={18} style={{ display: "inline", verticalAlign: "-3px", color: "var(--accent)" }} />
              </p>
              <ul className="feat-list">
                <li><span className="tick"><Check size={13} strokeWidth={3} /></span><span>Reads your real assets, spending and goals.</span></li>
                <li><span className="tick"><Check size={13} strokeWidth={3} /></span><span>Replies in plain language, with the figures.</span></li>
                <li><span className="tick"><Check size={13} strokeWidth={3} /></span><span>Turns every insight into a next step.</span></li>
              </ul>
            </div>

            <div className="reveal d1">
              <div className="phone">
                <div className="notch" />
                <div className="screen">
                  <div className="screen-top">
                    <span className="av">P</span>
                    <div><div className="who">Penny</div><div className="stat-txt">AI financial assistant</div></div>
                    <span className="stat-dot" />
                  </div>
                  <div className="chat" id="penny-chat" />
                  <div className="composer">
                    <div className="prompts" id="penny-prompts">
                      <button className="prompt-chip" data-key="spend">Where did my money go?</button>
                      <button className="prompt-chip" data-key="save">Am I saving enough?</button>
                      <button className="prompt-chip" data-key="networth">How&apos;s my net worth?</button>
                      <button className="prompt-chip" data-key="goals">What about my goals?</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== ROADMAP ===================== */}
      <section className="roadmap section" id="roadmap">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="eyebrow">The vision</span>
            <h2>From tracker to <span className="script">regulated fintech</span></h2>
            <p>Penny grows in public — each release moves from simply tracking your money to actively growing it.</p>
          </div>
          <div className="road-grid">
            {ROADMAP.map((r, i) => (
              <div key={r.tag} className={`road reveal${i % 3 === 1 ? " d1" : i % 3 === 2 ? " d2" : ""}${r.live ? " live" : ""}`}>
                <span className="big">{i + 1}</span>
                <span className="tag">{r.tag}</span>
                <h3>{r.name}</h3>
                <p>{r.desc}</p>
                {r.live && <span className="pill">Available now</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FOOTER CTA ===================== */}
      <section className="footer-cta section">
        <div className="wrap">
          <span className="eyebrow reveal" style={{ justifyContent: "center", display: "flex" }}>Start free</span>
          <h2 className="reveal">Your money has a lot<br />to say. Let it <span className="script">speak.</span></h2>
          <p className="sub reveal d1">Free to use. Your data stays yours.</p>
          <div className="hero-cta reveal d1" style={{ marginTop: 30 }}>
            <Link className="btn btn-primary" href="/signup">Get started <span className="btn-arrow">→</span></Link>
            <Link className="btn btn-ghost" href="/login">Sign in</Link>
          </div>
          <div className="foot-note reveal d1">Free · No card required · You control your data</div>
        </div>
      </section>

      <footer className="site">
        <div className="wrap row">
          <Link className="brand" href="#top"><span className="coin-mark">P</span>Penny</Link>
          <div className="links">
            <a href="#how">How it works</a>
            <a href="#features">Features</a>
            <a href="#demo">Meet Penny</a>
            <a href="#roadmap">Roadmap</a>
          </div>
          <div className="copy">© 2026 Penny · Built by Koustav Manna</div>
        </div>
      </footer>

      <PennyLandingScripts />
    </div>
  );
}

const ROADMAP = [
  { tag: "v0.1", name: "Tracker", desc: "Track assets, expenses and net worth in one place.", live: true },
  { tag: "v0.2", name: "AI Adviser", desc: "Goal planning, risk profiling and SIP/savings strategy from a RAG knowledge base.", live: false },
  { tag: "v0.3", name: "Assistant", desc: "Live market & crypto data, price alerts and portfolio recommendations.", live: false },
  { tag: "v0.4", name: "Planner", desc: "Asset allocation, rebalancing, strategy simulation and backtesting.", live: false },
  { tag: "v0.5", name: "Investor", desc: "Connect Zerodha, Upstox or Binance — Penny suggests trades, you approve.", live: false },
  { tag: "v1.0", name: "Regulated", desc: "SEBI-authorised adviser: compliant, advice-grade automation.", live: false },
];

function bob(dur: string, delay: string, wobble?: string): CSS {
  return { "--dur": dur, "--delay": delay, ...(wobble ? { "--wobble": wobble } : {}) } as CSS;
}
function coin(size: number, font: number): CSS {
  return { width: size, height: size, fontSize: font };
}

function Floaty({
  pos, speed, spin, pose, bob, extra, children,
}: {
  pos: CSS; speed: number; spin: number; pose?: string; bob: CSS; extra?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`floaty${extra ? " tier-extra" : ""}`} style={pos} data-speed={speed} data-spin={spin}>
      <div className="pose" style={pose ? { transform: pose } : undefined}>
        <div className="bob" style={bob}>{children}</div>
      </div>
    </div>
  );
}

function Card({
  variant, label, num, name, valid,
}: {
  variant: "green" | "dark" | "gold"; label: string; num: string; name?: string; valid?: string;
}) {
  return (
    <div className={`card3d card--${variant}`} style={variant === "gold" ? { width: 250 } : undefined}>
      <div className="c-top">
        <span className="c-brand"><span className="c-dot" />Penny</span>
        <span className="c-num" style={{ fontSize: 11, letterSpacing: ".18em" }}>{label}</span>
      </div>
      <div className="chip" />
      <div className="c-num" style={variant === "gold" ? { fontSize: 13 } : undefined}>{num}</div>
      {(name || valid) && (
        <div className="c-foot"><span>{name}</span><span>{valid}</span></div>
      )}
    </div>
  );
}
