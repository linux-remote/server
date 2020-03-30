
const pty = require('node-pty');
const { escapeInjection } = require('./util');
const os = require('os');
function killLoginTerm(term){
  // Fixed: Login timed out after 60 seconds.
  term.write('\u0003');
}
function login(opts) {
  const username = escapeInjection(opts.username);
  // username can't see in `top -c -b`
  const term = pty.spawn(global.CONF.loginBinPath, ['-h', opts.ip, username], {
    rows: 1,
    cols: 1
  });

  const callback = opts.end;

  // console.info('\nterm.process', term.process);
  // console.info('term.pid', term.pid, '\n');

  let isEnd = false;
  let timer;
  function end(err, output) {
    if(timer){
      clearTimeout(timer);
    }
    if(isEnd) { // term on Error: may have read EIO bug.
      return;
    }
    isEnd = true;

    if(err) {
      killLoginTerm(term);
      callback(err);
    } else {
      callback(null, output);
    }
  }

  const BEFORE_PROCESS = term.process;
  // let isNotHaveOutput = true;
  let output = '';
  // const debunce = new DebounceTime(function() {
  //   if(isNotHaveOutput) {
  //     isNotHaveOutput = !output.trim();
  //   }
  //   if(isNotHaveOutput){ // waiting
  //     return;
  //   }
  //   if(BEFORE_PROCESS !== term.process) {
  //     end(null, output);
  //   } else {
  //     end({
  //       name: 'loginError',
  //       message: getFirstLine(output)
  //     });
  //   }
  //   term.removeListener('data', handleData);
  // }, 200);
  
  function handleData(data) {
    output = output + data;
    if(BEFORE_PROCESS !== term.process){
      // console.log('term process2', term.process);
      end(null);
      term.removeListener('data', handleData);
    } else {
      if(data.indexOf('Login incorrect') !== -1) {
        end({
          name: 'loginError',
          message: 'Login incorrect'
        })
      } else if(data.indexOf(os.hostname() + ' login:') !== -1){
        end({
          name: 'loginError',
          message: 'Login incorrect'
        })
      }
    }
    // debunce.trigger();
  }
  if(!global.IS_PRO){
    term.on('data', function(data){
      process.stdout.write(data);
    })
  }
  term.once('data', function() {
    const password = escapeInjection(opts.password);
    term.write(password + '\n');
    term.addListener('data', handleData);
    timer = setTimeout(() => {
      timer = null;
      end({
        name: 'loginError',
        message: 'Login timeout'
      })
    }, 5000);
  });
  term.on('error', end);
  // term.on('exit', function(){
  //   console.info('\n----------- term exit -----------\n');
  // });
  return term;
}


module.exports = login;
