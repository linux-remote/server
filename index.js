const os = require('os');
if(os.userInfo().username !== 'linux-remote'){
  console.error(`[lr-server]: Must start by the 'linux-remote' user.`);
  process.exit(1);
}

// Entry
const http = require('http');
const https = require('https');
const fs = require('fs');

const { initSecure } = require('./src/lib/secure');

function def(obj, key, value){
  if(obj[key] === undefined){
    obj[key] = value;
  }
}

function _getConf(){
  let content = fs.readFileSync('/opt/linux-remote/config.js', 'utf-8');
  return JSON.parse(content)
}
const conf = global.CONF = _getConf();
def(conf, 'xPoweredBy', false);
def(conf, 'appTrustProxy', false);

const app = require('./app');

app.set('port', conf.port);

let server;
const secure = conf.secure;
if(conf.secure){
  let errMsg = initSecure(conf.secure);
  if(errMsg){
    console.error(errMsg);
    process.exit(1);
  }

  server = https.createServer(secure, app);
  
}else{
  server = http.createServer(app);
}

server.listen(port);

server.on('listening', function(){
  console.log('[linux-remote]: Server start!');
  console.log('Listening on ' + port);
  console.log('NODE_ENV ' + process.env.NODE_ENV);
});

server.on('error', function(err){
  if (err.code === 'EADDRINUSE') {
    console.error(port + ' is already in use.');
    process.exit(1);
  }
  throw err;
});

const wsServerBind = require('./ws-server');
wsServerBind(server);