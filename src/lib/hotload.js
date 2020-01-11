const path = require('path');
function hotload(filePath){
  let rCache = require.cache;
  let rePath = path.resolve(filePath);
  if(!rCache[rePath]){
    rePath = rePath + '.js';
  }
  if(rCache[rePath]){
    rCache[rePath] = null;
  } else {
    throw new Error('[hotload]: Unknown filePath ' + filePath);
  }
  return require(filePath);
}

module.exports = hotload;
