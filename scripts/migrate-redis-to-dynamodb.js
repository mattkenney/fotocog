#!/usr/bin/env node

var credentials = require('../credentials');
var { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
var { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
var redis = require('redis');

var tableName = (credentials.db && credentials.db.tableName) || 'fotocog';
var ddbClient = new DynamoDBClient({ region: credentials.aws.region });
var docClient = DynamoDBDocumentClient.from(ddbClient);

var redisClient = redis.createClient({ legacyMode: true });

async function migrate()
{
    await redisClient.connect();
    var v4 = redisClient.v4;

    var keys = await v4.keys('*');
    console.log('Found ' + keys.length + ' keys to migrate');

    for (var i = 0; i < keys.length; i++)
    {
        var key = keys[i];
        var type = await v4.type(key);

        if (type === 'hash')
        {
            var data = await v4.hGetAll(key);
            var item = Object.assign({ pk: key }, data);
            await docClient.send(new PutCommand({
                TableName: tableName,
                Item: item
            }));
            console.log('Migrated hash: ' + key + ' (' + Object.keys(data).length + ' fields)');
        }
        else if (type === 'string')
        {
            var value = await v4.get(key);
            var num = Number(value);
            var item = { pk: key };
            if (!isNaN(num) && key.indexOf('handle/') === 0)
            {
                item.count = num;
            }
            else
            {
                item.value = value;
            }
            await docClient.send(new PutCommand({
                TableName: tableName,
                Item: item
            }));
            console.log('Migrated string: ' + key + ' = ' + value);
        }
        else
        {
            console.log('Skipped ' + key + ' (type: ' + type + ')');
        }
    }

    console.log('Migration complete');
    await redisClient.disconnect();
}

migrate().catch(function (err)
{
    console.error('Migration failed:', err);
    process.exit(1);
});
