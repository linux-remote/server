var eStatic = require('express').static;
const favicon = require('serve-favicon');
const path = require('path');
var DAY_TIME = 1000 * 60 * 60 * 24 //一天
var MONTH_TIME  = DAY_TIME * 30 //一月
var HALF_YEAR_TIME  = MONTH_TIME * 6; //半年
const ONE_YEAR_TIME = HALF_YEAR_TIME * 2;

module.exports = function(app, client){
  
  // _console.log('client mounting...');

  const {dir, nodeModuleStaticMap, faviconPath, publicPath} = client;
  const distPath = path.join(dir , './dist/pro');

  app.use(favicon(faviconPath));
  
  for(let i in nodeModuleStaticMap){
    let v = nodeModuleStaticMap[i];
    // _console.log(v.url, v.fsDir);
    app.use(v.url, eStatic(v.fsDir, {maxAge:ONE_YEAR_TIME}));
  }

  //首頁不緩存
  app.get('/', eStatic(distPath, {lastModified: false, etag: false}));// npm update 后文件修改时间不会变。https://github.com/npm/npm/issues/21141

  //lib 和 vendor 緩存半年
  // app.get('/bulid', eStatic(distPath, {maxAge:HALF_YEAR_TIME}));

  // build 好的文件 缓存 半年
  app.use('/build', eStatic(path.join(distPath, './build'), {maxAge:HALF_YEAR_TIME}));

  app.use('/public', eStatic(publicPath, {maxAge:ONE_YEAR_TIME}));
}
