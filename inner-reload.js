
const http = require('http');
const path = require('path');
const {execSync, exec} = require('child_process');

const cliDir = path.join(__dirname, '../cli');

function _execSyncAsLR(cmd){
  execSync(_cmdWrap(cmd), {cwd: cliDir, stdio: 'inherit'});
}
function _cmdWrap(cmd){
  return `NODE_ENV=development runuser linux-remote --shell=/bin/bash --command='node index.js ${cmd}'`
}



const server = http.createServer(function(req, res){
  console.log('live reload on request')
  if(req.method === 'POST'){
    if(req.url === '/server'){
      _execSyncAsLR('restart');
      res.end('ok');
    } else if(req.url === '/server_main'){
      _execSyncAsLR('reload');
      res.end('ok');
    } else if(req.url === '/sever_user'){
      _getUserPids(function(err, pids){
        if(err){
          console.error(err);
          res.end(err.name + ': ' + err.message);
          return;
        }
        if(pids.length){
          pids.forEach(pid => {
            process.kill(pid);
          })
          res.end('ok');
        } else {
          res.end('not user process runing.');
        }

      })
      
    }
  } else if(req.method === 'GET'){
    if(req.url === '/'){
      res.end('This is live reload server.');
    }
  }

  res.end('404');
})

const PORT = 10001;
server.listen(PORT);
server.on('listening', function(){
  console.log('live-reload server listening on ' + PORT);
  _execSyncAsLR('start');
});

process.on('exit', function(){
  _execSyncAsLR('stop');
});
['SIGTERM', 'SIGINT', 'SIGHUP'].forEach(v => {
  process.on(v, function(){
    console.log("process " + v);
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
  _getGrepInfo('ps U linux-remote', cmdMark, function(err, stdout){
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