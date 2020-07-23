// Enable chromereload by uncommenting this line:
// import 'chromereload/devonly'

chrome.runtime.onInstalled.addListener((details) => {
  console.log('previousVersion', details.previousVersion);
});

function sendMessageToContentScript(message, callback) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
  {
    chrome.tabs.sendMessage(tabs[0].id, message, function(response)
    {
      if(callback) callback(response);
    });
  });
}

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
  // console.log(request, sender, sendResponse);
  var _this = this;
  switch(request.cmd) {
    case 'openCamera':
      sendMessageToContentScript({cmd:'openCamera'});
      // 由于content-script 无法访问chrome.tabs，所以只能在background中执行注入
      chrome.tabs.executeScript({file: 'scripts/jquery.min.js'});
      chrome.tabs.executeScript({file: 'scripts/app.js'});
      chrome.tabs.executeScript({file: 'scripts/sample.js'});
      break;
    case 'closeCamera':
      sendMessageToContentScript({cmd:'closeCamera'});
      break;
    case 'created':
      chrome.tabs.insertCSS({file: 'styles/contentscript.css'});
      chrome.tabs.executeScript({file: 'scripts/contentscript.js'});
      break;
    case 'motionDetect':
      console.log(request.value);
      _this.port.postMessage({value: request.value});
      break;
    case 'confidence':
      sendMessageToContentScript({cmd:'confidence', value: request.value});
  }
  return true;

});

chrome.runtime.onConnect.addListener(function (port) {
  var _this = this;
  if (port.name == "devtools-page") {
    _this.port = port;
    port.onDisconnect.addListener(function(port) {
      console.log('disconnect');
      sendMessageToContentScript({cmd:'disconnect'});
    });

  }
});
