
const crypto = require('crypto');

const fs = require('fs');
const {execSync} = require('child_process');
const os = require('os');
const path = require('path');
const uidSafe = require('uid-safe');


const SID_LENGTH = 40; // crypto.randomBytes(30).length
const sidMap = new Map();
let sidHashMap;

// https://developpaper.com/question/will-building-unix-sockets-in-dev-shm-improve-performance/
let socketTmpPath = path.join(os.tmpdir(), 'linux-remote');

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
  execSync('rm -rf ' + socketTmpPath);
  execSync('mkdir -m=1773 -- ' + socketTmpPath);
  sidHashMap = initSidHashMap(socketTmpPath);
}

// ------------------------------ init end ------------------------------

function clearUp(){
  execSync('rm -rf ' + socketTmpPath);
}

function getTmpName(sidHash, username){
  return `${socketTmpPath}/${sidHash}.${username}`;
}

function hashSid(sid){
  return crypto.createHash('sha256').update(sid).digest('hex');
}
function genSid(){
  // node uuid/v4 equal crypto.randomBytes(16).toString('hex');
  // https://github.com/kelektiv/node-uuid/blob/master/lib/rng.js
  // npm use UUID as token.

  // And we used crypto.randomBytes(30) (uid-safe used randomBytes too)

  // Express/session will use secret to generate the signature of sid, and then add it after sid.
  // Then the question becomes: If sid is UUID, does sid need signature?

  const sid = uidSafe.sync(30);
  if(sidMap.size === sidHashMap.size && sidMap.has(sid)){
    return genSid();
  }

  const hash = hashSid(sid);
  if(sidHashMap.has(hash)){
    return genSid();
  }

  return {
    sid,
    hash
  };
}


function _setNewSession(sid, _hashedSid, username, term){
  const userMap = new Map([[username, {term}]]);
  _setSidMap(sid, _hashedSid, userMap);
  sidHashMap.set(_hashedSid, userMap);
}

function _setSidMap(sid, hash, userMap){
  sidMap.set(sid, {
    hash,
    userMap
  });
}

function getSession(sid){
  // Cookie value is always string.
  if(sid && sid.length === SID_LENGTH){
    if(!sidMap.has(sid) && sidHashMap.size && sidMap.size !== sidHashMap.size){
      const sidHash = hashSid(sid);
      if(sidHashMap.has(sidHash)){
        _setSidMap(sid, sidHash, sidHashMap.get(sidHash));
      }
    }
    return sidMap.get(sid);
  }
}

function setCookie(res, sid, cookieSecure){
  res.cookie('sid', sid, {
    httpOnly: true,
    path: '/api',
    secure: cookieSecure
  });
}

function middleware(req, res, next){
  const sid = req.cookies.sid;
  const session = getSession(sid);
  if(session){
    const userMap = session.userMap;
    req.session = {
      id: sid,
      userMap,
      hash: session.hash,
      hasUser: userMap && userMap.size !== 0
    }
  } else {
    req.session = Object.create(null);
  }

  next();
}
function upUserNow(userMap, username){
  userMap.set(username, Date.now());
}
function delSession(sid, username){
  const session = getSession(sid);
  if(session){
    const userMap = session.userMap;
    const user = userMap.get(username);
    if(user){
      user.term.kill();
      userMap.delete(username);
      // if(userMap.size === 0){

      // }
    }
  }
}

module.exports = {
  init,
  clearUp,
  genSid,
  _setNewSession,
  hashSid,
  getSession,
  delSession,
  setCookie,
  middleware,
  getTmpName,
  upUserNow
}