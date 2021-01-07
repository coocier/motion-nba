class Panel {
  constructor () {
    this.handleMessage = this.handleMessage.bind(this)
  }
  init () {
    this.destory();
    this.initBridge();
    this.utils();
    this.eventBind();
    this.getGameList();

  }

  destory () {
    clearInterval(this.recordsInterval);
  }

  sendMessageToBack (msgData) {
    if(!this.port) this.initBridge();
    this.port.postMessage(msgData)
  }

  handleMessage({cmd, value}, port) {
    if(cmd && typeof cmd === 'string') {
      switch (cmd) {
        case 'panel-close':
          this.destory();
          break;
        default: return
      }
    }
  }

  initBridge() {
    this.port = browser.runtime.connect({
      name: 'panel'
    });

    if(!this.port.onMessage.hasListener(this.handleMessage)) {
      this.port.onMessage.addListener(this.handleMessage);
    }
  }

  utils () {
    Date.prototype.Format = function (fmt) {
      let o = {
        'M+': this.getMonth() + 1,
        'd+': this.getDate(),
        'h+': this.getHours(),
        'm+': this.getMinutes(),
        's+': this.getSeconds(),
        'q+': Math.floor((this.getMonth() + 3) / 3),
        'S': this.getMilliseconds()
      }
      if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length))
      for (let k in o)
        if (new RegExp('(' + k + ')').test(fmt))
          fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)))
      return fmt
    }
  }

  eventBind () {
    // 是否开启摄像头监控
    $('#cameraDetect').off('change').on('change', (e) => {
      let slider = $('#slider');
      let sensorWrap = $('#sensor');
      if (e.target.checked) {
        let confidence = slider.val();
        this.sendMessageToBack({ cmd: 'set-confidence', value: confidence })
        this.sendMessageToBack({ cmd: 'open-camera' })
        sensorWrap.show()
      } else {
        this.sendMessageToBack({ cmd: 'close-camera' })
        sensorWrap.hide()
      }
    });

    // 摄像头监控敏感度调整
    $('#slider').off('change').on('change', (e) => {
      this.sendMessageToBack({ cmd: 'set-confidence', msg: e.target.value })
    })

    $('#reload').off('click').on('click', () => {
      this.getGameList()
    })

    $('#back').off('click').on('click', () => {
      $('.game-list-wrap .title').text(`今日比赛`)
      $('#reload').show()
      $('#back').hide()
      this.getGameList()
      clearInterval(this.recordsInterval)
    })

    $(document).off('click', '#gameListContent .list-group-item').on('click', '#gameListContent .list-group-item', (e) => {
      let gameId = $(e.currentTarget).attr('data-id')
      let gameOver = false
      $('#gameLiveContent').show()
      $('#gameListContent').hide()
      $('#textRecords .content').html(null)
      this.getGameInfo(gameId).then((data) => {
        let result = JSON.parse(data)
        $('.game-list-wrap .title').text(`${result.home_team}(主) VS ${result.visit_team}(客)`)
        $('#reload').hide()
        $('#back').show()
        $('#home .score').text(result.home_score)
        $('#visit .score').text(result.visit_score)
        $('#home .team').text(`(${result.home_team})`).attr('title', `${result.home_team}`)
        $('#visit .team').text(`(${result.visit_team})`).attr('title', `${result.visit_team}`)
        if (result.period_cn === '完赛') {
          $('#gameOver').show()
          gameOver = true
        } else {
          $('#gameOver').hide()
        }
      })

      clearInterval(this.recordsInterval)
      let currentMaxSid = null
      this.recordsInterval = setInterval(() => {
        $('#textRecords .content').html(null)
        this.getMaxsid(gameId).then((maxSid) => {
          if (currentMaxSid === maxSid) return
          currentMaxSid = maxSid
          this.getLiveRecord(gameId, maxSid).then(data => {
            // data = [{
            //   guess_data: ""
            //   guess_id: "0"
            //   guess_text: ""
            //   home_score: "51"
            //   img_mode: "0"
            //   img_url: ""
            //   live_id: "23810029"
            //   live_pid: "3"
            //   live_ptime: ""
            //   live_sid: 946
            //   live_text: "给弧顶吴前！！"
            //   live_time: "2020-07-22 17:23:05"
            //   match_id: "125774"
            //   period_score: "17|20|14|0|0|0|0|0#30|25|14|0|0|0|0|0"
            //   pid_text: "第3节"
            //   room_id: "517972"
            //   saishi_id: "515467"
            //   score_status: "0"
            //   sn_team_name: ""
            //   text_color: ""
            //   text_url: ""
            //   user_chn: "小路"
            //   user_id: "66"
            //   visit_score: "69"
            // }]
            // guess_data: ""
            // guess_id: "0"
            // guess_text: ""
            // home_score: "104"
            // img_mode: "0"
            // img_url: ""
            // live_id: "23830669"
            // live_pid: "-1"
            // live_ptime: ""
            // live_sid: "1366"
            // live_text: "热火104-98击败国王！！！"
            // live_time: "2020-07-23 10:09:48"
            // match_id: "125936"
            // period_score: "27|29|17|31|0|0|0|0#21|23|27|27|0|0|0|0"
            // pid_text: "比赛结束"
            // room_id: "518084"
            // saishi_id: "517493"
            // score_status: "0"
            // sn_team_name: ""
            // text_bold: false
            // text_color: "#ff3c30"
            // text_url: ""
            // user_chn: "戴普"
            // user_id: "10"
            // visit_score: "98"

            let result = JSON.parse(data)

            result.map((item) => {
              $('#textRecords .content').append($(`
              <div style="color: ${item.text_color}">【${item.live_time.substring(11)}】 ${item.live_text}</div>
              `))
              $('#home .score').text(item.home_score)
              $('#visit .score').text(item.visit_score)
              if (item.pid_text === '比赛结束' || item.live_pid === '-1') {
                clearInterval(this.recordsInterval)
                $('#gameOver').show()
              }
            })

          })
        })
        if (gameOver) {
          clearInterval(this.recordsInterval)
          $('#textRecords .loading').hide()
        }
      }, 2000)
    })
  }

  getGameList () {
    $('#gameLiveContent').hide()
    $('#gameListContent').show()
    $.ajax({
      type: 'GET',
      url: 'http://bifen4m.qiumibao.com/json/list.htm',
      //请求成功
      beforeSend: () => {
        $('#gameListContent .loading').show()
        $('#gameList').hide()
      },
      success: function (data) {
        let result = JSON.parse(data)
        console.log(result)
        $('#gameListContent .loading').hide()
        $('#gameList').show()
        if (result && result.list && typeof result.list === 'object') {
          let basketballGames = result.list.filter((item) => item.type === 'basketball')
          if (basketballGames.length === 0) {
            $('#gameList').html(`<div class="d-flex justify-content-center text-secondary">当前没有相关赛事</div>`)
          } else {
            $('#gameList').html(null)
            basketballGames.map((item, index) => {
              let status = `<div class="status"><svg t="1595481324627" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3835" width="200" height="200"><path d="M1023.384 442.343l-0.2 581.041L0 0.201 581.042 0l442.342 442.342v0.001zM499.345 69.624l-20.98-0.488c2.277 21.143 2.603 38.707 0.814 53.182h22.118c0.976-15.938 0.325-33.503-1.952-52.694z m-52.934 238.974l37.244 37.243 19.028-11.547c-4.717-4.066-11.385-10.083-19.679-18.052-8.457-8.132-16.751-16.101-24.558-23.908-12.523-12.522-23.094-23.419-32.039-32.69-9.107-9.757-14.637-18.214-17.076-25.207-1.952-6.18-2.603-13.336-1.79-21.306 0.163-1.789 0-3.252 0-4.553l61.64-61.639-36.431-36.43-14.312 14.312 21.956 21.956-46.026 46.025c-9.758-3.253-25.37-2.277-46.676 2.765l0.813 21.956c22.932-6.343 36.105-7.807 39.358-4.554 1.951 1.951 2.602 5.204 1.951 10.083-0.65 10.409 0.976 19.842 5.53 28.299 5.042 8.294 12.523 17.727 22.769 28.298 10.083 10.409 19.516 20.167 28.298 28.949z m67.175-179.86l-14.474 14.475 17.89 17.89-11.547 11.547c-6.018 6.017-12.035 11.384-18.215 16.263l-22.607-22.606-14.637 14.637 19.68 19.679c-16.59 9.433-32.69 12.848-48.303 10.246l-3.09 21.63c21.142 2.928 43.098-2.765 66.354-16.914l25.86 25.859-44.237 44.237 14.962 14.962 44.237-44.237 24.558 24.558 14.637-14.637-24.558-24.558 28.786-28.786 19.354 19.353 14.474-14.474-19.353-19.354 24.395-24.395-14.963-14.962-24.395 24.395-22.118-22.118 24.558-24.558-14.8-14.8-24.558 24.558-17.89-17.89z m17.883 47.963l22.118 22.119-28.786 28.786-23.257-23.257c7.156-5.855 14.475-12.197 21.956-19.679l7.97-7.969zM709.23 293.65l-15.125 15.125 79.365 79.365 15.125-15.125-79.365-79.365z m-45.255 36.77l-15.125 15.124 49.44 49.441-65.216 65.217c-3.415 3.415-7.644 2.764-12.36-1.952-6.83-6.83-13.824-14.474-20.655-22.606l-11.71 18.54 23.583 23.582c11.547 11.547 22.606 12.198 33.015 1.79l68.957-68.958 25.37 25.371 15.126-15.125-90.425-90.425z m24.904-72.677c-22.443 7.481-47.001 8.945-73.999 4.391l-10.733 20.167c35.129 6.505 65.704 5.204 92.376-3.904l-7.644-20.654z m-29.72 45.233c-26.346 8.783-55.458 10.246-87.009 4.717l-10.734 19.841c11.547 2.115 22.606 3.416 33.503 4.229L529.7 396.979l15.125 15.125 80.342-80.341c14.474-1.139 28.298-3.903 41.472-8.295l-7.482-20.492zM894.243 460.28l-28.136 28.136-57.735-57.735-78.552 78.552 15.45 15.45 9.27-9.27 42.285 42.286-54.482 54.482 15.938 15.938 54.482-54.482 42.448 42.447-9.27 9.27 15.45 15.45 78.553-78.552-57.898-57.898 28.135-28.135-15.938-15.939z m-124.345 39.987l39.033-39.032 42.285 42.285-39.033 39.032-42.285-42.285z m57.983 57.983l39.033-39.032 42.447 42.447-39.032 39.033-42.448-42.448z" fill="#4A90E2" p-id="3836"></path></svg></div>`
              if (new Date(item.start) > new Date()) status = `<div class="status"><svg t="1595481770491" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6003" width="200" height="200"><path d="M63.9 66l894.6 894.6V423.8L600.7 66H63.9z m0 0" fill="#FFA31A" p-id="6004"></path><path d="M544.5 111.7l16.3 16.3-21.8 21.8 56.7 56.7-15.7 15.6-56.7-56.7-26.2 26.2 65.7 65.7-15.6 15.6-52.3-52.3c-8.6 30.9-7.6 67.4 2.9 109.5l-25.9 3.2c-6.9-47.5-3.4-89.3 10.3-125.4l-0.7-0.7-75.9 75.8-16.3-16.3 75.8-75.8-0.7-0.7c-39.4 15.5-81.8 18.4-127.3 8.8l5.8-24.4c39.2 11.4 75.4 12.4 108.8 2.9l-52.3-52.3 15.6-15.6 65.7 65.7 26.2-26.2-55.5-55.5L467 78l55.5 55.5 22-21.8zM647 230.9l133.4 133.4-15.6 15.6-27.1-27.1-40.6 40.6 35.7 35.7-15.6 15.6-35.6-35.7-73.3 73.3-16.1-16.1 73.3-73.3-45.4-45.4c-18.8 15.5-36.3 26.2-52.3 32.3-20.7 7.8-42.4 8-65.2 0.5l4.9-22.2c21.6 5.5 40.9 4.7 58.1-2.5 11.7-5.4 24.4-13.6 38.1-24.5l-37.2-37.2 15.6-15.6 38.4 38.4 3.9-3.6 36.9-36.9-29.8-29.8 15.5-15.5z m30.5 61.6l-38.8 38.8-2 1.7 44.4 44.4 40.6-40.6-44.2-44.3zM848.5 415.1c-13.2 10.3-24.8 19.1-34.7 26.6l24 24-9 9c-28 26-55.9 45-83.6 57.2-0.3 15.9-1.2 29.1-2.7 39.6l-23.5 1.9c1.5-9.6 2.5-20.6 3.2-33-18.3 5.4-36.6 7.8-54.8 7.1l2.5-22.9c17.5 1 35.2-1.4 53.2-7.1 0.2-14.9 0.2-29.2-0.2-42.8 19.5-11.4 38.5-23.5 56.9-36.2L768 426.7l15.4-15.4 14.4 14.4c14.6-10.7 26.7-19.9 36.4-27.6l14.3 17z m27.2 190.8l-74.3 74.3-15.4-15.4 9.5-9.5-46.4-46.4-9.5 9.5-15.2-15.2 74.3-74.3 77 77z m-130.3-97.2c21.3-10.3 42-24.4 62.1-42.5l-11.7-11.7c-19.9 14-36.8 24.9-51 32.7l0.6 21.5z m18.8 85.1l46.4 46.4 35-35-46.4-46.4-35 35z m53.1-100.2c11.1 5.6 41.2-1.2 90.6-20.5l10.2 20.3c-29.9 10.9-55.6 18.2-77.2 21.7 17.3 15.2 34.7 29.3 52.3 42.2 3.5-9.8 7.2-21.8 11.2-35.9l20.3 7.1c-5.6 22.3-13.7 46.8-24 73.5l-21.8-7.6c2.7-6.1 5.1-11.9 7.1-17.3-25.2-19.1-52-41.2-80.6-66.4l11.9-17.1z" fill="#FFFFFF" p-id="6005"></path></svg></div>`
              if (item.period_cn === '完赛') status = `<div class="status"><svg t="1595481841195" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9549" width="200" height="200"><path d="M615.37031112 398.33599999l33.888-33.888 58.2624 58.26346667-33.888 33.888z" p-id="9550" fill="#FF666C"></path><path d="M1005.95484445 383.36319999L633.52711112 12.04053333H10.11271112l996.38933333 995.12746666-0.5472-623.8048z m-240.23466666-85.42933333l8.02453333 8.02453333-22.21973333 22.2208 41.54133333 41.54133334-7.2832 7.2832-41.54133333-41.54133334-26.4576 26.45546667 35.59786666 35.5968-7.35893333 7.35786667-78.92266667-78.92373334 7.35786667-7.35786666 35.30026667 35.30133333 26.4576-26.45546667-40.0576-40.0576 7.2832-7.2832 40.0576 40.0576 22.21973333-22.2208z m-57.2992-52.98773333c-24.7232 8.17493333-50.11413333 15.13386667-76.1728 20.8832a1012.37226667 1012.37226667 0 0 1 7.57973333 6.83733333c6.93546667 6.144 12.13546667 10.848 15.60533333 14.11946667 8.224-1.88373333 17.53813333-4.31146667 27.94133334-7.2832l3.9392 11.2224c-28.14186667 6.63893333-58.26346667 12.336-90.368 17.0912 9.31306667 7.136 21.87093333 16.5728 37.67893333 28.31573333-2.28266667 1.7824-5.104 4.21226667-8.47146667 7.2832-22.93866667-18.0832-38.72-29.89866667-47.33973333-35.4496l4.60693333-10.9984c3.6672 0.992 7.7536 1.264 12.2624 0.81706667 12.43413333-1.2384 28.36266667-3.9872 47.78346667-8.24853334-10.5024-10.10666667-19.56906667-18.18133333-27.19786667-24.22613333l4.82986667-9.73546667c3.51573333 0.544 7.43146667 0.39573333 11.74186667-0.44586666 22.34346667-4.90666667 45.82826667-11.94026667 70.45333333-21.10613334l5.12746667 10.92266667z m-187.49866667 69.33653333c-6.98453333-0.7424-14.68906667-5.376-23.11146667-13.89653333l-72.60693333-72.60693334c-17.7856-16.7968-18.28053333-33.04746667-1.48693333-48.752l73.34933333-73.34933333 8.39893333 8.39893333-23.70773333 23.70666667 94.0096 94.0096 44.73813333-44.73813333-105.9008-105.9008 7.72906667-7.72906667L636.63111112 187.72266666l-60.26986667 60.26986667-102.40746666-102.4064-40.50133334 40.5024c-6.688 6.5888-9.90933333 12.38506667-9.65973333 17.38986666 0.04906667 5.00266667 3.616 10.99733333 10.70186667 17.98506667L503.16124445 290.13333333a56.66133333 56.66133333 0 0 0 2.37866667 2.52586666c11.24586667 11.24693333 22.8864 12.38826667 34.92693333 3.41973334 5.39946667-3.4176 12.41066667-8.29866667 21.03146667-14.64 1.73333333 4.608 3.44426667 8.14933333 5.12853333 10.6272-8.62186667 6.5408-15.4336 11.32053333-20.43733333 14.3424-9.90826667 6.24-18.33066667 8.86613333-25.26613333 7.8752z m28.31573333 13.1552a3172.128 3172.128 0 0 0 57.5936 40.20266667 170.8192 170.8192 0 0 0-8.47146666 7.87733333 1508.64106667 1508.64106667 0 0 0-55.29173334-38.1984l6.1696-9.8816z m107.16266667 146.4l9.8848-9.88373333-58.26453333-58.26453334-9.8848 9.88373334-8.10026667-8.10026667 58.48533333-58.48533333 74.464 74.464-58.48533333 58.48533333-8.0992-8.0992z m287.52746667 48.23146667l-66.21546667-66.21546667-19.17333333 19.17333333 51.7984 51.7984-41.98933334 41.98933334-48.90026666-48.90133334c-2.27946667 34.9792 4.9536 70.55253333 21.70133333 106.71893334-4.85546667 0.69333333-9.28853333 1.6096-13.30133333 2.74986666-15.6096-39.4848-21.3568-74.96-17.24266667-106.42133333l-52.54186667 52.54293333-7.87733333-7.8784 52.096-52.096c-35.57333333 3.96373333-72.16-1.1648-109.76426667-15.38453333a114.0352 114.0352 0 0 0 2.08106667-13.37493333c35.32373333 15.1104 72.48 21.6992 111.47306667 19.76746666l-49.1968-49.1968 41.98933333-41.98826666 51.79946667 51.79946666 19.17333333-19.17333333-66.80853333-66.80853333 7.728-7.73013334 66.8096 66.8096 16.34986666-16.34986666 7.87733334 7.87733333-16.34986667 16.34986667 66.21546667 66.21546666-7.7312 7.72693334z" p-id="9551" fill="#FF666C"></path><path d="M772.25031112 457.86346666l27.12426667-27.12426667 43.84746666 43.84533334-27.12533333 27.12533333z m95.58933333 95.57546667l-43.84426666-43.84533334 27.12533333-27.12533333 43.84426667 43.84533333z" p-id="9552" fill="#FF666C"></path></svg></div>`

              $('#gameList').append($(`
                <a href="#" class="p-2 bg-light list-group-item list-group-item-action" data-id="${item.id}">
                  <div class="d-flex justify-content-between">
                    <div class="display-6 mb-1 text-truncate font-weight-bold" title="${item.home_team}(主 ${item.home_score}) VS ${item.visit_team}(客 ${item.visit_score})">${item.home_team}(主 ${item.home_score}) VS ${item.visit_team}(客 ${item.visit_score})</div>
                    <small>${status}</small>
                  </div>
                  <p class="mb-1">进行状态：${item.period_cn}</p>
                  <p class="mb-1">最后更新：${item.update}</p>
                </a>`))
            })
          }
        } else {
          $('#gameList').html(`<div class="d-flex justify-content-center text-secondary">请求内容出现错误</div>`)
        }

      },
      //请求失败，包含具体的错误信息
      error: function (e) {
        console.error(e)
        $('#gameListContent .loading').hide()
        $('#gameList').show().html(`<div class="d-flex justify-content-center text-secondary">请求发生错误，请检查网络</div>`)
      }
    })
  }

  getMaxsid (gameId) {
    return $.ajax({
      type: 'GET',
      url: 'http://dingshi4pc.qiumibao.com/livetext/data/cache/max_sid/' + gameId + '/0.htm',
      beforeSend: () => {
        $('#textRecords .loading').show()
      },
      success: () => {
        $('#textRecords .loading').hide()
      },
    })
  }

  getGameInfo (gameId) {
    let today = new Date()
    let today_format = today.Format('yyyy-MM-dd')
    return $.ajax({
      type: 'GET',
      url: 'http://bifen4pc2.qiumibao.com/json/' + today_format + '/' + gameId + '.htm'
    })
  }

  getLiveRecord (gameId, maxSid) {
    return $.ajax({
      type: 'GET',
      url: 'http://dingshi4pc.qiumibao.com/livetext/data/cache/livetext/' + gameId + '/0/lit_page_2/' + maxSid + '.htm',
      beforeSend: () => {
        $('#textRecords .loading').show()
      },
      success: () => {
        $('#textRecords .loading').hide()
      },
      error: function (e) {
        console.error(e)
        $('#textRecords .loading').hide()
        $('#textRecords .content').html(`<div class="d-flex justify-content-center text-secondary">当前请求暂未返回数据</div>`)
      }
    })
  }
}

new Panel().init()
