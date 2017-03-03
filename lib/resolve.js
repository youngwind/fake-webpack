/**
 * @file 查找模块所在绝对路径
 * @author youngwind
 * @content 我们在引用模块的时候常常是很简单的,比如用相对路径,比如直接用模块名(该模块实际上在当前文件夹的node_modules里或者在上层文件夹的node_modules里)
 *      所以,程序需要处理各种的调用方式
 */

const fs = require('fs');
const path = require('path');
const co = require('co');

/**
 * 根据模块的标志查找到模块的绝对路径
 * @param {string} moduleIdentifier 模块的标志,可能是模块名/相对路径/绝对路径
 * @param {string} context 上下文,入口js所在目录
 * @returns {*|Promise}
 */
module.exports = function (moduleIdentifier, context, options) {
    return co(function *() {
        let results = [];
        let identifiers = [];
        if (moduleIdentifier.indexOf('!') !== -1) {
            return moduleIdentifier.substr(moduleIdentifier.startsWith('!') ? 1 : 0);
        }

        // 将文件类型与预设的loader进行匹配, 比如 less 文件将会匹配到 ['style-loader','less-loader']
        for (let loader of options.loaders) {
            if (loader.test.test(moduleIdentifier)) {
                // 命中某条 loader 规则
                identifiers = loader.loader.split('!');
            }
        }

        identifiers.push(moduleIdentifier);

        // 因为某个 loader 可能的路径有很多,所以需要生成很多备选的路径
        let dirs = generateDirs(context, identifiers);   // 至此,生成待查找 dirs
        
        for (let dir of dirs) {
            let result = yield statPromise(dir);
            if (result) {
                results.push(result);
            }

        }

        return results.join('!');
        // 结果形如: /Users/youngwind/www/fake-webpack/node_modules/fake-style-loader/index.js!/Users/youngwind/www/fake-webpack/node_modules/fake-less-loader/index.js!/Users/youngwind/www/fake-webpack/examples/loader/style.less
    })
};


/**
 * 根据 loaders / 模块名,生成待查找的路径集合
 * @param {string} context 入口文件所在目录
 * @param {array} identifiers 可能是loader的集合,也可能是模块名
 * @returns {Array}
 */
function generateDirs(context, identifiers) {
    let dirs = [];
    for (let identifier of identifiers) {
        if (path.isAbsolute(identifier)) {
            // 绝对路径
            if (!path.extname(identifier)) {
                identifier += '.js';
            }
            dirs.push(identifier);
        } else if (identifier.startsWith('./') || identifier.startsWith('../')) {
            // 相对路径
            dirs.push(path.resolve(context, identifier));
        } else {
            // 模块名,需要逐级生成目录
            let ext = path.extname(identifier);
            if (!ext) {
                ext = '.js';
            }
            let paths = context.split(path.sep);
            let length = paths.length;
            for (let i = length; i > 1; i--) {
                let newContext = paths.slice(0, i).join(path.sep);
                dirs.push(path.resolve(newContext, `./${identifier}${ext}`));
                dirs.push(path.resolve(newContext, `./node_modules`, `./${identifier}${ext}`));
                dirs.push(path.resolve(newContext, './node_modules', `./${identifier}-loader-fake`, `index${ext}`));
            }
        }
    }
    return dirs;
}

/**
 * 判断路径文件是否存在
 * @param {string} path 目标文件路径
 * @returns {Promise}
 */
function statPromise(path) {
    return new Promise(resolve => {
        fs.stat(path, function (err, stats) {
            if (stats && stats.isFile) {
                resolve(path);
                return;
            }
            resolve(false);
        });
    });
}

