import path from 'path';
import express from 'express';
import { getBasename } from '../app/src/utils/functions';

export const register = (app: express.Application): express.Application => {
  const maxAge = 2592000000;
  const appBaseName = getBasename();
  const appBuildPath = path.resolve(__dirname, '..', 'app', 'build');
  console.log(`Setting up router with basename '${appBaseName}'`);

  return app
    .use(`${appBaseName}`, express.static(appBuildPath, { immutable: true, maxAge }))
    .get('/', (req, res) => res.redirect(308, `${appBaseName || ''}`))
    .get(`(${appBaseName}/*)?`, (req, res) => {
      res.sendFile(path.join(appBuildPath, 'index.html'));
    });
};
