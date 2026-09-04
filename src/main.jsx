import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight, ShieldCheck, MapPin, BellRing, Radio,
  Users, School, HeartHandshake, Check, Menu, X,
  Award, UserRound, Clock, ArrowLeft, Smartphone, Cpu
} from 'lucide-react';
import './styles.css';
import { submitToWaitlist } from './supabase.js';

// ─── Centralized Image Configuration ───────────────────────────────────────
// Replace paths here to update images site-wide without touching components
const IMAGE_ASSETS = {
  heroImage:        '/assets/images/hero-child-safety-sos.jpg',   // Hero — child raising wrist with wearable facing bad actors
  problemImage:     '/assets/images/problem-community.png',   // Problem — African family/community
  wearableImage:    '/assets/images/raydar-wearable.png',     // V2 — digital safety watch
  waitingListImage: '/assets/images/hero-child-safety.png',   // Waiting list — family/hope visual
  fieldImage:       '/assets/field-activity.jpg',             // Section 06 — school children outdoors
  leadImage:        '',                                       // Steeve Zali photo (e.g. '/assets/images/steeve-zali.jpg')
  eventImages: [
    '/assets/images/project-event-1.png',
    '/assets/images/project-event-2.jpg',
  ],
};

// ─── Centralized Team Data ─────────────────────────────────────────────────
// Edit names, roles, and bios here — they'll propagate automatically to the UI
const TEAM_MEMBERS = {
  lead: {
    role:   'PROJECT MANAGER & VISIONARY',
    name:   'STEEVE ZALI',
    image:  '/assets/STEEVE ZALI.jpeg',
    bio:    'Driving the core vision, architecture, and community-safety ecosystem development behind RAYDAR to ensure every child is protected.',
  },
  core: [
    {
      role:  'ENGINEERING LEAD',
      name:  'YONTA BERIOT',
      image: '/assets/YONTA BERIOT.jpeg',
      bio:   'Specializing in low-power wearable hardware, secure sensor arrays, and offline-resilient communication.',
    },
    {
      role:  'PARTNERSHIPS LEAD',
      name:  'STEVE FRANCK',
      image: ['/assets/STEVE FRANCK.jpeg', '/assets/STEVE FRANCK.jpg', '/assets/STEVE FRANCK.png'],
      bio:   'Building critical bridges with African schools, local authorities, and community child-protection networks.',
    },
    {
      role:  'BACKEND LEAD',
      name:  'TANTO EINSTEIN',
      image: '/assets/TANTO EINSTEIN.png',
      bio:   'Developing secure offline-first data pipelines and robust emergency alert dispatch systems.',
    },
    {
      role:  'PRESENTATION & COMMUNICATION',
      name:  'SINEFO JOY',
      image: ['/assets/SINEFO JOY.jpeg', '/assets/SINEFO JOY.jpg', '/assets/SINEFO JOY.png'],
      bio:   'Managing presentations, public relations, and clear communication channels for community outreach and stakeholder engagement.',
    },
  ],
};

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
          e.currentTarget.nextSibling.style.display = 'grid';
        }}
      />
      <div className="ph">
        RAYDAR visual<br />
        <small>Replace with your own image</small>
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

// ─── Client-side Router Helper ─────────────────────────────────────────────
function go(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Navigation ────────────────────────────────────────────────────────────
function Nav() {
  const [m, setM] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scroll = useCallback(id => {
    setM(false);
    if (location.pathname !== '/') go('/');
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 40);
  }, []);

  return (
    <nav className={scrolled ? 'scrolled' : ''}>
      <button className="brand" onClick={() => scroll('top')}>RAYDAR<span>.</span></button>
      <div className={`links ${m ? 'open' : ''}`}>
        <button onClick={() => scroll('problem')}>Problem</button>
        <button onClick={() => scroll('solution')}>Solution</button>
        <button onClick={() => scroll('recognition')}>Recognition</button>
        <button onClick={() => scroll('team')}>Team</button>
        <button className="cta" id="nav-cta-btn" onClick={() => go('/waiting-list')}>
          Join Waiting List <ArrowRight />
        </button>
      </div>
      <button className="hamb" aria-label="Toggle menu" onClick={() => setM(!m)}>
        {m ? <X /> : <Menu />}
      </button>
    </nav>
  );
}

