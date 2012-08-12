var accounts = require('accounts'),
    credentials = require(__dirname + '/../../config/credentials'),
    locomotive = require('locomotive'),
    passport = require('passport'),
    passportFacebook = require('passport-facebook'),
    passportLocal = require('passport-local');

passport.use(new passportLocal.Strategy(accounts.verify));
passport.use(new passportFacebook.Strategy(
{
    clientID:credentials.facebook.id,
    clientSecret:credentials.facebook.secret,
    callbackURL:"https://www.fotocog.com/account/callback"
}, accounts.facebookUser));

passport.serializeUser(accounts.serializeUser);

passport.deserializeUser(accounts.deserializeUser);

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

AccountController.signout = function()
{
    this.request.logOut();
    this.response.redirect('/');
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
    var errors = accounts.validateParameters(self.username, self.password, self.name);
    if (errors)
    {
        for (var i = 0; i < errors.length; i++)
        {
            self.request.flash('error', errors[i]);
        }
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
                    accounts.deserializeUser(self.username, function (err, user)
                    {
                        request.logIn(user, function (err)
                        {
                            if (err) { next(err); return; }
                            request.flash('info', 'You already have an account with this username and password. You are now logged in.');
                            response.redirect('/');
                        });
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

        accounts.createUser(self.username, self.password, self.name, function (err, user)
        {
            if (err) { next(err); return; }
            request.logIn(user, function (err)
            {
                if (err) { next(err); return; }
                response.redirect('/');
            });
        });
    });
});

module.exports = AccountController;

