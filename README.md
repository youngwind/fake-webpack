# 简介
通过学习 webpack 的源码,模仿如何写一个简单版的 webpack。相关的源码分析文章请参考[我的博客](https://github.com/youngwind/blog/labels/webpack%20%E6%BA%90%E7%A0%81)。
如何启动及调试本项目,见最下面。

# 实现功能
- [x] 将所有模块打包到一个 JS 文件 (例子 example/simple)
- [x] 代码切割,也就是 code-splitting (例子 example/code-splitting)
- [x] loader机制(例子 example/loader, 内置了less-loader和style-loader,可以加载less文件)
- [ ] 待定

# 最简单的例子
```js
// example.js

let a = require('a');
let b = require('b');
let c = require('c');
a();
b();
c();
```

```js
// 输出 output.js

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
```
# code-splitting
```js
// example.js

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
```

```js
// output.js

/******/(function(document, undefined) {
/******/	return function(modules) {
/******/		var installedModules = {}, installedChunks = {0:1};
/******/		function require(moduleId) {
/******/			if(typeof moduleId !== "number") throw new Error("Cannot find module '"+moduleId+"'");
/******/			if(installedModules[moduleId])
/******/				return installedModules[moduleId].exports;
/******/			var module = installedModules[moduleId] = {
/******/				exports: {}
/******/			};
/******/			modules[moduleId](module, module.exports, require);
/******/			return module.exports;
/******/		}
/******/		require.ensure = function(chunkId, callback) {
/******/			if(installedChunks[chunkId] === 1) return callback(require);
/******/			if(installedChunks[chunkId] !== undefined)
/******/				installedChunks[chunkId].push(callback);
/******/			else {
/******/				installedChunks[chunkId] = [callback];
/******/				var head = document.getElementsByTagName('head')[0];
/******/				var script = document.createElement('script');
/******/				script.type = 'text/javascript';
/******/				script.src = chunkId+modules.a;
/******/				head.appendChild(script);
/******/			}
/******/		};
/******/		window[modules.b] = function(chunkId, moreModules) {
/******/			for(var moduleId in moreModules)
/******/				modules[moduleId] = moreModules[moduleId];
/******/			var callbacks = installedChunks[chunkId];
/******/			installedChunks[chunkId] = 1;
/******/			for(var i = 0; i < callbacks.length; i++)
/******/				callbacks[i](require);
/******/		};
/******/		return require(0);
/******/	};
/******/})(document)
/******/({a:".output.js",b:"webpackJsonp",
/******/0: function(module, exports, require) {

var a = require(/* a */1);
var b = require(/* b */2);
a();
require.ensure(1, function(require) {
    require(/* b */2)();
    var d = require(/* d */4);
    var c = require(/* c */3);
    c();
    d();
});

require.ensure(2, function (require) {
   require(/* f */6)();
});

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
    console.log('b');
}

/******/},
/******/
/******/})
```

```js
// 1.output.js

/*****/webpackJsonp(1, {
/******/3: function(module, exports, require) {

// module c
console.log('执行模块c');
module.exports = function () {
    console.log('c');
}

/******/},
/******/
/******/4: function(module, exports, require) {

// module d

module.exports = function () {
    console.log('d');
};

/******/},
/******/
/******/})
```

```js
// 2.output.js

/*****/webpackJsonp(2, {
/******/5: function(module, exports, require) {

// module e

console.log('执行e');
module.exports = function () {
    console.log('e');
}

/******/},
/******/
/******/6: function(module, exports, require) {

// module f

module.exports = function () {
    console.log('f');
}

/******/},
/******/
/******/})
```

# loader 机制
```js
// example.js

require('./style.less');
```

```less
// style.less

@color: #000fff;

.content {
    width: 50px;
    height: 50px;
    background-color: @color;
}
```

```js
// output.js
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
```

# 如何运行本项目
```
git clone https://github.com/youngwind/fake-webpack.git
cd fake-webpack
npm link // 将 fake-webpack 命令注册到全局
```
这时候你就可以在任意一个文件夹调用 `fake-webpack` 命令, 下面是运行 example 的步骤

1. 分别 cd 进去 examples 的各个子文件夹。
2. 执行 `fake-webpack ./example.js`,可以看到对应生成的 output.js 文件
3. 用浏览器打开 index.html, 便可以观察到 output.js 的运行结果。

如果需要调试的话,请自行搜索" WebStorm 调试命令行"。