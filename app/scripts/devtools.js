class devtools {
  constructor () {
  }

  init () {
    this.createPanel();
  }

  sendMessageToBack (msgData) {
    if(!this.port) this.initBridge();
    this.port.postMessage(msgData)
  }

  createPanel() {
    const handleShown = () => {
      this.sendMessageToBack({ cmd: 'panel-open' })
      console.log("panel is being shown");
    }

    const handleHidden = () => {
      this.sendMessageToBack({ cmd: 'panel-close' })
      console.log("panel is being hidden");
    }

    chrome.devtools.panels.create(
      'Motion NBA',                 // title
      '',           // icon
      '/pages/panel.html', // content
      newPanel => {
        this.initBridge();
        this.sendMessageToBack({ cmd: 'panel-created' })
        newPanel.onShown.addListener(handleShown);
        newPanel.onHidden.addListener(handleHidden);
      }
    )
  }

  handleMessage({cmd, value}, port) {
    if(cmd && typeof cmd === 'string') {
      switch (cmd) {


      }
    }
  }

  initBridge() {
    this.port = chrome.runtime.connect({
      name: 'devtools',
    });

    if(!this.port.onMessage.hasListener(this.handleMessage)) {
      this.port.onMessage.addListener(this.handleMessage);
    }
  }
}

new devtools().init()
