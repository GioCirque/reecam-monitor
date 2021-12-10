import fs from 'fs';
import path from 'path';

import { Config } from '../lib/config';
import { IPCamEvent, IPCamMetaData } from './api.types';

const DEFAULT_SNAPSHOT_FILE = path.resolve(__dirname, '..', 'assets', 'snapshot.png');

function getCamDirs(): fs.Dirent[] {
  return fs.readdirSync(Config.mediaPath, { withFileTypes: true }).filter((entry) => {
    return entry.isDirectory() && fs.existsSync(path.resolve(Config.mediaPath, entry.name, 'metadata.json'));
  });
}

function getCamEvents(camPath: string, alias: string): IPCamEvent[] {
  const camEventPath = path.resolve(Config.mediaPath, camPath);
  return fs
    .readdirSync(camEventPath, { withFileTypes: true })
    .filter((entry) => {
      const gifPath = path.resolve(camEventPath, entry.name, 'event.gif');
      const isMatch = entry.isDirectory() && !Number.isNaN(entry.name) && fs.existsSync(gifPath);
      return isMatch;
    })
    .map((entry) => {
      const epoch = parseInt(entry.name);
      const metadata = JSON.parse(fs.readFileSync(path.resolve(camEventPath, entry.name, 'metadata.json'), 'utf-8'));
      return {
        ...metadata,
        id: epoch,
        stop: new Date(metadata.stop).valueOf(),
        start: new Date(metadata.start).valueOf(),
        gif: `/api/cams/${alias}/${epoch}/gif`,
        video: `/api/cams/${alias}/${epoch}/video`,
        stream: `/api/cams/${alias}/${epoch}/stream`,
      } as IPCamEvent;
    });
}

function getCamMetas(): IPCamMetaData[] {
  return getCamDirs().map((entry) => {
    const meta = JSON.parse(
      fs.readFileSync(path.resolve(Config.mediaPath, entry.name, 'metadata.json')).toString()
    ) as IPCamMetaData;
    meta.id = entry.name;
    meta.alias = meta.alias.replace(/\s+/g, '-');
    meta.details = `/api/cams/${meta.alias}`;
    meta.snapshot = `/api/cams/${meta.alias}/snapshot`;
    meta.events = getCamEvents(entry.name, meta.alias);
    return meta;
  });
}

export function getCamSnapshot(idFilter: string): [Buffer, string] {
  const camId = getCamMetas()
    .filter((meta) => !idFilter || meta.alias === idFilter || meta.ip === idFilter)
    .shift().id;
  const snapshotFile = path.resolve(Config.mediaPath, camId, 'snapshot.jpeg');
  const finalSnapshotFile = fs.existsSync(snapshotFile) ? snapshotFile : DEFAULT_SNAPSHOT_FILE;
  return [fs.readFileSync(finalSnapshotFile), `image/${path.extname(finalSnapshotFile).substring(1)}`];
}

export function getCamEventAsset(idFilter: string, eventId: string, assetType: 'gif' | 'video'): [Buffer, string] {
  const [assetFile, assetMime] = getCamEventAssetPath(idFilter, eventId, assetType);
  return [fs.readFileSync(assetFile), assetMime];
}

export function getCamEventAssetPath(idFilter: string, eventId: string, assetType: 'gif' | 'video'): [string, string] {
  const camId = getCamMetas()
    .filter((meta) => !idFilter || meta.alias === idFilter || meta.ip === idFilter)
    .shift().id;
  const assetName = assetType === 'gif' ? 'event.gif' : 'event.mp4';
  const assetMime = assetType === 'gif' ? 'image/gif' : 'video/mp4';
  const assetFile = path.resolve(Config.mediaPath, camId, eventId, assetName);
  return [assetFile, assetMime];
}

export function getCamsList(idFilter?: string): IPCamMetaData[] {
  return getCamMetas().filter((meta) => !idFilter || meta.alias === idFilter || meta.ip === idFilter);
}

export function deleteCamEvent(idFilter: string, eventId: string) {
  const camId = getCamMetas()
    .filter((meta) => !idFilter || meta.alias === idFilter || meta.ip === idFilter)
    .shift().id;
  const eventPath = path.resolve(Config.mediaPath, camId, eventId);
  fs.rmSync(eventPath, { recursive: true, force: true });
}
