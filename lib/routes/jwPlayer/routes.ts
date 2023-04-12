// NPM Dependencies
import * as status from 'http-status';
import * as express from 'express';
import * as JWPlatformAPI from 'jwplatform';
import fetch from 'node-fetch';


// Internal Dependencies
import { AuthenticatedRequest } from '../../interfaces/authenticated-request';
import { config } from '../../config';

const jwApiInstance = new JWPlatformAPI({
  apiKey: config.JW_API_KEY,
  apiSecret: config.JW_API_SECRET,
});

export class JWPlayerRoutes {
  public static createJwURl = async (
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const videoUrl: string = req.body.document.videoUrl;
      const date: number = Math.floor(new Date().getTime() / 1000);
      const jwInstance = await jwApiInstance.videos.create({
        download_url: videoUrl,
        title: 'Sample',
        tags: 'video',
        date: date,
      });
      const jwUrl = `https://cdn.jwplayer.com/v2/media/${jwInstance.video.key}`;
      res.locals.code = status.OK;
      res.locals.res_obj = { data: { jwUrl, mediaId: jwInstance.video.key } };
      return next();
    } catch (error) {
      next(error);
    }
  }

  public static getJWPlayerVideoUrls = async (
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const jwUrl: string = req.body.document.jwUrl;
      let data = await fetch(jwUrl);
      data = await data.json();
      res.locals.code = status.OK;
      res.locals.res_obj = { data };
      return next();
    } catch (error) {
      next(error);
    }
  }
}
