import express from 'express';
import { register } from './routes';
import { Config } from '../lib/config';
import { registerApi } from './routes.api';
import { CamMonitor } from '../lib/monitor';
import { AppMiddleware } from './middleware';

Config.ensureStoredConfig();
const port = process.argv[2] || 8080;
const config = Config.readStoredConfigData();
const monitor = new CamMonitor(config.cams, Config.mediaPath).start();
const server = register(registerApi(express().use(...AppMiddleware))).listen(port, () =>
  console.log(`Web server listening on ${port}`)
);

function safeStopMonitor() {
  if (server) {
    server.close();
  }
  if (monitor) {
    console.log();
    monitor.stop();
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
