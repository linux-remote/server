module.exports = {
  port: 3001, // Website listen port. default: 3001
  host: undefined, // 
  // selfsigned ?
  // https://github.com/jfromaniello/selfsigned

  secure : null, // http model, default: null.
  userTimeout: 15 * 1000 * 60, // 无操作 15 分钟退出。
  /*
  // Provide an Object to enter https model: 
  secure: {
    keyPath: '/xxx/xxx', 
    keyPath pfxPath 基础验证：其它人不可读写。
    certPath: '/xxx/xxx', 
    
    caPath: '/xxx/xxx', // Optionally

    //... Other options same as https://nodejs.org/api/tls.html#tls_tls_createsecurecontext_options
    // and cert, key, ca will take precedence.
    // keyPath or pfxPath primisonn Authority is too large.  
    // chown linux-remote keyfile
    // chmod 400 keyfile
  }
  */

  
  trustProxy: false, // Boolean, If you used proxy, You need set it. Otherwise, you will not get the real IP when you login.
  // More settings:  https://expressjs.com/en/guide/behind-proxies.html

  xPoweredBy: false, // Boolean, Enables the "X-Powered-By: Express" HTTP header.


  // ----------------- hotload -----------------
  // You change Just need linux-remote hotload.
  // hotload: {

  // }
  cookieSecure: undefined, // Boolean, Cookie's option secure. If you are use https, You can set it true.
  publicCDN: null,
  publicCDNTplMap: {
    Jquery: 'https://bottom.cn/abc{{version}}/.js'
  },
  wsZip: true, // ws 压缩

  // CORS 没必要，publicCDN 把除了 index.html 外的东西全放外面
  // index 也可动态生成。<ejs?>
  // CORS: false, // 前后端分离
  // sssCA: '/somePath' // 只在前后端分离时作用
};