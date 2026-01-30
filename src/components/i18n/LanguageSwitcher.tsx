import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import type { Locale } from '../../i18n/config';

const languages: Record<Locale, { name: string; nativeName: string }> = {
  'zh-CN': { name: 'Chinese', nativeName: '中文' },
  'en-US': { name: 'English', nativeName: 'English' },
  'ja-JP': { name: 'Japanese', nativeName: '日本語' },
  'ko-KR': { name: 'Korean', nativeName: '한국어' },
};

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: Locale) => {
    i18n.changeLanguage(lng);
    // Save to localStorage
    localStorage.setItem('i18nextLng', lng);
  };

  const currentLanguage = languages[i18n.language as Locale] || languages['en-US'];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(languages).map(([code, { nativeName }]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => changeLanguage(code as Locale)}
            className={i18n.language === code ? 'bg-accent' : ''}
          >
            {nativeName}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
