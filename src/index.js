"use strict";
const os = require('os');
const path = require('path');

let userInfo = os.userInfo();
let rrOpts = {
  paths: [path.join(userInfo.homedir, 'node_modules')]
};
let loginBinPath = path.join(userInfo.homedir, 'bin/lr-login');
// --------------------------- global start ---------------------------
global.IS_PRO = process.env.NODE_ENV === 'production';

if(global.IS_PRO){
  global.CONF = {
    serverMainPath: require.resolve('@linux-remote/server_main', rrOpts),
    serverUserPath: require.resolve('@linux-remote/server_user', rrOpts),
    loginBinPath
  }
} else {
  // may start by manage dev.
  let _userPath = process.env.NODE_ENV === 'development' ? 'dev.js' : 'src/index.js';
  global.CONF = {
    serverMainPath: path.join(__dirname, '../../server_main/src/index.js'),
    serverUserPath: path.join(__dirname, '../../server_user/' + _userPath),
    loginBinPath
  }
  _userPath = null;
}

global.__is_server_listened = false;
// --------------------------- global end ---------------------------

const handlePIC = require('./handle-ipc.js');
const startMainProcess = require('./start-main.js');

let mainProcess;
let isRestart = false;
function spwanServer(){
  mainProcess = startMainProcess();
  handlePIC(mainProcess);
  global.__main_process__ = mainProcess;
  mainProcess.on('disconnect', () => {
    if(isRestart){
      return;
    }
    // Fixed: https://github.com/linux-remote/linux-remote/issues/226
    if(!global.__is_server_listened){
      process.exit(1);
    }
    global.__is_server_listened = false;
    spwanServer();
  });
}

console.log('server runing pid ' + process.pid);
spwanServer();

process.on('SIGHUP', function(){
  isRestart = true;
  console.log('server process on SIGHUP server_main reloading...');
  mainProcess.kill();
});
// Dsetory var
rrOpts = null;
userInfo = null;
loginBinPath = null;