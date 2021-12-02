export function toEpoch(date?: Date): number | undefined {
  if (!date) return undefined;
  return Math.floor(date.getTime() / 1000);
}

export function fromEpoch(date?: number): Date | undefined {
  if (!date) return undefined;
  return new Date(Math.floor(date * 1000));
}

export function toShortDateTime(date?: Date): string | undefined {
  if (!date) return undefined;
  return `${date.getFullYear().toString().padStart(4, '0')}-${date.getMonth().toString().padStart(2, '0')}-${date
    .getDate()
    .toString()
    .padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date
    .getMilliseconds()
    .toString()
    .substring(0, 3)}`;
}
