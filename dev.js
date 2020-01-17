

// 本地开发启动。
const path = require('path');
var server = require('./index');
const watchHere = require('../../watch-here/index');
// return;
// process.setuid('linux-remote');
watchHere({
  dir: path.join(__dirname, 'src'),
  name: 'lr-server',
  run(){
    server({
      entranceServerPath: path.join(__dirname, '../server-entrance/dev.js'),
      userServerPath: path.join(__dirname, '../user-server/dev.js'),
      loginBinPath: '/home/dw/c-out/lr-login'
    });
  }
})

