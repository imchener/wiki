const path = require('path');

const Service = require('./node-mac-windows-linux');

// http://nodejs.cn/api/modules.html#modules_filename
// __filename 是当前模块的文件名。 这是当前的模块文件的绝对路径（符号链接会被解析）
const scriptsFolder = path.join(path.dirname(__filename));
const scriptPath = path.join(scriptsFolder, 'startAndWatchNodeJSWiki.js');

// 为本地 TiddlyWiki 新建一个服务，服务程序就是 startAndWatchNodeJSWiki.js 这一脚本
const service = new Service({
  /*
    View status using `service tiddlywiki status` on Linux
  */
  name: 'TiddlyWiki',
  description: 'Local TiddlyWiki server for my knowledge management.',
  script: scriptPath,
  runAsAgent: true,
  runAsUser: true,
});

service.on('install', () => {
  service.start();
  console.log(`${scriptPath} started.`);
});
service.on('alreadyinstalled', () => {
  console.log(`${scriptPath} already installed.`);
});
service.on('invalidinstallation', () => {
  console.log(`${scriptPath} is invalid.`);
});
service.on('uninstall', () => {
  console.log(`${scriptPath} is uninstalled.`);
});
service.on('error', () => {
  console.log(`${scriptPath} errors.`);
});
service.on('uninstall', () => {
  console.log('Uninstall complete.');
  console.log('The service exists: ', typeof service.exists === 'function' ? service.exists() : service.exists);
});

module.exports.install = service.install.bind(service);
module.exports.uninstall = service.uninstall.bind(service);
