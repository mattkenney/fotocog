var crypto = require('crypto'),
    locomotive = require('locomotive'),
    redis = require("redis").createClient(),
    passport = require('passport'),
    passportLocal = require('passport-local');

function encode(value, special, allowed)
{
    special = special || '%';
    allowed = allowed || '';
    text = unescape(encodeURIComponent(value));
    buf = []
    for (var i = 0; i < text.length; i++)
    {
        var c = text.charAt(i);
        if ((('a' <= c && c <= 'z') || ('A' <= c && c <= 'Z') || ('0' <= c && c <= '9') || (allowed.indexOf(c) >= 0)) && c != special)
        {
            buf.push(c);
        }
        else
        {
            buf.push(special);
            buf.push((0x100 + c.charCodeAt(0)).toString(16).substring(1, 3).toUpperCase());
        }
    }
    return buf.join('');
}

function encode_segment(value)
{
    return encode(value, '_', '-.');
}

function ab64decode(data)
{
    var result = (new Buffer(data.replace(/\./g, '+'), 'base64').toString('binary'));
    return result;
}

function ab64encode(data)
{
    var result = (
        new Buffer(data, 'binary')
        .toString('base64')
        .replace(/\+/g, '.')
        .replace(/=/g, '')
    );
    return result;
}

function createUser(username, password, name, callback)
{
    encryptPassword(password, null, function (err, value)
    {
        if (err) { callback(err); return; }
        var args =
        {
            name: name,
            email: username,
            password: value
        };
        redis.hmset(email2key(username), args, function (err)
        {
            if (err) { callback(err); return; }
            callback();
        });
    });
}

function email2key(username)
{
    var result = 'user/' + encode_segment(String(username).toLowerCase());
    return result;
}

function encryptPassword(secret, options, callback)
{
    var rounds = options && options.rounds || 6400;
    var saltSize = options && options.saltSize || 16;
    var salt = options && options.salt || crypto.randomBytes(saltSize).toString('binary');
    var size = options && options.size || 20;

    crypto.pbkdf2(secret, salt, rounds, size, function (err, key)
    {
        var hash = '$pbkdf2$' + rounds + '$' + ab64encode(salt) + '$' + ab64encode(key);
        callback(err, hash);
    });
}

function setPassword(username, password, callback)
{
    encryptPassword(password, null, function (err, hash)
    {
        if (err) { callback(err); return; }
        redis.hset(email2key(username), "password", hash, function (err)
        {
            if (err) { callback(err); return; }
            callback();
        });
    });
}

var m_dummy;
function verify(username, password, callback)
{
    console.log('verify', username, password);
    redis.hget(email2key(username), "password", function (err, value)
    {
        verifyPassword(password, value || m_dummy, function (err, result)
        {
            if (err) { callback(err); return; }
            if (value && result)
            {
                callback(null, username);
            }
            else
            {
                callback(null, false, { message: 'Wrong E-mail/password combination.' });
            }
        });
    });
}

function verifyPassword(secret, hash, callback)
{
    parts = (/^\$pbkdf2\$([^\$]+)\$([^\$]+)\$([^\$]+)$/).exec(hash);
    encryptPassword(
        secret,
        {
            rounds: parts && parts[1] && (0|parts[1]),
            salt: parts && parts[2] && ab64decode(parts[2])
        },
        function (err, key)
        {
            callback(err, !!(parts && hash === key));
        }
    );
}

passport.use(new passportLocal.Strategy(verify));

passport.serializeUser(function(user, done)
{
    done(null, user);
});

passport.deserializeUser(function(id, done)
{
    done(null, id);
});

var AccountController = new locomotive.Controller();

AccountController.help = function()
{
    if (this.request.user)
    {
        this.redirect('/');
        return;
    }
    this.alerts = this.request.flash();
    this.render();
};

AccountController.password = function()
{
    this.alerts = this.request.flash();
    this.user = this.request.user;
    this.render();
};

AccountController.reset = function()
{
    if (this.request.user)
    {
        this.redirect('/');
        return;
    }
    this.alerts = this.request.flash();
    this.render();
};

AccountController.signin = function()
{
    if (this.request.user)
    {
        this.redirect('/');
        return;
    }
    this.alerts = this.request.flash();
    this.render();
};

AccountController.signup = function()
{
    if (this.request.user)
    {
        this.redirect('/');
        return;
    }
    this.alerts = this.request.flash();
    this.render();
};

AccountController.before('password', function (request, response, next)
{
    var self = this;

    // on GET, just render the form
    if (request.method !== 'POST')
    {
        next();
        return;
    }

    // validate parameters
    var isError = false;
    if (request.body.password2 < 6)
    {
        isError = true;
        self.request.flash('error', 'Your password must be at least six characters long.');
    }
    if (request.body.password2 !== request.body.password3)
    {
        isError = true;
        self.request.flash('error', 'New password does not match.');
    }
    if (isError)
    {
        next();
        return;
    }

    verify(request.user, request.body.password1, function (err, value)
    {
        if (err) { next(err); return; }
        if (value)
        {
            setPassword(request.user, request.body.password2, function (err)
            {
                if (err) { callback(err); return; }
                request.flash('success', 'Password changed.');
                response.redirect('/');
            });
        }
        else
        {
            request.flash('error', 'Old password does not match.');
            next();
        }
    });
});

AccountController.before('signup', function (request, response, next)
{
    var self = this;

    // on GET, just render the form
    if (request.method !== 'POST')
    {
        next();
        return;
    }

    // copy over request fields so that if there is a problem and we need to
    // render the form again, the fields values can be filled in
    self.name = request.body.name,
    self.username = request.body.username,
    self.password = request.body.password;

    // validate parameters
    var isError = false;
    if (self.name.length < 1)
    {
        isError = true;
        self.request.flash('error', 'full name is required');
    }
    if (!(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i).test(self.username))
    {
        isError = true;
        self.request.flash('error', 'Missing or incomplete e-mail address.');
    }
    if (self.password.length < 6)
    {
        isError = true;
        self.request.flash('error', 'Your password must be at least six characters long.');
    }
    if (isError)
    {
        next();
        return;
    }

    // see if the entered e-mail is already in the user data
    var userid = email2key(self.username);
    redis.hget(userid, "password", function (err, hash)
    {t
        if (err) { next(err); return; }

        if (hash)
        {
            verifyPassword(self.password, hash, function (err, value)
            {
                if (err) { next(err); return; }
                if (value)
                {
                    request.logIn(self.username, function (err)
                    {
                        if (err) { next(err); return; }
                        request.flash('info', 'You already have an account with this username and password. You are now logged in.');
                        response.redirect('/');
                    });
                }
                else
                {
                    request.flash('warning', 'That email address is already registered.');
                    next();
                }
            });
            return;
        }

        createUser(self.username, self.password, self.name, function (err)
        {
            if (err) { next(err); return; }
            request.logIn(self.username, function (err)
            {
                if (err) { next(err); return; }
                result.redirect('/');
            });
        });
    });
});

encryptPassword('password', null, function (err, value)
{
    m_dummy = value;
});

module.exports = AccountController;

