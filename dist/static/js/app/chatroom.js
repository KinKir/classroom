var appId = 'BoXslRV8OngKWN18wvltH7tq-gzGzoHsz';
var appKey = 'tPHW2xTOAFFxVn6krhF56NVe';

AV.initialize(appId, appKey);

localStorage.setItem('debug', 'LC*');

// 初始化实时通讯 SDK
var Realtime = AV.Realtime;
var realtime = new Realtime({
  appId: 'BoXslRV8OngKWN18wvltH7tq-gzGzoHsz'
});

// // Stu 用自己的名字作为 clientId，获取 IMClient 对象实例
// realtime.createIMClient('teacher').then(function(stu) {
//   // 创建与Teacher之间的对话
//   return stu.createConversation({
//     members: [],
//     name: '实时反馈',
//   });
// }).then(function(conversation) {
//   // 发送消息
//   return conversation.send(new AV.TextMessage('耗子，起床！'));
// }).then(function(message) {
//   console.log('Stu & Teacher', '发送成功！');
// }).catch(console.error);

// realtime.createIMClient('20134970').then(function(jerry) {
//   jerry.on('message', function(message, conversation) {
//     console.log('Message received: ' + message.text);
//   });
// }).catch(console.error);



// 请换成你自己的一个房间的 conversation id（这是服务器端生成的）
var roomId = '574204e149830c00614b220e';

// 每个客户端自定义的 id
var clientId = $('#uname').val();
console.log(clientId)
// var clientId = $('#uname').value;

var realtime;
var client;
var messageIterator;

// 用来存储创建好的 roomObject
var room;

// 监听是否服务器连接成功
var firstFlag = true;

// 用来标记历史消息获取状态
var logFlag = false;

var sendBtn = $('#sendBtn');
var inputName = $('#uname');
var inputSend = $('#inputSend');
var printWall = $('#printWall');

console.log(inputName.val())

// 拉取历史相关
// 最早一条消息的时间戳
var msgTime;

$(function(){
    main();
    sendBtn.click(sendMsg)
    $(document.body).keydown(function(e){
        if (e.keyCode === 13) {
            if (firstFlag) {
                main();
            }else{
                sendMsg();
            }
        }
    })
    // 拉取历史
    printWall.scroll(function(e) {
      if (printWall.scrollTop < 20) {
        getLog();
      }
    });
})

function main() {
  showLog('正在连接服务器，请等待。。。');
  var val = inputName.val();
  if (val) {
    clientId = val;
  }
  if (!firstFlag) {
    client.close();
  }

  // 创建实时通信实例
  realtime = new AV.Realtime({
    appId: appId,
    appKey: appKey,
  });
  // 注册文件类型消息  
  // realtime.register(AV.FileMessage);
  // 创建聊天客户端  
  realtime.createIMClient(clientId)
  .then(function(c) {
    showLog('服务器连接成功！');
    firstFlag = false;
    client = c;
    client.on('disconnect', function() {
      showLog('服务器正在重连，请耐心等待。。。');
    });
    // 获取对话
    return c.getConversation(roomId);
  })
  .then(function(conversation) {
    if (conversation) {
      return conversation;
    } else {
      // 如果服务器端不存在这个 conversation
      showLog('服务器不存在这个 conversation，创建一个。');
      return client.createConversation({
        name: 'LeanCloud-Conversation',
        members: [
          // 默认包含当前用户
          currUser
        ],
        // 创建暂态的聊天室（暂态聊天室支持无限人员聊天，但是不支持存储历史）
        // transient: true,
        // 默认的数据，可以放 conversation 属性等
        attributes: {
          test: 'demo2'
        }
      }).then(function(conversation) {
        showLog('创建新 Room 成功，id 是：', roomId);
        roomId = conversation.id;
        return conversation;
      });
    }
  })
  .then(function(conversation) {
    showLog('当前会话的成员列表：', conversation.members);
    if (conversation.members.length > 490) {
      return conversation.remove(conversation.members[30]).then(function(conversation) {
        showLog('人数过多，踢掉： ', conversation.members[30]);
        return conversation;
      });
    }
    return conversation;
  })
    .then(function(conversation) {
        return conversation.join();
    })
    .then(function(conversation) {
        // 获取聊天历史
        room = conversation;
        messageIterator = conversation.createMessagesIterator();
        getLog(function() {
        printWall.scrollTop = printWall.scrollHeight;
            showLog('已经加入，可以开始聊天。');
        });
        // 房间接受消息
        conversation.on('message', function(message) {
            if (!msgTime) {
            // 存储下最早的一个消息时间戳
                msgTime = message.timestamp;
            }
            showMsg(message);
        });
    })
    .catch(function(err) {
        console.error(err);
    })
}

