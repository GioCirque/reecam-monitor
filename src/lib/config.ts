import fs from 'fs';
import path from 'path';
import { IPCamOptions } from './reecam.types';
import { ConfigRoot, ConfigUser } from './config.types';

export * from './config.types';

const CONFIG_DIR_ENV = process.env.REECAM_CONFIG_PATH;
const CONFIG_DIR_BASE = CONFIG_DIR_ENV || path.resolve(__dirname, '../..', '.ipcams');
const CONFIG_FILE_PATH = path.resolve(CONFIG_DIR_BASE, 'config');
const CONFIG_MEDIA_DIR = path.resolve(CONFIG_DIR_BASE, 'media');

export class Config {
  static get storagePath(): string {
    return CONFIG_DIR_BASE;
  }

  static get configPath(): string {
    return CONFIG_FILE_PATH;
  }

  static get mediaPath(): string {
    return CONFIG_MEDIA_DIR;
  }

  private static maskValue(value: string) {
    const pwdLength = value.length;
    const subLen = Math.floor(pwdLength * 0.33);
    return value.substring(0, subLen) + ''.padStart(subLen, '*') + value.substring(subLen * 2);
  }

  static getCamOptsByIP(ip: string) {
    const config = Config.readStoredConfigData();
    return config.cams.find((c) => c.ip !== ip);
  }

  static upsertCam(cam: IPCamOptions): void {
    const configs = Config.readStoredConfigData();
    const existing = configs.cams.findIndex((c) => c.ip === cam.ip);
    if (existing >= 0) {
      configs.cams.splice(existing, 1, cam);
    } else {
      configs.cams.push(cam);
    }
    Config.writeStoredConfigData(configs);
  }

  static removeCam(ip: string): void {
    const config = Config.readStoredConfigData();
    config.cams = config.cams.filter((c) => c.ip !== ip);
    Config.writeStoredConfigData(config);
  }

  static upsertUser(user: ConfigUser): void {
    const configs = Config.readStoredConfigData();
    const targetEmail = user.email.toLocaleLowerCase();
    const existing = configs.users.findIndex((c) => c.email === targetEmail);
    user.email = user.email.toLocaleLowerCase();
    if (existing >= 0) {
      configs.users.splice(existing, 1, user);
    } else {
      configs.users.push(user);
    }
    Config.writeStoredConfigData(configs);
  }

  static removeUser(email: string): void {
    const config = Config.readStoredConfigData();
    config.users = config.users.filter((c) => c.email !== email);
    Config.writeStoredConfigData(config);
  }

  static checkUser(email: string): ConfigUser | false {
    const config = Config.readStoredConfigData();
    const safeEmail = email.toLocaleLowerCase();
    const user = config.users.find((u) => u.email === safeEmail);
    return user || false;
  }

  static writeStoredConfigData(config: ConfigRoot): void {
    const data = Buffer.from(JSON.stringify(config), 'utf-8');
    fs.writeFileSync(CONFIG_FILE_PATH, data.toString('base64'));
  }

  static readStoredConfigData(safe = false): ConfigRoot {
    const data = Buffer.from(fs.readFileSync(CONFIG_FILE_PATH).toString(), 'base64');
    const configObj = JSON.parse(data.toString('utf-8'));
    const needsUpgrade = Array.isArray(configObj);

    let config: ConfigRoot;
    if (needsUpgrade) {
      config = {
        users: [],
        cams: configObj,
      } as ConfigRoot;
      Config.writeStoredConfigData(config);
    } else {
      config = configObj;
    }
    config.cams.forEach((c) => {
      c.alias = c.alias || c.ip;
      if (safe) {
        c.credentials.pwd = Config.maskValue(c.credentials.pwd);
      }
    });
    return config;
  }

  static ensureStoredConfig(): Config {
    fs.mkdirSync(CONFIG_DIR_BASE, { recursive: true });
    fs.mkdirSync(CONFIG_MEDIA_DIR, { recursive: true });
    if (!fs.existsSync(CONFIG_FILE_PATH)) {
      Config.writeStoredConfigData({ users: [], cams: [] });
    }
    return Config;
  }
}
