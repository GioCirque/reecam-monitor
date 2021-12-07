import path from 'path';
import express from 'express';

export const register = (app: express.Application): express.Application => {
  const appBuildPath = path.resolve(__dirname, '..', 'app', 'build');
  app
    .use('/app', express.static(appBuildPath))
    .get('/', (req: express.Request, res: express.Response) => {
      res.redirect(308, '/app');
    });

  return app;
};
