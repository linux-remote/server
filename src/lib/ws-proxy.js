const WebSocket = require('ws');
const { safeSend } = require('../common/util');

module.exports = function(ws, to) {
  const client = new WebSocket(to);
  simplePipe(ws, client);
}

function simplePipe(serverWs, clientWs){
  serverWs.on('message', function(data) {
    safeSend(clientWs, data);
  });
  clientWs.on('message', function(data){
    safeSend(serverWs, data);
  });

  serverWs.on('ping', function(){
    clientWs.ping.apply(clientWs, arguments);
  });

  clientWs.on('pong', function() {
    serverWs.pong.apply(serverWs, arguments);
  })

  serverWs.once('close', function(code, reason){
    // _console.log('serverWs close', code, typeof code);
    clientWs.close(1000, reason);
  });

  clientWs.once('close', function(code, reason){
    // _console.log('clientWs close', code, typeof code);
    serverWs.close(1000, reason); // error 1006 
  });

  serverWs.on('error', function(err) {
    clientWs.terminate();
    console.error('serverWs error', err);
  })
  clientWs.on('error', function(err) {
    serverWs.terminate();
    console.error('clientWs error', err);
  })
}
