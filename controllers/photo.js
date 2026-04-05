/*
 * Copyright 2012, 2013, 2025, 2026 Matt Kenney
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

var async = require('async')
,   photos = require('../lib/photos')
,   db = require('../lib/db')
;

db.connect();

function checkAccess(req, res, callback)
{
    if (req.params.handle === req.user.handle)
    {
        callback(null, req, res);
        return;
    }
    var key = 'share/' + req.user.uuid;
    db.hGet(key, req.params.handle, function (err, name)
    {
        if (name)
        {
            callback(null, req, res);
            return;
        }
        //TODO: tag based sharing
        console.debug('photo:checkAccess render 403');
        res.status(403).render('403',
        {
            status: 403,
            url: req.url,
            user: req.user
        });
        callback(true);
    });
}

function checkLogin(req, res, callback)
{
    if (!req.user)
    {
        console.debug('photo:checkLogin redirect /account/signin');
        req.session.redirect = req.url;
        res.redirect('/account/signin');
        callback(true);
        return;
    }
    callback(null, req, res);
}

function checkValid(req, res, callback)
{
    var result = false,
        year = 0|req.params.year,
        month = 0|req.params.month,
        day = 0|req.params.day,
        leap = !(year%100 ? year%4 : year%400),
        days = [0,31,leap?29:28,31,30,31,30,31,31,30,31,30,31][month];
    if (
        (req.params.hasOwnProperty('year') && (year < 1582 || 9999 < year)) ||
        (req.params.hasOwnProperty('month') && (month < 1 || 12 < month)) ||
        (req.params.hasOwnProperty('day') && (day < 1 || days < day))
        )
    {
        console.debug('photo:checkValid render 404');
        res.status(404).render('404',
        {
            status: 404,
            url: req.url,
            user: req.user
        });
        callback(true);
        return;
    }
    callback(null, req, res);
}

function checkPath(req, res, callback)
{
    var url = req.headers['x-original-path'] || req.url;
    if (!(/\/$/).test(url) && !(/\/p\//).test(url))
    {
        console.debug('photo:checkPath redirect ' + url + '/');
        res.redirect(url + '/');
        callback(true);
        return;
    }
    callback(null, req, res);
}

function checkRequest(req, res, next)
{
    async.waterfall([
        function (callback)
        {
            callback(null, req, res);
        },
        checkLogin,
        checkAccess,
        checkPath,
        checkValid
    ], function (err, req, res)
    {
        if (!err) next(req, res);
    });
}

module.exports = function (app)
{
    app.get('/m', function (req, res)
    {
        console.debug('photo:/m redirect /');
        res.redirect('/');
    });

    app.get('/m/:handle', function (req, res, next)
    {
        checkRequest(req, res, function()
        {
            photos.years(req.params.handle, function (err, data)
            {
                if (err) return next(err);

                console.debug('photo:handle render photo/root');
                res.render('photo/root', { years: data });
            });
        });
    });

    app.get('/m/:handle/p/:photo', function (req, res, next)
    {
        checkRequest(req, res, function()
        {
            db.hGet("buckets", req.params.handle, function (err, bucket)
            {
                photos.photo(bucket, req.params.handle, req.params.photo, function (url)
                {
                    console.debug('photo:photo redirect ' + url);
                    res.redirect(url);
                });
            });
        });
    });

    app.get('/m/:handle/:year', function (req, res, next)
    {
        checkRequest(req, res, function()
        {
            photos.months(req.params.handle, req.params.year, function (err, data)
            {
                if (err) return next(err);

                var locals = {
                    year: req.params.year,
                    months: []
                };
                for (var i = 0; i < 12; i++)
                {
                    locals.months[i] = {};
                    locals.months[i].text = req.locale_info.mon[i];
                }
                for (var i = 0; data && i < data.length; i++)
                {
                    locals.months[data[i] - 1].href = data[i] + '/';
                }
                locals.tri1 = locals.months.slice(0, 4);
                locals.tri2 = locals.months.slice(4, 8);
                locals.tri3 = locals.months.slice(8, 12);
                console.debug('photo:year render photo/year');
                res.render('photo/year', locals);
            });
        });
    });

    app.get('/m/:handle/:year/:month', function (req, res, next)
    {
        checkRequest(req, res, function()
        {
            photos.days(req.params.handle, req.params.year, req.params.month, function (err, data)
            {
                if (err) return next(err);

                console.debug('photo:month render photo/month');
                res.render('photo/month', {
                    year: req.params.year,
                    days: data,
                    month: req.locale_info.mon[req.params.month - 1],
                    weeks: photos.cal(req.params.year, req.params.month, req.locale_info)
                });
            });
        });
    });

    app.get('/m/:handle/:year/:month/:day', function (req, res, next)
    {
        checkRequest(req, res, function()
        {
            photos.photos(req.params.handle, req.params.year, req.params.month, req.params.day, function (err, data)
            {
                if (err) return next(err);

                console.debug('photo:day render photo/day');
                res.render('photo/day', {
                    year: req.params.year,
                    month: req.locale_info.mon[req.params.month - 1],
                    day: 0|req.params.day,
                    photos: data
                });
            });
        });
    });
};

