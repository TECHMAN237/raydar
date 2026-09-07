import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export function LanguageGate({ onSelectLanguage, bgImage = '/assets/images/hero-child-safety-sos.jpg' }) {
  return (
    <div className="languageGate" role="dialog" aria-modal="true" aria-labelledby="gate-heading">
      {/* ── Cinematic Blurred Contextual Background ── */}
      <div className="gateBgWrapper" aria-hidden="true">
        <img
          src={bgImage}
          alt="RAYDAR Child Safety & Community Protection"
          className="gateBgImage"
        />
        {/* Subtle dark overlay (~36% opacity) preserving visibility of context */}
        <div className="gateOverlay" />
        {/* Subtle ambient RAYDAR purple brand glow */}
        <div className="gateGlow" />
      </div>

      {/* ── Centered Language Card ── */}
      <div className="gateCardWrapper">
        <div className="gateCard">
          {/* Brand & Eyebrow */}
          <div className="gateHeader">
            <div className="gateLogoBadge">
              <img src="/assets/raydar.png" alt="RAYDAR Logo" className="gateLogoImg" />
            </div>
            <div className="gateEyebrow">
              <span className="liveDot" />
              <span>SMART CHILD SAFETY ECOSYSTEM</span>
            </div>
            <div className="gateBrand">
              RAYDAR<span>.</span>
            </div>
          </div>

          {/* Headings */}
          <h1 id="gate-heading" className="gateTitle">
            How would you like to continue?
          </h1>
          <p className="gateSubtitle">
            Choose your preferred language to explore RAYDAR.
          </p>

          {/* Language Selection Buttons */}
          <div className="gateButtons">
            <button
              id="btn-lang-en"
              type="button"
              className="gateBtn gateBtnEn"
              onClick={() => onSelectLanguage('en')}
              autoFocus
            >
              <div className="gateBtnLeft">
                <span className="gateFlag" aria-hidden="true">🇬🇧</span>
                <div className="gateBtnText">
                  <span className="gateBtnMain">Continue in English</span>
                  <span className="gateBtnSub">Default reference version</span>
                </div>
              </div>
              <ArrowRight className="gateBtnArrow" size={18} />
            </button>

            <button
              id="btn-lang-fr"
              type="button"
              className="gateBtn gateBtnFr"
              onClick={() => onSelectLanguage('fr')}
            >
              <div className="gateBtnLeft">
                <span className="gateFlag" aria-hidden="true">🇫🇷</span>
                <div className="gateBtnText">
                  <span className="gateBtnMain">Continuer en français</span>
                  <span className="gateBtnSub">Version française intégrale</span>
                </div>
              </div>
              <ArrowRight className="gateBtnArrow" size={18} />
            </button>
          </div>

          {/* Footer reassurance */}
          <div className="gateFooter">
            <div className="gateMission">
              <ShieldCheck size={15} />
              <span>Protéger chaque enfant • Protecting every child</span>
            </div>
            <small className="gateHint">
              You can switch between EN and FR at any time using the floating switcher.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
