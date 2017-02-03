/**
 * @file 解析模块包含的依赖
 * @author youngwind
 * @content 使用esprima将模块文件解析成AST,然后逐个语句遍历,找到该模块都依赖了哪些模块
 */

const esprima = require('esprima');

/**
 * 解析模块包含的依赖
 * @param {string} source 模块内容字符串
 * @returns {{}} 解析模块得出的依赖关系
 */
module.exports = function (source) {
    let ast = esprima.parse(source, {range: true});
    let module = {};
    walkStatements(module, ast.body);
    module.source = source;
    return module;
};

/**
 * 遍历模块的语句
 * @param {object} module  模块对象
 * @param  {object} statements AST语法树
 */
function walkStatements(module, statements) {
    statements.forEach(statement => walkStatement(module, statement));
}

/**
 * 分析每一个语句
 * @param {object} module  模块对象
 * @param  {object} statement AST语法树
 */
function walkStatement(module, statement) {
    switch (statement.type) {
        case 'VariableDeclaration':
            if (statement.declarations) {
                walkVariableDeclarators(module, statement.declarations);
                break;
            }
    }
}

/**
 * 处理定义变量的语句
 * @param {object} module  模块对象
 * @param {object} declarators
 */
function walkVariableDeclarators(module, declarators) {
    declarators.forEach(declarator => {
        switch (declarator.type) {
            case 'VariableDeclarator':
                if (declarator.init) {
                    walkExpression(module, declarator.init);
                }
                break;
        }
    });
}

/**
 * 处理表达式
 * @param {object} module  模块对象
 * @param {object} expression 表达式
 */
function walkExpression(module, expression) {
    switch (expression.type) {
        case 'CallExpression':
            if (expression.callee && expression.callee.name === 'require' && expression.callee.type === 'Identifier' &&
                expression.arguments && expression.arguments.length === 1) {
                // TODO 此处还需处理require的计算参数
                module.requires = module.requires || [];
                let param = Array.from(expression.arguments)[0];
                module.requires.push({
                    name: param.value,
                    nameRange: param.range
                })
            }
            break;
    }
}