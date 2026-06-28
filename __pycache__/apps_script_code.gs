// ═══════════════════════════════════════════════════════════════════════════════
// THE CLOSING DESK™ V4.1 STABLE — BUG-FIXED & CLEANED
// ─────────────────────────────────────────────────────────────────────────────
// Changes from V4: Fixed priority calc bug, duplicate ghost prevention,
//                  auto-priority on price/contact edit, engine logging
// Maintainer: Zubair Ariff (ZK Revenue Ops) | Last updated: 2026-06-24
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION A: CONFIGURATION & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const C = {
  BG_DARK:  '#0D0D0F', BG2: '#16171B', BG3: '#1C1D23', BG4: '#1F2026',
  GOLD:     '#C9A84C', GOLD_DIM: '#7A6835',
  TEXT:     '#E8E6DD', MUTED: '#8B8A82', BORDER: '#25262C',
  HOT_BG:   '#2D1515',  HOT_FG: '#FF8080',
  WARM_BG:  '#2A1F0D',  WARM_FG: '#D4942E',
  COLD_BG:  '#141618',  COLD_FG: '#6A9AB0',
  APPT_BG:  '#112D1A',  APPT_FG: '#4EB87A',
  CLOSING_BG: '#1D1D0E', CLOSING_FG: '#C9A84C',
  GHOST_BG: '#1A1530',   GHOST_FG: '#9585D8',
  RED: '#E24B4A', GREEN: '#4CAF70', AMBER: '#EF9F27',
};

const COL = {
  LEAD_ID: 2, NAME: 3, WANUM: 4, PROPERTY: 5, PRICE: 6,
  STATUS: 7, PRIORITY: 8, COMMISSION: 9, TOUCH: 10,
  LAST_CONTACT: 11, DAYS_STALE: 12, NEXT_ACTION: 13,
  DSR_STATUS: 14, SCRIPT_REF: 15, NOTES: 16,
  GHOST_STAGE: 17
};

const SH = {
  DASH: 'Command Center', WAR: 'War Room',
  ENGINE: 'Engine', GHOST: 'Ghost Revival', BRAIN: 'System Brain'
};

const TOOLKIT_DOC_ID = '1_zMA6fdwEcjP0G8Jbi4BHI9Xl6YeQT_-k56PDggLRO0';

const STATUS_PRIORITY_MAP = { Hot: 40, Appointment: 38, Closing: 35, Warm: 20, Cold: 10, Ghost: 2 };

const GHOST_STAGE_MAP = [
  { max: 13,  stage: 1 },
  { max: 29,  stage: 2 },
  { max: 59,  stage: 3 },
  { max: 89,  stage: 4 },
  { max: 119, stage: 5 },
  { max: 179, stage: 6 },
  { max: 999, stage: 7 }
];


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION B: LIFECYCLE — SETUP (One-time per client)
// ═══════════════════════════════════════════════════════════════════════════════

function step1_Setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.getSheets().forEach(s => { try { ss.deleteSheet(s); } catch(e) {} });
  ss.insertSheet('_building');
  Logger.log('✅ Step 1: Sheets cleared.');
}

function step2_CommandCenter() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SH.DASH); if (sh) ss.deleteSheet(sh);
  sh = ss.insertSheet(SH.DASH, 0); sh.setTabColor(C.GOLD);
  sh.getRange(1,1,sh.getMaxRows(),sh.getMaxColumns()).setBackground(C.BG_DARK).setFontColor(C.TEXT);
  [1,2,3,4,5,6,7].forEach((c,i) => sh.setColumnWidth(c, i===0||i===6 ? 18 : 162));

  sh.setRowHeight(1,5); sh.getRange('A1:G1').setBackground(C.GOLD);
  sh.setRowHeight(2,44);
  sh.getRange('B2:F2').merge().setValue('THE CLOSING DESK™  //  COMMAND CENTER').setFontSize(15).setFontWeight('bold').setFontColor(C.GOLD).setBackground(C.BG2).setVerticalAlignment('middle');
  sh.getRange('G2').setValue('● LIVE').setFontSize(9).setFontColor(C.GREEN).setBackground(C.BG2).setVerticalAlignment('middle').setHorizontalAlignment('center');
  sh.setRowHeight(3,20); sh.getRange('B3:G3').merge().setValue('Auto-refreshes on edit  ·  Subsale Pipeline Malaysia').setFontSize(9).setFontColor(C.MUTED).setBackground(C.BG2).setVerticalAlignment('middle');
  sh.setRowHeight(4,10); sh.setRowHeight(5,18);
  sh.getRange('B5').setValue('KEY PERFORMANCE INDICATORS').setFontSize(8).setFontWeight('bold').setFontColor(C.MUTED).setBackground(C.BG_DARK);

  const kpis = [
    {col:2, label:'TOTAL LEADS',  color:C.GOLD,    f:"=COUNTA('War Room'!C4:C)"},
    {col:3, label:'REPLY RATE',   color:'#378ADD', f:"=IFERROR(TEXT(COUNTIF('Engine'!E4:E,\"Replied\")/COUNTA('Engine'!C4:C),\"0.0%\"),\"—\")"},
    {col:4, label:'APPOINTMENTS', color:C.GREEN,   f:"=COUNTIF('War Room'!G4:G,\"Appointment\")"},
    {col:5, label:'GHOST LEADS',  color:C.RED,     f:"=COUNTIF('War Room'!G4:G,\"Ghost\")"},
    {col:6, label:'CONV. RATE',   color:'#c792ea', f:"=IFERROR(TEXT(COUNTIF('War Room'!G4:G,\"Appointment\")/COUNTA('War Room'!C4:C),\"0.0%\"),\"—\")"},
  ];
  kpis.forEach(k => {
    sh.getRange(6,k.col,5,1).setBackground(C.BG3);
    sh.getRange(6,k.col).setBorder(true,false,false,false,false,false,k.color,SpreadsheetApp.BorderStyle.SOLID_THICK);
    sh.getRange(7,k.col).setValue(k.label).setFontSize(8).setFontWeight('bold').setFontColor(C.MUTED).setBackground(C.BG3).setHorizontalAlignment('center').setVerticalAlignment('middle');
    sh.getRange(8,k.col).setFormula(k.f).setFontSize(26).setFontWeight('bold').setFontColor(k.color).setBackground(C.BG3).setHorizontalAlignment('center').setVerticalAlignment('middle');
    sh.getRange(9,k.col).setValue('↑ Live').setFontSize(8).setFontColor(C.GREEN).setBackground(C.BG3).setHorizontalAlignment('center').setVerticalAlignment('middle');
    sh.getRange(6,k.col,5,1).setBorder(true,true,true,true,false,false,C.BORDER,SpreadsheetApp.BorderStyle.SOLID);
  });

  sh.setRowHeight(11,10); [12,13,14,15].forEach(r => sh.setRowHeight(r,22)); sh.setRowHeight(13,36);
  sh.getRange('B12:F15').setBackground(C.BG3).setBorder(true,true,true,true,false,false,C.GOLD_DIM,SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange('B12').setValue('TOTAL ESTIMATED PIPELINE VALUE  (Hot + Appointment)').setFontSize(8).setFontWeight('bold').setFontColor(C.MUTED).setBackground(C.BG3).setVerticalAlignment('middle');
  sh.getRange('B13:D13').merge().setFormula("=\"RM \"&TEXT(SUMIF('War Room'!G:G,\"Hot\",'War Room'!F:F)+SUMIF('War Room'!G:G,\"Appointment\",'War Room'!F:F),\"#,##0\")").setFontSize(26).setFontWeight('bold').setFontColor(C.GOLD).setBackground(C.BG3).setVerticalAlignment('middle');
  sh.getRange('E13').setFormula("=\"Est. Comm: RM \"&TEXT(SUMIF('War Room'!G:G,\"Hot\",'War Room'!I:I)+SUMIF('War Room'!G:G,\"Closing\",'War Room'!I:I),\"#,##0\")").setFontSize(10).setFontColor(C.GOLD).setBackground(C.BG3).setVerticalAlignment('middle');
  sh.getRange('F13').setFormula("=\"VA Score: \"&ROUND(IFERROR((COUNTA('Engine'!C4:C)*0.3+COUNTIF('Engine'!E4:E,\"Replied\")*0.4+COUNTIF('War Room'!G4:G,\"Appointment\")*0.3),0),0)&\"/100\"").setFontSize(10).setFontColor(C.TEXT).setBackground(C.BG3).setVerticalAlignment('middle');
  // V4.1 FIX: B14 now dynamic — will be updated by setupNewClient
  sh.getRange('B14').setValue('Active subsale pipeline · Auto-updated').setFontSize(8).setFontColor(C.MUTED).setBackground(C.BG3);

  // V4.1 FIX: Hidden cell to store client location for dynamic updates
  sh.getRange('H14').setValue('Auto-updated').setFontSize(8).setFontColor(C.MUTED).setBackground(C.BG3);

  sh.setRowHeight(16,14); sh.setRowHeight(17,18);
  sh.getRange('B17').setValue('PIPELINE FUNNEL  //  Lead-to-Close Breakdown').setFontSize(8).setFontWeight('bold').setFontColor(C.MUTED).setBackground(C.BG_DARK); sh.setRowHeight(18,20);
  ['STATUS','COUNT','EST. VALUE (RM)','EST. COMMISSION (RM)','% OF LEADS'].forEach((h,i) => sh.getRange(18,i+2).setValue(h).setFontSize(8).setFontWeight('bold').setFontColor(C.MUTED).setBackground(C.BG4).setHorizontalAlignment(i>0?'center':'left').setVerticalAlignment('middle'));
  [
    {l:'🔵  Cold', s:'Cold', c:C.COLD_FG, bg:C.COLD_BG},
    {l:'🟡  Warm', s:'Warm', c:C.WARM_FG, bg:C.WARM_BG},
    {l:'🔴  Hot', s:'Hot', c:C.HOT_FG, bg:C.HOT_BG},
    {l:'📅  Appointment', s:'Appointment', c:C.APPT_FG, bg:C.APPT_BG},
    {l:'💰  Closing', s:'Closing', c:C.CLOSING_FG, bg:C.CLOSING_BG},
    {l:'👻  Ghost', s:'Ghost', c:C.GHOST_FG, bg:C.GHOST_BG}
  ].forEach((f,i) => {
    const r = 19+i; sh.setRowHeight(r,26);
    sh.getRange(r,2).setValue(f.l).setFontSize(10).setFontWeight('bold').setFontColor(f.c).setBackground(f.bg).setVerticalAlignment('middle');
    sh.getRange(r,3).setFormula(`=COUNTIF('War Room'!G:G,"${f.s}")`).setFontSize(13).setFontWeight('bold').setFontColor(f.c).setBackground(f.bg).setHorizontalAlignment('center').setVerticalAlignment('middle');
    sh.getRange(r,4).setFormula(`=IFERROR(TEXT(SUMIF('War Room'!G:G,"${f.s}",'War Room'!F:F),"#,##0"),"—")`).setFontSize(10).setFontColor(f.c).setBackground(f.bg).setHorizontalAlignment('center').setVerticalAlignment('middle');
    sh.getRange(r,5).setFormula(`=IFERROR(TEXT(SUMIF('War Room'!G:G,"${f.s}",'War Room'!I:I),"#,##0"),"—")`).setFontSize(10).setFontColor(f.c).setBackground(f.bg).setHorizontalAlignment('center').setVerticalAlignment('middle');
    sh.getRange(r,6).setFormula(`=IFERROR(TEXT(COUNTIF('War Room'!G:G,"${f.s}")/COUNTA('War Room'!C4:C),"0.0%"),"—")`).setFontSize(10).setFontColor(f.c).setBackground(f.bg).setHorizontalAlignment('center').setVerticalAlignment('middle');
    sh.getRange(r,2,1,5).setBorder(false,false,true,false,false,false,C.BORDER,SpreadsheetApp.BorderStyle.SOLID);
  });

  sh.setRowHeight(26,14); sh.getRange('B26').setValue('CHANNEL PERFORMANCE  //  Reply Rate by Source').setFontSize(8).setFontWeight('bold').setFontColor(C.MUTED).setBackground(C.BG_DARK); sh.setRowHeight(27,20);
  ['CHANNEL','REPLY RATE'].forEach((h,i) => sh.getRange(27,i+2).setValue(h).setFontSize(8).setFontWeight('bold').setFontColor(C.MUTED).setBackground(C.BG4).setHorizontalAlignment(i>0?'center':'left').setVerticalAlignment('middle'));
  [
    {l:'📱  WhatsApp', c:'#25D366', f:"=IFERROR(TEXT(COUNTIFS('Engine'!D:D,\"WhatsApp\",'Engine'!E:E,\"Replied\")/COUNTIF('Engine'!D:D,\"WhatsApp\"),\"0%\"),\"—\")"},
    {l:'📞  Call', c:'#378ADD', f:"=IFERROR(TEXT(COUNTIFS('Engine'!D:D,\"Call\",'Engine'!E:E,\"Replied\")/COUNTIF('Engine'!D:D,\"Call\"),\"0%\"),\"—\")"},
    {l:'📸  Instagram', c:'#C13584', f:"=IFERROR(TEXT(COUNTIFS('Engine'!D:D,\"Instagram\",'Engine'!E:E,\"Replied\")/COUNTIF('Engine'!D:D,\"Instagram\"),\"0%\"),\"—\")"},
    {l:'👥  Facebook', c:'#4267B2', f:"=IFERROR(TEXT(COUNTIFS('Engine'!D:D,\"Facebook\",'Engine'!E:E,\"Replied\")/COUNTIF('Engine'!D:D,\"Facebook\"),\"0%\"),\"—\")"}
  ].forEach((ch,i) => {
    const r=28+i; sh.setRowHeight(r,24);
    sh.getRange(r,2).setValue(ch.l).setFontSize(10).setFontWeight('bold').setFontColor(ch.c).setBackground(C.BG3).setVerticalAlignment('middle');
    sh.getRange(r,3).setFormula(ch.f).setFontSize(13).setFontWeight('bold').setFontColor(ch.c).setBackground(C.BG3).setHorizontalAlignment('center').setVerticalAlignment('middle');
    sh.getRange(r,2,1,2).setBorder(false,false,true,false,false,false,C.BORDER,SpreadsheetApp.BorderStyle.SOLID);
  });
  sh.setFrozenRows(3); Logger.log('✅ Step 2: Command Center.');
}

