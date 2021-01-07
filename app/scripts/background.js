// Enable chromereload by uncommenting this line:
// import 'chromereload/devonly'
const ports = {}
class Background {
  constructor() {

  }

  init() {
    this.bindEvent();
  }

  handleMessage({ cmd, value }, port) {
    if(cmd && typeof cmd === 'string') {
      switch (cmd) {
        case 'panel-created':
          browser.tabs.insertCSS({ file: 'styles/content.css' })
          browser.tabs.executeScript({file: 'scripts/content.js'});
          break;
        case 'panel-close':
          ports['panel'].postMessage({ cmd });
          break;
        case 'panel-open':

          break;
        case 'open-camera':
          ports['content'].postMessage({ cmd });
          break;
        case 'close-camera':
          ports['content'].postMessage({ cmd });
          break;
        case 'set-confidence':
          ports['content'].postMessage({cmd, value})
        default: return
      }
    }
  }

  bindEvent() {

    chrome.runtime.onConnect.addListener( port =>  {
      console.log(port.name + 'is connected');
      ports[port.name] = port;
      if(!port.onMessage.hasListener(this.handleMessage)) {
        port.onMessage.addListener(this.handleMessage);
      }

    });
  }
}

new Background().init();
