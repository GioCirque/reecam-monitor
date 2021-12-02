#!/usr/bin/env node_modules/.bin/ts-node

import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { CamMonitor } from './monitor';
import { IPCamOptions } from './reecam.types';
import packageJson from '../package.json';
import { Command, Argument } from 'commander';

let monitor: CamMonitor;
const ipRegEx = /\d{1,3}.\d{1,3}.\d{1,3}.\d{1,3}/;
const storageDir = path.resolve(__dirname, '..', '.ipcams');
const outputMediaPath = path.resolve(storageDir, 'media');
const storedConfigPath = path.resolve(storageDir, 'config');

const ipArg = new Argument('ip', 'The local IP address of the camera').argRequired().argParser(ipValidator);
const program = new Command()
  .version(packageJson.version)
  .addCommand(
    new Command('add')
      .description('Adds a configured camera. Password will be requested securely.')
      .addArgument(ipArg)
      .addArgument(new Argument('user', 'The username for accessing the camera').argRequired())
      .action(async (ip: string, user: string) => {
        const answers = await inquirer.prompt([
          { type: 'password', message: `Provide the password for '${user}@${ip}'`, name: 'pwd' },
        ]);
        const config = { ip, credentials: { user, ...answers } };
        writeStoredConfigData(readStoredConfigData().concat(config));
      })
  )
  .addCommand(
    new Command('list').description('Shows the configured IP cameras.').action(() => {
      const configs = readStoredConfigData();
      configs.forEach((config) => {
        const pwdLength = config.credentials.pwd.length;
        const subLen = Math.floor(pwdLength * 0.33);
        const dispPwd =
          config.credentials.pwd.substring(0, subLen) +
          ''.padStart(subLen, '*') +
          config.credentials.pwd.substring(subLen * 2);
        console.log(`- ${config.ip}\n  User: ${config.credentials.user}\n  Pass: ${dispPwd}\n`);
      });
    })
  )
  .addCommand(
    new Command('remove')
      .description('Removes a configured IP camera.')
      .addArgument(ipArg)
      .action((ip: string) => {
        const configs = readStoredConfigData();
        writeStoredConfigData(configs.filter((c) => c.ip !== ip));
      })
  )
  .addCommand(
    new Command('monitor').description('Monitor online cameras').action(() => {
      const configs = readStoredConfigData();
      monitor = new CamMonitor(configs, outputMediaPath);
      monitor.start();
    })
  )
  .showSuggestionAfterError(true);

// Let's Do This!
ensureStoredConfig();
program.parse(process.argv);

function ipValidator(value: string) {
  if (!ipRegEx.test(value)) {
    throw new Error(`The provided IP address is not valid: ${value}`);
  }
  return value;
}

function writeStoredConfigData(configs: IPCamOptions[]) {
  const data = Buffer.from(JSON.stringify(configs), 'utf-8');
  fs.writeFileSync(storedConfigPath, data.toString('base64'));
}

function readStoredConfigData(): IPCamOptions[] {
  const data = Buffer.from(fs.readFileSync(storedConfigPath).toString(), 'base64');
  return JSON.parse(data.toString('utf-8')) as IPCamOptions[];
}

function ensureStoredConfig() {
  fs.mkdirSync(storageDir, { recursive: true });
  fs.mkdirSync(outputMediaPath, { recursive: true });
  if (!fs.existsSync(storedConfigPath)) {
    writeStoredConfigData([]);
  }
}

function safeStopMonitor() {
  if (monitor) {
    console.log();
    monitor.stop();
  }
}

process.on('SIGINT', safeStopMonitor);
process.on('SIGABRT', safeStopMonitor);
process.on('beforeExit', safeStopMonitor);
