
const os = require('os');
const {execSync} = require('child_process');
const env = process.env;
// Protect my disk
global.__TMP_DIR__ = (env.NODE_ENV === 'production') ? os.tmpdir() : '/dev/shm';
global.__is_server_listened = false;

if(os.userInfo().username !== 'linux-remote'){
  console.error(`linux-remote must start by the 'linux-remote' user.`);
  process.exit(1);
}


global.CONF = {
  serverPath: env.LR_SERVER_PATH,
  userServerPath: env.LR_USER_SERVER_PATH,
  loginBinPath: env.LR_LOGIN_BIN_PATH,
}

const handlePIC = require('./src/handle-ipc.js');
const startServer = require('./src/start-server.js');

let serverProcess;
function spwanServer(){

  serverProcess = startServer();
  handlePIC(serverProcess);
  serverProcess.on('disconnect', () => {
    // Fixed: https://github.com/linux-remote/linux-remote/issues/226
    if(!global.__is_server_listened){
      process.exit(1);
    }
    global.__is_server_listened = false;
    spwanServer();
  });
}

spwanServer();
console.log('process pid', process.pid);
let isSighup = false;
process.on('SIGHUP', function(){
  console.log('process SIGHUP');
  isSighup = true;
  process.exit();
})

process.on('exit', function(){
  if(isSighup){
    serverProcess.kill();
    const argsvs = process.argv.join(' ')
    console.log('Restarting...' + argsvs);
    execSync(argsvs, {
      stdio: 'inherit'
    });
    console.log('Restarted');
  }
})