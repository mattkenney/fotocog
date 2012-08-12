var path = require('path'),
    connect = require('connect'),
    passport = require('passport'),
    locale = require('locale'),
    locale_info = require('locale_info'),
    credentials = require(path.resolve(__dirname, '../credentials'));

module.exports = function()
{
    this.set('views', path.resolve(__dirname, '../../app/views'));
    this.set('view engine', 'swig');
    this.set('view options', { layout: false });

    this.use(connect.bodyParser());
    this.use(connect.cookieParser(credentials.cookie));
    this.use(connect.cookieSession());
    this.use(connect.logger());
    this.use(connect.static(path.resolve(__dirname, '../../public')));
    this.use(passport.initialize());
    this.use(passport.session());
    this.use(locale());
    this.use(locale_info.connect());

    this.use(this.router);

    this.use(function (request, response, next)
    {
        response.render('404',
        {
            status: 404,
            url: request.url
        });
    });
    this.use(function (error, request, response, next)
    {
        response.render('500',
        {
            status: error.status || 500,
            error: error
        });
    });
};

