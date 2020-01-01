const WebSocket = require('ws');
const {getTmpName} = require('../lib/session');
const { upUserNow } = require('../lib/user');
const wsServer = new WebSocket.Server({ noServer: true });
const wsProxy = require('../lib/ws-proxy');
const { WS_HEART_BEAT_DELAY } = require('../constant');

const URL_PREFIX = '/api/user/';

wsServer.on('connection', function connection(ws, unixSocket) {
  wsProxy(ws, unixSocket);

  ws.isAlive = true;
  ws.on('pong', heartbeat);
  
  ttlIfNotStart();
});



function handleUpgrade(req, socket, head) {
  let href = req.url;
  href = href.substr(URL_PREFIX.length);
  const _index = href.indexOf('/');
  const username = href.substr(0, _index);
  const user = req.session.userMap.get(username);
  if(!user){
    socket.destroy();
    return;
  }
  upUserNow(user);
  
  href = href.substr(_index);
  let unixSocket = getTmpName(req.session.id, username);
  unixSocket = unixSocket + '.sock:';

  // https://stackoverflow.com/questions/23930293
  // ws+unix:///tmp/server.sock
  unixSocket = 'ws+unix://' + unixSocket;

  unixSocket = unixSocket + href;

  wsServer.handleUpgrade(req, socket, head, function done(ws) {
    wsServer.emit('connection', ws, unixSocket);
  });

}

module.exports = {
  URL_PREFIX,
  handleUpgrade,
  wsServer
}

// TTL
// https://github.com/websockets/ws#how-to-detect-and-close-broken-connections
function noop() {}

function heartbeat() {
  this.isAlive = true;
}

let ttlTimer;
let isStartTTL = false;
function ttlIfNotStart(){
  if(isStartTTL){
    return;
  }
  isStartTTL = true;
  ttlTimer = setInterval(function ping() {

    wsServer.clients.forEach(function each(ws) {
      if (ws.isAlive === false) {
        return ws.terminate();
      } 
  
      ws.isAlive = false;
      ws.ping(noop);
    });
    if(!wsServer.clients.size){
      clearInterval(ttlTimer);
      isStartTTL = false;
    }
  }, WS_HEART_BEAT_DELAY);
}
