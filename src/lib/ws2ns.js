
/* 
  Web Socket 2 Net Socket.
  WebSocket
  https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
  netSocket
  https://nodejs.org/api/net.html#net_class_net_socket
*/


// server.handleUpgrade(request, socket, head, callback)
// server.shouldHandle(request) X 无用

// http server on upgrade -> verify session -> onnectedNs 
// -> ws server handleUpgrade -> emit connection -> 
// get ws and connectedNs
function ws2ns(ws, connectedNs){
  let wsError,  nsError;
  const wsHandles = {
    
    message: function(data) {
      connectedNs.write(data);
    },

    close: function(closeEvent){
      connectedNs.removeEventListener('close', nsHandles.close);

      // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
      const code = closeEvent.code;
      if(code === 1000){
        // 正常退出
        connectedNs.destroy();
        // connectedNs.end();
        return;
      }

      if(wsError){
        // webSocket 出错
        console.error(wsError);
        // connectedNs.destroy(wsError);
        // return;
      }

      // 1. 用户非正常退出, 比如关闭页面、浏览器。
      // 2. 断网了，客户端会无限重连, 未在指定时间内连接，
      //    则 net 服务端会自动退出并触发 logout。

      /* 
        以下跟本项目无关：
        user-server 后台运行的话：
        主server 和 term 进程意外退出，应关闭 net 服务器。
        主server：
          process.on('exit'), 会触发 ws 断开。
          execSync('kill ' + process.pid) 会触发 ws 断开。
          终端 kill:  会触发 ws 断开。
        term：
          term.on('close') 没有问题。
      */
      delete(nsHandles.close);
      Object.keys(nsHandles).forEach(key => {
        connectedNs.removeEventListener(key, nsHandles[key]);
      });

      // connectedNs.write(JSON.stringify({
      //   type: 'webSocketClose',
      //   code: closeEvent.code,
      //   reason: closeEvent.reason
      // }));
      // 其它由ns 判定
    },

    error: function(errEvent){
      // https://stackoverflow.com/questions/18803971/websocket-onerror-how-to-read-error-description
      wsError = new Error('Websocket Error.');
    },
    // ping: function(){
    // send from server away.
    //   // client not send
    // },
    pong: function(){
    }
  }
  
  const nsHandles = {
    data: function(data){

      ws.send(data);
    },
    close: function(hadError){ // boolean

      ws.removeEventListener('close', wsHandles.close);

      if(hadError){
        if(nsError){
          ws.close(1011, nsError.message);
        } else {
          ws.close(1011);
        }
      } else {
        ws.close(1000);
      }
    },
    error: function(err){
      // https://nodejs.org/api/net.html#net_event_error_1
      // The 'close' event will be called directly following this event.
      nsError = err;
    }
  }

  ws.onopen = function(){
    Object.keys(wsHandles).forEach(key => {
      ws.addEventListener(key, wsHandles[key]);
    })
    Object.keys(nsHandles).forEach(key => {
      connectedNs.addEventListener(key, nsHandles[key]);
    })
  }
}



module.exports = ws2ns;
