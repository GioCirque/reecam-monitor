import path from 'path';
import { IPCam } from './reecam';
import { toEpoch, toShortDateTime } from './utils';
import { IPCamAlarm, IPCamAlarmCache, IPCamParamCache, IPCamRecorderCache } from './monitor.types';
import { IPCamAlarmStatus, IPCamOptions, IPCamParams } from './reecam.types';
import { IPCamRecorder } from './recorder';

export class CamMonitor {
  private readonly cams: IPCam[];
  private isChecking = false;
  private interval: NodeJS.Timer;
  private readonly camMonitors: string[];
  private readonly camParams: IPCamParamCache;
  private readonly camAlarms: IPCamAlarmCache;
  private readonly camRecorders: IPCamRecorderCache;

  constructor(private readonly options: IPCamOptions[], private readonly outputDir: string) {
    this.cams = options.map((o) => new IPCam(o));
    this.camParams = {};
    this.camAlarms = {};
    this.camMonitors = [];
    this.camRecorders = {};

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
    const date = new Date();
    const shortDateTime = toShortDateTime(date);
    const epochTime = toEpoch(date).toString();

    const inactiveIPs = camAlarms
      .filter((c) => !c.isAlarmed && this.camMonitors.includes(c.cam.ip))
      .map((a) => a.cam.ip);
    for (const ip of inactiveIPs) {
      console.log(`${shortDateTime}\tCam ${ip} stopped alarming`);
      this.camMonitors.splice(this.camMonitors.indexOf(ip), 1);
      if (this.camRecorders[ip]) {
        await this.camRecorders[ip].stop();
        Reflect.deleteProperty(this.camRecorders, ip);
      }
    }

    const triggeredIPs = camAlarms
      .filter((c) => c.isAlarmed && !this.camMonitors.includes(c.cam.ip))
      .map((a) => a.cam.ip);
    this.camMonitors.push(...triggeredIPs.filter((ip) => !this.camMonitors.includes(ip)));
    for (const ip of triggeredIPs) {
      console.log(`${shortDateTime}\tCam ${ip} started alarming`);
      if (!this.camRecorders[ip]) {
        const ca = camAlarms.find((a) => a.cam.ip === ip);
        const dataDir = path.resolve(this.outputDir, ca.params.id, epochTime);
        this.camRecorders[ip] = new IPCamRecorder(ca.cam, dataDir).start();
      }
    }

    const activeIPs = camAlarms.filter((c) => c.isAlarmed && this.camMonitors.includes(c.cam.ip)).map((a) => a.cam.ip);
    await Promise.all(activeIPs.map((ip) => this.camRecorders[ip].continue()));
  }

  start(): void {
    if (!this.interval) {
      this.interval = setInterval(this.checkAllAlarmStates, 500);
      console.log(`Started monitoring ${this.options.length} cameras...`);
    }
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
      console.log(`Monitoring stopped!`);
    }
  }
}
