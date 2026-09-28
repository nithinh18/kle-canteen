/**
 * Vercel Serverless Function entry point
 * Directs all /api/* requests to the Express application
 */
require('dotenv').config();
const app = require('../server/server.js');

module.exports = app;
