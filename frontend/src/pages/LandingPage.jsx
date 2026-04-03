import '../landing.css';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import api from '../services/api';
import {
  Sparkles, Mic, FileText, ArrowRight, Zap,
  Play, Star, Check, Menu, X, Brain, BookOpen,
  Layers, MessageSquare, Upload, Wand2, BarChart3, Clock
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Animation Variants
───────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

/* ─────────────────────────────────────────────
   Scroll-triggered Section Wrapper
───────────────────────────────────────────── */
function AnimatedSection({ children, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={fadeUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   NAVBAR — fully standalone, no Layout dependency
───────────────────────────────────────────── */
function Navbar({ user }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Demo', href: '#demo' },
    { label: 'About', href: '#about' },
  ];

  return (
    <>
      <nav
        id="landing-navbar"
        role="navigation"
        aria-label="Main navigation"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          transition: 'background 0.3s ease, box-shadow 0.3s ease, padding 0.3s ease',
          padding: scrolled ? '10px 0' : '18px 0',
          background: scrolled ? 'rgba(8, 12, 20, 0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
          boxShadow: scrolled
            ? '0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4)'
            : 'none',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Logo */}
          <Link to="/" id="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
            <span style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(99,102,241,0.4)', flexShrink: 0,
            }}>
              <Sparkles size={17} color="white" />
            </span>
            <span style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#f0f4ff', whiteSpace: 'nowrap' }}>
              Lecture Assistant
            </span>
          </Link>

          <div style={{ flex: 1 }} />

          {/* Desktop nav links */}
          <ul className="landing-nav__links" role="list">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="landing-nav__link">{link.label}</a>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="landing-nav__cta">
            {user ? (
              <Link to="/workspace" className="btn btn--primary" id="nav-workspace-btn">
                Dashboard <ArrowRight size={15} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn--ghost" id="nav-signin-btn">Sign In</Link>
                <Link to="/register" className="btn btn--primary" id="nav-getstarted-btn">
                  Get Started <ArrowRight size={15} />
                </Link>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button
            className="landing-nav__hamburger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            id="nav-hamburger"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          style={{
            position: 'fixed', top: 64, left: 0, right: 0, zIndex: 199,
            background: 'rgba(8, 12, 20, 0.98)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            padding: '16px 24px 20px',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}
        >
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="landing-nav__mobile-link" onClick={() => setMenuOpen(false)}>
              {link.label}
            </a>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
            {user ? (
              <Link to="/workspace" className="btn btn--primary btn--full" onClick={() => setMenuOpen(false)}>
                Dashboard <ArrowRight size={15} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn--ghost btn--full" onClick={() => setMenuOpen(false)}>Sign In</Link>
                <Link to="/register" className="btn btn--primary btn--full" onClick={() => setMenuOpen(false)}>Get Started</Link>
              </>
            )}
          </div>
        </motion.div>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────
   HERO SECTION
───────────────────────────────────────────── */
function HeroSection({ user, userCount }) {
  const videoRef = useRef(null);

  // Fix for React SPA navigation:
  // Browsers don't re-trigger `autoPlay` when a component re-mounts
  // (e.g., navigating away then back). We must manually call load() + play().
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.load();

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay blocked by browser policy (e.g. no user gesture yet).
      });
    }

    // Pause & reset when navigating away
    return () => {
      video.pause();
      video.currentTime = 0;
    };
  }, []);

  const badges = [
    { label: 'AI-Powered', icon: <Brain size={14} />, delay: 0 },
    { label: 'Real-time', icon: <Zap size={14} />, delay: 0.2 },
    { label: 'Multi-format', icon: <Layers size={14} />, delay: 0.4 },
  ];

  return (
    <section className="hero" id="hero" aria-label="Hero section">
      {/* Video Background */}
      <div className="hero__video-wrap">
        <video
          ref={videoRef}
          className="hero__video"
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        >
          {/* Direct CDN link to the original "Woman writing" video */}
          <source
            src="https://videos.pexels.com/video-files/3195394/3195394-hd_1920_1080_25fps.mp4"
            type="video/mp4"
          />
          {/* Fallback education video: studying at a desk */}
          <source
            src="https://videos.pexels.com/video-files/4121235/4121235-hd_1920_1080_25fps.mp4"
            type="video/mp4"
          />
        </video>
        <div className="hero__overlay" />
        <div className="hero__gradient-mesh" />
      </div>

      <div className="landing-container hero__content">
        {/* Badge pills */}
        <motion.div
          className="hero__badges"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
        >
          {badges.map((badge) => (
            <motion.span key={badge.label} variants={fadeIn} custom={badge.delay} className="hero__badge">
              {badge.icon} {badge.label}
            </motion.span>
          ))}
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="hero__title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          Transform Your Lectures
          <span className="hero__title-gradient"> into Smart Notes</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="hero__subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          Lecture Assistant uses cutting-edge AI to transcribe, summarize, and structure your
          lectures in real-time — so you can focus on learning, not note-taking.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="hero__actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {user ? (
            <Link to="/workspace" className="btn btn--hero btn--primary" id="hero-workspace-btn">
              <span>Enter Workspace</span> <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn--hero btn--primary" id="hero-try-btn">
                <span>Try it Now — Free</span> <ArrowRight size={18} />
              </Link>
              <a href="#demo" className="btn btn--hero btn--glass" id="hero-demo-btn">
                <Play size={16} className="hero__play-icon" />
                <span>See Demo</span>
              </a>
            </>
          )}
        </motion.div>

        {/* Social proof */}
        <motion.div
          className="hero__social-proof"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.75 }}
        >
          <div className="hero__stars">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} className="hero__star" fill="currentColor" />
            ))}
          </div>
          <span className="hero__social-text">
            Trusted by {userCount !== null ? `${userCount.toLocaleString()}+` : '…'} students &amp; educators
          </span>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="hero__scroll"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <div className="hero__scroll-line" />
        <span className="hero__scroll-text">Scroll to explore</span>
      </motion.div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   FEATURES SECTION
