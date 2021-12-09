import { IPCam } from './reecam';
import { IPCamAlarmStatus, IPCamParams } from './reecam.types';

export type IPCamAlarm = {
  cam: IPCam;
  params: IPCamParams;
  alarm: IPCamAlarmStatus;
  isAlarmed: boolean;
};

export type IPCamAlarmCache = { [key: string]: IPCamAlarm };
export type IPCamParamCache = { [key: string]: IPCamParams };
