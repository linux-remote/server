const path = require('path');
const http = require('http');
const PORT = 10001;
const hostname = '192.168.56.101';
const fs = require('fs');
const keys = ['server', 'server_main', 'server_user'];
const outDir = path.join(__dirname, '../');


function _watch(){
  
  keys.forEach(key => {
    const obPath = path.join(outDir, key + '/src');
    // fs.watch will tigger 4 listener when file modify. so use DebounceTime;
    const dealy = 100;
    let args;
    const dt = new DebounceTime(function(){
      console.log(`[${key}] ${args[1]} ${args[0]}`);
      _request(key);
    }, dealy);

    fs.watch(obPath, function(){
      args = arguments;
      dt.trigger();
    });

    console.log(`[${key}] fs watching ${obPath}`);
  })
  // Watchpack.prototype.watch({
  //   files: Iterable<string>,
  //   directories: Iterable<string>,
  //   missing: Iterable<string>,
  //   startTime?: number
  // })
  /*
  const LEN = outDir.length;
  var wp = new Watchpack();
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
  wp.on("remove", onChange); */
}




function _request(key){
  const options = {
    hostname,
    port: PORT,
    path: '/' + key,
    method: 'POST',
    timeout: 1000
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
  req.on('error', function(err){
    console.log(err.name + ': ' + err.message);
  })
  req.end();
}

_watch();

// copyright from https://github.com/hezedu/SomethingBoring/blob/master/algorithm/DebounceTime.js
function DebounceTime(callback, dealy){
  this.go = callback;
  this.dealy = dealy;
  this.isInputing = false;
  this.inputCount = 0;
  this.inputedCount = 0;
  this.timer = null;
}

DebounceTime.prototype.trigger = function(){
  this.inputCount = this.inputCount + 1;
  if(this.isInputing){
    return;
  }
  this.isInputing = true;
  this.inputedCount = this.inputedCount + 1;
  this.process();
}

DebounceTime.prototype.process = function(){
  if(this.timer){
    return;
  }
  this.timer = setInterval(() => {
    // console.error('setInterval');
    this.isInputing = false;
    if(this.inputedCount === this.inputCount){
      this.inputedCount = this.inputCount = 0;
      clearInterval(this.timer);
      this.timer = null;
      this.go();
    }else{
      this.inputedCount = this.inputCount;
    }
  }, this.dealy);
}