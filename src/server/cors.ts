import { CorsOptions } from 'cors';

const ENV_HOSTS = (process.env.PUBLIC_HOST || undefined)?.split(',').map((h) => h.trim());
export const corsConfig: CorsOptions = {
  credentials: true,
  origin: ENV_HOSTS || ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:5555'],
};
