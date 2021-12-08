import path from 'path';
import express from 'express';
import { getBasename } from '../app/src/utils/functions';

export const register = (app: express.Application): express.Application => {
  const appBaseName = getBasename();
  const appBuildPath = path.resolve(__dirname, '..', 'app', 'build');
  console.log(`Setting up router with basename '${appBaseName}'`);
  return app
    .use(`${appBaseName}`, express.static(appBuildPath))
    .get('/', (req, res) => res.redirect(308, `${appBaseName || ''}`));
};
