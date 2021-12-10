import { ArgumentConfig } from 'ts-command-line-args';

export type ServeArgs = {
  port: number;
  monitor: boolean;
};

export const ServeArgsConfig: ArgumentConfig<ServeArgs> = {
  port: {
    alias: 'p',
    type: Number,
    optional: true,
    defaultValue: 8080,
    description: 'The port on which to run the server',
  },
  monitor: {
    alias: 'm',
    type: Boolean,
    optional: true,
    defaultValue: true,
    description: 'Whether or not to monitor cams in the server',
  },
};
