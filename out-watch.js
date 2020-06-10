var Watchpack = require("watchpack");
const path = require('path');
const http = require('http');
const PORT = 10001;
const hostname = '192.168.56.101';

const keys = ['server', 'server_main', 'server_user'];
const outDir = path.join(__dirname, '../');

const LEN = outDir.length;


function _watch(){
  var wp = new Watchpack();

  // Watchpack.prototype.watch({
  //   files: Iterable<string>,
  //   directories: Iterable<string>,
  //   missing: Iterable<string>,
  //   startTime?: number
  // })
  let keyPath = keys.map(v => {
    return v + path.sep;
  })
  const directories = keyPath.map(v => path.join(outDir, v + 'src'));
  wp.watch([], directories,  Date.now() - 1000);
  console.log(directories, 'watching');
  let len = keyPath.length;
  let i = 0;
  function onChange(filePath){
    
    let rPath = filePath.substr(LEN);
    console.log('file changed: ', rPath);
    for(i = 0; i < len; i++){
      if(rPath.indexOf(keyPath[i]) === 0){
        _request(keys[i]);
        return;
      }
    }

  }
  wp.on("change", onChange);
  wp.on("remove", onChange);
}




function _request(key){
  const options = {
    hostname,
    port: PORT,
    path: '/' + key,
    method: 'POST'
  };
  console.log('reloading ' + key);
  const req = http.request(options, function(res){
    res.setEncoding('utf8');
    let data = '';
    res.on('data', (chunk) => {
      data = data + chunk;
    });
    res.on('end', () => {
      console.log(data);
    });
  })
  req.end();
}

_watch();