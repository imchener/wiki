// 利用 require() 直接获取包含了脚本内容的 Node.js 对象
const startNodeJSWiki = require('./startNodeJSWiki');
const watchWiki = require('./watchWiki').watchWiki;

// 分别执行这两个脚本
startNodeJSWiki();
watchWiki();