function sendMsg() {
    var val = inputSend.val();
    console.log(val)
    // 不让发送空字符
    if (!String(val).replace(/^\s+/, '').replace(/\s+$/, '')) {
        alert('发送内容不能为空！');
    }else{
    // 向这个房间发送消息，这段代码是兼容多终端格式的，包括 iOS、Android、Window Phone
        room.send(new AV.TextMessage(val)).then(function(message) {
        // 发送成功之后的回调
            inputSend.value = '';
            showLog('自己： ', encodeHTML(message.text),formatTime(message.timestamp));
            printWall.scrollTop = printWall.scrollHeight;
        });
    }
}

// // 发送多媒体消息示例
// function sendMsgAsFile() {

//   var val = inputSend.value;

//   // 不让发送空字符
//   if (!String(val).replace(/^\s+/, '').replace(/\s+$/, '')) {
//     alert('请输入点文字！');
//   }
//   new AV.File('message.txt', {
//     base64: b64EncodeUnicode(val),
//   }).save().then(function(file) {
//     return room.send(new AV.FileMessage(file));
//   }).then(function(message) {
//     // 发送成功之后的回调
//     inputSend.value = '';
//     showLog('（' + formatTime(message.timestamp) + '）  自己： ', createLink(message.getFile().url()));
//     printWall.scrollTop = printWall.scrollHeight;
//   }).catch(console.warn);

// }

function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
}


// 显示接收到的信息
function showMsg(message, isBefore) {
    var text = message.text;
    var from = message.from;
    if (message.from === clientId) {
        from = '自己';
    }
    if (message instanceof AV.TextMessage) {
        if (String(text).replace(/^\s+/, '').replace(/\s+$/, '')) {
            showLog(encodeHTML(from) + '： ', encodeHTML(message.text),formatTime(message.timestamp), isBefore);
        }
        } else if (message instanceof AV.FileMessage) {
            showLog(encodeHTML(from) + '： ', createLink(message.getFile().url()),formatTime(message.timestamp), isBefore);
    }
}



// 获取消息历史
function getLog(callback) {
  var height = printWall.scrollHeight;
  if (logFlag) {
        return;
  } else {
        // 标记正在拉取
        logFlag = true;
  }
  messageIterator.next().then(function(result) {
    var data = result.value;
    logFlag = false;
    // 存储下最早一条的消息时间戳
    var l = data.length;
    if (l) {
        msgTime = data[0].timestamp;
    }
    for (var i = l - 1; i >= 0; i--) {
        showMsg(data[i], true);
    }
    if (l) {
        printWall.scrollTop = printWall.scrollHeight - height;
    }
    if (callback) {
        callback();
    }
  })
  // .catch(function(err) {
  //   console.error(err);
  // });
}

// demo 中输出代码
function showLog(msg, data,timestamp,isBefore) {
    if (data) {
        console.log(msg, data);
        msg = '<p class="msgText">' +msg +  data + '</p>';
        
    }
    time = '<p class="time">' + timestamp + '</p>';

    if (isBefore) {
        if(timestamp){
            printWall.insertBefore(time, printWall.childNodes[0]);
        }
        printWall.insertBefore(p, printWall.childNodes[0]);
        
    } else {
        if(timestamp){
            printWall.append(time);
        }
        printWall.append(msg);
    }
}

function encodeHTML(source) {
    return String(source)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\\/g,'&#92;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function formatTime(time) {
    var date = new Date(time);
    var month = date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
    var currentDate = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
    var hh = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
    var mm = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
    var ss = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
    return hh + ':' + mm + ':' + ss;
}

function createLink(url) {
    return '<a target="_blank" href="' + encodeHTML(url) + '">' + encodeHTML(url) + '</a>';
}
