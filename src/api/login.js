
// get
exports.loggedInList = function(req, res){
  let users = req.session ? Object.keys(req.session.userMap) : [];
  res.json(users);
}

// post
exports.login = function(req, res, next){
  res.end('ok');
}

// post2
exports.logout = function(req, res){
  res.end('ok');
}

