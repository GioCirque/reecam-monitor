import fs from 'fs';
import path from 'path';
import Jimp from 'jimp';
import GIFEncoder from 'gifencoder';
import { Canvas, createCanvas, loadImage } from 'canvas';
import { addSeconds, addMinutes, differenceInMilliseconds } from 'date-fns';

import { IPCam } from './reecam';
import { Config } from './config';
import { mergeMOVFiles } from './encoder';
import { IPCamSearchRecord } from './reecam.types';
import {
  canDownload,
  getDateBounds,
  logForEvent,
  makeAwaiter,
  makeLocalCamPath,
  makeLocalEventPath,
  makeLocalFilePath,
  maybeCleanupFile,
  msToTime,
  sortEventsAsc,
  sortRecordsAsc,
  toShortDateTime,
} from './utils';
import { CamParams, CaptureEvent, CaptureEventFile, CaptureStage, RuntimeCaptureEvent } from './capturer.types';

const MAX_FRAME_COUNT = 60;

const GIF_DIMS_TINY = true;
const GIF_DIMS_SMALL = true;
const GIF_DIMS_480P = { width: 720, height: 480 };
const GIF_DIMS_720P = { width: 1280, height: 720 };
const GIF_DIMS_1080P = { width: 1920, height: 1080 };
const GIF_DIMS = GIF_DIMS_SMALL ? (GIF_DIMS_TINY ? GIF_DIMS_480P : GIF_DIMS_720P) : GIF_DIMS_1080P;

const END_CAP_SECONDS = Number.isInteger(process.env.REECAM_END_CAP_SEC)
  ? parseInt(process.env.REECAM_END_CAP_SEC)
  : 30;
const RELAPSE_MINUTES = Number.isInteger(process.env.REECAM_RELAPSE_MIN)
  ? parseInt(process.env.REECAM_RELAPSE_MIN)
  : 10;

type RCEKeyType = keyof RuntimeCaptureEvent;
export class Capturer {
  private stopNow: boolean;
  private interval: NodeJS.Timer;
  private downloadPromise: Promise<void>;
  private encodingPromise: Promise<void>;
  private snapshotPromise: Promise<void>;
  private metadataPromise: Promise<void>;
  private readonly captureData: CaptureEventFile;
  private readonly configFilePath = path.resolve(Config.storagePath, 'captures.json');

  constructor() {
    this.stopNow = false;
    this.interval = undefined;
    this.downloadPromise = undefined;
    this.encodingPromise = undefined;
    this.snapshotPromise = undefined;
    this.metadataPromise = undefined;
    this.captureData = this.readCaptureData();

    this.stop = this.stop.bind(this);
    this.start = this.start.bind(this);
    this.addEvent = this.addEvent.bind(this);
    this.makeGiffer = this.makeGiffer.bind(this);
    this.processAll = this.processAll.bind(this);
    this.downloadFile = this.downloadFile.bind(this);
    this.getAllEvents = this.getAllEvents.bind(this);
    this.downloadEvents = this.downloadEvents.bind(this);
    this.readCaptureData = this.readCaptureData.bind(this);
    this.getEventsByStage = this.getEventsByStage.bind(this);
    this.writeCaptureData = this.writeCaptureData.bind(this);
    this.processDownloads = this.processDownloads.bind(this);
    this.processSnapshots = this.processSnapshots.bind(this);
    this.processEncodings = this.processEncodings.bind(this);
    this.maybeFinalizeGif = this.maybeFinalizeGif.bind(this);
    this.ensureRuntimeEvent = this.ensureRuntimeEvent.bind(this);
    this.updateCaptureStages = this.updateCaptureStages.bind(this);
    this.findExtensibleCapture = this.findExtensibleCapture.bind(this);
  }

  addEvent(params: CamParams, startTime: Date) {
    const start = addSeconds(startTime, -END_CAP_SECONDS);
    const { camId, alarmSeconds } = params;
    this.captureData.captures[camId] = this.captureData.captures[camId] || [];
    const [existIndex, existing] = this.findExtensibleCapture(camId, start);
    if (existIndex >= 0 && existing) {
      existing.stage = CaptureStage.Active;
      existing.stop = addSeconds(start, alarmSeconds);
      existing.until = addMinutes(existing.stop, RELAPSE_MINUTES);
      this.captureData.captures[camId].splice(existIndex, 1, existing);
    } else {
      const stop = addSeconds(start, alarmSeconds + END_CAP_SECONDS);
      this.captureData.captures[camId].push({
        stop,
        start,
        params,
        files: [],
        frames: 0,
        isGifFinal: false,
        stage: CaptureStage.Active,
        until: addMinutes(stop, RELAPSE_MINUTES),
      } as CaptureEvent);
    }
    this.writeCaptureData();
  }

  start(): void {
    if (!this.interval) {
      this.interval = setInterval(() => this.processAll(), 500);
    }
  }

  stop(): void {
    clearInterval(this.interval);
    this.stopNow = true;
  }

  private processAll(): void {
    this.updateCaptureStages();
    this.writeCaptureData();

    this.processMetadata();
    this.processSnapshots();
    this.processDownloads();
    this.processEncodings();
  }

