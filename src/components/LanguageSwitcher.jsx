import React from 'react';
import { Globe } from 'lucide-react';

export function LanguageSwitcher({ currentLang, onToggle }) {
  const isEn = currentLang === 'en';
  const targetLang = isEn ? 'fr' : 'en';
  const targetLabel = isEn ? 'Continuer en français' : 'Continue in English';
  const displayCode = isEn ? 'FR' : 'EN';
  const displayFlag = isEn ? '🇫🇷' : '🇬🇧';

  return (
    <aside className="floatingLangWrapper" aria-label="Language Switcher">
      <button
        id="floating-lang-toggle-btn"
        type="button"
        className="floatingLangBtn"
        onClick={() => onToggle(targetLang)}
        aria-label={targetLabel}
        title={targetLabel}
      >
        <span className="langGlobe" aria-hidden="true">
          <Globe size={15} />
        </span>
        <span className="langTarget">
          <span className="langFlag" aria-hidden="true">{displayFlag}</span>
          <span className="langCode">{displayCode}</span>
        </span>
      </button>
    </aside>
  );
}
