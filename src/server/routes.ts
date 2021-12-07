import path from 'path';
import express from 'express';

export const register = (app: express.Application): express.Application => {
  const appBuildPath = path.resolve(__dirname, '..', 'app', 'build');
  return app.use(express.static(appBuildPath));
};
