// get permission by stat.mode
// https://code-maven.com/system-information-about-a-file-or-directory-in-nodejs

const fs = require('fs');

function isOtherCanRW(filePath){
  const stat = fs.statSync(filePath);
  const mode = stat.mode;
  console.log('mode', mode)
  console.log('mode', mode & 4)
  if((mode & 2) || (mode & 4)){
    return true;
  }
  return false;
}

function _readPrivate(filePath){
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch(e){
    if(e.code === 'EACCES'){
      return false;
    } else {
      throw e;
    }
  }
}

function initSecure(secure){
  let k = 'keyPath';
  if(!secure[k]){
    k = 'pfxPath';
  }
  let myPath = secure[k];
  if(!myPath){
    return `The pfxPath or keyPath of the secure option must have one.`;
  }
  if(isOtherCanRW(myPath)){
    // like ssh
    return `The '${k}' file permission is too open. Pleace use commond like: 'chmod 400 ${myPath}' to limit it.`;
  }

  let realKey = k.substr(0, k.lastIndexOf('Path'));
  let content = _readPrivate(myPath);
  if(content === false){
    // 'requires elevated privileges' get from express/www
    return `The '${k}' requires elevated privileges. Pleace use command like: 'setfacl -m u:linux-remote:r ${myPath}' to enable linux-remote to read.`;
  }

  secure[realKey] = content;
  delete(secure[k]);

  if(k === 'key'){
    if(!secure.cert){
      secure.cert = fs.readFileSync(secure.certPath, 'utf-8');
      delete(secure.certPath);
    }
  }

  if(!secure.ca && secure.caPath){
    secure.ca = fs.readFileSync(secure.caPath, 'utf-8');
    delete(secure.caPath);
  }
}

module.exports = {
  isOtherCanRW,
  initSecure
}