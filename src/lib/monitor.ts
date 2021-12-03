import fs from 'fs';
import path from 'path';
import { IPCam } from './reecam';
import { IPCamRecorder } from './recorder';
import { toEpoch, toShortDateTime } from './utils';
import { IPCamAlarmStatus, IPCamOptions, IPCamParams } from './reecam.types';
import { IPCamAlarm, IPCamAlarmCache, IPCamParamCache, IPCamRecorderCache } from './monitor.types';

const MAX_EVENT_ELAPSE_MINS = 10;

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

    const inactiveAlarms = camAlarms.filter((c) => !c.isAlarmed && this.camMonitors.includes(c.cam.ip));
    for (const alarm of inactiveAlarms) {
      const { alias, ip } = alarm.cam;
      if (this.camRecorders[ip]) {
        if (!this.camRecorders[ip].stopping) {
          console.log(`${shortDateTime}\t${alias} (${ip}) stopped alarming`);
          await this.camRecorders[ip].stop((r) => {
            if (r.renewedTime.minutes >= MAX_EVENT_ELAPSE_MINS) {
              Reflect.deleteProperty(this.camRecorders, ip);
              this.camMonitors.splice(this.camMonitors.indexOf(ip), 1);
            }
          });
        } else {
          this.camRecorders[ip].continue();
        }
      }
    }

    const triggeredAlarms = camAlarms.filter((c) => c.isAlarmed && !this.camMonitors.includes(c.cam.ip));
    const triggeredIPs = triggeredAlarms
      .filter((alarm) => !this.camMonitors.includes(alarm.cam.ip))
      .map((a) => a.cam.ip);
    this.camMonitors.push(...triggeredIPs);
    for (const alarm of triggeredAlarms) {
      const { cam, params } = alarm;
      const { alias, ip } = cam;
      console.log(`${shortDateTime}\t${alias} (${ip}) started alarming`);
      if (!this.camRecorders[ip]) {
        const dataDir = await this.getCamDataPath(params);
        const eventDir = path.resolve(dataDir, epochTime);
        this.camRecorders[ip] = new IPCamRecorder(cam, eventDir).start();
      }
    }

    const resumedAlarms = camAlarms.filter((c) => c.isAlarmed && this.camMonitors.includes(c.cam.ip));
    for (const alarm of resumedAlarms) {
      const { ip, alias } = alarm.cam;
      const { renewedTime } = this.camRecorders[ip];
      const renewSeconds = alarm.params.alarm_record_time;
      if (renewedTime.seconds >= renewSeconds) {
        console.log(`${shortDateTime}\t${alias} (${ip}) resumed alarming`);
        this.camRecorders[ip].renew();
      }
    }

    const activeIPs = camAlarms.filter((c) => c.isAlarmed && this.camMonitors.includes(c.cam.ip)).map((a) => a.cam.ip);
    await Promise.all(activeIPs.map((ip) => this.camRecorders[ip].continue()));
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
    if (!this.interval) {
      this.interval = setInterval(this.checkAllAlarmStates, 500);
      console.log(`Started monitoring ${this.options.length} cameras...`);
    }
    return this;
  }

  stop(force = false): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
      console.log(`Monitoring stopped!`);
      Object.values(this.camRecorders).forEach((r) => r.stop(null, force));
    }
  }
}
