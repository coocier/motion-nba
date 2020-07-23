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

  // examples for id usage
  $('#left').on('motion', function (data) {
    console.log('touched left');
  });

  $('#top').on('motion', function () {
    console.log('touched top');
  });

  $('#right').on('motion', function () {
    console.log('touched right');
  });
})();
