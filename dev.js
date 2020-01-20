

// 本地开发启动。
const path = require('path');
var sessStore = require('./index');
const watchHere = require('../../watch-here/index');
// return;
// process.setuid('linux-remote');
watchHere({
  dir: path.join(__dirname, 'src'),
  id: 'session-store',
  run(){
    sessStore({
      serverPath: path.join(__dirname, '../server/dev.js'),
      userServerPath: path.join(__dirname, '../user-server/dev.js'),
      loginBinPath: '/home/dw/c-out/lr-login'
    });
  }
})

