import fs from 'fs';
import path from 'path';
import { spawn, SpawnOptions } from 'child_process';

import { IPCamSearchRecord } from './reecam.types';
import { CaptureEvent, RuntimeCaptureEvent } from './capturer.types';
import { Config } from './config';

/**
 * Converts a date object to epoch time
 * @param date The date to convert
 * @returns The epoch value
 */
export function toEpoch(date?: Date): number | undefined {
  if (!date) return undefined;
  return Math.floor(date.valueOf() / 1000);
}

/**
 * Converts and epoch value to a date object
 * @param date The epoch time value
 * @returns The date value
 */
export function fromEpoch(date?: number): Date | undefined {
  if (!date) return undefined;
  return new Date(Math.floor(date * 1000));
}

/**
 * Converts milliseconds to the duration format hh:mm:ss.mil
 * @param s The milliseconds value
 * @returns A string in the format 00:00:00.000
 */
export function msToTime(s: number): string {
  const pad = (n: number, z = 2) => `00${`${n}`.split('.').pop()}`.slice(-z);
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

/**
 * Logs a standard format event to process.stdout
 * @param event The event to log on behalf of
 * @param message The message to log
 * @param extras Message interpolation values or additional values to output
 */
export function logForEvent(event: RuntimeCaptureEvent, message: string, ...extras: any[]): void {
  const eventName = toEpoch(event.start);
  const camName = event.cam && ` ${event.cam.alias}@${event.cam.ip}`;
  !extras || extras.length === 0
    ? console.log(`[${eventName + camName}]\t${message}`)
    : console.log(`[${eventName + camName}]\t${message}`, extras);
}

export type ChildProcessResult = { code: number; stdout: string; stderr: string; cmd: string };
/**
 * Launches a process, records it's stdout and stderr streams, and returns a
 * promise which will resolve or reject based on the exit code. The promise
 * yields a ChildProcessResult with the available info about the child process
 * and it's result.
 * @param command The executable command
 * @param args The arguments to provide to the command
 * @param options The options for launching the process
 * @returns A ChildProcessResult representing the operation results
 */
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

/**
 * Creates a promise, resolver and rejecter.
 * @returns A thruple of Promise<T>, resolver and rejecter
 */
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

/**
 * Returns the earliest and latest date represented by an array of `files`
 * @param files An array of `IPCamSearchRecord` objects
 * @returns A tuple of earliest and latest dates
 * @example
 * const files = getSearchRecords(); // Returns IPCamSearchRecord[]
 * const [earliest, latest] = getDateBounds(files);
 */
export function getDateBounds(files: IPCamSearchRecord[]) {
  const latest = new Date(Math.max(...files.map((f) => f.end_time.valueOf())));
  const earliest = new Date(Math.min(...files.map((f) => f.start_time.valueOf())));
  return [earliest, latest];
}

/**
 * Formats a date in ISO date format 000-00-00
 * @param date The date to format
 * @returns A string in the format 000-00-00
 */
export function toShortDate(date?: Date): string | undefined {
  if (!date) return undefined;
  if (!(date instanceof Date)) throw new Error(`Provided value is a ${typeof date} (${date}) not a date`);
  return `${date.getFullYear().toString().padStart(4, '0')}-${date.getMonth().toString().padStart(2, '0')}-${date
    .getDate()
    .toString()
    .padStart(2, '0')}`;
}

/**
 * Format a date and time in ISO-ish format 0000-00-00 00:00:00.000
 * @param date The date to be formatted
 * @returns A string in the format of 0000-00-00 00:00:00.000
 */
export function toShortDateTime(date?: Date): string | undefined {
  if (!date) return undefined;
  if (!(date instanceof Date)) throw new Error(`Provided value is a ${typeof date} (${date}) not a date`);
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

/**
 * Sorts events by start time in ascending order
 */
export function sortEventsAsc(a: CaptureEvent, b: CaptureEvent) {
  return b.start.valueOf() - a.start.valueOf();
}

/**
 * Sorts search records by start time in ascending order
 */
export function sortRecordsAsc(a: IPCamSearchRecord, b: IPCamSearchRecord) {
  return b.start_time.valueOf() - a.start_time.valueOf();
}

/**
 * Make the local file path for an event's camera
 * @returns A string containing `<config media path>\<cam identifier>`
 */
export function makeLocalCamPath(event: CaptureEvent) {
  const params = event.params;
  return path.resolve(Config.mediaPath, params.camId);
}

/**
 * Make the local file path for an event
 * @returns A string containing `<config media path>\<cam identifier>\<event epoch start>`
 */
export function makeLocalEventPath(event: CaptureEvent) {
  const params = event.params;
  const epoch = toEpoch(event.start);
  const folder = path.resolve(Config.mediaPath, params.camId, epoch.toString());

  fs.mkdirSync(folder, { recursive: true });
  return folder;
}

/**
 * Make the local file path for an event video file
 * @returns A string containing `<config media path>\<cam identifier>\<event epoch start>\<file name>`
 */
export function makeLocalFilePath(event: CaptureEvent, file: IPCamSearchRecord) {
  const folder = makeLocalEventPath(event);
  return path.resolve(folder, file.name);
}

/**
 * Determines if an event record is relevant to an event or not
 * @param record The event record
 * @param event The event
 * @returns True if the record represents the event, otherwise false.
 */
export function canDownload(record: IPCamSearchRecord, event: CaptureEvent): boolean {
  const isIncluded = event.files?.includes(record);
  const isRecordCovering = record.start_time <= event.start && record.end_time >= event.stop;
  const isStartInRecord = event.start >= record.start_time && event.start <= record.end_time;
  const isStopInRecord = event.stop >= record.start_time && event.stop <= record.end_time;
  const recordInEvent = event.start <= record.start_time && record.end_time <= event.stop;

  return !isIncluded && (isRecordCovering || isStartInRecord || isStopInRecord || recordInEvent);
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

export async function wait<T>(ms: number, value?: T) {
  return new Promise<T>((resolve) => setTimeout(resolve, ms, value));
}
