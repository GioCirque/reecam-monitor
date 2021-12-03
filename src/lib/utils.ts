export function toEpoch(date?: Date): number | undefined {
  if (!date) return undefined;
  return Math.floor(date.getTime() / 1000);
}

export function fromEpoch(date?: number): Date | undefined {
  if (!date) return undefined;
  return new Date(Math.floor(date * 1000));
}

export type TimeDiff = { ms: number; seconds: number; days: number; hours: number; minutes: number };
export function timeSince(date: Date, now = new Date()): TimeDiff {
  const ms = Math.abs(date.valueOf() - now.valueOf()); // milliseconds between now & date
  const seconds = Math.abs(ms / 1000);
  const days = Math.abs(ms / 86400000); // days
  const hours = Math.abs((ms % 86400000) / 3600000); // hours
  const minutes = Math.abs(((ms % 86400000) % 3600000) / 60000); // minutes
  return { ms, seconds, days, hours, minutes };
}

export function msToTime(s: number): string {
  const pad = (n: number, z = 2) => ('00' + n).slice(-z);
  return (
    pad((s / 3.6e6) | 0) +
    ':' +
    pad(((s % 3.6e6) / 6e4) | 0) +
    ':' +
    pad(((s % 6e4) / 1000) | 0) +
    '.' +
    pad(s % 1000, 3)
  );
}

export function toShortDate(date?: Date): string | undefined {
  if (!date) return undefined;
  return `${date.getFullYear().toString().padStart(4, '0')}-${date.getMonth().toString().padStart(2, '0')}-${date
    .getDate()
    .toString()
    .padStart(2, '0')}`;
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
    .substring(0, 3)
    .padStart(3, '0')}`;
}

/**
 * Format bytes as human-readable text.
 *
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use
 *           binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 *
 * @return Formatted string.
 */
export function humanFileSize(bytes: number, si = false, dp = 1): string {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }

  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

  return [bytes.toFixed(dp), units[u]].join(' ');
}
