const os = require('os');
if(os.userInfo().username !== 'linux-remote'){
  console.error(`[lr-server]: Must start by the 'linux-remote' user.`);
  process.exit(1);
}

// Entry
const http = require('http');
const https = require('https');
const fs = require('fs');


function def(obj, key, value){
  if(obj[key] === undefined){
    obj[key] = value;
  }
}

function getConf(){
  let content = fs.readFileSync('/opt/linux-remote/config.js', 'utf-8');
  return JSON.parse(content)
}
const conf = global.CONF = getConf();
def(conf, 'xPoweredBy', false);
def(conf, 'appTrustProxy', false);


const app = require('./app');

app.set('port', conf.port);

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
server.on('listening', function(){
  console.log('[linux-remote]: Server start!');
  console.log('Listening on ' + port);
  console.log('NODE_ENV ' + process.env.NODE_ENV);
});

server.on('error', function(err){
  if (err.code === 'EADDRINUSE') {
    console.error(port + ' is already in use');
    process.exit(1);
    return;
  }
  throw err;
});


const handleServerUpgrade = require('./ws-server');
handleServerUpgrade(server);