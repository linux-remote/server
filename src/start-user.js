const {setOnceTokenAndWaitingUserConnect, genSid} = require('./session.js');

function startUserProcess(pty, sid, username, callback) {
  const onceToken = genSid();
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const cmd = `(NODE_ENV=${NODE_ENV} LR_ONCE_TOKEN=${onceToken} ${process.argv[0]} ${global.CONF.serverUserPath})`;
  // The pty not has stderr.
  pty.write(cmd + '\n');

  setOnceTokenAndWaitingUserConnect(sid, username, onceToken, function(err, result){
    if(err){
      pty.kill();
      return callback(err);
    }
    callback(null, result);
  });

}


module.exports = startUserProcess;
