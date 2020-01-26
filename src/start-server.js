const { spawn } = require('child_process');

function startServer(){
  return spawn(process.argv[0], [global.CONF.serverPath], {
    stdio: 'inherit'
    }, function(err){
    if(err){
      throw err;
    }
  });
}

module.exports = startServer;
