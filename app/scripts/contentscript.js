// Enable chromereload by uncommenting this line:
// import 'chromereload/devonly'

console.log(`Motion-NBA is ready`);


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
  console.log('收到来自background的消息：');
  console.log(request, sender, sendResponse);
  if(request && request.cmd === 'openCamera') {
    createCameraDom();
  }
  if(request && request.cmd === 'closeCamera') {
    removeCameraDom();
    console.log('close camera');
    chrome.storage.sync.remove(['confidence']);
  }
  if(request && request.cmd === 'disconnect') {
    removeCameraDom();
    $(window).off('motion');
    chrome.storage.sync.remove(['confidence']);
  }
  if(request && request.cmd === 'confidence') {
    chrome.storage.sync.set({confidence: request.value});
  }
  return true;

});

function removeCameraDom() {
  var oldContent = document.getElementById('motion-nba-content');
  if (oldContent != null) oldContent.parentNode.removeChild(oldContent);
}

function createCameraDom() {
  removeCameraDom();

  var parent = document.createElement('div');
  parent.setAttribute('id', 'motion-nba-content');

  var video = document.createElement('video');
  video.setAttribute('style','display:none');
  video.setAttribute('id','webcam');
  video.setAttribute('autoplay', 'autoplay');
  video.setAttribute('width', '640');
  video.setAttribute('height', '480');

  var canvas1 = document.createElement('canvas');
  canvas1.setAttribute('id', 'canvas-source');
  canvas1.setAttribute('width', '640');
  canvas1.setAttribute('height', '480');

  var canvas2 = document.createElement('canvas');
  canvas2.setAttribute('id', 'canvas-highlights');
  canvas2.setAttribute('width', '640');
  canvas2.setAttribute('height', '480');

  var canvas3 = document.createElement('canvas');
  canvas3.setAttribute('id', 'canvas-blended');
  canvas3.setAttribute('width', '640');
  canvas3.setAttribute('height', '480');

  var hotSpotsFrame = document.createElement('div');
  hotSpotsFrame.setAttribute('id', 'hotSpots');

  var hotSpot1 = document.createElement('div');
  hotSpot1.setAttribute('id', 'left');

  var hotSpot2 = document.createElement('div');
  hotSpot2.setAttribute('id', 'top');

  var hotSpot3 = document.createElement('div');
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
}
