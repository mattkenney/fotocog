var locomotive = require('locomotive'),
    photos = require('photos');

function checkAccess(controller)
{
    if (controller.request.params.handle === controller.request.user.handle)
    {
        return false;
    }
    //TODO: tag based sharing
    controller.response.render('403',
    {
        status: 403,
        url: controller.request.url
    });
    return true;
}

function checkValid(controller)
{
    var result = false,
        params = controller.request.params,
        year = 0|params.year,
        month = 0|params.month,
        day = 0|params.day,
        leap = !(year%100 ? year%4 : year%400),
        days = [0,31,leap?29:28,31,30,31,30,31,31,30,31,30,31][month];
    if (
        (params.hasOwnProperty('year') && (year < 1582 || 9999 < year)) ||
        (params.hasOwnProperty('month') && (month < 1 || 12 < month)) ||
        (params.hasOwnProperty('day') && (day < 1 || days < day))
        )
    {
        controller.response.render('404',
        {
            status: 404,
            url: controller.request.url
        });
        return true;
    }
    return false;
}

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
console.log('year');
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

