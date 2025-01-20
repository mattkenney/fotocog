/*
 * Copyright 2012, 2015 Matt Kenney
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
var _ = require('underscore')
,   redis = require("redis").createClient({ legacyMode: true })
;

redis.connect();

module.exports = function (app)
{
    app.get('/', function (req, res)
    {
        if (req.user)
        {
            var key = 'share/' + req.user.uuid;
            redis.hGetAll(key, function (err, shares)
            {
                shares = _.map(shares, function (value, key)
                {
                    return (
                    {
                        handle: key,
                        name: value
                    });
                });
                res.render('root',
                {
                    shares: shares
                });
            });
        }
        else
        {
            res.render('root');
        }
    });
};

