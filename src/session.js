const crypto = require('crypto');
const fs = require('fs');
const { execSync } = require('child_process');
const os = require('os');
const path = require('path');
const base64ToSafe = require('base64-2-safe');
const sortTimeStartPoint = 1579660004551; // 2020/01/22
const sortTime = Date.now() - sortTimeStartPoint;
let index = 1;
const SID_MIN_LENGTH = 34;
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

  // if(sidMap.size === sidHashMap.size && sidMap.has(sid)){
  //   return genSid();
  // }

  const hash = hashSid(sid);
  // if(sidHashMap.has(hash)){
  //   return genSid();
  // }

  index = index + 1;
  return {
    sid,
    hash
  };
}


function _setNewSession(sid, _hashedSid, username, term){
  const userMap = new Map([[username, {term}]]);
  _setSidMap(sid, _hashedSid, userMap);
  sidHashMap.set(_hashedSid, userMap);
  term.once('exit', function(){
    term._is_exit = true;
    delSession(sid, username);
  })
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

function setCookie(res, sid, cookieSecure){
  res.cookie('lr_sid', sid, {
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

module.exports = {
  init,
  clearUp,
  genSid,
  _setNewSession,
  hashSid,
  getSession,
  delSession,
  setCookie,
  middleware
}