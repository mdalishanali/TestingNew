const { spawn } = require('child_process');
const fs = require('fs');
import { AwsHelpers } from '../routes/aws/helpers';
import { config } from '../config';

export class CronHelper {
  public static backUpLocalData = async () => {
    // backup local data
    const filePath: string = `${config.BACKUP_PATH}/${config.LOCAL_DB_FILE}`;
    const backupProcess = spawn('mongodump', [
      `--db=${config.DB_PATH}`,
      `--archive=${filePath}`,
      '--gzip',
    ]);
    // listen to child process event
    backupProcess.on('exit', async (code, signal) => {
      try {
        const fileContent = fs.readFileSync(filePath);
        // uploadin to s3
        await AwsHelpers.uploadDBBackupToS3(fileContent, filePath);
        // deleting from s3 30 days prior
        await AwsHelpers.deleteDBBackupFromS3();
        // deleting fromlocal
        CronHelper.deleteFromLocal(filePath);
      } catch (error) {
        throw error;
      }
    });
  }
  public static deleteFromLocal = (filePath: string) => {
    fs.unlink(filePath, (err) => {
      if (err) { throw err; }
      // if no error, file has been deleted successfully
      console.info('File deleted from local!');
    });
  }
}
