const path = require('path');
const fs = require('fs');

const express = require('express');
const logger = require('morgan');
const favicon = require('serve-favicon');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const middleWare = require('./common/middleware');
const mountClient = require('./lib/mount-client');
const { sessionMid } = require('./lib/session');
const login = require('./api/login');

const app = express();

app.set('x-powered-by', global.CONF.xPoweredBy);
app.set('trust proxy', global.CONF.appTrustProxy);

if(process.env.NODE_ENV !== 'production'){
  app.use(logger('dev'));
  // index 欢迎页
  app.get('/', function(req, res){
    res.send('Hello! This is Linux Remote Server!');
  });
}

// ============================ 前端加载 ============================
// 测试环境是分开的。正式是合起来的。
if(global.CONF.client){
  mountClient(app, global.CONF.client);
}else{
  app.use(favicon(path.join(__dirname, 'public', 'favicon.png')));
  app.use(middleWare.CORS);
}
// ============================ 前端加载结束 ============================

app.use(middleWare.preventUnxhr);
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(sessionMid);
app.get('/api/loggedInList', login.loggedInList);
app.post('/api/login',  login.login);
app.post('/api/logout',  login.logout);

// 上传
app.post('/api/user/:username/upload', function(req, res, next){
  res.end(req.params.username);
});
//用户进程代理
app.use('/api/user/:username', function(req, res, next){
  res.end(req.params.username);
});

// catch 404 and forward to error handler
app.use(middleWare.notFound);
// http error handler
app.use(middleWare.errHandle);

module.exports = app;
