import GIFEncoder from 'gifencoder';

import { IPCam } from './reecam';
import { IPCamParams, IPCamSearchRecord } from './reecam.types';

export enum CaptureStage {
  Active,
  Downloading,
  Downloaded,
  Encoding,
  Encoded,
  Complete,
}

export type CaptureEvent = {
  stop: Date;
  start: Date;
  stage: CaptureStage;
  frames: number;
  params: IPCamParams;
  files?: IPCamSearchRecord[];
  isGifFinal: boolean;
};

export type RuntimeCaptureEvent = CaptureEvent & {
  cam: IPCam;
  giffer: GIFEncoder;
};

export type CaptureEventFile = {
  timestamp: number;
  captures?: { [camId: string]: CaptureEvent[] };
};
