
// Entry
const http = require('http');
const https = require('https');

const { initSecure } = require('./src/lib/secure');

function def(obj, key, value){
  if(obj[key] === undefined){
    obj[key] = value;
  }
}

function createServer(confPath){
  const conf = require(confPath);
  global.CONF = conf;
  
  def(conf, 'xPoweredBy', false);
  def(conf, 'appTrustProxy', false);
  const app = require('./src/app');
  
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
  
  server.listen(conf.port);
  
  server.on('listening', function(){
    console.log('[lr-entrance]: Server start!');
    console.log('Listening on ' + conf.port);
    console.log('NODE_ENV ' + process.env.NODE_ENV);
  });
  
  server.on('error', function(err){
    if (err.code === 'EADDRINUSE') {
      console.error('port ' + conf.port + ' is already in use.');
      process.exit(1);
    }
    throw err;
  });
  
  const wsNoServer = require('./src/ws-server');
  wsNoServer(server);
}
module.exports = createServer;