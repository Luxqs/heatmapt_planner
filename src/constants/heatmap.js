export const GLOBAL_SPORTS = [
  { id: 'all', label: 'All Sports' },
  { id: 'run', label: 'Run' },
  { id: 'ride', label: 'Ride' },
  { id: 'water', label: 'Water' },
  { id: 'winter', label: 'Winter' },
];

export const GLOBAL_SPORT_BY_ID = Object.fromEntries(
  GLOBAL_SPORTS.map((sport) => [sport.id, sport])
);
