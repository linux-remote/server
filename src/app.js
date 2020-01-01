const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const middleWare = require('./common/middleware');
const mountClient = require('./lib/mount-client');
const session = require('./lib/session');
const httpRequestProxy = require('./api/http-request-proxy');
const sess = require('./api/sess');
const login = require('./api/login');

const CONF = global.CONF;
const app = express();

app.set('x-powered-by', CONF.xPoweredBy);
app.set('trust proxy', CONF.appTrustProxy);

// uncomment after placing your favicon in /public

// ============================ 前端加载 ============================
// 测试环境是分开的。正式是合起来的。
if(CONF.client){
  mountClient(app, CONF.client);
}else{
  app.use(favicon(path.join(__dirname, 'public', 'favicon.png')));
  app.use(middleWare.CORS);
}
// ============================ 前端加载结束 ============================

app.use(cookieParser());
app.use(session.middleware);
//用户进程代理
app.use('/api/user/:username', httpRequestProxy.verifyUser, httpRequestProxy.proxy);

if(!global.IS_PRO){
  app.use(logger('dev'));
  // index 欢迎页
  app.get('/', function(req, res){
    res.send('Hello! This is Linux Remote Server!');
  });
}

app.use(middleWare.preventUnxhr);
app.get('/api/touch',  sess.touch);
app.get('/api/loginedList', login.loginedList);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/api/login',  login.login);
app.post('/api/logout',  login.logout);

// app.use(sess.verifyLogined);

// catch 404 and forward to error handler
app.use(middleWare.notFound);
// http error handler
app.use(middleWare.errHandle);

module.exports = app;
