/**
 * ============================================================================
 * AE SURVEY (Enterprise Field & Cloud Survey Platform for Agri Experience Limited)
 * Google Apps Script (GAS) Backend & Google Sheets Database Engine
 * ============================================================================
 *
 * HOW TO DEPLOY:
 * 1. Open a new or existing Google Sheet (https://sheets.new).
 * 2. Go to Extensions -> Apps Script.
 * 3. Paste this entire file into `Code.gs` and press Ctrl+S (Save).
 * 4. Click "Deploy" -> "New deployment".
 * 5. Select type: "Web app".
 *    - Description: "AE Survey Cloud Sync API v1"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (required for CORS-free offline PWA sync)
 * 6. Click "Deploy", authorize permissions, and copy the Web App URL
 *    (`https://script.google.com/macros/s/.../exec`).
 * 7. Paste the Web App URL into AE Survey -> "Google Sheets Sync" settings!
 * ============================================================================
 */

var DB_CONFIG = {
  APP_NAME: 'AE Survey — Agri Experience Limited',
  VERSION: '3.1.0',
  MAX_BATCH_ITEMS: 500,
  MAX_CELL_LENGTH: 32000,
  SHEETS: {
    SURVEYS: 'Surveys',
    RESPONSES: 'Responses',
    COLLECTORS: 'Collectors',
    PERSONNEL: 'Personnel',
    SYNC_LOG: 'SyncLog'
  },
  BRAND_HEADER_BG: '#0B2B1E',
  BRAND_HEADER_FG: '#FFFFFF',
  SURVEY_TAB_HEADER_BG: '#007A4B'
};

/**
 * Neutralizes spreadsheet formula injection (CWE-1236) in Google Sheets cells.
 * Preserves valid finite numbers (such as negative Southern Hemisphere latitudes
 * like -0.3031) while prefixing untrusted strings starting with =, +, -, @, \t, \r
 * with a leading apostrophe (').
 */
function sanitizeSheetCell_(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number' || typeof val === 'boolean') return val;
  var str = String(val);
  if (str.length > DB_CONFIG.MAX_CELL_LENGTH) {
    str = str.substring(0, DB_CONFIG.MAX_CELL_LENGTH);
  }
  var trimmed = str.trim();
  // Safe numbers (e.g. negative GPS coordinates like -0.303100)
  if (trimmed !== '' && !isNaN(Number(trimmed)) && isFinite(Number(trimmed))) {
    return str;
  }
  // Neutralize formula triggers: =, +, -, @, |, %, tab, newline, carriage return, or unicode fullwidth ＝
  if (/^[=+\-@|%\t\r\n\uFF1D]/.test(trimmed) || /^[\s\t\r\n]+[=+\-@|%]/.test(str)) {
    return "'" + str.replace(/^'+/, ''); // Prevent quote-stripping bypasses
  }
  return str;
}

/**
 * Optional Script Property token verification (CWE-306 defense-in-depth).
 * If the administrator sets `AE_SYNC_TOKEN` in Project Settings -> Script Properties,
 * all GET/POST requests must supply a matching `syncToken` parameter or payload field.
 */
function verifySyncToken_(candidateToken) {
  var configuredToken = '';
  try {
    configuredToken = PropertiesService.getScriptProperties().getProperty('AE_SYNC_TOKEN') || '';
  } catch (e) {
    configuredToken = '';
  }
  if (!configuredToken) return true;
  var a = String(candidateToken || '');
  var b = String(configuredToken);
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Role-Based Access Control (RBAC) Verification
 * Validates caller identity against the Personnel sheet or built-in seed admins.
 */
function isCallerAdmin_(callerId) {
  if (!callerId) return false;
  var safeId = String(callerId).trim();
  if (safeId === 'ADM-01' || safeId === 'ADM-02') {
    return true;
  }
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(DB_CONFIG.SHEETS.PERSONNEL);
    if (!sheet) return false;
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      var rowId = String(data[i][0] || '').trim();
      var role = String(data[i][2] || '').trim().toLowerCase();
      var active = data[i][7];
      if (rowId === safeId) {
        var isActive = active === true || active === 'TRUE' || active === 1 || String(active).toLowerCase() === 'true';
        return role === 'admin' && isActive;
      }
    }
  } catch (e) {}
  return false;
}

/**
 * Checks whether the caller has administrative rights either via a valid AE_SYNC_TOKEN
 * or via verified personnel ID.
 */
function isAuthorizedAdmin_(callerId, syncToken) {
  if (verifySyncToken_(syncToken)) {
    return true;
  }
  return isCallerAdmin_(callerId);
}

/**
 * Handles HTTP GET requests.
 * Supports:
 * - ?action=ping       -> Health check & spreadsheet metadata
 * - ?action=pullAll    -> Returns all surveys, collectors, and responses
 * - Default (no param) -> Serves HTML web app if `index.html` is in GAS project,
 *                         otherwise returns JSON API status.
 */
