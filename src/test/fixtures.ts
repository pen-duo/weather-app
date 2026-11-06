export const weatherFixture = {
  timezone: 'Asia/Hong_Kong',
  utc_offset_seconds: 28800,
  current: {
    time: '2026-11-05T18:15',
    temperature_2m: 24.2,
    apparent_temperature: 25.3,
    relative_humidity_2m: 70,
    wind_speed_10m: 12.4,
    weather_code: 2,
    is_day: 1,
  },
  daily: {
    time: [
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
      '2026-11-09',
      '2026-11-10',
      '2026-11-11',
    ],
    weather_code: [2, 0, 3, 61, 80, 1, 0],
    temperature_2m_max: [27, 28, 26, 24, 25, 27, 28],
    temperature_2m_min: [21, 22, 20, 19, 21, 20, 22],
    precipitation_probability_max: [10, 0, 20, 80, 60, 10, 0],
  },
};
