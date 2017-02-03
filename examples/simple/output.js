/******/(function(modules) {
/******/	var installedModules = {};
/******/	function require(moduleId) {
/******/		if(installedModules[moduleId])
/******/			return installedModules[moduleId].exports;
/******/		var module = installedModules[moduleId] = {
/******/			exports: {}
/******/		};
/******/		modules[moduleId](module, module.exports, require);
/******/		return module.exports;
/******/	}
/******/	return require(0);
/******/})
/******/({
/******/0: function(module, exports, require) {

let a = require(/* a */1);
let b = require(/* b */2);
let c = require(/* c */3);
a();
b();
c();


/******/},
/******/
/******/1: function(module, exports, require) {

// module a

module.exports = function () {
    console.log('a')
};

/******/},
/******/
/******/2: function(module, exports, require) {

// module b

module.exports = function () {
    console.log('b')
};

/******/},
/******/
/******/3: function(module, exports, require) {

module.exports = function () {
    console.log('c')
}

/******/},
/******/
/******/})