function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  var action = params.action || '';

  try {
    if (!verifySyncToken_(params.syncToken || '')) {
      return jsonResponse_({
        ok: false,
        error: 'Unauthorized: Invalid or missing AE_SYNC_TOKEN.'
      });
    }

    ensureDatabaseInitialized_();

    if (action === 'ping') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      return jsonResponse_({
        ok: true,
        service: DB_CONFIG.APP_NAME,
        version: DB_CONFIG.VERSION,
        spreadsheetName: ss.getName(),
        serverTime: new Date().toISOString(),
        counts: getRowCounts_()
      });
    }

    if (action === 'pullAll') {
      var data = readAllDatabaseData_();
      logSyncEvent_('PULL_ALL', sanitizeSheetCell_(params.deviceId || 'web-client'), data.surveys.length, data.responses.length, 0, 'OK');
      return jsonResponse_({
        ok: true,
        serverTime: new Date().toISOString(),
        surveys: data.surveys,
        collectors: data.collectors,
        responses: data.responses,
        personnel: data.personnel
      });
    }

    if (action === 'pullPersonnel') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var personnel = readPersonnelRows_(ss);
      logSyncEvent_('PULL_PERSONNEL', sanitizeSheetCell_(params.deviceId || 'web-client'), 0, 0, 0, 'OK');
      return jsonResponse_({
        ok: true,
        serverTime: new Date().toISOString(),
        personnel: personnel
      });
    }

    if (action === 'migrate') {
      var migResult = migrateResponsesSheetLayout_();
      return jsonResponse_({
        ok: true,
        action: 'migrate',
        result: migResult,
        serverTime: new Date().toISOString()
      });
    }

    // Optional: if hosted inside Apps Script HtmlService with an index.html file
    if (!action && params.mode === 'ui') {
      return HtmlService.createHtmlOutputFromFile('index')
        .setTitle('AE Survey — Agri Experience Limited')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    }

    return jsonResponse_({
      ok: true,
      service: DB_CONFIG.APP_NAME,
      version: DB_CONFIG.VERSION,
      message: 'AE Survey GAS Backend is online. Use ?action=ping, ?action=pullAll, or POST JSON with text/plain;charset=utf-8.',
      counts: getRowCounts_()
    });
  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: 'Request processing failed.'
    });
  }
}

