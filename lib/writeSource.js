/**
 * @file 将依赖模块名替换成依赖模块id
 * @author  youngwind
 */


/**
 * 将依赖模块名替换成依赖模块id
 * @param {object} module 模块对象
 * @param {object} depTree 模块依赖关系对象
 * @returns {string} 替换模块名之后的模块内容字符串
 */
module.exports = function (module, depTree) {
    let replaces = [];
    let source = module.source;
    if (!module.requires || !module.requires.length) return source;

    /**
     * 收集模块中的require
     * @param {object} requireItem 依赖的模块
     */
    function genReplaceRequire(requireItem) {
        if (!requireItem.nameRange || !requireItem.name) return;
        let prefix = `/* ${requireItem.name} */`;
        replaces.push({
            from: requireItem.nameRange[0],
            to: requireItem.nameRange[1],
            value: prefix + (requireItem.id || depTree.mapModuleNameToId[requireItem.name])
        });
        // TODO 此处通过模块名来索引id,可能存在一定的隐患
    }

    /**
     * 收集模块中的require.ensure
     * @param {object} asyncItem 依赖的模块
     */
    function genReplaceAsync(asyncItem) {
        if (asyncItem.requires) {
            asyncItem.requires.forEach(genReplaceRequire);
        }
        if (asyncItem.asyncs) {
            asyncItem.asyncs.forEach(genReplaceAsync);
        }
        if (asyncItem.namesRange) {
            replaces.push({
                from: asyncItem.namesRange[0],
                to: asyncItem.namesRange[1],
                value: asyncItem.chunkId
            });
        }
    }

    if (module.requires) {
        module.requires.forEach(genReplaceRequire);
    }
    if (module.asyncs) {
        module.asyncs.forEach(genReplaceAsync);
    }

    // 排序,从后往前地替换模块名,这样才能保证正确替换所有的模块
    replaces.sort((a, b) => {
        return b.from - a.from;
    });

    // 逐个替换模块名为模块id,此处算法颇为精妙,赞!
    let result = [source];
    replaces.forEach(replace => {
        let remainSource = result.shift();
        result.unshift(
            remainSource.substr(0, replace.from),
            replace.value,
            remainSource.substr(replace.to)
        )
    });
    
    return result.join('');
};



