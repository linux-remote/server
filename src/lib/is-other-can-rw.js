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

module.exports = isOtherCanRW;