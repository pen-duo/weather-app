import type { WeatherIconKind } from '../lib/format';
export function WeatherIcon({
  kind,
  className = '',
}: {
  kind: WeatherIconKind;
  className?: string;
}) {
  return (
    <svg
      className={`weather-icon ${className}`}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === 'sun' && (
        <>
          <circle cx="32" cy="32" r="12" fill="currentColor" opacity=".18" />
          <circle cx="32" cy="32" r="12" />
          <path d="M32 5v7m0 40v7M5 32h7m40 0h7M13 13l5 5m28 28 5 5M13 51l5-5m28-28 5-5" />
        </>
      )}
      {kind === 'moon' && (
        <path
          d="M45 43A22 22 0 0 1 23 13a22 22 0 1 0 28 28c-2 1-4 2-6 2Z"
          fill="currentColor"
          fillOpacity=".12"
        />
      )}
      {['cloud', 'rain', 'snow', 'storm'].includes(kind) && (
        <path
          d="M17 40a10 10 0 1 1 1-20 15 15 0 0 1 28 4 8 8 0 1 1 2 16Z"
          fill="currentColor"
          fillOpacity=".12"
        />
      )}
      {kind === 'rain' && <path d="m22 47-3 7m14-7-3 7m14-7-3 7" />}
      {kind === 'snow' && <path d="M22 47v10m-4-8 8 6m0-6-8 6m25-8v10m-4-8 8 6m0-6-8 6" />}
      {kind === 'storm' && <path d="m33 43-7 10h8l-4 8" />}
      {kind === 'fog' && <path d="M16 20h32M9 30h46M16 40h32M10 50h44" />}
      {kind === 'unknown' && (
        <>
          <circle cx="32" cy="32" r="22" />
          <path d="M25 26a7 7 0 1 1 10 6c-3 1-3 4-3 5m0 8h.01" />
        </>
      )}
    </svg>
  );
}
