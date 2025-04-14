const scheduleCanvas = document.getElementById('scheduleCanvas');
const scheduleCtx = scheduleCanvas.getContext('2d');
const overlayCanvas = document.getElementById('overlayCanvas');
const overlayCtx = overlayCanvas.getContext('2d');
const bgImage = new Image();
bgImage.src = './img/schedule_bg.png';
const overlayImage = new Image();
overlayImage.src = './img/overlay.png';

const options = ['ゲーム', '動画', '歌枠', 'ライブ', 'その他', 'おやすみ'];
const icons = {
  'ゲーム': './img/game.png',
  '動画': './img/video.png',
  '歌枠': './img/song.png',
  'ライブ': './img/live.png',
  'その他': './img/other.png',
  'おやすみ': './img/offline.png'
};

let baseDate = getBaseMonday();
let schedules = Array(7).fill({ type: '', text: '', time: '', memo: '' });
let remarks = '';

function getBaseMonday() {
  const today = new Date();
  const day = today.getDay();
  const diff = (day <= 4) ? -day + 1 : 8 - day;
  return new Date(today.setDate(today.getDate() + diff));
}

function getBaseMonday(date = new Date()) {
  const day = date.getDay();
  let diff;
  if (day === 0 || day >= 4) {
    // 日曜（0）または木～土（4～6）：翌週の月曜
    diff = day === 0 ? 1 : 8 - day;
  } else {
    // 月～水（1～3）：当週の月曜
    diff = -day + 1;
  }
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  monday.setHours(0, 0, 0, 0); // ローカルタイムゾーンでリセット
  return monday;
}

