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
const templateAsync = fs.readFileSync(path.join(__dirname, 'templateAsync.js'));

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
        for (let chunkId in depTree.chunks) {
            if (!depTree.chunks.hasOwnProperty(chunkId)) continue;
            let buffer = [];
            let chunk = depTree.chunks[chunkId];
            let filename = (chunk.id === 0 ? options.output : path.join(options.outputDirectory, chunk.id + options.outputPostfix));
            if (chunk.id === 0) {
                // 主chunk
                if (Object.keys(depTree.chunks).length > 1) {
                    buffer.push(templateAsync);
                    buffer.push('/******/({a:');
                    buffer.push(`"${options.outputPostfix}"`);
                    buffer.push(',b:');
                    buffer.push(`"${options.outputJsonpFunction}"`);
                    buffer.push(',\n');
                } else {
                    buffer.push(templateSingle);
                    buffer.push('/******/({\n');
                }
            } else {
                // jsonp chunk
                buffer.push('/*****/');
                buffer.push(options.outputJsonpFunction);
                buffer.push('(');
                buffer.push(chunk.id);
                buffer.push(', {\n');
            }

            // 拼接modules进对应的chunk中
            let chunks = writeChunk(depTree, chunk);
            buffer.push(chunks);
            buffer.push('/******/})');
            buffer = buffer.join('');

            // 写文件
            fs.writeFile(filename, buffer, 'utf-8', function (err) {
                if (err) {
                    throw err;
                }
            });
        }

    }).catch(err => console.log(`发生错误${err}, ${err.stack}`));
};
