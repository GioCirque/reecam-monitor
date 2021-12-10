import { Canvas } from 'canvas';
import GIFEncoder from 'gifencoder';

import { IPCam } from './reecam';
import { IPCamSearchRecord } from './reecam.types';

export enum CaptureStage {
  Active,
  Downloading,
  Downloaded,
  Encoding,
  Encoded,
  Complete,
}

export type CamParams = { camId: string; camIp: string; alarmSeconds: number };

export type CaptureEvent = {
  stop: Date;
  start: Date;
  stage: CaptureStage;
  frames: number;
  params: CamParams;
  files?: IPCamSearchRecord[];
  isGifFinal: boolean;
};

export type RuntimeCaptureEvent = CaptureEvent & {
  cam: IPCam;
  canvas: Canvas;
  giffer: GIFEncoder;
};

export type CaptureEventFile = {
  timestamp: number;
  captures?: { [camId: string]: CaptureEvent[] };
};