// ─── Landing Page ──────────────────────────────────────────────────────────
function Landing() {
  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  return (
    <>
      <ScrollProgress />
      <Nav />
      <main id="top">

        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section className="hero">
          <div className="heroCopy">
            <div className="eyebrow fade-up-1">● SMART CHILD SAFETY ECOSYSTEM</div>
            <h1 className="fade-up-2">
              Every child deserves<br /><em>to come home safe.</em>
            </h1>
            <p className="fade-up-3">
              RAYDAR is a connected child-safety ecosystem built for African families,
              communities, and organizations — so no parent ever has to face that silence alone.
            </p>
            <div className="actions fade-up-4">
              <button id="hero-join-btn" className="primary" onClick={() => go('/waiting-list')}>
                Join Waiting List <ArrowRight />
              </button>
              <button className="textBtn" onClick={() => scrollTo('solution')}>
                Discover RAYDAR
              </button>
            </div>
            <div className="proof fade-up-5">
              <span><ShieldCheck />Child protection</span>
              <span><MapPin />Built for African communities</span>
            </div>
          </div>
          <div className="heroVisual">
            <Pic src={IMAGE_ASSETS.heroImage} alt="African child raising wrist with RAYDAR safety wearable" cls="heroImg" />
            <div className="glow redGlow" />
            <div className="float">
              <b>Child protected. 🟣</b>
              <small>SOS active • RAYDAR ecosystem</small>
            </div>
          </div>
        </section>

        {/* ── TICKER ────────────────────────────────────────────────── */}
        <div className="ticker" aria-hidden>
          <span>CHILD SAFETY</span><i />
          <span>SMART WEARABLES</span><i />
          <span>AI-POWERED</span><i />
          <span>COMMUNITY RESPONSE</span><i />
          <span>GPS TRACKING</span><i />
          <span>SOS ALERTS</span>
        </div>

        {/* ── IMPACT STATS ──────────────────────────────────────────── */}
        <section className="statsRow">
          <Reveal animation="fade-up" delay={0}>
            <div className="statItem">
              <div className="statNum"><Counter to={1} suffix="M+" />  </div>
              <div className="statLabel">Children at risk yearly in sub-Saharan Africa</div>
            </div>
          </Reveal>
          <Reveal animation="fade-up" delay={150}>
            <div className="statItem">
              <div className="statNum"><Counter to={72} suffix="h" /></div>
              <div className="statLabel">Critical window for missing child cases</div>
            </div>
          </Reveal>
          <Reveal animation="fade-up" delay={300}>
            <div className="statItem">
              <div className="statNum"><Counter to={2} suffix=" phases" /></div>
              <div className="statLabel">V1 platform + V2 smart wearable roadmap</div>
            </div>
          </Reveal>
        </section>

        {/* ── PROBLEM ───────────────────────────────────────────────── */}
        <section className="section" id="problem">
          <div className="label">01 — THE PROBLEM</div>
          <div className="two">
            <Reveal animation="fade-right">
              <div>
                <h2>When a child goes missing,<br /><em>every second matters.</em></h2>
                <p className="lead">
                  Families need faster ways to report, communities need better access to reliable
                  information, and organizations need stronger tools for protecting children during
                  everyday activities.
                </p>
                <div className="stats">
                  <b>01<small>Report</small></b>
                  <b>02<small>Alert</small></b>
                  <b>03<small>Respond</small></b>
                </div>
              </div>
            </Reveal>
            <Reveal animation="fade-left" delay={200}>
              <Pic src={IMAGE_ASSETS.problemImage} alt="African family concerned about child safety" />
            </Reveal>
          </div>
        </section>

        {/* ── SOLUTION OVERVIEW ─────────────────────────────────────── */}
        <section className="solution" id="solution">
          <Reveal animation="fade-up">
            <div className="center">
              <div className="label light">02 — OUR SOLUTION</div>
              <h2>Two steps toward<br /><em>safer childhoods.</em></h2>
              <p>Start with a trusted reporting platform. Build toward intelligent, connected protection.</p>
            </div>
          </Reveal>
          <div className="cards">
            <Reveal animation="fade-right" delay={150}>
              <article>
                <div className="phase"><b>V1</b><small>PLATFORM</small></div>
                <h3>Missing &amp; Found<br />Report System</h3>
                <p>Centralized reporting, verification, alerts and community visibility for missing and found child cases.</p>
                <button id="explore-v1-btn" onClick={() => scrollTo('v1')}>Explore V1 <ArrowRight /></button>
              </article>
            </Reveal>
            <Reveal animation="fade-left" delay={300}>
              <article className="dark">
                <div className="phase"><b>V2</b><small>COMING SOON</small></div>
                <h3 style={{ color: '#ffffff' }}>Smart Wearable<br />Device</h3>
                <p>A discreet digital wearable adding GPS, SOS, and an AI-powered safety layer.</p>
                <button id="explore-v2-btn" onClick={() => scrollTo('v2')}>Explore V2 <ArrowRight /></button>
              </article>
            </Reveal>
          </div>
        </section>

        {/* ── V1 ────────────────────────────────────────────────────── */}
        <section className="section" id="v1">
          <div className="label">03 — V1</div>
          <div className="two">
            <Reveal animation="fade-right">
              <div>
                <span className="pill">MISSING &amp; FOUND REPORT SYSTEM</span>
                <h2>Make the first response<br /><em>faster.</em></h2>
                <p className="lead">
                  A practical digital foundation for the critical first minutes after a child is reported missing or found.
                </p>
              </div>
            </Reveal>
            <Reveal animation="fade-left" delay={200}>
              <div className="workflowViz">
                <div className="wfStep">
                  <div className="wfBadge purple">01</div>
                  <div className="wfContent">
                    <strong>Report</strong>
                    <small>Parent submits child's name, photo, age, description &amp; last known location.</small>
                  </div>
                </div>
                <div className="wfArrow">↓</div>
                <div className="wfStep">
                  <div className="wfBadge purple">02</div>
                  <div className="wfContent">
                    <strong>Verify</strong>
                    <small>Reporter uploads proof of relationship or authority concerning the child.</small>
                  </div>
                </div>
                <div className="wfArrow">↓</div>
                <div className="wfStep">
                  <div className="wfBadge purple">03</div>
                  <div className="wfContent">
                    <strong>Admin Review</strong>
                    <small>Admins review submitted information, documents, and report status.</small>
                  </div>
                </div>
                <div className="wfArrow">↓</div>
                <div className="wfStep match">
                  <div className="wfBadge green">✓</div>
                  <div className="wfContent">
                    <strong>Match Found</strong>
                    <small>Missing report is linked to a Found report — family is reunited.</small>
                  </div>
                  <span className="matchBadge">MATCH</span>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── V2 ────────────────────────────────────────────────────── */}
        <section className="v2" id="v2">
          <div className="label light">04 — V2</div>
          <div className="two">
            <Reveal animation="fade-right">
              <div>
                <span className="pill red">COMING SOON</span>
                <h2>Protection that<br /><em>stays connected.</em></h2>
                <p className="lead">A smart digital safety wearable using <strong style={{color:'var(--p2)'}}>GPS · GSM · SOS · IoT</strong> — designed to protect children even without internet access.</p>
                <div className="v2Points">
                  <div><span className="techTag">GPS</span>
                    <div><strong>Real-Time Location Tracking</strong>
                    <small>Pinpoint the child's location at any time — shared securely with authorized guardians.</small></div>
                  </div>
                  <div><span className="techTag red">SOS</span>
                    <div><strong>Emergency Alert Button</strong>
                    <small>One press sends an instant emergency signal with location to guardians and the RAYDAR network.</small></div>
                  </div>
                  <div><span className="techTag">IoT</span>
                    <div><strong>Offline-Capable Safety</strong>
                    <small>Critical SOS and location functions remain active even without internet or Wi-Fi connectivity.</small></div>
                  </div>
                </div>
              </div>
            </Reveal>
            <Reveal animation="fade-left" delay={200}>
              <Pic src={IMAGE_ASSETS.wearableImage} alt="RAYDAR wearable concept device" cls="wearable" />
            </Reveal>
          </div>
        </section>

        {/* ── ECOSYSTEM ─────────────────────────────────────────────── */}
        <section className="section">
          <Reveal animation="fade-up">
            <div className="center">
              <div className="label">05 — THE ECOSYSTEM</div>
              <h2>Built around the people<br /><em>who protect children.</em></h2>
            </div>
          </Reveal>
          <div className="ecos">
            <Reveal animation="scale-in" delay={100}>
              <div>
                <HeartHandshake />
                <h3>Families</h3>
                <p>Parents and guardians who need a faster safety response when their child is missing or at risk.</p>
              </div>
            </Reveal>
            <Reveal animation="scale-in" delay={250}>
              <div>
                <Users />
                <h3>Communities</h3>
                <p>People who can help report and respond to child-safety situations in their neighborhoods.</p>
              </div>
            </Reveal>
            <Reveal animation="scale-in" delay={400}>
              <div>
                <School />
                <h3>Organizations</h3>
                <p>Schools, youth groups, churches, camps, and activity organizers protecting children beyond the classroom.</p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── STORY / REAL-WORLD CONTEXT ────────────────────────────── */}
        <section className="section story">
          <div className="label">06 — REAL-WORLD CONTEXT</div>
          <div className="two">
            <Reveal animation="fade-right">
              <Pic src={IMAGE_ASSETS.fieldImage} alt="Children preparing for an outdoor field trip" />
            </Reveal>
            <Reveal animation="fade-left" delay={200}>
              <div>
                <h2>Protection beyond<br /><em>the school gate.</em></h2>
                <p className="lead">
                  Excursions, camps, sports events — the moments children are furthest from home
                  are often the most vulnerable. RAYDAR is designed precisely for those moments.
                </p>
                <div className="storyPoints">
                  <div><Cpu /><span>Works offline — no Wi-Fi required</span></div>
                  <div><MapPin /><span>Geo-tagged incident reports</span></div>
                  <div><BellRing /><span>Instant community-wide alerts</span></div>
                  <div><ShieldCheck /><span>Built for real African environments</span></div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── RECOGNITION & MILESTONES ──────────────────────────────── */}
        <section className="section recognition" id="recognition">
          <Reveal animation="fade-up">
            <div className="label">07 — RECOGNITION &amp; MILESTONES</div>
            <div className="center">
              <h2>Project Journey &amp;<br /><em>Recognition.</em></h2>
              <p>Showcasing our presentations, milestones, and hackathon participation details.</p>
            </div>
          </Reveal>
          <div className="recognitionGrid">
            <Reveal animation="fade-right" delay={150}>
              <article className="eventCard">
                <div className="eventPic">
                  <img src={IMAGE_ASSETS.eventImages[0]} alt="Project Milestone Event 1" />
                  <span className="eventTag">Milestone 01</span>
                </div>
                <div className="eventInfo">
                  <span className="eventMeta">17, August 2026 • PLAYCE YAOUNDE</span>
                  <h3>Presentation &amp; Pitch Event</h3>
                  <p>
                    Presented at the AFRICAN SCIENCE WEEK organised by AIMS (African Institute for Mathematical Sciences), this project explores an innovative technology-driven solution to address child disappearances, combining smart safety mechanisms with rapid response and identification to help protect children and support families.
                  </p>
                </div>
              </article>
            </Reveal>
            <Reveal animation="fade-left" delay={300}>
              <article className="eventCard">
                <div className="eventPic">
                  <img src={IMAGE_ASSETS.eventImages[1]} alt="Project Milestone Event 2" />
                  <span className="eventTag">Milestone 02</span>
                </div>
                <div className="eventInfo">
                  <span className="eventMeta">24, june2026 • FAYA HOTEL, DOUALAr</span>
                  <h3>Award &amp; Competition Recognition</h3>
                  <p>
                    Presented  at Carrefour Market Cameroon, this project highlighted an innovative solution designed to address real-world challenges through technology and creativity. The initiative was recognized with a special prize awarded
                     by PLAYCE CAMEROON, celebrating the project's potential and innovative approach.
                  </p>
                </div>
              </article>
            </Reveal>
          </div>
        </section>

        {/* ── TEAM ──────────────────────────────────────────────────── */}
        <section className="section team" id="team">
          <Reveal animation="fade-up">
            <div className="label">08 — THE TEAM</div>
            <div className="center">
              <h2>The minds turning<br /><em>RAYDAR into reality.</em></h2>
              <p style={{ color: '#3d3745', fontWeight: 500 }}>A multidisciplinary team dedicated to child safety and community protection.</p>
            </div>
          </Reveal>
          <div className="teamContainer">
            {/* Project Manager — Prominent Card */}
            <Reveal animation="fade-up" delay={150}>
              <div className="pmSection">
                <div className="pmHeader">
                  <div className="pmLabel">★ PROJECT LEADERSHIP &amp; VISION</div>
                  <span className="pmExecutiveTag">Founder &amp; Project Lead</span>
                </div>
                <article className="teamCard pmCard">
                  <TeamAvatar src={TEAM_MEMBERS.lead.image} name={TEAM_MEMBERS.lead.name} isLead />
                  <div className="teamInfo pmTeamInfo">
                    <span className="teamRole pmRole">{TEAM_MEMBERS.lead.role}</span>
                    <h3 className="teamName pmName">{TEAM_MEMBERS.lead.name}</h3>
                    <p className="teamBio pmBio">{TEAM_MEMBERS.lead.bio}</p>
                    <div className="pmHighlights">
                      <div className="pmHighlightItem">
                        <ShieldCheck size={16} />
                        <span>Architecture Système &amp; Sécurité</span>
                      </div>
                      <div className="pmHighlightItem">
                        <Radio size={16} />
                        <span>Stratégie Wearable &amp; IoT</span>
                      </div>
                      <div className="pmHighlightItem">
                        <HeartHandshake size={16} />
                        <span>Protection Communautaire</span>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </Reveal>
            {/* Core Team */}
            <div className="coreTeamSection">
              <div className="coreTeamLabel">CORE TEAM</div>
              <div className="teamGrid">
                {TEAM_MEMBERS.core.map((m, i) => (
                  <Reveal key={i} animation={i % 2 === 0 ? 'fade-right' : 'fade-left'} delay={250 + i * 150}>
                    <article className="teamCard">
                      <TeamAvatar src={m.image} name={m.name} />
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
              <span className="eyebrow">RAYDAR</span>
              <h2 style={{ color: '#ffffff' }}>Help protect the next generation.</h2>
              <p>Be among the first families, schools, and communities to access RAYDAR.</p>
            </div>
            <button id="cta-join-btn" className="primary" onClick={() => go('/waiting-list')}>
              Join Waiting List <ArrowRight />
            </button>
          </section>
        </Reveal>
      </main>

      <footer>
        <b>RAYDAR<span>.</span></b>
        <span>Smart Child Safety Ecosystem</span>
        <span>Built by TekMen Revolution</span>
      </footer>
    </>
  );
}

// ─── Waiting List Page ─────────────────────────────────────────────────────
function WaitingList() {
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

  const submit = async e => {
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
      setErrorMsg(err.message || 'Unable to submit your registration. Please try again.');
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
          <div className="eyebrow">● RAYDAR EARLY ACCESS</div>
          <h1>The future of<br /><em>child safety</em><br />starts here.</h1>
          <p className="lead">
            Be part of the RAYDAR journey from the beginning — early access for families,
            communities, schools, and organizations who believe every child deserves protection.
          </p>
          <div className="waitingImageContainer">
            <img src={IMAGE_ASSETS.waitingListImage} alt="African child and family — RAYDAR protection" />
            <div className="waitingImageBadge">
              <ShieldCheck className="pulseIcon" style={{color: 'var(--p2)'}}/>
              <span>RAYDAR Protection</span>
            </div>
          </div>
          <div className="miniProof">
            <span><ShieldCheck />Child protection</span>
            <span><Radio />V1 + V2 roadmap</span>
            <span><HeartHandshake />Built by TekMen Revolution</span>
          </div>
        </div>

        <div className="formCard">
          {done ? (
            <div className="successBig">
              <Check className="successCheck" />
              <h2>You're on the list.</h2>
              <p>Thank you for joining. We'll keep you updated as RAYDAR moves forward.</p>
              <button id="back-home-btn" className="primary" onClick={() => go('/')}>
                <ArrowLeft /> Back to website
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <h2>Be among the first.</h2>
              <p>Join the RAYDAR waiting list — early access to the next generation of child safety technology.</p>
              <label>
                Full Name
                <input
                  id="field-name"
                  required
                  placeholder="Your full name"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                />
              </label>
              <label>
                Email Address
                <input
                  id="field-email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </label>
              <label>
                Phone Number
                <input
                  id="field-phone"
                  type="tel"
                  required
                  placeholder="+237 ... or international phone"
                  value={formData.phoneNumber}
                  onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                />
              </label>
              <label>
                WhatsApp Phone Number
                <input
                  id="field-whatsapp"
                  type="tel"
                  required
                  placeholder="+237 ... WhatsApp number"
                  value={formData.whatsappNumber}
                  onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                />
              </label>
              <label>
                I'm interested as
                <select
                  id="field-role"
                  required
                  value={formData.interestedAs}
                  onChange={e => setFormData({ ...formData, interestedAs: e.target.value })}
                >
                  <option value="" disabled>Select your role</option>
                  <option value="parent_guardian">Parent / Guardian</option>
                  <option value="school">School</option>
                  <option value="organization">Organization / NGO</option>
                  <option value="partner">Partner</option>
                  <option value="investor">Investor</option>
                  <option value="other">Other</option>
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
              <button id="submit-waitlist-btn" className="primary full" disabled={submitting}>
                {submitting ? 'Securing Spot...' : <>Secure My Spot <ArrowRight /></>}
              </button>
              <small><Clock />Early access only. No spam. Your data stays private and secure.</small>
            </form>
          )}
        </div>
      </main>

      <footer>
        <b>RAYDAR<span>.</span></b>
        <span>Smart Child Safety Ecosystem</span>
        <button className="back" onClick={() => go('/')}>← Back to website</button>
      </footer>
    </>
  );
}

// ─── Root App ──────────────────────────────────────────────────────────────
function App() {
  const [path, setPath] = useState(location.pathname);
  useEffect(() => {
    const h = () => setPath(location.pathname);
    addEventListener('popstate', h);
    return () => removeEventListener('popstate', h);
  }, []);
  return path === '/waiting-list' ? <WaitingList /> : <Landing />;
}

createRoot(document.getElementById('root')).render(<App />);
