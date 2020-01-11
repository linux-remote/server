
const ipcSay = require('./ipc-say');
const map = Object.create(null);

function genSess(sess){
  const users = sess.users;
  const userMap = Object.create(null);
  for(let i = 0, len = users.length; i < len; i++){
    userMap[users[i]] = Object.create(null)
  }
  delete(sess.users);
  return userMap;
}

function initSession(req, callback){
  const sid = req.cookies.sid;
  if(!sid){
    callback();
    return;
  }
  if(map[sid]){
    req.session = map[sid];
    callback();
  }
  ipcSay({type: 'getSession', data: sid}, (result) => {
    if(result.data){
      req.session = genSess(result.data);
      map[sid] = req.session;
    }
    callback();
  })
}

function sessionMid(req, res, next){
  initSession(req, next);
}

function initSessUser(req, username){
  if(!req.session){
    return;
  }
  req.sessUser = req.session.userMap[username];
}

function wsInitSessUser(req, username, callback){
  initSession(req, function(){
    initSessUser(req, username);
    callback();
  })
}

module.exports = {
  initSession,
  sessionMid,
  wsInitSessUser,
  initSessUser
};
