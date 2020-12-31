// Enable chromereload by uncommenting this line:
// import 'chromereload/devonly'

class Background {
  constructor() {
    this.ports = []
  }

  init() {
    this.bindEvent();
  }

  handleMessage(request, sender, sendRespons) {
    let msgData = request.msgData;
    console.log(msgData);
  }

  bindEvent() {
    chrome.runtime.onMessage.addListener(this.handleMessage);
  }
}

new Background().init();