function step3_WarRoom() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SH.WAR); if (sh) ss.deleteSheet(sh);
  sh = ss.insertSheet(SH.WAR, 1); sh.setTabColor(C.RED);
  sh.getRange(1,1,sh.getMaxRows(),sh.getMaxColumns()).setBackground(C.BG_DARK).setFontColor(C.TEXT);
  const w={1:18,2:72,3:165,4:65,5:215,6:120,7:105,8:82,9:100,10:65,11:108,12:82,13:112,14:82,15:170,16:185,17:18};
  Object.entries(w).forEach(([c,v])=>sh.setColumnWidth(+c,v));
  sh.setRowHeight(1,5); sh.getRange('A1:Q1').setBackground(C.RED); sh.setRowHeight(2,40);
  sh.getRange('B2:G2').merge().setValue('🎯  ACTIVE WAR ROOM  //  Priority Lead Pipeline').setFontSize(14).setFontWeight('bold').setFontColor(C.RED).setBackground(C.BG2).setVerticalAlignment('middle');
  sh.getRange('H2:I2').merge().setValue('Auto-sorted by Priority Score ↓').setFontSize(8).setFontColor(C.MUTED).setBackground(C.BG2).setVerticalAlignment('middle').setHorizontalAlignment('center');
  sh.getRange('J2:M2').merge().setFormula("=\"Hot: \"&COUNTIF(G:G,\"Hot\")&\"  |  Appt: \"&COUNTIF(G:G,\"Appointment\")&\"  |  Ghost: \"&COUNTIF(G:G,\"Ghost\")&\"  |  Total: \"&COUNTA(C4:C)").setFontSize(9).setFontColor(C.AMBER).setBackground(C.BG2).setVerticalAlignment('middle').setHorizontalAlignment('center');
  sh.setRowHeight(3,28);
  ['','LEAD ID','PROSPECT NAME','WA NO.','PROPERTY INTEREST','PRICE (RM)','STATUS','PRIORITY','COMMISSION (RM)','TOUCH #','LAST CONTACT','DAYS STALE','NEXT ACTION','DSR','SCRIPT REF','VA NOTES','GHOST STAGE'].forEach((h,i)=>{ if(!h) return; sh.getRange(3,i+1).setValue(h).setFontSize(8).setFontWeight('bold').setFontColor(C.MUTED).setBackground(C.BG4).setHorizontalAlignment('center').setVerticalAlignment('middle').setBorder(false,false,true,false,false,false,C.GOLD_DIM,SpreadsheetApp.BorderStyle.SOLID); });
  const N=150; const row0=4;
  sh.getRange(row0,2,N,1).setFormulas(Array.from({length:N},(_,i)=>[`=IF(C${row0+i}="","","PL-"&TEXT(ROW()-3,"000"))`])).setFontSize(9).setFontColor(C.MUTED).setHorizontalAlignment('center');
  sh.getRange(row0,9,N,1).setFormulas(Array.from({length:N},(_,i)=>[`=IF(F${row0+i}="","",F${row0+i}*0.02)`])).setNumberFormat('"RM "#,##0').setFontSize(10).setFontColor(C.GOLD).setHorizontalAlignment('center');
  sh.getRange(row0,12,N,1).setFormulas(Array.from({length:N},(_,i)=>[`=IF(K${row0+i}="","",INT(TODAY()-K${row0+i}))`])).setNumberFormat('0').setFontSize(10).setHorizontalAlignment('center');
  // V4.1 FIX: Set date format for LAST_CONTACT column (K)
  sh.getRange(row0,11,N,1).setNumberFormat('d MMM yyyy').setFontColor(C.TEXT);
  sh.getRange(row0,15,N,1).setFormulas(Array.from({length:N},(_,i)=>[`=IFERROR(INDEX('System Brain'!$B$6:$H$10,MATCH(G${row0+i},'System Brain'!$A$6:$A$10,0),MIN(IF(J${row0+i}="",1,J${row0+i}),7)),"—")`])).setFontSize(8).setFontColor(C.MUTED).setWrap(false);
  sh.getRange('G4:G153').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Cold','Warm','Hot','Appointment','Closing','Ghost'],true).build());
  const cfR = sh.getRange('B4:Q153');
  const rules = [
    {s:'Hot',bg:C.HOT_BG,f:C.HOT_FG},{s:'Appointment',bg:C.APPT_BG,f:C.APPT_FG},{s:'Closing',bg:C.CLOSING_BG,f:C.CLOSING_FG},{s:'Warm',bg:C.WARM_BG,f:C.WARM_FG},{s:'Cold',bg:C.COLD_BG,f:C.COLD_FG},{s:'Ghost',bg:C.GHOST_BG,f:C.GHOST_FG}
  ].map(r => SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(`=$G4="${r.s}"`).setBackground(r.bg).setFontColor(r.f).setRanges([cfR]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND($M4<TODAY(),$M4<>"",$G4<>"Closing")').setBackground('#3D1010').setFontColor(C.RED).setBold(true).setRanges([sh.getRange('M4:M153')]).build(),
             SpreadsheetApp.newConditionalFormatRule().whenNumberGreaterThanOrEqualTo(7).setBackground('#2D1010').setFontColor(C.RED).setBold(true).setRanges([sh.getRange('L4:L153')]).build());
  sh.setConditionalFormatRules(rules); sh.setFrozenRows(3); Logger.log('✅ Step 3: War Room.');
}

