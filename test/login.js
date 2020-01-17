const login = require('../lib/login');

login({
  username: 'remote',
  password: '2',
  ip: '192.168.56.1',
  end(err, output) {
    if(err){
      console.log('登录失败', err.message);
    } else {
      console.log('登录成功');
      console.log(output);
    }
  }
});
