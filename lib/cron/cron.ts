// Get dependencies
import * as express from 'express';
import * as http from 'http';
import * as cron from 'node-cron';
// Get DB
import { CronHelper } from './cronHelper';
import { config } from '../config';

try {
  const app = express();
  /**
   * Get port from environment and store in Express.
   */
  const port_1 = config.CRON_PORT || '8000';
  app.set('port', port_1);

  // Create HTTP server.
  const server = http.createServer(app);

  cron.schedule('0 0 * * *', async () => {
    await CronHelper.backUpLocalData();
  });
  server.listen(port_1, () => {
    return console.info('Cron server is running on localhost:' + port_1);
  });
  module.exports = app;
} catch (error) {
  process.exit(1);
}
