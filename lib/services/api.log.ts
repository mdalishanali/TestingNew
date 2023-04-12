import * as status from 'http-status';
import * as winston from 'winston';
import * as  CloudWatchTransport from 'winston-aws-cloudwatch';
import { config } from '../config';
import { maskJsonData } from './logHelpers';
const environment: string = 'production';
class ApiLogService {
  private logger: winston.Logger;

  constructor () {
    if (config.NODE_ENV !== environment) {
      this.logger = winston.createLogger({
        transports: [
          new CloudWatchTransport({
            logGroupName: config.AWS_LOG_GROUP_NAME,
            logStreamName: config.NODE_ENV,
            createLogGroup: true,
            createLogStream: true,
            submissionInterval: 2000,
            submissionRetryCount: 1,
            batchSize: 20,
            awsConfig: {
              accessKeyId: config.S3_USER_KEY,
              secretAccessKey: config.S3_USER_SECRET,
              region: config.S3_BUCKET_REGION
            },
          })
        ]
      });
    }
  }

  public apiLog = (req, res, next) => {
    try {

      if (config.NODE_ENV !== environment) {
        this.logger.log({
          level: 'info',
          message: 'This request is successfull',
          statusCode: res.locals.code,
          request: {
              body: maskJsonData(req.body),
              query: maskJsonData(req.query),
              params: maskJsonData(req.params)
          },
          response: maskJsonData(res.locals.res_obj),
          endpoint: req.path,
          user: req.user ? req.user._id : ''
      });
      }
      res.status(res.locals.code || status.OK).json(res.locals.res_obj || {});
    } catch (error) {
        next(error);
    }
  }

}
export const ApiLogServices = new ApiLogService();
