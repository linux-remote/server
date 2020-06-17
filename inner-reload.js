
const http = require('http');
const path = require('path');
const {execSync, exec} = require('child_process');
if(process.geteuid() !== 0){
  console.log('[live-reload]: need root.');
  return;
}
const cliDir = path.join(__dirname, '../cli');

function _execSyncAsLR(cmd){
  execSync(_cmdWrap(cmd), {cwd: cliDir, stdio: 'inherit'});
}
function _cmdWrap(cmd){
  return `NODE_ENV=development runuser linux-remote --shell=/bin/bash --command='node index.js ${cmd}'`
}



const server = http.createServer(function(req, res){
  
  if(req.method === 'POST'){
    if(req.url === '/server'){
      _execSyncAsLR('restart -y');
      res.end('ok');
    } else if(req.url === '/server_main'){
      _execSyncAsLR('reload');
      res.end('ok');
    } else if(req.url === '/server_user'){
      
      reloadUser(function(msg){
        res.end(msg);
      })
      return;
    }
  } else if(req.method === 'GET'){
    if(req.url === '/'){
      res.end('This is inner reload server.');
    }
  } else {
    res.end('404');
  }

  
})

const PORT = 10001;
server.listen(PORT);
server.on('listening', function(){
  console.log('[live-reload]: listening on ' + PORT);
  _execSyncAsLR('start');
});

process.on('exit', function(){
  console.log('[inner-reload]: process exit.');
  _execSyncAsLR('stop -y');
});
['SIGTERM', 'SIGINT', 'SIGHUP'].forEach(v => {
  process.on(v, function(){
    console.log("[live-reload]: process on " + v);
    process.exit();
  })

})


function _getGrepInfo(cmd, endMark, callback){
  exec(`${cmd} | grep '${endMark}$'`, function(err, stdout, stderr){
    if(err){
      if(!stderr){
        return callback(null, ''); // no output will get an Error.
      }
      return callback(err);
    }
    callback(null, stdout.toString());
  })
}

function _getPidsByCMDMark(cmdMark, callback){
  _getGrepInfo('ps axo pid,cmd', cmdMark, function(err, stdout){
    if(err){
      return callback(err);
    }
    if(!stdout){
      return callback(null, []);
    }
    let arr = stdout.trim();
    if(!arr){
      return callback(null, []);
    }
    arr = stdout.split('\n');
    let result = [];
    arr.forEach((line) => {
      let pid = line.trim();
      if(pid){
        let i = pid.indexOf(' ');
        pid = pid.substr(0, i);
        result.push(pid);
      }
    });
    callback(null, result);
  });
}
function _getUserPids(callback){
  _getPidsByCMDMark(path.join(__dirname, '../server_user/src/index.js'), function(err, arr){
    if(err){
      return callback(err);
    }
    callback(null, arr);
  });
}

function reloadUser(callback){
  _getUserPids(function(err, pids){
    console.log('[live-reload]: user pids', pids);
    if(err){
      console.error(err);
      callback(err.name + ': ' + err.message);
      return;
    }
    if(pids.length){
      pids.forEach(pid => {
        process.kill(pid);
      })
      console.log('[live-reload]: user process killed');
      callback('ok');
    } else {
      let msg = 'not user process runing.';
      console.log('[live-reload]: ' + msg);
      callback(msg);
    }

  })
}