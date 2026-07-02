export function pluralRu(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const d = abs % 10;
  if (abs > 10 && abs < 15) return forms[2];
  if (d === 1) return forms[0];
  if (d >= 2 && d <= 4) return forms[1];
  return forms[2];
}

export const exercisesPlural = (n: number) =>
  `${n} ${pluralRu(n, ['упражнение', 'упражнения', 'упражнений'])}`;

export const workoutsPlural = (n: number) =>
  `${n} ${pluralRu(n, ['тренировка', 'тренировки', 'тренировок'])}`;

export const daysPlural = (n: number) => `${n} ${pluralRu(n, ['день', 'дня', 'дней'])}`;
