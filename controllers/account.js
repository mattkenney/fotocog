/*
 * Copyright 2012 Matt Kenney
 *
 * This file is part of Fotocog.
 *
 * Fotocog is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 *
 * Fotocog is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Fotocog.  If not, see <http://www.gnu.org/licenses/>.
 */

var accounts = require('accounts'),
    credentials = require('../credentials'),
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

module.exports = function (app)
{
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(function(req, res, next)
    {
        res.locals.user = req.user;
        next();
    });

    app.get('/account/callback', function (req, res)
    {
        passport.authenticate('facebook',
        {
            scope:['email']
        });
    });

    app.get('/account/facebook', function (req, res)
    {
        passport.authenticate('facebook',
        {
            successRedirect:"/account/success",
            failureRedirect:"/account/signin"
        });
    });

    app.get('/account/help', function (req, res)
    {
        if (req.user)
        {
            res.redirect('/');
            return;
        }
        res.render('account/help');
    });

    app.get('/account/reset', function (req, res)
    {
        if (req.user)
        {
            res.redirect('/');
            return;
        }
        res.render('account/reset');
    });

    app.get('/account/signin', function (req, res, next)
    {
        res.render('account/signin');
    });

    app.post('/account/signin', passport.authenticate('local',
    {
        successRedirect: '/account/success',
        failureRedirect: '/account/signin',
        failureFlash: true
    }));

    app.get('/account/signout', function (req, res)
    {
        req.logOut();
        res.redirect('/');
    });

    app.get('/account/signup', function (req, res)
    {
        res.render('account/signup');
    });

    app.post('/account/signup', function (req, res, next)
    {
        // copy over req fields so that if there is a problem and we need to
        // render the form again, the fields values can be filled in
        var data = {};
        data.name = req.body.name;
        data.username = req.body.username;
        data.password = req.body.password;

        // validate parameters
        var errors = accounts.validateParameters(data.username, data.password, data.name);
        if (errors)
        {
            for (var i = 0; i < errors.length; i++)
            {
                req.flash('error', errors[i]);
            }
            res.render('account/signup', data);
            return;
        }

        // see if the entered e-mail is already in the user data
        accounts.getUserProperty(data.username, "password", function (err, hash)
        {
            if (err) { next(err); return; }

            if (hash)
            {
                accounts.verifyPassword(data.password, hash, function (err, value)
                {
                    if (err) { next(err); return; }
                    if (value)
                    {
                        accounts.deserializeUser(data.username, function (err, user)
                        {
                            req.logIn(user, function (err)
                            {
                                if (err) { next(err); return; }
                                req.flash('info', 'You already have an account with this username and password. You are now logged in.');
                                res.redirect('/');
                            });
                        });
                    }
                    else
                    {
                        req.flash('warning', 'That email address is already registered.');
                        res.render('account/signup', data);
                    }
                });
                return;
            }

            accounts.createUser(data.username, data.password, data.name, function (err, user)
            {
                if (err) { next(err); return; }
                req.logIn(user, function (err)
                {
                    if (err) { next(err); return; }
                    res.redirect('/');
                });
            });
        });
    });

    app.get('/account/success', function (req, res)
    {
        res.redirect(req.session.redirect || '/');
        delete req.session.redirect;
    });

    app.get('/account/password', function (req, res, next)
    {
        res.render('account/password');
    });

    app.post('/account/password', function (req, res, next)
    {
        // validate parameters
        if (req.body.password2 < 6)
        {
            req.flash('error', 'Your password must be at least six characters long.');
        }
        else if (req.body.password2 !== req.body.password3)
        {
            req.flash('error', 'New password does not match.');
        }
        else if (!req.user)
        {
            res.redirect('/');
            return;
        }
        else
        {
            accounts.verify(req.user.email, req.body.password1, function (err, value)
            {
                if (err) { next(err); return; }
                if (value)
                {
                    accounts.setPassword(req.user.email, req.body.password2, function (err)
                    {
                        if (err) { callback(err); return; }
                        req.flash('success', 'Password changed.');
                        res.redirect('/');
                    });
                }
                else
                {
                    req.flash('error', 'Old password does not match.');
                    res.render('account/password');
                }
            });
            return;
        }

        res.render('account/password');
    });
};

