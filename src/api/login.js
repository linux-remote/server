const separateLogin = require('../lib/separate-login');
const { setSid, setCookie } = require('../lib/session');
const { halfProxy } = require('../lib/proxy');
// remove IPv4's ::ffff:
// http://www.voidcn.com/article/p-crckexby-bst.html
// https://stackoverflow.com/questions/29411551
function getIP(str){
  if(/::ffff:\d{1,3}.\d{1,3}.\d{1,3}.\d{1,3}/.test(str)){
    return str.substr(7);
  }
  return str;
}

// post
exports.login = function(req, res, next){
  const sess = req.session;
  let userMap = sess.userMap;
  const {username, password} = req.body;

  if(userMap && userMap.has(username)){
    return res.end('AlreadyLogined');
  }

  separateLogin({
    username,
    password,
    ip: getIP(req.ip)
  }, function(err, result){
    if(err){
      return next(err);
    }
    const { newSid, newSidHash } = result;
    setSid(newSid, newSidHash, username);
    setCookie(res, newSid, global.CONF.cookieSecure);
    res.end('ok');
  });



}

// post2
exports.logout = function(req, res){
  
  const userMap = req.session.userMap;
  if(!userMap){
    return res.end('ok');
  }
  
  const username = req.body.username;
  const user = userMap.get(username);
  if(user){
    user._kill_term_by_self = true; // term exit 是异步的, 这里不等了.
    user.term.kill();
    userMap.delete(username);
    if(!userMap.size){
      req.session.destroy();
    }
    // _console.log('logout user.term kill');
  }
  
  res.end('ok');

}

// get
exports.loginedList = function(req, res){
  const userMap = req.session.userMap;
  if(!userMap){
    return res.json([]);
  }
  res.json(Array.from(userMap.keys()));
}