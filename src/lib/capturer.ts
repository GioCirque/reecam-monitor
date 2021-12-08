import fs from 'fs';
import path from 'path';
import Jimp from 'jimp';
import GIFEncoder from 'gifencoder';
import { addSeconds, differenceInSeconds } from 'date-fns';

import { IPCam } from './reecam';
import { Config } from './config';
import { Encoder } from './encoder';
import { timeSince, toEpoch } from './utils';
import { IPCamParams, IPCamSearchRecord } from './reecam.types';
import { CaptureEvent, CaptureEventFile, CaptureStage, RuntimeCaptureEvent } from './capturer.types';

const MAX_FRAME_COUNT = 60;
const GIF_DIMS_SMALL = true;
const GIF_DIMS_720P = { width: 1280, height: 720 };
const GIF_DIMS_1080P = { width: 1920, height: 1080 };
const GIF_DIMS = GIF_DIMS_SMALL ? GIF_DIMS_720P : GIF_DIMS_1080P;

export class Capturer {
  private stopNow: boolean;
  private interval: NodeJS.Timer;
  private downloadPromise: Promise<void>;
  private encodingPromise: Promise<void>;
  private snapshotPromise: Promise<void>;
  private readonly captureData: CaptureEventFile;
  private readonly configFilePath = path.resolve(Config.storagePath, 'captures.json');

  constructor() {
    this.stopNow = false;
    this.interval = undefined;
    this.downloadPromise = undefined;
    this.encodingPromise = undefined;
    this.snapshotPromise = undefined;
    this.captureData = this.readCaptureData();

    this.stop = this.stop.bind(this);
    this.start = this.start.bind(this);
    this.addEvent = this.addEvent.bind(this);
    this.makeAwaiter = this.makeAwaiter.bind(this);
    this.canDownload = this.canDownload.bind(this);
    this.downloadFile = this.downloadFile.bind(this);
    this.sortEventsAsc = this.sortEventsAsc.bind(this);
    this.sortRecordsAsc = this.sortRecordsAsc.bind(this);
    this.downloadEvents = this.downloadEvents.bind(this);
    this.readCaptureData = this.readCaptureData.bind(this);
    this.getEventsByStage = this.getEventsByStage.bind(this);
    this.writeCaptureData = this.writeCaptureData.bind(this);
    this.processDownloads = this.processDownloads.bind(this);
    this.maybeFinalizeGif = this.maybeFinalizeGif.bind(this);
    this.maybeCleanupFile = this.maybeCleanupFile.bind(this);
    this.makeLocalCamPath = this.makeLocalCamPath.bind(this);
    this.makeLocalFilePath = this.makeLocalFilePath.bind(this);
    this.updateCaptureStages = this.updateCaptureStages.bind(this);
    this.findExtensibleCapture = this.findExtensibleCapture.bind(this);
  }

  addEvent(params: IPCamParams, start: Date) {
    const { id: camId, alarm_period: alarmSeconds } = params;
    const [existIndex, existing] = this.findExtensibleCapture(camId, start, alarmSeconds);
    if (existIndex >= 0 && existing) {
      existing.stage = CaptureStage.Active;
      existing.stop = addSeconds(start, alarmSeconds);
      this.captureData.captures[camId].splice(existIndex, 1, existing);
    } else {
      this.captureData.captures[camId].push({
        start,
        params,
        files: [],
        isGifFinal: false,
        stage: CaptureStage.Active,
        stop: addSeconds(start, alarmSeconds),
      } as CaptureEvent);
    }
    this.writeCaptureData();
  }

  start(): void {
    if (!this.interval) {
      this.interval = setInterval(this.processAll, 500);
    }
  }

  stop(): void {
    clearInterval(this.interval);
    this.stopNow = true;
  }

  private processAll(): void {
    this.updateCaptureStages();
    this.processSnapshots();
    this.processDownloads();
    this.processEncodings();
  }

  private processDownloads(): void {
    if (!this.downloadPromise) {
      this.downloadPromise = this.downloadEvents();
    }
  }

  private processEncodings(): void {
    if (!this.encodingPromise) {
      this.encodingPromise = this.encodeEvents();
    }
  }

  private processSnapshots(): void {
    if (!this.snapshotPromise) {
      this.snapshotPromise = this.snapshotEvents();
    }
  }

