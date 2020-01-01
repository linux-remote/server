const { upUserNow } = require('../lib/session');
const { pipeProxy } = require('../lib/proxy');

// use
function verifyUser(req, res, next){

  const userMap = req.session.userMap;
  if(userMap){
    const user = userMap.get(req.params.username);
    if(user){
      upUserNow(userMap, req.params.username);
      return next();
    }
  }

  res.status(403).end('Forbidden');
  
}

module.exports = {
  verifyUser,
  proxy: pipeProxy
}