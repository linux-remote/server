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
  _setSessionData(session, sessionData);
  return session;
}

function addUser(sid, sessData, username, userData, pty){
  let session = _getSession(sid);
  if(!session){
    session = _addSession(sid, sessData);
  }
  const user = Object.create(null);
  user._pty = pty;
  _setUserData(user, userData);
  session.userMap.set(username, user);
  return user;
}

function setSessionData(sid, data){
  const session = sidMap.get(sid);
  if(session){
    _setSessionData(session, data);
  }
}

function _setSessionData(session, data){
  if(!data){
    return;
  }
  if(data.userMap){
    throw new Error('canot modify key with "userMap"');
  }
  Object.assign(session, data);
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
    _setUserData(user, data);
  }
}

function _setUserData(user, data){
  if(!data){
    return;
  }
  Object.keys(data).forEach(k => {
    if(k[0] === '_'){
      throw new Error('canot modify user data key start with "_"');
    }
    user[k] = data[k];
  })
}

function removeSessionData(sid, key){
  const session = _getSession(sid);
  if(session){
    if(key === 'userMap'){
      throw new Error('canot modify session data key with "userMap"');
    }
    delete(session[key]);
  }

}

function removeUserData(sid, username, key){
  const user = getUser(sid, username);
  if(user){
    if(key[0] === '_'){
      throw new Error('canot modify user data key start with "_"');
    }
    delete(user[key]);
  }

}

function all(){
  const result = Object.create(null);
  let k;
  sidMap.forEach(function(session, sid){
    const _session = Object.create(null);
    for(k in session){
      if(k !== 'userMap'){
        _session[k] = session[k];
      }
    }
    const _userMap = _session.userMap = Object.create(null);
    const userMap = session.userMap;
    let i;
    userMap.forEach(function(user, username){
      const _user = Object.create(null);
      for(i in user){
        if(i[0] !== '_'){
          _user[i] = user[i];
        }
      }
      _userMap[username] = _user;
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