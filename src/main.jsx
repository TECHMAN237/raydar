import React, { useEffect, useRef, useState, useCallback, createContext, useContext } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight, ShieldCheck, MapPin, BellRing, Radio,
  Users, School, HeartHandshake, Check, Menu, X,
  UserRound, Clock, ArrowLeft, Cpu, ExternalLink
} from 'lucide-react';
import './styles.css';
import { submitToWaitlist } from './supabase.js';
import {
  LOCALES,
  DEFAULT_LOCALE,
  getStoredLanguage,
  setStoredLanguage,
  applyLocaleMetadata
} from './locales/index.js';
import { LanguageGate } from './components/LanguageGate.jsx';
import { LanguageSwitcher } from './components/LanguageSwitcher.jsx';

// ─── Centralized Image Configuration ───────────────────────────────────────
const IMAGE_ASSETS = {
  logo:             '/assets/raydar.png',
  heroImage:        '/assets/images/hero-child-safety-sos.jpg',
  problemImage:     '/assets/images/problem-community.png',
  wearableImage:    '/assets/images/raydar-wearable.png',
  waitingListImage: '/assets/images/hero-child-safety.png',
  fieldImage:       '/assets/field-activity.jpg',
  eventImages: [
    '/assets/images/project-event-1.png',
    '/assets/images/project-event-2.jpg',
  ],
};

// ─── Team Photos Configuration ─────────────────────────────────────────────
const TEAM_IMAGES = {
  lead: ['/assets/STEEVE ZALI.jpeg', '/assets/STEEVE%20ZALI.jpeg'],
  core: [
    ['/assets/YONTA BERIOT.jpeg', '/assets/YONTA%20BERIOT.jpeg'],
    ['/assets/Nanguep Steve.jpeg', '/assets/Nanguep%20Steve.jpeg'],
    ['/assets/TANTO EINSTEIN.png', '/assets/TANTO%20EINSTEIN.png'],
    [
      '/assets/Sinefo joy.jpeg',
      '/assets/Sinefo%20joy.jpeg',
      '/assets/SINEFO JOY.jpeg',
      '/assets/SINEFO%20JOY.jpeg',
      '/assets/Sinefo-joy.jpeg',
    ],
  ],
};

// ─── Language & Navigation Context ─────────────────────────────────────────
const LangContext = createContext({
  lang: DEFAULT_LOCALE,
  t: LOCALES[DEFAULT_LOCALE],
  setLanguage: () => {},
  toggleLanguage: () => {},
  go: () => {},
});

function useLang() {
  return useContext(LangContext);
}

// ─── Scroll Progress Bar ───────────────────────────────────────────────────
function ScrollProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop || document.body.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setPct(total > 0 ? Math.round((scrolled / total) * 100) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return <div className="scrollBar" style={{ width: `${pct}%` }} aria-hidden />;
}

