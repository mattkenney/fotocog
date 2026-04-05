var serverlessExpress = require('@codegenie/serverless-express');
var app = require('./app');

var server = serverlessExpress({ app });

exports.handler = async function (event, context) {
    console.log("event", JSON.stringify(event));
    if (event.path) {
        event.headers = event.headers || {};
        event.headers['x-original-path'] = event.path;
        if (event.multiValueHeaders) {
            event.multiValueHeaders['x-original-path'] = [event.path];
        }
    }
    var result = await server(event, context);
    var { body, ...rest } = result;
    console.log("result", JSON.stringify(rest));
    return result;
};
