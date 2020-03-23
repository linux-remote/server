const methods = require('./methods');

function handleIPC(serverProcess){

  serverProcess.on('message', function(msgObj){

    function _send(sendData, callback){
      if(sendData){
        sendData.id = msgObj.id;
        serverProcess.send(sendData, callback);
      }
    }
    
    let handler = methods[msgObj.type];
    if(handler){
      handler(msgObj.data, _send);
    }

  });
}


module.exports = handleIPC;
