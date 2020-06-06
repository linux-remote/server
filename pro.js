const {spawn} = require('child_process');
const path = require('path');
const LR_SERVER_PATH = path.join(__dirname, './index.js');
spawn(process.argv[0], [path.join(__dirname, '../session-store/index.js')], {
  env: {
    NODE_ENV: 'production',
    LR_SERVER_PATH,
    LR_USER_SERVER_PATH: path.join(__dirname, '../user-server/dev.js'),
    LR_LOGIN_BIN_PATH: '/opt/linux-remote/bin/lr-login'
  },
  stdio: 'inherit'
})
