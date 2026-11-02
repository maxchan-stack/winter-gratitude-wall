/**
 * 冬日感恩與祝福留言牆 - Google 試算表後端 API
 * 專為班級教育場景設計：高並行安全鎖、即時讀寫、CORS 友善
 */

const SPREADSHEET_ID = '1D7VUoSJBYEX1tELiZnWAlB2ktJhBBk_YKk0xMp-rwb4';
const SHEET_NAME = '卡片列表';
const HEADERS = [
  '卡片ID',
  '收件對象',
  '祝福內容',
  '寄件人',
  '主題配色',
  '卡片造型',
  '代表圖示',
  '分類標籤',
  '建立時間戳記',
  '共鳴愛心數',
  '卡片狀態',
  '發布時間格式化'
];

/**
 * 取得或初始化試算表
 */
function getTargetSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  
  // 檢查是否需要寫入標題列
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setBackground('#1B3022');
    headerRange.setFontColor('#FAF7F2');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 36);
  }
  return sheet;
}

/**
 * 處理 GET 請求
 */
function doGet(e) {
  const params = (e && e.parameter) || {};
  const action = params.action || 'getNotes';

  try {
    if (action === 'getNotes') {
      return responseJSON(handleGetNotes());
    } else if (action === 'like' && params.id) {
      return responseJSON(handleLikeNote(params.id));
    } else if (action === 'create' && params.data) {
      const parsed = JSON.parse(params.data);
      return responseJSON(handleCreateNote(parsed));
    } else if (action === 'delete' && params.id) {
      return responseJSON(handleDeleteNote(params.id, params.passcode));
    }
    return responseJSON(handleGetNotes());
  } catch (err) {
    return responseJSON({ status: 'error', message: err.toString() });
  }
}

/**
 * 處理 POST 請求 (跨來源相容)
 */
function doPost(e) {
  let body = {};
  try {
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
  } catch (err) {
    body = {};
  }

  const action = body.action || (e && e.parameter && e.parameter.action) || 'createNote';

  try {
    if (action === 'createNote') {
      return responseJSON(handleCreateNote(body.note || body));
    } else if (action === 'likeNote') {
      return responseJSON(handleLikeNote(body.id));
    } else if (action === 'deleteNote') {
      return responseJSON(handleDeleteNote(body.id, body.passcode));
    } else if (action === 'clearAllNotes') {
      return responseJSON(handleClearAllNotes(body.passcode));
    }
    return responseJSON({ status: 'error', message: '未知操作' });
  } catch (err) {
    return responseJSON({ status: 'error', message: err.toString() });
  }
}

/**
 * 讀取所有有效卡片
 */
function handleGetNotes() {
  const sheet = getTargetSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return { status: 'success', notes: [] };
  }

  const data = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  const notes = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const status = String(row[10] || '').trim().toUpperCase();
    if (status === 'DELETED') continue;

    notes.push({
      id: String(row[0] || ''),
      to: String(row[1] || ''),
      message: String(row[2] || ''),
      from: String(row[3] || ''),
      theme: String(row[4] || 'cream'),
      shape: String(row[5] || 'classic'),
      icon: String(row[6] || 'tree'),
      category: String(row[7] || '同儕祝福'),
      createdAt: Number(row[8]) || Date.now(),
      likes: Number(row[9]) || 0,
      likedBy: []
    });
  }

  return { status: 'success', notes: notes };
}

/**
 * 新增卡片 (支援高並行 ScriptLock)
 */
function handleCreateNote(note) {
  if (!note || !note.message) {
    return { status: 'error', message: '卡片內容不能為空' };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getTargetSheet();
    const id = note.id || ('note-' + Date.now() + '-' + Math.floor(Math.random() * 1000));
    const now = note.createdAt || Date.now();
    const dateFormatted = Utilities.formatDate(new Date(now), 'Asia/Taipei', 'yyyy/MM/dd HH:mm:ss');

    const newRow = [
      id,
      note.to || '',
      note.message || '',
      note.from || '班級同學',
      note.theme || 'cream',
      note.shape || 'classic',
      note.icon || 'tree',
      note.category || '同儕祝福',
      now,
      Number(note.likes) || 0,
      'ACTIVE',
      dateFormatted
    ];

    sheet.appendRow(newRow);

    return {
      status: 'success',
      note: {
        id: id,
        to: newRow[1],
        message: newRow[2],
        from: newRow[3],
        theme: newRow[4],
        shape: newRow[5],
        icon: newRow[6],
        category: newRow[7],
        createdAt: newRow[8],
        likes: newRow[9],
        likedBy: []
      }
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 點按愛心共鳴
 */
function handleLikeNote(noteId) {
  if (!noteId) return { status: 'error', message: '缺少卡片 ID' };

  const lock = LockService.getScriptLock();
  lock.waitLock(8000);

  try {
    const sheet = getTargetSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { status: 'error', message: '找不到卡片' };

    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(noteId)) {
        const rowIdx = i + 2;
        const currentLikesCell = sheet.getRange(rowIdx, 10);
        const currentLikes = Number(currentLikesCell.getValue()) || 0;
        const newLikes = currentLikes + 1;
        currentLikesCell.setValue(newLikes);
        return { status: 'success', id: noteId, likes: newLikes };
      }
    }
    return { status: 'error', message: '卡片不存在' };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 標記刪除卡片
 */
function handleDeleteNote(noteId, passcode) {
  if (passcode !== '1225') {
    return { status: 'error', message: '通行碼錯誤' };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(8000);

  try {
    const sheet = getTargetSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { status: 'error', message: '找不到卡片' };

    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(noteId)) {
        const rowIdx = i + 2;
        sheet.getRange(rowIdx, 11).setValue('DELETED');
        return { status: 'success', id: noteId };
      }
    }
    return { status: 'error', message: '卡片不存在' };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 清空所有卡片
 */
function handleClearAllNotes(passcode) {
  if (passcode !== '1225') {
    return { status: 'error', message: '通行碼錯誤' };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getTargetSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
    return { status: 'success', message: '已清空所有卡片' };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 輸出標準 JSON 格式
 */
function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
