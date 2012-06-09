var express = require('express'),
    swig = require('swig');

module.exports = function ()
{
    swig.init({ root: views, allowErrors: true });

    this.register('.swig', swig);

    this.use(express.errorHandler());
};

