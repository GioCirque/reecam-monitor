import fs from 'fs';
import path from 'path';
import Jimp from 'jimp';
import GIFEncoder from 'gifencoder';

import { IPCam } from './reecam';
import { Encoder } from './encoder';
import { TimeDiff, timeSince } from './utils';
import { IPCamSearchRecord } from './reecam.types';

const MAX_FRAME_COUNT = 60;
const GIF_DIMS_SMALL = true;
const GIF_DIMS_720P = { width: 1280, height: 720 };
const GIF_DIMS_1080P = { width: 1920, height: 1080 };
const GIF_DIMS = GIF_DIMS_SMALL ? GIF_DIMS_720P : GIF_DIMS_1080P;

export class IPCamRecorder {
  private triggerTime: Date;
  private renewalTime: Date;
  private frameCount: number;
  private isStopping: boolean;
  private gifFinalPath: string;
  private forceStopNow: boolean;
  private lastMatchCount: number;
  private downloadQueue: string[];
  private gifIsFinalized: boolean;
  private downloadActive: string[];
  private terminateTime: Date | null;
  private downloadComplete: string[];
  private readonly giffer: GIFEncoder;
  private earliestVideoTime: Date | null;
  private downloadPromise: Promise<void> | null;
  private terminateCallback: ((recorder: IPCamRecorder) => void) | null;

  constructor(private readonly cam: IPCam, private readonly dataPath: string) {
    this.frameCount = 0;
    this.isStopping = false;
    this.downloadQueue = [];
    this.lastMatchCount = 0;
    this.downloadActive = [];
    this.forceStopNow = false;
    this.downloadComplete = [];
    this.gifIsFinalized = false;
    this.downloadPromise = null;
    this.earliestVideoTime = null;
    this.triggerTime = this.renewalTime = new Date();
    this.giffer = new GIFEncoder(GIF_DIMS.width, GIF_DIMS.height);
    this.gifFinalPath = path.resolve(this.dataPath, 'event.gif');

    this.stop = this.stop.bind(this);
    this.canDL = this.canDL.bind(this);
    this.start = this.start.bind(this);
    this.renew = this.renew.bind(this);
    this.continue = this.continue.bind(this);
    this.snapshot = this.snapshot.bind(this);
    this.maybeFinalizeGif = this.maybeFinalizeGif.bind(this);
    this.checkDownloads = this.checkDownloads.bind(this);
    this.startDownloads = this.startDownloads.bind(this);
    this.processNextDownload = this.processNextDownload.bind(this);
  }

  get startTime(): Date {
    return this.triggerTime;
  }

  get runningTime(): TimeDiff {
    return timeSince(this.triggerTime);
  }

  get renewedTime(): TimeDiff {
    return timeSince(this.renewalTime);
  }

  get stopping(): boolean {
    return this.isStopping;
  }

  private async maybeFinalizeGif() {
    if (!this.gifIsFinalized && this.frameCount >= MAX_FRAME_COUNT) {
      this.giffer.finish();
    }
  }

  private async snapshot(): Promise<void> {
    if (this.frameCount >= MAX_FRAME_COUNT) return;

    this.frameCount++;
    const imageData = await this.cam.getSnapshot();
    const image = await Jimp.read(imageData).then((jimp) => {
      const smaller = jimp.resize(GIF_DIMS.width, GIF_DIMS.height);
      if (this.frameCount <= 5) {
        const latestSnapshotPath = path.resolve(this.dataPath, '..', 'snapshot.jpeg');
        smaller.write(latestSnapshotPath);
      }
      return smaller;
    });
    this.giffer.addFrame(image.bitmap.data);
    await this.maybeFinalizeGif();
  }

  private canDL(record: IPCamSearchRecord): boolean {
    const isQueued = this.downloadQueue.includes(record.name);
    const isDownloaded = this.downloadComplete.includes(record.name);
    const isDownloading = this.downloadActive.includes(record.name);
    const isAfter =
      record.start_time > this.renewalTime && (!this.terminateTime || record.start_time < this.terminateTime);
    const isContained = record.start_time <= this.renewalTime && record.end_time >= this.renewalTime;
    const result = !isQueued && !isDownloaded && !isDownloading && (isContained || isAfter);

    return result;
  }

