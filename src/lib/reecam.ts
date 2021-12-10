import { fromEpoch, toEpoch } from './utils';
import axios, { AxiosRequestConfig } from 'axios';
import {
  IPCamConfig,
  IPCamStatus,
  IPCamParams,
  IPCamOptions,
  IPCamBadAuth,
  IPCamLogEvent,
  IPCamLogResult,
  IPCamProperties,
  IPCamSearchResults,
  IPCamRequestOptions,
  IPCamAlarmStatus,
} from './reecam.types';
import { Readable } from 'stream';

/**
 * ReeCam IP Camera Ajax v1.0
 * ReeCam IP Camera Ajax library is available to users of a web development applications
 * ReeCam IP Camera CGI interface operation library, improve efficiency, and simplify the code
 * @see http://wiki.reecam.cn/CGI/Ajax
 * @param {IPCamOptions} options
 */
export class IPCam {
  constructor(private readonly options: IPCamOptions) {}

  private async fetch<T>(opts: IPCamRequestOptions): Promise<T> {
    try {
      const useRaw = opts.raw || false;
      const rawType = opts.rawType || 'arraybuffer';
      const urlParts = opts.url.split('?');
      const url = `http://${this.options.ip}/${urlParts.shift()}`;
      const params = urlParts
        .join('')
        .split('&')
        .reduce(
          (p, c) => {
            const [k, v] = c.split('=');
            return { ...p, [k]: v };
          },
          { ...this.options.credentials, ...opts.params, json: useRaw ? undefined : 1 }
        );
      const config: AxiosRequestConfig = {
        url,
        params,
        data: opts.data,
        method: opts.method,
        responseType: useRaw ? rawType : 'text',
      };
      const response = await axios.request<T>(config);
      return response.data as T;
    } catch (e) {
      console.error(e);
    }
    return undefined;
  }

  get ip(): string {
    return this.options.ip;
  }

  get user(): string {
    return this.options.credentials.user;
  }

  get alias(): string {
    return this.options.alias;
  }

  async badAuth(): Promise<IPCamBadAuth> {
    return await this.fetch({ url: 'get_badauth.cgi' });
  }

  async configBackup(): Promise<IPCamConfig> {
    const data = await this.fetch<string>({ url: 'backup.cgi' });
    if (!data) return undefined;

    const parsable = `{${data
      .trim()
      .replace(/^(.+?)=/gm, `"$1": `)
      .replace(/^(.+?):\s(\D[\w@\-.]+?)$/gm, `$1: "$2"`)
      .replace(/":\s+$/gm, `": null`)
      .replace(/$/gm, `,`)}}`.replace(/,\}/gm, `}`);
    const result = JSON.parse(parsable) as IPCamConfig;
    return result;
  }

  async searchRecords(from?: number, to?: number): Promise<IPCamSearchResults> {
    const params = { from, to };
    const result = await this.fetch<IPCamSearchResults>({ url: 'search_record.cgi', params });
    if (!result) return undefined;
    if (!result.record) result.record = [];
    result.record.forEach((r) => {
      r.end_time = fromEpoch(r.end_time as unknown as number);
      r.start_time = fromEpoch(r.start_time as unknown as number);
    });
    return result;
  }

  async deleteRecord(name: string): Promise<void> {
    return this.fetch({ url: 'del_record.cgi', params: { name } });
  }

  async downloadRecord(name: string): Promise<Readable> {
    return this.fetch({ url: 'get_record.cgi', raw: true, rawType: 'stream', params: { path: name } });
  }

  async getSnapshot(): Promise<Buffer> {
    return this.fetch({ url: 'snapshot.cgi', raw: true });
  }

  async getStatus(): Promise<IPCamStatus> {
    return this.fetch({ url: 'get_status.cgi' });
  }

  async getAlarmStatus(): Promise<IPCamAlarmStatus> {
    const response = await this.fetch<IPCamStatus>({ url: 'get_status.cgi', params: { alarm: 'alarm' } });
    return response?.alarm;
  }

  async getLogs(): Promise<IPCamLogResult> {
    return this.fetch<IPCamLogResult>({ url: 'get_log.cgi' }).then((result) => {
      result?.log?.forEach((entry) => {
        entry.event = typeof entry.event === 'string' ? entry.event : IPCamLogEvent[entry.event];
        entry.t = typeof entry.t === 'number' ? fromEpoch(entry.t) : entry.t;
      });
      return result;
    });
  }

  async getProperties(): Promise<IPCamProperties> {
    return this.fetch<IPCamProperties>({ url: 'get_properties.cgi' });
  }

  async getParams(): Promise<IPCamParams> {
    return this.fetch<IPCamParams>({ url: 'get_params.cgi' });
  }
}
