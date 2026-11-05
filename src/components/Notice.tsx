import { useLanguage } from '../i18n/Language';
export function Notice({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="notice" role="alert">
      <span>{t(message)}</span>
      <button className="text-button" onClick={onRetry}>
        {t('重新尝试')}
        <span aria-hidden="true">↻</span>
      </button>
    </div>
  );
}
