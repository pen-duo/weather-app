import { useLanguage } from '../i18n/Language';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ApiError, searchLocations, type Location } from '../api/weather';
import type { RequestState } from '../hooks/useRequest';
import { Notice } from './Notice';

export function LocationSearch({ onSelect }: { onSelect: (location: Location) => void }) {
  const { t, locale } = useLanguage();
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [validation, setValidation] = useState('');
  const [state, setState] = useState<RequestState<Location | null>>({ status: 'idle' });
  const field = useRef<HTMLInputElement>(null);
  const activeRequest = useRef<AbortController | null>(null);
  useEffect(() => () => activeRequest.current?.abort(), []);

  async function search(value: string) {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setQuery(value);
    setState({ status: 'loading' });
    try {
      const results = await searchLocations(
        value,
        controller.signal,
        locale === 'en' ? 'en' : 'zh',
      );
      if (controller.signal.aborted || activeRequest.current !== controller) return;
      const location = results[0] ?? null;
      setState({ status: 'success', data: location });
      if (location) onSelect(location);
    } catch (error) {
      if (controller.signal.aborted || activeRequest.current !== controller) return;
      setState({
        status: 'error',
        message: error instanceof ApiError ? error.message : '加载失败，请重试。',
      });
    }
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const next = input.trim();
    if ([...next].length < 2) {
      setValidation('请输入至少 2 个字符的地点名称。');
      field.current?.focus();
      return;
    }
    setValidation('');
    void search(next);
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
            onChange={(event) => {
              activeRequest.current?.abort();
              setInput(event.target.value);
              setState({ status: 'idle' });
              setValidation('');
            }}
          />
          <button className="primary-button" type="submit" disabled={state.status === 'loading'}>
            {state.status === 'loading' ? t('搜索中…') : t('搜索地点')}
            <span aria-hidden="true"> ↗</span>
          </button>
        </div>
        <p id="search-hint" className={validation ? 'validation' : 'hint'}>
          {t(
            validation ||
              '输入城市名后搜索，直接显示首个匹配地点的天气；同名城市可加地区缩小范围。',
          )}
        </p>
      </form>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {state.status === 'loading' ? t('正在搜索地点') : ''}
      </div>
      {state.status === 'error' && (
        <Notice message={state.message} onRetry={() => void search(query)} />
      )}
      {state.status === 'success' && state.data === null && (
        <div className="empty-search">
          {t('没有找到“{query}”。请检查拼写，或尝试英文城市名。', { query })}
        </div>
      )}
    </section>
  );
}