/**
 * Handles HTTP POST requests.
 * NOTE: Client sends `Content-Type: text/plain;charset=utf-8` so browsers treat
 * the request as a CORS Simple Request without an OPTIONS preflight block.
 *
 * Supported payload.action values:
 * - "BATCH_SYNC"       -> Upserts surveys, collectors, and deduplicated responses
 * - "UPSERT_SURVEY"    -> Creates or updates a single survey + provisions its sheet tab
 * - "SUBMIT_RESPONSE"  -> Appends a single response (idempotent via clientResponseId)
 * - "UPSERT_COLLECTOR" -> Creates or updates a collector
 * - "DELETE_SURVEY"    -> Deletes a survey row by ID
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(25000);

  try {
    if (e && e.postData && e.postData.contents && e.postData.contents.length > 5 * 1024 * 1024) {
      return jsonResponse_({
        ok: false,
        error: 'Payload size exceeds 5MB limit.'
      });
    }

    var rawBody = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var payload = JSON.parse(rawBody);

    if (!verifySyncToken_(payload.syncToken || (e && e.parameter && e.parameter.syncToken) || '')) {
      return jsonResponse_({
        ok: false,
        error: 'Unauthorized: Invalid or missing AE_SYNC_TOKEN.'
      });
    }

    var action = String(payload.action || 'BATCH_SYNC');
    var deviceId = sanitizeSheetCell_(payload.deviceId || 'unknown-device');

    // Sliding-window rate limit guard (max 60 sync operations per minute per device)
    try {
      var cache = CacheService.getScriptCache();
      var rateKey = 'rate_' + String(deviceId).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
      var count = Number(cache.get(rateKey) || 0);
      if (count > 60) {
        return jsonResponse_({ ok: false, error: 'Rate limit exceeded: Too many requests in 60s window.' });
      }
      cache.put(rateKey, String(count + 1), 60);
    } catch (cacheErr) {}

    ensureDatabaseInitialized_();

    // Media Upload Endpoint -> Google Drive
    if (action === 'UPLOAD_MEDIA' && payload.mediaItem) {
      var driveUrl = saveMediaFileToDrive_(payload.mediaItem);
      logSyncEvent_('UPLOAD_MEDIA', deviceId, 0, 0, 0, driveUrl ? 'OK' : 'FAIL');
      return jsonResponse_({
        ok: Boolean(driveUrl),
        driveUrl: driveUrl,
        mediaId: payload.mediaItem.id || '',
        serverTime: new Date().toISOString()
      });
    }

    var clientSyncToken = payload.syncToken || (e && e.parameter && e.parameter.syncToken) || '';

    if (action === 'UPSERT_SURVEY' && payload.survey) {
      if (!isAuthorizedAdmin_(payload.callerId, clientSyncToken)) {
        return jsonResponse_({ ok: false, error: 'Unauthorized: Action requires Admin role.' }, 403);
      }
      upsertSurveyRow_(payload.survey);
      syncSurveyDedicatedSheetHeader_(payload.survey);
      logSyncEvent_('UPSERT_SURVEY', deviceId, 1, 0, 0, 'OK');
      return jsonResponse_({
        ok: true,
        action: action,
        surveyId: String(payload.survey.id || ''),
        serverTime: new Date().toISOString()
      });
    }

    if (action === 'UPSERT_COLLECTOR' && payload.collector) {
      upsertCollectorRow_(payload.collector);
      logSyncEvent_('UPSERT_COLLECTOR', deviceId, 0, 0, 0, 'OK');
      return jsonResponse_({
        ok: true,
        action: action,
        collectorId: String(payload.collector.id || ''),
        serverTime: new Date().toISOString()
      });
    }

    if (action === 'UPSERT_PERSONNEL' && payload.personnel) {
      var isSelf = payload.callerId && String(payload.callerId).trim() === String(payload.personnel.id || '').trim();
      if (!isAuthorizedAdmin_(payload.callerId, clientSyncToken) && !isSelf) {
        return jsonResponse_({ ok: false, error: 'Unauthorized: Action requires Admin role or account ownership.' }, 403);
      }
      upsertPersonnelRow_(payload.personnel);
      logSyncEvent_('UPSERT_PERSONNEL', deviceId, 0, 0, 0, 'OK');
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      return jsonResponse_({
        ok: true,
        action: action,
        personnelId: String(payload.personnel.id || ''),
        personnel: readPersonnelRows_(ss),
        serverTime: new Date().toISOString()
      });
    }

    if (action === 'SUBMIT_RESPONSE' && payload.response) {
      var surveyMap = getSurveyMap_();
      if (payload.survey && isAuthorizedAdmin_(payload.callerId, clientSyncToken)) {
        upsertSurveyRow_(payload.survey);
        surveyMap[payload.survey.id] = payload.survey;
      }
      var resStats = appendResponsesIdempotent_([payload.response], surveyMap);
      logSyncEvent_('SUBMIT_RESPONSE', deviceId, 0, resStats.inserted, resStats.skipped, 'OK');
      return jsonResponse_({
        ok: true,
        action: action,
        inserted: resStats.inserted,
        skipped: resStats.skipped,
        syncedIds: resStats.syncedIds,
        serverTime: new Date().toISOString()
      });
    }

    if (action === 'DELETE_SURVEY' && payload.surveyId) {
      if (!isAuthorizedAdmin_(payload.callerId, clientSyncToken)) {
        return jsonResponse_({ ok: false, error: 'Unauthorized: Action requires Admin role.' }, 403);
      }
      deleteRowById_(DB_CONFIG.SHEETS.SURVEYS, 1, String(payload.surveyId));
      logSyncEvent_('DELETE_SURVEY', deviceId, 0, 0, 0, 'OK');
      return jsonResponse_({
        ok: true,
        action: action,
        deletedSurveyId: String(payload.surveyId),
        serverTime: new Date().toISOString()
      });
    }

    // Default: BATCH_SYNC (handles offline queue flush + full sync)
    var isCallerAdmin = isAuthorizedAdmin_(payload.callerId, clientSyncToken);
    var surveys = (isCallerAdmin && Array.isArray(payload.surveys)) ? payload.surveys.slice(0, DB_CONFIG.MAX_BATCH_ITEMS) : [];
    var collectors = Array.isArray(payload.collectors) ? payload.collectors.slice(0, DB_CONFIG.MAX_BATCH_ITEMS) : [];
    var responses = Array.isArray(payload.responses) ? payload.responses.slice(0, DB_CONFIG.MAX_BATCH_ITEMS) : [];
    var personnel = (isCallerAdmin && Array.isArray(payload.personnel)) ? payload.personnel.slice(0, DB_CONFIG.MAX_BATCH_ITEMS) : [];

    var surveysUpserted = 0;
    for (var i = 0; i < surveys.length; i++) {
      upsertSurveyRow_(surveys[i]);
      syncSurveyDedicatedSheetHeader_(surveys[i]);
      surveysUpserted++;
    }

    for (var j = 0; j < collectors.length; j++) {
      upsertCollectorRow_(collectors[j]);
    }

    var personnelUpserted = 0;
    for (var k = 0; k < personnel.length; k++) {
      upsertPersonnelRow_(personnel[k]);
      personnelUpserted++;
    }

    var allSurveysMap = getSurveyMap_();
    var batchStats = appendResponsesIdempotent_(responses, allSurveysMap);

    logSyncEvent_(
      'BATCH_SYNC',
      deviceId,
      surveysUpserted,
      batchStats.inserted,
      batchStats.skipped,
      'OK'
    );

    return jsonResponse_({
      ok: true,
      action: 'BATCH_SYNC',
      surveysSynced: surveysUpserted,
      collectorsSynced: collectors.length,
      personnelSynced: personnelUpserted,
      responsesInserted: batchStats.inserted,
      duplicatesSkipped: batchStats.skipped,
      syncedResponseIds: batchStats.syncedIds,
      personnel: readPersonnelRows_(SpreadsheetApp.getActiveSpreadsheet()),
      serverTime: new Date().toISOString(),
      counts: getRowCounts_()
    });

  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: 'Batch synchronization failed.'
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Manual helper you can run directly in the Apps Script editor to initialize tabs.
 */
