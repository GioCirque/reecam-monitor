export type IPCamMetaData = {
  id: string;
  ip: string;
  user: string;
  alias: string;
  snapshot: string;
  details: string;
  events: IPCamEvent[];
};

export type IPCamEvent = {
  date: Date;
  gif: string;
  video: string;
  stream: string;
};
