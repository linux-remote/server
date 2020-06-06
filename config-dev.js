module.exports = {

  /* Website listen port. default: 3001 */
  port: 3000, 
  
  host: '192.168.56.101', // 
  // selfsigned ?
  // https://github.com/jfromaniello/selfsigned

  secure : null, // http model, default: null.
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

  // ----------------- hotload -----------------
  // You change Just need linux-remote hotload.
  // hotload: {

  // }
  cookie: {
    secure: undefined,
    sameSite: 'None',
  },

  // CORS: 'http://127.0.0.1:4000',
  // CORS: undefined,
  client: 'http://127.0.0.1:4000'
};