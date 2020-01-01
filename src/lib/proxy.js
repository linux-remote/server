const request = require('request');
const {getTmpName} = require('./session');

request.GET = request.get;
request.POST = request.post;
request.PUT = request.put;
request.DELETE = request.delete;

function getUnixSocketUrl(sidHash, username, url){
  return 'http://unix:' + getTmpName(sidHash, username) + ':' + url;
}

function halfProxy(req, distUrl, next, callback){
  var url = getUnixSocketUrl(req.session.hash, req.params.username, distUrl);
  var x = request[req.method](url, function(err, response, body){
    if(err){
      return callback(err);
    }
    if(response.statusCode == 200){
      return callback({status: response.statusCode, message: body})
    }
    callback(null, JSON.parse(body));
  });

  x.on('error', _handleProxyError(x, next));
  req.on('aborted', function(){
    x.abort();
  });
  req.pipe(x);
}

function _handleProxyError(x, next){
  return function(err){
    // if(err.code === 'ECONNRESET'){ // 用户取消
    //   return res.end('ECONNRESET');
    // }

    // _console.log('x: x on error', err.code, err.message);

    x.abort(); // 代理自己取消.不然如上传文件会一直挂起. 也会触发 1.

    next({
      status: 502,
      name: 'httpRequestProxyError',
      message: err.message
    });
  }
}

// use
function pipeProxy(req, res, next){
  // if(!isHaveTerm) {
  //   return res.status(403).send('Forbidden'); 
  // }

  var url = getUnixSocketUrl(req.session.hash, req.params.username, req.url);
  var x = request[req.method](url);

  x.on('error', _handleProxyError(x, next));

  // x.on('close', function(){
  // _console.log('x: x on close');
  // })
  // _console.log('x', x)

  // x.on('timeout', () => {
  // _console.log('x: timeout');
  //   x.abort();
  // });
  // x http.ClientRequest
  // x.on('abort', function(){
  //   if(!x._abort_emit_by_proxy_err){
  //     req.destroy();
  // _console.log('x: x on abort');
  //   }
  // });
  // req: http.IncomingMessage
  req.on('aborted', function(){ // 1. 用户取消.比用浏览器人取消上传. 
    x.abort();// 2. 触发代理取消 -> 触发目标服务器 aborted
    // _console.log('proxy: req on aborted');
  });
  req.pipe(x);
  x.pipe(res);
}

module.exports = {
  halfProxy,
  pipeProxy
}