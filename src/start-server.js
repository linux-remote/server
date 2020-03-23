const { spawn } = require('child_process');

function startServer(){
  return spawn(process.argv[0], [global.CONF.serverPath], {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc']
  });
}

module.exports = startServer;
