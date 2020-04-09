const crypto = require('crypto');
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const base64ToSafe = require('base64-2-safe');
/*
sidMap: 
	key: sid
	value: { hash, userMap}
sidHashMap:
	key: hash
	value: userMap

userMap
	key: username
	value: {term, _autoDelTimer, otherData}
 */

const sortTimeStartPoint = 1579660004551; // 2020/01/22
const sortTime = Date.now() - sortTimeStartPoint;
let index = 1;
const SID_MIN_LENGTH = 34;
const sidMap = new Map();
let sidHashMap;

// https://developpaper.com/question/will-building-unix-sockets-in-dev-shm-improve-performance/
let socketTmpPath = path.join(global.__TMP_DIR__, 'linux-remote');

// user
// group
// homedir
// tmpdir
// ------------------------------ init ------------------------------



function initSidHashMap(tmpPath){
  let filenames = fs.readdirSync(tmpPath);
  const map = new Map();
  filenames.forEach(name => {
    if(name[0] === '.'){
      return;
    }
    name = name.split('.');
    const hash = name[0];
    const username = name[1];
    if(!map[hash]){
      map[hash] = new Map();
    }
    map[hash].set(username, true);
  });
  return map;
}


function init(){
  execSync('rm -rf ' + socketTmpPath + ' && ' 
  + 'mkdir -m=1773 -- ' + socketTmpPath);
  sidHashMap = initSidHashMap(socketTmpPath);
}

// ------------------------------ init end ------------------------------

function clearUp(){
  execSync('rm -rf ' + socketTmpPath);
}

// function getUserTmpDir(sidHash, username){
//   return `${socketTmpPath}/${sidHash}.${username}/`;
// }

function hashSid(sid){
  let hash = crypto.createHash('sha256').update(sid).digest('base64');
  return base64ToSafe(hash);
}
function genSidAndHash(){
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

  // if(sidMap.size === sidHashMap.size && sidMap.has(sid)){
  //   return genSidAndHash();
  // }

  const hash = hashSid(sid);
  // if(sidHashMap.has(hash)){
  //   return genSidAndHash();
  // }

  index = index + 1;
  return {
    sid,
    hash
  };
}


function _setNewSession(sid, _hashedSid, username, term){
  const userMap = new Map();
  _setSidMap(sid, _hashedSid, userMap);
  sidHashMap.set(_hashedSid, userMap);
  const user = setNewUser(sid, userMap, username, term);
  return user;
}

function setNewUser(sid, userMap, username, term){
  const user = {term};
  userMap.set(username, user);
  term.once('exit', function(){
    term._is_exit = true;
    delSession(sid, username);
  });

  return user;
}

function _setSidMap(sid, hash, userMap){
  sidMap.set(sid, {
    hash,
    userMap
  });
}

function getSession(sid){
  // Cookie value is always string.
  if(sid && sid.length > SID_MIN_LENGTH){
    if(!sidMap.has(sid) && sidHashMap.size && sidMap.size !== sidHashMap.size){
      const sidHash = hashSid(sid);
      if(sidHashMap.has(sidHash)){
        _setSidMap(sid, sidHash, sidHashMap.get(sidHash));
      }
    }
    return sidMap.get(sid);
  }
}



function delSession(sid, username){
  const session = getSession(sid);
  if(session){
    const userMap = session.userMap;
    const user = userMap.get(username);
    if(user){
      if(!user.term._is_exit){
        user.term.kill();
      }
      userMap.delete(username);
      
      // fs clear.
      // const userTmpDir = getUserTmpDir(session.hash, username);
      // exec(`rm -rf ${userTmpDir}`, function(err){
      //   if(err){
      //     console.error('clear user tmpdir fail:', userTmpDir);
      //   }
      // });

    }
    if(userMap.size === 0){
      sidMap.delete(session.id);
      sidHashMap.delete(session.hash);
    }
  }
}

function getUserByHash(hash, username){
  const userMap = sidHashMap.get(hash);
  if(userMap){
    return userMap.get(username);
  }
}

function getUser(sid, username){
  const sess = sidMap.get(sid);
  if(sess.userMap){
    return sess.userMap.get(username);
  }
}


module.exports = {
  init,
  clearUp,
  genSidAndHash,
  _setNewSession,
  hashSid,
  getSession,
  delSession,
  getUserByHash,
  getUser,
  setNewUser
}