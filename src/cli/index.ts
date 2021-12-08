#!/usr/bin/env node_modules/.bin/ts-node

import inquirer from 'inquirer';
import { Command, Argument } from 'commander';

import { Config } from '../lib/config';
import { CamMonitor } from '../lib/monitor';
import packageJson from '../../package.json';

let monitor: CamMonitor;
const ipRegEx = /\d{1,3}.\d{1,3}.\d{1,3}.\d{1,3}/;

const ipArg = new Argument('ip', 'The local IP address of the camera').argRequired().argParser(ipValidator);
const program = new Command()
  .version(packageJson.version)
  .addCommand(
    new Command('add')
      .description('Adds a configured camera. Password will be requested securely.')
      .addArgument(ipArg)
      .addArgument(new Argument('user', 'The username for accessing the camera').argRequired())
      .addArgument(new Argument('alias', 'The friendly name of the IP camera'))
      .action(async (ip: string, user: string, alias: string) => {
        const answers = await inquirer.prompt([
          { type: 'password', message: `Provide the password for '${user}@${ip}'`, name: 'pwd' },
        ]);
        Config.upsertCam({ alias, ip, credentials: { user, ...answers } });
      })
  )
  .addCommand(
    new Command('list').description('Shows the configured IP cameras.').action(() => {
      const configs = Config.readStoredConfigData(true).cams;
      configs.forEach((config) => {
        console.log(
          `- ${config.alias}\n  IP: ${config.ip}\n  User: ${config.credentials.user}\n  Pass: ${config.credentials.pwd}\n`
        );
      });
    })
  )
  .addCommand(
    new Command('remove').description('Removes a configured IP camera.').addArgument(ipArg).action(Config.removeCam)
  )
  .addCommand(
    new Command('add-user')
      .description('Adds an authorized user. No password is collected. Users must provide a valid camera password.')
      .addArgument(new Argument('email', 'The user email address').argRequired())
      .addArgument(new Argument('alias', 'The user display name').argRequired())
      .action(async (email: string, alias: string) => {
        Config.upsertUser({ email, alias });
      })
  )
  .addCommand(
    new Command('list-users').description('Shows the configured users.').action(() => {
      const users = Config.readStoredConfigData(true).users;
      users.forEach((user) => {
        console.log(`- ${user.alias}\n  Email: ${user.email}\n`);
      });
    })
  )
  .addCommand(
    new Command('remove-user')
      .description('Removes an authorized user.')
      .addArgument(new Argument('email', 'The user email address').argRequired())
      .action(async (email: string) => {
        Config.removeUser(email);
      })
  )
  .addCommand(
    new Command('monitor').description('Monitor online cameras').action(() => {
      const config = Config.readStoredConfigData();
      monitor = new CamMonitor(config.cams, Config.mediaPath);
      monitor.start();
    })
  )
  .showSuggestionAfterError(true);

function ipValidator(value: string) {
  if (!ipRegEx.test(value)) {
    throw new Error(`The provided IP address is not valid: ${value}`);
  }
  return value;
}

function safeStopMonitor() {
  if (monitor) {
    console.log();
    monitor.stop();
  }
}

// Let's Do This!
Config.ensureStoredConfig();
program.parse(process.argv);

process.on('SIGINT', safeStopMonitor);
process.on('SIGABRT', safeStopMonitor);
process.on('beforeExit', safeStopMonitor);
