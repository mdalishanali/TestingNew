import * as status from 'http-status';
import * as winston from 'winston';
import * as  CloudWatchTransport from 'winston-aws-cloudwatch';
import { config } from '../config';
import { maskJsonData } from './logHelpers';
import * as fetch from 'node-fetch';
const environment: string = 'production';
class ErrorLogService {
  logger: winston.Logger;

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

  public errorLog = async (err, req, res, next) => {
    try {
      if (!err.code) { err.code = 500; }
      const isErrorSevere: Boolean = this.checkErrorSeverity(err);

      const errorBody = {
        level: 'error',
        message: err.message,
        statusCode: err.code,
        stackTrace: err,
        endpoint: req.path,
        user: req.user ? req.user._id : '',
        request: {
          body: maskJsonData(req.body),
          query: maskJsonData(req.query),
          params: maskJsonData(req.params)
        },
        response: err,
      };

      if (config.NODE_ENV !== environment) {
        if (isErrorSevere) {
          await this.notifyOverSlack(errorBody);
        }
        this.logger.log(errorBody);
      }

      res.status(err.code || status.INTERNAL_SERVER_ERROR).send(err);
    } catch (error) {
      res.status(status.INTERNAL_SERVER_ERROR).send(err);
    }
  }


  private checkErrorSeverity = (err) => {
    let isErrorSevere: Boolean = false;
    if (err.code >= 500 ) {
      isErrorSevere = true;
    }
    return isErrorSevere;
  }

  private notifyOverSlack = async (body) => {
    const messageBody = {
      blocks: [
        {
          type: 'rich_text',
          elements: [
            {
              type: 'rich_text_preformatted',
              border: 0,
              elements: [
                {
                  type: 'text',
                  text: JSON.stringify(body, undefined, 4)
                }
              ]
            }
          ]
        }
      ]
    };
    const data = await fetch(`${config.SLACK_WEBHOOK_FOR_LOGS}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify(messageBody)
    });
    return;
  }
}

export const ErrorLogServices = new ErrorLogService();