function step4_Engine() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SH.ENGINE); if (sh) ss.deleteSheet(sh);
  sh = ss.insertSheet(SH.ENGINE, 2); sh.setTabColor('#378ADD');
  sh.getRange(1,1,sh.getMaxRows(),sh.getMaxColumns()).setBackground(C.BG_DARK).setFontColor(C.TEXT); sh.getRange('A1:J1').setBackground('#378ADD');
  sh.setRowHeight(1,5); sh.setRowHeight(2,40); sh.getRange('B2:H2').merge().setValue('⚙️  THE ENGINE  //  Outreach Activity Log').setFontSize(14).setFontWeight('bold').setFontColor('#378ADD').setBackground(C.BG2).setVerticalAlignment('middle');
  sh.getRange('I2').setFormula("=\"Touches: \"&COUNTA(C3:C)&\"  |  Replied: \"&COUNTIF(E3:E,\"Replied\")").setFontSize(9).setFontColor(C.AMBER).setBackground(C.BG2).setVerticalAlignment('middle').setHorizontalAlignment('right');
  const ew={1:18,2:115,3:160,4:112,5:132,6:70,7:125,8:160,9:240,10:18}; Object.entries(ew).forEach(([c,v])=>sh.setColumnWidth(+c,v));
  sh.setRowHeight(3,26); ['','TIMESTAMP','LEAD NAME','CHANNEL','RESPONSE TYPE','TOUCH #','STATUS UPDATE','SCRIPT USED','VA NOTES',''].forEach((h,i)=>{ if(!h) return; sh.getRange(3,i+1).setValue(h).setFontSize(8).setFontWeight('bold').setFontColor(C.MUTED).setBackground(C.BG4).setHorizontalAlignment('center').setVerticalAlignment('middle').setBorder(false,false,true,false,false,false,C.BORDER,SpreadsheetApp.BorderStyle.SOLID); });
  sh.getRange('B4:B500').setNumberFormat('d MMM yyyy h:mm am/pm').setFontColor(C.TEXT);
  sh.getRange('D4:D500').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['WhatsApp','Call','Instagram','Facebook','Email'],true).build());
  sh.getRange('E4:E500').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['No Reply','Seen','Replied','Interested','Not Interested','Appointment Set'],true).build());
  sh.getRange('G4:G500').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Cold','Warm','Hot','Appointment','Closing','Ghost','—'],true).build());
  sh.setConditionalFormatRules([SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Replied').setBackground('#112D1A').setFontColor(C.GREEN).setRanges([sh.getRange('E4:E500')]).build(),SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Appointment Set').setBackground(C.APPT_BG).setFontColor(C.APPT_FG).setRanges([sh.getRange('E4:E500')]).build(),SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('No Reply').setFontColor(C.MUTED).setRanges([sh.getRange('E4:E500')]).build()]);
  sh.setFrozenRows(3); Logger.log('✅ Step 4: Engine.');
}

function step5_GhostRevival() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SH.GHOST); if (sh) ss.deleteSheet(sh);
  sh = ss.insertSheet(SH.GHOST, 3); sh.setTabColor(C.GHOST_FG);
  sh.getRange(1,1,sh.getMaxRows(),sh.getMaxColumns()).setBackground(C.BG_DARK).setFontColor(C.TEXT); sh.getRange('A1:L1').setBackground(C.GHOST_FG);
  sh.setRowHeight(1,5); sh.setRowHeight(2,40); sh.getRange('B2:H2').merge().setValue('👻  GHOST REVIVAL  //  Re-engagement Sequences').setFontSize(14).setFontWeight('bold').setFontColor(C.GHOST_FG).setBackground(C.BG2).setVerticalAlignment('middle');
  sh.getRange('I2').setFormula("=\"Ghosts: \"&COUNTA(C3:C)&\"  |  Revived: \"&COUNTIF(J3:J,\"Revived\")").setFontSize(9).setFontColor(C.AMBER).setBackground(C.BG2).setVerticalAlignment('middle').setHorizontalAlignment('right');
  const gw={1:18,2:80,3:160,4:100,5:210,6:110,7:80,8:70,9:260,10:120,11:180,12:18}; Object.entries(gw).forEach(([c,v])=>sh.setColumnWidth(+c,v));
  sh.setRowHeight(3,26); ['','LEAD ID','NAME','WA NO.','PROPERTY','GHOSTED SINCE','DAYS COLD','STAGE','REVIVAL SCRIPT (COPY → WA)','OUTCOME','VA NOTES',''].forEach((h,i)=>{ if(!h) return; sh.getRange(3,i+1).setValue(h).setFontSize(8).setFontWeight('bold').setFontColor(C.MUTED).setBackground(C.BG4).setHorizontalAlignment('center').setVerticalAlignment('middle').setBorder(false,false,true,false,false,false,C.BORDER,SpreadsheetApp.BorderStyle.SOLID); });
  sh.getRange('F4:F300').setNumberFormat('d MMM yyyy').setFontColor(C.TEXT); sh.getRange('J4:J300').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Pending','Revived','Still Cold','Archive'],true).build());
  sh.setFrozenRows(3); Logger.log('✅ Step 5: Ghost Revival.');
}

function step6_SystemBrain() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SH.BRAIN); if (sh) ss.deleteSheet(sh);
  sh = ss.insertSheet(SH.BRAIN, 4); sh.setTabColor(C.GREEN);
  sh.getRange(1,1,sh.getMaxRows(),sh.getMaxColumns()).setBackground(C.BG_DARK).setFontColor(C.TEXT); sh.getRange('A1:H1').setBackground(C.GREEN);
  sh.setRowHeight(1,5); sh.setRowHeight(2,36); sh.getRange('A2:H2').merge().setValue('🧠  SYSTEM BRAIN  //  ScriptMatrix + Ghost Revival + Config  ·  PROTECTED').setFontSize(11).setFontWeight('bold').setFontColor(C.GREEN).setBackground(C.BG2).setVerticalAlignment('middle');
  sh.setRowHeight(3,10); sh.setRowHeight(4,16); sh.getRange('A4').setValue('SCRIPT MATRIX  (Status × Touch 1–7  |  Sync from Outreach Toolkit)').setFontSize(8).setFontWeight('bold').setFontColor(C.MUTED).setBackground(C.BG_DARK); sh.setRowHeight(5,22);
  ['STATUS','T1','T2','T3','T4','T5','T6','T7'].forEach((h,i)=>{ sh.setColumnWidth(i+1, i===0?110:290); sh.getRange(5,i+1).setValue(h).setFontSize(8).setFontWeight('bold').setFontColor(C.MUTED).setBackground(C.BG4).setHorizontalAlignment('center').setVerticalAlignment('middle'); });
  ['Cold','Warm','Hot','Appointment','Closing'].forEach((st,i)=>{ const r=6+i; sh.setRowHeight(r,90); sh.getRange(r,1).setValue(st).setFontSize(10).setFontWeight('bold').setFontColor(C.GOLD).setBackground(C.BG3).setVerticalAlignment('middle'); for(let t=1;t<=7;t++){ sh.getRange(r,t+1).setValue('Sync dari Toolkit...').setFontSize(9).setFontColor(C.MUTED).setBackground(C.BG_DARK).setWrap(true).setVerticalAlignment('top'); } });
  sh.setRowHeight(11,14); sh.setRowHeight(12,16); sh.getRange('A12').setValue('GHOST REVIVAL SCRIPTS  (Stage 1-7  |  Sync from Outreach Toolkit)').setFontSize(8).setFontWeight('bold').setFontColor(C.MUTED).setBackground(C.BG_DARK); sh.setRowHeight(13,22);
  ['STAGE','REVIVAL SCRIPT'].forEach((h,i)=>sh.getRange(13,i+1).setValue(h).setFontSize(8).setFontWeight('bold').setFontColor(C.MUTED).setBackground(C.BG4).setVerticalAlignment('middle'));
  for(let stg=1;stg<=7;stg++){ const r=13+stg; sh.setRowHeight(r,90); sh.getRange(r,1).setValue(stg).setFontSize(12).setFontWeight('bold').setFontColor(C.GHOST_FG).setBackground(C.GHOST_BG).setHorizontalAlignment('center').setVerticalAlignment('middle'); sh.getRange(r,2).setValue(`Stage ${stg} — sync dari Toolkit`).setFontSize(9).setFontColor(C.TEXT).setBackground(C.BG_DARK).setWrap(true).setVerticalAlignment('top'); }
  sh.setRowHeight(21,14); sh.getRange('A22').setValue('COMMISSION CONFIG').setFontSize(8).setFontWeight('bold').setFontColor(C.MUTED); ['TYPE','RATE','NOTE'].forEach((h,i)=>sh.getRange(23,i+1).setValue(h).setFontSize(8).setFontWeight('bold').setFontColor(C.MUTED).setBackground(C.BG4));
  [['Subsale Standard',0.02,'2% of transaction price'],['Subsale Co-Agency',0.01,'1% — confirm with co-agent'],['Project Sale',0.03,'3% developer commission']].forEach((r,i)=>{ sh.getRange(24+i,1).setValue(r[0]).setFontSize(10).setFontColor(C.TEXT).setBackground(C.BG3); sh.getRange(24+i,2).setValue(r[1]).setNumberFormat('0%').setFontSize(10).setFontColor(C.GOLD).setBackground(C.BG3).setHorizontalAlignment('center'); sh.getRange(24+i,3).setValue(r[2]).setFontSize(9).setFontColor(C.MUTED).setBackground(C.BG3); sh.setRowHeight(24+i,24); });
  sh.protect().setDescription('System Brain — Protected').setWarningOnly(true); sh.setFrozenRows(2);
  const temp = ss.getSheetByName('_building'); if(temp) ss.deleteSheet(temp);
  Logger.log('✅ Step 6: System Brain.');
}

