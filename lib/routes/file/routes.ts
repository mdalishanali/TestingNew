// NPM Dependencies
import * as express from 'express';
import * as status from 'http-status';
import { fileService } from './../../services/file';

// Custom interface for req containing files
export interface FileRequest extends express.Request {
  files: {
    file: any;
  };
}

export class FileRoutes {
  public static upload = async (req: FileRequest, res: express.Response, next: express.NextFunction) => {
    try {
      const file = req.files.file;
      const response = await fileService.uploadToS3(file);
      res.locals.code = status.OK;
      res.locals.res_obj = {};
      return next();
    } catch (error) {
      next(error);
    }
  }
}