function formatDateForInput(date) {
  // ローカル日付を YYYY-MM-DD 形式でフォーマット
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createScheduleControls() {
  const container = document.getElementById('schedules');
  container.innerHTML = '';
  const days = ['月', '火', '水', '木', '金', '土', '日'];

  for (let i = 0; i < 7; i++) {
    const div = document.createElement('div');
    div.className = 'day-schedule';
    div.innerHTML = `
          <label>${days[i]}曜日:</label>
          <select onchange="updateSchedule(${i}, 'type', this.value)">
            <option value="">選択</option>
            ${options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
          </select>
          <input type="text" class="text" placeholder="予定" 
            oninput="updateSchedule(${i}, 'text', this.value)">
          <input type="text" class="time" placeholder="時間" 
            oninput="updateSchedule(${i}, 'time', this.value)">
          <input type="text" class="memo" placeholder="メモ" 
            oninput="updateSchedule(${i}, 'memo', this.value)">
        `;
    container.appendChild(div);
  }
}

function updateSchedule(index, field, value) {
  schedules[index] = { ...schedules[index], [field]: value };
  drawCanvas();
}

// 備考入力のイベントリスナー
document.getElementById('remarksInput').addEventListener('input', (e) => {
  remarks = e.target.value;
  drawCanvas();
});

function wrapText(ctx, text, maxWidth) {
  let lines = [];
  let currentLine = '';
  let currentWidth = 0;

  for (let char of text) {
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (char === '\n' || testWidth > maxWidth) {
      if (char === '\n') {
        lines.push(currentLine);
        currentLine = '';
        currentWidth = 0;
      } else {
        lines.push(currentLine);
        currentLine = char;
        currentWidth = ctx.measureText(char).width;
      }
    } else {
      currentLine = testLine;
      currentWidth = testWidth;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function drawCanvas() {
  // scheduleCanvasに描画
  scheduleCtx.clearRect(0, 0, 1280, 1280);
  scheduleCtx.drawImage(bgImage, 0, 0, 1280, 1280);
  scheduleCtx.font = '56px "Teko"';
  scheduleCtx.fillStyle = '#44383c';
  scheduleCtx.textAlign = 'center';

  let startDate = new Date(baseDate);
  let endDate = new Date(baseDate);
  endDate.setDate(endDate.getDate() + 6);
  const rangeText = `${(startDate.getMonth() + 1).toString().padStart(2, '0')}.${startDate.getDate().toString().padStart(2, '0')}     ${(endDate.getMonth() + 1).toString().padStart(2, '0')}.${endDate.getDate().toString().padStart(2, '0')}`;
  scheduleCtx.fillText(rangeText, 415, 205);

  const schedulePositions = [
    { x: 190, iconY: 428, textY: 585, timeY: 540, memoY: 620 },
    { x: 490, iconY: 428, textY: 585, timeY: 540, memoY: 620 },
    { x: 790, iconY: 428, textY: 585, timeY: 540, memoY: 620 },
    { x: 1090, iconY: 428, textY: 585, timeY: 540, memoY: 620 },
    { x: 340, iconY: 850, textY: 1005, timeY: 960, memoY: 1040 },
    { x: 640, iconY: 850, textY: 1005, timeY: 960, memoY: 1040 },
    { x: 940, iconY: 850, textY: 1005, timeY: 960, memoY: 1040 }
  ];

  schedules.forEach((schedule, i) => {
    const pos = schedulePositions[i];
    if (schedule.type) {
      const icon = new Image();
      icon.src = icons[schedule.type];
      icon.onload = () => {
        if (schedule.type === 'おやすみ') {
          scheduleCtx.drawImage(icon, pos.x - 142, pos.iconY - 188, 284, 404);
        } else {
          scheduleCtx.drawImage(icon, pos.x - 110, pos.iconY - 90, 220, 180);
        }
      };
    }
    if (schedule.text) {
      scheduleCtx.font = '700 32px "LINESeedJPStd"';
      scheduleCtx.fillText(schedule.text, pos.x, pos.textY, 270);
    }
    if (schedule.time) {
      scheduleCtx.font = '700 24px "LINESeedJPStd"';
      scheduleCtx.fillText(schedule.time, pos.x, pos.timeY);
    }
    if (schedule.memo) {
      scheduleCtx.font = '700 20px "LINESeedJPStd"';
      scheduleCtx.fillText(schedule.memo, pos.x, pos.memoY, 270);
    }
  });

  // 備考を描画（幅ベースの改行）
  if (remarks) {
    scheduleCtx.font = '700 24px "LINESeedJPStd"';
    scheduleCtx.fillStyle = '#44383c';
    scheduleCtx.textAlign = 'start';
    const maxWidth = 400;
    const lines = wrapText(scheduleCtx, remarks, maxWidth);
    lines.forEach((line, index) => {
      scheduleCtx.fillText(line, 700, 1160 + index * 32);
    });
  }

  // overlayCanvasに描画
  overlayCtx.clearRect(0, 0, 1280, 1280);
  overlayCtx.drawImage(overlayImage, 0, 0, 1280, 1280);

  // 日付を最後に描画
  let currentDate = new Date(baseDate);
  const positions = [
    { x: 270, y: 295 },
    { x: 570, y: 295 },
    { x: 870, y: 295 },
    { x: 1170, y: 295 },
    { x: 420, y: 720 },
    { x: 720, y: 720 },
    { x: 1020, y: 720 }
  ];
  for (let i = 0; i < 7; i++) {
    const dayStr = currentDate.getDate().toString();
    overlayCtx.font = '700 48px "LINESeedJPStd"';
    overlayCtx.fillStyle = '#44383c';
    overlayCtx.textAlign = 'center';
    overlayCtx.fillText(dayStr, positions[i].x, positions[i].y);
    currentDate.setDate(currentDate.getDate() + 1);
  }
}

function downloadCanvas() {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 1280;
  tempCanvas.height = 1280;
  const tempCtx = tempCanvas.getContext('2d');

  tempCtx.drawImage(scheduleCanvas, 0, 0);
  tempCtx.drawImage(overlayCanvas, 0, 0);

  const link = document.createElement('a');
  link.download = 'schedule.png';
  link.href = tempCanvas.toDataURL('image/png');
  link.click();
}

async function initDrawing() {
  await document.fonts.ready;
  await Promise.all([
    new Promise(resolve => { if (bgImage.complete) resolve(); else bgImage.onload = resolve; }),
    new Promise(resolve => { if (overlayImage.complete) resolve(); else overlayImage.onload = resolve; })
  ]);
  drawCanvas();
}

// 初期化処理
initDrawing().then(() => {
  createScheduleControls();
  document.getElementById('baseDate').value = formatDateForInput(baseDate);
});

document.getElementById('baseDate').addEventListener('change', (e) => {
  const selectedDate = new Date(e.target.value);
  if (!isNaN(selectedDate)) {
    baseDate = getBaseMonday(selectedDate);
    document.getElementById('baseDate').value = formatDateForInput(baseDate);
    drawCanvas();
  }
});
