const sessMiddleware = require('./lib/session/middleware');
const wsProxy = require('./api/ws-proxy');
const path = require('path');
const os = require('os');
const fs = require('fs');
const net = require('net');
module.exports = function(server) {
  
  const ipcPath = path.join(os.tmpdir(), 'linux-remote-server.ipc');
  fs.stat(ipcPath, function(err){
    if(err){
      if(err.code !== 'ENOENT'){
        throw err;
      }
    } else {
      fs.unlinkSync(ipcPath)
    }

    const server = net.createServer(function(socket){

    });


    server.on('error', function(err){
      throw err;
    })

    server.listen(ipcPath);

  })

}
