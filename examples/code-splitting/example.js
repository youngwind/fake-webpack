var a = require("a");
var b = require("b");
a();
require.ensure(["c"], function(require) {
    require("b")();
    var d = require("d");
    var c = require('c');
    c();
    d();
});

require.ensure(['e'], function (require) {
   require('f')();
});