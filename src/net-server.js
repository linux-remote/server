const net = require('net');
const fs = require('fs');

const login = require('./login.js');
const startServer = require('./start-server.js');
const startUserServer = require('./start-user-server.js');

const  session = require('./session.js');
session.init();
const { genSidAndHash,  getSession, _setNewSession, delSession } = session;

const PORT = global.__TMP_DIR__ + '/linux-remote-session-store.sock';

const netServer = net.createServer(function connectionListener(socket){
  socket.setEncoding('utf-8');
  handleSocket(socket);
});

// netServer.maxConnections = 2;
netServer.listen(PORT);

let child;
// let timer;
netServer.on('listening', function(){
  fs.chmodSync(PORT, 0o600);
  child = startServer();
  // timer = setTimeout(function(){
  //   console.error('Server connect timeout.');
  //   child.kill();
  //   process.exit(1);
  // }, 5000);
});

// netServer.once('connection', function(){
//   clearTimeout(timer);
// });

netServer.on('error', (err) => {
  netServer.close();
  if (err.code === 'EADDRINUSE') {
    fs.unlinkSync(PORT);
    netServer.listen(PORT);
    return;
  }
  throw err;
});



function handleSocket(socket){

  socket.on('data', function(msg){
    const msgObj = JSON.parse(msg);

    function _send(sendData){
      if(sendData){
        if(sendData.id !== undefined){
          sendData.id = msgObj.id;
        }
        socket.write(JSON.stringify(sendData));
      }
    }

    if(msgObj.type === 'login'){
      _handleMsgLogin(msgObj.data, _send);
    } else if(msgObj.type === 'logout'){
      _handleMsgLogout(msgObj.data, _send);
    } else if(msgObj.type === 'getSession'){
      _handleMsgGetSession(msgObj.data, _send);
    } else if(msgObj.type === 'reloadServer'){
      socket.end(function(){
        child.kill();
        child = startServer();
      });
    } else {
      socket.destroy();
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

// process.on('exit', function(){
//   if(serverProcess){
//     serverProcess.kill();
//   }
// });

module.exports = netServer;
