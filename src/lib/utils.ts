import fs from 'fs';
import path from 'path';
import { spawn, SpawnOptions } from 'child_process';

import { IPCamSearchRecord } from './reecam.types';
import { CaptureEvent, RuntimeCaptureEvent } from './capturer.types';
import { Config } from './config';

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
  const pad = (n: number, z = 2) => `00${n}`.slice(-z);
  return (
    pad((s / 3.6e6) | 0) +
    ':' +
    pad(((s % 3.6e6) / 6e4) | 0) +
    ':' +
    pad(((s % 6e4) / 1000) | 0) +
    '.' +
    pad(s / 1000, 3)
  );
}

export function logForEvent(event: RuntimeCaptureEvent, message: string, ...extras: any[]): void {
  const eventName = toEpoch(event.start);
  const camName = event.cam && ` ${event.cam.alias}@${event.cam.ip}`;
  console.log(`[${eventName + camName}]\t${message}`, extras);
}

export type ChildProcessResult = { code: number; stdout: string; stderr: string; cmd: string };
export function waitForProcess(command: string, args: readonly string[], options: SpawnOptions) {
  const stdoutChunks: unknown[] = [];
  const stderrChunks: unknown[] = [];
  const startingCmd = `${command} ${args.join(' ')}`;
  const [awaiter, resolver, rejecter] = makeAwaiter<ChildProcessResult>();
  const childProcess = spawn(command, args, options)
    .once('exit', (code: number) => {
      if (code === 0) {
        resolver({
          code,
          stdout: stdoutChunks.join('\n').trim(),
          stderr: stderrChunks.join('\n').trim(),
          cmd: startingCmd,
        });
      } else {
        rejecter({
          code,
          stdout: stdoutChunks.join('\n').trim(),
          stderr: stderrChunks.join('\n').trim(),
          cmd: startingCmd,
        });
      }
    })
    .once('error', rejecter);
  if (childProcess.stdout) childProcess.stdout.on('data', (chunk) => stdoutChunks.push(chunk));
  if (childProcess.stderr) childProcess.stderr.on('data', (chunk) => stderrChunks.push(chunk));
  return awaiter;
}

export function makeAwaiter<T = void>(): [
  Promise<T>,
  (value?: T | PromiseLike<T>) => void,
  (reason?: unknown) => void
] {
  let rejecter: (reason?: unknown) => void;
  let resolver: (value?: T | PromiseLike<T>) => void;
  const awaiter = new Promise<T>((resolve, reject) => {
    rejecter = reject;
    resolver = resolve;
  });
  return [awaiter, resolver, rejecter];
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
export function sortEventsAsc(a: CaptureEvent, b: CaptureEvent) {
  return b.start.valueOf() - a.start.valueOf();
}

export function sortRecordsAsc(a: IPCamSearchRecord, b: IPCamSearchRecord) {
  return b.start_time.valueOf() - a.start_time.valueOf();
}

export function makeLocalCamPath(event: CaptureEvent) {
  const params = event.params;
  return path.resolve(Config.mediaPath, params.camId);
}

export function makeLocalEventPath(event: CaptureEvent) {
  const params = event.params;
  const epoch = toEpoch(event.start);
  const folder = path.resolve(Config.mediaPath, params.camId, epoch.toString());

  fs.mkdirSync(folder, { recursive: true });
  return folder;
}

export function makeLocalFilePath(event: CaptureEvent, file: IPCamSearchRecord) {
  const folder = makeLocalEventPath(event);
  return path.resolve(folder, file.name);
}

export function canDownload(record: IPCamSearchRecord, event: CaptureEvent): boolean {
  const isIncluded = event.files?.includes(record);
  const isRecordCovering = record.start_time <= event.start && record.end_time >= event.stop;
  const isStartInRecord = event.start >= record.start_time && event.start <= record.end_time;
  const isStopInRecord = event.stop >= record.start_time && event.stop <= record.end_time;

  return !isIncluded && (isRecordCovering || isStartInRecord || isStopInRecord);
}

/**
 * Verifies a possible local file match, and deletes it if it's an incomplete file
 * @returns `true` if the file exists and is considered complete, otherwise `false`.
 */
export function maybeCleanupFile(event: RuntimeCaptureEvent, file: IPCamSearchRecord): boolean {
  const remoteSize = file.size;
  const fullFilePath = makeLocalFilePath(event, file);

  const localExists = fs.existsSync(fullFilePath);
  const localSize = localExists ? fs.statSync(fullFilePath)?.size : 0;
  if (localExists && localSize >= remoteSize) return true;
  else if (localExists && localSize < remoteSize) {
    fs.rmSync(fullFilePath, { force: true });
    return false;
  }
}
