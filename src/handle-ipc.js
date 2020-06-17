const methods = require('./methods');

function handleIPC(serverProcess){

  serverProcess.on('message', function(msgObj){

    let handler = methods[msgObj.type];
    if(handler.length === 2){
      handler(msgObj.data, function _send(sendData, callback){
        if(sendData){
          sendData.id = msgObj.id;
          serverProcess.send(sendData, callback);
        }
      });
    } else {
      handler(msgObj.data);
    }

  });
}


module.exports = handleIPC;
