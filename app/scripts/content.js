// Enable chromereload by uncommenting this line:
// import 'chromereload/devonly'

import {closeCamera, startCameraDetect} from './app';

const removeCameraDom = () => {
  let oldContent = document.getElementById('motion-nba-content');
  if (oldContent != null) oldContent.parentNode.removeChild(oldContent);
};

const createCameraDom = () => {
  removeCameraDom();

  let parent = document.createElement('div');
  parent.setAttribute('id', 'motion-nba-content');

  let video = document.createElement('video');
  video.setAttribute('style','display:none');
  video.setAttribute('id','webcam');
  video.setAttribute('autoplay', 'autoplay');
  video.setAttribute('width', '640');
  video.setAttribute('height', '480');

  let canvas1 = document.createElement('canvas');
  canvas1.setAttribute('id', 'canvas-source');
  canvas1.setAttribute('width', '640');
  canvas1.setAttribute('height', '480');

  let canvas2 = document.createElement('canvas');
  canvas2.setAttribute('id', 'canvas-highlights');
  canvas2.setAttribute('width', '640');
  canvas2.setAttribute('height', '480');

  let canvas3 = document.createElement('canvas');
  canvas3.setAttribute('id', 'canvas-blended');
  canvas3.setAttribute('width', '640');
  canvas3.setAttribute('height', '480');

  let hotSpotsFrame = document.createElement('div');
  hotSpotsFrame.setAttribute('id', 'hotSpots');

  let hotSpot1 = document.createElement('div');
  hotSpot1.setAttribute('id', 'left');

  let hotSpot2 = document.createElement('div');
  hotSpot2.setAttribute('id', 'top');

  let hotSpot3 = document.createElement('div');
  hotSpot3.setAttribute('id', 'right');

  hotSpotsFrame.appendChild(hotSpot1);
  hotSpotsFrame.appendChild(hotSpot2);
  hotSpotsFrame.appendChild(hotSpot3);

  parent.appendChild(video);
  parent.appendChild(canvas1);
  parent.appendChild(canvas2);
  parent.appendChild(canvas3);
  parent.appendChild(hotSpotsFrame);

  document.body.appendChild(parent);
};

const messageConnect = () => {
  let port = chrome.runtime.connect({
    name: "contentscript"
  });

  port.onMessage.addListener(({cmd, value}) => {
    switch (cmd) {
      case 'setConfidence':
        chrome.storage.local.set({confidence: value});
        break;
      case 'openCamera':
        startCameraDetect();
        break;
      case 'closeCamera':
        closeCamera();
        break;
    }
    return true;
  });
};

createCameraDom();
messageConnect();

console.log(`Motion-NBA is ready`);

// const eventHandler = (request, sender, sendResponse) => {
//   chrome.runtime.onMessage.removeListener(eventHandler);
//   console.log('收到来自background的消息：');
//   console.log(request, sender, sendResponse);
//   if(request && request.cmd === 'disconnect') {
//     removeCameraDom();
//     chrome.storage.local.remove(['confidence']);
//   }
//   if(request && request.cmd === 'confidence') {
//     chrome.storage.local.set({confidence: request.value});
//   }
//   return true;
// };
//
// chrome.runtime.onMessage.addListener(eventHandler);


