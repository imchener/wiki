const fs = require('fs');
// https://www.runoob.com/nodejs/nodejs-path-module.html
// 使用 Node.js 提供的 Path 模块，声明并定义 Path 的实例
const path = require('path');
const execSync = require('child_process').execSync;

// 使用的 package.json 存储的 JSON 对象的 name 属性作为 wikiFolderName
const wikiFolderName = require('../package.json').name;
const privateWikiName = require('../package.json').privateWikiName;
const COMMIT_INTERVAL = (1000 * 60 * 60) / 2;

// https://www.runoob.com/nodejs/nodejs-path-module.html
// path.join([path1][, path2][, ...]) 用于连接路径。该方法的主要用途在于，会正确使用当前系统的路径分隔符，Unix系统是"/"，Windows系统是"\"。
const tiddlyWikiRepo = path.join(path.dirname(__filename), '..');
module.exports.tiddlyWikiRepo = tiddlyWikiRepo;

const tiddlyWikiFolder = path.join(tiddlyWikiRepo, wikiFolderName);

const privateTiddlyWikiRepo = path.join(tiddlyWikiRepo, '..', privateWikiName);
module.exports.privateTiddlyWikiRepo = privateTiddlyWikiRepo;
const privateTiddlyWikiFolder = path.join(tiddlyWikiRepo, '..', privateWikiName);

// http://nodejs.cn/api/path.html#path_path_resolve_paths
// commitScriptPath = {tiddlyWikiRepo}/scripts/commit.sh}
const commitScriptPath = path.resolve(tiddlyWikiRepo, 'scripts', 'commit.sh');
const syncScriptPath = path.resolve(tiddlyWikiRepo, 'scripts', 'sync.sh');
// 经常被改变的文件应该在监控的时候忽略掉，避免频繁自动上传，这里 output 是打包成一个 html 文件后输出的默认目录
// ，$__StoryList.tid 是一个系统 Tiddler，里面的 list 字段存储了所有标准 Tiddler 的标题
const frequentlyChangedFileThatShouldBeIgnoredFromWatch = ['output', 'tiddlers/$__StoryList.tid', 'tiddlers/$__StoryList_1.tid'];
// 忽略依赖包目录和版本仓库目录
const topLevelFoldersToIgnored = ['node_modules', '.git'];

/** https://davidwalsh.name/javascript-debounce-function */
function debounce(func, wait, immediate) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    const later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

function syncToGit(folder) {
  console.log(`Sync to Git: /bin/sh ${syncScriptPath} under ${folder}`);
  execSync(`git config --bool branch.master.sync true`, { cwd: folder });
  execSync(`/bin/sh ${syncScriptPath}`, { cwd: folder });
}

const commitAndSync = (folderPath) => {
  if (!folderPath) {
    const errorString = 'no folderPath as parameter';
    console.error(errorString);
    return errorString;
  }
  try {
    try {
      execSync(`/bin/sh ${commitScriptPath}`, { cwd: folderPath });
    } catch (commitError) {
      /* sometimes it is just false alarm:
      stdout:
        On branch master
      Your branch is ahead of 'origin/master' by 1 commit.
        (use "git push" to publish your local commits)

      nothing to commit, working tree clean

      stderr:
      */
      if (commitError.stderr && commitError.stderr.toString('utf8').length > 0) {
        throw commitError;
      }
      commitError.stdout && console.warn(commitError.stdout.toString('utf8'));
    }
    syncToGit(folderPath);
  } catch (error) {
    const errorString = `\nSync failed
    stdout:
    ${error.stdout ? error.stdout.toString('utf8') : '\n'}
    stderr:
    ${error.stderr ? error.stderr.toString('utf8') : '\n'}
    raw:
    `;
    console.error(errorString);
    console.error(error);
    return errorString;
  }
};
module.exports.commitAndSync = commitAndSync;
module.exports.commitAndSyncAll = function commitAndSyncAll() {
  commitAndSync(tiddlyWikiRepo);
  commitAndSync(privateTiddlyWikiRepo);
};
const debounceCommitAndSync = debounce(commitAndSync, COMMIT_INTERVAL);

function watchFolder(wikiFolderPath, repoPath) {
  fs.watch(
    wikiFolderPath,
    { recursive: true },
    debounce((_, fileName) => {
      if (topLevelFoldersToIgnored.some((name) => fileName.startsWith(name))) return;
      if (frequentlyChangedFileThatShouldBeIgnoredFromWatch.includes(fileName)) return;
      console.log(`${fileName} change`);

      debounceCommitAndSync(repoPath);
    }, 100)
  );
  console.log(`wiki watch ${wikiFolderPath} now`);
}

module.exports.watchWiki = function watchWiki() {
  watchFolder(tiddlyWikiFolder, tiddlyWikiRepo);
  if (fs.existsSync(privateTiddlyWikiRepo)) {
    watchFolder(privateTiddlyWikiFolder, privateTiddlyWikiRepo);
  }
};
