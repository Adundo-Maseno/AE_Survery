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
  VERSION: '3.3.0',
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
      var active = data[i][9]; // Column 9 is Status ('Active' / 'Inactive')
      if (rowId === safeId) {
        var isActive = active === true || active === 'TRUE' || active === 1 || String(active).toLowerCase() === 'active' || String(active).toLowerCase() === 'true';
        return role === 'admin' && isActive;
      }
    }
  } catch (e) {}
  return false;
}

/**
 * Checks whether the caller has administrative rights via both a valid AE_SYNC_TOKEN
 * (when configured) and a verified Admin personnel ID.
 */
function isAuthorizedAdmin_(callerId, syncToken) {
  if (!verifySyncToken_(syncToken)) {
    return false;
  }
  return isCallerAdmin_(callerId);
}

var CACHE_TTL_DB_INIT_SEC_ = 21600; // 6 hours
var CACHE_TTL_SURVEY_SEC_ = 300;    // 5 minutes
var CACHE_MAX_BYTES_ = 95000;       // Safe margin under GAS 100KB CacheService limit

function getDbVersion_() {
  try {
    var cached = CacheService.getScriptCache().get('AE_DB_VERSION');
    if (cached !== null && cached !== undefined && String(cached) !== '') {
      return String(cached);
    }
  } catch (e) {}

  var version = '1';
  try {
    var stored = PropertiesService.getScriptProperties().getProperty('AE_DB_VERSION');
    if (stored !== null && stored !== undefined && String(stored) !== '') {
      version = String(stored);
    }
  } catch (e) {}

  try {
    CacheService.getScriptCache().put('AE_DB_VERSION', version, CACHE_TTL_DB_INIT_SEC_);
  } catch (e) {}

  return version;
}

function bumpDbVersion_() {
  var next = '1';
  try {
    var props = PropertiesService.getScriptProperties();
    var current = parseInt(props.getProperty('AE_DB_VERSION') || '1', 10);
    if (isNaN(current) || current < 1) current = 1;
    next = String(current + 1);
    props.setProperty('AE_DB_VERSION', next);
  } catch (e) {
    next = String(Date.now());
  }

  try {
    CacheService.getScriptCache().put('AE_DB_VERSION', next, CACHE_TTL_DB_INIT_SEC_);
  } catch (e) {}

  return next;
}

