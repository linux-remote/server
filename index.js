
const os = require('os');

if(os.userInfo().username !== 'linux-remote'){
  console.error(`linux-remote must start by the 'linux-remote' user.`);
  process.exit(1);
}

const env = process.env;
global.CONF = {
  serverPath: env.LR_SERVER_PATH,
  userServerPath: env.LR_USER_SERVER_PATH,
  loginBinPath: env.LR_LOGIN_BIN_PATH,
}

require('./src/net-server.js');
