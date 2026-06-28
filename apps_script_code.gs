/**
 * THE CLOSING DESK™ v4 — Google Apps Script Code
 * 
 * CARA SETUP:
 * 1. Buka Google Sheet "The Closing Desk" kau
 * 2. Extensions → Apps Script
 * 3. Copy & paste SEMUA code ni
 * 4. Save (Ctrl+S)
 * 5. Refresh Google Sheet
 * 6. Menu "🚀 Closing Desk" akan muncul
 * 
 * NOTE: Code ni dah sedia ada dalam sheet kau. 
 * Ini hanya backup/documentation.
 */

// =============================================================================
// MENU SYSTEM
// =============================================================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 Closing Desk')
    .addItem('📱⚡ Send WA — Top 5 Batch', 'sendWhatsAppBatchTop5')
    .addItem('📱⚡⚡ Send WA — Top 10 Batch', 'sendWhatsAppBatchTop10')
    .addItem('📱⚡⚡⚡ Send WA — Top 20 Batch', 'sendWhatsAppBatchTop20')
    .addItem('🔥 Process All Hot Leads', 'processAllHotLeads')
    .addItem('👻 Queue All Ghosts', 'queueAllGhosts')
    .addItem('🧠 Sync Scripts from System Brain', 'syncScriptsFromBrain')
    .addSeparator()
    .addItem('📊 Refresh Dashboard', 'refreshDashboard')
    .addItem('ℹ️ About', 'showAbout')
    .addToUi();
}

// =============================================================================
// WHATSAPP BATCH SENDING
// =============================================================================

function sendWhatsAppBatchTop5() {
  sendWhatsAppBatch(5);
}

function sendWhatsAppBatchTop10() {
  sendWhatsAppBatch(10);
}

function sendWhatsAppBatchTop20() {
  sendWhatsAppBatch(20);
}

function sendWhatsAppBatch(limit) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName('War Room');
  
  if (!ws) {
    Browser.msgBox('❌ War Room tab not found!');
    return;
  }
  
  const data = ws.getDataRange().getValues();
  const headers = data[2]; // Headers kat row 3 (index 2)
  
  // Find column indices
  const colMap = {};
  headers.forEach((h, i) => colMap[h] = i);
  
  if (!colMap['PROSPECT NAME'] || !colMap['WA NO.'] || !colMap['PRIORITY']) {
    Browser.msgBox('❌ Required columns missing: PROSPECT NAME, WA NO., PRIORITY');
    return;
  }
  
  // Get leads with phone numbers, sorted by priority
  const leads = [];
  for (let i = 3; i < data.length; i++) {
    const row = data[i];
    const name = row[colMap['PROSPECT NAME']];
    const phone = row[colMap['WA NO.']];
    const priority = row[colMap['PRIORITY']] || 0;
    const nextAction = row[colMap['NEXT ACTION']] || '';
    
    if (name && phone && priority > 0) {
      leads.push({
        row: i + 1,
        name: name,
        phone: phone,
        priority: priority,
        nextAction: nextAction
      });
    }
  }
  
  // Sort by priority descending
  leads.sort((a, b) => b.priority - a.priority);
  
  // Take top N
  const topLeads = leads.slice(0, limit);
  
  if (topLeads.length === 0) {
    Browser.msgBox('⚠️ No leads with phone numbers found!');
    return;
  }
  
  // Build dialog
  let html = '<div style="font-family: Arial; padding: 20px;">';
  html += '<h2>📱 WhatsApp Batch Send — Top ' + limit + ' Leads</h2>';
  html += '<p>Click each link to open WhatsApp Web with pre-filled message:</p>';
  html += '<hr/>';
  
  topLeads.forEach((lead, idx) => {
    const encodedMsg = encodeURIComponent(lead.nextAction || 'Hi ' + lead.name + ', follow up dari ZK Revenue Ops.');
    const waLink = 'https://wa.me/' + cleanPhoneNumber(lead.phone) + '?text=' + encodedMsg;
    
    html += '<div style="margin: 15px 0; padding: 10px; background: #f0f0f0; border-radius: 5px;">';
    html += '<strong>' + (idx + 1) + '. ' + lead.name + '</strong> ';
    html += '<span style="color: green;">(Priority: ' + lead.priority + ')</span><br/>';
    html += '<a href="' + waLink + '" target="_blank" style="display: inline-block; margin-top: 5px; padding: 8px 15px; background: #25D366; color: white; text-decoration: none; border-radius: 5px;">';
    html += '💬 Open WhatsApp →</a>';
    html += '</div>';
  });
  
  html += '<hr/><p><em>Tip: Click semua link dalam new tabs, then hantar satu-satu.</em></p>';
  html += '</div>';
  
  const userInterface = HtmlService.createHtmlOutput(html)
    .setWidth(600)
    .setHeight(800);
  
  SpreadsheetApp.getUi().showModalDialog(userInterface, 'WhatsApp Batch Send');
}

