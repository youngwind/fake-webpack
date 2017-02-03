/**
 * @file  webpack主程序入口
 * @author  youngwind
 */

const path = require('path');
const co = require('co');
const fs = require('fs');
const buildDeps = require('./buildDeps.js');
const writeChunk = require('./writeChunk');
const templateSingle = fs.readFileSync(path.join(__dirname, 'templateSingle.js'));

/**
 * 负责调用其他模块
 * @param {string} mainModule 主入口模块
 * @param {object} options 构建的选项
 */
module.exports = function (mainModule, options) {
    co(function *() {
        // 分析模块间的依赖关系,生成模块依赖关系
        let depTree = yield buildDeps(mainModule, options);
        // 拼接生成目标JS文件
        let outputJS = generateOutputJS(depTree);
        fs.writeFile(options.output, outputJS, 'utf-8', function (err) {
            if (err) {
                throw err;
            }
        });
    }).catch(err => console.log(`发生错误${err}`));
};


/**
 * 拼接目标JS文件
 * @param {object} depTree 模块依赖关系
 * @returns {string} 目标JS文件
 */
function generateOutputJS(depTree) {
    let buffer = [];
    buffer.push(templateSingle);
    buffer.push('/******/({\n');
    // 拼接模块
    let chunks = writeChunk(depTree);
    buffer.push(chunks);
    buffer.push('/******/})');
    buffer = buffer.join('');
    return buffer;
}