function getPullSurveyCacheKey_(surveyId) {
  return 'PULL_SURVEY_' + String(surveyId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
}

function invalidateSurveyCache_(surveyId) {
  try {
    var cache = CacheService.getScriptCache();
    cache.remove('SURVEY_MAP_V1');
    if (surveyId) {
      cache.remove(getPullSurveyCacheKey_(surveyId));
    }
  } catch (e) {}
}

function invalidateCollectorCache_(surveyId) {
  if (!surveyId) return;
  try {
    CacheService.getScriptCache().remove(getPullSurveyCacheKey_(surveyId));
  } catch (e) {}
}

/**
 * Handles HTTP GET requests.
 * Supports:
 * - ?action=ping                         -> Health check & spreadsheet metadata
 * - ?action=pullAll[&version=<v>]        -> Returns all surveys, collectors, personnel, and responses (short-circuits if unchanged)
 * - ?action=pullDelta&since=<ISO>[&version=<v>] -> Returns surveys, collectors, personnel, and responses with ServerReceivedAt >= since
 * - ?action=pullSurvey&surveyId=<id>     -> Returns single survey + its collectors (cached, no Responses/Personnel)
 * - ?action=pullPersonnel                -> Returns personnel list
 * - ?action=migrate                      -> Repairs legacy Responses layout
 * - Default (no param)                   -> Serves HTML web app if `mode=ui`, otherwise returns JSON API status.
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

    if (action === 'pullAll') {
      var currentVersion = getDbVersion_();
      if (params.version && String(params.version) === String(currentVersion)) {
        return jsonResponse_({
          ok: true,
          unchanged: true,
          version: currentVersion,
          serverTime: new Date().toISOString()
        });
      }
      ensureDatabaseInitialized_();
      var data = readAllDatabaseData_();
      return jsonResponse_({
        ok: true,
        version: currentVersion,
        serverTime: new Date().toISOString(),
        surveys: data.surveys,
        collectors: data.collectors,
        responses: data.responses,
        personnel: data.personnel
      });
    }

    if (action === 'pullDelta') {
      var deltaVersion = getDbVersion_();
      if (params.version && String(params.version) === String(deltaVersion)) {
        return jsonResponse_({
          ok: true,
          unchanged: true,
          delta: true,
          version: deltaVersion,
          serverTime: new Date().toISOString()
        });
      }
      ensureDatabaseInitialized_();
      var sinceIso = params.since ? String(params.since).trim() : '';
      var deltaData = readDatabaseDataDelta_(sinceIso);
      return jsonResponse_({
        ok: true,
        delta: true,
        version: deltaVersion,
        serverTime: new Date().toISOString(),
        surveys: deltaData.surveys,
        collectors: deltaData.collectors,
        personnel: deltaData.personnel,
        responses: deltaData.responses
      });
    }

    if (action === 'pullSurvey') {
      var surveyId = String(params.surveyId || '').trim();
      if (!surveyId) {
        return jsonResponse_({
          ok: false,
          error: 'Missing required parameter: surveyId.'
        });
      }
      var surveyVersion = getDbVersion_();
      var cacheKey = getPullSurveyCacheKey_(surveyId);
      try {
        var cachedRaw = CacheService.getScriptCache().get(cacheKey);
        if (cachedRaw) {
          var cachedObj = JSON.parse(cachedRaw);
          return jsonResponse_({
            ok: true,
            survey: cachedObj.survey || null,
            collectors: Array.isArray(cachedObj.collectors) ? cachedObj.collectors : [],
            version: surveyVersion,
            serverTime: new Date().toISOString()
          });
        }
      } catch (cacheErr) {}

      ensureDatabaseInitialized_();
      var surveyMap = getSurveyMap_();
      var targetSurvey = surveyMap[surveyId] || null;
      var ssSurvey = SpreadsheetApp.getActiveSpreadsheet();
      var surveyCollectors = readCollectorsRows_(ssSurvey, surveyId);

      if (targetSurvey) {
        try {
          var serialized = JSON.stringify({ survey: targetSurvey, collectors: surveyCollectors });
          if (serialized.length <= CACHE_MAX_BYTES_) {
            CacheService.getScriptCache().put(cacheKey, serialized, CACHE_TTL_SURVEY_SEC_);
          }
        } catch (cachePutErr) {}
      }

      return jsonResponse_({
        ok: true,
        survey: targetSurvey,
        collectors: surveyCollectors,
        version: surveyVersion,
        serverTime: new Date().toISOString()
      });
    }

    if (action === 'pullPersonnel') {
      ensureDatabaseInitialized_();
      var ssPers = SpreadsheetApp.getActiveSpreadsheet();
      var personnel = readPersonnelRows_(ssPers);
      return jsonResponse_({
        ok: true,
        version: getDbVersion_(),
        serverTime: new Date().toISOString(),
        personnel: personnel
      });
    }

    if (action === 'ping') {
      ensureDatabaseInitialized_();
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      return jsonResponse_({
        ok: true,
        service: DB_CONFIG.APP_NAME,
        version: DB_CONFIG.VERSION,
        dbVersion: getDbVersion_(),
        spreadsheetName: ss.getName(),
        serverTime: new Date().toISOString(),
        counts: getRowCounts_()
      });
    }

    if (action === 'migrate') {
      ensureDatabaseInitialized_();
      var migResult = migrateResponsesSheetLayout_();
      if (migResult && migResult.migrated > 0) {
        bumpDbVersion_();
      }
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

    ensureDatabaseInitialized_();
    return jsonResponse_({
      ok: true,
      service: DB_CONFIG.APP_NAME,
      version: DB_CONFIG.VERSION,
      dbVersion: getDbVersion_(),
      message: 'AE Survey GAS Backend is online. Use ?action=ping, ?action=pullAll, ?action=pullDelta, ?action=pullSurvey, or POST JSON with text/plain;charset=utf-8.',
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
 * - "UPLOAD_MEDIA"     -> Saves media to Drive (runs outside ScriptLock)
 * - "BATCH_TRANSLATE"  -> Translates up to 150 strings via LanguageApp (runs outside ScriptLock)
 * - "ANALYZE_VERBATIMS_AI" -> Hybrid Gemini AI verbatim briefing with offline fallback (runs outside ScriptLock)
 */
function doPost(e) {
  try {
    if (e && e.postData && e.postData.contents && e.postData.contents.length > 5 * 1024 * 1024) {
      return jsonResponse_({
        ok: false,
        error: 'Payload size exceeds 5MB limit.'
      });
    }

    var rawBody = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var payload = JSON.parse(rawBody);
    var clientSyncToken = payload.syncToken || (e && e.parameter && e.parameter.syncToken) || '';

    if (!verifySyncToken_(clientSyncToken)) {
      return jsonResponse_({
        ok: false,
        error: 'Unauthorized: Invalid or missing AE_SYNC_TOKEN.'
      });
    }

    var action = String(payload.action || 'BATCH_SYNC');
    var deviceId = sanitizeSheetCell_(payload.deviceId || 'unknown-device');

    // Sliding-window rate limit guard (max 60 sync operations per minute per device) — runs outside ScriptLock
    try {
      var cache = CacheService.getScriptCache();
      var rateKey = 'rate_' + String(deviceId).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
      var count = Number(cache.get(rateKey) || 0);
      if (count > 60) {
        return jsonResponse_({ ok: false, error: 'Rate limit exceeded: Too many requests in 60s window.' });
      }
      cache.put(rateKey, String(count + 1), 60);
    } catch (cacheErr) {}

    // Media Upload Endpoint -> Google Drive (runs outside ScriptLock)
    if (action === 'UPLOAD_MEDIA' && payload.mediaItem) {
      var driveUrl = saveMediaFileToDrive_(payload.mediaItem);
      return jsonResponse_({
        ok: Boolean(driveUrl),
        driveUrl: driveUrl,
        mediaId: payload.mediaItem.id || '',
        serverTime: new Date().toISOString()
      });
    }

    // Google Translate Engine Endpoint (Zero-API-key native GAS LanguageApp) — runs outside ScriptLock
    // Supports up to 150 strings per request (e.g. on-demand Swahili/FR/PT verbatim translation to English)
    if (action === 'BATCH_TRANSLATE' || action === 'TRANSLATE') {
      var MAX_TRANSLATE_STRINGS = 150;
      var MAX_TRANSLATE_CHARS = 5000;
      var rawSource = (payload.sourceLang === undefined || payload.sourceLang === null)
        ? 'en'
        : String(payload.sourceLang).trim().toLowerCase();
      var sourceLang = (rawSource === 'auto' || rawSource === '') ? '' : rawSource;
      var targetLang = String(payload.targetLang || 'sw').trim().toLowerCase() || 'en';
      var rawTexts = Array.isArray(payload.texts) ? payload.texts : (payload.text ? [payload.text] : []);
      var cappedTexts = rawTexts.slice(0, MAX_TRANSLATE_STRINGS);
      var translatedTexts = [];
      var dedupeCache = {};

      for (var tIdx = 0; tIdx < cappedTexts.length; tIdx++) {
        var src = cappedTexts[tIdx];
        if (src === null || src === undefined || typeof src !== 'string' || !src.trim()) {
          translatedTexts.push(src ? String(src) : '');
          continue;
        }
        var trimmed = src.trim();
        if (trimmed.length > MAX_TRANSLATE_CHARS) {
          trimmed = trimmed.substring(0, MAX_TRANSLATE_CHARS);
        }
        if (sourceLang && sourceLang === targetLang) {
          translatedTexts.push(trimmed);
          continue;
        }
        if (Object.prototype.hasOwnProperty.call(dedupeCache, trimmed)) {
          translatedTexts.push(dedupeCache[trimmed]);
          continue;
        }
        try {
          var res = LanguageApp.translate(trimmed, sourceLang, targetLang);
          var outText = res ? String(res).trim() : trimmed;
          dedupeCache[trimmed] = outText;
          translatedTexts.push(outText);
        } catch (transErr) {
          // Gracefully fall back to original text if single string exceeds quota or contains invalid characters
          dedupeCache[trimmed] = trimmed;
          translatedTexts.push(trimmed);
        }
      }

      return jsonResponse_({
        ok: true,
        action: action,
        sourceLang: sourceLang || 'auto',
        targetLang: targetLang,
        translations: translatedTexts,
        count: translatedTexts.length,
        totalReceived: rawTexts.length,
        truncated: rawTexts.length > MAX_TRANSLATE_STRINGS,
        serverTime: new Date().toISOString()
      });
    }

    // Hybrid Cloud Verbatim Intelligence Endpoint (Optional Gemini 2.5 Flash) — runs outside ScriptLock
    if (action === 'ANALYZE_VERBATIMS_AI') {
      return jsonResponse_(analyzeVerbatimsWithGemini_(payload));
    }

    // "Ask Your Survey" Natural-Language AI Analyst Endpoint — runs outside ScriptLock
    if (action === 'ASK_SURVEY_AI') {
      return jsonResponse_(askSurveyWithGemini_(payload));
    }

    // Test Webhook Ping Endpoint (Admin-only) — runs outside ScriptLock
    if (action === 'TEST_WEBHOOK') {
      if (!isAuthorizedAdmin_(payload.callerId, clientSyncToken)) {
        return jsonResponse_({ ok: false, error: 'Unauthorized: Action requires Admin role.' });
      }
      return jsonResponse_(testSurveyWebhook_(payload));
    }

    // Daily Digest Email Endpoint (Admin-only) — runs outside ScriptLock
    if (action === 'SEND_DAILY_DIGEST') {
      if (!isAuthorizedAdmin_(payload.callerId, clientSyncToken)) {
        return jsonResponse_({ ok: false, error: 'Unauthorized: Action requires Admin role.' });
      }
      ensureDatabaseInitialized_();
      var ssDigest = SpreadsheetApp.getActiveSpreadsheet();
      var digestSurveyMap = getSurveyMap_();
      var digestAllResponses = readResponsesRows_(ssDigest, '');
      var targetSurveyId = String(payload.surveyId || '').trim();
      if (targetSurveyId) {
        var digestSurvey = digestSurveyMap[targetSurveyId];
        if (!digestSurvey) {
          return jsonResponse_({ ok: false, error: 'Survey not found: ' + targetSurveyId });
        }
        var singleRes = sendSurveyDailyDigest_(digestSurvey, digestAllResponses, payload.recipients || '', payload.surveyUrl || '');
        if (!singleRes.ok) {
          return jsonResponse_({ ok: false, error: singleRes.error || 'Failed to send daily digest.' });
        }
        return jsonResponse_({
          ok: true,
          action: 'SEND_DAILY_DIGEST',
          surveyId: targetSurveyId,
          sent: singleRes.sent,
          recipients: singleRes.recipients,
          stats: singleRes.stats,
          serverTime: new Date().toISOString()
        });
      }
      var allDigestSummary = sendDailyDigestTrigger();
      return jsonResponse_({
        ok: true,
        action: 'SEND_DAILY_DIGEST',
        surveysProcessed: allDigestSummary.surveysProcessed,
        emailsSent: allDigestSummary.emailsSent,
        serverTime: new Date().toISOString()
      });
    }

    // Acquire ScriptLock ONLY for sheet-mutating operations
    var lock = LockService.getScriptLock();
    lock.waitLock(25000);
    var postLockResponse = null;
    var alertContext = null;

    try {
      ensureDatabaseInitialized_();

      if (action === 'UPSERT_SURVEY' && payload.survey) {
        if (!isAuthorizedAdmin_(payload.callerId, clientSyncToken)) {
          return jsonResponse_({ ok: false, error: 'Unauthorized: Action requires Admin role.' }, 403);
        }
        upsertSurveyRow_(payload.survey);
        syncSurveyDedicatedSheetHeader_(payload.survey);
        var upsertSurveyVersion = bumpDbVersion_();
        logSyncEvent_('UPSERT_SURVEY', deviceId, 1, 0, 0, 'OK');
        return jsonResponse_({
          ok: true,
          action: action,
          surveyId: String(payload.survey.id || ''),
          version: upsertSurveyVersion,
          serverTime: new Date().toISOString()
        });
      }

      if (action === 'UPSERT_COLLECTOR' && payload.collector) {
        upsertCollectorRow_(payload.collector);
        var upsertCollectorVersion = bumpDbVersion_();
        logSyncEvent_('UPSERT_COLLECTOR', deviceId, 0, 0, 0, 'OK');
        return jsonResponse_({
          ok: true,
          action: action,
          collectorId: String(payload.collector.id || ''),
          version: upsertCollectorVersion,
          serverTime: new Date().toISOString()
        });
      }

      if (action === 'UPSERT_PERSONNEL' && (payload.personnel || payload.person)) {
        var targetPerson = Array.isArray(payload.personnel) ? payload.personnel[0] : (payload.personnel || payload.person);
        var isSelf = payload.callerId && String(payload.callerId).trim() === String(targetPerson.id || '').trim();
        if (!isAuthorizedAdmin_(payload.callerId, clientSyncToken) && !isSelf) {
          return jsonResponse_({ ok: false, error: 'Unauthorized: Action requires Admin role or account ownership.' }, 403);
        }
        upsertPersonnelRow_(targetPerson);
        var upsertPersonnelVersion = bumpDbVersion_();
        logSyncEvent_('UPSERT_PERSONNEL', deviceId, 0, 0, 0, 'OK');
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        return jsonResponse_({
          ok: true,
          action: action,
          personnelId: String(targetPerson.id || ''),
          personnel: readPersonnelRows_(ss),
          version: upsertPersonnelVersion,
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
        var submitRespVersion = bumpDbVersion_();
        logSyncEvent_('SUBMIT_RESPONSE', deviceId, 0, resStats.inserted, resStats.skipped, 'OK');
        alertContext = {
          surveyMap: surveyMap,
          insertedResponses: resStats.insertedResponses || []
        };
        postLockResponse = {
          ok: true,
          action: action,
          inserted: resStats.inserted,
          skipped: resStats.skipped,
          syncedIds: resStats.syncedIds,
          version: submitRespVersion,
          serverTime: new Date().toISOString()
        };
      } else if (action === 'DELETE_SURVEY' && payload.surveyId) {
        if (!isAuthorizedAdmin_(payload.callerId, clientSyncToken)) {
          return jsonResponse_({ ok: false, error: 'Unauthorized: Action requires Admin role.' }, 403);
        }
        var delStats = deleteSurveyCompletely_(String(payload.surveyId), payload.purgeCloudData !== false);
        var deleteSurveyVersion = bumpDbVersion_();
        logSyncEvent_('DELETE_SURVEY', deviceId, 0, -delStats.deletedMasterRows, 0, 'OK (' + String(payload.surveyId) + ')');
        return jsonResponse_({
          ok: true,
          action: action,
          deletedSurveyId: String(payload.surveyId),
          deletedMasterRows: delStats.deletedMasterRows,
          deletedDedicatedSheet: delStats.deletedDedicatedSheet,
          version: deleteSurveyVersion,
          serverTime: new Date().toISOString()
        });
      }

      if (action === 'CLEAR_SURVEY_RESPONSES' && payload.surveyId) {
        if (!isAuthorizedAdmin_(payload.callerId, clientSyncToken)) {
          return jsonResponse_({ ok: false, error: 'Unauthorized: Clearing survey responses requires Admin role.' }, 403);
        }
        var clearStats = clearSurveyResponses_(String(payload.surveyId));
        var clearVersion = bumpDbVersion_();
        logSyncEvent_('CLEAR_SURVEY_RESPONSES', deviceId, 0, -clearStats.deletedMasterRows, 0, 'OK (' + String(payload.surveyId) + ')');
        return jsonResponse_({
          ok: true,
          action: action,
          surveyId: String(payload.surveyId),
          deletedMasterRows: clearStats.deletedMasterRows,
          deletedDedicatedRows: clearStats.deletedDedicatedRows,
          version: clearVersion,
          serverTime: new Date().toISOString()
        });
      }

      if (!postLockResponse) {
        // Default: BATCH_SYNC (handles offline queue flush + full sync)
        var isCallerAdmin = isAuthorizedAdmin_(payload.callerId, clientSyncToken);
        var surveys = (isCallerAdmin && Array.isArray(payload.surveys)) ? payload.surveys.slice(0, DB_CONFIG.MAX_BATCH_ITEMS) : [];
        var collectors = Array.isArray(payload.collectors) ? payload.collectors.slice(0, DB_CONFIG.MAX_BATCH_ITEMS) : [];
        var responses = Array.isArray(payload.responses) ? payload.responses.slice(0, DB_CONFIG.MAX_BATCH_ITEMS) : [];
        var rawPersonnel = Array.isArray(payload.personnel)
          ? payload.personnel.slice(0, DB_CONFIG.MAX_BATCH_ITEMS)
          : (payload.personnel && typeof payload.personnel === 'object' ? [payload.personnel] : []);
        var personnel = isCallerAdmin
          ? rawPersonnel
          : rawPersonnel.filter(function(p) {
              return p && payload.callerId && String(p.id || '').trim() === String(payload.callerId).trim();
            });

        var surveysUpserted = 0;
        for (var i = 0; i < surveys.length; i++) {
          upsertSurveyRow_(surveys[i]);
          syncSurveyDedicatedSheetHeader_(surveys[i]);
          surveysUpserted++;
        }

        var deletedSurveyIds = (isCallerAdmin && Array.isArray(payload.deletedSurveyIds))
          ? payload.deletedSurveyIds.slice(0, DB_CONFIG.MAX_BATCH_ITEMS)
          : [];
        for (var dIdx = 0; dIdx < deletedSurveyIds.length; dIdx++) {
          if (deletedSurveyIds[dIdx]) {
            deleteSurveyCompletely_(String(deletedSurveyIds[dIdx]), true);
          }
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
        var batchVersion = bumpDbVersion_();

        logSyncEvent_(
          'BATCH_SYNC',
          deviceId,
          surveysUpserted,
          batchStats.inserted,
          batchStats.skipped,
          'OK'
        );

        alertContext = {
          surveyMap: allSurveysMap,
          insertedResponses: batchStats.insertedResponses || []
        };
        postLockResponse = {
          ok: true,
          action: 'BATCH_SYNC',
          version: batchVersion,
          isCallerAdmin: isCallerAdmin,
          surveysSynced: surveysUpserted,
          deletedSurveyIds: deletedSurveyIds,
          collectorsSynced: collectors.length,
          personnelSynced: personnelUpserted,
          responsesInserted: batchStats.inserted,
          duplicatesSkipped: batchStats.skipped,
          syncedResponseIds: batchStats.syncedIds,
          personnel: readPersonnelRows_(SpreadsheetApp.getActiveSpreadsheet()),
          serverTime: new Date().toISOString(),
          counts: getRowCounts_()
        };
      }
    } finally {
      lock.releaseLock();
    }

    // Run real-time risk alerts & webhooks AFTER releasing ScriptLock so MailApp/UrlFetchApp never block concurrent syncs
    if (alertContext && alertContext.insertedResponses && alertContext.insertedResponses.length > 0) {
      maybeSendRealtimeAlerts_(alertContext.surveyMap, alertContext.insertedResponses);
      maybeFireSurveyWebhooks_(alertContext.surveyMap, alertContext.insertedResponses);
    }

    return jsonResponse_(postLockResponse);
  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: 'Batch synchronization failed.'
    });
  }
}

/**
 * Manual helper you can run directly in the Apps Script editor to initialize tabs.
 */
function setupDatabaseSheets() {
  ensureDatabaseInitialized_(true);
}

/**
 * Ensures all system tabs exist with styled headers and frozen top rows.
 * Caches initialization status in CacheService for 6h to avoid repeated sheet scans.
 */
function ensureDatabaseInitialized_(force) {
  if (!force) {
    try {
      if (CacheService.getScriptCache().get('DB_INIT_OK') === '1') {
        return;
      }
    } catch (e) {}
  }

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
    'ServerReceivedAt',
    'AdministeredLanguage'
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
    'UpdatedAt',
    'TaskQuotasJSON'
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

  try {
    CacheService.getScriptCache().put('DB_INIT_OK', '1', CACHE_TTL_DB_INIT_SEC_);
  } catch (e) {}
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
    if (!survey.forceOverwrite && survey.updatedAt) {
      var existingUpdatedAt = String(sheet.getRange(rowIndex, 7).getValue() || '').trim();
      var incomingMs = Date.parse(String(survey.updatedAt));
      var existingMs = Date.parse(existingUpdatedAt);
      if (!isNaN(incomingMs) && !isNaN(existingMs) && incomingMs < existingMs) {
        return;
      }
    }
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  invalidateSurveyCache_(survey.id);
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
  invalidateCollectorCache_(collector.surveyId);
}

function upsertPersonnelRow_(person) {
  if (!person || !person.id) return;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(DB_CONFIG.SHEETS.PERSONNEL);
  if (!sheet) return;

  var quotasJson = (person.taskQuotas && typeof person.taskQuotas === 'object')
    ? JSON.stringify(person.taskQuotas)
    : '{}';

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
    "'" + String(person.pinCode || '1234').replace(/^'+/, '').trim(),
    sanitizeSheetCell_(String(person.updatedAt || new Date().toISOString())),
    sanitizeSheetCell_(quotasJson)
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

  var numCols = Math.max(12, Math.min(13, sheet.getLastColumn()));
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, numCols).getValues();
  var personnel = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var id = String(r[0] || '').trim();
    if (!id) continue;
    var assignedSurveys = String(r[8] || '')
      .split(',')
      .map(function(s) { return s.trim(); })
      .filter(function(s) { return s.length > 0; });

    var taskQuotas = {};
    if (r[12]) {
      try {
        var rawQuotas = String(r[12]).replace(/^'+/, '').trim();
        if (rawQuotas.charAt(0) === '{') {
          taskQuotas = JSON.parse(rawQuotas);
        }
      } catch (e) {
        taskQuotas = {};
      }
    }

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
      pinCode: String(r[10] || '1234').replace(/^'+/, '').trim(),
      updatedAt: r[11] ? String(r[11]).trim() : '',
      taskQuotas: taskQuotas
    });
  }
  return personnel;
}

/**
 * Automatically translates open text answers into English if the survey was administered
 * in Swahili ('sw'), Portuguese ('pt'), or French ('fr') using Google Apps Script LanguageApp.
 * Results in clear English audit format: [Translated from <Lang>]: <English> (Original: <Text>)
 */
function translateOpenTextIfNeeded_(text, langCode) {
  if (!text || typeof text !== 'string') return text;
  var trimmed = text.trim();
  if (trimmed.length === 0) return text;
  var code = String(langCode || 'en').toLowerCase().trim();
  if (code === 'en' || code === '') return text;

  // Don't translate base64 data URLs, links, or pure numbers/coordinates
  if (trimmed.indexOf('data:image') === 0 || trimmed.indexOf('http') === 0 || /^[-0-9.,\s]+$/.test(trimmed)) {
    return text;
  }

  try {
    var langNames = {
      'sw': 'Swahili',
      'pt': 'Portuguese',
      'fr': 'French'
    };
    var langName = langNames[code] || code.toUpperCase();
    var translated = LanguageApp.translate(trimmed, code, 'en');
    if (translated && translated.trim().toLowerCase() !== trimmed.toLowerCase()) {
      return '[Translated from ' + langName + ']: ' + translated.trim() + ' (Original: ' + trimmed + ')';
    }
    return trimmed;
  } catch (e) {
    return trimmed;
  }
}

/**
 * Appends responses idempotently (skips any response whose `clientResponseId` or `id`
 * already exists in the `Responses` sheet) and mirrors each new row into its
 * per-survey human-readable Google Sheet tab using batched setValues() writes.
 */
function appendResponsesIdempotent_(responses, surveyMap) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var respSheet = ss.getSheetByName(DB_CONFIG.SHEETS.RESPONSES);
  var existingRowMap = getExistingColumnIndexMap_(respSheet, 1);

  var inserted = 0;
  var skipped = 0;
  var syncedIds = [];
  var insertedResponses = [];
  var nowIso = new Date().toISOString();
  var newMasterRows = [];
  var pendingNewIndex = {};
  var dedicatedBySurvey = {};

  function queueDedicated_(surveyObj, respObj, respId) {
    if (!surveyObj || !surveyObj.id) return;
    var sid = String(surveyObj.id);
    if (!dedicatedBySurvey[sid]) {
      dedicatedBySurvey[sid] = { survey: surveyObj, items: [] };
    }
    dedicatedBySurvey[sid].items.push({
      response: respObj,
      clientRespId: respId,
      nowIso: nowIso
    });
  }

  for (var i = 0; i < responses.length; i++) {
    var r = responses[i];
    if (!r) continue;
    var clientRespId = String(r.clientResponseId || r.id || Utilities.getUuid());

    var gps = r.gps || {};
    var qaFlagsStr = Array.isArray(r.qaFlags) ? r.qaFlags.join(', ') : (r.qaFlags || '');
    var supervisorId = r.audit
      ? (r.audit.verifiedBy || r.audit.flaggedBy || r.audit.rejectedBy || r.supervisorId || '')
      : (r.supervisorId || '');
    var npsCat = r.calculated ? (r.calculated.npsCategory || '') : '';
    var calcPayload = Object.assign({}, r.calculated || {}, {
      _meta: {
        audit: r.audit || null,
        auditTrail: Array.isArray(r.auditTrail) ? r.auditTrail : [],
        submittedByUserId: r.submittedByUserId || '',
        submittedByUserRole: r.submittedByUserRole || '',
        gpsLabel: gps.label || '',
        gpsAltitude: gps.altitude !== undefined ? gps.altitude : null,
        gpsMethod: gps.method || '',
        gpsManual: Boolean(gps.manual)
      }
    });
    var calcJson = JSON.stringify(calcPayload);

    if (existingRowMap[clientRespId] || pendingNewIndex[clientRespId] !== undefined) {
      var qaUpdateCols = [
        sanitizeSheetCell_(String(r.reviewStatus || 'pending_review')),
        sanitizeSheetCell_(qaFlagsStr),
        sanitizeSheetCell_(supervisorId),
        sanitizeSheetCell_(npsCat),
        sanitizeSheetCell_(String(r.recordHash || '')),
        sanitizeSheetCell_(calcJson)
      ];
      if (existingRowMap[clientRespId] > 1) {
        respSheet.getRange(existingRowMap[clientRespId], 12, 1, 6).setValues([qaUpdateCols]);
      } else if (pendingNewIndex[clientRespId] !== undefined) {
        var pendingRow = newMasterRows[pendingNewIndex[clientRespId]];
        for (var cIdx = 0; cIdx < 6; cIdx++) {
          pendingRow[11 + cIdx] = qaUpdateCols[cIdx];
        }
      }
      var existingSurvey = surveyMap[r.surveyId] || null;
      if (existingSurvey && r.answers && Object.keys(r.answers).length > 0) {
        queueDedicated_(existingSurvey, r, clientRespId);
      }
      skipped++;
      syncedIds.push(clientRespId);
      continue;
    }

    var survey = surveyMap[r.surveyId] || null;
    var surveyTitle = survey ? survey.title : (r.surveyTitle || r.surveyId || 'Survey');
    var administeredLang = String(r.language || 'en').toLowerCase();

    // Process open text translations for human-readable per-survey sheet only,
    // while keeping canonical answers intact in AnswersJSON so SHA-256 recordHash stays valid.
    var processedAnswers = {};
    if (r.answers && typeof r.answers === 'object') {
      var questionsList = survey ? getFlattenedQuestions_(survey) : [];
      var openTextQIds = {};
      for (var qIdx = 0; qIdx < questionsList.length; qIdx++) {
        var quest = questionsList[qIdx];
        if (quest.type === 'long_text' || quest.type === 'short_text' || quest.type === 'text' || /notes|verbatim|comment|feedback/i.test(quest.id)) {
          openTextQIds[quest.id] = true;
        }
      }

      for (var kKey in r.answers) {
        var aVal = r.answers[kKey];
        if (administeredLang !== 'en' && typeof aVal === 'string' && (openTextQIds[kKey] || /notes|verbatim|feedback|comment/i.test(kKey))) {
          processedAnswers[kKey] = translateOpenTextIfNeeded_(aVal, administeredLang);
        } else {
          processedAnswers[kKey] = aVal;
        }
      }
    }

    var cleanAnswersJson = prepareAnswersJsonForSheet_(r.answers || {});

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
      sanitizeSheetCell_(cleanAnswersJson),
      nowIso,
      sanitizeSheetCell_(administeredLang.toUpperCase())
    ];

    pendingNewIndex[clientRespId] = newMasterRows.length;
    newMasterRows.push(masterRow);
    inserted++;
    syncedIds.push(clientRespId);
    insertedResponses.push(r);

    // Queue for batched append to the human-readable Per-Survey sheet tab!
    if (survey) {
      var translatedResponse = Object.assign({}, r, { answers: processedAnswers });
      queueDedicated_(survey, translatedResponse, clientRespId);
    }
  }

  // Single batched write for all new master Responses rows
  if (newMasterRows.length > 0) {
    var startRow = Math.max(2, respSheet.getLastRow() + 1);
    respSheet.getRange(startRow, 1, newMasterRows.length, newMasterRows[0].length).setValues(newMasterRows);
  }

  // Flush dedicated per-survey sheet appends grouped by surveyId (header synced at most once per survey)
  for (var sKey in dedicatedBySurvey) {
    if (Object.prototype.hasOwnProperty.call(dedicatedBySurvey, sKey)) {
      var group = dedicatedBySurvey[sKey];
      appendBatchToSurveyDedicatedSheet_(group.survey, group.items);
    }
  }

  return {
    inserted: inserted,
    skipped: skipped,
    syncedIds: syncedIds,
    insertedResponses: insertedResponses
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
    'GPS Accuracy (m)',
    'Administered Language'
  ];

  var displayNums = computeQuestionDisplayNumbers_(questions);
  for (var i = 0; i < questions.length; i++) {
    var q = questions[i];
    var qLabel = (displayNums[q.id] && displayNums[q.id].label) ? displayNums[q.id].label : String(i + 1);
    var cleanTitle = cleanPipedTextForHeader_(q.title || '') || String(q.id || '');
    headers.push(sanitizeSheetCell_('Q' + qLabel + ': ' + cleanTitle));
  }

  // Skip header write & restyling when existing row-1 headers already match
  if (sheet.getLastRow() >= 1 && sheet.getLastColumn() === headers.length) {
    var existingHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    var allMatch = true;
    for (var h = 0; h < headers.length; h++) {
      if (String(existingHeaders[h]) !== String(headers[h])) {
        allMatch = false;
        break;
      }
    }
    if (allMatch) {
      return sheet;
    }
  }

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground(DB_CONFIG.SURVEY_TAB_HEADER_BG)
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');
  sheet.setFrozenRows(1);
  return sheet;
}

