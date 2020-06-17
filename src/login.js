// The expect like UI.

const nodePty = require('node-pty');
const { escapeInjection } = require('./util');
const { genSid, addUser, removeUser } = require('./session.js');
const os = require('os');
const waitEnterPswTimeout = 5000;
const ptyIdleTimeout = 10000;

function killLoginTerm(pty){
  // Fixed: Login timed out after 60 seconds.
  // use socket.destroy replace width write \u0003 2020/06/05
  // pty.write('\u0003');
  pty._socket.destroy();
}

function login(opts) {
  const username = escapeInjection(opts.username);
  // username can't see in `top -c -b`
  const pty = nodePty.spawn(global.CONF.loginBinPath, ['-h', opts.ip, username]);

  const callback = opts.end;
  let currProcessName = pty.process;
  let sid = opts.sid;
  let user;
  let timer = setTimeout(function(){
    timer = null;
    _done({
      name: 'Error',
      message: 'Wait enter password timeout'
    });
  }, waitEnterPswTimeout);

  function _done(err){
    if(timer){
      clearTimeout(timer);
      timer = null;
    }

    pty.removeListener('data', handleBeforeLoginData);
    pty.removeListener('error', _done);

    if(err){
      killLoginTerm(pty);
      callback(err);
    } else {
      
      setIdleTimeout();

      if(!sid){
        sid = genSid();
      }
      user = addUser(sid, opts.sessionData, username, opts.userData, pty);

      pty.addListener('data', handleBeforeCreateUsp);
      pty.addListener('exit', handleExit);
      callback(null, sid);
    }
  }

  pty.once('data', function() {
    const password = escapeInjection(opts.password);
    pty.write(password + '\n');
    pty.addListener('data', handleBeforeLoginData);
  });

  function handleBeforeLoginData(data) {
    if(currProcessName !== pty.process){
      // login success.
      currProcessName = pty.process;
      _done();

    } else {
      if(data.indexOf('Login incorrect') !== -1) {
        _done({
          name: 'Error',
          message: 'Login incorrect'
        })
      } else if(data.indexOf(os.hostname() + ' login:') !== -1){
        _done({
          name: 'Error',
          message: 'Login incorrect.'
        });
      }
    }
  }

  function setIdleTimeout(){
    if(timer){
      return;
    }
    timer = setTimeout(function(){
      console.error('pty kill by idle.');
      killLoginTerm(pty);
    }, ptyIdleTimeout);
  }

  function removeIdleTimeout(){
    if(timer){
      clearTimeout(timer);
      timer = null;
    }
  }

  function handleBeforeCreateUsp(data){
    if(pty.process !== currProcessName){
      if(data === 'PassSid:'){
        pty.write(sid + '\n');
        removeIdleTimeout();
        pty.removeListener('data', handleBeforeCreateUsp);
        pty.addListener('data', handleUspData);
      }

    }
  }

  function handleUspData(){
    if(pty.process === currProcessName){
      if(user._is_normal_exit){
        pty.removeListener('data', handleUspData);
        console.log('pty.write exit');
        pty.write('exit\n');
        return;
      }
      setIdleTimeout();
      pty.removeListener('data', handleUspData);
      pty.addListener('data', handleBeforeCreateUsp);
    }
  }

  function handleExit(){
    removeIdleTimeout();
    if(user._is_remove){
      return;
    }
    user._is_remove = true;
    removeUser(sid, username);
  }
  pty.on('error', _done);

  if(!global.IS_PRO){
    const fs = require('fs');
    fs.open('/tmp/pty.log', 'w', function(err, fd){
      if(err){
        console.error(err);
        return;
      }
      pty.on('data', function(data){
        fs.writeSync(fd, data)
      })
      pty.on('exit', function(){
        fs.closeSync(fd);
      })
    });
  }

  return pty;
}


module.exports = login;
