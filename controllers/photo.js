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

var photos = require('photos');

function checkAccess(req, res)
{
    if (req.params.handle === req.user.handle)
    {
        return false;
    }
    //TODO: tag based sharing
    res.render('403',
    {
        status: 403,
        url: req.url,
        user: req.user
    });
    return true;
}

function checkValid(req, res)
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
        res.render('404',
        {
            status: 404,
            url: req.url,
            user: req.user
        });
        return true;
    }
    return false;
}

function checkRequest(req, res)
{
    if (!req.user)
    {
        req.session.redirect = req.url;
        res.redirect('/account/signin');
        return true;
    }
    if (checkAccess(req, res))
    {
        return true;
    }
    if (!(/\/$/).test(req.url))
    {
        res.redirect(req.url + '/');
        return true;
    }
    if (checkValid(req, res))
    {
        return true;
    }
    return false;
}

module.exports = function (app)
{
    app.get('/m', function (req, res)
    {
        res.redirect('/');
    });

    app.get('/m/:handle', function (req, res, next)
    {
        if (checkRequest(req, res))
        {
            return;
        }

        photos.years(req.params.handle, function (err, data)
        {
            if (err) { next(err); return; }

            res.render('photo/root', { years: data });
        });
    });

    app.get('/m/:handle/:year', function (req, res, next)
    {
        if (checkRequest(req, res))
        {
            return;
        }

        photos.months(req.params.handle, req.params.year, function (err, data)
        {
            if (err) { next(err); return; }

            var locals = {
                year: req.params.year,
                months: []
            };
            for (var i = 0; data && i < 12; i++)
            {
                locals.months[i] = {};
                locals.months[i].text = req.locale_info.mon[i];
                if (data[i + 1])
                {
                    locals.months[i].href = (i + 1) + '/';
                }
            }
            locals.tri1 = locals.months.slice(0, 4);
            locals.tri2 = locals.months.slice(4, 8);
            locals.tri3 = locals.months.slice(8, 12);
            res.render('photo/year', locals);
        });
    });

    app.get('/m/:handle/:year/:month', function (req, res, next)
    {
        if (checkRequest(req, res))
        {
            return;
        }

        photos.days(req.params.handle, req.params.year, req.params.month, function (err, data)
        {
            if (err) { next(err); return; }

            res.render('photo/month', {
                year: req.params.year,
                days: data,
                month: req.locale_info.mon[req.params.month - 1],
                weeks: photos.cal(req.params.year, req.params.month, req.locale_info)
            });
        });
    });

    app.get('/m/:handle/:year/:month/:day', function (req, res, next)
    {
        if (checkRequest(req, res))
        {
            return;
        }

        photos.photos(req.params.handle, req.params.year, req.params.month, req.params.day, function (err, data)
        {
            if (err) { next(err); return; }

            res.render('photo/day', {
                year: req.params.year,
                month: req.locale_info.mon[req.params.month - 1],
                day: 0|req.params.day,
                photos: data
            });
        });
    });
};

/*


var PhotosController = new locomotive.Controller();

PhotosController.bare = function ()
{
    this.redirect('/');
};

PhotosController.main = function ()
{
    var self = this;
    photos.years(self.request.params.handle, function (err, data)
    {
        if (err)
        {
            self.error(err);
            return;
        }
        self.years = data;
        self.render();
    });
};

PhotosController.year = function ()
{
    var self = this;
    photos.months(self.request.params.handle, self.request.params.year, function (err, data)
    {
        if (err)
        {
            self.error(err);
            return;
        }
        self.year = self.request.params.year;
        self.months = [];
        for (var i = 0; data && i < 12; i++)
        {
            self.months[i] = {};
            self.months[i].text = self.request.locale_info.mon[i];
            if (data[i + 1])
            {
                self.months[i].href = (i + 1) + '/';
            }
        }
        self.tri1 = self.months.slice(0, 4);
        self.tri2 = self.months.slice(4, 8);
        self.tri3 = self.months.slice(8, 12);
        self.render();
    });
};

PhotosController.month = function ()
{
    var self = this;
    photos.days(self.request.params.handle, self.request.params.year, self.request.params.month, function (err, data)
    {
        if (err)
        {
            self.error(err);
            return;
        }
        self.year = self.request.params.year;
        self.days = data;
        self.month = self.request.locale_info.mon[self.request.params.month - 1];
        self.weeks = photos.cal(self.year, self.request.params.month, self.request.locale_info);
        self.render();
    });
};

PhotosController.day = function ()
{
    var self = this;
    photos.photos(self.request.params.handle, self.request.params.year, self.request.params.month, self.request.params.day, function (err, data)
    {
        if (err)
        {
            self.error(err);
            return;
        }
        self.year = self.request.params.year;
        self.month = self.request.locale_info.mon[self.request.params.month - 1];
        self.day = 0|self.request.params.day;
        self.photos = data;
        self.render();
    });
};

for (key in PhotosController)
{
    if (PhotosController.hasOwnProperty(key) && typeof PhotosController[key] === 'function')
    {
        PhotosController[key] = (function (done)
        {
            return function ()
            {
                this.user = this.request.user;
                if (!this.user)
                {
                    this.request.session.redirect = this.request.url;
                    this.redirect('/account/signin');
                    return;
                }
                if (checkAccess(this))
                {
                    return;
                }
                if (!(/\/$/).test(this.request.url))
                {
                    this.redirect(this.request.url + '/');
                    return;
                }
                if (checkValid(this))
                {
                    return;
                }
                done.apply(this);
            }
        })(PhotosController[key]);
    }
}

module.exports = PhotosController;
*/

