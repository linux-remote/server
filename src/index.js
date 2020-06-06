"use strict";
const os = require('os');
const path = require('path');

let userInfo = os.userInfo();
let rrOpts = {
  paths: [path.join(userInfo.homedir, 'node_modules')]
};

// --------------------------- global start ---------------------------
global.IS_PRO = process.env.NODE_ENV === 'production';

if(global.IS_PRO){
  global.CONF = {
    serverMainPath: require.resolve('@linux-remote/server_main', rrOpts),
    serverUserPath: require.resolve('@linux-remote/server_user', rrOpts),
    loginBinPath: path.join(userInfo.homedir, './bin/lr-login')
  }
} else {
  global.CONF = {
    serverMainPath: path.join(__dirname, '../../server_main/src/index.js'),
    serverUserPath: path.join(__dirname, '../../server_user/dev.js'),
    loginBinPath: path.join(userInfo.homedir, 'bin/lr-login')
  }
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
    console.log('mainProcess disconnect');
    // Fixed: https://github.com/linux-remote/linux-remote/issues/226
    if(!global.__is_server_listened){
      process.exit(1);
    }
    global.__is_server_listened = false;
    spwanServer();
  });
}

spwanServer();

process.on('SIGHUP', function(){
  isRestart = true;
  mainProcess.kill();
});

// Dsetory var
rrOpts = null;
userInfo = null;
