#!/usr/bin/env node
/*
 * Copyright 2012, 2025 Matt Kenney
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

var bodyParser = require('body-parser'),
    cookieSession = require('cookie-session'),
    credentials = require('./credentials'),
    express = require('express'),
    flash = require('connect-flash'),
    locale_info = require('./lib/locale_info'),
    nunjucks = require('nunjucks'),
    app = express();

// ***** Initialization *****

nunjucks.configure('views', {
    autoescape: true,
    express: app
});

app.enable('trust proxy');

app.set('port', process.env.PORT || 3000);
app.set('view engine', 'html');
app.set('views', './views');

// ***** Middleware *****

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieSession({ keys: [credentials.cookie] }));
app.use(flash());
app.use(locale_info());

// flash support -- we need to call req.flash() just before render()
app.use(function(req, res, next)
{
    var render = res.render;
    res.render = function (view, locals, callback)
    {
        if (typeof callback !== 'function' && typeof locals === 'function')
        {
            callback = locals;
            locals = {};
        }
        else if (!locals)
        {
            locals = {};
        }
        locals.alerts = req.flash();
        render.call(res, view, locals, callback);
    };
    next();
});

// make cookie-session compatitble with passport 6+
app.use(function(req, _, next) {
  if (req.session && !req.session.regenerate) {
    req.session.regenerate = cb => {
      cb();
    };
  }

  if (req.session && !req.session.save) {
    req.session.save = cb => {
      cb();
    };
  }

  next();
});

// ***** Controllers *****

// account must be required first because it handles authentication
require('./controllers/account')(app);

require('./controllers/photo')(app);

require('./controllers/root')(app);

// ***** Error handling *****

// if we get past all the controllers then we 404
app.use(function (req, res, next)
{
    res.render('404',
    {
        status: 404,
        url: req.url,
        user: req.user
    });
});

// pretty error page
app.use(function (err, req, res, next)
{
    res.render('500',
    {
        status: err.status || 500,
        error: err,
        user: req.user
    });
});

// ***** Server *****

app.listen(app.get('port'));

console.log('Listening on port ' + app.get('port'));
