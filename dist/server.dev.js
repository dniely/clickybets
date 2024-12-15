"use strict";

var express = require('express');

var http = require('http');

var socketIo = require('socket.io');

var fs = require('fs');

var path = require('path');

var app = express();
var server = http.createServer(app);
var io = socketIo(server); // 데이터 파일 경로

var DATA_FILE_PATH = path.join(__dirname, 'clickData.json'); // 데이터 로드 함수

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      var rawData = fs.readFileSync(DATA_FILE_PATH, 'utf8');
      return JSON.parse(rawData);
    }

    return {
      globalScore: 0,
      lastUpdated: Date.now(),
      dailyStats: {}
    };
  } catch (error) {
    console.error('Error loading data:', error);
    return {
      globalScore: 0,
      lastUpdated: Date.now(),
      dailyStats: {}
    };
  }
} // 데이터 저장 함수


function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
} // 초기 데이터 로드


var gameData = loadData(); // 정적 파일 제공 미들웨어 설정

app.use(express["static"](path.join(__dirname, 'public'))); // 메인 라우트 설정

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
io.on('connection', function (socket) {
  // 연결 시 최신 데이터 전송
  socket.emit('initialData', {
    globalScore: gameData.globalScore,
    lastUpdated: gameData.lastUpdated
  }); // 클릭 이벤트 처리

  socket.on('click', function () {
    // 글로벌 스코어 증가
    gameData.globalScore++; // 현재 날짜 기준 일일 통계 업데이트

    var today = new Date().toISOString().split('T')[0];

    if (!gameData.dailyStats[today]) {
      gameData.dailyStats[today] = 1;
    } else {
      gameData.dailyStats[today]++;
    } // 마지막 업데이트 시간 갱신


    gameData.lastUpdated = Date.now(); // 데이터 저장

    saveData(gameData); // 모든 클라이언트에게 업데이트 브로드캐스트

    io.emit('scoreUpdate', {
      globalScore: gameData.globalScore,
      lastUpdated: gameData.lastUpdated
    });
  }); // 일일 통계 요청 핸들러

  socket.on('requestDailyStats', function () {
    socket.emit('dailyStatsResponse', gameData.dailyStats);
  });
}); // 주기적인 데이터 백업 (옵션)

setInterval(function () {
  saveData(gameData);
}, 60000); // 1분마다 저장

var PORT = process.env.PORT || 3000;
server.listen(PORT, function () {
  console.log("Server running on port ".concat(PORT));
});
//# sourceMappingURL=server.dev.js.map
