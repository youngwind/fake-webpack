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
module.exports = function (moduleIdentifier, context) {
    return co(function *() {
        let result;

        // 模块是绝对路径,只查找一次
        if (path.isAbsolute(moduleIdentifier)) {
            result = yield statPromise(moduleIdentifier);
            return result;
        }

        // 模块是相对路径或者模块就在入口js当前目录(直接用文件名作为调用)
        let absolutePath = path.resolve(context, moduleIdentifier);
        let ext = path.extname(moduleIdentifier);
        absolutePath += ext === '' ? '.js' : '';
        result = yield statPromise(absolutePath);
        if (result) {
            return result;
        }

        // 如果上述的方式都找不到,那么尝试在当前目录的node_modules里面找
        absolutePath = path.resolve(context, './node_modules', moduleIdentifier);
        absolutePath += ext === '' ? '.js' : '';
        result = yield statPromise(absolutePath);
        return result;

        // TODO 还需要处理逐层往上查找的情况
    })
};

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
    })
}