function setupDatabaseSheets() {
  ensureDatabaseInitialized_();
}

/**
 * Ensures all 4 system tabs exist with styled headers and frozen top rows.
 */
function ensureDatabaseInitialized_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  ensureSheetWithHeaders_(ss, DB_CONFIG.SHEETS.SURVEYS, [
    'SurveyID',
    'Title',
    'Category',
    'Status',
    'Version',
    'QuestionCount',
    'UpdatedAt',
    'SchemaJSON'
  ]);

  ensureSheetWithHeaders_(ss, DB_CONFIG.SHEETS.RESPONSES, [
    'ClientResponseID',
    'SurveyID',
    'SurveyTitle',
    'CollectorID',
    'Enumerator',
    'SubmittedAt',
    'DurationSec',
    'GPS_Lat',
    'GPS_Lng',
    'GPS_Accuracy',
    'Status',
    'ReviewStatus',
    'QAFlags',
    'SupervisorID',
    'NPSCategory',
    'RecordHash',
    'CalculatedJSON',
    'AnswersJSON',
    'ServerReceivedAt'
  ]);

  ensureSheetWithHeaders_(ss, DB_CONFIG.SHEETS.COLLECTORS, [
    'CollectorID',
    'SurveyID',
    'Name',
    'Type',
    'Status',
    'PinCode',
    'CreatedAt',
    'ConfigJSON'
  ]);

  ensureSheetWithHeaders_(ss, DB_CONFIG.SHEETS.PERSONNEL, [
    'PersonnelID',
    'FullName',
    'Role',
    'County',
    'SubCounty',
    'Phone',
    'Email',
    'SupervisorID',
    'AssignedSurveys',
    'Status',
    'PinCode',
    'UpdatedAt'
  ]);

  ensureSheetWithHeaders_(ss, DB_CONFIG.SHEETS.SYNC_LOG, [
    'Timestamp',
    'Action',
    'DeviceID',
    'SurveysSynced',
    'ResponsesInserted',
    'DuplicatesSkipped',
    'Status'
  ]);

  // If default Sheet1 exists and is empty, remove it so operational tabs are immediately visible
  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && defaultSheet.getLastRow() === 0 && ss.getSheets().length > 1) {
    try {
      ss.deleteSheet(defaultSheet);
    } catch (e) {}
  }

  // Automatically heal and align any legacy rows where AnswersJSON was in Col L instead of Col R
  migrateResponsesSheetLayout_();
}

/**
 * Custom Google Sheets Menu for one-click database management
 */
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('AE Survey Database')
      .addItem('Repair / Align Legacy Response Columns', 'migrateResponsesSheetLayout')
      .addItem('Initialize / Refresh Database Tabs', 'setupDatabaseSheets')
      .addToUi();
  } catch (e) {}
}

/**
 * Public runner function that can be selected from the Apps Script toolbar dropdown
 */
function migrateResponsesSheetLayout() {
  var res = migrateResponsesSheetLayout_();
  Logger.log('Migration Result: ' + JSON.stringify(res));
  return res;
}

/**
 * Automatically repairs and aligns legacy rows (e.g. Rows 2 to 11) in the 'Responses' sheet
 * where AnswersJSON was stored in Column L (Index 11) instead of Column R (Index 17).
 * Shifts AnswersJSON into Column R and Timestamp into Column S, ensuring 100% column consistency.
 */