  private async checkDownloads() {
    const result = await this.cam.searchRecords();
    if (!result) return;

    const matches = result.record.filter(this.canDL);
    const matchedFileNames = matches.map((m) => m.name);
    if (this.lastMatchCount !== matchedFileNames.length) {
      this.lastMatchCount = matchedFileNames.length;
    }
    const earliest = new Date(Math.min(...matches.map((m) => m.start_time.valueOf())));
    if (!this.earliestVideoTime || earliest < this.earliestVideoTime) {
      this.earliestVideoTime = earliest;
    }
    this.downloadQueue.push(...matchedFileNames);
    this.processNextDownload();
  }

  private async processNextDownload() {
    if (this.downloadPromise !== null) return;

    const fileName = this.downloadQueue.shift();
    if (!fileName) return;

    this.downloadActive.push(fileName);
    const fullFilePath = path.resolve(this.dataPath, fileName);
    const localStream = fs.createWriteStream(fullFilePath, { encoding: 'binary' });
    this.downloadPromise = new Promise<void>((resolve) => {
      this.cam.downloadRecord(fileName).then((remoteStream) => {
        remoteStream
          .on('close', () => {
            localStream.destroy();
            this.downloadComplete.push(...this.downloadActive.splice(this.downloadActive.indexOf(fileName), 1));
            resolve();
          })
          .on('data', () => {
            if (this.forceStopNow) {
              remoteStream.destroy();
            }
          })
          .on('error', console.error)
          .pipe(localStream);
      });
    })
      .catch((e) => {
        console.error(e);
        const actIndex = this.downloadActive.indexOf(fileName);
        const reQueue = this.downloadActive.splice(actIndex, 1);
        this.downloadQueue.push(...reQueue);
        fs.rmSync(fullFilePath, { force: true });
      })
      .finally(() => {
        this.downloadPromise = null;
        if (this.forceStopNow) return;

        const now = new Date();
        const allFilesDone = this.downloadQueue.length === 0 && this.downloadActive.length === 0;
        if (allFilesDone && this.terminateTime && now > this.terminateTime) {
          const eventDuration = timeSince(this.triggerTime, this.terminateTime);
          const eventLeadTime = timeSince(this.earliestVideoTime, this.triggerTime);
          Encoder.mergeMOVFiles(this.dataPath, eventDuration.ms, eventLeadTime.ms).finally(() => {
            this.terminateCallback && this.terminateCallback(this);
          });
        } else {
          this.startDownloads();
        }
      });
  }

  private startDownloads(): void {
    setImmediate(() => this.checkDownloads());
    return;
  }

  private startGifBuild() {
    fs.mkdirSync(this.dataPath, { recursive: true });
    this.giffer.createReadStream().pipe(fs.createWriteStream(this.gifFinalPath).on('error', console.error));
    this.giffer.start();
    this.giffer.setDelay(500);
    this.giffer.setQuality(10);
    this.giffer.setRepeat(0);
  }

  async continue(): Promise<void> {
    await this.snapshot();
    await this.checkDownloads();
  }

  start(): IPCamRecorder {
    this.startGifBuild();
    this.startDownloads();
    return this;
  }

  async stop(callback: ((recorder: IPCamRecorder) => void) | null, force = false): Promise<void> {
    this.isStopping = true;
    this.forceStopNow = force;
    this.terminateTime = new Date();
    this.terminateCallback = callback;

    this.terminateTime.setMinutes(this.terminateTime.getMinutes() + 2);

    await this.maybeFinalizeGif();
  }

  renew(): void {
    this.isStopping = false;
    this.terminateTime = null;
    this.renewalTime = new Date();
    this.terminateCallback = null;
    return;
  }
}
