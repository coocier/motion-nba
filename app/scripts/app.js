export function startCameraDetect() {

  require('./jquery.min.js');
  // config start
  var OUTLINES = false;
  // config end

  window.hotSpots = [];

  var content = $('#motion-nba-content');
  var video = $('#webcam')[0];
  var canvases = $('canvas');

  var resize = function () {
    var ratio = video.width / video.height;
    var w = $(this).width();
    var h = $(this).height() - 110;

    if (content.width() > w) {
      content.width(w);
      content.height(w / ratio);
    } else {
      content.height(h);
      content.width(h * ratio);
    }
    canvases.width(content.width());
    canvases.height(content.height());
    content.css('left', (w - content.width()) / 2);
    content.css('top', ((h - content.height()) / 2) + 55);
  };
  $(window).resize(resize);
  $(window).ready(function () {
    resize();
  });

  var webcamError = function (e) {
    alert('请确保开启摄像头权限！', e);
  };

  // 老的浏览器可能根本没有实现 mediaDevices，所以我们可以先设置一个空的对象
  if (navigator.mediaDevices === undefined) {
    navigator.mediaDevices = {};
  }

  // 一些浏览器部分支持 mediaDevices。我们不能直接给对象设置 getUserMedia
  // 因为这样可能会覆盖已有的属性。这里我们只会在没有getUserMedia属性的时候添加它。
  if (navigator.mediaDevices.getUserMedia === undefined) {
    navigator.mediaDevices.getUserMedia = function(constraints) {

      // 首先，如果有getUserMedia的话，就获得它
      var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      // 一些浏览器根本没实现它 - 那么就返回一个error到promise的reject来保持一个统一的接口
      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
      }

      // 否则，为老的navigator.getUserMedia方法包裹一个Promise
      return new Promise(function(resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    }
  }

  navigator.mediaDevices.getUserMedia({audio: false, video: true}).then(function (stream) {
    // 旧的浏览器可能没有srcObject
    if ("srcObject" in video) {
      video.srcObject = stream;
    } else {
      // 防止在新的浏览器里使用它，应为它已经不再支持了
      video.src = window.URL.createObjectURL(stream);
    }
    start();
  }).catch(webcamError);

  var lastImageData;
  var canvasSource = $("#canvas-source")[0];
  var canvasBlended = $("#canvas-blended")[0];

  var contextSource = canvasSource.getContext('2d');
  var contextBlended = canvasBlended.getContext('2d');

  // mirror video
  contextSource.translate(canvasSource.width, 0);
  contextSource.scale(-1, 1);

  function start() {
    $('#hotSpots').fadeIn();
    $(canvasSource).delay(600).fadeIn();
    $(canvasBlended).delay(600).fadeIn();
    $('#canvas-highlights').delay(600).fadeIn();
    $(window).trigger('start');
    update();
  }

  window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function (callback) {
        window.setTimeout(callback, 1000 / 60);
      };
  })();

  function update() {
    drawVideo();
    blend();
    checkAreas();
    requestAnimFrame(update);
  }

  function drawVideo() {
    contextSource.drawImage(video, 0, 0, video.width, video.height);
  }

  function blend() {
    var width = canvasSource.width;
    var height = canvasSource.height;
    // get webcam image data
    var sourceData = contextSource.getImageData(0, 0, width, height);
    // create an image if the previous image doesn’t exist
    if (!lastImageData) lastImageData = contextSource.getImageData(0, 0, width, height);
    // create a ImageData instance to receive the blended result
    var blendedData = contextSource.createImageData(width, height);
    // blend the 2 images
    differenceAccuracy(blendedData.data, sourceData.data, lastImageData.data);
    // draw the result in a canvas
    contextBlended.putImageData(blendedData, 0, 0);
    // store the current webcam image
    lastImageData = sourceData;
  }

  function fastAbs(value) {
    // funky bitwise, equal Math.abs
    return (value ^ (value >> 31)) - (value >> 31);
  }

  function threshold(value) {
    return (value > 0x15) ? 0xFF : 0;
  }

  function differenceAccuracy(target, data1, data2) {
    if (data1.length != data2.length) return null;
    var i = 0;
    while (i < (data1.length * 0.25)) {
      var average1 = (data1[4 * i] + data1[4 * i + 1] + data1[4 * i + 2]) / 3;
      var average2 = (data2[4 * i] + data2[4 * i + 1] + data2[4 * i + 2]) / 3;
      var diff = threshold(fastAbs(average1 - average2));
      target[4 * i] = diff;
      target[4 * i + 1] = diff;
      target[4 * i + 2] = diff;
      target[4 * i + 3] = 0xFF;
      ++i;
    }
  }

  function checkAreas() {
    var data;
    for (var h = 0; h < hotSpots.length; h++) {
      var blendedData = contextBlended.getImageData(hotSpots[h].x, hotSpots[h].y, hotSpots[h].width, hotSpots[h].height);
      var i = 0;
      var average = 0;
      while (i < (blendedData.data.length * 0.25)) {
        // make an average between the color channel
        average += (blendedData.data[i * 4] + blendedData.data[i * 4 + 1] + blendedData.data[i * 4 + 2]) / 3;
        ++i;
      }
      // calculate an average between the color values of the spot area
      average = Math.round(average / (blendedData.data.length * 0.25));
      if (average > 10) {
        // over a small limit, consider that a movement is detected
        data = {confidence: average, spot: hotSpots[h]};
        $(data.spot.el).trigger('motion', data);
      }
    }
  }

  function getCoords() {
    $('#hotSpots').children().each(function (i, el) {
      var ratio = $("#canvas-highlights").width() / $('video').width();
      hotSpots[i] = {
        x: this.offsetLeft / ratio,
        y: this.offsetTop / ratio,
        width: this.scrollWidth / ratio,
        height: this.scrollHeight / ratio,
        el: el
      };
    });
    if (OUTLINES) highlightHotSpots();
  }

  $(window).on('start resize', getCoords);

  function highlightHotSpots() {
    var canvas = $("#canvas-highlights")[0];
    var ctx = canvas.getContext('2d');
    canvas.width = canvas.width;
    hotSpots.forEach(function (o, i) {
      ctx.strokeStyle = 'rgba(0,255,0,0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(o.x, o.y, o.width, o.height);
    });
  }

  (function () {
    // consider using a debounce utility if you get too many consecutive events
    $(window).off('motion').on('motion', function (ev, data) {
      chrome.storage.sync.get({confidence: 1},function (items) {
        if(data.confidence < 255 && data.confidence >= Math.floor(items.confidence)) {
          console.log('detected motion at', new Date(), 'with data:', data);
          chrome.runtime.sendMessage({cmd: 'motionDetect', value: data});
        }
      });

      var spot = $(data.spot.el);
      spot.addClass('active');
      setTimeout(function () {
        spot.removeClass('active');
      }, 230);
    });
  })();


};

export function closeCamera() {
  var video = $('#webcam')[0];
  var stream = video.srcObject;
  video.pause();
  if ("srcObject" in video) {
    video.src = '';
  } else {
    video.srcObject = '';
  }
  stream.getTracks().forEach(function (track) {
    track.stop();
  });
}
