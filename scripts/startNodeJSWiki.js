const path = require('path');
const execSync = require('child_process').execSync;
const $tw = require('tiddlywiki/boot/boot.js').TiddlyWiki();

const tiddlyWikiPort = require('../package.json').port;
const wikiFolderName = require('../package.json').name;
const userName = require('../package.json').userName;

const repoFolder = path.join(path.dirname(__filename), '..');

const tiddlyWikiFolder = path.join(repoFolder, wikiFolderName);
const tiddlersFolder = path.join(tiddlyWikiFolder, 'tiddlers');

process.env['TIDDLYWIKI_PLUGIN_PATH'] = `${tiddlyWikiFolder}/plugins`;
process.env['TIDDLYWIKI_THEME_PATH'] = `${tiddlyWikiFolder}/themes`;
// add tiddly filesystem back https://github.com/Jermolene/TiddlyWiki5/issues/4484#issuecomment-596779416
$tw.boot.argv = [
  '+plugins/tiddlywiki/filesystem',
  '+plugins/tiddlywiki/tiddlyweb',
  tiddlyWikiFolder,
  '--listen',
  `anon-username=${userName}`,
  `port=${tiddlyWikiPort}`,
  'host=127.0.0.1',
  'root-tiddler=$:/core/save/lazy-images',
];

try {
  // https://wangchujiang.com/linux-command/c/find.html
  // TODO: 找到满足被模式 '*StoryList.tid' 匹配到的文件并删除它 
  execSync(`find ${tiddlersFolder} -name '*StoryList.tid' -delete`);
} catch (error) {
  // 抛出错误后继续向下执行
  // https://www.liaoxuefeng.com/wiki/1022910821149312/1120870328169696
  console.log(String(error));
}

module.exports = function startNodeJSWiki() {
  $tw.boot.boot();
};
