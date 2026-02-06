"use client";

import { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import {
  ArrowRight, Sparkles, Mail, MapPin, Clock, Send,
  Menu, X, Zap, Shield, FileText, MessageCircle,
  Settings, Cpu, ChevronDown
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   GLOBAL STYLES
═══════════════════════════════════════════════════════════════════════════ */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Syne:wght@400;500;600;700&display=swap');
    :root {
      --primary:#d4845a;
      --primary-light:rgba(212,132,90,0.13);
      --secondary:#c49a8a;
      --secondary-light:rgba(196,154,138,0.13);
      --accent:#b8836a;
      --accent-light:rgba(184,131,106,0.13);
      --bg:#faf7f4;
      --surface:#ffffff;
      --surface-alt:#f5f0eb;
      --text-primary:#2c2420;
      --text-secondary:#6b5a52;
      --text-muted:#a08878;
      --border:#e8ddd6;
      --border-light:#efe8e2;
      --grad:#d4845a 0%,#c07248 100%;
      --shadow-sm:0 2px 6px rgba(44,36,32,0.05);
      --shadow-md:0 8px 24px rgba(44,36,32,0.08);
    }
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text-primary);-webkit-font-smoothing:antialiased;overflow-x:hidden}
    .syne{font-family:'Syne',sans-serif}
    .grad-text{background:linear-gradient(90deg,var(--primary),var(--accent),var(--secondary));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .nav-glass{background:rgba(250,247,244,0.84);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid var(--border)}
    .glass{background:rgba(255,255,255,0.55);backdrop-filter:blur(14px) saturate(120%);-webkit-backdrop-filter:blur(14px) saturate(120%);border:1px solid rgba(255,255,255,0.55);box-shadow:inset 0 1px 0 rgba(255,255,255,0.6),0 8px 24px rgba(44,36,32,0.08)}
    .lift{transition:transform .2s ease,box-shadow .2s ease}
    .lift:hover{transform:translateY(-2px);box-shadow:var(--shadow-md)}
    .cta{position:relative;transition:transform 230ms cubic-bezier(.34,1.56,.64,1),box-shadow 230ms cubic-bezier(.34,1.56,.64,1),background 230ms ease !important}
    .cta-primary:hover,.cta-primary:focus-visible{transform:scale(1.02) translateY(-1px) !important;box-shadow:0 4px 20px rgba(212,132,90,0.28),inset 0 1px 0 rgba(255,255,255,0.22) !important}
    .cta-ghost:hover,.cta-ghost:focus-visible{transform:scale(1.02) translateY(-1px) !important;box-shadow:0 4px 16px rgba(196,154,138,0.22),inset 0 1px 0 rgba(255,255,255,0.35) !important;background-color:rgba(196,154,138,0.07) !important;border-color:rgba(196,154,138,0.45) !important}
    .cta-pill{transition:transform 280ms cubic-bezier(.34,1.56,.64,1),box-shadow 280ms cubic-bezier(.34,1.56,.64,1),background 280ms ease}
    .cta-pill:hover,.cta-pill:focus-visible{transform:translateY(-2px) scale(1.04) !important;box-shadow:0 10px 28px rgba(212,132,90,0.18),inset 0 1px 0 rgba(255,255,255,0.75) !important}
    .cta:focus-visible{outline:2px solid var(--primary);outline-offset:2px}
    .reveal{opacity:0;transform:translateY(20px);transition:opacity .6s cubic-bezier(.22,1,.36,1),transform .6s cubic-bezier(.22,1,.36,1)}
    .reveal.vis{opacity:1;transform:translateY(0)}
    .drawer{transform:translateX(100%);transition:transform .3s cubic-bezier(.4,0,.2,1)}
    .drawer.open{transform:translateX(0)}
    input,textarea{font-family:inherit;outline:none}
    input:focus,textarea:focus{box-shadow:0 0 0 3px var(--primary-light)!important}
    ::-webkit-scrollbar{width:4px}
    ::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
    @keyframes bob{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(5px)}}
  `}</style>
);

/* ═══════════════════════════════════════════════════════════════════════════
   THREE.JS WIREFRAME BACKGROUND
   — wireframe-only, brand stroke colors, increased opacity, mouse-reactive
═══════════════════════════════════════════════════════════════════════════ */
function WireframeBG({ heroMode }) {
  const mountRef = useRef(null);
  const raf = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    /* ── scene setup ── */
    const scene = new THREE.Scene();
    const W = el.clientWidth, H = el.clientHeight;
    const camera = new THREE.PerspectiveCamera(58, W / H, 0.1, 200);
    camera.position.set(0, 1.5, 22);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    /* ── wireframe materials — warm peach palette, balanced visibility ── */
    const mat = (hex, opacity = 0.11) =>
      new THREE.MeshBasicMaterial({ color: hex, wireframe: true, transparent: true, opacity });

    const green  = mat(0xd4845a, 0.12);
    const blue   = mat(0xb8836a, 0.11);
    const pink   = mat(0xc49a8a, 0.10);

    const meshes = []; // { mesh, rot: {x,y,z?}, float?: {amp,freq,off} }

    /* helper: create + add */
    const add = (geo, material, pos, rot, rotSpeed, floatOpts) => {
      const m = new THREE.Mesh(geo, material);
      m.position.set(...pos);
      if (rot) m.rotation.set(...rot);
      group.add(m);
      meshes.push({ mesh: m, rot: rotSpeed || { x: 0, y: 0.004 }, float: floatOpts });
    };

    /* ── LARGE wireframe shapes — MINIMAL, WIDELY SPACED for clean background ── */
    // Just 4 main shapes, positioned far apart
    add(new THREE.IcosahedronGeometry(4.5, 1), green,
        [-9, 2, -5],  [0.3, 0.2, 0],   { x: 0.0018, y: 0.0035 });
    
    add(new THREE.OctahedronGeometry(3.2, 1), blue,
        [10, -3, -6], [0.5, 0.4, 0.1], { x: 0.0025, y: -0.0028 });
    
    add(new THREE.SphereGeometry(3.8, 16, 16), pink,
        [-8, -4, -7],  [0,0,0], { x: 0.001, y: 0.0025 });

    add(new THREE.DodecahedronGeometry(2.5, 0), green,
        [8, 4, -5.5], [0.6, 0.1, 0.3], { x: 0.0022, y: -0.003 });

    /* ── small floating particles — FEWER, more subtle ── */
    const mats3 = [green, blue, pink];
    for (let i = 0; i < 12; i++) {
      const r = 0.08 + Math.random() * 0.18;
      const geo = Math.random() > 0.5
        ? new THREE.SphereGeometry(r, 4, 4)
        : new THREE.BoxGeometry(r * 2, r * 2, r * 2);
      const m = mats3[Math.floor(Math.random() * 3)].clone();
      m.opacity = 0.03 + Math.random() * 0.05;
      const mesh = new THREE.Mesh(geo, m);
      mesh.position.set(
        (Math.random() - 0.5) * 32,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 10 - 3
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      group.add(mesh);
      meshes.push({
        mesh,
        rot: { x: (Math.random() - 0.5) * 0.01, y: (Math.random() - 0.5) * 0.01 },
        float: { amp: 0.004 + Math.random() * 0.006, freq: 0.25 + Math.random() * 0.45, off: Math.random() * Math.PI * 2 }
      });
    }

    /* ── faint grid floor ── */
    const grid = new THREE.GridHelper(32, 32, 0xa08878, 0xa08878);
    grid.material.transparent = true;
    grid.material.opacity = 0.045;
    grid.position.set(0, -6.5, -3);
    group.add(grid);

    /* ── mouse ── */
    const onMouse = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMouse);

    /* ── animation loop ── */
    const clock = new THREE.Clock();
    const animate = () => {
      raf.current = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      meshes.forEach(({ mesh, rot, float: fl }) => {
        if (rot.x) mesh.rotation.x += rot.x;
        if (rot.y) mesh.rotation.y += rot.y;
        if (rot.z) mesh.rotation.z += rot.z;
        if (fl) mesh.position.y += Math.sin(t * fl.freq + fl.off) * fl.amp;
      });

      // smooth mouse follow
      group.rotation.y += (mouse.current.x * 0.18 - group.rotation.y) * 0.016;
      group.rotation.x += (mouse.current.y * 0.12 - group.rotation.x) * 0.016;

      // subtle camera drift
      camera.position.x += (mouse.current.x * 1.6 - camera.position.x) * 0.01;
      camera.position.y += (mouse.current.y * 1.0 - camera.position.y) * 0.01;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    /* ── resize ── */
    const onResize = () => {
      const nw = el.clientWidth, nh = el.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", onResize);
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={mountRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none", filter: heroMode ? "blur(0.8px)" : "blur(1.1px)", opacity: heroMode ? 0.95 : 1 }} />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   REVEAL (scroll-triggered fade-in)
═══════════════════════════════════════════════════════════════════════════ */
function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.unobserve(el); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${vis ? "vis" : ""}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   NAV
═══════════════════════════════════════════════════════════════════════════ */
function Nav({ page, setPage }) {
  const [open, setOpen] = useState(false);
  const links = [
    { label: "Home",     target: "Home" },
    { label: "Platform", target: "Platform" },
    { label: "About",    target: "About" },
    { label: "Contact",  target: "Contact" },
  ];

  return (
    <nav className="nav-glass" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, height: 64 }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 24px", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>

        {/* Logo — TEXT-BASED */}
        <button onClick={() => setPage("Home")} style={{ display: "flex", alignItems: "center", gap: 0, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <div style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.55)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.6)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)" }}>
            <span className="syne" style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
              mesh<span style={{ color: "var(--primary)" }}>23</span>
            </span>
          </div>
        </button>

        {/* Desktop nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {links.map(({ label, target }) => (
            <button key={target} onClick={() => setPage(target)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500,
                       color: page === target ? "var(--primary)" : "var(--text-secondary)", transition: "color .2s" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Desktop CTA */}
        <button onClick={() => setPage("Contact")} className="lift cta cta-primary"
          style={{ background: "linear-gradient(135deg,var(--grad))", color: "#fff", border: "none",
                   borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                   boxShadow: "0 12px 32px rgba(212,132,90,0.28), inset 0 1px 0 rgba(255,255,255,0.35)" }}>
          Get in Touch
        </button>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "none" }} id="mob-btn">
          {open ? <X size={22} color="var(--text-primary)" /> : <Menu size={22} color="var(--text-primary)" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <div className={`drawer ${open ? "open" : ""}`}
        style={{ position: "fixed", top: 0, right: 0, height: "100%", width: 256, background: "var(--surface)",
                 borderLeft: "1px solid var(--border)", boxShadow: "var(--shadow-md)", zIndex: 51, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
          <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={20} color="var(--text-secondary)" />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {links.map(({ label, target }) => (
            <button key={target} onClick={() => { setPage(target); setOpen(false); }}
              style={{ background: page === target ? "var(--primary-light)" : "none", border: "none", borderRadius: 8,
                       padding: "11px 14px", textAlign: "left", fontSize: 15, fontWeight: 500,
                       color: page === target ? "var(--primary)" : "var(--text-primary)", cursor: "pointer" }}>
              {label}
            </button>
          ))}
          <button onClick={() => { setPage("Contact"); setOpen(false); }} className="cta cta-primary"
            style={{ marginTop: 16, background: "linear-gradient(135deg,var(--grad))", color: "#fff", border: "none",
                     borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                     boxShadow: "0 12px 32px rgba(212,132,90,0.28), inset 0 1px 0 rgba(255,255,255,0.35)" }}>
            Get in Touch
          </button>
        </div>
      </div>
      {open && <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 40 }} />}

      <style>{`
        @media(max-width:767px){
          nav > div > div:nth-child(2){ display:none !important }
          nav > div > button.lift{ display:none !important }
          #mob-btn{ display:flex !important }
        }
      `}</style>
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HERO
═══════════════════════════════════════════════════════════════════════════ */
function Hero({ setPage }) {
  return (
    <section style={{ position: "relative", height: "100vh", minHeight: 620, background: "var(--bg)", overflow: "hidden" }}>
      {/* 3D wireframe */}
      <WireframeBG heroMode />

      {/* bottom fade */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 220,
                    background: "linear-gradient(to top, var(--bg) 0%, transparent 100%)", zIndex: 10, pointerEvents: "none" }} />

      {/* content */}
      <div style={{ position: "relative", zIndex: 20, height: "100%", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 24px", paddingTop: 64 }}>

        {/* pill badge — GLASS utility */}
        <div className="cta cta-pill glass" style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 40, padding: "6px 18px", marginBottom: 28, cursor: "default" }}>
          <Sparkles size={14} color="var(--primary)" />
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>AI Workflow Automation · Built for Small Teams</span>
        </div>

        {/* headline */}
        <h1 className="syne" style={{ fontSize: "clamp(2.6rem, 6vw, 4.4rem)", fontWeight: 700, lineHeight: 1.08,
                                       letterSpacing: "-0.025em", color: "var(--text-primary)", maxWidth: 740, marginBottom: 22 }}>
          Automate the work<br />that eats your day.
        </h1>

        {/* sub-headline */}
        <p style={{ fontSize: "1.05rem", lineHeight: 1.55, maxWidth: 580, color: "var(--text-secondary)", marginBottom: 38 }}>
          Automations that <strong style={{ color: "var(--text-primary)" }}>schedule, track, follow up, and handle requests</strong> — using{" "}
          <strong style={{ color: "var(--text-primary)" }}>n8n</strong>,{" "}
          <strong style={{ color: "var(--text-primary)" }}>WhatsApp &amp; Telegram bots</strong>, and{" "}
          <strong style={{ color: "var(--text-primary)" }}>APIs</strong>.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {/* Primary — ENHANCED depth */}
          <button onClick={() => setPage("Contact")} className="cta cta-primary"
            style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,var(--grad))",
                     color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer",
                     boxShadow: "0 12px 32px rgba(212,132,90,0.28), inset 0 1px 0 rgba(255,255,255,0.35)" }}>
            Discuss a Workflow <ArrowRight size={16} />
          </button>
          {/* Secondary */}
          <button onClick={() => { document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" }); }} className="cta cta-ghost"
            style={{ background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border-light)",
                     borderRadius: 10, padding: "12px 24px", fontSize: 15, fontWeight: 500, cursor: "pointer", transition: "color .2s" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--text-secondary)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
            View examples
          </button>
        </div>
      </div>

      {/* scroll hint */}
      <div style={{ position: "absolute", bottom: 26, left: "50%", transform: "translateX(-50%)", zIndex: 20,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3, opacity: 0.3, animation: "bob 2s infinite" }}>
        <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 2 }}>scroll</span>
        <ChevronDown size={15} color="var(--text-muted)" />
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HOW IT WORKS
═══════════════════════════════════════════════════════════════════════════ */
function HowItWorks() {
  const steps = [
    { title: "Identify Bottlenecks",  desc: "We map your current workflows to surface repetitive, manual work." },
    { title: "Design Workflows",      desc: "Each automation is built around your tools and team — not a template." },
    { title: "Build & Integrate",     desc: "APIs, bots, n8n, and LLMs — wired together and tested end-to-end." },
    { title: "Iterate with Usage",    desc: "Post-launch refinement based on how your team actually uses it." },
  ];

  return (
    <section id="how-it-works" style={{ padding: "104px 24px", background: "var(--bg)" }}>
      <div style={{ maxWidth: 1060, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2.2, color: "var(--primary)" }}>Process</span>
            <h2 className="syne" style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 600, color: "var(--text-primary)", marginTop: 10, marginBottom: 10 }}>
              How it works
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
              A straightforward process — from discovery to a system your team actually uses.
            </p>
          </div>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 90}>
              <div className="lift" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "28px 24px", height: "100%" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: "0.8rem", lineHeight: 1.5, color: "var(--text-secondary)" }}>{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DEMO / CHAT
═══════════════════════════════════════════════════════════════════════════ */
function DemoSection() {
  const capabilities = [
    { name: "Project Status",        icon: FileText,      color: "var(--primary)" },
    { name: "Follow-up Scheduling",  icon: Clock,         color: "var(--accent)" },
    { name: "HR & Approvals",       icon: Shield,        color: "var(--secondary)" },
  ];

  const conversation = [
    { from: "user",  text: "What's the current status of the Acme onboarding project?" },
    { from: "bot",   text: "Two tasks are in review, one is blocked on legal sign-off. I've flagged it for the project lead.",
      icon: FileText, color: "var(--primary-light)" },
    { from: "user",  text: "Schedule a follow-up with the design team if no reply by end of day." },
    { from: "bot",   text: "Done. A follow-up is scheduled for 5:00 PM today if no response is detected.",
      icon: Clock, color: "var(--accent-light)" },
    { from: "user",  text: "I need to submit a leave request for next Friday." },
    { from: "bot",   text: "Leave request submitted for Fri 13 Jun. Awaiting manager approval — you'll be notified once it's actioned.",
      icon: Shield, color: "var(--secondary-light)" },
  ];

  return (
    <section style={{ padding: "104px 24px", background: "var(--surface-alt)" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2.2, color: "var(--primary)" }}>In Practice</span>
            <h2 className="syne" style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 600, color: "var(--text-primary)", marginTop: 10, marginBottom: 10 }}>
              One conversation. Multiple actions.
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
              Workflows and AI working together inside a single interface.
            </p>
          </div>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 28, alignItems: "start" }} id="demo-grid">

          <Reveal>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>Integrated Intelligence</h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.6 }}>
                mesh23 connects to your tools and acts on your behalf — not just answers.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {capabilities.map(({ name, icon: Icon, color }) => (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--surface)",
                                           border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px" }}>
                    <Icon size={18} color={color} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={110}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, boxShadow: "var(--shadow-md)", overflow: "hidden" }}>
              <div style={{ background: "var(--surface-alt)", borderBottom: "1px solid var(--border)", padding: "11px 18px", display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#ef4444" }} />
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#f59e0b" }} />
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#6aaa7a" }} />
                <span style={{ marginLeft: 14, fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>mesh23 · Workflow Assistant</span>
              </div>
              <div style={{ padding: "22px 20px", display: "flex", flexDirection: "column", gap: 18 }}>
                {conversation.map((msg, i) => {
                  const Icon = msg.icon;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, justifyContent: msg.from === "user" ? "flex-end" : "flex-start" }}>
                      {msg.from === "bot" && (
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: msg.color,
                                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon size={14} color="var(--text-primary)" />
                        </div>
                      )}
                      <div style={{
                        background: msg.from === "bot" ? "var(--surface-alt)" : "var(--accent)",
                        color: msg.from === "bot" ? "var(--text-primary)" : "#fff",
                        border: msg.from === "bot" ? "1px solid var(--border)" : "none",
                        borderRadius: 10, padding: "10px 14px", maxWidth: "78%", fontSize: 13, lineHeight: 1.55,
                        boxShadow: "var(--shadow-sm)"
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
      <style>{`@media(max-width:680px){#demo-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FEATURES GRID
═══════════════════════════════════════════════════════════════════════════ */
function FeaturesGrid() {
  const features = [
    { icon: Zap,           title: "Workflow Automation",        problem: "Repetitive manual tasks drain time and invite errors.",          how: "n8n + custom triggers and API chains.",              outcome: "Hours saved weekly, fewer mistakes." ,         color: "var(--primary)",   bg: "var(--primary-light)" },
    { icon: MessageCircle, title: "Conversational Interfaces",  problem: "Teams need quick answers without opening five apps.",           how: "WhatsApp & Telegram bots powered by LLMs.",         outcome: "Answers where your team already works.",       color: "var(--accent)",    bg: "var(--accent-light)" },
    { icon: Cpu,           title: "AI-Augmented Logic",         problem: "Some decisions need context that hard rules can't capture.",   how: "LLM calls wired into workflow decision nodes.",     outcome: "Intelligence without full ML overhead.",       color: "var(--secondary)", bg: "var(--secondary-light)" },
    { icon: Settings,      title: "Custom Integrations",        problem: "Off-the-shelf connectors rarely fit unique setups.",           how: "Hand-built API bridges for your stack.",            outcome: "Your tools finally talk to each other.",       color: "var(--primary)",   bg: "var(--primary-light)" },
    { icon: Shield,        title: "Rapid Prototyping",          problem: "Ideas sit on paper because building feels too slow.",         how: "Fast drafts using n8n + lightweight scripts.",      outcome: "Test an idea in days, not weeks.",              color: "var(--accent)",    bg: "var(--accent-light)" },
    { icon: FileText,      title: "Operational Optimization",   problem: "Processes work — but not as well as they could.",            how: "Audit, map, rebuild with automation at each step.", outcome: "Less friction, more consistent output.",       color: "var(--secondary)", bg: "var(--secondary-light)" },
  ];

  return (
    <section style={{ padding: "40px 24px 104px", background: "var(--bg)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 18 }}>
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={i * 65}>
                <div className="lift" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "26px 24px", height: "100%", display: "flex", flexDirection: "column" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: f.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                    <Icon size={20} color={f.color} />
                  </div>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 14 }}>{f.title}</h3>

                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: "var(--text-primary)", opacity: 0.55 }}>Problem</span>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 3, lineHeight: 1.5 }}>{f.problem}</p>
                  </div>

                  <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.45, marginBottom: 8 }}>
                    {f.how}
                  </p>

                  <p style={{ fontSize: "0.78rem", lineHeight: 1.45, marginTop: "auto", paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                    <strong style={{ color: "var(--text-primary)" }}>Outcome:</strong>{" "}
                    <span style={{ color: "var(--text-secondary)" }}>{f.outcome}</span>
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HOME
═══════════════════════════════════════════════════════════════════════════ */
function Home({ setPage }) {
  return (
    <>
      <Hero setPage={setPage} />
      <DemoSection />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PLATFORM
═══════════════════════════════════════════════════════════════════════════ */
function Platform() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", paddingTop: 64 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px 0" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2.2, color: "var(--primary)" }}>Platform</span>
            <h1 className="syne" style={{ fontSize: "clamp(2rem, 5vw, 2.9rem)", fontWeight: 600, color: "var(--text-primary)", marginTop: 10, marginBottom: 10 }}>
              What gets built
            </h1>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
              Every project is custom. Here's the range of what's possible.
            </p>
          </div>
        </Reveal>
      </div>
      <FeaturesGrid />
      <HowItWorks />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ABOUT
═══════════════════════════════════════════════════════════════════════════ */
function About() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", paddingTop: 64 }}>
      <div style={{ maxWidth: 840, margin: "0 auto", padding: "80px 24px 100px" }}>

        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 72 }}>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2.2, color: "var(--primary)" }}>About</span>
            <h1 className="syne" style={{ fontSize: "clamp(2rem, 5vw, 2.9rem)", fontWeight: 600, color: "var(--text-primary)", marginTop: 10, lineHeight: 1.22 }}>
              An independent practice,<br /><span className="grad-text">built on real projects.</span>
            </h1>
            <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 520, margin: "18px auto 0", lineHeight: 1.7 }}>
              mesh23 is not a startup chasing scale. It's a solo practice that builds AI automation for teams
              that need it done right — not fast, not cheap, but <em>correctly</em>.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "38px 42px", marginBottom: 32 }}>
            <h2 className="syne" style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>Why this exists</h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: 14 }}>
              Most small teams know automation could save them hours every week. But the tools are fragmented,
              the setup is opaque, and the "solutions" assume a budget and a DevOps team you don't have.
            </p>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: 14 }}>
              mesh23 started from a simple frustration: watching talented people spend their mornings on tasks
              a workflow could handle. The answer wasn't another SaaS dashboard — it was someone who could sit
              down, understand the actual work, and build something that fits.
            </p>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.8 }}>
              Every project starts with understanding before building. Every automation is tested with real usage before it's called done.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16, marginBottom: 32 }}>
            {[
              { title: "Learning by Building", desc: "Every workflow is a chance to get better. We ship, test, and iterate — not pitch theory." },
              { title: "Practical Outcomes",   desc: "Success is measured in hours saved and errors avoided. Not dashboards." },
              { title: "Honest Scope",         desc: "We'll tell you what automation can and can't do for your team. No overselling." },
            ].map((item) => (
              <div key={item.title} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "22px 20px" }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 7 }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal>
          <div style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", borderRadius: 18, padding: "38px 42px" }}>
            <h2 className="syne" style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", textAlign: "center", marginBottom: 28 }}>What guides the work</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24 }}>
              {[
                { icon: Shield,   title: "People First",        desc: "AI should reduce friction, not create it. Every build is evaluated by whether it makes the team's day easier." },
                { icon: Settings, title: "Privacy by Default",  desc: "Data handling is designed before the first line of code. Your information stays yours." },
                { icon: Cpu,      title: "Build, Don't Hype",   desc: "No buzzwords. If it works, it works. If it doesn't, we rebuild it until it does." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} style={{ textAlign: "center" }}>
                  <div style={{ width: 42, height: 42, margin: "0 auto 12px", borderRadius: 10, background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={20} color="var(--primary)" />
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>{title}</h3>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONTACT
═══════════════════════════════════════════════════════════════════════════ */
function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onSubmit = (e) => {
    e.preventDefault();
    
    // Create mailto link
    const subject = encodeURIComponent(`New Contact Form Submission from ${form.name}`);
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\nMessage:\n${form.message}`);
    const mailtoLink = `mailto:hello.mesh23@gmail.com?subject=${subject}&body=${body}`;
    
    // Open email client
    window.location.href = mailtoLink;
    
    // Show success message
    setSent(true);
    setForm({ name: "", email: "", message: "" });
    setTimeout(() => setSent(false), 6500);
  };

  const info = [
    { icon: Mail,   title: "Email",    value: "hello.mesh23@gmail.com",   desc: "Primary way to get in touch" },
    { icon: MapPin, title: "Location", value: "Remote · India-based",    desc: "Available for projects globally" },
    { icon: Clock,  title: "Response", value: "Within 24–48 hours",      desc: "We'll get back to you promptly" },
  ];

  const inp = { width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid var(--border)",
                background: "var(--surface-alt)", fontSize: 14, color: "var(--text-primary)", fontFamily: "inherit" };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", paddingTop: 64 }}>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "80px 24px 100px" }}>

        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2.2, color: "var(--primary)" }}>Contact</span>
            <h1 className="syne" style={{ fontSize: "clamp(2rem, 5vw, 2.9rem)", fontWeight: 600, color: "var(--text-primary)", marginTop: 10, marginBottom: 10 }}>
              Let's build something.
            </h1>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", maxWidth: 460, margin: "0 auto", lineHeight: 1.7 }}>
              Have a workflow in mind? Tell us what your team repeats every week and we'll figure out what to automate.
            </p>
          </div>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 28, alignItems: "start" }} id="contact-grid">

          <Reveal>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "34px 36px" }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", marginBottom: 20 }}>Send a message</h2>

              {sent && (
                <div style={{ background: "var(--primary-light)", color: "var(--primary)", borderRadius: 8,
                              padding: "10px 14px", fontSize: 13, fontWeight: 500, marginBottom: 18 }}>
                  Thanks — we'll be in touch within 24–48 hours.
                </div>
              )}

              <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Full Name</label>
                  <input type="text" name="name" value={form.name} onChange={onChange} required placeholder="Your name" style={inp} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Email</label>
                  <input type="email" name="email" value={form.email} onChange={onChange} required placeholder="you@company.com" style={inp} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Message</label>
                  <textarea name="message" value={form.message} onChange={onChange} required rows={4}
                    placeholder="What's one task your team repeats every week?"
                    style={{ ...inp, resize: "none" }} />
                </div>
                <button type="submit" className="cta cta-primary" id="send-btn"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                           background: "linear-gradient(135deg,var(--grad))", color: "#fff", border: "none",
                           borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer",
                           boxShadow: "0 12px 32px rgba(212,132,90,0.28), inset 0 1px 0 rgba(255,255,255,0.35)" }}>
                  <Send size={15} /> Send Message
                </button>
              </form>
            </div>
          </Reveal>

          <Reveal delay={110}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {info.map(({ icon: Icon, title, value, desc }) => (
                <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 16, background: "var(--surface)",
                                          border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={18} color="var(--primary)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{title}</h3>
                    <p style={{ fontSize: 14, color: "var(--primary)", marginTop: 2 }}>{value}</p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{desc}</p>
                  </div>
                </div>
              ))}

              <div style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px", marginTop: 2 }}>
                <h3 style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.2, color: "var(--text-muted)", marginBottom: 8 }}>Availability</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  Currently taking on new projects. Capacity is limited — if your timeline is tight, mention it in your message so we can be upfront about fit.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      <style>{`
        @media(max-width:680px){
          #contact-grid{ grid-template-columns:1fr !important }
          #send-btn{ width:100% }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", padding: "26px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.55)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.6)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)" }}>
          <span className="syne" style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
            mesh<span style={{ color: "var(--primary)" }}>23</span>
          </span>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
          © 2025 mesh23. Independent AI automation practice · Remote · India-based
        </p>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE ROOT (Next.js app router compatible)
═══════════════════════════════════════════════════════════════════════════ */
export default function Page() {
  const [page, setPage] = useState("Home");
  useEffect(() => { window.scrollTo(0, 0); }, [page]);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <GlobalStyles />
      <Nav page={page} setPage={setPage} />
      <main>
        {page === "Home"     && <Home     setPage={setPage} />}
        {page === "Platform" && <Platform />}
        {page === "About"    && <About />}
        {page === "Contact"  && <Contact />}
      </main>
      <Footer />
    </div>
  );
}