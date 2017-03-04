/**
 * @file 分析模块依赖,生成模块依赖关系对象depTree
 * @author youngwind
 */

const fs = require('fs');
const co = require('co');
const parse = require('./parse');
const _resolve = require('./resolve');
let mid = 0;  // module id
let cid = 0; // chunk id

/**
 * 分析处理模块依赖
 * @param {string} mainModule 入口js
 * @param {object} options 构建选项
 * @returns {*|Promise}
 */
module.exports = function (mainModule, options) {
    let depTree = {
        modules: {},            // 用于存储各个模块对象
        chunks: {},             // 存储各个块
        mapModuleNameToId: {},   // 用于映射模块名到模块id之间的关系
        modulesById: {}           // 通过模块id索引模块
    };

    return co(function *() {
        depTree = yield parseModule(depTree, mainModule, options.context, options);
        depTree = buildTree(depTree);
        return depTree;
    });
};


/**
 * 分析模块
 * @param {object} depTree 模块依赖关系对象
 * @param {string} moduleName 模块名称,可能是绝对路径,也可能是相对路径,也可能是一个名字
 * @param {string} context 上下文,入口js所在目录
 * @param {object} options 选项
 * @returns {*|Promise}
 */
function parseModule(depTree, moduleName, context, options) {
    let module;
    return co(function *() {
        // 查找模块
        let absoluteFileName = yield _resolve(moduleName, context, options.resolve);
        // 用模块的绝对路径作为模块的键值,保证唯一性
        module = depTree.modules[absoluteFileName] = {
            id: mid++,
            filename: absoluteFileName,
            name: moduleName
        };

        let filenameWithLoaders = absoluteFileName;
        let loaders = absoluteFileName.split(/!/g);
        let filename = loaders.pop();
        if(!filename) {
            throw `找不到文件${filename}`;
        }
        let source = fs.readFileSync(filename).toString();

        // 处理 loader
        let ret = yield execLoaders(filenameWithLoaders, loaders, source, options);

        let parsedModule = parse(ret);
        module.requires = parsedModule.requires || [];


        module.asyncs = parsedModule.asyncs || [];
        module.source = parsedModule.source;

        // 写入映射关系
        depTree.mapModuleNameToId[moduleName] = mid - 1;
        depTree.modulesById[mid - 1] = module;

        // 如果此模块有依赖的模块,采取深度遍历的原则,遍历解析其依赖的模块
        let requireModules = parsedModule.requires;
        if (requireModules && requireModules.length > 0) {
            for (let require of requireModules) {
                depTree = yield parseModule(depTree, require.name, context, options);
            }
            // 写入依赖模块的id,生成目标JS文件的时候会用到
            requireModules.forEach(requireItem => {
                requireItem.id = depTree.mapModuleNameToId[requireItem.name]
            })
        }

        // 处理require.ensure的模块
        let asyncModules = parsedModule.asyncs || [];
        if (asyncModules && asyncModules.length > 0) {
            for (let asyncModule of asyncModules) {
                let requires = asyncModule.requires;
                for (let require of requires) {
                    // 已经处理过的模块,不再处理
                    if (depTree.mapModuleNameToId[require.name]) continue;
                    depTree = yield parseModule(depTree, require.name, context, options);
                }

            }
        }

        return depTree
    });
}

/**
 * 运算加载器
 * 不同种类的文件对应不同系列的加载器,比如: less 文件对应 style-loader 和 less-loader(先不考虑 css-loader)
 * 这些 loader 本质上是一些处理字符串的函数,输入是一个字符串,输出是另一个字符串,以队列的形式串行执行。
 * @param {string} request 相当于 filenamesWithLoader ,比如 /Users/youngwind/www/fake-webpack/node_modules/fake-style-loader/index.js!/Users/youngwind/www/fake-webpack/node_modules/fake-less-loader/index.js!/Users/youngwind/www/fake-webpack/examples/loader/style.less
 * @param {array} loaders 此类型文件对应的loaders
 * @param {string} content 文件内容
 * @param {object} options 选项
 * @returns {Promise}
 */
function execLoaders(request, loaders, content, options) {
    return new Promise((resolve, reject) => {
        if (!loaders.length) {
            resolve(content);
            return;
        }

        let loaderFunctions = [];
        loaders.forEach(loaderName => {
            let loader = require(loaderName);
            loaderFunctions.push(loader);
        });

        nextLoader(content);

        /***
         * 调用下一个 loader
         * @param {string} content 上一个loader的输出字符串
         */
        function nextLoader(content) {
            if (!loaderFunctions.length) {
                resolve(content);
                return;
            }
            // 请注意: loader有同步和异步两种类型。对于异步loader,如 less-loader,
            // 需要执行 async() 和 callback(),以修改标志位和回传字符串
            let async = false;
            let context = {
                request,
                async: () => {
                    async = true;
                },
                callback: (content) => {
                    nextLoader(content);
                }
            };

            let ret = loaderFunctions.pop().call(context, content);
            if(!async) {
                // 递归调用下一个 loader
                nextLoader(ret);
            }

        }
    });

}

/**
 * 从depTree.modules中构建出depTree.chunks
 * @param {object} depTree 依赖关系对象
 * @returns {*}
 */
function buildTree(depTree) {
    addChunk(depTree, depTree.modulesById[0]);

    for (let chunkId in depTree.chunks) {
        if (!depTree.chunks.hasOwnProperty(chunkId)) continue;
        depTree = removeParentsModules(depTree, depTree.chunks[chunkId]);
    }

    return depTree;
}

/**
 * 新建chunk
 * @param {object} depTree
 * @param chunkStartPoint
 * @returns {{id: number, modules: {}}}
 */
function addChunk(depTree, chunkStartPoint) {
    let chunk = {
        id: cid++,
        modules: {}
    };
    depTree.chunks[chunk.id] = chunk;
    if (chunkStartPoint) {
        chunkStartPoint.chunkId = chunk.id;
        addModuleToChunk(depTree, chunkStartPoint, chunk.id);
    }
    return chunk;
}

/**
 * 将module添加到chunk中
 * @param depTree
 * @param context
 * @param chunkId
 */
function addModuleToChunk(depTree, context, chunkId) {
    context.chunks = context.chunks || [];
    // context.chunks是某个module在多少个chunks出现过
    if (context.chunks.indexOf(chunkId) === -1) {
        context.chunks.push(chunkId);
        if (context.id !== undefined) {
            depTree.chunks[chunkId].modules[context.id] = 'include';
        }
        if (context.requires) {
            context.requires.forEach(requireItem => {
                if (requireItem.name) {
                    addModuleToChunk(depTree, depTree.modulesById[depTree.mapModuleNameToId[requireItem.name]], chunkId);
                }
            })
        }
        if (context.asyncs) {
            context.asyncs.forEach(context => {
                let subChunk;
                if (context.chunkId) {
                    subChunk = depTree.chunks[context.chunkId];
                } else {
                    subChunk = addChunk(depTree, context);
                }
                subChunk.parents = subChunk.parents || [];
                subChunk.parents.push(chunkId);
            })
        }
    }
}

/**
 * 将属于父级chunk的module从当前chunk移除出去
 * @param depTree
 * @param chunk
 * @returns {*}
 */
function removeParentsModules(depTree, chunk) {
    if (!chunk.parents) return depTree;
    for (let moduleId in chunk.modules) {
        if (!chunk.modules.hasOwnProperty(moduleId)) continue;
        chunk.parents.forEach(parentId => {
            if (depTree.chunks[parentId].modules[moduleId]) {
                chunk.modules[moduleId] = 'in-parent';
            }
        })
    }
    return depTree;
}