function step7_Triggers() {
  ScriptApp.getProjectTriggers().forEach(t => { if (['onEditCascade','flagStaleLeads'].includes(t.getHandlerFunction())) ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('onEditCascade').forSpreadsheet(SpreadsheetApp.getActive()).onEdit().create();
  ScriptApp.newTrigger('flagStaleLeads').timeBased().everyDays(1).atHour(8).create();
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SH.DASH).activate();
  Logger.log('✅ Step 7: System LIVE!');
  SpreadsheetApp.getUi().alert('🎉 THE CLOSING DESK™ V4 IS LIVE!\n\n✅ Semua tab bersih tanpa demo data.\n✅ Trigger aktif.\n\nGuna menu 🚀 Closing Desk.\n\nUntuk client baru: File → Make a copy → Run setupNewClient().');
}

function setupNewClient() {
  const ss = SpreadsheetApp.getActiveSpreadsheet(); const ui = SpreadsheetApp.getUi();
  
  // Prompt 1: Client Name
  const response1 = ui.prompt('Masukkan Nama Client', 'Contoh: REN Ahmad KL', ui.ButtonSet.OK_CANCEL);
  if (response1.getSelectedButton() !== ui.Button.OK) return;
  const clientName = response1.getResponseText().trim();
  if (!clientName) { ui.alert('Nama client diperlukan.'); return; }
  
  // Prompt 2: Location/Area (V4.1 FIX)
  const response2 = ui.prompt('Lokasi / Area Client', 'Contoh: Klang, Selangor  atau  Butterworth, Penang', ui.ButtonSet.OK_CANCEL);
  const clientLocation = response2.getSelectedButton() === ui.Button.OK 
    ? response2.getResponseText().trim() 
    : 'Malaysia';
  
  ss.rename(`[${clientName}] The Closing Desk`);
  [SH.WAR, SH.ENGINE, SH.GHOST].forEach(s => { const sh = ss.getSheetByName(s); if (sh && sh.getLastRow() > 3) sh.deleteRows(4, sh.getLastRow() - 3); });
  
  const dash = ss.getSheetByName(SH.DASH);
  if (dash) {
    dash.getRange('G3').setValue(`Setup on ${Utilities.formatDate(new Date(), 'Asia/Kuala_Lumpur', 'd MMM yyyy')}`);
    // V4.1 FIX: Update B14 with client location dynamically
    dash.getRange('B14').setValue(`Active subsale pipeline · ${clientLocation} · Auto-updated`);
  }
  ui.alert(`✅ Siap! Spreadsheet untuk ${clientName} (${clientLocation}) telah sedia.`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION B1: DEMO DATA LOADER (For portfolio & testing)
// ═══════════════════════════════════════════════════════════════════════════════

function populateDemoData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const war = ss.getSheetByName(SH.WAR);
  const engine = ss.getSheetByName(SH.ENGINE);
  const ui = SpreadsheetApp.getUi();
  const confirm = ui.alert('⚠️ Ini akan masukkan 6 sample leads. Pastikan War Room kosong (row 4+). Teruskan?', ui.ButtonSet.YES_NO);
  if (confirm !== ui.Button.YES) return;

  const today = new Date();
  const d = (days) => new Date(today.getTime() - days * 86400000);

  const leads = [
    {name: 'Ahmad Zulkifli',    wa: '0123456789', prop: 'Taman Sri Klang, Klang',              price: 850000,   status: 'Hot',         touch: 3, last: d(4),  next: 'Follow up loan approval',  dsr: 'Strong', notes: 'Interested, waiting for DSR check'},
    {name: 'Siti Nurhaliza',   wa: '0138765432', prop: 'Apartment Bandar Baru, Butterworth',    price: 420000,   status: 'Appointment', touch: 5, last: d(6),  next: 'Viewing 25 Jun 3pm',        dsr: 'Strong', notes: 'Confirmed viewing, bring brochure'},
    {name: 'Rajesh Kumar',      wa: '0162345678', prop: 'Terrace Taman Sentosa, Johor Bahru',    price: 650000,   status: 'Warm',        touch: 2, last: d(3),  next: 'Send floor plan',           dsr: 'Borderline', notes: 'Wife needs to agree'},
    {name: 'Lim Wei Cheng',    wa: '0198765432', prop: 'Condo KL Sentral, Kuala Lumpur',        price: 1200000,  status: 'Cold',        touch: 1, last: d(1),  next: 'Intro + property list',      dsr: '—', notes: 'First touch, sent via WhatsApp'},
    {name: 'Farah Abdullah',   wa: '0145678901', prop: 'Semi-D Taman Perling, Johor Bahru',     price: 780000,   status: 'Ghost',       touch: 0, last: d(14), next: 'Ghost revival — Stage 2',   dsr: '—', notes: 'Seen but no reply for 2 weeks'},
    {name: 'Amirul Hafiz',     wa: '0173456789', prop: 'Bungalow Damansara Heights, KL',       price: 3500000,  status: 'Closing',     touch: 7, last: d(9),  next: 'SPA signing next week',    dsr: 'Strong', notes: ' Lawyer appointment confirmed'},
  ];

  // V4.1 FIX: Clear existing explicit formatting from data rows before populating
  const lastRow = war.getLastRow();
  if (lastRow >= 4) {
    war.getRange(4, 1, lastRow - 3, 17).setBackground(C.BG_DARK).setFontColor(C.TEXT).setFontSize(10).setFontWeight('normal');
  }

  leads.forEach((lead, i) => {
    const row = 4 + i;
    war.getRange(row, COL.NAME).setValue(lead.name);
    war.getRange(row, COL.WANUM).setValue(lead.wa);
    war.getRange(row, COL.PROPERTY).setValue(lead.prop);
    war.getRange(row, COL.PRICE).setValue(lead.price);
    war.getRange(row, COL.STATUS).setValue(lead.status);
    war.getRange(row, COL.TOUCH).setValue(lead.touch);
    war.getRange(row, COL.LAST_CONTACT).setValue(lead.last);
    war.getRange(row, COL.NEXT_ACTION).setValue(lead.next);
    war.getRange(row, COL.DSR_STATUS).setValue(lead.dsr);
    war.getRange(row, COL.NOTES).setValue(lead.notes);
    // V4.1 FIX: Apply explicit colour immediately after each row (CF doesn't trigger for programmatic changes)
    _applyColor(war, row, lead.status);
  });

  // Also log some engine entries
  engine.appendRow(['', d(4), 'Ahmad Zulkifli', 'WhatsApp', 'Replied', 3, 'Hot', 'Skeleton script T3', 'Lead replied positively, asked for DSR check']);
  engine.appendRow(['', d(6), 'Siti Nurhaliza', 'Call', 'Appointment Set', 5, 'Appointment', 'Appt Locking T5', 'Viewing confirmed 25 Jun 3pm']);
  engine.appendRow(['', d(1), 'Lim Wei Cheng', 'WhatsApp', 'No Reply', 1, 'Cold', 'First Touch Skeleton', 'Message sent, awaiting reply']);
  engine.appendRow(['', d(14), 'Farah Abdullah', 'WhatsApp', 'Seen', 2, 'Warm', 'Ghost Revival S2', 'Seen but no reply — moved to Ghost']);

  // V4.1 FIX: Flush to ensure sheet recalculates before priority update
  SpreadsheetApp.flush();
  Utilities.sleep(500);

  // Recalculate all priorities
  for (let i = 0; i < leads.length; i++) {
    _updatePriority(war, 4 + i);
  }
  
  // V4.1 FIX: Flush again before sorting
  SpreadsheetApp.flush();
  Utilities.sleep(500);
  
  autoSortWarRoom();
  
  // V4.1 FIX: Re-apply colours after sort (sort moves explicit formatting, CF may not re-evaluate)
  const newLastRow = war.getLastRow();
  for (let r = 4; r <= Math.min(newLastRow, 4 + leads.length - 1); r++) {
    const st = war.getRange(r, COL.STATUS).getValue() || 'Cold';
    _applyColor(war, r, st);
  }

  ui.alert('✅ 6 sample leads loaded! Dashboard auto-refreshed.\n\nLeads:\n🔴 Ahmad Zulkifli (Hot)\n📅 Siti Nurhaliza (Appointment)\n🟡 Rajesh Kumar (Warm)\n🔵 Lim Wei Cheng (Cold)\n👻 Farah Abdullah (Ghost)\n💰 Amirul Hafiz (Closing)');
}

// V4.1 FIX: Clear demo data for easy testing
function clearDemoData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const war = ss.getSheetByName(SH.WAR);
  const engine = ss.getSheetByName(SH.ENGINE);
  const ui = SpreadsheetApp.getUi();
  const confirm = ui.alert('⚠️ Buang semua demo data? War Room & Engine akan dikosongkan.', ui.ButtonSet.YES_NO);
  if (confirm !== ui.Button.YES) return;

  const lastWar = war.getLastRow();
  if (lastWar >= 4) {
    // Clear values and reset formatting for data rows
    war.getRange(4, 1, lastWar - 3, 17).clearContent();
    war.getRange(4, 1, lastWar - 3, 17).setBackground(C.BG_DARK).setFontColor(C.TEXT).setFontSize(10).setFontWeight('normal');
  }

  const lastEngine = engine.getLastRow();
  if (lastEngine >= 4) {
    engine.getRange(4, 1, lastEngine - 3, 10).clearContent();
  }

  ui.alert('✅ Demo data cleared. War Room & Engine kosong.');
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION C: MENU (MAIN ENTRY POINT)
// ═══════════════════════════════════════════════════════════════════════════════

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🚀 Closing Desk')
    .addItem('📱 Send WA — Selected Lead', 'sendWhatsAppSelected')
    .addItem('📱⚡ Send WA — Top 5 Batch', 'sendBatchWhatsApp')
    .addItem('🔥⚡ Process All Hot Leads', 'processAllHotLeads')
    .addItem('📋 Preview Script (Sidebar)', 'previewScriptSidebar')
    .addItem('🧮 DSR Quick-Check', 'openDSRDialog')
    .addSeparator()
    .addItem('👻 Run Ghost Check Now', 'flagStaleLeads')
    .addItem('👻⚡ Queue All Ghosts', 'queueAllGhosts')
    .addItem('🔄 Re-Sort War Room', 'autoSortWarRoom')
    .addItem('📊 Refresh Dashboard', 'refreshDashboard')
    .addSeparator()
    .addItem('📥 Import Leads (CSV/Excel)', 'importLeadsDialog')
    .addItem('🎨 Format Selected Rows', 'formatSelectedRows')
    .addSeparator()
    .addItem('🔄 Sync Scripts from Toolkit', 'syncScriptsFromOutreachToolkit')
    .addItem('📜 Master SOP (Training)', 'openMasterSOP')
    .addToUi();
}

function openMasterSOP() {
  const url = 'https://docs.google.com/open?id=1wT3OAsDg05GcqZgA9vf1drUD7JEVGM2__SqYXzIa0xg';
  const html = HtmlService.createHtmlOutput('<script>window.open("'+url+'","_blank");google.script.host.close();<\/script>').setWidth(1).setHeight(1);
  SpreadsheetApp.getUi().showModalDialog(html, 'Opening Master SOP...');
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION D: SINGLE-LEAD OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

function sendWhatsAppSelected() {
  const war = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SH.WAR);
  const row = war.getActiveCell().getRow();
  if (row < 4) { SpreadsheetApp.getUi().alert('Klik pada row lead dulu.'); return; }
  const d = war.getRange(row, 1, 1, 17).getValues()[0];
  const rawNum = (d[COL.WANUM - 1] || '').toString().replace(/\D/g, '');
  if (!rawNum) { SpreadsheetApp.getUi().alert('WA number kosong!'); return; }
  const waNum = rawNum.startsWith('60') ? rawNum : '60' + rawNum.replace(/^0/, '');
  const status = d[COL.STATUS - 1] || 'Cold';
  const touch = Number(d[COL.TOUCH - 1]) || 1;
  const name = d[COL.NAME - 1] || '';
  const prop = d[COL.PROPERTY - 1] || '';
  const script = status === 'Ghost' ? _getGhostScript(Number(d[COL.DAYS_STALE - 1]) || 0, name, prop) : _getScript(status, touch, name, prop);
  const url = 'https://wa.me/' + waNum + '?text=' + encodeURIComponent(script);
  
  // V4.1 FIX: Log to Engine before opening WA
  _logEngine(war, row, status, status, 'WhatsApp Outbound', touch, script);
  
  war.getRange(row, COL.TOUCH).setValue(touch + 1);
  war.getRange(row, COL.LAST_CONTACT).setValue(new Date());
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput('<script>window.open("'+url+'","_blank");google.script.host.close();<\/script>').setWidth(1).setHeight(1), 'Opening WhatsApp...');
}

