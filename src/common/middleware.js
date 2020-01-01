
var ONE_YEAR_SECOND  = 60 * 60 * 24 * 365;

exports.CORS = function(req, res, next) {
  res.set('Access-Control-Allow-Origin', 'http://127.0.0.1:4000');
  res.set('Access-Control-Allow-Credentials', 'true');

  if (req.method == "OPTIONS") {
    res.set('Access-Control-Max-Age', ONE_YEAR_SECOND);
    res.set('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'X-Requested-With, content-type');
    res.send('ok');
  } else {
    next();
  }
}


exports.preventUnxhr = function(req, res, next){
  if(!req.xhr) {
    res.status(400).end("xhr only");
  } else {
    next();
  }
}

//404
exports.notFound = function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
}

//errHandle

exports.errHandle = function(err, req, res, next) {

  setTimeout(() => {
    if(req.complete){
      res.status(err.status || 500);
      res.end(`${err.name}: ${err.message}`);
    } else {
      // eg: upload , stop immediately
      // _console.log('errHandle stop immediately');
      req.destroy();
    }
  });
  //util.errLog(msg, req);
};