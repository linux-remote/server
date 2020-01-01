
function getUser(term){
  return {
    term,
    now: Date.now()
  }
}
function upUserNow(user){
  user.now = Date.now();
}
module.exports = {
  getUser,
  upUserNow
}
