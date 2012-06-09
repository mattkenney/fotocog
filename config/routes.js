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
    this.match('account/signout', function (request, response)
    {
        request.logOut();
        response.redirect('/');
    });
    this.match('account/signup', 'account#signup');
    this.match('account/signup', 'account#signup', { via: 'post' });
    this.match('account/password', 'account#password');
    this.match('account/password', 'account#password', { via: 'post' });
};

