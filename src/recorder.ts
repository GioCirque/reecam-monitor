import fs from 'fs';
import path from 'path';
import Jimp from 'jimp';
import GIFEncoder from 'gifencoder';

import { IPCam } from './reecam';

const MAX_FRAME_COUNT = 55;
export class IPCamRecorder {
  private frameCount: number;
  private gifFinalPath: string;
  private gifIsFinalized: boolean;
  private readonly giffer: GIFEncoder;

  constructor(private readonly cam: IPCam, private readonly dataPath: string) {
    this.frameCount = 0;
    this.gifIsFinalized = false;
    this.giffer = new GIFEncoder(1920, 1080);
    this.gifFinalPath = path.resolve(this.dataPath, 'event.gif');

    fs.mkdirSync(this.dataPath, { recursive: true });
    this.giffer.createReadStream().pipe(fs.createWriteStream(this.gifFinalPath));
  }

  private async finalizeGif() {
    if (!this.gifIsFinalized) {
      this.giffer.finish();
    }
  }

  private async snapshot(): Promise<void> {
    const imageData = await this.cam.getSnapshot();
    const image = await Jimp.read(imageData);
    this.giffer.addFrame(image.bitmap.data);
    this.frameCount++;
    if (this.frameCount >= MAX_FRAME_COUNT) {
      await this.finalizeGif();
    }
  }

  async continue(): Promise<void> {
    // Add other tracking aspects to the following call
    await Promise.all([this.snapshot]);
  }

  start(): IPCamRecorder {
    this.giffer.start();
    this.giffer.setDelay(500);
    this.giffer.setQuality(5);
    this.giffer.setRepeat(0);

    return this;
  }

  async stop(): Promise<void> {
    if (this.frameCount < MAX_FRAME_COUNT) {
      await this.finalizeGif();
    }
  }
}
