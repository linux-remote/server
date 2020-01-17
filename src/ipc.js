const login = require('./login');
const startUserServer = require('./start-user-server');
const { genSid, hashSid, getSession, _setNewSession, delSession } = require('./session');


function ipc(entranceProcess){

  
  entranceProcess.on('message', function(msgObj){

    function _send(sendData){
      if(sendData){
        sendData.id = msgObj.id;
        entranceProcess.send(sendData);
      }
    }

    if(msgObj.type === 'login'){
      _handleMsgLogin(msgObj.data, _send);
    } else if(msgObj.type === 'logout'){
      _handleMsgLogout(msgObj.data, _send);
    } else if(msgObj.type === 'getSession'){
      _handleMsgGetSession(msgObj.data, _send);
    }
    
  })

}

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
  })
}

function _handleMsgLogout({sid, username}, send){
  delSession(sid, username);
  send({
    status: 'success'
  })
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

      const newSid = genSid();
      const newSidHash = hashSid(newSid);
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

module.exports = ipc;