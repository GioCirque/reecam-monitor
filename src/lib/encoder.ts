import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { spawn, ChildProcess, SpawnOptions } from 'child_process';
import { msToTime } from './utils';

const spawnOpts: SpawnOptions = {
  shell: true,
  cwd: __dirname,
  stdio: ['ignore', 'inherit', 'inherit'],
};

type ChildProcessResult = { code: number; stdout: string; stderr: string };

export class Encoder {
  private static waitForProcess(childProcess: ChildProcess) {
    return new Promise<ChildProcessResult>((resolve, reject) => {
      const stdoutChunks: unknown[] = [];
      const stderrChunks: unknown[] = [];
      if (childProcess.stdout) childProcess.stdout.on('data', (chunk) => stdoutChunks.push(chunk));
      if (childProcess.stderr) childProcess.stderr.on('data', (chunk) => stderrChunks.push(chunk));
      childProcess.once('exit', (code: number) => {
        if (code === 0) {
          resolve({
            code,
            stdout: stdoutChunks.join('\n').trim(),
            stderr: stderrChunks.join('\n').trim(),
          });
        } else {
          reject(code);
        }
      });
      childProcess.once('error', reject);
    });
  }

  static async mergeMOVFiles(mediaFolder: string, durationMs: number, startOffsetMs: number): Promise<string> {
    if (!mediaFolder || mediaFolder.length === 0 || !fs.existsSync(mediaFolder))
      throw new Error('Cannot merge files from a non-existent folder.');

    const movFiles = fs
      .readdirSync(mediaFolder, { withFileTypes: true })
      .filter((e) => e.name.toLowerCase().endsWith('.mov'))
      .map((e) => e.name);
    if (!movFiles || movFiles.length === 0) throw new Error('Cannot merge non-existent video files.');

    let startingOffset = msToTime(startOffsetMs);

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
    const result = await Encoder.waitForProcess(spawn('ffmpeg', ffmpegArgs, { ...spawnOpts, cwd: mediaFolder }));
    if (result.code === 0) {
      fs.rmSync(indexFilePath);
      movFiles.forEach((f) => fs.rmSync(path.resolve(mediaFolder, f)));
      fs.renameSync(tempFilePath, outputFilePath);
    }

    return path.resolve(mediaFolder, outputFileName);
  }
}