function appendBatchToSurveyDedicatedSheet_(survey, items) {
  if (!survey || !items || items.length === 0) return;
  var sheet = syncSurveyDedicatedSheetHeader_(survey);
  if (!sheet) return;

  var existingIds = getExistingColumnSet_(sheet, 1);
  var questions = getFlattenedQuestions_(survey);
  var rowsToAppend = [];

  for (var idx = 0; idx < items.length; idx++) {
    var item = items[idx];
    var clientRespId = item.clientRespId;
    if (!clientRespId || existingIds[clientRespId]) continue;

    var response = item.response || {};
    var nowIso = item.nowIso || new Date().toISOString();
    var gps = response.gps || {};
    var answers = response.answers || {};
    var administeredLang = String(response.language || 'en').toUpperCase();

    var row = [
      sanitizeSheetCell_(clientRespId),
      sanitizeSheetCell_(String(response.submittedAt || nowIso)),
      sanitizeSheetCell_(String(response.enumerator || 'Field Enumerator')),
      sanitizeSheetCell_(String(response.collectorId || 'default')),
      Number(response.durationSec || 0),
      gps.lat !== undefined ? sanitizeSheetCell_(gps.lat) : '',
      gps.lng !== undefined ? sanitizeSheetCell_(gps.lng) : '',
      gps.accuracy !== undefined ? sanitizeSheetCell_(gps.accuracy) : '',
      sanitizeSheetCell_(administeredLang)
    ];

    for (var i = 0; i < questions.length; i++) {
      var q = questions[i];
      var val = answers[q.id];
      // Dual key fallback
      if (val === undefined || val === null || val === '') {
        if (q.id === 'q_nps_seed') val = answers.q_nps;
        else if (q.id === 'q_field_notes') val = answers.q_verbatim || answers.q_notes;
        else if (q.id === 'q_crop_photo') val = answers.q_field_photo || answers.q_photo;
      }
      row.push(sanitizeSheetCell_(formatAnswerForCell_(val)));
    }

    rowsToAppend.push(row);
    existingIds[clientRespId] = true;
  }

  if (rowsToAppend.length > 0) {
    var startRow = Math.max(2, sheet.getLastRow() + 1);
    sheet.getRange(startRow, 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);
  }
}

