import { IPCamOptions } from './reecam.types';

export type ConfigUser = {
  email: string;
  alias: string;
};

export type ConfigRoot = {
  users: ConfigUser[];
  cams: IPCamOptions[];
};
