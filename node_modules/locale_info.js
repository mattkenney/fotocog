#!/usr/bin/node
/*
 * Copyright 2012 Matt Kenney
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var child_process = require('child_process')
    utf8Compatible = /^\s*((UTF-8)|(ANSI_X3\.4-1968))\s*$/;

/**
 * Returns a Connect style middleware function. The returned function will
 * add a locale_info object to the request that corresponds to the locale
 * property of the request.
 */
module.exports = function (defaultLocale)
{
    var locales,
        callbacks = [],
        app = function (request, response, next)
        {
            if (locales)
            {
                request.locale_info =
                    locales[request.locale] ||
                    locales[defaultLocale] ||
                    locales.C;
                next();
            }
            else
            {
                callbacks.push(closure(request, response, next));
            }
        },
        closure = function (request, response, next)
        {
            return function ()
            {
                app(request, response, next);
            };
        };

    module.exports.getAllLocaleInfo(function (err, data)
    {
        locales = data || {};

        // if any requests were waiting for this
        while (callbacks.length)
        {
            callbacks.pop()();
        }
    });

    return app;
};

/**
 * Get the info for all available UTF-8 (and pure ASCII) locales in the
 * system.
 */
module.exports.getAllLocaleInfo = function (done)
{
    var result = {},
        count = 0,
        group = function (locale)
        {
            if ((/^(.*).utf8$/).test(locale))
            {
                locale = RegExp.$1;
            }
            return function (err, data)
            {
                if (data)
                {
                    result[locale] = data;
                }
                if (--count <= 0)
                {
                    done(null, result);
                }
            };
        },
        parse = function (error, stdout, stderr)
        {
            var warning = stderr.toString();
            if (warning)
            {
                console.warn(warning);
            }
            if (error)
            {
                console.error(error);
            }
            var lines = stdout.toString().split(/[\n\r]+/);
            count = lines.length;
            for (var i = 0; i < lines.length; i++)
            {
                module.exports.getLocaleInfoUtf8(lines[i], group(lines[i]));
            }
        };

    child_process.execFile(
        '/usr/bin/locale',
        ['-a'],
        null,
        parse
    );
};

/**
 * Get the info for the specified locale.
 */
module.exports.getLocaleInfo = function (locale, done)
{
    var categories =
        [
            'LC_ADDRESS',
            'LC_COLLATE',
            'LC_CTYPE',
            'LC_IDENTIFICATION',
            'LC_MEASUREMENT',
            'LC_MESSAGES',
            'LC_MONETARY',
            'LC_NAME',
            'LC_NUMERIC',
            'LC_PAPER',
            'LC_TELEPHONE',
            'LC_TIME'
        ],
        result = {},
        count = 0,
        parse = function (error, stdout, stderr)
        {
            var warning = stderr.toString();
            if (warning)
            {
                console.warn(warning);
            }
            if (error)
            {
                console.error(error);
            }
            var lines = stdout.toString().split(/[\n\r]+/);
            for (var i = 0; i < lines.length; i++)
            {
                if (lines[i].length == 0)
                {
                    continue;
                }
                var pair = lines[i].split(/=/, 2);
                if (pair.length == 1)
                {
                    console.warn('no =? ' + lines[i]);
                    continue;
                }
                // most values are in double quotes
                if ((/^"(.*)"$/).test(pair[1]))
                {
                    pair[1] = RegExp.$1;
                }
                // split on semicolon
                var parts = pair[1].split(/";"/);
                if (parts.length == 1)
                {
                    parts = pair[1].split(/;/);
                }
                // convert integer values to Number
                for (var j = 0; j < parts.length; j++)
                {
                    if ((/^((0)|((-?)[1-9]+[0-9]*))$/).test(parts[j]))
                    {
                        parts[j] = 0|parts[j];
                    }
                }
                result[pair[0]] = parts.length > 1 ? parts : parts[0];
            }

            if (++count >= categories.length)
            {
                if (!utf8Compatible.test(result.charmap))
                {
                    console.warn('Warning: not UTF-8: ' + result.charmap);
                }
                done(null, result);
            }
        };

    for (var i = 0; i < categories.length; i++)
    {
        child_process.execFile(
            '/usr/bin/locale',
            ['-k', categories[i]],
            { env:{ LC_ALL: locale } },
            parse
        );
    }
};

/**
 * Get the info for the specified locale if it uses UTF-8 or pure ASCII.
 */
module.exports.getLocaleInfoUtf8 = function (locale, done)
{
    var parse = function (error, stdout, stderr)
        {
            var warning = stderr.toString();
            if (warning)
            {
                console.warn(warning);
            }
            if (error)
            {
                console.error(error);
            }
            if (utf8Compatible.test(stdout.toString()))
            {
                module.exports.getLocaleInfo(locale, function (err, data)
                {
                    done(err, data);
                });
            }
            else
            {
                done();
            }
        };

    if ((/^\s*$/).test(locale))
    {
        done();
        return;
    }

    child_process.execFile(
        '/usr/bin/locale',
        ['charmap'],
        { env:{ LC_ALL: locale } },
        parse
    );
};

// if run directly then dump the available locales to stdout
if (!module.parent)
{
    module.exports.getAllLocaleInfo(function (err, data)
    {
        console.log(JSON.stringify(data, null, 4));
        if (err)
        {
            console.warn(err);
        }
    });
}

