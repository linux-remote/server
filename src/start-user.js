// const waitUspTimeout = 5000;
function startUser(pty) {
  const NODE_ENV = process.env.NODE_ENV || 'development';
  // hidden bash history
  let cmd = ` NODE_ENV=${NODE_ENV} ${process.argv[0]} ${global.CONF.serverUserPath}`;
  pty.write(cmd + '\n');
  
  
  // if(user._onConnect){
  //   callback({
  //     name: 'Error',
  //     message: 'repeat user onConnect.'
  //   })
  //   return;
  // }

  // const timer = setTimeout(function(){
  //   pty._socket.destroy();
  //   delete(user._onConnect);
  //   callback({
  //     name: 'Error',
  //     message: 'wait usp timerout.'
  //   })
  // }, waitUspTimeout);

  // user._onConnect = function(){
  //   clearTimeout(timer);
  //   delete(user._onConnect);
  //   callback(null, sid);
  // };
}


module.exports = startUser;
