import * as AWS from 'aws-sdk';
//import config
import { config } from '../config'

class FileService {
    uploadToS3 = async (file) => {
        const BUCKET_NAME = config.S3_BUCKET_NAME;
        const IAM_USER_KEY = config.S3_USER_KEY;
        const IAM_USER_SECRET = config.S3_USER_SECRET;

        const s3bucket = new AWS.S3({
            accessKeyId: IAM_USER_KEY,
            secretAccessKey: IAM_USER_SECRET,
        });
        const params = {
            Bucket: BUCKET_NAME,
            Key: file.name,
            Body: file.data
        };
        return s3bucket.putObject(params);
    }
}

export const fileService = new FileService();
