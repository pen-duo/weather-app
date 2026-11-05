import { useLanguage } from '../i18n/Language';
import { useCallback, useRef, useState, type FormEvent } from 'react';
import { searchLocations, type Location } from '../api/weather';
import { useRequest } from '../hooks/useRequest';
import { Notice } from './Notice';
export function LocationSearch({ onSelect }: { onSelect: (location: Location) => void }) {
  const { t, locale } = useLanguage();
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [validation, setValidation] = useState('');
  const field = useRef<HTMLInputElement>(null);
  const request = useCallback(
    (signal: AbortSignal) => searchLocations(query, signal, locale === 'en' ? 'en' : 'zh'),
    [query, locale],
  );
  const { state, retry } = useRequest(query ? request : null);
  function submit(event: FormEvent) {
    event.preventDefault();
    const next = input.trim();
    if ([...next].length < 2) {
      setQuery('');
      setValidation('请输入至少 2 个字符的地点名称。');
      field.current?.focus();
      return;
    }
    setValidation('');
    if (query === next) retry();
    else setQuery(next);
  }
  return (
    <section className="search-panel" aria-label={t('地点搜索')}>
      <form onSubmit={submit} role="search">
        <label htmlFor="location">{t('想了解哪里的天气？')}</label>
        <div className="search-row">
          <span className="search-symbol" aria-hidden="true">
            ⌕
          </span>
          <input
            ref={field}
            id="location"
            value={input}
            maxLength={100}
            placeholder={t('搜索城市，例如：香港、London')}
            autoComplete="off"
            aria-describedby="search-hint"
            aria-invalid={!!validation}
            onChange={(e) => {
              setInput(e.target.value);
              setQuery('');
              setValidation('');
            }}
          />
          <button className="primary-button" type="submit" disabled={state.status === 'loading'}>
            {state.status === 'loading' ? t('搜索中…') : t('搜索地点')}
            <span aria-hidden="true"> ↗</span>
          </button>
        </div>
        <p id="search-hint" className={validation ? 'validation' : 'hint'}>
          {t(validation || '输入城市名后搜索，再选择对应的地区。支持中文和英文。')}
        </p>
      </form>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {state.status === 'loading'
          ? t('正在搜索地点')
          : state.status === 'success'
            ? t('找到 {count} 个地点', { count: state.data.length })
            : ''}
      </div>
      {state.status === 'error' && <Notice message={state.message} onRetry={retry} />}
      {state.status === 'success' &&
        (state.data.length === 0 ? (
          <div className="empty-search">
            {t('没有找到“{query}”。请检查拼写，或尝试英文城市名。', { query })}
          </div>
        ) : (
          <div className="search-results">
            <p className="eyebrow">
              {t('选择地点 · {count} 个结果', { count: state.data.length })}
            </p>
            <ul>
              {state.data.map((location) => (
                <li key={location.id}>
                  <button
                    onClick={() => {
                      setInput(location.name);
                      setQuery('');
                      onSelect(location);
                    }}
                  >
                    <span>
                      <strong>{location.name}</strong>
                      <small>
                        {[...new Set([location.admin1, location.country].filter(Boolean))].join(
                          ' · ',
                        ) || t('地区信息暂缺')}{' '}
                        · {location.latitude.toFixed(2)}, {location.longitude.toFixed(2)}
                      </small>
                    </span>
                    <span aria-hidden="true">↗</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </section>
  );
}