function migrateResponsesSheetLayout_() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var rSheet = ss.getSheetByName(DB_CONFIG.SHEETS.RESPONSES);
    if (!rSheet || rSheet.getLastRow() <= 1) return { migrated: 0 };

    var lastRow = rSheet.getLastRow();
    var maxCols = Math.max(19, rSheet.getLastColumn());
    var range = rSheet.getRange(2, 1, lastRow - 1, maxCols);
    var values = range.getValues();
    var migratedCount = 0;

    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var valL = String(row[11] || '').trim();
      var valR = String(row[17] || '').trim();

      // Detection: If Column L starts with '{' (is JSON answers) and Column R is not JSON answers
      if (valL.charAt(0) === '{' && valR.charAt(0) !== '{') {
        var oldAnswersJson = row[11];
        var oldTimestamp = row[12] || row[5] || new Date().toISOString();

        // Shift AnswersJSON from Column L (idx 11) to Column R (idx 17)
        row[17] = oldAnswersJson;

        // Shift Timestamp from Column M (idx 12) to Column S (idx 18)
        row[18] = oldTimestamp;

        // Reset Column L (idx 11) to 'approved'
        row[11] = 'approved';

        // Column M (idx 12) QAFlags
        row[12] = 'LEGACY_MIGRATED';

        // Initialize Columns N, O, P, Q (indices 13..16)
        row[13] = '';
        row[14] = '';
        row[15] = '';
        row[16] = '{}';

        migratedCount++;
      }
    }

    if (migratedCount > 0) {
      range.setValues(values);
    }
    return { ok: true, migrated: migratedCount };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function ensureSheetWithHeaders_(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange
      .setBackground(DB_CONFIG.BRAND_HEADER_BG)
      .setFontColor(DB_CONFIG.BRAND_HEADER_FG)
      .setFontWeight('bold')
      .setFontFamily('Arial');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Upserts a survey record in the `Surveys` tab.
 */
function upsertSurveyRow_(survey) {
  if (!survey || !survey.id) return;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(DB_CONFIG.SHEETS.SURVEYS);
  var questions = getFlattenedQuestions_(survey);

  var rowValues = [
    sanitizeSheetCell_(String(survey.id)),
    sanitizeSheetCell_(String(survey.title || 'Untitled Survey')),
    sanitizeSheetCell_(String(survey.category || 'General')),
    sanitizeSheetCell_(String(survey.status || 'Active')),
    Number(survey.version || 1),
    questions.length,
    sanitizeSheetCell_(String(survey.updatedAt || new Date().toISOString())),
    sanitizeSheetCell_(JSON.stringify(survey))
  ];

  var rowIndex = findRowIndexByValue_(sheet, 1, String(survey.id));
  if (rowIndex > 1) {
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

/**
 * Upserts a collector record in the `Collectors` tab.
 */
function upsertCollectorRow_(collector) {
  if (!collector || !collector.id) return;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(DB_CONFIG.SHEETS.COLLECTORS);

  var rowValues = [
    sanitizeSheetCell_(String(collector.id)),
    sanitizeSheetCell_(String(collector.surveyId || '')),
    sanitizeSheetCell_(String(collector.name || 'Web Collector')),
    sanitizeSheetCell_(String(collector.type || 'weblink')),
    sanitizeSheetCell_(String(collector.status || 'Open')),
    sanitizeSheetCell_(String(collector.pinCode || '1234')),
    sanitizeSheetCell_(String(collector.createdAt || new Date().toISOString())),
    sanitizeSheetCell_(JSON.stringify(collector))
  ];

  var rowIndex = findRowIndexByValue_(sheet, 1, String(collector.id));
  if (rowIndex > 1) {
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function upsertPersonnelRow_(person) {
  if (!person || !person.id) return;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(DB_CONFIG.SHEETS.PERSONNEL);
  if (!sheet) return;

  var rowValues = [
    sanitizeSheetCell_(String(person.id)),
    sanitizeSheetCell_(String(person.fullName || '')),
    sanitizeSheetCell_(String(person.role || 'enumerator')),
    sanitizeSheetCell_(String(person.county || 'Unassigned')),
    sanitizeSheetCell_(String(person.subCounty || '')),
    sanitizeSheetCell_(String(person.phone || '')),
    sanitizeSheetCell_(String(person.email || '')),
    sanitizeSheetCell_(String(person.supervisorId || '')),
    sanitizeSheetCell_(Array.isArray(person.assignedSurveys) ? person.assignedSurveys.join(', ') : ''),
    sanitizeSheetCell_(person.active !== false ? 'Active' : 'Inactive'),
    sanitizeSheetCell_(String(person.pinCode || '1234')),
    sanitizeSheetCell_(String(person.updatedAt || new Date().toISOString()))
  ];

  var rowIndex = findRowIndexByValue_(sheet, 1, String(person.id));
  if (rowIndex > 1) {
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function readPersonnelRows_(ss) {
  var sheet = ss.getSheetByName(DB_CONFIG.SHEETS.PERSONNEL);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 12).getValues();
  var personnel = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var id = String(r[0] || '').trim();
    if (!id) continue;
    var assignedSurveys = String(r[8] || '')
      .split(',')
      .map(function(s) { return s.trim(); })
      .filter(function(s) { return s.length > 0; });

    personnel.push({
      id: id,
      fullName: String(r[1] || ''),
      role: String(r[2] || 'enumerator').toLowerCase(),
      county: String(r[3] || 'Unassigned'),
      subCounty: String(r[4] || ''),
      phone: String(r[5] || ''),
      email: String(r[6] || ''),
      supervisorId: r[7] ? String(r[7]) : null,
      assignedSurveys: assignedSurveys,
      active: String(r[9] || 'Active').toLowerCase() === 'active',
      pinCode: String(r[10] || '1234'),
      updatedAt: String(r[11] || new Date().toISOString())
    });
  }
  return personnel;
}

/**
 * Appends responses idempotently (skips any response whose `clientResponseId` or `id`
 * already exists in the `Responses` sheet) and mirrors each new row into its
 * per-survey human-readable Google Sheet tab!
 */
function appendResponsesIdempotent_(responses, surveyMap) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var respSheet = ss.getSheetByName(DB_CONFIG.SHEETS.RESPONSES);
  var existingIds = getExistingColumnSet_(respSheet, 1);

  var inserted = 0;
  var skipped = 0;
  var syncedIds = [];
  var nowIso = new Date().toISOString();

  for (var i = 0; i < responses.length; i++) {
    var r = responses[i];
    if (!r) continue;
    var clientRespId = String(r.clientResponseId || r.id || Utilities.getUuid());

    if (existingIds[clientRespId]) {
      // Ensure row is mirrored to the per-survey dedicated sheet if not already there
      var existingSurvey = surveyMap[r.surveyId] || null;
      if (existingSurvey && r.answers && Object.keys(r.answers).length > 0) {
        appendToSurveyDedicatedSheet_(existingSurvey, r, clientRespId, nowIso);
      }
      skipped++;
      syncedIds.push(clientRespId);
      continue;
    }

    var survey = surveyMap[r.surveyId] || null;
    var surveyTitle = survey ? survey.title : (r.surveyTitle || r.surveyId || 'Survey');
    var gps = r.gps || {};
    var qaFlagsStr = Array.isArray(r.qaFlags) ? r.qaFlags.join(', ') : (r.qaFlags || '');
    var supervisorId = r.audit ? (r.audit.verifiedBy || r.audit.flaggedBy || '') : '';
    var npsCat = r.calculated ? (r.calculated.npsCategory || '') : '';
    var calcJson = r.calculated ? JSON.stringify(r.calculated) : '';

    var masterRow = [
      sanitizeSheetCell_(clientRespId),
      sanitizeSheetCell_(String(r.surveyId || '')),
      sanitizeSheetCell_(String(surveyTitle)),
      sanitizeSheetCell_(String(r.collectorId || 'default')),
      sanitizeSheetCell_(String(r.enumerator || 'Anonymous')),
      sanitizeSheetCell_(String(r.submittedAt || nowIso)),
      Number(r.durationSec || 0),
      gps.lat !== undefined ? sanitizeSheetCell_(gps.lat) : '',
      gps.lng !== undefined ? sanitizeSheetCell_(gps.lng) : '',
      gps.accuracy !== undefined ? sanitizeSheetCell_(gps.accuracy) : '',
      sanitizeSheetCell_(String(r.status || 'complete')),
      sanitizeSheetCell_(String(r.reviewStatus || 'pending_review')),
      sanitizeSheetCell_(qaFlagsStr),
      sanitizeSheetCell_(supervisorId),
      sanitizeSheetCell_(npsCat),
      sanitizeSheetCell_(String(r.recordHash || '')),
      sanitizeSheetCell_(calcJson),
      sanitizeSheetCell_(JSON.stringify(r.answers || {})),
      nowIso
    ];

    respSheet.appendRow(masterRow);
    existingIds[clientRespId] = true;
    inserted++;
    syncedIds.push(clientRespId);

    // Also append to the human-readable Per-Survey sheet tab!
    if (survey) {
      appendToSurveyDedicatedSheet_(survey, r, clientRespId, nowIso);
    }
  }

  return {
    inserted: inserted,
    skipped: skipped,
    syncedIds: syncedIds
  };
}

/**
 * Creates or updates a dedicated human-readable sheet tab for a specific survey
 * (e.g., `Resp_Smallholder_Maize_srv_1`) so analysts can pivot directly in Sheets.
 */
function getSurveyDedicatedSheetName_(survey) {
  var cleanTitle = String(survey.title || 'Survey')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 16);
  var shortId = String(survey.id || 's1').replace(/[^a-zA-Z0-9]/g, '').slice(-6);
  return 'Resp_' + cleanTitle + '_' + shortId;
}

function syncSurveyDedicatedSheetHeader_(survey) {
  if (!survey || !survey.id) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tabName = getSurveyDedicatedSheetName_(survey);
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
  }

  var questions = getFlattenedQuestions_(survey);
  var headers = [
    'Response ID',
    'Submitted At',
    'Enumerator',
    'Collector ID',
    'Duration (s)',
    'GPS Latitude',
    'GPS Longitude',
    'GPS Accuracy (m)'
  ];

  for (var i = 0; i < questions.length; i++) {
    var q = questions[i];
    headers.push(sanitizeSheetCell_('Q' + (i + 1) + ': ' + (q.title || q.id)));
  }

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground(DB_CONFIG.SURVEY_TAB_HEADER_BG)
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');
  sheet.setFrozenRows(1);
  return sheet;
}

function appendToSurveyDedicatedSheet_(survey, response, clientRespId, nowIso) {
  var sheet = syncSurveyDedicatedSheetHeader_(survey);
  if (!sheet) return;

  var existingIds = getExistingColumnSet_(sheet, 1);
  if (existingIds[clientRespId]) return;

  var questions = getFlattenedQuestions_(survey);
  var gps = response.gps || {};
  var answers = response.answers || {};

  var row = [
    sanitizeSheetCell_(clientRespId),
    sanitizeSheetCell_(String(response.submittedAt || nowIso)),
    sanitizeSheetCell_(String(response.enumerator || 'Field Enumerator')),
    sanitizeSheetCell_(String(response.collectorId || 'default')),
    Number(response.durationSec || 0),
    gps.lat !== undefined ? sanitizeSheetCell_(gps.lat) : '',
    gps.lng !== undefined ? sanitizeSheetCell_(gps.lng) : '',
    gps.accuracy !== undefined ? sanitizeSheetCell_(gps.accuracy) : ''
  ];

  for (var i = 0; i < questions.length; i++) {
    var q = questions[i];
    var val = answers[q.id];
    row.push(sanitizeSheetCell_(formatAnswerForCell_(val)));
  }

  sheet.appendRow(row);
}

function formatAnswerForCell_(val) {
  if (val === null || val === undefined) return '';
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'object') {
    if (val.lat !== undefined && val.lng !== undefined) {
      return val.lat + ', ' + val.lng + (val.label ? ' (' + val.label + ')' : '');
    }
    var parts = [];
    for (var k in val) {
      if (Object.prototype.hasOwnProperty.call(val, k)) {
        parts.push(k + ': ' + val[k]);
      }
    }
    return parts.join(' | ');
  }
  return String(val);
}

function getFlattenedQuestions_(survey) {
  if (!survey) return [];
  if (Array.isArray(survey.questions) && survey.questions.length > 0) {
    return survey.questions;
  }
  var list = [];
  if (Array.isArray(survey.pages)) {
    for (var p = 0; p < survey.pages.length; p++) {
      var pageQuestions = survey.pages[p].questions || [];
      for (var q = 0; q < pageQuestions.length; q++) {
        list.push(pageQuestions[q]);
      }
    }
  }
  return list;
}

function readAllDatabaseData_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var surveys = [];
  var sSheet = ss.getSheetByName(DB_CONFIG.SHEETS.SURVEYS);
  if (sSheet && sSheet.getLastRow() > 1) {
    var sRows = sSheet.getRange(2, 1, sSheet.getLastRow() - 1, 8).getValues();
    for (var i = 0; i < sRows.length; i++) {
      var schemaJson = sRows[i][7];
      if (schemaJson) {
        try {
          surveys.push(JSON.parse(schemaJson));
        } catch (e) {}
      }
    }
  }

  var collectors = [];
  var cSheet = ss.getSheetByName(DB_CONFIG.SHEETS.COLLECTORS);
  if (cSheet && cSheet.getLastRow() > 1) {
    var cRows = cSheet.getRange(2, 1, cSheet.getLastRow() - 1, 8).getValues();
    for (var j = 0; j < cRows.length; j++) {
      var colJson = cRows[j][7];
      if (colJson) {
        try {
          collectors.push(JSON.parse(colJson));
        } catch (e) {}
      }
    }
  }

  var responses = [];
  var rSheet = ss.getSheetByName(DB_CONFIG.SHEETS.RESPONSES);
  if (rSheet && rSheet.getLastRow() > 1) {
    var maxCols = Math.max(19, rSheet.getLastColumn());
    var rRows = rSheet.getRange(2, 1, rSheet.getLastRow() - 1, maxCols).getValues();
    for (var k = 0; k < rRows.length; k++) {
      var row = rRows[k];

      // Adaptive schema detection:
      // - Newer rows (Row 12 onwards): AnswersJSON in Col R (index 17).
      // - Legacy rows (Rows 2 to 11): AnswersJSON in Col L (index 11).
      var answers = {};
      var reviewStatus = 'pending_review';
      var qaFlags = [];
      var supervisorId = '';
      var npsCategory = '';
      var recordHash = '';
      var calculated = {};
      var syncedAt = String(row[5] || '');

      var valR = String(row[17] || '').trim();
      var valL = String(row[11] || '').trim();

      if (valR.charAt(0) === '{') {
        // Modern 19-column layout (Row 12 onwards)
        try { answers = JSON.parse(row[17]); } catch (e) { answers = {}; }
        reviewStatus = (valL && valL.charAt(0) !== '{') ? valL : 'pending_review';
        if (row[12] && typeof row[12] === 'string' && row[12].indexOf('{') === -1) {
          qaFlags = row[12].split(',').map(function(s) { return s.trim(); }).filter(Boolean);
        }
        supervisorId = String(row[13] || '');
        npsCategory = String(row[14] || '');
        recordHash = String(row[15] || '');
        if (row[16]) {
          try { calculated = typeof row[16] === 'object' ? row[16] : JSON.parse(row[16]); } catch (e) {}
        }
        syncedAt = String(row[18] || row[5] || '');
      } else if (valL.charAt(0) === '{') {
        // Legacy layout (Rows 2 to 11): Answers stored in Col L
        try { answers = JSON.parse(row[11]); } catch (e) { answers = {}; }
        reviewStatus = 'approved';
        qaFlags = ['LEGACY_ROW'];
        syncedAt = String(row[12] || row[5] || '');
      } else if (typeof row[17] === 'object' && row[17] !== null) {
        answers = row[17];
      } else if (typeof row[11] === 'object' && row[11] !== null) {
        answers = row[11];
      }

      responses.push({
        id: String(row[0]),
        clientResponseId: String(row[0]),
        surveyId: String(row[1]),
        surveyTitle: String(row[2]),
        collectorId: String(row[3]),
        enumerator: String(row[4]),
        submittedAt: String(row[5]),
        durationSec: Number(row[6] || 0),
        gps: (row[7] !== '' && row[8] !== '') ? {
          lat: Number(row[7]),
          lng: Number(row[8]),
          accuracy: Number(row[9] || 0)
        } : null,
        status: String(row[10] || 'complete'),
        reviewStatus: reviewStatus,
        qaFlags: qaFlags,
        supervisorId: String(row[13] || ''),
        npsCategory: String(row[14] || ''),
        recordHash: String(row[15] || ''),
        calculated: calculated,
        answers: answers,
        syncStatus: 'synced',
        syncedAt: String(row[18] || row[5])
      });
    }
  }

  var personnel = readPersonnelRows_(ss);

  return {
    surveys: surveys,
    collectors: collectors,
    responses: responses,
    personnel: personnel
  };
}

