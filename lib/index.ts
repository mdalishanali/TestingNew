// Get dependencies
import * as express from 'express';
import * as path from 'path';
import * as http from 'http';
import * as busboy from 'connect-busboy';
import * as busboyBodyParser from 'busboy-body-parser';
import * as compression from 'compression';
import * as cors from 'cors';

// Get DB
import * as models from './db';

// Get our API routes
import { api } from './routes/api';

// import config
import { config } from './config';

try {

  const app = express();
  app.use(cors());
  app.use(busboy());
  app.use(busboyBodyParser());

  // Parsers for POST data
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // for gzipping
  app.use(compression());

  // Point static path to dist
  app.use(express.static(path.join(__dirname, '../../dist')));

  // Set our api routes
  app.use('/api', api);

  // Catch all other routes and return the index file
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/index.html'));
  });

  /**
   * Get port from environment and store in Express.
   */
  const port = config.PORT || '8000';
  app.set('port', port);

  /**
   * Create HTTP server.
   */
  const server = http.createServer(app);

  server.listen(port, () => console.info(`API running on localhost:${port}`));

  module.exports = app;

} catch (error) {
  process.exit(1);
}

