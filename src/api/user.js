var express = require('express');
var router = express.Router();
// const ipcSay = require('../lib/ipc-say');

router.use(function(req, res, next){
  const users = req.session.users;
  if(users){
    const username = req.params.username;
    if(users.indexOf(username) !== -1){
      next();
      return;
    }
  }
  next({status: 403});
})

router.post('/upload', function(req, res, next){
  res.end('ok2');
})

module.exports = router;