function getSurveyMap_() {
  var data = readAllDatabaseData_();
  var map = {};
  for (var i = 0; i < data.surveys.length; i++) {
    map[data.surveys[i].id] = data.surveys[i];
  }
  return map;
}

function getRowCounts_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  function countRows(name) {
    var sh = ss.getSheetByName(name);
    if (!sh) return 0;
    return Math.max(0, sh.getLastRow() - 1);
  }
  return {
    surveys: countRows(DB_CONFIG.SHEETS.SURVEYS),
    responses: countRows(DB_CONFIG.SHEETS.RESPONSES),
    collectors: countRows(DB_CONFIG.SHEETS.COLLECTORS),
    syncEvents: countRows(DB_CONFIG.SHEETS.SYNC_LOG)
  };
}

function findRowIndexByValue_(sheet, colIndex, targetValue) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;
  var values = sheet.getRange(2, colIndex, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(targetValue)) {
      return i + 2;
    }
  }
  return -1;
}

function getExistingColumnSet_(sheet, colIndex) {
  var map = {};
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return map;
  var values = sheet.getRange(2, colIndex, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    var val = String(values[i][0]);
    if (val) map[val] = true;
  }
  return map;
}

function deleteRowById_(sheetName, colIndex, idValue) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  var rowIndex = findRowIndexByValue_(sheet, colIndex, idValue);
  if (rowIndex > 1) {
    sheet.deleteRow(rowIndex);
  }
}

