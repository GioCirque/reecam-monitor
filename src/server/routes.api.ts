import fs from 'fs';
import express, { Response } from 'express';

import { Config } from '../lib/config';
import { toEpoch } from '../lib/utils';
import { deleteCamEvent, getCamEventAsset, getCamEventAssetPath, getCamsList, getCamSnapshot } from './api';

export const registerApi = (app: express.Application): express.Application => {
  const withHeaders = <T extends Response>(res: T, maxAgeSeconds = 4): T => {
    return res.header('Cache-Control', `private, max-age=${maxAgeSeconds}`);
  };
  return app
    .use(express.json())
    .get('/api', (req, res) => {
      withHeaders(res).json({ time: Date.now() });
    })
    .post('/api/logout', (req, res) => {
      withHeaders(res).clearCookie('token').sendStatus(204);
    })
    .post('/api/login', (req, res) => {
      try {
        const { email, password } = req.body as { email: string; password: string };
        const user = Config.checkUser(email);
        const config = Config.readStoredConfigData();
        const cam = config.cams.find((cam) => cam.credentials.pwd === password);
        if (user && cam) {
          const expires = new Date();
          expires.setDate(expires.getDay() + 90);
          const token = Buffer.from(JSON.stringify({ ...user, expires: toEpoch(expires) })).toString('base64');
          withHeaders(res).cookie('token', token, { expires, httpOnly: false }).send(user);
        } else {
          res.status(403).send('Invalid credentials');
        }
      } catch (e) {
        res.status(500).send(e);
      }
    })
    .get('/api/cams', (req, res) => {
      withHeaders(res).json(getCamsList());
    })
    .get('/api/cams/:camId', (req, res) => {
      withHeaders(res).json(getCamsList(req.params.camId as string).shift());
    })
    .get('/api/cams/:camId/snapshot.jpeg', (req, res) => {
      const { camId } = req.params;
      const [data, type] = getCamSnapshot(camId);
      const ext = type.split('/').pop();
      withHeaders(res, 240)
        .status(200)
        .set('Content-Type', type)
        .set('Content-Disposition', `attachment; filename="snapshot-${Date.now()}.${ext}"`)
        .send(data);
    })
    .get('/api/cams/:camId/:eventId(\\d+)/:assetName(event.gif|video.mp4)', (req, res) => {
      const { camId, eventId, assetName } = req.params;
      if (assetName !== 'event.gif' && assetName !== 'video.mp4') {
        res.status(400).send('Invalid asset type provided. Must be gif or video.');
        return;
      }
      const assetType = assetName === 'event.gif' ? 'gif' : 'video';
      const [data, type] = getCamEventAsset(camId, eventId, assetType);
      res
        .status(200)
        .set('Content-Type', type)
        .set('Content-Disposition', `attachment; filename="${camId}-${eventId}.${type.split('/').pop()}"`)
        .send(data);
    })
    .all('/api/cams/:camId/:eventId(\\d+)/stream.mp4', (req, res) => {
      const { camId, eventId } = req.params;
      const [streamFilePath, mimeType] = getCamEventAssetPath(camId, eventId, 'video');
      fs.stat(streamFilePath, (err, stats) => {
        if (err) {
          if (err.code === 'ENOENT') {
            // 404 Error if file not found
            return res.sendStatus(404);
          }
          res.end(err);
        }
        const range = req.headers.range || 'bytes=0-1024';
        if (!range) {
          // 416 Wrong range
          return res.sendStatus(416);
        }
        const positions = range.replace(/bytes=/, '').split('-');
        const start = parseInt(positions[0], 10);
        const total = stats.size;
        const end = positions[1] ? parseInt(positions[1], 10) : total - 1;
        const chunkSize = end - start + 1;

        withHeaders(res).writeHead(206, {
          'Accept-Ranges': 'bytes',
          'Content-Type': mimeType,
          'Content-Range': `bytes ${start}-${end}/${total}`,
          'Content-Length': chunkSize,
        });

        const stream = fs
          .createReadStream(streamFilePath, { start: start, end: end })
          .on('open', function () {
            stream.pipe(res);
          })
          .on('error', function (err) {
            res.end(err);
          });
      });
    })
    .delete('/api/cams/:camId/:eventId(\\d+)', (req, res) => {
      const { password } = req.query;
      const config = Config.readStoredConfigData();
      const cam = config.cams.find((cam) => cam.credentials.pwd === password);

      const { camId, eventId } = req.params;
      if (cam) {
        deleteCamEvent(camId, eventId);
        withHeaders(res).status(200).json(getCamsList());
      } else {
        res.sendStatus(403);
      }
    });
};
