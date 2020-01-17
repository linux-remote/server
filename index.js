
const os = require('os');
const path = require('path');
if(os.userInfo().username !== 'linux-remote'){
  console.error(`linux-remote must start by the 'linux-remote' user.`);
  process.exit(1);
}

const { spawn } = require('child_process');
const sessions = require('./src/session');
const ipc = require('./src/ipc');

module.exports = function({entranceServerPath, userServerPath, loginBinPath}){

  global.CONF = {
    userServerPath,
    loginBinPath
  }
  
  sessions.init();

  const entranceProcess = spawn(process.argv[0], [entranceServerPath], {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
    cwd: path.dirname(entranceServerPath) 
  });

  ipc(entranceProcess);

  process.on('exit', function(){
    sessions.clearUp();
  });

}