function appendToSurveyDedicatedSheet_(survey, response, clientRespId, nowIso) {
  appendBatchToSurveyDedicatedSheet_(survey, [{
    response: response,
    clientRespId: clientRespId,
    nowIso: nowIso
  }]);
}

function cleanPipedTextForHeader_(text) {
  if (!text || typeof text !== 'string') return '';
  var res = text.replace(/\{\{\s*[a-zA-Z0-9_-]+(?:\s*\|\s*(?:'([^']*)'|"([^"]*)"))?\s*\}\}/g, function (match, sqFallback, dqFallback) {
    if (sqFallback !== undefined) return sqFallback;
    if (dqFallback !== undefined) return dqFallback;
    return '';
  });
  return res.replace(/\s+([\?\.\!,:])/g, '$1').replace(/\s{2,}/g, ' ').trim();
}

function computeQuestionDisplayNumbers_(questions) {
  var numMap = {};
  var byId = {};
  var i, q;
  for (i = 0; i < questions.length; i++) {
    q = questions[i];
    if (q && q.id) byId[q.id] = q;
  }

  function resolveRootParent_(item) {
    if (!item || !item.parentQuestionId || !byId[item.parentQuestionId] || item.parentQuestionId === item.id) {
      return null;
    }
    var visited = {};
    visited[item.id] = true;
    var curr = byId[item.parentQuestionId];
    while (curr && curr.parentQuestionId && byId[curr.parentQuestionId]) {
      if (visited[curr.id]) return null;
      visited[curr.id] = true;
      curr = byId[curr.parentQuestionId];
    }
    if (!curr || visited[curr.id]) return null;
    return curr.id;
  }

  var mainCount = 1;
  for (i = 0; i < questions.length; i++) {
    q = questions[i];
    if (!q || !q.id) continue;
    if (!resolveRootParent_(q)) {
      numMap[q.id] = { label: String(mainCount), mainNum: mainCount, hasLetter: false, isSub: false };
      mainCount++;
    }
  }

  var parentSubCounts = {};
  for (i = 0; i < questions.length; i++) {
    q = questions[i];
    if (!q || !q.id) continue;
    var rootId = resolveRootParent_(q);
    if (rootId && numMap[rootId]) {
      var parentEntry = numMap[rootId];
      var parentNum = parentEntry.mainNum;
      parentSubCounts[rootId] = (parentSubCounts[rootId] || 1) + 1;
      var letter = String.fromCharCode(96 + parentSubCounts[rootId]);
      if (!parentEntry.hasLetter) {
        parentEntry.label = parentNum + 'a';
        parentEntry.letter = 'a';
        parentEntry.hasLetter = true;
      }
      numMap[q.id] = {
        label: parentNum + letter,
        mainNum: parentNum,
        letter: letter,
        isSub: true,
        parentId: rootId
      };
    }
  }
  return numMap;
}

function formatAnswerForCell_(val) {
  if (val === null || val === undefined) return '';
  if (Array.isArray(val)) {
    var hasObjects = false;
    for (var idx = 0; idx < val.length; idx++) {
      if (val[idx] !== null && typeof val[idx] === 'object') {
        hasObjects = true;
        break;
      }
    }
    if (!hasObjects) return val.join(', ');
    var formattedItems = [];
    for (var j = 0; j < val.length; j++) {
      var item = val[j];
      if (item === null || item === undefined) continue;
      if (typeof item === 'object') {
        formattedItems.push('[' + (j + 1) + '] ' + formatAnswerForCell_(item));
      } else {
        formattedItems.push(String(item));
      }
    }
    return formattedItems.join(' ; ');
  }
  if (typeof val === 'object') {
    if (val.lat !== undefined && val.lng !== undefined) {
      return val.lat + ', ' + val.lng + (val.label ? ' (' + val.label + ')' : '');
    }
    var parts = [];
    for (var k in val) {
      if (Object.prototype.hasOwnProperty.call(val, k)) {
        parts.push(k + ': ' + formatAnswerForCell_(val[k]));
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

function prepareAnswersJsonForSheet_(answers) {
  if (!answers || typeof answers !== 'object') return '{}';
  var clean = {};
  for (var k in answers) {
    if (!answers.hasOwnProperty(k)) continue;
    var v = answers[k];
    if (typeof v === 'string' && v.indexOf('data:image/') === 0) {
      clean[k] = '[Digital Signature/Image Recorded]';
    } else if (v && typeof v === 'object' && v.dataUrl) {
      if (v.durationSec !== undefined || (v.mimeType && String(v.mimeType).indexOf('audio/') === 0)) {
        clean[k] = {
          capturedAt: v.capturedAt || '',
          durationSec: v.durationSec || 0,
          mimeType: v.mimeType || 'audio/webm',
          transcript: v.transcript || '',
          summary: 'Audio note (' + (v.durationSec || 0) + 's)'
        };
      } else {
        clean[k] = {
          capturedAt: v.capturedAt || '',
          width: v.width || 0,
          height: v.height || 0,
          sizeKb: v.sizeKb || 0,
          summary: 'Photo proof attached (' + (v.sizeKb || 0) + ' KB)'
        };
      }
    } else {
      clean[k] = v;
    }
  }
  return JSON.stringify(clean);
}

function readAnswersFromDedicatedSheet_(ss, surveyId, clientRespId) {
  try {
    var sheets = ss.getSheets();
    var targetSheet = null;
    var shortId = String(surveyId || '').replace(/[^a-zA-Z0-9]/g, '').slice(-6);
    for (var i = 0; i < sheets.length; i++) {
      var sName = sheets[i].getName();
      if (sName.indexOf('Resp_') === 0 && ((shortId && sName.slice(-shortId.length) === shortId) || sName.indexOf(String(surveyId).substring(0, 10)) !== -1)) {
        targetSheet = sheets[i];
        break;
      }
    }
    if (!targetSheet || targetSheet.getLastRow() <= 1) return null;

    var lastCol = targetSheet.getLastColumn();
    var lastRow = targetSheet.getLastRow();
    var headers = targetSheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var ids = targetSheet.getRange(2, 1, lastRow - 1, 1).getValues();

    var rowIndex = -1;
    for (var r = 0; r < ids.length; r++) {
      if (String(ids[r][0]).trim() === String(clientRespId).trim()) {
        rowIndex = r + 2;
        break;
      }
    }
    if (rowIndex === -1) return null;

    var rowValues = targetSheet.getRange(rowIndex, 1, 1, lastCol).getValues()[0];
    var answers = {};
    for (var c = 8; c < headers.length; c++) {
      var header = String(headers[c] || '');
      var cellVal = rowValues[c];
      if (cellVal === undefined || cellVal === null || cellVal === '') continue;

      var matchQ = header.match(/^Q\d+:\s*(.*)/);
      var qTitle = matchQ ? matchQ[1].trim() : header.trim();

      // Normalize common keys
      var qKey = 'q_' + (c - 7);
      if (/county/i.test(qTitle)) qKey = 'q_county';
      else if (/variety|seed/i.test(qTitle)) qKey = 'q_seed_variety';
      else if (/inputs|fertility/i.test(qTitle)) qKey = 'q_inputs_used';
      else if (/gps|landmark/i.test(qTitle)) qKey = 'q_gps_plot';
      else if (/trait|matrix/i.test(qTitle)) qKey = 'q_trait_matrix';
      else if (/yield|harvest/i.test(qTitle)) qKey = 'q_yield_kg';
      else if (/dealer|distance|satisf/i.test(qTitle)) qKey = 'q_dealer_rating';
      else if (/recommend|nps/i.test(qTitle)) { qKey = 'q_nps_seed'; answers['q_nps'] = Number(cellVal) || cellVal; }
      else if (/observation|feedback|notes/i.test(qTitle)) { qKey = 'q_field_notes'; answers['q_verbatim'] = cellVal; }
      else if (/photo|proof/i.test(qTitle)) { qKey = 'q_crop_photo'; answers['q_field_photo'] = cellVal; }
      else if (/signature|consent/i.test(qTitle)) qKey = 'q_farmer_signature';

      answers[qKey] = cellVal;
    }
    return answers;
  } catch (err) {
    return null;
  }
}

function formatCellTimestamp_(val) {
  if (!val) return '';
  if (val instanceof Date) return val.toISOString();
  return String(val).replace(/^'+/, '').trim();
}

function toTimestampMs_(val) {
  if (!val) return NaN;
  if (val instanceof Date) return val.getTime();
  var s = String(val).replace(/^'+/, '').trim();
  if (!s) return NaN;
  return Date.parse(s);
}

function readSurveysRows_(ss) {
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
  return surveys;
}

function readCollectorsRows_(ss, filterSurveyId) {
  var collectors = [];
  var cSheet = ss.getSheetByName(DB_CONFIG.SHEETS.COLLECTORS);
  if (cSheet && cSheet.getLastRow() > 1) {
    var cRows = cSheet.getRange(2, 1, cSheet.getLastRow() - 1, 8).getValues();
    var targetSurveyId = filterSurveyId ? String(filterSurveyId).trim() : '';
    for (var j = 0; j < cRows.length; j++) {
      if (targetSurveyId && String(cRows[j][1] || '').trim() !== targetSurveyId) {
        continue;
      }
      var colJson = cRows[j][7];
      if (colJson) {
        try {
          var parsedCol = JSON.parse(colJson);
          if (!targetSurveyId || String(parsedCol.surveyId || '').trim() === targetSurveyId) {
            collectors.push(parsedCol);
          }
        } catch (e) {}
      }
    }
  }
  return collectors;
}

function readResponsesRows_(ss, sinceIso) {
  var responses = [];
  var rSheet = ss.getSheetByName(DB_CONFIG.SHEETS.RESPONSES);
  if (!rSheet || rSheet.getLastRow() <= 1) return responses;

  var sinceStr = sinceIso ? String(sinceIso).trim() : '';
  var sinceMs = sinceStr ? Date.parse(sinceStr) : NaN;
  var filterBySince = !isNaN(sinceMs);

  var maxCols = Math.max(20, rSheet.getLastColumn());
  var rRows = rSheet.getRange(2, 1, rSheet.getLastRow() - 1, maxCols).getValues();
  for (var k = 0; k < rRows.length; k++) {
    var row = rRows[k];

    if (filterBySince) {
      var rawReceived = row[18] || (String(row[11] || '').trim().charAt(0) === '{' ? row[12] : '') || row[5];
      var receivedMs = toTimestampMs_(rawReceived);
      if (!isNaN(receivedMs)) {
        if (receivedMs < sinceMs) continue;
      } else {
        var receivedStr = formatCellTimestamp_(rawReceived);
        if (receivedStr && receivedStr < sinceStr) continue;
      }
    }

    // Adaptive schema detection:
    // - Newer rows (Row 12 onwards): AnswersJSON in Col R (index 17), Language in Col T (index 19).
    // - Legacy rows (Rows 2 to 11): AnswersJSON in Col L (index 11).
    var answers = {};
    var reviewStatus = 'pending_review';
    var qaFlags = [];
    var supervisorId = '';
    var npsCategory = '';
    var recordHash = '';
    var calculated = {};
    var syncedAt = formatCellTimestamp_(row[5]);
    var language = String(row[19] || 'en').toLowerCase().trim();

    var valR = String(row[17] || '').trim();
    var valL = String(row[11] || '').trim();

    if (valR.charAt(0) === "'") valR = valR.substring(1).trim();
    if (valL.charAt(0) === "'") valL = valL.substring(1).trim();

    if (valR.charAt(0) === '{') {
      // Modern 19/20-column layout (Row 12 onwards)
      try { answers = JSON.parse(valR); } catch (e) { answers = {}; }
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
      syncedAt = formatCellTimestamp_(row[18]) || formatCellTimestamp_(row[5]);
    } else if (valL.charAt(0) === '{') {
      // Legacy layout (Rows 2 to 11): Answers stored in Col L
      try { answers = JSON.parse(valL); } catch (e) { answers = {}; }
      reviewStatus = 'approved';
      qaFlags = ['LEGACY_ROW'];
      syncedAt = formatCellTimestamp_(row[12]) || formatCellTimestamp_(row[5]);
    } else if (typeof row[17] === 'object' && row[17] !== null) {
      answers = row[17];
    } else if (typeof row[11] === 'object' && row[11] !== null) {
      answers = row[11];
    }

    // Self-healing fallback: If AnswersJSON was empty or corrupted, reconstruct from dedicated per-survey tab
    if (Object.keys(answers).length === 0 && row[1] && row[0]) {
      var dedicatedAnswers = readAnswersFromDedicatedSheet_(ss, String(row[1]), String(row[0]));
      if (dedicatedAnswers && Object.keys(dedicatedAnswers).length > 0) {
        answers = dedicatedAnswers;
      }
    }

    var metaObj = (calculated && calculated._meta && typeof calculated._meta === 'object') ? calculated._meta : {};
    if (calculated && calculated._meta) {
      delete calculated._meta;
    }

    responses.push({
      id: String(row[0]),
      clientResponseId: String(row[0]),
      surveyId: String(row[1]),
      surveyTitle: String(row[2]),
      collectorId: String(row[3]),
      enumerator: String(row[4]),
      submittedByUserId: metaObj.submittedByUserId || '',
      submittedByUserRole: metaObj.submittedByUserRole || '',
      language: language || 'en',
      submittedAt: formatCellTimestamp_(row[5]),
      durationSec: Number(row[6] || 0),
      gps: (row[7] !== '' && row[8] !== '') ? {
        lat: Number(row[7]),
        lng: Number(row[8]),
        accuracy: Number(row[9] || 0),
        label: metaObj.gpsLabel || '',
        altitude: metaObj.gpsAltitude !== undefined ? metaObj.gpsAltitude : null,
        method: metaObj.gpsMethod || '',
        manual: Boolean(metaObj.gpsManual)
      } : null,
      status: String(row[10] || 'complete'),
      reviewStatus: reviewStatus,
      qaFlags: qaFlags,
      supervisorId: String(row[13] || ''),
      audit: metaObj.audit || null,
      auditTrail: Array.isArray(metaObj.auditTrail) ? metaObj.auditTrail : [],
      npsCategory: String(row[14] || ''),
      recordHash: String(row[15] || ''),
      calculated: calculated,
      answers: answers,
      syncStatus: 'synced',
      syncedAt: syncedAt || formatCellTimestamp_(row[18]) || formatCellTimestamp_(row[5])
    });
  }
  return responses;
}

function readDatabaseDataDelta_(sinceIso) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    surveys: readSurveysRows_(ss),
    collectors: readCollectorsRows_(ss, ''),
    responses: readResponsesRows_(ss, sinceIso),
    personnel: readPersonnelRows_(ss)
  };
}

function readAllDatabaseData_() {
  return readDatabaseDataDelta_('');
}

function getSurveyMap_() {
  try {
    var cachedRaw = CacheService.getScriptCache().get('SURVEY_MAP_V1');
    if (cachedRaw) {
      var parsed = JSON.parse(cachedRaw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {}

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var surveys = readSurveysRows_(ss);
  var map = {};
  for (var i = 0; i < surveys.length; i++) {
    if (surveys[i] && surveys[i].id) {
      map[surveys[i].id] = surveys[i];
    }
  }

  try {
    var serialized = JSON.stringify(map);
    if (serialized.length <= CACHE_MAX_BYTES_) {
      CacheService.getScriptCache().put('SURVEY_MAP_V1', serialized, CACHE_TTL_SURVEY_SEC_);
    }
  } catch (e) {}

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

function getExistingColumnIndexMap_(sheet, colIndex) {
  var map = {};
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return map;
  var values = sheet.getRange(2, colIndex, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    var val = String(values[i][0]);
    if (val) map[val] = i + 2;
  }
  return map;
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
  if (sheetName === DB_CONFIG.SHEETS.SURVEYS) {
    invalidateSurveyCache_(idValue);
  }
}

/**
 * Purges all response rows for a single surveyId from both the master Responses sheet
 * and the survey's dedicated sheet tab while preserving Row 1 headers, questions,
 * collectors, and the shared survey URL.
 */
function clearSurveyResponses_(surveyId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var targetId = String(surveyId || '').trim();
  var deletedMasterRows = 0;
  var deletedDedicatedRows = 0;
  if (!targetId) return { deletedMasterRows: 0, deletedDedicatedRows: 0 };

  // 1. Purge matching rows from master Responses sheet in one batched rewrite
  var respSheet = ss.getSheetByName(DB_CONFIG.SHEETS.RESPONSES);
  if (respSheet && respSheet.getLastRow() > 1) {
    var lastRow = respSheet.getLastRow();
    var lastCol = respSheet.getLastColumn();
    var allValues = respSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    var keepRows = [];
    for (var i = 0; i < allValues.length; i++) {
      if (String(allValues[i][1] || '').trim() === targetId) {
        deletedMasterRows++;
      } else {
        keepRows.push(allValues[i]);
      }
    }
    if (deletedMasterRows > 0) {
      respSheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
      if (keepRows.length > 0) {
        respSheet.getRange(2, 1, keepRows.length, lastCol).setValues(keepRows);
      }
      var trailingRows = (lastRow - 1) - keepRows.length;
      if (trailingRows > 0) {
        respSheet.deleteRows(2 + keepRows.length, trailingRows);
      }
    }
  }

  // 2. Purge data rows from the survey's dedicated sheet tab (keeping Row 1 headers)
  var surveyMap = getSurveyMap_();
  var survey = surveyMap[targetId];
  if (survey) {
    var dedName = getSurveyDedicatedSheetName_(survey);
    var dedSheet = ss.getSheetByName(dedName);
    if (dedSheet && dedSheet.getLastRow() > 1) {
      deletedDedicatedRows = dedSheet.getLastRow() - 1;
      dedSheet.deleteRows(2, deletedDedicatedRows);
    }
  }

  return {
    deletedMasterRows: deletedMasterRows,
    deletedDedicatedRows: deletedDedicatedRows
  };
}

/**
 * Deletes a survey from Surveys sheet and (when purgeCloudData !== false)
 * also removes its dedicated Google Sheets tab, collector rows, and response rows.
 */
function deleteSurveyCompletely_(surveyId, purgeCloudData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var targetId = String(surveyId || '').trim();
  var stats = { deletedMasterRows: 0, deletedDedicatedSheet: false, deletedCollectors: 0 };
  if (!targetId) return stats;

  if (purgeCloudData !== false) {
    // Capture dedicated tab name BEFORE removing row from Surveys sheet
    var surveyMap = getSurveyMap_();
    var survey = surveyMap[targetId];
    var clearRes = clearSurveyResponses_(targetId);
    stats.deletedMasterRows = clearRes.deletedMasterRows || 0;

    if (survey) {
      var dedName = getSurveyDedicatedSheetName_(survey);
      var dedSheet = ss.getSheetByName(dedName);
      if (dedSheet && ss.getSheets().length > 1) {
        try {
          ss.deleteSheet(dedSheet);
          stats.deletedDedicatedSheet = true;
        } catch (e) {}
      }
    }

    // Purge matching collector rows (Col 2 = SurveyID)
    var colSheet = ss.getSheetByName(DB_CONFIG.SHEETS.COLLECTORS);
    if (colSheet && colSheet.getLastRow() > 1) {
      var lastRow = colSheet.getLastRow();
      var lastCol = colSheet.getLastColumn();
      var vals = colSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
      var keep = [];
      for (var i = 0; i < vals.length; i++) {
        if (String(vals[i][1] || '').trim() === targetId) {
          stats.deletedCollectors++;
        } else {
          keep.push(vals[i]);
        }
      }
      if (stats.deletedCollectors > 0) {
        colSheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
        if (keep.length > 0) {
          colSheet.getRange(2, 1, keep.length, lastCol).setValues(keep);
        }
        var trailing = (lastRow - 1) - keep.length;
        if (trailing > 0) colSheet.deleteRows(2 + keep.length, trailing);
      }
    }
  }

  deleteRowById_(DB_CONFIG.SHEETS.SURVEYS, 1, targetId);
  return stats;
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

/**
 * Samples up to `maxCount` concise verbatim entries from an array of strings or objects,
 * using evenly spaced stride sampling when the input exceeds `maxCount`.
 */
function sampleVerbatimsForAi_(rawVerbatims, maxCount) {
  if (!Array.isArray(rawVerbatims) || rawVerbatims.length === 0) return [];
  var limit = maxCount > 0 ? maxCount : 80;
  var cleaned = [];

  for (var i = 0; i < rawVerbatims.length; i++) {
    var item = rawVerbatims[i];
    if (item === null || item === undefined) continue;
    if (typeof item === 'string') {
      var s = item.replace(/\s+/g, ' ').trim();
      if (s) cleaned.push(s.substring(0, 320));
    } else if (typeof item === 'object') {
      var rawText = item.text || item.answer || item.verbatim || item.value || '';
      var text = String(rawText).replace(/\s+/g, ' ').trim();
      if (!text) continue;
      var metaParts = [];
      var qTitle = item.questionTitle || item.question || item.questionLabel || item.field || '';
      if (qTitle) metaParts.push('Q:' + String(qTitle).replace(/\s+/g, ' ').trim().substring(0, 90));
      var seg = item.segment || '';
      if (seg) metaParts.push('Seg:' + String(seg).replace(/\s+/g, ' ').trim().substring(0, 40));
      var loc = item.location || item.county || item.region || '';
      if (loc) metaParts.push('Loc:' + String(loc).replace(/\s+/g, ' ').trim().substring(0, 40));
      var lang = item.lang || item.language || '';
      if (lang) metaParts.push('Lang:' + String(lang).trim().substring(0, 12));
      var prefix = metaParts.length > 0 ? '[' + metaParts.join(' | ') + '] ' : '';
      cleaned.push(prefix + text.substring(0, 320));
    }
  }

  if (cleaned.length <= limit) return cleaned;

  var sampled = [];
  var step = cleaned.length / limit;
  for (var j = 0; j < limit; j++) {
    var idx = Math.floor(j * step);
    if (idx >= cleaned.length) idx = cleaned.length - 1;
    sampled.push(cleaned[idx]);
  }
  return sampled;
}

/**
 * Hybrid Cloud Verbatim Intelligence using Gemini 2.5 Flash.
 * If `GEMINI_API_KEY` is absent in Script Properties or if the API fails,
 * returns a structured `offline_fallback` payload so the client never breaks.
 */
var GEMINI_CONFIG = {
  GEMINI_MODEL_FALLBACK_CHAIN: [
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.7-flash',
    'gemini-3.8-flash'
  ],
  DEFAULT_MODEL: 'gemini-3.5-flash-lite',
  LAST_WORKING_MODEL_PROP: 'GEMINI_LAST_WORKING_MODEL'
};

/**
 * Calls Gemini generateContent using the configured model fallback chain.
 * Prioritizes the last working model saved in Script Properties, falls back
 * through GEMINI_MODEL_FALLBACK_CHAIN on availability/quota errors, and
 * persists the working model back to Script Properties.
 */
function callGeminiWithFallback_(geminiKey, requestBody) {
  var props = null;
  var savedModel = '';
  try {
    props = PropertiesService.getScriptProperties();
    savedModel = String(props.getProperty(GEMINI_CONFIG.LAST_WORKING_MODEL_PROP) || '').trim();
  } catch (e) {
    props = null;
    savedModel = '';
  }

  var candidates = [];
  var addUnique = function(m) {
    var clean = String(m || '').trim();
    if (clean && candidates.indexOf(clean) === -1) {
      candidates.push(clean);
    }
  };

  // 1. Try last known working model first for lowest latency
  if (savedModel) addUnique(savedModel);
  // 2. Then default model, followed by full fallback chain in order
  addUnique(GEMINI_CONFIG.DEFAULT_MODEL);
  for (var i = 0; i < GEMINI_CONFIG.GEMINI_MODEL_FALLBACK_CHAIN.length; i++) {
    addUnique(GEMINI_CONFIG.GEMINI_MODEL_FALLBACK_CHAIN[i]);
  }

  var errors = [];
  for (var idx = 0; idx < candidates.length; idx++) {
    var model = candidates[idx];
    var endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent';

    try {
      var response = UrlFetchApp.fetch(endpoint, {
        method: 'post',
        contentType: 'application/json',
        headers: {
          'x-goog-api-key': geminiKey
        },
        payload: JSON.stringify(requestBody),
        muteHttpExceptions: true
      });

      var statusCode = response.getResponseCode();
      var responseText = response.getContentText() || '';

      if (statusCode === 401 || statusCode === 403) {
        var authExcerpt = responseText.replace(/\s+/g, ' ').trim().substring(0, 180);
        throw new Error('Gemini API auth error HTTP ' + statusCode + (authExcerpt ? ': ' + authExcerpt : ''));
      }

      if (statusCode < 200 || statusCode >= 300) {
        var errExcerpt = responseText.replace(/\s+/g, ' ').trim().substring(0, 140);
        errors.push(model + ' (HTTP ' + statusCode + (errExcerpt ? ': ' + errExcerpt : '') + ')');
        continue;
      }

      var rawResp = JSON.parse(responseText);
      var candidateText = '';
      if (
        rawResp &&
        Array.isArray(rawResp.candidates) &&
        rawResp.candidates.length > 0 &&
        rawResp.candidates[0] &&
        rawResp.candidates[0].content &&
        Array.isArray(rawResp.candidates[0].content.parts) &&
        rawResp.candidates[0].content.parts.length > 0
      ) {
        candidateText = String(rawResp.candidates[0].content.parts[0].text || '').trim();
      }

      if (!candidateText) {
        errors.push(model + ' (empty candidate)');
        continue;
      }

      // Persist last working model in Script Properties when it changes
      if (props && model !== savedModel) {
        try {
          props.setProperty(GEMINI_CONFIG.LAST_WORKING_MODEL_PROP, model);
        } catch (saveErr) {}
      }

      return {
        ok: true,
        model: model,
        text: candidateText
      };
    } catch (callErr) {
      var msg = String(callErr && callErr.message ? callErr.message : callErr);
      if (msg.indexOf('Gemini API auth error') === 0) {
        throw callErr;
      }
      errors.push(model + ' (' + msg + ')');
    }
  }

  throw new Error('All Gemini models failed: ' + errors.join(' | '));
}

function analyzeVerbatimsWithGemini_(payload) {
  var nowIso = new Date().toISOString();
  var geminiKey = '';
  try {
    geminiKey = String(PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY') || '').trim();
  } catch (propErr) {
    geminiKey = '';
  }

  if (!geminiKey) {
    return {
      ok: true,
      provider: 'offline_fallback',
      configured: false,
      message: 'GEMINI_API_KEY is not set in Apps Script Project Properties; client offline NLP briefing remains active.',
      serverTime: nowIso
    };
  }

  var rawVerbatims = Array.isArray(payload && payload.verbatims) ? payload.verbatims : [];
  var sampled = sampleVerbatimsForAi_(rawVerbatims, 80);
  if (sampled.length === 0) {
    return {
      ok: true,
      provider: 'offline_fallback',
      configured: true,
      message: 'No verbatim responses supplied for AI analysis.',
      serverTime: nowIso
    };
  }

  var surveyTitle = (payload && payload.surveyTitle) ? String(payload.surveyTitle).trim().substring(0, 140) : 'Survey';
  var numberedList = [];
  for (var i = 0; i < sampled.length; i++) {
    numberedList.push((i + 1) + '. ' + sampled[i]);
  }

  var promptText = [
    'You are an expert qualitative research and survey intelligence analyst.',
    'Analyze the following ' + sampled.length + ' survey verbatim responses (sampled from ' + rawVerbatims.length + ' total) for the survey: "' + surveyTitle + '".',
    'Each verbatim may include its exact question title [Q:...] and respondent segment/context. Ground all themes, terminology, and recommendations strictly in the actual domain and questions of this survey.',
    'Responses may contain English, Swahili, French, or Portuguese; synthesize all findings in clear, concise executive English.',
    'Return strictly valid JSON with exactly these keys:',
    '- "headline": string (2 concise sentences synthesizing the overall substance of what respondents actually said — do NOT just restate sentiment percentages)',
    '- "summaryBullets": string[] (3 to 5 crisp, evidence-backed insights putting together what is working, key challenges, and recurring requests across respondents)',
    '- "topThemes": Array<{ "theme": string, "countEstimate": number, "sentiment": "positive"|"neutral"|"negative"|"mixed", "summary": string }> (3 to 6 themes)',
    '- "recommendations": string[] (3 to 5 concrete, actionable recommendations tailored to this survey)',
    '- "urgentRisks": string[] (0 to 5 urgent risks, safety/quality issues, or critical complaints; empty array if none)',
    '',
    'Verbatim sample:',
    numberedList.join('\n')
  ].join('\n');

  try {
    var requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: promptText }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    };

    var geminiRes = callGeminiWithFallback_(geminiKey, requestBody);
    var model = geminiRes.model;
    var candidateText = geminiRes.text;

    // Strip optional markdown code fences if present
    var jsonText = candidateText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    var parsed = JSON.parse(jsonText);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Gemini API returned non-object JSON payload.');
    }

    var briefing = {
      headline: typeof parsed.headline === 'string' ? parsed.headline : '',
      summaryBullets: Array.isArray(parsed.summaryBullets) ? parsed.summaryBullets : [],
      topThemes: Array.isArray(parsed.topThemes) ? parsed.topThemes : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      urgentRisks: Array.isArray(parsed.urgentRisks) ? parsed.urgentRisks : []
    };

    return {
      ok: true,
      provider: 'gemini',
      configured: true,
      briefing: briefing,
      model: model,
      sampledCount: sampled.length,
      totalReceived: rawVerbatims.length,
      serverTime: new Date().toISOString()
    };
  } catch (err) {
    return {
      ok: true,
      provider: 'offline_fallback',
      error: (err && err.message) ? String(err.message) : 'Gemini verbatim analysis failed.',
      serverTime: new Date().toISOString()
    };
  }
}

/**
 * Parses a comma-separated string (or array) of email recipients into clean, validated email addresses.
 */
function parseAlertRecipients_(raw) {
  var list = Array.isArray(raw) ? raw : String(raw || '').split(/[,;\s]+/);
  var clean = [];
  var seen = {};
  for (var i = 0; i < list.length; i++) {
    var addr = String(list[i] || '').trim();
    if (!addr || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) continue;
    var key = addr.toLowerCase();
    if (!seen[key]) {
      seen[key] = true;
      clean.push(addr);
    }
  }
  return clean;
}

/**
 * HTML-escapes dynamic strings before embedding them in MailApp HTML email bodies.
 */
function escapeHtmlEmail_(str) {
  return String(str === null || str === undefined ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Extracts all plain-text answer strings from a response's answers object (skipping base64 data URLs).
 */
function extractResponseTextValues_(answers) {
  var texts = [];
  if (!answers || typeof answers !== 'object') return texts;
  function visit_(val) {
    if (val === null || val === undefined) return;
    if (typeof val === 'string') {
      var trimmed = val.trim();
      if (trimmed && trimmed.indexOf('data:image/') !== 0 && trimmed.indexOf('data:audio/') !== 0) {
        texts.push(trimmed);
      }
      return;
    }
    if (Array.isArray(val)) {
      for (var i = 0; i < val.length; i++) visit_(val[i]);
      return;
    }
    if (typeof val === 'object') {
      for (var k in val) {
        if (Object.prototype.hasOwnProperty.call(val, k) && k !== 'dataUrl') {
          visit_(val[k]);
        }
      }
    }
  }
  visit_(answers);
  return texts;
}

/**
 * Real-time risk alert dispatcher called AFTER releasing ScriptLock on SUBMIT_RESPONSE / BATCH_SYNC.
 * Checks each newly inserted response for:
 *  - IMPOSSIBLE_TRAVEL_VELOCITY flag (when survey.alerts.alertOnVelocity is enabled)
 *  - High-urgency keywords (fake|counterfeit|urgent|broken|failed|hasara|emergency) (when survey.alerts.alertOnUrgency is enabled)
 * All MailApp calls are wrapped in try/catch so email errors never break sync.
 */
function maybeSendRealtimeAlerts_(surveyMap, insertedResponses) {
  var sent = 0;
  var details = [];
  if (!Array.isArray(insertedResponses) || insertedResponses.length === 0) {
    return { sent: 0, details: details };
  }
  var urgencyRegex = /\b(fake|counterfeit|urgent|broken|failed|hasara|emergency)\b/i;

  for (var i = 0; i < insertedResponses.length; i++) {
    try {
      var r = insertedResponses[i];
      if (!r || !r.surveyId) continue;
      var survey = surveyMap && surveyMap[r.surveyId];
      if (!survey || !survey.alerts || !survey.alerts.enabled) continue;
      var recipients = parseAlertRecipients_(survey.alerts.recipients);
      if (recipients.length === 0) continue;

      var reasons = [];
      var evidenceLines = [];

      // 1. Impossible Travel Velocity check
      if (survey.alerts.alertOnVelocity) {
        var flags = Array.isArray(r.qaFlags)
          ? r.qaFlags
          : String(r.qaFlags || '').split(',').map(function(s) { return s.trim(); });
        for (var fIdx = 0; fIdx < flags.length; fIdx++) {
          if (String(flags[fIdx] || '').toUpperCase() === 'IMPOSSIBLE_TRAVEL_VELOCITY') {
            reasons.push('Impossible Travel Velocity');
            evidenceLines.push('QA Flag: IMPOSSIBLE_TRAVEL_VELOCITY');
            break;
          }
        }
      }

      // 2. High-Urgency Keyword check
      if (survey.alerts.alertOnUrgency) {
        var textValues = extractResponseTextValues_(r.answers);
        var matchedKeywords = [];
        var matchedExcerpts = [];
        for (var tIdx = 0; tIdx < textValues.length; tIdx++) {
          var txt = textValues[tIdx];
          var m = txt.match(urgencyRegex);
          if (m) {
            var kw = m[1].toLowerCase();
            if (matchedKeywords.indexOf(kw) === -1) matchedKeywords.push(kw);
            if (matchedExcerpts.length < 3) {
              matchedExcerpts.push(txt.substring(0, 220));
            }
          }
        }
        if (matchedKeywords.length > 0) {
          reasons.push('Urgent Keyword (' + matchedKeywords.join(', ') + ')');
          for (var eIdx = 0; eIdx < matchedExcerpts.length; eIdx++) {
            evidenceLines.push('Excerpt: "' + matchedExcerpts[eIdx] + '"');
          }
        }
      }

      if (reasons.length === 0) continue;

      var respId = String(r.clientResponseId || r.id || 'unknown');
      var surveyTitle = String(survey.title || r.surveyId);
      var enumerator = String(r.enumerator || 'Anonymous');
      var submittedAt = String(r.submittedAt || new Date().toISOString());
      var subject = '[AE Survey Alert] ' + reasons.join(' + ') + ' — ' + surveyTitle.substring(0, 80);

      var evidenceHtml = '';
      for (var lIdx = 0; lIdx < evidenceLines.length; lIdx++) {
        evidenceHtml += '<li style="margin:4px 0;color:#111613;">' + escapeHtmlEmail_(evidenceLines[lIdx]) + '</li>';
      }

      var htmlBody =
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #E4E7E4;border-radius:8px;overflow:hidden;">' +
        '<div style="background:#831C1E;color:#FFFFFF;padding:14px 20px;">' +
        '<div style="font-size:11px;letter-spacing:0.06em;text-transform:uppercase;opacity:0.9;">AE Survey Real-Time Risk Alert</div>' +
        '<div style="font-size:16px;font-weight:bold;margin-top:4px;">' + escapeHtmlEmail_(surveyTitle) + '</div>' +
        '</div>' +
        '<div style="padding:18px 20px;background:#FFFFFF;font-size:13px;color:#111613;line-height:1.5;">' +
        '<p style="margin:0 0 12px 0;"><strong>Trigger:</strong> ' + escapeHtmlEmail_(reasons.join(' &middot; ')) + '</p>' +
        '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:14px;">' +
        '<tr><td style="padding:5px 0;color:#525B56;width:130px;">Response ID</td><td style="padding:5px 0;font-family:monospace;">' + escapeHtmlEmail_(respId) + '</td></tr>' +
        '<tr><td style="padding:5px 0;color:#525B56;">Enumerator</td><td style="padding:5px 0;">' + escapeHtmlEmail_(enumerator) + '</td></tr>' +
        '<tr><td style="padding:5px 0;color:#525B56;">Submitted At</td><td style="padding:5px 0;">' + escapeHtmlEmail_(submittedAt) + '</td></tr>' +
        '</table>' +
        '<div style="background:#FAFBF9;border:1px solid #E4E7E4;border-radius:6px;padding:10px 14px;">' +
        '<div style="font-size:11px;font-weight:bold;color:#525B56;margin-bottom:4px;">Detected Evidence</div>' +
        '<ul style="margin:0;padding-left:18px;font-size:12px;">' + evidenceHtml + '</ul>' +
        '</div>' +
        '</div>' +
        '</div>';

      MailApp.sendEmail({
        to: recipients.join(','),
        subject: subject,
        htmlBody: htmlBody
      });
      sent++;
      details.push({ surveyId: survey.id, responseId: respId, reasons: reasons, recipients: recipients });
    } catch (alertErr) {
      // Never allow MailApp quota or network errors to interrupt sync
    }
  }
  return { sent: sent, details: details };
}

/**
 * Compiles and emails an HTML daily digest for a single survey via MailApp.sendEmail.
 */
function sendSurveyDailyDigest_(survey, allResponses, recipientsOverride, surveyUrlOverride) {
  if (!survey || !survey.id) {
    return { ok: false, sent: false, error: 'Invalid survey.' };
  }
  var rawRecipients = recipientsOverride || (survey.alerts && survey.alerts.recipients) || '';
  var recipients = parseAlertRecipients_(rawRecipients);
  if (recipients.length === 0) {
    return { ok: false, sent: false, error: 'No valid recipient email addresses configured for this survey.' };
  }

  var nowMs = Date.now();
  var cutoffMs = nowMs - 24 * 60 * 60 * 1000;
  var totalResponses = 0;
  var last24hResponses = 0;
  var flaggedCount = 0;

  var list = Array.isArray(allResponses) ? allResponses : [];
  for (var i = 0; i < list.length; i++) {
    var r = list[i];
    if (!r || String(r.surveyId || '') !== String(survey.id)) continue;
    totalResponses++;
    var ts = Date.parse(String(r.submittedAt || r.syncedAt || ''));
    if (!isNaN(ts) && ts >= cutoffMs) {
      last24hResponses++;
    }
    var hasFlags = Array.isArray(r.qaFlags) && r.qaFlags.length > 0;
    var revStatus = String(r.reviewStatus || '').toLowerCase();
    if (hasFlags || revStatus === 'flagged' || revStatus === 'rejected') {
      flaggedCount++;
    }
  }

  var appUrl = String(surveyUrlOverride || '').trim();
  if (!appUrl) {
    try {
      appUrl = String(PropertiesService.getScriptProperties().getProperty('AE_APP_URL') || '').trim();
    } catch (e) {}
  }
  var surveyLink = '';
  if (appUrl && /^https?:\/\//i.test(appUrl)) {
    var sep = appUrl.indexOf('?') === -1 ? '?' : '&';
    surveyLink = appUrl + sep + 'view=report&survey=' + encodeURIComponent(String(survey.id));
  } else {
    try {
      surveyLink = SpreadsheetApp.getActiveSpreadsheet().getUrl();
    } catch (e) {
      surveyLink = '';
    }
  }

  var surveyTitle = String(survey.title || survey.id);
  var subject = '[AE Survey Digest] ' + surveyTitle.substring(0, 75) + ' — ' + last24hResponses + ' new (24h) / ' + totalResponses + ' total';

  var linkBlock = surveyLink
    ? '<div style="margin-top:18px;"><a href="' + escapeHtmlEmail_(surveyLink) + '" style="display:inline-block;background:#247B50;color:#FFFFFF;text-decoration:none;font-weight:bold;font-size:13px;padding:10px 18px;border-radius:6px;">Open Live Survey Report &rarr;</a></div>'
    : '';

  var htmlBody =
    '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #E4E7E4;border-radius:8px;overflow:hidden;">' +
    '<div style="background:#0B2B1E;color:#FFFFFF;padding:16px 20px;">' +
    '<div style="font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#9CE2B5;">AE Survey Daily Digest</div>' +
    '<div style="font-size:17px;font-weight:bold;margin-top:4px;">' + escapeHtmlEmail_(surveyTitle) + '</div>' +
    '</div>' +
    '<div style="padding:20px;background:#FFFFFF;color:#111613;font-size:13px;line-height:1.5;">' +
    '<table style="width:100%;border-collapse:collapse;margin-bottom:14px;">' +
    '<tr>' +
    '<td style="padding:12px;border:1px solid #E4E7E4;border-radius:6px;text-align:center;width:33%;">' +
    '<div style="font-size:11px;color:#525B56;">Total Responses</div>' +
    '<div style="font-size:22px;font-weight:bold;color:#111613;margin-top:4px;">' + totalResponses + '</div>' +
    '</td>' +
    '<td style="padding:12px;border:1px solid #E4E7E4;border-radius:6px;text-align:center;width:33%;">' +
    '<div style="font-size:11px;color:#525B56;">Last 24 Hours</div>' +
    '<div style="font-size:22px;font-weight:bold;color:#247B50;margin-top:4px;">' + last24hResponses + '</div>' +
    '</td>' +
    '<td style="padding:12px;border:1px solid #E4E7E4;border-radius:6px;text-align:center;width:33%;">' +
    '<div style="font-size:11px;color:#525B56;">Flagged / QA</div>' +
    '<div style="font-size:22px;font-weight:bold;color:' + (flaggedCount > 0 ? '#C4242A' : '#111613') + ';margin-top:4px;">' + flaggedCount + '</div>' +
    '</td>' +
    '</tr>' +
    '</table>' +
    '<p style="margin:0;color:#525B56;font-size:12px;">Generated at ' + escapeHtmlEmail_(new Date(nowMs).toISOString()) + ' &middot; Status: ' + escapeHtmlEmail_(survey.status || 'Active') + '</p>' +
    linkBlock +
    '</div>' +
    '</div>';

  try {
    MailApp.sendEmail({
      to: recipients.join(','),
      subject: subject,
      htmlBody: htmlBody
    });
    return {
      ok: true,
      sent: true,
      recipients: recipients.join(', '),
      stats: {
        totalResponses: totalResponses,
        last24hResponses: last24hResponses,
        flaggedCount: flaggedCount,
        surveyLink: surveyLink
      }
    };
  } catch (mailErr) {
    return {
      ok: false,
      sent: false,
      error: (mailErr && mailErr.message) ? String(mailErr.message) : 'MailApp.sendEmail failed.'
    };
  }
}

/**
 * Top-level Apps Script function for time-driven daily digest triggers.
 * Configure via Apps Script -> Triggers -> Add Trigger -> sendDailyDigestTrigger (Time-driven, Day timer).
 */
function sendDailyDigestTrigger() {
  ensureDatabaseInitialized_();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var surveys = readSurveysRows_(ss);
  var responses = readResponsesRows_(ss, '');
  var surveysProcessed = 0;
  var emailsSent = 0;

  for (var i = 0; i < surveys.length; i++) {
    var s = surveys[i];
    if (!s || !s.alerts || !s.alerts.enabled) continue;
    if (parseAlertRecipients_(s.alerts.recipients).length === 0) continue;
    surveysProcessed++;
    var res = sendSurveyDailyDigest_(s, responses, '', '');
    if (res && res.sent) {
      emailsSent++;
    }
  }

  return {
    ok: true,
    surveysProcessed: surveysProcessed,
    emailsSent: emailsSent
  };
}

/**
 * Natural-language "Ask Your Survey" Q&A powered by Gemini 2.5 Flash.
 * Grounded strictly in the supplied quantitative breakdown + sampled open-ended verbatims.
 */
function askSurveyWithGemini_(payload) {
  var nowIso = new Date().toISOString();
  var geminiKey = '';
  try {
    geminiKey = String(PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY') || '').trim();
  } catch (e) {
    geminiKey = '';
  }

  if (!geminiKey) {
    return {
      ok: true,
      provider: 'offline_fallback',
      configured: false,
      message: 'GEMINI_API_KEY is not set in Apps Script Project Properties; using local offline Q&A.',
      serverTime: nowIso
    };
  }

  var question = String((payload && payload.question) || '').trim().substring(0, 500);
  if (!question) {
    return { ok: false, error: 'Question text is required.' };
  }

  var surveyTitle = String((payload && payload.surveyTitle) || 'Survey').trim().substring(0, 140);
  var responseCount = Number((payload && payload.responseCount) || 0);
  var quantSummary = Array.isArray(payload && payload.quantSummary) ? payload.quantSummary.slice(0, 25) : [];
  var verbatims = Array.isArray(payload && payload.verbatims) ? payload.verbatims.slice(0, 60) : [];

  var promptText = [
    'You are an expert quantitative & qualitative survey research analyst.',
    'Answer the user question strictly using the provided data for survey: "' + surveyTitle + '" (n=' + responseCount + ' filtered responses).',
    'Cite exact numbers, percentages, and short respondent quotes where relevant. Never invent statistics that are not in the supplied data.',
    'Return strictly valid JSON with these exact keys:',
    '- "answer": string (2 to 4 clear, direct sentences answering the user question)',
    '- "keyPoints": string[] (2 to 4 crisp supporting bullet points with exact numbers or patterns)',
    '- "citedEvidence": string[] (0 to 3 short verbatim quotes or exact metric facts supporting the answer)',
    '',
    'USER QUESTION:',
    question,
    '',
    'QUANTITATIVE SUMMARY:',
    JSON.stringify(quantSummary),
    '',
    'SAMPLED OPEN-ENDED RESPONSES:',
    verbatims.map(function(v, idx) { return (idx + 1) + '. ' + String(v || '').substring(0, 240); }).join('\n')
  ].join('\n');

  try {
    var geminiRes = callGeminiWithFallback_(geminiKey, {
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
    });
    var model = geminiRes.model;
    var cand = geminiRes.text;
    var jsonText = cand.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    var parsed = JSON.parse(jsonText);

    return {
      ok: true,
      provider: 'gemini',
      configured: true,
      model: model,
      answer: typeof parsed.answer === 'string' ? parsed.answer : '',
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.slice(0, 5) : [],
      citedEvidence: Array.isArray(parsed.citedEvidence) ? parsed.citedEvidence.slice(0, 4) : [],
      serverTime: nowIso
    };
  } catch (err) {
    return {
      ok: true,
      provider: 'offline_fallback',
      configured: true,
      message: 'Gemini Q&A error (' + String(err && err.message ? err.message : err) + '); using local offline Q&A.',
      serverTime: nowIso
    };
  }
}

/**
 * Send a test webhook ping from Apps Script (Admin-only).
 */
function testSurveyWebhook_(payload) {
  var url = String((payload && payload.webhookUrl) || '').trim();
  if (!/^https:\/\/[^\s]+$/i.test(url)) {
    return { ok: false, error: 'Webhook URL must start with https://' };
  }
  var secret = String((payload && payload.webhookSecret) || '').trim();
  var headers = { 'X-AE-Event': 'webhook.test' };
  if (secret) headers['X-AE-Webhook-Secret'] = secret;

  try {
    var res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: headers,
      payload: JSON.stringify({
        event: 'webhook.test',
        surveyId: String((payload && payload.surveyId) || ''),
        surveyTitle: String((payload && payload.surveyTitle) || 'AE Survey'),
        message: 'Test ping from AE Survey webhook integration.',
        sentAt: new Date().toISOString()
      }),
      muteHttpExceptions: true
    });
    var code = res.getResponseCode();
    return {
      ok: code >= 200 && code < 300,
      statusCode: code,
      message: code >= 200 && code < 300 ? ('Webhook responded with HTTP ' + code) : ('Webhook returned HTTP ' + code)
    };
  } catch (err) {
    return { ok: false, error: String(err && err.message ? err.message : err) };
  }
}

/**
 * Fire configured survey webhooks after new responses are synced (outside ScriptLock).
 */
function maybeFireSurveyWebhooks_(surveyMap, insertedResponses) {
  if (!surveyMap || !Array.isArray(insertedResponses) || insertedResponses.length === 0) return;
  var maxFires = Math.min(insertedResponses.length, 15);
  for (var i = 0; i < maxFires; i++) {
    var resp = insertedResponses[i];
    if (!resp || !resp.surveyId) continue;
    var survey = surveyMap[resp.surveyId];
    if (!survey || !survey.completionWorkflow || !survey.completionWorkflow.webhookEnabled) continue;
    var url = String(survey.completionWorkflow.webhookUrl || '').trim();
    if (!/^https:\/\/[^\s]+$/i.test(url)) continue;
    var secret = String(survey.completionWorkflow.webhookSecret || '').trim();
    var headers = { 'X-AE-Event': 'response.created' };
    if (secret) headers['X-AE-Webhook-Secret'] = secret;
    try {
      UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        headers: headers,
        payload: JSON.stringify({
          event: 'response.created',
          surveyId: survey.id,
          surveyTitle: survey.title || '',
          responseId: resp.id || resp.clientResponseId || '',
          submittedAt: resp.submittedAt || new Date().toISOString(),
          enumerator: resp.enumerator || '',
          answers: resp.answers || {}
        }),
        muteHttpExceptions: true
      });
    } catch (e) {
      // Never break sync if downstream webhook is unreachable
    }
  }
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

