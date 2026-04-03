var credentials = require('../credentials');
var config = credentials.db || { backend: 'redis' };

var db;

if (config.backend === 'dynamodb')
{
    var { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
    var { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

    var clientConfig = {};
    if (credentials.aws)
    {
        clientConfig.region = credentials.aws.region;
        clientConfig.credentials = {
            accessKeyId: credentials.aws.accessKeyId,
            secretAccessKey: credentials.aws.secretAccessKey
        };
    }
    var client = new DynamoDBClient(clientConfig);
    var docClient = DynamoDBDocumentClient.from(client);
    var tableName = config.tableName || 'fotocog';

    db = {
        connect: function () {},

        hGetAll: function (pk, callback)
        {
            docClient.send(new GetCommand({
                TableName: tableName,
                Key: { pk: pk }
            })).then(function (data)
            {
                if (!data.Item)
                {
                    callback(null, null);
                    return;
                }
                var result = Object.assign({}, data.Item);
                delete result.pk;
                callback(null, result);
            }).catch(function (err)
            {
                callback(err);
            });
        },

        hGet: function (pk, field, callback)
        {
            docClient.send(new GetCommand({
                TableName: tableName,
                Key: { pk: pk },
                ProjectionExpression: '#f',
                ExpressionAttributeNames: { '#f': field }
            })).then(function (data)
            {
                if (!data.Item)
                {
                    callback(null, null);
                    return;
                }
                callback(null, data.Item[field] || null);
            }).catch(function (err)
            {
                callback(err);
            });
        },

        hSet: function (pk, fieldOrObj, valueOrCallback, callback)
        {
            if (typeof fieldOrObj === 'object')
            {
                // hSet(pk, obj, callback)
                var cb = valueOrCallback;
                var item = Object.assign({ pk: pk }, fieldOrObj);
                docClient.send(new PutCommand({
                    TableName: tableName,
                    Item: item
                })).then(function ()
                {
                    cb(null);
                }).catch(function (err)
                {
                    cb(err);
                });
            }
            else
            {
                // hSet(pk, field, value, callback)
                var field = fieldOrObj;
                var value = valueOrCallback;
                var cb = callback;
                docClient.send(new UpdateCommand({
                    TableName: tableName,
                    Key: { pk: pk },
                    UpdateExpression: 'SET #f = :v',
                    ExpressionAttributeNames: { '#f': field },
                    ExpressionAttributeValues: { ':v': value }
                })).then(function ()
                {
                    cb(null);
                }).catch(function (err)
                {
                    cb(err);
                });
            }
        },

        incr: function (pk, callback)
        {
            docClient.send(new UpdateCommand({
                TableName: tableName,
                Key: { pk: pk },
                UpdateExpression: 'ADD #c :inc',
                ExpressionAttributeNames: { '#c': 'count' },
                ExpressionAttributeValues: { ':inc': 1 },
                ReturnValues: 'ALL_NEW'
            })).then(function (data)
            {
                callback(null, data.Attributes.count);
            }).catch(function (err)
            {
                callback(err);
            });
        }
    };
}
else
{
    var redis = require("redis").createClient({ legacyMode: true });
    var connected = false;

    db = {
        connect: function ()
        {
            if (!connected)
            {
                connected = true;
                redis.connect();
            }
        },

        hGetAll: function (pk, callback)
        {
            redis.hGetAll(pk, callback);
        },

        hGet: function (pk, field, callback)
        {
            redis.hGet(pk, field, callback);
        },

        hSet: function (pk, fieldOrObj, valueOrCallback, callback)
        {
            if (typeof fieldOrObj === 'object')
            {
                redis.hSet(pk, fieldOrObj, valueOrCallback);
            }
            else
            {
                redis.hSet(pk, fieldOrObj, valueOrCallback, callback);
            }
        },

        incr: function (pk, callback)
        {
            redis.incr(pk, callback);
        }
    };
}

module.exports = db;
