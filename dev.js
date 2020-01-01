
// 本地开发启动。
const path = require('path');
var linuxRemoteServer = require('./index');

linuxRemoteServer({
  port: 3000,
  userServerMain: path.join(__dirname, '../user-server/watcher.js'),
  ssl: false,
  cookieSecure: false,
  xPoweredBy: false,
  loginBinPath: '/home/dw/c-out/lr-login'
});
