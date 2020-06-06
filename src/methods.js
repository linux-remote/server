
const login = require('./login.js');
const startUserProcess = require('./start-user.js');
const  session = require('./session.js');

const { genSid,  addSession, addUser, triggerOnceToken, all } = session;

function _handleMsgLogin(data, send){
  loginAndStartUserProcess(data, function(err, result){
    if(err){
      send({
        status: 'error',
        message: err.message
      });
      return;
    }

    send({
      status: 'success',
      data: result
    });
  });

}



function loginAndStartUserProcess({username, password, sid, ip, sessionData, userData}, callback){

  const pty = login({
    username,
    password,
    ip,
    end(err) {
      if(err){
        return callback(err);
      }
      let usersid;
      if(!sid){
        usersid = genSid();
      } else {
        usersid = sid;
      }

      startUserProcess(pty, usersid, username, function(err) {
        if(err) {
          return callback(err);
        }
        if(sid){
          addUser(usersid, username, userData, pty);
        } else {
          addSession(usersid, sessionData, username, userData, pty);
        }
        
        callback(null, {
          sid: usersid
        });
      });

    }
  });
}


function _handleUserConnected(onceToken, send){

  triggerOnceToken(onceToken, function(err, data){
    if(err){
      send({
        status: 'error',
        message: err.message
      })
      return;
    }
    send({
      status: 'success',
      data
    });
  })
  
}

function _handleAll(data, send){
  send({
    status: 'success',
    data: all()
  })
}

module.exports = {
  login: _handleMsgLogin,
  userConnected: _handleUserConnected,
  all: _handleAll,
  serverListened: function(){
    global.__is_server_listened = true;
  }
};