  private async snapshotEvents(): Promise<void> {
    const stages = [CaptureStage.Active, CaptureStage.Downloading, CaptureStage.Downloaded];
    const events = this.getEventsByStage(...stages).sort(this.sortEventsAsc);
    console.log(`Snapshotting ${events.length.toString().padStart(3, '0')} events`);
    for (const event of events) {
      if (this.stopNow) break;
      if (event.frames >= MAX_FRAME_COUNT) continue;

      event.frames++;
      const imageData = await event.cam.getSnapshot();
      const camFolderPath = this.makeLocalCamPath(event);
      const image = await Jimp.read(imageData).then((jimp) => {
        const smaller = jimp.resize(GIF_DIMS.width, GIF_DIMS.height);
        if (event.frames <= 5) {
          const latestSnapshotPath = path.resolve(camFolderPath, 'snapshot.jpeg');
          smaller.write(latestSnapshotPath);
        }
        return smaller;
      });
      event.giffer.addFrame(image.bitmap.data);
      event.isGifFinal = await this.maybeFinalizeGif(event);
    }
    this.snapshotPromise = undefined;
  }

  private async maybeFinalizeGif(event: RuntimeCaptureEvent): Promise<boolean> {
    if (!event.isGifFinal && event.frames >= MAX_FRAME_COUNT) {
      event.giffer.finish();
      return true;
    }
    return false;
  }

  private async downloadEvents(): Promise<void> {
    const events = this.getEventsByStage(CaptureStage.Downloading).sort(this.sortEventsAsc);
    console.log(`Downloading ${events.length.toString().padStart(3, '0')} events`);
    for (const event of events) {
      if (this.stopNow) break;

      const cam = event.cam;
      const records = await cam.searchRecords();
      const matches = records?.record?.filter((r) => this.canDownload(r, event));
      event.files.push(...matches.filter((f) => !event.files.includes(f)));

      const files = event.files.sort(this.sortRecordsAsc);
      for (const file of files) {
        if (this.stopNow) break;

        await this.downloadFile(event, file);
      }

      this.verifyDownloads(event);
    }
    this.downloadPromise = undefined;
  }

  private async verifyDownloads(event: RuntimeCaptureEvent) {
    const camId = event.params.id;
    const downloaded = event.files.map((file) => this.maybeCleanupFile(event, file)).includes(false);
    if (downloaded) {
      event.stage = CaptureStage.Downloaded;
      const index = this.captureData.captures[camId].indexOf(event);
      if (index >= 0) {
        this.captureData.captures[camId].splice(index, 1, event);
        this.writeCaptureData();
      }
    }
  }

  private maybeCleanupFile(event: RuntimeCaptureEvent, file: IPCamSearchRecord): boolean {
    const remoteSize = file.size;
    const fullFilePath = this.makeLocalFilePath(event, file);

    const localExists = fs.existsSync(fullFilePath);
    const localSize = localExists ? fs.statSync(fullFilePath).size : 0;
    if (localExists && localSize >= remoteSize) return true;
    else if (localExists && localSize < remoteSize) {
      fs.rmSync(fullFilePath, { force: true });
      return false;
    }
  }

  private canDownload(record: IPCamSearchRecord, event: CaptureEvent): boolean {
    const isIncluded = event.files?.includes(record);
    const isRecordCovering = record.start_time <= event.start && record.end_time >= event.stop;
    const isStartInRecord = event.start >= record.start_time && event.start <= record.end_time;
    const isStopInRecord = event.stop >= record.start_time && event.stop <= record.end_time;

    return !isIncluded && (isRecordCovering || isStartInRecord || isStopInRecord);
  }

  private async downloadFile(event: RuntimeCaptureEvent, file: IPCamSearchRecord) {
    const cam = event.cam;
    const fullFilePath = this.makeLocalFilePath(event, file);

    // Potential clean-up or early bailout
    if (this.maybeCleanupFile(event, file)) return;

    const [awaiter, resolver, rejecter] = this.makeAwaiter();
    const localStream = fs.createWriteStream(fullFilePath, { encoding: 'binary' });
    const remoteStream = await cam.downloadRecord(file.name);
    remoteStream
      .on('close', () => {
        localStream.end();
        resolver();
      })
      .on('data', () => {
        if (this.stopNow) {
          remoteStream.destroy();
        }
      })
      .on('error', (e) => {
        try {
          try {
            remoteStream.removeAllListeners().destroy();
          } catch (e) {
            console.error(e);
          }
          try {
            localStream.end();
          } catch (e) {
            console.error(e);
          }
        } finally {
          console.error(e);
          rejecter(e);
        }
      })
      .pipe(localStream);
    return awaiter.finally(() => this.maybeCleanupFile(event, file));
  }

