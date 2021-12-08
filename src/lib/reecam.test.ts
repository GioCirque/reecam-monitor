import dotenv from 'dotenv';
import { IPCam } from './reecam';
import { IPCamAlarmStatus } from './reecam.types';

const env = dotenv.config();
env.error && console.error(env.error);

describe('ReeCam Tests', () => {
  const credentials = { user: 'admin', pwd: process.env.REECAM_PWD };
  const camConfig = { alias: 'Test Cam', ip: process.env.REECAM_IP, credentials };

  it('Gets Camera Status As Expected', async () => {
    const cam = new IPCam(camConfig);
    const result = await cam.getStatus();
    expect(result).toBeDefined();
  });

  it('Gets Camera Alarm Status As Expected', async () => {
    const cam = new IPCam(camConfig);
    const result = await cam.getAlarmStatus();
    expect(result).toBeDefined();
    expect(IPCamAlarmStatus[result]).toBeDefined();
    expect(result in Object.values(IPCamAlarmStatus)).toBe(true);
  });

  it('Gets Camera Properties As Expected', async () => {
    const cam = new IPCam(camConfig);
    const result = await cam.getProperties();
    expect(result).toBeDefined();
  });

  it('Gets Camera Parameters As Expected', async () => {
    const cam = new IPCam(camConfig);
    const result = await cam.getParams();
    expect(result).toBeDefined();
  });

  it('Gets Camera Records As Expected', async () => {
    const cam = new IPCam(camConfig);
    const result = await cam.searchRecords();
    expect(result).toBeDefined();
    expect(result.error).toEqual(0);
    expect(result.result).toBeGreaterThanOrEqual(0);
    expect(result.record).toBeDefined();
    expect(result.record).toHaveLength(result.result);
  });

  it('Gets Camera Logs As Expected', async () => {
    const cam = new IPCam(camConfig);
    const result = await cam.getLogs();
    expect(result).toBeDefined();
    expect(result.error).toEqual(0);
    expect(result.log).toBeDefined();
    expect(result.log.length).toBeGreaterThanOrEqual(0);
  });

  it('Gets Camera Backup As Expected', async () => {
    const cam = new IPCam(camConfig);
    const result = await cam.configBackup();
    expect(result).toBeDefined();
  });

  it('Gets Camera Bad Auth As Expected', async () => {
    const cam = new IPCam(camConfig);
    const result = await cam.badAuth();
    expect(result).toBeDefined();
  });

  it('Gets Camera Snapshot As Expected', async () => {
    const cam = new IPCam(camConfig);
    const result = await cam.getSnapshot();
    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThanOrEqual(50000);
  });

  it('Downloads Camera Record As Expected', async () => {
    const cam = new IPCam(camConfig);
    const result = await cam.searchRecords();
    expect(result).toBeDefined();
    expect(result.error).toEqual(0);
    expect(result.result).toBeGreaterThan(0);
    expect(result.record).toBeDefined();
    expect(result.record).toHaveLength(result.result);

    const oldestSeq = Math.min(...result.record.map((r) => r.seq));
    const oldestRec = result.record.find((r) => r.seq === oldestSeq);
    expect(oldestRec).toBeDefined();
    expect(oldestRec.name).toBeDefined();

    const record = await cam.downloadRecord(oldestRec.name);
    expect(record).toBeDefined();

    let chunk: [];
    let dataSize = 0;
    const checkSize = 50000;
    let resolver: (...args: unknown[]) => void;
    const verifier = new Promise((resolve) => {
      resolver = resolve;
    });
    record.on('readable', () => {
      while (null !== (chunk = record.read())) {
        dataSize += chunk.length;
        if (dataSize >= checkSize) {
          record.emit('end');
          break;
        }
      }
    });
    record.on('end', () => {
      expect(dataSize).toBeGreaterThanOrEqual(checkSize);
      resolver();
    });
    return verifier;
  });

  it('Deletes Camera Record As Expected', async () => {
    const cam = new IPCam(camConfig);
    const result = await cam.searchRecords();
    expect(result).toBeDefined();
    expect(result.error).toEqual(0);
    expect(result.result).toBeGreaterThan(0);
    expect(result.record).toBeDefined();
    expect(result.record).toHaveLength(result.result);

    const oldestSeq = Math.min(...result.record.map((r) => r.seq));
    const oldestRec = result.record.find((r) => r.seq === oldestSeq);
    expect(oldestRec).toBeDefined();
    expect(oldestRec.name).toBeDefined();
    expect(async () => cam.deleteRecord(oldestRec.name)).not.toThrow();
  });
});
