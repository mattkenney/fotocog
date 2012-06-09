var locomotive = require('locomotive');

var PagesController = new locomotive.Controller();

PagesController.main = function()
{
    this.alerts = this.request.flash();
    this.user = this.request.user;
    this.render();
};

module.exports = PagesController;

