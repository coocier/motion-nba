// Enable chromereload by uncommenting this line:
// import 'chromereload/devonly'

class Background_back {
  constructor() {
    this.ports = []
  }
  sendMessageToContentScript(message, callback) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, message, function (response) {
        if (callback) callback(response);
      });
    });
  }

  notifyMessage(name, msg) {
    if (this.ports.length === 0) return;
    this.ports.forEach((port) => {
      if (port.name === name) port.postMessage(msg)
    })
  }

  init() {
    this.bindEvent();
  }

  bindEvent() {
    chrome.runtime.onInstalled.addListener((details) => {
      console.log('previousVersion', details.previousVersion);
      // const eventHandler1 = (request, sender, sendResponse) => {
      //   switch(request.cmd) {
      //     case 'openCamera':
      //       // 由于content-script 无法访问chrome.tabs，所以只能在background中执行注入
      //       chrome.tabs.executeScript({file: 'scripts/jquery.min.js'});
      //       chrome.tabs.executeScript({file: 'scripts/app.js'});
      //       chrome.tabs.executeScript({file: 'scripts/sample.js'});
      //       break;
      //     case 'closeCamera':
      //       sendMessageToContentScript({cmd:'closeCamera'});
      //       break;
      //     case 'created':
      //       chrome.tabs.insertCSS({file: 'styles/contentscript.css'});
      //       chrome.tabs.executeScript({file: 'scripts/contentscript.js'});
      //       break;
      //     case 'motionDetect':
      //       console.log(request.value);
      //       this.port.postMessage({value: request.value});
      //       break;
      //     case 'confidence':
      //       sendMessageToContentScript({cmd:'confidence', value: request.value});
      //   }
      //   return true;
      // };
      // chrome.extension.onMessage.addListener(eventHandler1);
    });

    chrome.runtime.onConnect.addListener((port) => {
      this.ports.push(port);
      if (port.name === "devtools") {
        port.onDisconnect.addListener((port) => {
          this.sendMessageToContentScript({cmd: 'disconnect'});
        });
        port.onMessage.addListener(({cmd, value}) => {
          switch (cmd) {
            case 'opened':
              console.log('in opened')
              chrome.tabs.insertCSS(null,{file: 'styles/content.css'});
              chrome.tabs.executeScript(null,{file: 'scripts/content.js'});
              break;
            case 'setConfidence':
              this.notifyMessage('contentscript', {cmd, value});
              break;
            case 'openCamera':
              this.notifyMessage('contentscript', {cmd});
              // chrome.tabs.executeScript({file: 'scripts/app.js'});
              break;
            case 'closeCamera':
              this.notifyMessage('contentscript', {cmd});
              break;
          }
          return true;
        })
      }
      if (port.name === "contentscript") {
        port.onDisconnect.addListener((port) => {
          this.sendMessageToContentScript({cmd: 'disconnect'});
        });
        port.onMessage.addListener((msg) => {
          console.log(msg);
          return true;
        })
      }
    });

  }
}

new Background_back().init();
