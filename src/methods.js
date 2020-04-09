
const login = require('./login.js');
const startUserServer = require('./start-user-server.js');

const  session = require('./session.js');
session.init();
const { genSidAndHash,  getSession, _setNewSession, setNewUser /*, delSession*/ } = session;

function _handleMsgLogin(data, send){
  loginAndStartUserServer(data, function(err, result){
    if(err){
      send({
        status: 'error',
        message: err.message
      });
      return;
    }

    send({
      status: 'success',
      data: result
    });
  });

}

function _handleMsgGetSession(sid, send){
  const session = getSession(sid);
  let sendData = {
    status: 'success',
  }
  if(session){
    sendData.data = {
      hash: session.hash,
      users: Array.from(session.userMap.keys())
    }
  } else {
    sendData.data = null;
  }
  send(sendData);
}

function loginAndStartUserServer({username, password, sid, ip}, callback){

  const term = login({
    username,
    password,
    ip,
    end(err) {

      if(err){
        return callback(err);
      }
      let usersid, userHash, userMap;
      if(!sid){
        const sidObj = genSidAndHash();
        usersid = sidObj.sid;
        userHash = sidObj.hash;
      } else {
        const session = getSession(sid);
        usersid = sid;
        userHash = session.hash;
        userMap = session.userMap;
      }
      startUserServer(term, userHash, username, function(err) {
        if(err) {
          return callback(err);
        }
        if(sid){
          setNewUser(usersid, userMap, username, term);
        } else {
          _setNewSession(usersid, userHash, username, term);
        }
        
        callback(null, {
          // output, 
          sid: usersid,
          sidHash: userHash
        })
      });

    }
  });
}

// function _handleMsgLogout({sid, username}, send){
//   delSession(sid, username);
//   send({
//     status: 'success'
//   });
// }
// process.on('exit', function(){
//   if(serverProcess){
//     serverProcess.kill();
//   }
// });

module.exports = {
  login: _handleMsgLogin,
  getSession: _handleMsgGetSession,
  exit: function(errMsg){
    console.error('Error: ' + errMsg);
    process.exit();
  },
  serverListened: function(){
    global.__is_server_listened = true;
  }
};
