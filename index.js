
const os = require('os');

if(os.userInfo().username !== 'linux-remote'){
  console.error(`linux-remote must start by the 'linux-remote' user.`);
  process.exit(1);
}

const path = require('path');
const { spawn } = require('child_process');
const sessions = require('./src/session');
const ipc = require('./src/ipc');

module.exports = function({serverPath, userServerPath, loginBinPath}){

  global.CONF = {
    userServerPath,
    loginBinPath
  }
  
  sessions.init();

  const serverProcess = spawn(process.argv[0], [serverPath], {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
    cwd: path.dirname(serverPath)
  });

  ipc(serverProcess);

  ['SIGINT', 'SIGTERM', 'SIGHUP'].forEach(k => {
    process.on(k, () => {
      process.exit();
    })
  })
  process.on('exit', function(){
    sessions.clearUp();
    serverProcess.kill();
  });

}