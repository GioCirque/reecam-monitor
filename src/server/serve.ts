import express from 'express';
import { program } from 'commander';

import { register } from './routes';
import { Config } from '../lib/config';
import { registerApi } from './routes.api';
import { CamMonitor } from '../lib/monitor';
import packageJson from '../../package.json';
import { AppMiddleware } from './middleware';
import { ServeOptions } from './serve.types';

function maybeParseInt(value: string, prev: string) {
  // parseInt takes a string and a radix
  const parsedValue = parseInt(value, 10);
  return isNaN(parsedValue) ? prev || '8080' : `${parsedValue}`;
}

program
  .version(packageJson.version)
  .option('-p --port <number>', 'Sets the listening web server port', maybeParseInt, '8080')
  .option('-M --no-monitoring', 'Whether or not to run monitoring')
  .action((options: ServeOptions) => {
    options.port = parseInt(`${options.port}`);
    Config.ensureStoredConfig();

    const { port, monitoring } = options;
    const config = Config.readStoredConfigData();
    const monitor = monitoring && new CamMonitor(config.cams, Config.mediaPath).start();
    const server = register(registerApi(express().use(...AppMiddleware))).listen(port, () =>
      console.log(`Web server listening on ${port}${monitor ? ' with monitoring' : ''}`)
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
  })
  .parse(process.argv);
