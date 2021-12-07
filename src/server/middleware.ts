import cors from 'cors';
import cookies from 'cookie-parser';
import { RequestHandler } from 'express';
import { ConfigUser } from '../lib/config.types';
import { Config } from '../lib/config';

const ALLOW_ANON_PATHS = ['/api/login', '/app', '/'];

export const validateUser: RequestHandler = (req, res, next) => {
  let email = 'anon';

  try {
    if (ALLOW_ANON_PATHS.includes(req.path.toLowerCase())) return next();

    const token: string = req.cookies?.token;
    if (!token) return res.sendStatus(403).end();

    const data = Buffer.from(token, 'base64').toString('utf-8');
    if (!data) return res.sendStatus(403).end();

    const user = JSON.parse(data) as ConfigUser;
    if (!user?.email || !user?.alias) return res.sendStatus(403).end();

    const exists = Config.checkUser(user.email);
    if (!exists) return res.sendStatus(403).end();

    email = user.email;
  } catch {
    return res.sendStatus(403).end();
  } finally {
    console.log(`HTTP/${req.httpVersion}  ${req.method}\t${email} => \t${req.url}`);
  }

  next();
};

export const AppMiddleware: RequestHandler[] = [cors(), cookies(), validateUser];
