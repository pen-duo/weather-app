import { useLanguage } from '../i18n/Language';
import type { Location, Weather } from '../api/weather';
import {
  condition,
  dateLabel,
  shortDateLabel,
  weekdayLabel,
  number,
  utcOffsetLabel,
} from '../lib/format';
import { WeatherIcon } from './WeatherIcon';
export function WeatherDashboard({ weather, location }: { weather: Weather; location: Location }) {
  const { t, locale } = useLanguage();
  const { current, daily } = weather;
  const description = condition(current.weather_code, current.is_day);
  return (
    <div className="weather-dashboard">
      <section className="current-card" aria-labelledby="current-title">
        <div className="current-top">
          <h3 id="current-title" className="eyebrow">
            {t('当前天气')}
          </h3>
          <span className="unit-badge">{t('摄氏度 °C')}</span>
        </div>
        <div className="current-main">
          <div>
            <div className="temperature">
              {number(current.temperature_2m)}
              <span>°</span>
            </div>
            <p className="condition">{t(description.label)}</p>
            <p className="feels-like">
              {t('体感')} {number(current.apparent_temperature, '°C')}
            </p>
          </div>
          <WeatherIcon kind={description.icon} className="hero-icon" />
        </div>
        <div className="current-bottom">
          <span>{dateLabel(current.time.slice(0, 10), locale)}</span>
          <span>
            {t('数据时间')} {current.time.slice(11)} · {t('当地时间')}
          </span>
        </div>
      </section>
      <section className="details-card" aria-labelledby="details-title">
        <h3 id="details-title" className="eyebrow">
          {t('此刻详情')}
        </h3>
        <dl className="metrics">
          <div>
            <dt>
              <span aria-hidden="true">◉</span> {t('相对湿度')}
            </dt>
            <dd>
              {number(current.relative_humidity_2m)}
              <small>%</small>
            </dd>
          </div>
          <div>
            <dt>
              <span aria-hidden="true">≋</span> {t('风速')}
            </dt>
            <dd>
              {number(current.wind_speed_10m)}
              <small>km/h</small>
            </dd>
          </div>
          <div>
            <dt>
              <span aria-hidden="true">↗</span> {t('今日最高')}
            </dt>
            <dd>
              {number(daily.temperature_2m_max[0], '°')}
              <small>C</small>
            </dd>
          </div>
          <div>
            <dt>
              <span aria-hidden="true">↘</span> {t('今日最低')}
            </dt>
            <dd>
              {number(daily.temperature_2m_min[0], '°')}
              <small>C</small>
            </dd>
          </div>
        </dl>
        <p className="details-note">
          {t(location.name)} · {t('当地时间')} · {utcOffsetLabel(weather.utc_offset_seconds)}
        </p>
      </section>
      <section className="forecast-section" aria-labelledby="forecast-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('接下来的一周')}</p>
            <h3 id="forecast-title">{t('7 天天气预报')}</h3>
          </div>
          <span className="forecast-note">{t('最高 / 最低 · °C')}</span>
        </div>
        <ol className="forecast-grid">
          {daily.time.map((day, i) => {
            const info = condition(daily.weather_code[i]);
            return (
              <li className="forecast-card" key={day}>
                <span className="forecast-day">
                  {i === 0 ? t('今天') : weekdayLabel(day, locale)}
                </span>
                <time dateTime={day}>{shortDateLabel(day, locale)}</time>
                <WeatherIcon kind={info.icon} />
                <span className="forecast-condition">{t(info.label)}</span>
                <div className="forecast-temperatures">
                  <strong
                    aria-label={`${t('最高')} ${number(daily.temperature_2m_max[i], t('摄氏度'))}`}
                  >
                    {number(daily.temperature_2m_max[i], '°')}
                  </strong>
                  <span
                    aria-label={`${t('最低')} ${number(daily.temperature_2m_min[i], t('摄氏度'))}`}
                  >
                    {number(daily.temperature_2m_min[i], '°')}
                  </span>
                </div>
                <span className="rain-chance">
                  {t('降水概率')} {number(daily.precipitation_probability_max[i], '%')}
                </span>
              </li>
            );
          })}
        </ol>
        {daily.time.length < 7 && (
          <p className="hint">
            {t('数据服务目前仅提供 {count} 天预报。', { count: daily.time.length })}
          </p>
        )}
      </section>
      <p className="data-note">
        {t('天气为模型估算；预报日期与数据时间均按所选地点显示。缺失数据以“—”表示。')}
      </p>
    </div>
  );
}