// ─── Scroll Reveal Component ───────────────────────────────────────────────
function Reveal({ children, className = '', animation = 'fade-up', delay = 0 }) {
  const ref = useRef(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShow(true); o.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  const style = delay ? { transitionDelay: `${delay}ms` } : undefined;
  return (
    <div
      ref={ref}
      className={`reveal reveal-${animation} ${show ? 'show' : ''} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

// ─── Animated Stat Counter ─────────────────────────────────────────────────
function Counter({ to, suffix = '', duration = 1800 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const o = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          o.disconnect();
          const start = performance.now();
          const tick = (now) => {
            const t = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - t, 4);
            setVal(Math.round(ease * to));
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// ─── Image Component ───────────────────────────────────────────────────────
function Pic({ src, alt, cls = '' }) {
  return (
    <div className={`pic ${cls}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={e => {
          e.currentTarget.style.display = 'none';
          if (e.currentTarget.nextSibling) {
            e.currentTarget.nextSibling.style.display = 'grid';
          }
        }}
      />
      <div className="ph">
        RAYDAR visual<br />
        <small>Child safety ecosystem</small>
      </div>
    </div>
  );
}

// ─── Team Avatar Component ────────────────────────────────────────────────
function TeamAvatar({ src, name, isLead = false }) {
  const candidates = Array.isArray(src) ? src : [src].filter(Boolean);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [allFailed, setAllFailed] = useState(candidates.length === 0);

  const currentSrc = candidates[candidateIdx];

  const handleImgError = () => {
    if (candidateIdx + 1 < candidates.length) {
      setCandidateIdx(candidateIdx + 1);
    } else {
      setAllFailed(true);
    }
  };

  return (
    <div className={`avatar ${isLead ? 'pmAvatar' : 'teamAvatar'}`}>
      {!allFailed && currentSrc ? (
        <img
          src={currentSrc}
          alt={name}
          className={isLead ? 'pmPhotoImg' : 'teamPhotoImg'}
          onError={handleImgError}
        />
      ) : (
        <UserRound className={`avatarIcon ${isLead ? 'pmIcon' : ''}`} />
      )}
    </div>
  );
}

// ─── Navigation ────────────────────────────────────────────────────────────
function Nav() {
  const { t, go } = useLang();
  const [m, setM] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scroll = useCallback((id) => {
    setM(false);
    const p = window.location.pathname;
    if (p.includes('/waiting-list')) {
      go('/');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [go]);

  return (
    <nav className={scrolled ? 'scrolled' : ''}>
      <button className="brand" onClick={() => scroll('top')} aria-label="RAYDAR">
        <img src={IMAGE_ASSETS.logo} alt="RAYDAR" className="brandLogo" />
      </button>
      <div className={`links ${m ? 'open' : ''}`}>
        <button onClick={() => scroll('problem')}>{t.nav.problem}</button>
        <button onClick={() => scroll('solution')}>{t.nav.solution}</button>
        <button onClick={() => scroll('recognition')}>{t.nav.recognition}</button>
        <button onClick={() => scroll('team')}>{t.nav.team}</button>
        <button
          className="cta"
          id="nav-cta-btn"
          onClick={() => {
            setM(false);
            go('/waiting-list');
          }}
        >
          {t.nav.joinWaitlist} <ArrowRight size={16} />
        </button>
      </div>
      <button
        className="hamb"
        aria-label={t.nav.toggleMenu}
        onClick={() => setM(!m)}
      >
        {m ? <X /> : <Menu />}
      </button>
    </nav>
  );
}

// ─── Landing Page ──────────────────────────────────────────────────────────
function Landing() {
  const { t, go } = useLang();
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <>
      <ScrollProgress />
      <Nav />
      <main id="top">

        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section className="hero">
          <div className="heroCopy">
            <div className="eyebrow fade-up-1">{t.hero.eyebrow}</div>
            <h1 className="fade-up-2">
              {t.hero.titleLine1}<br />
              <em>{t.hero.titleLine2}</em>
            </h1>
            <p className="fade-up-3">
              {t.hero.description}
            </p>
            <div className="actions fade-up-4">
              <button
                id="hero-join-btn"
                className="primary"
                onClick={() => go('/waiting-list')}
              >
                {t.hero.joinBtn} <ArrowRight size={16} />
              </button>
              <a
                id="hero-discover-btn"
                href="https://presentation-project-eta.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="textBtn"
              >
                {t.hero.discoverBtn} <ExternalLink size={16} />
              </a>
            </div>
            <div className="proof fade-up-5">
              <span><ShieldCheck size={16} />{t.hero.proofProtection}</span>
              <span><MapPin size={16} />{t.hero.proofAfrica}</span>
            </div>
          </div>
          <div className="heroVisual">
            <Pic
              src={IMAGE_ASSETS.heroImage}
              alt={t.hero.altHero}
              cls="heroImg"
            />
            <div className="glow redGlow" />
            <div className="float">
              <b>{t.hero.floatStatus}</b>
              <small>{t.hero.floatSub}</small>
            </div>
          </div>
        </section>

        {/* ── TICKER ────────────────────────────────────────────────── */}
        <div className="ticker" aria-hidden>
          {t.ticker.map((item, idx) => (
            <React.Fragment key={idx}>
              <span>{item}</span>
              <i />
            </React.Fragment>
          ))}
        </div>

        {/* ── IMPACT STATS ──────────────────────────────────────────── */}
        <section className="statsRow">
          <Reveal animation="fade-up" delay={0}>
            <div className="statItem">
              <div className="statNum">
                <Counter to={t.stats.stat1.num} suffix={t.stats.stat1.suffix} />
              </div>
              <div className="statLabel">{t.stats.stat1.label}</div>
            </div>
          </Reveal>
          <Reveal animation="fade-up" delay={150}>
            <div className="statItem">
              <div className="statNum">
                <Counter to={t.stats.stat2.num} suffix={t.stats.stat2.suffix} />
              </div>
              <div className="statLabel">{t.stats.stat2.label}</div>
            </div>
          </Reveal>
          <Reveal animation="fade-up" delay={300}>
            <div className="statItem">
              <div className="statNum">
                <Counter to={t.stats.stat3.num} suffix={t.stats.stat3.suffix} />
              </div>
              <div className="statLabel">{t.stats.stat3.label}</div>
            </div>
          </Reveal>
        </section>

        {/* ── PROBLEM ───────────────────────────────────────────────── */}
        <section className="section" id="problem">
          <div className="label">{t.problem.label}</div>
          <div className="two">
            <Reveal animation="fade-right">
              <div>
                <h2>{t.problem.heading1}<br /><em>{t.problem.heading2}</em></h2>
                <p className="lead">
                  {t.problem.lead}
                </p>
                <div className="stats">
                  <b>{t.problem.stat1.num}<small>{t.problem.stat1.text}</small></b>
                  <b>{t.problem.stat2.num}<small>{t.problem.stat2.text}</small></b>
                  <b>{t.problem.stat3.num}<small>{t.problem.stat3.text}</small></b>
                </div>
              </div>
            </Reveal>
            <Reveal animation="fade-left" delay={200}>
              <Pic src={IMAGE_ASSETS.problemImage} alt={t.problem.altImage} />
            </Reveal>
          </div>
        </section>

        {/* ── SOLUTION OVERVIEW ─────────────────────────────────────── */}
        <section className="solution" id="solution">
          <Reveal animation="fade-up">
            <div className="center">
              <div className="label light">{t.solution.label}</div>
              <h2>{t.solution.heading1}<br /><em>{t.solution.heading2}</em></h2>
              <p>{t.solution.subheading}</p>
            </div>
          </Reveal>
          <div className="cards">
            <Reveal animation="fade-right" delay={150}>
              <article>
                <div className="phase">
                  <b>{t.solution.v1.badge}</b>
                  <small>{t.solution.v1.badgeSub}</small>
                </div>
                <h3>{t.solution.v1.title.split('\n').map((l, i) => <React.Fragment key={i}>{l}<br /></React.Fragment>)}</h3>
                <p>{t.solution.v1.description}</p>
                <button id="explore-v1-btn" onClick={() => scrollTo('v1')}>
                  {t.solution.v1.button} <ArrowRight size={16} />
                </button>
              </article>
            </Reveal>
            <Reveal animation="fade-left" delay={300}>
              <article className="dark">
                <div className="phase">
                  <b>{t.solution.v2.badge}</b>
                  <small>{t.solution.v2.badgeSub}</small>
                </div>
                <h3 style={{ color: '#ffffff' }}>
                  {t.solution.v2.title.split('\n').map((l, i) => <React.Fragment key={i}>{l}<br /></React.Fragment>)}
                </h3>
                <p>{t.solution.v2.description}</p>
                <button id="explore-v2-btn" onClick={() => scrollTo('v2')}>
                  {t.solution.v2.button} <ArrowRight size={16} />
                </button>
              </article>
            </Reveal>
          </div>
        </section>

        {/* ── V1 ────────────────────────────────────────────────────── */}
        <section className="section" id="v1">
          <div className="label">{t.v1Section.label}</div>
          <div className="two">
            <Reveal animation="fade-right">
              <div>
                <span className="pill">{t.v1Section.pill}</span>
                <h2>{t.v1Section.heading1}<br /><em>{t.v1Section.heading2}</em></h2>
                <p className="lead">
                  {t.v1Section.lead}
                </p>
              </div>
            </Reveal>
            <Reveal animation="fade-left" delay={200}>
              <div className="workflowViz">
                {t.v1Section.steps.map((step, idx) => (
                  <React.Fragment key={idx}>
                    <div className={`wfStep ${step.isMatch ? 'match' : ''}`}>
                      <div className={`wfBadge ${step.isMatch ? 'green' : 'purple'}`}>
                        {step.num}
                      </div>
                      <div className="wfContent">
                        <strong>{step.title}</strong>
                        <small>{step.desc}</small>
                      </div>
                      {step.badge && <span className="matchBadge">{step.badge}</span>}
                    </div>
                    {idx < t.v1Section.steps.length - 1 && <div className="wfArrow">↓</div>}
                  </React.Fragment>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── V2 ────────────────────────────────────────────────────── */}
        <section className="v2" id="v2">
          <div className="label light">{t.v2Section.label}</div>
          <div className="two">
            <Reveal animation="fade-right">
              <div>
                <span className="pill red">{t.v2Section.pill}</span>
                <h2>{t.v2Section.heading1}<br /><em>{t.v2Section.heading2}</em></h2>
                <p className="lead">
                  {t.v2Section.leadPrefix}
                  <strong style={{ color: 'var(--p2)' }}>{t.v2Section.leadTech}</strong>
                  {t.v2Section.leadSuffix}
                </p>
                <div className="v2Points">
                  {t.v2Section.points.map((pt, idx) => (
                    <div key={idx}>
                      <span className={`techTag ${pt.isRed ? 'red' : ''}`}>{pt.tag}</span>
                      <div>
                        <strong>{pt.title}</strong>
                        <small>{pt.desc}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal animation="fade-left" delay={200}>
              <Pic
                src={IMAGE_ASSETS.wearableImage}
                alt={t.v2Section.altImage}
                cls="wearable"
              />
            </Reveal>
          </div>
        </section>

        {/* ── ECOSYSTEM ─────────────────────────────────────────────── */}
        <section className="section">
          <Reveal animation="fade-up">
            <div className="center">
              <div className="label">{t.ecosystem.label}</div>
              <h2>{t.ecosystem.heading1}<br /><em>{t.ecosystem.heading2}</em></h2>
            </div>
          </Reveal>
          <div className="ecos">
            <Reveal animation="scale-in" delay={100}>
              <div>
                <HeartHandshake size={34} />
                <h3>{t.ecosystem.cards[0].title}</h3>
                <p>{t.ecosystem.cards[0].desc}</p>
              </div>
            </Reveal>
            <Reveal animation="scale-in" delay={250}>
              <div>
                <Users size={34} />
                <h3>{t.ecosystem.cards[1].title}</h3>
                <p>{t.ecosystem.cards[1].desc}</p>
              </div>
            </Reveal>
            <Reveal animation="scale-in" delay={400}>
              <div>
                <School size={34} />
                <h3>{t.ecosystem.cards[2].title}</h3>
                <p>{t.ecosystem.cards[2].desc}</p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── STORY / REAL-WORLD CONTEXT ────────────────────────────── */}
        <section className="section story">
          <div className="label">{t.story.label}</div>
          <div className="two">
            <Reveal animation="fade-right">
              <Pic src={IMAGE_ASSETS.fieldImage} alt={t.story.altImage} />
            </Reveal>
            <Reveal animation="fade-left" delay={200}>
              <div>
                <h2>{t.story.heading1}<br /><em>{t.story.heading2}</em></h2>
                <p className="lead">
                  {t.story.lead}
                </p>
                <div className="storyPoints">
                  <div><Cpu size={18} /><span>{t.story.points[0]}</span></div>
                  <div><MapPin size={18} /><span>{t.story.points[1]}</span></div>
                  <div><BellRing size={18} /><span>{t.story.points[2]}</span></div>
                  <div><ShieldCheck size={18} /><span>{t.story.points[3]}</span></div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── RECOGNITION & MILESTONES ──────────────────────────────── */}
        <section className="section recognition" id="recognition">
          <Reveal animation="fade-up">
            <div className="label">{t.recognition.label}</div>
            <div className="center">
              <h2>{t.recognition.heading1}<br /><em>{t.recognition.heading2}</em></h2>
              <p>{t.recognition.subheading}</p>
            </div>
          </Reveal>
          <div className="recognitionGrid">
            {t.recognition.events.map((ev, idx) => (
              <Reveal
                key={idx}
                animation={idx % 2 === 0 ? 'fade-right' : 'fade-left'}
                delay={150 * (idx + 1)}
              >
                <article className="eventCard">
                  <div className="eventPic">
                    <img src={IMAGE_ASSETS.eventImages[idx]} alt={ev.title} />
                    <span className="eventTag">{ev.tag}</span>
                  </div>
                  <div className="eventInfo">
                    <span className="eventMeta">{ev.meta}</span>
                    <h3>{ev.title}</h3>
                    <p>{ev.desc}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── TEAM ──────────────────────────────────────────────────── */}
        <section className="section team" id="team">
          <Reveal animation="fade-up">
            <div className="label">{t.team.label}</div>
            <div className="center">
              <h2>{t.team.heading1}<br /><em>{t.team.heading2}</em></h2>
              <p style={{ color: '#3d3745', fontWeight: 500 }}>
                {t.team.subheading}
              </p>
            </div>
          </Reveal>
          <div className="teamContainer">
            {/* Project Manager Card */}
            <Reveal animation="fade-up" delay={150}>
              <div className="pmSection">
                <div className="pmHeader">
                  <div className="pmLabel">{t.team.pmHeader}</div>
                  <span className="pmExecutiveTag">{t.team.pmTag}</span>
                </div>
                <article className="teamCard pmCard">
                  <TeamAvatar
                    src={TEAM_IMAGES.lead}
                    name={t.team.members.lead.name}
                    isLead
                  />
                  <div className="teamInfo pmTeamInfo">
                    <span className="teamRole pmRole">{t.team.members.lead.role}</span>
                    <h3 className="teamName pmName">{t.team.members.lead.name}</h3>
                    <p className="teamBio pmBio">{t.team.members.lead.bio}</p>
                    <div className="pmHighlights">
                      <div className="pmHighlightItem">
                        <ShieldCheck size={16} />
                        <span>{t.team.pmHighlights[0]}</span>
                      </div>
                      <div className="pmHighlightItem">
                        <Radio size={16} />
                        <span>{t.team.pmHighlights[1]}</span>
                      </div>
                      <div className="pmHighlightItem">
                        <HeartHandshake size={16} />
                        <span>{t.team.pmHighlights[2]}</span>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </Reveal>

            {/* Core Team */}
            <div className="coreTeamSection">
              <div className="coreTeamLabel">{t.team.coreLabel}</div>
              <div className="teamGrid">
                {t.team.members.core.map((m, i) => (
                  <Reveal
                    key={i}
                    animation={i % 2 === 0 ? 'fade-right' : 'fade-left'}
                    delay={250 + i * 150}
                  >
                    <article className="teamCard">
                      <TeamAvatar
                        src={TEAM_IMAGES.core[i]}
                        name={m.name}
                      />
                      <span className="teamRole">{m.role}</span>
                      <h3 className="teamName">{m.name}</h3>
                      <p className="teamBio">{m.bio}</p>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── WAIT CTA ──────────────────────────────────────────────── */}
        <Reveal animation="scale-in">
          <section className="waitCta">
            <div>
              <div className="waitCtaHeader">
                <img src={IMAGE_ASSETS.logo} alt="RAYDAR" className="waitCtaLogo" />
                <span className="eyebrow">{t.waitCta.eyebrow}</span>
              </div>
              <h2 style={{ color: '#ffffff' }}>{t.waitCta.heading}</h2>
              <p>{t.waitCta.subheading}</p>
            </div>
            <button
              id="cta-join-btn"
              className="primary"
              onClick={() => go('/waiting-list')}
            >
              {t.waitCta.button} <ArrowRight size={16} />
            </button>
          </section>
        </Reveal>
      </main>

      <footer>
        <div className="footerBrand">
          <img src={IMAGE_ASSETS.logo} alt="RAYDAR" className="footerLogo" />
        </div>
        <span>{t.footer.tagline}</span>
        <span>{t.footer.credit}</span>
      </footer>
    </>
  );
}

// ─── Waiting List Page ─────────────────────────────────────────────────────
function WaitingList() {
  const { t, go } = useLang();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    whatsappNumber: '',
    interestedAs: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      await submitToWaitlist(formData);
      setFormData({
        fullName: '',
        email: '',
        phoneNumber: '',
        whatsappNumber: '',
        interestedAs: '',
      });
      setDone(true);
    } catch (err) {
      console.error('Waitlist submission error:', err);
      setErrorMsg(err.message || t.waitlistPage.form.errorFallback);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ScrollProgress />
      <Nav />
      <main className="waitingPage">
        <div className="waitingVisual">
          <div className="eyebrow">{t.waitlistPage.eyebrow}</div>
          <h1>
            {t.waitlistPage.heading1}<br />
            <em>{t.waitlistPage.heading2}</em><br />
            {t.waitlistPage.heading3}
          </h1>
          <p className="lead">
            {t.waitlistPage.lead}
          </p>
          <div className="waitingImageContainer">
            <img
              src={IMAGE_ASSETS.waitingListImage}
              alt="RAYDAR Child Safety & Family Protection"
            />
            <div className="waitingImageBadge">
              <ShieldCheck className="pulseIcon" style={{ color: 'var(--p2)' }} size={16} />
              <span>{t.waitlistPage.badgeProtection}</span>
            </div>
          </div>
          <div className="miniProof">
            <span><ShieldCheck size={15} />{t.waitlistPage.proof1}</span>
            <span><Radio size={15} />{t.waitlistPage.proof2}</span>
            <span><HeartHandshake size={15} />{t.waitlistPage.proof3}</span>
          </div>
        </div>

        <div className="formCard">
          {done ? (
            <div className="successBig">
              <Check className="successCheck" size={48} />
              <h2>{t.waitlistPage.form.success.title}</h2>
              <p>{t.waitlistPage.form.success.desc}</p>
              <button
                id="back-home-btn"
                className="primary"
                onClick={() => go('/')}
              >
                <ArrowLeft size={16} /> {t.waitlistPage.form.success.backHomeBtn}
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <h2>{t.waitlistPage.form.title}</h2>
              <p>{t.waitlistPage.form.subtitle}</p>
              <label>
                {t.waitlistPage.form.fullNameLabel}
                <input
                  id="field-name"
                  required
                  placeholder={t.waitlistPage.form.fullNamePlaceholder}
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                />
              </label>
              <label>
                {t.waitlistPage.form.emailLabel}
                <input
                  id="field-email"
                  type="email"
                  required
                  placeholder={t.waitlistPage.form.emailPlaceholder}
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </label>
              <label>
                {t.waitlistPage.form.phoneLabel}
                <input
                  id="field-phone"
                  type="tel"
                  required
                  placeholder={t.waitlistPage.form.phonePlaceholder}
                  value={formData.phoneNumber}
                  onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                />
              </label>
              <label>
                {t.waitlistPage.form.whatsappLabel}
                <input
                  id="field-whatsapp"
                  type="tel"
                  required
                  placeholder={t.waitlistPage.form.whatsappPlaceholder}
                  value={formData.whatsappNumber}
                  onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                />
              </label>
              <label>
                {t.waitlistPage.form.roleLabel}
                <select
                  id="field-role"
                  required
                  value={formData.interestedAs}
                  onChange={e => setFormData({ ...formData, interestedAs: e.target.value })}
                >
                  <option value="" disabled>{t.waitlistPage.form.rolePlaceholder}</option>
                  <option value="parent_guardian">{t.waitlistPage.form.roles.parent_guardian}</option>
                  <option value="school">{t.waitlistPage.form.roles.school}</option>
                  <option value="organization">{t.waitlistPage.form.roles.organization}</option>
                  <option value="partner">{t.waitlistPage.form.roles.partner}</option>
                  <option value="investor">{t.waitlistPage.form.roles.investor}</option>
                  <option value="other">{t.waitlistPage.form.roles.other}</option>
                </select>
              </label>
              {errorMsg && (
                <div
                  id="waitlist-error-msg"
                  style={{
                    color: 'var(--red)',
                    backgroundColor: 'var(--redSoft)',
                    border: '1px solid rgba(232, 63, 72, 0.25)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    fontSize: '13px',
                    fontWeight: 600,
                    textAlign: 'center',
                    lineHeight: 1.4,
                  }}
                >
                  {errorMsg}
                </div>
              )}
              <button
                id="submit-waitlist-btn"
                className="primary full"
                disabled={submitting}
              >
                {submitting ? t.waitlistPage.form.submittingBtn : (
                  <>{t.waitlistPage.form.submitBtn} <ArrowRight size={16} /></>
                )}
              </button>
              <small>
                <Clock size={14} />{t.waitlistPage.form.privacyNote}
              </small>
            </form>
          )}
        </div>
      </main>

      <footer>
        <div className="footerBrand">
          <img src={IMAGE_ASSETS.logo} alt="RAYDAR" className="footerLogo" />
        </div>
        <span>{t.footer.tagline}</span>
        <button className="back" onClick={() => go('/')}>
          {t.footer.backBtn}
        </button>
      </footer>
    </>
  );
}

// ─── Root App ──────────────────────────────────────────────────────────────
function App() {
  const [path, setPath] = useState(window.location.pathname);

  // Determine initial language:
  // 1. From URL prefix (/fr or /en)
  // 2. From localStorage
  // 3. Null if first-time visitor on root '/'
  const initialLangFromUrl = window.location.pathname.startsWith('/fr')
    ? 'fr'
    : window.location.pathname.startsWith('/en')
      ? 'en'
      : null;

  const storedLang = getStoredLanguage();

  const [lang, setLangState] = useState(() => {
    return initialLangFromUrl || storedLang || DEFAULT_LOCALE;
  });

  // Controls whether the full-screen Language Gate is visible
  // Only shown on first visit if no language has been saved and URL does not explicitly specify one
  const [showGate, setShowGate] = useState(() => {
    return !initialLangFromUrl && !storedLang && window.location.pathname === '/';
  });

  // Keep path updated with browser navigation
  useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      setPath(currentPath);
      if (currentPath.startsWith('/fr')) {
        setLangState('fr');
        setStoredLanguage('fr');
        applyLocaleMetadata('fr');
      } else if (currentPath.startsWith('/en')) {
        setLangState('en');
        setStoredLanguage('en');
        applyLocaleMetadata('en');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync document metadata whenever language changes
  useEffect(() => {
    applyLocaleMetadata(lang);
  }, [lang]);

  // Set language & persist
  const setLanguage = useCallback((newLang) => {
    if (newLang !== 'en' && newLang !== 'fr') return;
    setLangState(newLang);
    setStoredLanguage(newLang);
    applyLocaleMetadata(newLang);
  }, []);

  // Toggle between English and French seamlessly
  const toggleLanguage = useCallback((targetLang) => {
    const nextLang = targetLang || (lang === 'en' ? 'fr' : 'en');
    setLanguage(nextLang);

    // Seamlessly update URL without losing current section or sub-view
    const currentPath = window.location.pathname;
    let newPath = currentPath;

    if (currentPath.startsWith('/en') || currentPath.startsWith('/fr')) {
      newPath = currentPath.replace(/^\/(en|fr)/, `/${nextLang}`);
    } else if (currentPath === '/waiting-list') {
      newPath = `/${nextLang}/waiting-list`;
    } else if (currentPath === '/') {
      newPath = `/${nextLang}`;
    }

    if (newPath !== currentPath) {
      window.history.pushState({}, '', newPath);
      setPath(newPath);
    }
  }, [lang, setLanguage]);

  // Client-side router helper
  const go = useCallback((targetPath) => {
    let resolved = targetPath;
    // Prefix with current language for clean routing if needed
    if (targetPath === '/waiting-list') {
      resolved = `/${lang}/waiting-list`;
    } else if (targetPath === '/') {
      resolved = `/${lang}`;
    }
    window.history.pushState({}, '', resolved);
    setPath(resolved);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [lang]);

  // Handler when visitor selects language on Gate
  const handleSelectLanguage = (selectedLang) => {
    setLanguage(selectedLang);
    setShowGate(false);
    const targetPath = `/${selectedLang}`;
    window.history.replaceState({}, '', targetPath);
    setPath(targetPath);
  };

  const t = LOCALES[lang] || LOCALES.en;

  const isWaitlist =
    path === '/waiting-list' ||
    path === '/en/waiting-list' ||
    path === '/fr/waiting-list' ||
    path.endsWith('/waiting-list');

  return (
    <LangContext.Provider value={{ lang, t, setLanguage, toggleLanguage, go }}>
      {showGate ? (
        <LanguageGate
          onSelectLanguage={handleSelectLanguage}
          bgImage={IMAGE_ASSETS.heroImage}
        />
      ) : (
        <>
          {isWaitlist ? <WaitingList /> : <Landing />}
          {/* Persistent Floating Language Switcher */}
          <LanguageSwitcher
            currentLang={lang}
            onToggle={toggleLanguage}
          />
        </>
      )}
    </LangContext.Provider>
  );
}

createRoot(document.getElementById('root')).render(<App />);
