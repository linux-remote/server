const login = require('../lib/login');
const startUserServer = require('../lib/start-user-server');
require('../lib/init-session-path');
const term = login({
  username: 'remote',
  password: '2',
  ip: '192.168.56.1',
  end(err) {
    if(err){
      console.log('登录失败', err.message);
    } else {

      console.log('登录成功'); // removeListener
      startUserServer(term, 'test-sid', 'remote', function() {
        console.log('用户服务启动成功。');
      })
    }
  }
});
