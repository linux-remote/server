const fs = require('fs');
 try {
  fs.readFileSync('/home/dw/permission/abc')
 } catch(e){
   console.log(e.code)
 }