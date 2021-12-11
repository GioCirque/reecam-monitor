import axios from 'axios';
import { AppUser, AppData, IPCamMetaData } from '../types';

axios.defaults.withCredentials = true;
const BASE_API_URL = process.env.NODE_ENV !== 'production' ? 'http://localhost:8080' : '';

function fixCamDataTypes(...data: IPCamMetaData[]): IPCamMetaData[] {
  for (const cam of data) {
    cam.details = `${BASE_API_URL}${cam.details}`;
    cam.snapshot = `${BASE_API_URL}${cam.snapshot}`;
    for (const event of cam.events) {
      event.gif = `${BASE_API_URL}${event.gif}`;
      event.video = `${BASE_API_URL}${event.video}`;
      event.stream = `${BASE_API_URL}${event.stream}`;
    }
  }
  return data;
}
export class API {
  static async login(email: string, password: string): Promise<AppUser> {
    const { data } = await axios.post<AppUser>(`${BASE_API_URL}/api/login`, { email, password });
    return data;
  }

  static async logout(): Promise<void> {
    return axios.post(`${BASE_API_URL}/api/logout`);
  }

  static async data(): Promise<AppData> {
    const { data } = await axios.get<AppData>(`${BASE_API_URL}/api/cams`);
    return fixCamDataTypes(...data);
  }

  static async delete(camAlias: string, eventId: string, password: string): Promise<AppData> {
    const { data } = await axios.delete<AppData>(`${BASE_API_URL}/api/cams/${camAlias}/${eventId}`, {
      params: { password },
    });
    return fixCamDataTypes(...data);
  }
}
