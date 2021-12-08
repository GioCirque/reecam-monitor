import path from 'path';
import express from 'express';
import { getBasename } from '../app/src/utils/functions';

export const register = (app: express.Application): express.Application => {
  const appBaseName = getBasename();
  const appBuildPath = path.resolve(__dirname, '..', 'app', 'build');
  return app
    .use(`${appBaseName}*`, express.static(appBuildPath))
    .all('/', (req, res) => res.redirect(308, `/${appBaseName}`));
};