  private processDownloads(): void {
    if (!this.downloadPromise) {
      this.downloadPromise = this.downloadEvents().finally(() => (this.downloadPromise = undefined));
    }
  }

  private processEncodings(): void {
    if (!this.encodingPromise) {
      this.encodingPromise = this.encodeEvents().finally(() => (this.encodingPromise = undefined));
    }
  }

  private processSnapshots(): void {
    if (!this.snapshotPromise) {
      this.snapshotPromise = this.snapshotEvents().finally(() => (this.snapshotPromise = undefined));
    }
  }

  private processMetadata(): void {
    if (!this.metadataPromise) {
      this.metadataPromise = this.metadataEvents().finally(() => (this.metadataPromise = undefined));
    }
  }

  private async metadataEvents() {
    const now = new Date();
    const events = this.getAllEvents();
    for (const event of events) {
      const camEventPath = makeLocalEventPath(event);
      const metadataFilePath = path.resolve(camEventPath, 'metadata.json');
      const elapsed = msToTime(Math.abs(differenceInMilliseconds(event.start, event.stop)));
      const eventMetadata = {
        elapsed,
        start: event.start,
        stop: event.stop,
        stage: event.stage,
        frames: event.frames,
        stageName: CaptureStage[event.stage],
        hasGif: event.isGifFinal,
        hasVid: event.stage >= CaptureStage.Encoding,
        isAlarmed: now < event.stop,
        gifSize: GIF_DIMS,
      };
      fs.writeFileSync(metadataFilePath, JSON.stringify(eventMetadata, undefined, 2));
    }
  }

