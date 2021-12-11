export type IPCamMetaData = {
  id: string;
  ip: string;
  user: string;
  alias: string;
  isAlarmed: boolean;
  snapshot: string;
  details: string;
  events: IPCamEvent[];
};

export type IPCamEvent = {
  id: number;
  gif: string;
  video: string;
  stream: string;
  elapsed: string;
  start: number;
  stop: number;
  stage: number;
  stageName: string;
  hasGif: boolean;
  hasVid: boolean;
  isAlarmed: boolean;
};

export type AppData = IPCamMetaData[];
