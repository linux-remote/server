// on Sep 22, 2018 copyright https://github.com/hezedu/SomethingBoring/blob/master/algorithm/DebounceTime.js 
// unmidify

function getFirstLine(stdout){
  stdout = stdout.trimLeft();
  const i = stdout.indexOf('\n');
  return stdout.substr(0, i);  
}

function escapeInjection(userInput) {
  return userInput.replace(/\n|\r|`|"|'/g, (mstr) => {
    // `str` 会执行
    switch(mstr) {
      case '\n':
        return '\\n';
      case '\r':
        return '\\r';
      default:
        return '\\' + mstr;
    }
  });
}

// echo "$HOME" /home/dw
// echo '$HOME' $home
// echo `$HOME` bash: /home/dw: Is a directory
function safeWrap(disinfectedInput){
  return `'${disinfectedInput}'`
}

// function escapeCRLF(userInput) { password has ` " ' ???
//   return userInput.replace(/\n|\r|`/g, (mstr) => {
//     // `str` 会执行
//     switch(mstr) {
//       case '\n':
//         return '\\n';
//       case '\r':
//         return '\\r';
//       default:
//         return '\\' + mstr; 
//     }
//   });
// }


// $$common$$
// server user-server 各有一份相同的。
// 2020/04/01 
function genUserServerFlag(){
  let wrap = '***';
  let serverName = 'LR-USER-SERVER';
  let START_FLAG = `${wrap}${serverName}-START${wrap}`;
  let ERR_FLAG_START = `${wrap}${serverName}-ERR-START${wrap}`;
  let ERR_FLAG_END = `${wrap}${serverName}-ERR-END${wrap}`;
  return {
    START_FLAG,
    ERR_FLAG_START,
    ERR_FLAG_END
  }
}

module.exports = {
  getFirstLine,
  escapeInjection,
  safeWrap,
  genUserServerFlag
}


