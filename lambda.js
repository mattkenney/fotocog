var serverlessExpress = require('@codegenie/serverless-express');
var app = require('./app');

exports.handler = serverlessExpress({ app });
