const {execSync} = require('child_process');

const isOtherCanRW = require('../lib/is-other-can-rw');
const filePath = '/home/dw/permission/abc.js'
function verify(mode){
  execSync('chmod ' + mode + ' ' + filePath);
  let canRw = isOtherCanRW(filePath);
  console.log('isOtherCanRW ' + mode, canRw);
}

verify(777);
verify(771);
verify(770);

execSync('setfacl -m u:dw2:rw ' + filePath);
let canRw = isOtherCanRW(filePath);
console.log('isOtherCanRW setfacl u', canRw);
// setfacl u: 会使 group 出现.
// other  没有中间有名字。
execSync('setfacl -m other::rw- ' + filePath);
canRw = isOtherCanRW(filePath);
// https://unix.stackexchange.com/questions/209487/how-can-i-use-setfacl-to-give-no-access-to-other-users
console.log('isOtherCanRW setfacl o', canRw);