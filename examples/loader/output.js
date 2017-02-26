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

require(/* ./style.less */1);


/******/},
/******/
/******/1: function(module, exports, require) {

require(/* /Users/youngwind/www/fake-webpack/node_modules/style-loader-fake/addStyle */2)(require(/* !/Users/youngwind/www/fake-webpack/node_modules/less-loader-fake/index.js!/Users/youngwind/www/fake-webpack/examples/loader/style.less */3))

/******/},
/******/
/******/2: function(module, exports, require) {

/**
 * @author  youngwind
 */

module.exports = function (cssCode) {
    let styleElement = document.createElement("style");
    styleElement.type = "text/css";
    if (styleElement.styleSheet) {
        styleElement.styleSheet.cssText = cssCode;
    } else {
        styleElement.appendChild(document.createTextNode(cssCode));
    }
    document.getElementsByTagName("head")[0].appendChild(styleElement);
};

/******/},
/******/
/******/3: function(module, exports, require) {

module.exports = ".content {\n  width: 50px;\n  height: 50px;\n  background-color: #000fff;\n}\n"

/******/},
/******/
/******/})