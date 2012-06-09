var connect = require('connect'),
    passport = require('passport'),
    credentials = require(__dirname + '/../credentials');

module.exports = function()
{
    this.set('views', __dirname + '/../../app/views');
    this.set('view engine', 'swig');
    this.set('view options', { layout: false });

    this.use(connect.bodyParser());
    this.use(connect.cookieParser(credentials.cookie));
    this.use(connect.cookieSession());
    this.use(connect.logger());
    this.use(connect.static(__dirname + '/../../public'));
    this.use(passport.initialize());
    this.use(passport.session());
    this.use(this.router);
};

