/**
 * @file  将各个模块写入目标文件
 * @author  youngwind
 */

const writeSource = require('./writeSource');

/**
 * 循环遍历各个模块,输出模块头部
 * @param {object} depTree 模块依赖关系
 * @param {object} chunk 块
 * @returns {string}
 */
module.exports = function (depTree, chunk) {
    let modules = chunk.modules;
    let buffer = [];
    for (let moduleId in modules) {
        if (!modules.hasOwnProperty(moduleId)) continue;

        // 忽略不属于此chunk的module
        if (modules[moduleId] === 'in-parent') continue;

        let module = depTree.modulesById[moduleId];
        buffer.push('/******/');
        buffer.push(module.id);
        buffer.push(': function(module, exports, require) {\n\n');

        // 调用此方法,拼接每一个具体的模块的内部内容
        buffer.push(writeSource(module, depTree));

        buffer.push('\n\n/******/},\n/******/\n');
    }
    return buffer.join('');
};

