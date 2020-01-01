// Entry
const http = require('http');
const https = require('https');
const fs = require('fs');
const { onListening, 
  onError, 
  normalizePort } = require('./common/util');

if(process.getuid() === 0){
  console.warn('Warning: linux-remote server start by root user.');
}

const NODE_ENV = process.env.NODE_ENV;


function def(obj, key, value){
  if(obj[key] === undefined){
    obj[key] = value;
  }
}

module.exports = function(conf){

  def(conf, 'xPoweredBy', false);
  def(conf, 'appTrustProxy', false);

  global.IS_PRO = NODE_ENV === 'production';
  global.CONF = conf;

  const app = require('./app');

  const port = normalizePort(process.env.PORT || conf.port);
  app.set('port', port);

  let server;
  const secure = conf.secure;
  if(conf.secure){
    if(!secure.key){
      secure.key = fs.readFileSync(secure.keyPath, 'utf-8');
      delete(secure.keyPath);
    }
    if(!secure.cert){
      secure.cert = fs.readFileSync(secure.certPath, 'utf-8');
      delete(secure.certPath);
    }
    if(!secure.ca && secure.caPath){
      secure.ca = fs.readFileSync(secure.caPath, 'utf-8');
      delete(secure.caPath);
    }
    server = https.createServer(secure, app);
  }else{
    server = http.createServer(app);
  }
  
  server.listen(port);
  server.on('error', onError(port));
  server.on('listening', onListening(server, () => {
    console.log('linux-remote server start!\n');
  }));

  const handleServerUpgrade = require('./ws-server');
  handleServerUpgrade(server);
}