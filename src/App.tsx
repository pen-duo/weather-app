import { LanguageMenu } from './components/LanguageMenu';
import { useLanguage } from './i18n/Language';
import { useCallback, useRef, useState } from 'react';
import { DEFAULT_LOCATION, getWeather, type Location } from './api/weather';
import { LocationSearch } from './components/LocationSearch';
import { WeatherDashboard } from './components/WeatherDashboard';
import { WeatherIcon } from './components/WeatherIcon';
import { Notice } from './components/Notice';
import { useRequest } from './hooks/useRequest';
export default function App() {
  const { t } = useLanguage();
  const [location, setLocation] = useState<Location>(DEFAULT_LOCATION);
  const title = useRef<HTMLHeadingElement>(null);
  const request = useCallback((signal: AbortSignal) => getWeather(location, signal), [location]);
  const { state, retry } = useRequest(request);
  return (
    <>
      <a className="skip-link" href="#weather">
        {t('跳到天气信息')}
      </a>
      <div className="app-shell">
        <header className="site-header">
          <a className="brand" href="./" aria-label={t('晴间首页')}>
            <span className="brand-mark">
              <WeatherIcon kind="sun" />
            </span>
            <span>
              {t('晴间')}
              <span className="brand-en">WEATHER</span>
            </span>
          </a>
          <div className="header-tools">
            <LanguageMenu />
            <span className="header-caption">{t('每一天，心中有晴。')}</span>
          </div>
        </header>
        <main>
          <div className="intro">
            <p className="eyebrow">A LITTLE CLARITY, EVERY DAY</p>
            <h1>
              {t('世界的天气，')}
              <span>{t('一目了然。')}</span>
            </h1>
            <p>{t('从此刻的晴雨，到接下来一周的安排。')}</p>
          </div>
          <LocationSearch
            onSelect={(next) => {
              setLocation(next);
              title.current?.focus();
            }}
          />
          <section id="weather" aria-labelledby="location-title">
            <div className="location-heading">
              <div>
                <p className="eyebrow">{t('天气一览')}</p>
                <h2 ref={title} tabIndex={-1} id="location-title">
                  {t(location.name)}
                  <span>
                    {[
                      ...new Set(
                        [location.admin1, location.country].filter(
                          (value) => value && value !== location.name,
                        ),
                      ),
                    ]
                      .map((value) => t(value!))
                      .join(' · ')}
                  </span>
                </h2>
              </div>
              <button
                className="refresh-button"
                onClick={retry}
                disabled={state.status === 'loading'}
                aria-label={t('刷新天气')}
              >
                <span aria-hidden="true">↻</span> {t('刷新')}
              </button>
            </div>
            {state.status === 'loading' && (
              <div className="loading-state" role="status">
                <div className="spinner" />
                <p>{t('正在获取{name}的天气…', { name: t(location.name) })}</p>
                <span>{t('片刻后，为你呈现最新天气。')}</span>
              </div>
            )}
            {state.status === 'error' && (
              <div className="weather-error">
                <WeatherIcon kind="cloud" />
                <h3>{t('暂时无法获取{name}的天气', { name: t(location.name) })}</h3>
                <Notice message={state.message} onRetry={retry} />
              </div>
            )}
            {state.status === 'success' && (
              <>
                <span className="sr-only" role="status">
                  {t('{name}天气已更新', { name: t(location.name) })}
                </span>
                <WeatherDashboard weather={state.data} location={location} />
              </>
            )}
          </section>
        </main>
        <footer>
          <span>
            {t('晴间')}
            <span aria-hidden="true">/</span> {t('留一点时间，看看天空。')}
          </span>
          <span>
            {t('天气')}{' '}
            <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
              Open-Meteo
            </a>{' '}
            · {t('地点')}{' '}
            <a href="https://www.geonames.org/" target="_blank" rel="noreferrer">
              GeoNames
            </a>
          </span>
        </footer>
      </div>
    </>
  );
}
