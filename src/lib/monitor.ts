import fs from 'fs';
import path from 'path';
import { IPCam } from './reecam';
import { Capturer } from './capturer';
import { CamParams } from './capturer.types';
import { IPCamAlarmStatus, IPCamOptions, IPCamParams } from './reecam.types';
import { IPCamAlarm, IPCamAlarmCache, IPCamParamCache } from './monitor.types';

export class CamMonitor {
  private readonly cams: IPCam[];
  private isChecking = false;
  private interval: NodeJS.Timer;
  private readonly capturer = new Capturer();
  private readonly camParams: IPCamParamCache;
  private readonly camAlarms: IPCamAlarmCache;

  constructor(private readonly options: IPCamOptions[], private readonly outputDir: string) {
    this.cams = options.map((o) => new IPCam(o));
    this.camParams = {};
    this.camAlarms = {};

    this.stop = this.stop.bind(this);
    this.start = this.start.bind(this);
    this.getCamCache = this.getCamCache.bind(this);
    this.handleAlarmChanges = this.handleAlarmChanges.bind(this);
    this.checkCamAlarmState = this.checkCamAlarmState.bind(this);
    this.checkAllAlarmStates = this.checkAllAlarmStates.bind(this);
  }

  private async getCamCache(cam: IPCam): Promise<IPCamParams> {
    this.camParams[cam.ip] = this.camParams[cam.ip] || (await cam.getParams());
    return this.camParams[cam.ip];
  }

  private async getAlarmChanges(cams: IPCam[]): Promise<IPCamAlarm[]> {
    const alarmStates = await Promise.all(cams.map((c) => this.checkCamAlarmState(c)));
    return alarmStates.filter(
      (as) => !this.camAlarms[as.cam.ip] || as.isAlarmed !== this.camAlarms[as.cam.ip].isAlarmed
    );
  }

  private async checkAllAlarmStates(): Promise<void> {
    if (this.isChecking) return;
    else this.isChecking = true;
    try {
      const alarmChanges = await this.getAlarmChanges(this.cams);
      this.handleAlarmChanges(alarmChanges);
    } catch (e) {
      console.log(e);
    } finally {
      this.isChecking = false;
    }
  }

  private async checkCamAlarmState(cam: IPCam): Promise<IPCamAlarm> {
    const params = await this.getCamCache(cam);
    const alarm = await cam.getAlarmStatus();
    return { cam, params, alarm, isAlarmed: alarm !== IPCamAlarmStatus.NO_ALARM };
  }

  private async handleAlarmChanges(camAlarms: IPCamAlarm[]): Promise<void> {
    const now = new Date();
    for (const camAlarm of camAlarms.filter((c) => c.isAlarmed)) {
      const params: CamParams = {
        camIp: camAlarm.cam.ip,
        camId: camAlarm.params.id,
        alarmSeconds: camAlarm.params.alarm_period,
      };
      this.capturer.addEvent(params, now);
    }
  }

  private async getCamDataPath(cam: IPCam | IPCamParams) {
    const camData = cam instanceof IPCam ? await this.getCamCache(cam) : cam;
    const dataDir = path.resolve(this.outputDir, camData.id);
    return dataDir;
  }

  private async writeMetaData() {
    for (const cam of this.cams) {
      const camDataPath = await this.getCamDataPath(cam);
      const metaDataPath = path.resolve(camDataPath, 'metadata.json');
      const metaDataObject = { alias: cam.alias, ip: cam.ip, user: cam.user };
      fs.writeFileSync(metaDataPath, JSON.stringify(metaDataObject), { encoding: 'utf-8' });
    }
  }

  start(): CamMonitor {
    this.writeMetaData();
    this.capturer.start();
    if (!this.interval) {
      this.interval = setInterval(this.checkAllAlarmStates, 500);
      console.log(`Started monitoring ${this.options.length} cameras...`);
    }
    return this;
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
    this.capturer.stop();
    console.log(`Monitoring stopped!`);
  }
}
