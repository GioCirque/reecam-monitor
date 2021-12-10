import express from 'express';
import { parse } from 'ts-command-line-args';

import { register } from './routes';
import { Config } from '../lib/config';
import { registerApi } from './routes.api';
import { CamMonitor } from '../lib/monitor';
import { AppMiddleware } from './middleware';
import { ServeArgs, ServeArgsConfig } from './serve.types';

Config.ensureStoredConfig();
const args = parse<ServeArgs>(ServeArgsConfig);
const { port, monitor: useMonitor } = args;

const config = Config.readStoredConfigData();
const monitor = useMonitor && new CamMonitor(config.cams, Config.mediaPath).start();
const server = register(registerApi(express().use(...AppMiddleware))).listen(port, () =>
  console.log(`Web server listening on ${port}${useMonitor ? ' with monitoring' : ''}`)
);

function safeStopMonitor() {
  if (server) {
    server.close();
  }
  if (monitor) {
    console.log();
    monitor?.stop();
  }
}

process.on('SIGINT', safeStopMonitor);
process.on('SIGABRT', safeStopMonitor);
process.on('beforeExit', safeStopMonitor);
process.on('unhandledRejection', (reason, promise) => {
  console.error(`Uncaught Rejection `, reason, promise);
});
process.on('uncaughtException', (error, origin) => {
  console.error(`Uncaught Exception `, error, origin);
});
