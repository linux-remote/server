
const login = require('./login.js');
const startUserServer = require('./start-user-server.js');

const  session = require('./session.js');
session.init();
const { genSidAndHash,  getSession, _setNewSession /*, delSession*/ } = session;

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

function loginAndStartUserServer({username, password, ip}, callback){
  
  const term = login({
    username,
    password,
    ip,
    end(err) {

      if(err){
        return callback(err);
      }

      const sidObj = genSidAndHash();
      const newSid = sidObj.sid;
      const newSidHash = sidObj.hash;
      startUserServer(term, newSidHash, username, function(err) {
        if(err) {
          return callback(err);
        }
        _setNewSession(newSid, newSidHash, username, term);
        callback(null, {
          // output, 
          sid: newSid,
          sidHash: newSidHash
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
  }
};
