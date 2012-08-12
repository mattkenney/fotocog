var passport = require('passport');

module.exports = function routes()
{
    this.root('pages#main');

    this.match('account/help', 'account#help');
    this.match('account/help', 'account#help', { via: 'post' });
    this.match('account/reset', 'account#reset');
    this.match('account/reset', 'account#reset', { via: 'post' });
    this.match('account/signin', 'account#signin');
    this.match(
        'account/signin',
        passport.authenticate('local',
        {
            successRedirect: '/',
            failureRedirect: '/account/signin',
            failureFlash: true
        }),
        { via: 'post' }
    );
    this.match('account/signout', 'account#signout');
    this.match('account/signup', 'account#signup');
    this.match('account/signup', 'account#signup', { via: 'post' });
    this.match('account/password', 'account#password');
    this.match('account/password', 'account#password', { via: 'post' });

    this.match('m/:handle/:year/:month/:day', 'photos#day');
    this.match('m/:handle/:year/:month', 'photos#month');
    this.match('m/:handle/:year', 'photos#year');
    this.match('m/:handle', 'photos#main');
    this.match('m', 'photos#bare');
};

