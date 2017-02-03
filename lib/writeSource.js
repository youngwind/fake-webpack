/**
 * @file 将依赖模块名替换成依赖模块id
 * @author  youngwind
 */


/**
 * 将依赖模块名替换成依赖模块id
 * @param {object} module 模块对象
 * @returns {string} 替换模块名之后的模块内容字符串
 */
module.exports = function (module) {
    let replaces = [];
    let source = module.source;
    if (!module.requires || !module.requires.length) return source;
    module.requires.forEach(requireItem => {
        if(!requireItem.nameRange || !requireItem.name || !requireItem.id) return;
        let prefix = `/* ${requireItem.name} */`;
        replaces.push({
            from: requireItem.nameRange[0],
            to: requireItem.nameRange[1],
            value: prefix + requireItem.id
        });
    });

    // 排序,从后往前地替换模块名,这样才能保证正确替换所有的模块
    replaces.sort((a, b) => {
        return b.from - a.from;
    });

    // 逐个替换模块名为模块id
    replaces.forEach(replace => {
        let target = source.substring(replace.from, replace.to);
        source = source.replace(target, replace.value);
    });

    return source;
};

