const pty = require('node-pty');
const term = pty.spawn('/opt/linux-remote/bin/lr-login', [], {});

term.on('exit', function(){
  console.log('term exit', arguments);
})

setTimeout(() => {
  // term.kill();
  term.write('\u0003');
  console.log('term kill');
}, 3000)