function previewScriptSidebar() {
  const war = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SH.WAR);
  const row = war.getActiveCell().getRow();
  if (row < 4) { SpreadsheetApp.getUi().alert('Klik pada row lead dulu.'); return; }
  const d = war.getRange(row, 1, 1, 17).getValues()[0];
  const status = d[COL.STATUS - 1] || 'Cold';
  const touch = Number(d[COL.TOUCH - 1]) || 1;
  const name = d[COL.NAME - 1] || '';
  const prop = d[COL.PROPERTY - 1] || '';
  const script = status === 'Ghost' ? _getGhostScript(Number(d[COL.DAYS_STALE - 1]) || 0, name, prop) : _getScript(status, touch, name, prop);
  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html><html><head><style>
      body { background:#0D0D0F; color:#E8E6DD; font-family:Arial,sans-serif; padding:20px; margin:0; }
      h3 { color:#C9A84C; margin:0 0 10px; }
      pre { background:#1C1D23; padding:15px; border-radius:8px; white-space:pre-wrap; font-size:13px; line-height:1.5; }
      button { background:#C9A84C; color:#111; border:none; padding:10px 18px; border-radius:6px; font-weight:bold; cursor:pointer; margin-top:10px; }
      button:hover { opacity:.9; }
    </style></head><body>
      <h3>📋 Script Preview — ${name}</h3>
      <pre id="script">${script.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>
      <button onclick="copy()">Copy Script</button>
      <script>function copy(){ navigator.clipboard.writeText(document.getElementById('script').innerText).then(()=>alert('Copied!')); }</script>
    </body></html>
  `).setWidth(380).setHeight(400).setTitle('Script Preview');
  SpreadsheetApp.getUi().showSidebar(html);
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION E: BATCH OPERATIONS (v4 Hybrid Additions)
// ═══════════════════════════════════════════════════════════════════════════════

function sendBatchWhatsApp() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt('📱⚡ Batch WhatsApp', 'Berapa lead nak hantar? (1-20, recommend 5):', ui.ButtonSet.OK_CANCEL);
  if (result.getSelectedButton() !== ui.Button.OK) return;
  const n = Math.min(Math.max(parseInt(result.getResponseText()) || 5, 1), 20);
  const war = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SH.WAR);
  const last = war.getLastRow();
  if (last < 4) { ui.alert('📭 Tiada lead dalam War Room.'); return; }
  autoSortWarRoom();
  const data = war.getRange(4, 1, Math.min(n, last - 3), 17).getValues();
  let links = [];
  data.forEach((row, i) => {
    if (!row[COL.NAME - 1]) return;
    const rawNum = (row[COL.WANUM - 1] || '').toString().replace(/\D/g, '');
    if (!rawNum) return;
    const waNum = rawNum.startsWith('60') ? rawNum : '60' + rawNum.replace(/^0/, '');
    const status = row[COL.STATUS - 1] || 'Cold';
    const touch = Number(row[COL.TOUCH - 1]) || 1;
    const name = row[COL.NAME - 1] || '';
    const prop = row[COL.PROPERTY - 1] || '';
    const script = status === 'Ghost' ? _getGhostScript(Number(row[COL.DAYS_STALE - 1]) || 0, name, prop) : _getScript(status, touch, name, prop);
    links.push({ name: name, url: 'https://wa.me/' + waNum + '?text=' + encodeURIComponent(script) });
    
    // V4.1 FIX: Log to Engine
    _logEngine(war, 4 + i, status, status, 'WhatsApp Batch', touch, script);
    
    war.getRange(4 + i, COL.TOUCH).setValue(touch + 1);
    war.getRange(4 + i, COL.LAST_CONTACT).setValue(new Date());
  });
  if (links.length === 0) { ui.alert('❌ Tiada lead dengan nombor WA yang sah.'); return; }
  const linksHtml = links.map(l => `<a class="link" href="${l.url}" target="_blank">📱 ${l.name}</a>`).join('');
  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html><html><head><style>
      body { background:#0D0D0F; color:#E8E6DD; font-family:Arial,sans-serif; padding:15px; margin:0; }
      h3 { color:#C9A84C; margin:0 0 10px; font-size:15px; }
      .link { display:block; background:#1C1D23; padding:10px; margin:5px 0; border-radius:6px; text-decoration:none; color:#C9A84C; font-size:13px; }
      .link:hover { background:#25262C; }
      .note { font-size:10px; color:#8B8A82; margin-top:10px; }
      .count { font-size:12px; color:#4CAF70; margin-bottom:8px; }
      button { background:#C9A84C; color:#111; border:none; padding:8px 14px; border-radius:6px; font-weight:bold; cursor:pointer; }
      button:hover { opacity:.9; }
    </style></head><body>
      <h3>📱 Batch WhatsApp (${links.length} leads)</h3>
      <div class="count">✅ Touch count & last contact dah auto-update</div>
      ${linksHtml}
      <p class="note">Click setiap link untuk buka WhatsApp.</p>
      <button onclick="google.script.host.close()">Tutup</button>
    </body></html>
  `).setWidth(360).setHeight(100 + links.length * 45).setTitle('Batch WhatsApp');
  ui.showModalDialog(html, 'Batch WhatsApp Ready');
  autoSortWarRoom();
}

function processAllHotLeads() {
  const war = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SH.WAR);
  const last = war.getLastRow();
  if (last < 4) { SpreadsheetApp.getUi().alert('📭 Tiada lead.'); return; }
  const data = war.getRange(4, 1, last - 3, 17).getValues();
  let hotLinks = [];
  data.forEach((row, i) => {
    if (row[COL.STATUS - 1] !== 'Hot') return;
    const rawNum = (row[COL.WANUM - 1] || '').toString().replace(/\D/g, '');
    if (!rawNum) return;
    const waNum = rawNum.startsWith('60') ? rawNum : '60' + rawNum.replace(/^0/, '');
    const touch = Number(row[COL.TOUCH - 1]) || 1;
    const name = row[COL.NAME - 1] || '';
    const prop = row[COL.PROPERTY - 1] || '';
    const script = _getScript('Hot', touch, name, prop);
    hotLinks.push({ name: name, url: 'https://wa.me/' + waNum + '?text=' + encodeURIComponent(script) });
    
    // V4.1 FIX: Log to Engine
    _logEngine(war, 4 + i, 'Hot', 'Hot', 'WhatsApp Hot Batch', touch, script);
    
    war.getRange(4 + i, COL.TOUCH).setValue(touch + 1);
    war.getRange(4 + i, COL.LAST_CONTACT).setValue(new Date());
  });
  if (hotLinks.length === 0) { SpreadsheetApp.getUi().alert('🔥 Tiada Hot leads untuk dihantar.'); return; }
  const linksHtml = hotLinks.map(l => `<a class="link" href="${l.url}" target="_blank">🔥 ${l.name}</a>`).join('');
  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html><html><head><style>
      body { background:#0D0D0F; color:#E8E6DD; font-family:Arial; padding:15px; margin:0; }
      h3 { color:#FF8080; margin:0 0 10px; }
      .link { display:block; background:#2D1515; padding:10px; margin:5px 0; border-radius:6px; text-decoration:none; color:#FF8080; font-size:13px; }
      .link:hover { background:#3D1010; }
      .note { font-size:10px; color:#8B8A82; margin-top:10px; }
    </style></head><body>
      <h3>🔥 Hot Leads Batch (${hotLinks.length})</h3>
      ${linksHtml}
      <p class="note">Click setiap link untuk buka WhatsApp. Ni leads yang paling panas — jangan tunggu!</p>
    </body></html>
  `).setWidth(360).setHeight(100 + hotLinks.length * 45).setTitle('Hot Leads');
  SpreadsheetApp.getUi().showModalDialog(html, '🔥 Hot Leads Ready');
  autoSortWarRoom();
}

function queueAllGhosts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const war = ss.getSheetByName(SH.WAR);
  const ghost = ss.getSheetByName(SH.GHOST);
  const last = war.getLastRow();
  if (last < 4) { SpreadsheetApp.getUi().alert('📭 Tiada lead.'); return; }
  const data = war.getRange(4, 1, last - 3, 17).getValues();
  const today = new Date(); let queued = 0; let alreadyGhost = 0; let alreadyQueued = 0;
  
  // V4.1 FIX: Build set of existing lead IDs in Ghost Revival to prevent duplicates
  const ghostLast = ghost.getLastRow();
  const existingGhostIds = new Set();
  if (ghostLast > 3) {
    const ghostIds = ghost.getRange(4, 2, ghostLast - 3, 1).getValues();
    ghostIds.forEach(r => { if (r[0]) existingGhostIds.add(r[0].toString()); });
  }
  
  data.forEach((row, i) => {
    const r = i + 4; const st = row[COL.STATUS - 1]; const lc = row[COL.LAST_CONTACT - 1];
    if (['Closing', ''].includes(st) || !row[COL.NAME - 1] || !lc) return;
    const days = Math.floor((today - new Date(lc)) / 86400000);
    if (days >= 7) {
      const leadId = row[COL.LEAD_ID - 1] || '';
      if (st !== 'Ghost') { 
        war.getRange(r, COL.STATUS).setValue('Ghost'); 
        _applyColor(war, r, 'Ghost'); 
      } else { 
        alreadyGhost++; 
      }
      
      // V4.1 FIX: Skip if already in Ghost Revival
      if (leadId && existingGhostIds.has(leadId.toString())) {
        alreadyQueued++;
        return;
      }
      
      const stage = GHOST_STAGE_MAP.find(s => days <= s.max).stage;
      const brain = ss.getSheetByName(SH.BRAIN); let script = '';
      try { script = brain.getRange(13 + stage, 2).getValue(); } catch(e) {}
      const fn = (row[COL.NAME - 1] || '').split(' ').pop(); const prop = row[COL.PROPERTY - 1] || '';
      script = script.replace(/\{name\}/gi, fn).replace(/\{property\}/gi, prop);
      ghost.appendRow(['', leadId, row[COL.NAME - 1], row[COL.WANUM - 1], prop, lc, days, stage, script, 'Pending', 'Auto-queued by batch']);
      queued++;
    }
  });
  autoSortWarRoom();
  const msg = `👻 ${queued} lead(s) queued!\n${alreadyGhost > 0 ? `(${alreadyGhost} already Ghost)` : ''}\n${alreadyQueued > 0 ? `(${alreadyQueued} already in Ghost Revival)` : ''}\n\nSemak Ghost Revival tab untuk hantar.`;
  SpreadsheetApp.getUi().alert(msg);
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION F: SYNC & TOOLKIT
// ═══════════════════════════════════════════════════════════════════════════════

function syncScriptsFromOutreachToolkit() {
  const doc = DocumentApp.openById(TOOLKIT_DOC_ID); const body = doc.getBody(); const paras = body.getParagraphs();
  const funnelMap = { 'FUNNEL 1:': 'Cold', 'FUNNEL 2:': 'Warm', 'FUNNEL 3:': 'Ghost', 'FUNNEL 4:': 'Hot', 'FUNNEL 5:': 'Appointment', 'FUNNEL 6:': 'Closing' };
  const scriptsByFunnel = {}; let currentFunnel = null; let collecting = false; let scriptLines = [];
  paras.forEach(p => {
    const text = p.getText().trim(); const heading = p.getHeading();
    if (heading === DocumentApp.ParagraphHeading.HEADING1) {
      if (currentFunnel && scriptLines.length) { if (!scriptsByFunnel[currentFunnel]) scriptsByFunnel[currentFunnel] = []; scriptsByFunnel[currentFunnel].push(scriptLines.join('\n')); scriptLines = []; }
      const match = Object.keys(funnelMap).find(k => text.toUpperCase().startsWith(k));
      currentFunnel = match ? funnelMap[match] : null; collecting = false; return;
    }
    if (heading === DocumentApp.ParagraphHeading.HEADING3) {
      if (currentFunnel && scriptLines.length) { if (!scriptsByFunnel[currentFunnel]) scriptsByFunnel[currentFunnel] = []; scriptsByFunnel[currentFunnel].push(scriptLines.join('\n')); scriptLines = []; }
      if (currentFunnel) collecting = true; return;
    }
    if (collecting && heading === DocumentApp.ParagraphHeading.NORMAL && text !== '') scriptLines.push(text);
  });
  if (currentFunnel && scriptLines.length) { if (!scriptsByFunnel[currentFunnel]) scriptsByFunnel[currentFunnel] = []; scriptsByFunnel[currentFunnel].push(scriptLines.join('\n')); }
  const brain = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SH.BRAIN);
  const statusRows = { Cold: 6, Warm: 7, Hot: 8, Appointment: 9, Closing: 10 };
  Object.entries(statusRows).forEach(([status, row]) => { const touches = scriptsByFunnel[status] || []; for (let t = 1; t <= 7; t++) { brain.getRange(row, t + 1).setValue(touches[t - 1] || (touches.length ? touches[touches.length - 1] : '—')); } });
  const ghostTouches = scriptsByFunnel['Ghost'] || []; for (let stage = 1; stage <= 7; stage++) { brain.getRange(13 + stage, 2).setValue(ghostTouches[stage - 1] || (ghostTouches.length ? ghostTouches[ghostTouches.length - 1] : '—')); }
  SpreadsheetApp.getUi().alert('✅ Toolkit synced! Semua skrip dikemaskini.');
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION G: GHOST REVIVAL ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

function flagStaleLeads() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const war = ss.getSheetByName(SH.WAR); const ghost = ss.getSheetByName(SH.GHOST);
  const last = war.getLastRow(); if (last < 4) return;
  const data = war.getRange(4, 1, last - 3, 17).getValues(); const today = new Date(); let n = 0;
  
  // V4.1 FIX: Build set of existing lead IDs in Ghost Revival to prevent duplicates
  const ghostLast = ghost.getLastRow();
  const existingGhostIds = new Set();
  if (ghostLast > 3) {
    const ghostIds = ghost.getRange(4, 2, ghostLast - 3, 1).getValues();
    ghostIds.forEach(r => { if (r[0]) existingGhostIds.add(r[0].toString()); });
  }
  
  data.forEach((row, i) => {
    const r = i + 4; const st = row[COL.STATUS - 1]; const lc = row[COL.LAST_CONTACT - 1];
    if (['Closing', 'Ghost', ''].includes(st) || !row[COL.NAME - 1] || !lc) return;
    const days = Math.floor((today - new Date(lc)) / 86400000);
    if (days >= 7) {
      const leadId = row[COL.LEAD_ID - 1] || '';
      war.getRange(r, COL.STATUS).setValue('Ghost'); _applyColor(war, r, 'Ghost');
      
      // V4.1 FIX: Skip if already in Ghost Revival
      if (leadId && existingGhostIds.has(leadId.toString())) return;
      
      const stage = GHOST_STAGE_MAP.find(s => days <= s.max).stage;
      const brain = ss.getSheetByName(SH.BRAIN); let script = '';
      try { script = brain.getRange(13 + stage, 2).getValue(); } catch (e) {}
      const fn = (row[COL.NAME - 1] || '').split(' ').pop(); const prop = row[COL.PROPERTY - 1] || '';
      script = script.replace(/\{name\}/gi, fn).replace(/\{property\}/gi, prop);
      ghost.appendRow(['', leadId, row[COL.NAME - 1], row[COL.WANUM - 1], prop, lc, days, stage, script, 'Pending', '']);
      n++;
    }
  });
  autoSortWarRoom();
  if (n > 0) SpreadsheetApp.getUi().alert(`👻 ${n} lead(s) jadi Ghost! Semak Ghost Revival tab.`); else SpreadsheetApp.getUi().alert('✅ Tiada ghost baru.');
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION H: UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function autoSortWarRoom() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SH.WAR);
  const last = sh.getLastRow(); if (last < 5) return;
  sh.getRange(4, 1, last - 3, 17).sort({ column: COL.PRIORITY, ascending: false });
  // V4.1 FIX: Re-apply explicit colours after sort (CF may not re-evaluate after programmatic sort)
  for (let r = 4; r <= last; r++) {
    const status = sh.getRange(r, COL.STATUS).getValue();
    if (status) _applyColor(sh, r, status);
  }
}

function _updatePriority(sheet, row) {
  try {
    const d = sheet.getRange(row, 1, 1, 17).getValues()[0];
    const lc = d[COL.LAST_CONTACT - 1]; const status = d[COL.STATUS - 1] || 'Cold';
    // V4.1 FIX: Defensive date handling — prevent NaN
    let days = 30;
    if (lc && lc instanceof Date && !isNaN(lc.getTime())) {
      days = Math.floor((new Date() - lc) / 86400000);
    }
    // V4.1 FIX: Was COL.PRIICE (typo) — now COL.PRICE
    const price = Number(d[COL.PRICE - 1]) || 0;
    const baseScore = STATUS_PRIORITY_MAP[status] || 10;
    const priceScore = Math.min(35, price / 2000000 * 35);
    const freshnessScore = Math.max(0, 25 - days);
    const total = Math.min(100, Math.round(baseScore + priceScore + freshnessScore));
    sheet.getRange(row, COL.PRIORITY).setValue(isNaN(total) ? 10 : total).setFontSize(12).setFontWeight('bold').setHorizontalAlignment('center');
  } catch (e) {
    // Fallback: set default priority if anything fails
    sheet.getRange(row, COL.PRIORITY).setValue(10).setFontSize(12).setFontWeight('bold').setHorizontalAlignment('center');
  }
}

function _applyColor(sheet, row, status) {
  const t = { Hot: { bg: C.HOT_BG, f: C.HOT_FG }, Appointment: { bg: C.APPT_BG, f: C.APPT_FG }, Closing: { bg: C.CLOSING_BG, f: C.CLOSING_FG }, Warm: { bg: C.WARM_BG, f: C.WARM_FG }, Cold: { bg: C.COLD_BG, f: C.COLD_FG }, Ghost: { bg: C.GHOST_BG, f: C.GHOST_FG } }[status] || { bg: C.COLD_BG, f: C.COLD_FG };
  // V4.1 FIX: Cover all 16 data columns (B through Q), not just 15
  sheet.getRange(row, COL.LEAD_ID, 1, 16).setBackground(t.bg).setFontColor(t.f);
}

// V4.1 FIX: Updated _logEngine signature to include channel, touch, script
function _logEngine(warSheet, row, oldSt, newSt, channel, touch, script) {
  const engine = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SH.ENGINE);
  const d = warSheet.getRange(row, 1, 1, 17).getValues()[0];
  const statusLabel = oldSt === newSt ? newSt : `${oldSt || '—'} → ${newSt}`;
  engine.appendRow(['', new Date(), d[COL.NAME - 1], channel || 'Status Change', 'Status Updated', touch || d[COL.TOUCH - 1], newSt, script ? script.substring(0, 100) : statusLabel, `Auto-logged` ]);
}

function _getScript(status, touch, name, prop) {
  try {
    const brain = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SH.BRAIN);
    const rm = { Cold: 6, Warm: 7, Hot: 8, Appointment: 9, Closing: 10 };
    const sRow = rm[status] || 6; const sCol = Math.min(Math.max(touch, 1), 7) + 1;
    let s = brain.getRange(sRow, sCol).getValue() || '';
    const fn = name.split(' ').pop();
    return s.replace(/\{name\}/gi, fn).replace(/\{property\}/gi, prop);
  } catch (e) { return `Hi ${name.split(' ').pop()}! Nak follow up pasal ${prop}.`; }
}

function _getGhostScript(daysStale, name, prop) {
  const stage = GHOST_STAGE_MAP.find(s => (daysStale || 0) <= s.max).stage;
  const brain = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SH.BRAIN);
  let script = ''; try { script = brain.getRange(13 + stage, 2).getValue(); } catch (e) {}
  const fn = name.split(' ').pop();
  return (script || 'Hi {name}, masih interested dengan {property}?').replace(/\{name\}/gi, fn).replace(/\{property\}/gi, prop);
}

function onEditCascade(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getName() !== SH.WAR || e.range.getRow() < 4) return;
  
  const startRow = e.range.getRow();
  const endRow = e.range.getLastRow();
  if (startRow < 4) return;
  
  // V4.1 FIX: Handle bulk paste — loop through ALL affected rows, not just the first cell
  for (let r = startRow; r <= endRow; r++) {
    const d = sheet.getRange(r, 1, 1, 17).getValues()[0];
    const status = d[COL.STATUS - 1] || 'Cold';
    
    // Skip empty rows (no name = no lead)
    if (!d[COL.NAME - 1]) continue;
    
    // Calculate priority and apply colour for every row
    _updatePriority(sheet, r);
    _applyColor(sheet, r, status);
  }
  
  Utilities.sleep(200);
  autoSortWarRoom();
}

function refreshDashboard() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SH.DASH);
  sh.getRange('G3').setValue('Last refresh: ' + Utilities.formatDate(new Date(), 'Asia/Kuala_Lumpur', 'd MMM h:mm a')).setFontSize(8).setFontColor(C.MUTED);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION H1: BULK IMPORT & FORMAT REPAIR (V4.1 Stress-Tested)
// ═══════════════════════════════════════════════════════════════════════════════

function formatSelectedRows() {
  const war = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SH.WAR);
  const selection = war.getActiveRange();
  const startRow = selection.getRow();
  const endRow = selection.getLastRow();
  
  if (startRow < 4) {
    SpreadsheetApp.getUi().alert('Pilih row bermula dari row 4 ke bawah.');
    return;
  }
  
  let formatted = 0;
  for (let r = startRow; r <= endRow; r++) {
    const name = war.getRange(r, COL.NAME).getValue();
    if (!name) continue;
    const status = war.getRange(r, COL.STATUS).getValue() || 'Cold';
    _applyColor(war, r, status);
    _updatePriority(war, r);
    formatted++;
  }
  
  autoSortWarRoom();
  SpreadsheetApp.getUi().alert(`✅ ${formatted} row(s) dah repair colour + priority, then auto-sorted!`);
}

function importLeadsDialog() {
  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { background:#0D0D0F; color:#E8E6DD; font-family:Arial; padding:18px; margin:0; }
        h3 { color:#C9A84C; margin:0 0 12px; font-size:14px; border-bottom:1px solid #25262C; padding-bottom:8px; }
        label { display:block; font-size:10px; color:#8B8A82; margin-bottom:4px; text-transform:uppercase; margin-top:10px; }
        textarea { width:100%; height:200px; background:#1C1D23; border:1px solid #25262C; color:#E8E6DD; padding:10px; border-radius:6px; font-size:12px; font-family:monospace; outline:none; resize:vertical; }
        textarea:focus { border-color:#C9A84C; }
        .hint { font-size:10px; color:#6A9AB0; margin-top:4px; line-height:1.5; }
        button { background:#C9A84C; color:#111; border:none; padding:10px; width:100%; border-radius:6px; font-size:12px; font-weight:bold; cursor:pointer; margin-top:14px; }
        button:hover { opacity:.88; }
        #r { margin-top:14px; padding:12px; background:#1C1D23; border-radius:8px; display:none; border:1px solid #25262C; font-size:12px; }
        .ok { color:#4CAF70; } .err { color:#E24B4A; }
        .row { margin-bottom:6px; }
      </style>
    </head>
    <body>
      <h3>📥 Import Leads from CSV/Excel</h3>
      <label>Paste data here</label>
      <textarea id="csv" placeholder="Name | WhatsApp | Property | Price | Status
Ahmad Zulkifli | 0123456789 | Taman Klang | 850000 | Hot
Siti Nurhaliza | 0138765432 | Butterworth | 420000 | Warm"></textarea>
      <div class="hint">
        <div class="row">✅ Supported: Comma, Tab, or Pipe separated</div>
        <div class="row">✅ With or without header row (auto-detect)</div>
        <div class="row">✅ Status optional — defaults to Cold</div>
        <div class="row">✅ Minimum: Name + WhatsApp number</div>
      </div>
      <button onclick="go()">Import Now</button>
      <div id="r"></div>
      <script>
        function go() {
          const raw = document.getElementById('csv').value.trim();
          if (!raw) { alert('Paste data dulu bro'); return; }
          const btn = document.querySelector('button');
          btn.textContent = 'Importing...';
          btn.disabled = true;
          google.script.run
            .withSuccessHandler(function(res) {
              const el = document.getElementById('r');
              el.innerHTML = '<span class="ok">✅ ' + res + '</span>';
              el.style.display = 'block';
              btn.textContent = 'Import Now';
              btn.disabled = false;
            })
            .withFailureHandler(function(err) {
              const el = document.getElementById('r');
              el.innerHTML = '<span class="err">❌ ' + err.message + '</span>';
              el.style.display = 'block';
              btn.textContent = 'Import Now';
              btn.disabled = false;
            })
            .importLeadsFromCSV(raw);
        }
      </script>
    </body>
    </html>
  `).setWidth(460).setHeight(440).setTitle('Import Leads');
  SpreadsheetApp.getUi().showModalDialog(html, '📥 Import Leads');
}

function importLeadsFromCSV(rawText) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const war = ss.getSheetByName(SH.WAR);
  
  const lines = rawText.split('\n').filter(l => l.trim());
  if (lines.length < 1) throw new Error('Tiada data. Paste sekurang-kurangnya 1 row.');
  
  // Detect delimiter
  const firstLine = lines[0];
  let delimiter = ',';
  const tabs = (firstLine.match(/\t/g) || []).length;
  const pipes = (firstLine.match(/\|/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  if (tabs > commas && tabs > pipes) delimiter = '\t';
  else if (pipes > commas && pipes > tabs) delimiter = '|';
  
  // Parse first line to detect header
  const firstCells = firstLine.split(delimiter).map(c => c.trim());
  const isHeader = firstCells.some(c => {
    const lower = c.toLowerCase();
    return lower.includes('name') || lower.includes('nama') || lower.includes('wa') || lower.includes('phone') || lower.includes('property') || lower.includes('status') || lower.includes('harga') || lower.includes('price');
  });
  
  let idxName = 0, idxWA = 1, idxProp = 2, idxPrice = 3, idxStatus = 4;
  
  if (isHeader) {
    const headers = firstCells.map(h => h.toLowerCase());
    idxName = headers.findIndex(h => h.includes('name') || h.includes('nama'));
    idxWA = headers.findIndex(h => h.includes('wa') || h.includes('phone') || h.includes('nombor') || h.includes('hp') || h.includes('whatsapp'));
    idxProp = headers.findIndex(h => h.includes('property') || h.includes('rumah') || h.includes('projek') || h.includes('lokasi') || h.includes('area'));
    idxPrice = headers.findIndex(h => h.includes('price') || h.includes('harga') || h.includes('budget'));
    idxStatus = headers.findIndex(h => h.includes('status'));
    
    if (idxName < 0) idxName = 0;
    if (idxWA < 0) idxWA = 1;
    if (idxProp < 0) idxProp = 2;
    if (idxPrice < 0) idxPrice = 3;
    if (idxStatus < 0) idxStatus = 4;
  }
  
  const dataStart = isHeader ? 1 : 0;
  const warLast = war.getLastRow();
  const startRow = warLast < 4 ? 4 : warLast + 1;
  
  let imported = 0;
  
  for (let i = dataStart; i < lines.length; i++) {
    const cells = lines[i].split(delimiter).map(c => c.trim());
    if (cells.length < 2) continue;
    
    const name = cells[idxName] || '';
    const wa = cells[idxWA] || '';
    if (!name || !wa) continue; // Skip rows without name or WA
    
    const prop = cells[idxProp] || '';
    const priceRaw = cells[idxPrice] || '0';
    const price = Number(priceRaw.replace(/[^0-9.]/g, '')) || 0;
    let status = (cells[idxStatus] || 'Cold').trim();
    if (!['Cold','Warm','Hot','Appointment','Closing','Ghost'].includes(status)) status = 'Cold';
    
    const row = startRow + imported;
    if (row > 153) break;
    
    // Clear existing formatting first (prevent old colours from sticking)
    war.getRange(row, 1, 1, 17).setBackground(C.BG_DARK).setFontColor(C.TEXT).setFontSize(10).setFontWeight('normal');
    
    war.getRange(row, COL.NAME).setValue(name);
    war.getRange(row, COL.WANUM).setValue(wa);
    war.getRange(row, COL.PROPERTY).setValue(prop);
    war.getRange(row, COL.PRICE).setValue(price);
    war.getRange(row, COL.STATUS).setValue(status);
    war.getRange(row, COL.TOUCH).setValue(1);
    war.getRange(row, COL.LAST_CONTACT).setValue(new Date());
    
    // Apply formatting immediately
    _applyColor(war, row, status);
    _updatePriority(war, row);
    
    imported++;
  }
  
  if (imported > 0) {
    SpreadsheetApp.flush();
    Utilities.sleep(500);
    autoSortWarRoom();
  }
  
  return `${imported} lead(s) imported, formatted, and sorted!`;
}

function openDSRDialog() {
  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html><html><head><style>
      *{box-sizing:border-box;margin:0;padding:0;font-family:Arial,sans-serif}
      body{background:#0D0D0F;color:#E8E6DD;padding:18px}
      h3{color:#C9A84C;font-size:14px;margin-bottom:14px;border-bottom:1px solid #25262C;padding-bottom:8px}
      label{display:block;font-size:10px;color:#8B8A82;margin-bottom:4px;text-transform:uppercase;margin-top:10px}
      input{width:100%;background:#1C1D23;border:1px solid #25262C;color:#E8E6DD;padding:9px 12px;border-radius:6px;font-size:13px;outline:none}
      input:focus{border-color:#C9A84C}
      .g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      button{background:#C9A84C;color:#111;border:none;padding:10px;width:100%;border-radius:6px;font-size:12px;font-weight:bold;cursor:pointer;margin-top:14px}
      button:hover{opacity:.88}
      #r{margin-top:14px;padding:12px;background:#1C1D23;border-radius:8px;display:none;border:1px solid #25262C}
      .ln{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #25262C;font-size:12px}
      .ln:last-child{border:none}
      .ok{color:#4CAF70;font-weight:bold}.wn{color:#EF9F27;font-weight:bold}.bd{color:#E24B4A;font-weight:bold}
      #vd{margin-top:10px;font-size:13px;font-weight:bold;text-align:center;padding:8px;border-radius:6px}
    </style></head><body>
    <h3>🧮 DSR Quick-Check</h3>
    <div class="g2"><div><label>Gross Monthly Income (RM)</label><input type="number" id="inc" value="8000"></div><div><label>Existing Commitments/mo (RM)</label><input type="number" id="com" value="1500"></div></div>
    <div class="g2"><div><label>Loan Amount (RM)</label><input type="number" id="lon" value="600000"></div><div><label>Tenure (years)</label><input type="number" id="ten" value="35"></div></div>
    <button onclick="go()">Calculate Now</button>
    <div id="r"><div class="ln"><span>Monthly Installment</span><span id="ins"></span></div><div class="ln"><span>Total Commitment</span><span id="tot"></span></div><div class="ln"><span>DSR %</span><span id="dsr"></span></div><div class="ln"><span>Max Loan Eligible</span><span id="mx"></span></div><div id="vd"></div></div>
    <script>
      function go(){
        const i=+document.getElementById('inc').value,c=+document.getElementById('com').value,l=+document.getElementById('lon').value,t=+document.getElementById('ten').value;
        const r=(4.5/100)/12,n=t*12,M=l*(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);
        const tot=c+M,dsr=(tot/i)*100,mx=(i*0.7-c)/(r*Math.pow(1+r,n))*(Math.pow(1+r,n)-1);
        const fmt=v=>'RM '+Math.round(v).toLocaleString(),d=Math.round(dsr*10)/10;
        const cl=d<=60?'ok':d<=70?'wn':'bd';
        const v=d<=60?'✅ Strong — Boleh proceed!':d<=70?'⚠️ Borderline — Risky':'❌ Over DSR — Need co-borrower';
        document.getElementById('ins').textContent=fmt(M)+'/mo'; document.getElementById('tot').textContent=fmt(tot)+'/mo';
        document.getElementById('dsr').innerHTML='<span class="'+cl+'">'+d+'%</span>'; document.getElementById('mx').textContent=fmt(mx);
        const vd=document.getElementById('vd');vd.textContent=v;vd.className=cl; document.getElementById('r').style.display='block';
      }
    </script></body></html>
  `).setWidth(380).setHeight(460).setTitle('DSR Quick-Check');
  SpreadsheetApp.getUi().showModalDialog(html, '🧮 DSR Quick-Check');
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION I: PYTHON BACKEND COMPANION (config notes for IT)
// ═══════════════════════════════════════════════════════════════════════════════
// This Apps Script works with Python backend (GitHub Actions) that runs daily.
// The backend reads this sheet via Google Sheets API, calculates advanced priority
// scores, detects ghost stages, and writes back PRIORITY / NEXT_ACTION / GHOST_STAGE.
//
// Backend repo: https://github.com/Zkoroci10/ariff-war-room-pro
// Backend file: war_room_v4_backend.py
// Config file:  config_hybrid.py
// Workflow:     .github/workflows/backend.yml (runs 5 AM MYT daily)
//
// To add a new client: File → Make a copy → paste leads → copy spreadsheet ID
// → add to config_hybrid.py → push to GitHub. Zero code changes needed here.
// ═══════════════════════════════════════════════════════════════════════════════
