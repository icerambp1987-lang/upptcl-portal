import React, { createContext, useState, useContext } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('hi'); // Default to Hindi

  const t = (key) => {
    if (translations[key] && translations[key][lang]) {
      return translations[key][lang];
    }
    // Fallback to key if translation not found
    return key;
  };

  const toggleLanguage = () => {
    const newLang = lang === 'hi' ? 'en' : 'hi';
    setLang(newLang);
    
    // Attempt to toggle iframe language simultaneously
    try {
      const iframe = document.querySelector('iframe[title="जन शक्ति पोर्टल"]');
      if (iframe && iframe.contentWindow) {
         // The iframe has a window.displayLang. We can trigger a click on its toggle button if we find it
         // Or just send a message, but simplest is to click the button inside iframe
         const btn = iframe.contentDocument.getElementById('langToggleBtn');
         if (btn) {
           // check if iframe lang matches our new lang. In iframe, btn text shows current opposite.
           // actually, just click it to toggle.
           btn.click();
         }
      }
    } catch (e) {
      console.warn('Could not sync iframe language', e);
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