function logSyncEvent_(action, deviceId, surveysCount, responsesInserted, duplicatesSkipped, status) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(DB_CONFIG.SHEETS.SYNC_LOG);
  if (!sheet) return;
  sheet.appendRow([
    new Date().toISOString(),
    sanitizeSheetCell_(String(action || '')),
    sanitizeSheetCell_(String(deviceId || '')),
    Number(surveysCount || 0),
    Number(responsesInserted || 0),
    Number(duplicatesSkipped || 0),
    sanitizeSheetCell_(String(status || 'OK'))
  ]);
}

/**
 * Saves binary photo or audio blobs to an isolated Google Drive folder
 * (`AE_Survey_Field_Media`) to completely bypass the 32,000-character Google Sheet
 * cell truncation limit. Returns the public Drive viewing URL.
 */
function saveMediaFileToDrive_(mediaItem) {
  if (!mediaItem || !mediaItem.data) return '';
  try {
    var folderName = 'AE_Survey_Field_Media';
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

    var rawStr = String(mediaItem.data);
    var matches = rawStr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    var mime = mediaItem.mimeType || (matches ? matches[1] : 'image/jpeg');
    var base64Content = matches ? matches[2] : rawStr;
    var rawBytes = Utilities.base64Decode(base64Content);
    var filename = mediaItem.filename || ('media_' + (mediaItem.id || Date.now().toString(36)) + (mime.indexOf('audio') >= 0 ? '.wav' : '.jpg'));
    var blob = Utilities.newBlob(rawBytes, mime, filename);

    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    return '';
  }
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

