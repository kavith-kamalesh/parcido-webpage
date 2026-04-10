import { useTranslation } from 'react-i18next';

export const LanguageToggle = () => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  const toggle = () => {
    const next = isEn ? 'ta' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('antigravity-lang', next);
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
    >
      <span className={isEn ? 'text-foreground' : 'text-muted-foreground'}>EN</span>
      <span className="text-muted-foreground">/</span>
      <span className={!isEn ? 'text-foreground font-tamil' : 'text-muted-foreground font-tamil'}>தமிழ்</span>
    </button>
  );
};
