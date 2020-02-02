const { spawn } = require('child_process');

const login = require('./login');
const startUserServer = require('./start-user-server');
const  session = require('./session.js');
session.init();
const { genSidAndHash,  getSession, _setNewSession, delSession } = session;

let serverProcess;

function spwanServer(){
  serverProcess = spawn(process.argv[0], [global.CONF.serverPath], {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc']
  });
  ipc(serverProcess);
  return serverProcess;
}

spwanServer();

function ipc(serverProcess){

  serverProcess.on('message', function(msgObj){

    function _send(sendData, callback){
      if(sendData){
        sendData.id = msgObj.id;
        serverProcess.send(sendData, callback);
      }
    }

    if(msgObj.type === 'login'){
      _handleMsgLogin(msgObj.data, _send);
    } else if(msgObj.type === 'logout'){
      _handleMsgLogout(msgObj.data, _send);
    } else if(msgObj.type === 'getSession'){
      _handleMsgGetSession(msgObj.data, _send);
    } else if(msgObj.type === 'reloadServer'){
      if(serverProcess){
        _send({
          data: 'ok'
        })
        serverProcess.disconnect();
        spwanServer();
      }
    }
  });
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
  });

}

function _handleMsgLogout({sid, username}, send){
  delSession(sid, username);
  send({
    status: 'success'
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

process.on('exit', function(){
  if(serverProcess){
    serverProcess.disconnect();
  }
});

// module.exports = spwanServer;
