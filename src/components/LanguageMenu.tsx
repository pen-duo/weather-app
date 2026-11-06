import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage, type Locale } from '../i18n/Language';

const languages: { value: Locale; label: string; lang: string }[] = [
  { value: 'zh-CN', label: '简体中文', lang: 'zh-CN' },
  { value: 'zh-TW', label: '繁體中文', lang: 'zh-TW' },
  { value: 'yue', label: '粵語', lang: 'yue-Hant' },
  { value: 'en', label: 'English', lang: 'en' },
];

export function LanguageMenu() {
  const { locale, setLocale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0, width: 176, maxHeight: 224 });
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();

  function close(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus({ preventScroll: true });
  }

  useLayoutEffect(() => {
    if (!open) return;
    function placeMenu() {
      const viewport = window.visualViewport;
      const viewportWidth = viewport?.width ?? window.innerWidth;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const width = Math.min(200, viewportWidth - 16);
      const height = Math.min(192, viewportHeight - 16);
      setPosition({
        left: (viewport?.offsetLeft ?? 0) + (viewportWidth - width) / 2,
        top: (viewport?.offsetTop ?? 0) + (viewportHeight - height) / 2,
        width,
        maxHeight: height,
      });
    }
    placeMenu();
    window.addEventListener('resize', placeMenu);
    window.addEventListener('scroll', placeMenu, true);
    window.visualViewport?.addEventListener('resize', placeMenu);
    window.visualViewport?.addEventListener('scroll', placeMenu);
    return () => {
      window.removeEventListener('resize', placeMenu);
      window.removeEventListener('scroll', placeMenu, true);
      window.visualViewport?.removeEventListener('resize', placeMenu);
      window.visualViewport?.removeEventListener('scroll', placeMenu);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    menu.current
      ?.querySelector<HTMLButtonElement>('[aria-checked="true"]')
      ?.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !menu.current?.contains(event.target) &&
        !trigger.current?.contains(event.target)
      )
        setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(
      menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? [],
    );
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
    } else if (event.key === 'Tab') close(true);
    else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? items.length - 1
            : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    }
  }

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="language-trigger"
        aria-label={t('界面语言')}
        title={t('界面语言')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <svg
          viewBox="0 0 44 44"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="22" cy="22" r="18" />
          <ellipse cx="22" cy="22" rx="8" ry="18" />
          <path d="M4 22h36" />
        </svg>
      </button>
      {open &&
        createPortal(
          <div
            ref={menu}
            id={id}
            role="menu"
            aria-label={t('界面语言')}
            className="language-menu"
            style={position}
            onKeyDown={navigate}
            onBlur={(event) => {
              if (
                !event.currentTarget.contains(event.relatedTarget) &&
                event.relatedTarget !== trigger.current
              )
                setOpen(false);
            }}
          >
            {languages.map((language) => (
              <button
                key={language.value}
                type="button"
                role="menuitemradio"
                aria-checked={locale === language.value}
                tabIndex={-1}
                lang={language.lang}
                onClick={() => {
                  setLocale(language.value);
                  close(true);
                }}
              >
                <span>{language.label}</span>
                <span aria-hidden="true">{locale === language.value ? '✓' : ''}</span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
