const crypto = require('crypto');
const base64ToSafe = require('base64-2-safe');

/*
sidMap: 
	key: sid
	value: { userMap}

userMap:
	key: username
	value: {_pty,  ...otherData}
 */

const sortTimeStartPoint = 1579660004551; // 2020/01/22
const sortTime = Date.now() - sortTimeStartPoint;
// const SID_MIN_LENGTH = 34;
const sidMap = new Map();
let index = 1;

function genSid(){
  // node uuid/v4 equal crypto.randomBytes(16).toString('hex');
  // https://github.com/kelektiv/node-uuid/blob/master/lib/rng.js
  // npm use UUID as token.

  // uid-safe used randomBytes too.
  // Express/session will use secret to generate the signature of sid, and then add it after sid.
  // Then the question becomes: If sid is UUID, does sid need signature?

  // crypto.randomBytes(24).toString('base64').length 
  // equal:
  // crypto.randomBytes(16).toString('hex').length
  let sid = crypto.randomBytes(24).toString('base64');
  sid = base64ToSafe(sid);
  
  sid = sortTime + sid + index;

  index = index + 1;
  return sid;
}

function _addSession(sid, sessionData){
  const session = Object.create(null);
  session.userMap = new Map();
  sidMap.set(sid, session);
  _setData(session, sessionData);
  return session;
}

function addUser(sid, sessData, username, userData, pty){
  let session = _getSession(sid);
  if(!session){
    session = _addSession(sid, sessData);
  }
  const user = Object.create(null);
  user._pty = pty;
  _setData(user, userData);
  session.userMap.set(username, user);
  return user;
}

function setSessionData(sid, data){
  const session = sidMap.get(sid);
  if(session){
    _setData(session, data);
  }
}


function _getSession(sid){
  return sidMap.get(sid);
}

function getUser(sid, username){
  const session = _getSession(sid);
  if(session){
    return session.userMap.get(username);
  }
}

function setUserData(sid, username, data){
  const user = getUser(sid, username);
  if(user){
    _setData(user, data);
  }
}

function _setData(obj, data){
  if(!data){
    return;
  }
  if(!obj.data){
    obj.data = data;
  } else {
    Object.assign(obj.data, data);
  }
}

function _removeData(obj, key){
  if(!obj.data){
    return;
  }
  delete(obj.data, key);
}

function removeSessionData(sid, key){
  const session = _getSession(sid);
  if(session){
    _removeData(session, key);
  }

}

function removeUserData(sid, username, key){
  const user = getUser(sid, username);
  if(user){
    _removeData(user, key);
  }

}

function all(){
  const result = Object.create(null);
  sidMap.forEach(function(session, sid){
    const _session = Object.create(null);
    if(session.data){
      _session.data = Object.create(null);
      Object.assign(_session.data, session.data);
    }

    const _userMap = _session.userMap = Object.create(null);
    const userMap = session.userMap;
    userMap.forEach(function(user, username){
      const _userData = Object.create(null);
      if(user.data){
        Object.assign(_userData, user.data);
      }

      _userMap[username] = _userData;
    });
    result[sid] = _session;
  });
  return result;
}



function removeUser(sid, username){
  const session = _getSession(sid);
  if(session){
    const userMap = session.userMap;
    const user = userMap.get(username);
    if(user){
      if(!user._is_remove){
        user._is_remove = true;
        user._pty.kill();
      }
      userMap.delete(username);
      if(userMap.size === 0){
        sidMap.delete(session.id);
      }
      global.__sendMainProcess({event: 'removeUser', data: {sid, username}});
    }
  }
}



module.exports = {
  genSid,
  _addSession,
  addUser,
  removeUser,
  all,
  setSessionData,
  setUserData,
  removeSessionData,
  removeUserData,
  getUser
}