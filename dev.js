/* 
  Watch file change and restart server.
  Watch server_main project files change and reload server_main.
  Runing in linux VM. The VM shared file system need using polling. https://webpack.js.org/configuration/dev-server/#devserverwatchoptions-
  So Just watch src dir.
*/

const { spawn, exec } = require('child_process');
const path = require('path');
const watch = require('watch');

const SERVER_MAIN_SRC_DIR = path.join(__dirname, '../server_main/src');
const SERVER_MAIN_MARK = path.join(SERVER_MAIN_SRC_DIR, 'index.js');

// _console style like nodemon.
// "chalk" is can't work in `tail -f` on my computer. So..
let _COLOR_MAP = {red: 31,
  // green: 32, 避免跟 nodemon 冲突.
  yellow: 33, 
  cyan: 96};
function _colorLog(style, str) {
  console.info('\u001b[' + _COLOR_MAP[style] + 'm' + str + '\u001b[39m');
}

function _watchTree(dir, onChange){
  watch.watchTree(dir, {
    interval: 2, // Specifies the interval duration in seconds
    ignoreDotFiles: true,
    ignoreDirectoryPattern: /node_modules/
  }, function(f){
    if(typeof f !== 'object'){
      onChange(f);
    }
  });
}

let serverProcess, 
  fileIsChange = false,
  isWaitFileChange = false;

function _liveReloadServerProcess(){
  _watchTree(path.join(__dirname, './src'), function(f){
    if(typeof f !== 'object'){
      console.info('[watcher]file changed');
      if(f === process.mainModule.filename){
        return; // 此文件
      }
      fileIsChange = true;
      serverProcess.kill();
    }
  });
}

function _handleServerProcessCrash(){
  if(fileIsChange){
    isWaitFileChange = false;
    _colorLog('cyan', '[server] restarting due to changes...');
    loop();
    fileIsChange = false;
  } else {
    if(!isWaitFileChange){
      _colorLog('red', '[server] process is crash! wait for File Change to restart...');
      isWaitFileChange = true;
    }
    setTimeout(_handleServerProcessCrash, 1500);
  }
}


function loop(){
  serverProcess = spawn(process.argv[0], [path.join(__dirname, './src/index.js')], {
    stdio: 'inherit'
  });

  serverProcess.on('close', (code) => {
    if(code !== 0){
      _handleServerProcessCrash();
    }else{
      _colorLog('cyan', `[server] Child exit success! server exit. \t ${new Date()}`);
      process.exit(); // 正常退出
    }
  });
}

function _liveReloadServerMainProcess(){
  _watchTree(SERVER_MAIN_SRC_DIR, function(f){
    console.info('[server_main] file changed', f);
    _reloadServer();
  });
}

function _reloadServer(){
  exec('ps U linux-remote | grep ' + SERVER_MAIN_MARK, function(err, stdout){
    if(err){
      console.error('reloadServer error: ', err.message);
      return;
    }
    if(stdout){
      let pid = stdout.trim();
      if(pid){
        let i = pid.indexOf(' ');
        pid = pid.substr(0, i);
        console.log('reloadServer pid: ', pid);
        exec('kill ' + pid, function(err){
          if(err){
            console.error('[server_main] reloadServer kill error: ', err.message);
            fileIsChange = true;
            serverProcess.kill();
          }
        })
      }
    }
  });
}

_liveReloadServerProcess();
loop();
_liveReloadServerMainProcess();
