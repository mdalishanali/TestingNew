import { config } from '../../config';
import * as moment from 'moment';
import * as AWS from 'aws-sdk';

AWS.config.update({
  accessKeyId: config.S3_USER_KEY,
  secretAccessKey: config.S3_USER_SECRET,
  region: config.S3_BUCKET_REGION,
});
export class AwsHelpers {
  public static getSignedUrl = async (fileName: string, fileType: string) => {
    const s3 = new AWS.S3();
    const myBucket = config.S3_BUCKET_NAME;
    const contentType = fileType;
    const signedUrlExpireSeconds = 60 * 5;
    const keyFile = `${moment().format('MM-DD-YYYY__HH-mm-ss')}_${fileName}`;
    const url = await s3.getSignedUrlPromise('putObject', {
      Bucket: myBucket,
      Key: keyFile,
      ACL: 'public-read',
      Expires: signedUrlExpireSeconds,
      ContentType: contentType,
    });
    return { url, keyFile };
  }

  public static uploadDBBackupToS3 = async (fileContent: any, filePath: string) => {
    const date = moment().format('DD-MM-YY');
    const filename = `${date}.archive`;
    const s3 = new AWS.S3();

    const params = {
      Bucket: config.S3_BUCKET_NAME,
      Key: filename, // File name you want to save as in S3
      Body: fileContent,
    };
    const data = await s3.upload(params).promise();
  }

  public static deleteDBBackupFromS3 = async () => {
    const dateToDel = moment(moment().subtract(30, 'days')).format('DD-MM-YY');
    const fileToDelete = `${dateToDel}.archive`;
    const s3 = new AWS.S3();
    const params = {
      Bucket: config.S3_BUCKET_NAME,
      Key: fileToDelete, // File name save in S3
    };
    const data = await s3.deleteObject(params).promise();
  }
}
