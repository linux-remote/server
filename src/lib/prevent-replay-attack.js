
const methodMap = new Map([
  ['POST', true], 
  ['PUT', true],
  ['GET', true]
]);

const praKeyMap = new Map();

let asyncCount = 0;

module.exports = function(req, res, next){
  if(!methodMap.has(req.method)){
    return next();
  }
  let pra = req.cookies.pra || 0;
  pra = Number(pra);
  pra = pra + asyncCount;
  let praKey = pra + '-' + asyncCount;
  if(praKeyMap.has(praKey)){
    return next({
      status: 400,
      message: 'Reply Attack Prevented'
    })
  }

  praKeyMap.set(pra, true);
  asyncCount = asyncCount + 1;

  res.on('finish', function(){
    asyncCount = asyncCount - 1;
    praKeyMap.delete(praKey);
  });

  res.cookie('pra', Date.now(), {
    httpOnly: true,
    secure: global.CONF.cookieSecure
  });
  next();
}