───────────────────────────────────────────── */
const features = [
  {
    id: 'feat-transcription',
    icon: <Mic size={24} />,
    title: 'Real-Time Transcription',
    description:
      'Record live audio or upload files — our AI converts speech to text with 98%+ accuracy, supporting 40+ languages.',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.05))',
  },
  {
    id: 'feat-summarization',
    icon: <Brain size={24} />,
    title: 'AI-Powered Summarization',
    description:
      'Instantly generate concise summaries, key takeaways, and bullet-point notes from any lecture content.',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.05))',
  },
  {
    id: 'feat-notes',
    icon: <FileText size={24} />,
    title: 'Smart Note Generation',
    description:
      'Structured notes with headings, definitions, and important formulas — organized exactly how you need them.',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.05))',
  },
  {
    id: 'feat-doubt',
    icon: <MessageSquare size={24} />,
    title: 'Doubt Resolution',
    description:
      'Highlight any confusing text and get an instant, detailed AI explanation with relevant examples.',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.05))',
  },
];

function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="section" id="features" aria-labelledby="features-heading">
      <div className="landing-container">
        <AnimatedSection className="section__header">
          <span className="section__label">
            <Zap size={14} /> Features
          </span>
          <h2 className="section__title" id="features-heading">
            Everything You Need to
            <span className="text-gradient"> Learn Smarter</span>
          </h2>
          <p className="section__subtitle">
            Powerful tools designed to supercharge your learning workflow.
          </p>
        </AnimatedSection>

        <motion.div
          ref={ref}
          className="features-grid"
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
        >
          {features.map((f) => (
            <motion.div
              key={f.id}
              id={f.id}
              variants={fadeUp}
              className="feature-card"
              style={{ '--card-gradient': f.gradient, '--card-accent': f.color }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
            >
              <div className="feature-card__icon" style={{ color: f.color }}>{f.icon}</div>
              <h3 className="feature-card__title">{f.title}</h3>
              <p className="feature-card__desc">{f.description}</p>
              <div className="feature-card__accent-bar" style={{ background: f.color }} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   HOW IT WORKS SECTION
───────────────────────────────────────────── */
const steps = [
  { step: '01', icon: <Upload size={22} />, title: 'Upload or Record', description: 'Import your lecture audio, video, PDF, or paste text directly into the workspace.', color: '#3b82f6' },
  { step: '02', icon: <Wand2 size={22} />, title: 'AI Processes It', description: 'Our AI engine transcribes, analyzes, and extracts the key information automatically.', color: '#8b5cf6' },
  { step: '03', icon: <BookOpen size={22} />, title: 'Get Smart Notes', description: 'Receive beautifully structured notes, summaries, and insights ready to review.', color: '#10b981' },
  { step: '04', icon: <BarChart3 size={22} />, title: 'Review & Learn', description: 'Interact with your notes, resolve doubts, and find linked resources for deeper learning.', color: '#f59e0b' },
];

function HowItWorksSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="section section--alt" id="how-it-works" aria-labelledby="how-heading">
      <div className="landing-container">
        <AnimatedSection className="section__header">
          <span className="section__label">
            <Clock size={14} /> Process
          </span>
          <h2 className="section__title" id="how-heading">
            From Lecture to Notes in
            <span className="text-gradient"> Minutes</span>
          </h2>
          <p className="section__subtitle">A seamless four-step workflow designed for speed and clarity.</p>
        </AnimatedSection>

        <motion.div
          ref={ref}
          className="steps-grid"
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={{ visible: { transition: { staggerChildren: 0.14 } } }}
        >
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              variants={fadeUp}
              className="step-card"
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            >
              <div className="step-card__number" style={{ color: s.color }}>{s.step}</div>
              <div className="step-card__icon-wrap" style={{ '--step-color': s.color }}>
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
              <h3 className="step-card__title">{s.title}</h3>
              <p className="step-card__desc">{s.description}</p>
              {i < steps.length - 1 && <div className="step-card__connector" />}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   DEMO / INPUT SECTION
───────────────────────────────────────────── */
function DemoSection() {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const charLimit = 2000;

  const sampleText = `Today's lecture covered the fundamental principles of machine learning.
We discussed supervised learning, where models are trained on labeled datasets,
and unsupervised learning, which finds patterns in unlabeled data.
Key algorithms include linear regression for continuous outputs,
logistic regression for classification, and neural networks for complex tasks.
We also touched on regularization techniques like L1 and L2 to prevent overfitting.`;

  const handleProcess = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 2200));
    setResult({
      summary: 'This lecture introduces core machine learning concepts, contrasting supervised vs. unsupervised learning paradigms, key algorithms, and overfitting prevention through regularization.',
      keyPoints: [
        'Supervised learning uses labeled datasets; unsupervised learning finds patterns in unlabeled data.',
        'Linear regression → continuous output; Logistic regression → classification tasks.',
        'Neural networks handle complex, high-dimensional problems.',
        'Regularization (L1/L2) reduces overfitting by penalizing model complexity.',
      ],
    });
    setIsProcessing(false);
  };

  const handleSample = () => setInputText(sampleText);

  return (
    <section className="section" id="demo" aria-labelledby="demo-heading">
      <div className="landing-container">
        <AnimatedSection className="section__header">
          <span className="section__label">
            <Play size={14} /> Live Demo
          </span>
          <h2 className="section__title" id="demo-heading">
            Try It Right Here,
            <span className="text-gradient"> Right Now</span>
          </h2>
          <p className="section__subtitle">Paste any lecture text and watch AI magic happen.</p>
        </AnimatedSection>

        <AnimatedSection>
          <div className="demo-card">
            <div className="demo-card__input-section">
              <div className="demo-card__label-row">
                <label htmlFor="demo-input" className="demo-card__label">
                  <FileText size={15} /> Paste Your Lecture Content
                </label>
                <button onClick={handleSample} className="demo-card__sample-btn" id="demo-sample-btn">
                  Load Sample Text
                </button>
              </div>

              <textarea
                id="demo-input"
                className="demo-card__textarea"
                placeholder="Click 'Load Sample Text' to try the demo..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value.slice(0, charLimit))}
                onPaste={(e) => e.preventDefault()}
                readOnly
                rows={8}
              />

              <div className="demo-card__footer-row">
                <span className="demo-card__char-count">{inputText.length}/{charLimit} characters</span>
                <motion.button
                  id="demo-process-btn"
                  className={`btn btn--primary btn--demo ${isProcessing ? 'btn--loading' : ''}`}
                  onClick={handleProcess}
                  disabled={isProcessing || !inputText.trim()}
                  whileHover={{ scale: inputText.trim() ? 1.03 : 1 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {isProcessing ? (
                    <><span className="demo-spinner" /> Processing...</>
                  ) : (
                    <><Wand2 size={16} /> Generate Smart Notes</>
                  )}
                </motion.button>
              </div>
            </div>

            {result && (
              <motion.div
                className="demo-card__result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="demo-result__section">
                  <h4 className="demo-result__heading">
                    <Brain size={16} /> AI Summary
                  </h4>
                  <p className="demo-result__text">{result.summary}</p>
                </div>
                <div className="demo-result__section">
                  <h4 className="demo-result__heading">
                    <Check size={16} /> Key Points
                  </h4>
                  <ul className="demo-result__list">
                    {result.keyPoints.map((pt, i) => (
                      <li key={i} className="demo-result__item">
                        <span className="demo-result__check">✓</span> {pt}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="demo-result__cta">
                  <Link to="/register" className="btn btn--primary" id="demo-signup-btn">
                    Get Full Access — Free <ArrowRight size={16} />
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   ABOUT / STATS STRIP
───────────────────────────────────────────── */
const STATIC_STATS = [
  { id: 'accuracy', value: '98%', label: 'Transcription Accuracy' },
  { id: 'languages', value: '40+', label: 'Languages Supported' },
  { id: 'speed', value: '<30s', label: 'Processing Time' },
];

function AboutSection({ userCount }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  const allStats = [
    ...STATIC_STATS,
    {
      id: 'users',
      value: userCount !== null ? `${userCount.toLocaleString()}+` : '…',
      label: 'Active Users',
    },
  ];

  return (
    <section className="section section--dark" id="about" aria-labelledby="about-heading">
      <div className="landing-container">
        <motion.div
          ref={ref}
          className="stats-grid"
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {allStats.map((s) => (
            <motion.div key={s.id} variants={fadeUp} className="stat-card">
              <span className="stat-card__value">{s.value}</span>
              <span className="stat-card__label">{s.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   FOOTER
───────────────────────────────────────────── */
function Footer() {
  const year = new Date().getFullYear();

  const footerLinks = {
    Product: ['Features', 'Demo', 'Pricing', 'Changelog'],
    Company: ['About', 'Blog', 'Careers', 'Contact'],
    Legal: ['Privacy', 'Terms', 'Cookie Policy'],
  };

  const socialLinks = [
    { label: 'Twitter', href: '#', icon: '𝕏' },
    { label: 'GitHub', href: '#', icon: '⌥' },
    { label: 'LinkedIn', href: '#', icon: 'in' },
  ];

  return (
    <footer className="footer" role="contentinfo">
      <div className="landing-container">
        <div className="footer__top">
          <div className="footer__brand">
            <span className="landing-logo">
              <span className="landing-logo__icon"><Sparkles size={16} /></span>
              <span className="landing-logo__text">Lecture Assistant</span>
            </span>
            <p className="footer__tagline">
              Transforming how students and educators engage with knowledge.
            </p>
            <div className="footer__socials">
              {socialLinks.map((s) => (
                <a key={s.label} href={s.href} aria-label={s.label} className="footer__social-link">{s.icon}</a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group} className="footer__col">
              <h4 className="footer__col-heading">{group}</h4>
              <ul className="footer__link-list" role="list">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="footer__link">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer__bottom">
          <p className="footer__copy">© {year} Lecture Assistant. All rights reserved.</p>
          <p className="footer__made">Built with ❤️ for students everywhere.</p>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────
   LOADING SCREEN
───────────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div className="loading-screen" role="status" aria-label="Loading">
      <motion.div
        className="loading-screen__inner"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="loading-screen__logo">
          <Sparkles size={28} />
        </div>
        <div className="loading-screen__spinner" />
        <p className="loading-screen__text">Initializing...</p>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────── */
export default function LandingPage() {
  const { user, loading } = useAuth();
  const [userCount, setUserCount] = useState(null);

  useEffect(() => {
    api.get('/auth/stats')
      .then((res) => setUserCount(res.data.user_count ?? 0))
      .catch(() => setUserCount(null));
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <div className="landing-root">
      <Navbar user={user} />
      <HeroSection user={user} userCount={userCount} />
      <FeaturesSection />
      <HowItWorksSection />
      <DemoSection />
      <AboutSection userCount={userCount} />
      <Footer />
    </div>
  );
}
