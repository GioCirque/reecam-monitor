import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { SpawnOptions } from 'child_process';

import { msToTime, waitForProcess } from './utils';

const spawnOpts: SpawnOptions = {
  shell: true,
  cwd: __dirname,
  stdio: ['ignore', 'inherit', 'inherit'],
};

export type EncoderLogger = typeof console.log;

export async function mergeMOVFiles(
  mediaFolder: string,
  durationMs: number,
  startOffsetMs: number,
  logger: EncoderLogger
): Promise<string | undefined> {
  if (!mediaFolder || mediaFolder.length === 0 || !fs.existsSync(mediaFolder))
    throw new Error('Cannot merge files from a non-existent folder.');

  const movFiles = fs
    .readdirSync(mediaFolder, { withFileTypes: true })
    .filter((e) => e.name.toLowerCase().endsWith('.mov'))
    .map((e) => e.name);
  if (!movFiles || movFiles.length === 0) throw new Error('Cannot merge non-existent video files.');

  let startingOffset = msToTime(startOffsetMs).replace('NaN', '0');

  const outputFileName = 'event.mp4';
  const outputDuration = msToTime(durationMs);
  const outputFilePath = path.resolve(mediaFolder, outputFileName);
  if (fs.existsSync(outputFilePath)) {
    startingOffset = '0';
    movFiles.unshift(outputFileName);
  }

  const indexFileName = 'index.txt';
  const indexFilePath = path.resolve(mediaFolder, indexFileName);
  const indexFileData = movFiles.map((f) => `file '${f}'`).join('\n');
  fs.writeFileSync(indexFilePath, indexFileData, { encoding: 'utf-8' });

  const tempFileName = `${uuid().replace(/-/g, '')}.mp4`;
  const tempFilePath = path.resolve(mediaFolder, tempFileName);
  const ffmpegArgs = [
    '-loglevel panic',
    '-y',
    '-f concat',
    '-safe 0',
    `-ss ${startingOffset}`,
    `-i ${indexFileName}`,
    '-q:v 0',
    '-movflags +faststart',
    '-vcodec copy',
    '-acodec aac',
    `-t ${outputDuration}`,
    tempFileName,
  ];

  try {
    const fileOrFiles = `file${movFiles.length > 1 ? 's' : ''}`;
    logger(`Encoding started on ${movFiles.length} ${fileOrFiles} for ${outputDuration} from ${startingOffset}`);
    logger(`ffmpeg ${ffmpegArgs.join(' ')}`);

    /**    THIS IS THE IMPORTANT CALL! THIS ONE RIGHT HERE!    **/
    const result = await waitForProcess('ffmpeg', ffmpegArgs, { ...spawnOpts, cwd: mediaFolder });

    logger(`Encoding completed with code ${result.code}`);
    if (result.code === 0) {
      fs.rmSync(indexFilePath);
      if (fs.existsSync(outputFilePath)) {
        fs.rmSync(outputFilePath, { force: true });
      }
      fs.renameSync(tempFilePath, outputFilePath);
    }
    return path.resolve(mediaFolder, outputFileName);
  } catch (e) {
    logger(`Encoding failed `, e);
  }
  return undefined;
}
