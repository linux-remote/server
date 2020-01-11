const net = require('net');
const os = require('os');

const WebSocket = require('ws');

const { initSessUser } = require('./lib/session');
const ws2ns = require('./lib/ws2ns');

const wsServer = new WebSocket.Server({ noServer: true });
const URL_PREFIX = '/api/user/';
const tmpDir = os.tmpdir() + '/linux-remote/session';
// url: ws://127.0.0.1:3000/api/user/:username
function getUsername(url){
  if(url.indexOf(URL_PREFIX) === 0){
    return url.substr(URL_PREFIX.length);
  }
  return '';
}

function initConnectedNs(user, hash, username, callback){
  if(user.connectedNs){
    callback(user.connectedNs);
    return;
  }
  const client = net.createConnection(`${tmpDir}/${hash}.${username}/sock`, () => {
    user.connectedNs = client;
    callback(client);
  })
}
function handleServerUpgrade(req, socket, head) {
  const username = getUsername(req.url);
  if(!username){
    socket.destroy();
  }
  initSessUser(req, username, function(){
    const user = req.sessUser;
    if(!user){
      socket.destroy();
    }

    initConnectedNs(user, req.session.hash, username, function(connectedNs){
      wsServer.handleUpgrade(req, socket, head, function done(ws) {
        wsServer.emit('connection', ws, connectedNs);
      });
    })
  })
}

wsServer.on('connection', ws2ns);

module.exports = function wsNoServer(server){
  server.on('upgrade', handleServerUpgrade);
};