  private async snapshotEvents(): Promise<void> {
    const stages = [CaptureStage.Active, CaptureStage.Downloading, CaptureStage.Downloaded];
    const events = this.getEventsByStage(...stages).sort(sortEventsAsc);
    for (const event of events) {
      try {
        if (this.stopNow) break;
        if (event.frames < MAX_FRAME_COUNT) {
          const snapshot = await event.cam.getSnapshot();
          const camFolderPath = makeLocalCamPath(event);
          const image = (await Jimp.read(snapshot)).resize(GIF_DIMS.width, GIF_DIMS.height);
          const context = event.canvas.getContext('2d');

          const [awaiter, resolve, reject] = makeAwaiter();
          image.getBuffer(Jimp.MIME_JPEG, (err, buff) => {
            if (err) return reject(err);
            loadImage(buff)
              .then((img) => context.drawImage(img, 0, 0))
              .then(resolve);
          });
          await awaiter;

          event.giffer.addFrame(context);
          image.write(path.resolve(camFolderPath, 'snapshot.jpeg'));
          event.frames++;

          await this.maybeFinalizeGif(event);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  private async maybeFinalizeGif(event: RuntimeCaptureEvent): Promise<boolean> {
    if (!event.isGifFinal && event.frames >= MAX_FRAME_COUNT) {
      event.giffer.finish();
      event.isGifFinal = true;
    }
    return event.isGifFinal;
  }

  private async downloadEvents(): Promise<void> {
    const events = this.getEventsByStage(CaptureStage.Downloading).sort(sortEventsAsc);
    for (const event of events) {
      if (this.stopNow) break;

      const cam = event.cam;
      const records = await cam.searchRecords();
      const matches = records?.record?.filter((r) => canDownload(r, event));
      event.files.push(...matches.filter((mf) => !event.files.find((ef) => ef.name === mf.name)));
      if (event?.files.length < 1) continue;

      logForEvent(
        event,
        `Downloading ${event.files.length} files from ${toShortDateTime(event.start)} to ${toShortDateTime(event.stop)}`
      );

      const files = event.files.sort(sortRecordsAsc);
      for (const file of files) {
        if (this.stopNow) break;
        try {
          await this.downloadFile(event, file);
        } catch (e) {
          logForEvent(event, e.message, e);
          continue;
        }
      }

      this.verifyDownloads(event);
    }
  }

  private verifyDownloads(event: RuntimeCaptureEvent) {
    const [earliest, latest] = getDateBounds(event.files);
    const isEventCovered = event.start > earliest && event.stop < latest;
    const allFilesDownloaded = !event.files.map((file) => maybeCleanupFile(event, file)).includes(false);
    event.stage = isEventCovered && allFilesDownloaded ? CaptureStage.Downloaded : event.stage;
  }

  private async downloadFile(event: RuntimeCaptureEvent, file: IPCamSearchRecord) {
    const cam = event.cam;
    const fullFilePath = makeLocalFilePath(event, file);

    // Potential clean-up or early bailout
    if (maybeCleanupFile(event, file)) return;

    const [awaiter, resolver, rejecter] = makeAwaiter();
    const remoteStream = await cam.downloadRecord(file.name);
    if (!remoteStream) throw new Error(`Missing remote event file ${file.name}`);
    const localStream = fs.createWriteStream(fullFilePath, { encoding: 'binary' });
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
    return awaiter.finally(() => maybeCleanupFile(event, file));
  }

  private async encodeEvents(): Promise<void> {
    const events = this.getEventsByStage(CaptureStage.Encoding).sort(sortEventsAsc);
    for (const event of events) {
      if (this.stopNow) break;
      try {
        const mediaFolderPath = makeLocalEventPath(event);
        const [earliestFileTime] = getDateBounds(event.files);
        const eventDurationMs = Math.abs(differenceInMilliseconds(event.start, event.stop));
        const startTimeOffsetMs = Math.abs(differenceInMilliseconds(earliestFileTime, event.start));

        const finalVideo = await mergeMOVFiles(mediaFolderPath, eventDurationMs, startTimeOffsetMs, (message, args) =>
          logForEvent(event, message, args)
        );
        if (fs.existsSync(finalVideo)) {
          for (const file of event.files) {
            const localPath = makeLocalFilePath(event, file);
            fs.rmSync(localPath, { force: true });
          }
        }
        event.stage = CaptureStage.Encoded;
      } catch (e) {
        console.error('Encoding error ', e);
      }
    }
  }

  private getEventsByStage(...stage: CaptureStage[]): RuntimeCaptureEvent[] {
    const matches: RuntimeCaptureEvent[] = [];
    for (const camAlias in this.captureData.captures) {
      const events = this.captureData.captures[camAlias] as RuntimeCaptureEvent[];
      for (const event of events) {
        if (stage.includes(event.stage)) {
          matches.push(this.ensureRuntimeEvent(event));
        }
      }
    }
    return matches;
  }

  private getAllEvents(): RuntimeCaptureEvent[] {
    const matches: RuntimeCaptureEvent[] = [];
    for (const camAlias in this.captureData.captures) {
      const events = this.captureData.captures[camAlias] as RuntimeCaptureEvent[];
      for (const event of events) {
        matches.push(this.ensureRuntimeEvent(event));
      }
    }
    return matches;
  }

  private ensureRuntimeEvent(event: RuntimeCaptureEvent): RuntimeCaptureEvent {
    if (!event.cam || !(event.cam instanceof IPCam)) {
      event.cam = new IPCam(Config.getCamOptsByIP(event.params.camIp));
    }
    if (!event.giffer || !(event.giffer instanceof GIFEncoder)) {
      event.giffer = this.makeGiffer(event);
    }
    if (!event.canvas || !(event.canvas instanceof Canvas)) {
      event.canvas = createCanvas(GIF_DIMS.width, GIF_DIMS.height);
    }
    return event;
  }

  private makeGiffer(event: RuntimeCaptureEvent): GIFEncoder {
    const localEventPath = makeLocalEventPath(event);
    const giffer = new GIFEncoder(GIF_DIMS.width, GIF_DIMS.height);
    const gifFinalPath = path.resolve(localEventPath, 'event.gif');

    giffer.createReadStream().pipe(fs.createWriteStream(gifFinalPath));
    giffer.start();
    giffer.setRepeat(0);
    giffer.setDelay(500);
    giffer.setQuality(10);

    return giffer;
  }

  private updateCaptureStages() {
    const now = new Date();
    const completed: CaptureEvent[] = [];
    for (const camId in this.captureData.captures) {
      const events = this.captureData.captures[camId];
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
          default:
            continue;
        }
      }
    }

    this.processMetadata();
    for (const event of completed) {
      const index = this.captureData.captures[event.params.camId].indexOf(event);
      if (index >= 0) this.captureData.captures[event.params.camId].splice(index, 1);
    }
  }

  private findExtensibleCapture(camAlias: string, start: Date): [number, CaptureEvent | undefined] {
    const index = this.captureData.captures[camAlias]?.findIndex((c) => start >= c.start && start <= c.until);
    return [index, index >= 0 ? this.captureData.captures[camAlias][index] : undefined];
  }

  private handleCapturePersist(k: RCEKeyType, v: any) {
    const banned: RCEKeyType[] = ['cam', 'giffer', 'canvas'];
    if (banned.includes(k)) return undefined;
    return v;
  }

  private writeCaptureData(): CaptureEventFile {
    const obj = { ...this.captureData, timestamp: Date.now(), cam: undefined } as CaptureEventFile;
    obj.captures = obj.captures || {};
    const data = JSON.stringify(obj, this.handleCapturePersist, 2);
    fs.writeFileSync(this.configFilePath, data, 'utf-8');
    return obj;
  }

  private readCaptureData(): CaptureEventFile {
    const exists = fs.existsSync(this.configFilePath);
    if (!exists) {
      return this.writeCaptureData();
    }
    const data = fs.readFileSync(this.configFilePath, 'utf-8');
    const result = JSON.parse(data) as CaptureEventFile;

    Object.values(result.captures).forEach((cl) =>
      cl.forEach((ce) => {
        ce.stop = new Date(ce.stop as unknown as string);
        ce.start = new Date(ce.start as unknown as string);
        ce.files.forEach((f) => {
          f.end_time = new Date(f.end_time);
          f.start_time = new Date(f.start_time);
        });
      })
    );

    return result;
  }
}
