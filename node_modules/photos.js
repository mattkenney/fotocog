var credentials = require('../credentials'),
    AWS = require('aws-sdk'),
    s3 = new AWS.S3(credentials.aws);

exports = module.exports =
{
    cal: function (year, month, locale_info)
    {
        var result = [ [], [] ],
            row = 1,
            d1 = new Date(year, month - 1, 1, 12, 0, 0, 0),
            col = (d1.getDay() - locale_info.first_weekday + 8) % 7,
            d2 = new Date(year, month, 0, 12, 0, 0, 0),
            last = d2.getDate(),
            i;
        for (i = 0; i < 7; i++)
        {
            result[0][i] = locale_info.abday[(i - locale_info.first_weekday + 8) % 7];
        }
        for (i = 0; i < col; i++)
        {
            result[1][i] = '';
        }
        for (i = 1; i <= last; i++)
        {
            if (!result[row])
            {
                result[row] = [];
            }
            result[row][col] = i;
            if (++col > 6)
            {
                col = 0;
                row++;
            }
        }
        for (i = col; i > 0 && i < 7; i++)
        {
            result[row][i] = '';
        }
        return result;
    },

    /**
     * For the specified user, year, and month, what days have photos?
     */
    days: function (handle, year, month, done)
    {
        s3.listObjects(
        {
            Bucket: 'fotocog',
            Delimiter: '/',
            Prefix:
                encodeURIComponent(handle) +
                '/thumbnail/' +
                encodeURIComponent(year) +
                '/' +
                encodeURIComponent(String(100 + (0|month)).substring(1)) +
                '/'
        }, function (err, data)
        {
            var result = [],
                count = data && data.CommonPrefixes && data.CommonPrefixes.length;
            for (var i = 0; i < count; i++)
            {
                if ((/\/([0-9]{2})\/$/).test(data.CommonPrefixes[i].Prefix))
                {
                    result[0|RegExp.$1] = true;
                }
            }
            done(err, result);
        });
    },

    /**
     * For the specified user and year, what months have photos?
     */
    months: function (handle, year, done)
    {
        s3.listObjects(
        {
            Bucket: 'fotocog',
            Delimiter: '/',
            Prefix: encodeURIComponent(handle) + '/thumbnail/' + encodeURIComponent(year) + '/'
        }, function (err, data)
        {
            var result = [],
                count = data && data.CommonPrefixes && data.CommonPrefixes.length;
            for (var i = 0; i < count; i++)
            {
                if ((/\/([0-9]{2})\/$/).test(data.CommonPrefixes[i].Prefix))
                {
                    result.unshift(0|RegExp.$1);
                }
            }
            done(err, result);
        });
    },

    /**
     * For the specified bucket and key, make a signed URL
     */
    photo: function (bucket, handle, key, done)
    {
        s3.getSignedUrl('getObject',
        {
            Bucket: bucket || 'fotocog',
            Expires: 60,
            Key: (bucket ? '' : handle + '/p/') + key
        }, function (err, url)
        {
            done(url);
        });
    },

    /**
     * For the specified user, year, month, and day, what photos are there?
     */
    photos: function (handle, year, month, day, done)
    {
        s3.listObjects(
        {
            Bucket: 'fotocog',
            Prefix:
                encodeURIComponent(handle) +
                '/thumbnail/' +
                encodeURIComponent(year) +
                '/' +
                encodeURIComponent(String(100 + (0|month)).substring(1)) +
                '/' +
                encodeURIComponent(String(100 + (0|day)).substring(1)) +
                '/'
        }, function (err, data)
        {
            var result = [],
                count = data && data.Contents && data.Contents.length;

            function thumbnailer()
            {
                if (result.length >= count)
                {
                    //fullsizer();
                    done(err, result);
                    return;
                }

                s3.getSignedUrl('getObject',
                {
                    Bucket: 'fotocog',
                    Expires: 60,
                    Key: data.Contents[result.length].Key
                }, function (err, url)
                {
                    if ((/([^\/]+)$/).test(data.Contents[result.length].Key))
                    {
                        var fullsize = '/m/' + handle + '/p/' + RegExp.$1;
                    }
                    result.push({
                        thumbnail: url,
                        fullsize: fullsize
                    });
                    thumbnailer();
                });
            }
            thumbnailer();
        });
    },

    /**
     * For the specified user, what years have photos?
     */
    years: function (handle, done)
    {
        s3.listObjects(
        {
            Bucket: 'fotocog',
            Delimiter: '/',
            Prefix: encodeURIComponent(handle) + '/thumbnail/'
        }, function (err, data)
        {
            var result = [],
                count = data && data.CommonPrefixes && data.CommonPrefixes.length;
            for (var i = 0; i < count; i++)
            {
                if ((/\/([0-9]{4})\/$/).test(data.CommonPrefixes[i].Prefix))
                {
                    result.unshift(0|RegExp.$1);
                }
            }
            done(err, result);
        });
   }
};