  private async encodeEvents(): Promise<void> {
    const events = this.getEventsByStage(CaptureStage.Encoding).sort(this.sortEventsAsc);
    console.log(`Encoding ${events.length.toString().padStart(3, '0')} events`);
    for (const event of events) {
      if (this.stopNow) break;

      const params = event.params;
      const epoch = toEpoch(event.start);
      const eventDurationMs = timeSince(event.start, event.stop).ms;
      const mediaFolderPath = path.resolve(Config.mediaPath, params.id, epoch.toString());
      const earliestFileTime = new Date(Math.min(...event.files.map((f) => f.start_time.valueOf())));
      const startTimeOffsetMs = timeSince(earliestFileTime, event.start).ms;

      await Encoder.mergeMOVFiles(mediaFolderPath, eventDurationMs, startTimeOffsetMs);
      for (const file of event.files) {
        const localPath = this.makeLocalFilePath(event, file);
        fs.rmSync(localPath, { force: true });
      }
    }
    this.encodingPromise = undefined;
  }

  private getEventsByStage(...stage: CaptureStage[]): RuntimeCaptureEvent[] {
    const matches: RuntimeCaptureEvent[] = [];
    for (const camAlias in this.captureData.captures) {
      const events = this.captureData.captures[camAlias];
      for (const event of events) {
        if (stage.includes(event.stage)) {
          const opts = Config.getCamOptsByIP(event.params.ip);
          matches.push({
            ...event,
            cam: new IPCam(opts),
            giffer: new GIFEncoder(GIF_DIMS.width, GIF_DIMS.height),
          });
        }
      }
    }
    return matches;
  }

  private sortEventsAsc(a: CaptureEvent, b: CaptureEvent) {
    return b.start.valueOf() - a.start.valueOf();
  }

  private sortRecordsAsc(a: IPCamSearchRecord, b: IPCamSearchRecord) {
    return b.start_time.valueOf() - a.start_time.valueOf();
  }

  private makeLocalCamPath(event: CaptureEvent) {
    const params = event.params;
    return path.resolve(Config.mediaPath, params.id);
  }

  private makeLocalFilePath(event: CaptureEvent, file: IPCamSearchRecord) {
    const params = event.params;
    const epoch = toEpoch(event.start);
    return path.resolve(Config.mediaPath, params.id, epoch.toString(), file.name);
  }

  private makeAwaiter<T = void>(): [Promise<T>, (value?: T | PromiseLike<T>) => void, (reason?: unknown) => void] {
    let rejecter: (reason?: unknown) => void;
    let resolver: (value?: T | PromiseLike<T>) => void;
    const awaiter = new Promise<T>((resolve, reject) => {
      rejecter = reject;
      resolver = resolve;
    });
    return [awaiter, resolver, rejecter];
  }

  private updateCaptureStages() {
    const now = new Date();
    const completed: CaptureEvent[] = [];
    for (const camId in this.captureData.captures) {
      const events = this.captureData.captures[camId];
      console.log(`Updating capture stages for ${events.length.toString().padStart(3, '0')} on cam ${camId}`);
      for (const event of events) {
        switch (event.stage) {
          case CaptureStage.Active: {
            event.stage = event.stop < now ? CaptureStage.Downloading : event.stage;
            break;
          }
          case CaptureStage.Downloaded: {
            event.stage = CaptureStage.Encoding;
            break;
          }
          case CaptureStage.Encoded: {
            event.stage = CaptureStage.Complete;
            completed.push(event);
            break;
          }
        }
      }
    }

    console.log(`Completing ${completed.length.toString().padStart(3, '0')} events`);
    for (const event of completed) {
      const index = this.captureData.captures[event.params.id].indexOf(event);
      if (index >= 0) this.captureData.captures[event.params.id].splice(index, 1);
    }
  }

  private findExtensibleCapture(
    camAlias: string,
    start: Date,
    camAlarmSeconds: number
  ): [number, CaptureEvent | undefined] {
    const index = this.captureData.captures[camAlias]?.findIndex(
      (c) => Math.abs(differenceInSeconds(c.start, start)) <= camAlarmSeconds
    );
    return [index, index >= 0 ? this.captureData.captures[camAlias][index] : undefined];
  }

  private writeCaptureData(): CaptureEventFile {
    const obj = { ...this.captureData, timestamp: Date.now(), cam: undefined } as CaptureEventFile;
    obj.captures = obj.captures || {};
    const data = JSON.stringify(obj);
    fs.writeFileSync(this.configFilePath, data, 'utf-8');
    return obj;
  }

  private readCaptureData(): CaptureEventFile {
    const exists = fs.existsSync(this.configFilePath);
    if (!exists) {
      return this.writeCaptureData();
    }
    const data = fs.readFileSync(this.configFilePath, 'utf-8');
    return JSON.parse(data) as CaptureEventFile;
  }
}