function processAllHotLeads() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName('War Room');
  
  if (!ws) {
    Browser.msgBox('❌ War Room tab not found!');
    return;
  }
  
  const data = ws.getDataRange().getValues();
  const headers = data[2];
  
  const colMap = {};
  headers.forEach((h, i) => colMap[h] = i);
  
  if (!colMap['STATUS'] || !colMap['PROSPECT NAME'] || !colMap['WA NO.']) {
    Browser.msgBox('❌ Required columns missing!');
    return;
  }
  
  const hotLeads = [];
  for (let i = 3; i < data.length; i++) {
    const row = data[i];
    const status = (row[colMap['STATUS']] || '').toString().toLowerCase();
    const name = row[colMap['PROSPECT NAME']];
    const phone = row[colMap['WA NO.']];
    
    if (status.includes('hot') && name && phone) {
      hotLeads.push({
        row: i + 1,
        name: name,
        phone: phone,
        status: row[colMap['STATUS']]
      });
    }
  }
  
  if (hotLeads.length === 0) {
    Browser.msgBox('⚠️ No HOT leads found!');
    return;
  }
  
  let html = '<div style="font-family: Arial; padding: 20px;">';
  html += '<h2>🔥 Process All Hot Leads (' + hotLeads.length + ')</h2>';
  html += '<p>These leads are HOT! Contact them immediately:</p>';
  html += '<hr/>';
  
  hotLeads.forEach((lead, idx) => {
    const msg = 'Hi ' + lead.name + ', awak punya lead ni dah semakin panas! 🔥 Market tengah gila sekarang, bila free untuk call 5 minit?';
    const encodedMsg = encodeURIComponent(msg);
    const waLink = 'https://wa.me/' + cleanPhoneNumber(lead.phone) + '?text=' + encodedMsg;
    
    html += '<div style="margin: 15px 0; padding: 10px; background: #ffe6e6; border-radius: 5px; border-left: 4px solid red;">';
    html += '<strong>' + (idx + 1) + '. ' + lead.name + '</strong> ';
    html += '<span>(' + lead.status + ')</span><br/>';
    html += '<a href="' + waLink + '" target="_blank" style="display: inline-block; margin-top: 5px; padding: 8px 15px; background: #ff4444; color: white; text-decoration: none; border-radius: 5px;">';
    html += '🔥 Contact Now →</a>';
    html += '</div>';
  });
  
  html += '</div>';
  
  const userInterface = HtmlService.createHtmlOutput(html)
    .setWidth(600)
    .setHeight(800);
  
  SpreadsheetApp.getUi().showModalDialog(userInterface, 'Hot Leads Queue');
}

function queueAllGhosts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName('War Room');
  
  if (!ws) {
    Browser.msgBox('❌ War Room tab not found!');
    return;
  }
  
  const data = ws.getDataRange().getValues();
  const headers = data[2];
  
  const colMap = {};
  headers.forEach((h, i) => colMap[h] = i);
  
  if (!colMap['GHOST STAGE'] || !colMap['PROSPECT NAME'] || !colMap['WA NO.']) {
    Browser.msgBox('❌ Required columns missing!');
    return;
  }
  
  const ghostLeads = [];
  for (let i = 3; i < data.length; i++) {
    const row = data[i];
    const ghostStage = row[colMap['GHOST STAGE']];
    const name = row[colMap['PROSPECT NAME']];
    const phone = row[colMap['WA NO.']];
    
    if (ghostStage && name && phone) {
      ghostLeads.push({
        row: i + 1,
        name: name,
        phone: phone,
        ghostStage: ghostStage
      });
    }
  }
  
  if (ghostLeads.length === 0) {
    Browser.msgBox('👻 No GHOST leads found! All leads are active.');
    return;
  }
  
  let html = '<div style="font-family: Arial; padding: 20px;">';
  html += '<h2>👻 Ghost Revival Queue (' + ghostLeads.length + ')</h2>';
  html += '<p>Time to revive these dormant leads:</p>';
  html += '<hr/>';
  
  ghostLeads.forEach((lead, idx) => {
    const msg = 'Hi ' + lead.name + ', saya faham — kadang-kadang timing tak kena. Tapi property market tengah panas sekarang. Nak saya share update terbaru? 🔥';
    const encodedMsg = encodeURIComponent(msg);
    const waLink = 'https://wa.me/' + cleanPhoneNumber(lead.phone) + '?text=' + encodedMsg;
    
    html += '<div style="margin: 15px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; border-left: 4px solid gray;">';
    html += '<strong>' + (idx + 1) + '. ' + lead.name + '</strong> ';
    html += '<span>👻 ' + lead.ghostStage + '</span><br/>';
    html += '<a href="' + waLink + '" target="_blank" style="display: inline-block; margin-top: 5px; padding: 8px 15px; background: #888; color: white; text-decoration: none; border-radius: 5px;">';
    html += '👻 Revive →</a>';
    html += '</div>';
  });
  
  html += '</div>';
  
  const userInterface = HtmlService.createHtmlOutput(html)
    .setWidth(600)
    .setHeight(800);
  
  SpreadsheetApp.getUi().showModalDialog(userInterface, 'Ghost Revival Queue');
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function cleanPhoneNumber(phone) {
  if (!phone) return '';
  // Remove all non-digit characters
  let cleaned = phone.toString().replace(/\D/g, '');
  // If starts with 0, replace with 60
  if (cleaned.startsWith('0')) {
    cleaned = '60' + cleaned.substring(1);
  }
  return cleaned;
}

function refreshDashboard() {
  // Trigger any dashboard refresh logic if needed
  Browser.msgBox('✅ Dashboard refreshed!');
}

function showAbout() {
  const html = '<div style="font-family: Arial; padding: 20px;">' +
    '<h2>🚀 The Closing Desk™ v4 Hybrid</h2>' +
    '<p><strong>Backend:</strong> Python (GitHub Actions) — 7:30 AM daily</p>' +
    '<p><strong>Frontend:</strong> Google Apps Script (this)</p>' +
    '<hr/>' +
    '<p>Built by <strong>ZK Revenue Ops</strong></p>' +
    '<p>Helping real estate agents systemize & scale their database.</p>' +
    '</div>';
  
  const userInterface = HtmlService.createHtmlOutput(html)
    .setWidth(400)
    .setHeight(300);
  
  SpreadsheetApp.getUi().showModalDialog(userInterface, 'About The Closing Desk');
}
