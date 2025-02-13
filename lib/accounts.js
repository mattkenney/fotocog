var crypto = require('crypto'),
    encode = require('./encode'),
    redis = require("redis").createClient({ legacyMode: true });

redis.connect();

function username2key(username)
{
    return ('user/' + encode.encode_segment(String(username).toLowerCase()));
}

function encryptPassword(secret, options, callback)
{
    var rounds = options && options.rounds || 6400;
    var saltSize = options && options.saltSize || 16;
    var salt = options && options.salt || crypto.randomBytes(saltSize).toString('binary');
    var size = options && options.size || 20;
    var digest = options && options.digest || 'sha1';

    crypto.pbkdf2(secret, salt, rounds, size, digest, function (err, key)
    {
        var hash = '$pbkdf2$' + rounds + '$' + encode.ab64encode(salt) + '$' + encode.ab64encode(key);
        callback(err, hash);
    });
}

function makeHandle(name)
{
    name = name.replace(new RegExp('^\\P{L}+'), '');
    name = name.replace(new RegExp('\\P{L}+$'), '');
    name = name.replace(new RegExp('[^\\p{L}\\p{N}]+', 'g'), '.');
    return encodeURIComponent(name.toLowerCase());
}

var m_dummy;
encryptPassword('password', null, function (err, value)
{
    m_dummy = value;
});

var accounts = module.exports =
{
    serializeUser: function (user, callback)
    {
        callback(null, user && user.key);
    },

    deserializeUser: function (key, callback)
    {
        redis.hGetAll(key, function (err, user)
        {
            if (user)
            {
                user.key = key;
            }
            callback(err, user);
        });
    },

    createUser: function (username, password, name, callback)
    {
        encryptPassword(password, null, function (err, value)
        {
            if (err) { callback(err); return; }
            var handle = makeHandle(name);
            redis.incr('handle/' + handle, function (err, count)
            {
                if (err) { callback(err); return; }
                if ((0|count) > 1)
                {
                    handle += '.' + count;
                }
                var user =
                    {
                        email: username,
                        handle: handle,
                        name: name,
                        password: value,
                        uuid: crypto.randomUUID()
                    },
                    key = username2key(username);
                redis.hSet(key, user, function (err)
                {
                    if (err) { callback(err); return; }
                    user.key = key;
                    callback(null, user);
                });
            });
        });
    },

    getUserProperty: function (username, propname, callback)
    {
        redis.hGet(username2key(username), propname, callback)
    },

    setPassword: function (username, password, callback)
    {
        encryptPassword(password, null, function (err, hash)
        {
            if (err) { callback(err); return; }
            redis.hSet(username2key(username), "password", hash, function (err)
            {
                if (err) { callback(err); return; }
                callback();
            });
        });
    },

    setUserProperty: function (key, propname, propvalue, callback)
    {
        redis.hSet(key, propname, propvalue, function (err)
        {
            if (err) { callback(err); return; }
            callback();
        });
    },

    validateParameters: function (username, password, name)
    {
        var result =[];
        if (makeHandle(name).length < 1)
        {
            result.push('Full name is required');
        }
        if (!(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i).test(username))
        {
            result.push('Missing or incomplete e-mail address.');
        }
        if (password.length < 6)
        {
            result.push('Your password must be at least six characters long.');
        }
        return (result.length ? result : false);
    },

    verify: function (username, password, callback)
    {
        var key = username2key(username);
        redis.hGetAll(key, function (err, value)
        {
            if (err) { callback(err); return; }
            var secret = value && value.password || m_dummy;
            accounts.verifyPassword(password, secret, function (err, result)
            {
                if (err) { callback(err); return; }
                if (value && result)
                {
                    value.key = key;
                    callback(null, value);
                }
                else
                {
                    callback(null, false, { message: 'Wrong E-mail/password combination.' });
                }
            });
        });
    },

    verifyPassword: function (secret, hash, callback)
    {
        parts = (/^\$pbkdf2\$([^\$]+)\$([^\$]+)\$([^\$]+)$/).exec(hash);
        encryptPassword(
            secret,
            {
                rounds: parts && parts[1] && (0|parts[1]),
                salt: parts && parts[2] && encode.ab64decode(parts[2])
            },
            function (err, key)
            {
                callback(err, !!(parts && hash === key));
            }
        );
    }
};
