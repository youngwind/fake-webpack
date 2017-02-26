#!/usr/bin/env node

const path = require('path');
const argv = require('yargs').argv;
const webpack = require('../lib/webpack');

//参数处理
let options = {};
let nonHyphenatedOptions = argv._;
if (!nonHyphenatedOptions.length) {
    // 无任何参数
    return;
}

// 第一个参数,指定入口js文件
options.input = path.join(process.cwd(), nonHyphenatedOptions[0]);

// 上下文,入口js文件所在目录
options.context = path.dirname(options.input);

// 第二个参数,指定出口js文件
if (nonHyphenatedOptions.length === 1) {
    options.output = path.join(options.context, 'output.js');
} else {
    let output = nonHyphenatedOptions[1];
    if (path.isAbsolute(output)) {
        options.output = output
    } else {
        options.output = path.join(options.context, output)
    }
}

// 定义jsonp的函数名
options.outputJsonpFunction = 'webpackJsonp';

// 解析出目标output.js所在文件夹
options.outputDirectory = path.dirname(options.output);

// 解析出目标js文件名的格式,默认为 '.output.js'
options.outputPostfix = '.' + path.basename(options.output);

// 预设loader
options.resolve = options.resolve || {};
options.resolve.loaders = options.resolve.loaders || [];
options.resolve.loaders.push({
    test: /\.less$/,
    loader: 'style!less'
});

webpack(options.input, options);


