var accounts = require('accounts'),
    locomotive = require('locomotive'),
    passport = require('passport'),
    passportLocal = require('passport-local');

passport.use(new passportLocal.Strategy(accounts.verify));

passport.serializeUser(function(user, callback)
{
    callback(null, user);
});

passport.deserializeUser(function(id, callback)
{
    callback(null, id);
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
    this.user = this.request.user;
    this.alerts = this.request.flash();
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

AccountController.before('help', function (request, response, next)
{
    var self = this;

    // on GET, just render the form
    if (request.method !== 'POST')
    {
        next();
        return;
    }

    self.username = request.body.username;

    // see if the entered e-mail is already in the user data
    accounts.getUserProperty(request.body.username, "name", function (err, value)
    {
        if (err) { next(err); return; }
        if (value)
        {
            request.flash('info', 'We sent an e-mail to ' + request.body.username +'. Use the link in that e-mail to reset you password.');
            response.redirect('/account/signin');
            return;
        }
        request.flash('error', 'We couldn\'t find your account.');
        next();
    });
});

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

    accounts.verify(request.user, request.body.password1, function (err, value)
    {
        if (err) { next(err); return; }
        if (value)
        {
            accounts.setPassword(request.user, request.body.password2, function (err)
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
    self.name = request.body.name;
    self.username = request.body.username;
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
    accounts.getUserProperty(self.username, "password", function (err, hash)
    {
        if (err) { next(err); return; }

        if (hash)
        {
            accounts.verifyPassword(self.password, hash, function (err, value)
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

        accounts.createUser(self.username, self.password, self.name, function (err)
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

module.exports = AccountController;

