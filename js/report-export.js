/**
 * ============================================================================
 * AE SURVEY — 1-Click Branded Executive Briefing Export (window.AEReportExport)
 * Generates self-contained, zero-app-chrome, XSS-safe HTML reports engineered
 * for crisp Browser Print-to-PDF and Microsoft Word (.doc) rendering.
 * ============================================================================
 */
(function (globalScope) {
  'use strict';

  function _esc(val) {
    return String(val === null || val === undefined ? '' : val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function _getQuestions(survey) {
    if (!survey || typeof survey !== 'object') return [];
    if (globalScope.aeStore && typeof globalScope.aeStore.getQuestionsForSurvey === 'function') {
      try {
        const qs = globalScope.aeStore.getQuestionsForSurvey(survey);
        if (Array.isArray(qs)) return qs;
      } catch (e) {}
    }
    if (Array.isArray(survey.pages)) {
      const out = [];
      survey.pages.forEach((p) => {
        if (p && Array.isArray(p.questions)) {
          p.questions.forEach((q) => {
            if (q) out.push(q);
          });
        }
      });
      return out;
    }
    if (Array.isArray(survey.questions)) return survey.questions;
    return [];
  }

  function _cleanTitle(q, survey) {
    const engine = globalScope.AETeXtEngine;
    if (engine && typeof engine.cleanQuestionTitle === 'function') {
      return engine.cleanQuestionTitle(q, {}, survey);
    }
    const raw = typeof q === 'string' ? q : String((q && (q.title || q.label || q.id)) || '');
    return raw.replace(/\{\{[^}]+\}\}/g, 'your rating').replace(/\s+/g, ' ').trim();
  }

  function _formatDate(dt) {
    const d = dt ? new Date(dt) : new Date();
    if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function _computeQuestionBreakdown(q, responses) {
    const qType = String(q.type || '').toLowerCase();
    const totalN = responses.length;
    let answered = 0;

    if (['number_yield', 'number', 'numeric'].includes(qType)) {
      const nums = [];
      responses.forEach((r) => {
        const v = r?.answers?.[q.id];
        if (v !== undefined && v !== null && String(v).trim() !== '') {
          const n = Number(v);
          if (Number.isFinite(n)) {
            answered++;
            nums.push(n);
          }
        }
      });
      nums.sort((a, b) => a - b);
      const mean = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
      const mid = Math.floor(nums.length / 2);
      const median = nums.length === 0 ? 0 : (nums.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2);
      const variance = nums.length > 1 ? nums.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (nums.length - 1) : 0;
      return {
        kind: 'numeric',
        answered,
        totalN,
        unit: q.unit || '',
        mean: Number(mean.toFixed(2)),
        median: Number(median.toFixed(2)),
        min: nums.length > 0 ? nums[0] : 0,
        max: nums.length > 0 ? nums[nums.length - 1] : 0,
        stdDev: Number(Math.sqrt(variance).toFixed(2))
      };
    }

    if (['long_text', 'short_text', 'textarea', 'text', 'audio_note'].includes(qType)) {
      const sampleQuotes = [];
      responses.forEach((r) => {
        const raw = r?.answers?.[q.id];
        const txt = typeof raw === 'string'
          ? raw.trim()
          : (raw && typeof raw === 'object' ? String(raw.transcript || raw.text || '').trim() : '');
        if (txt) {
          answered++;
          if (sampleQuotes.length < 3) sampleQuotes.push(txt);
        }
      });
      return { kind: 'text', answered, totalN, sampleQuotes };
    }

    // Categorical / Choice / Rating / NPS
    const counts = Object.create(null);
    const orderedLabels = [];
    if (Array.isArray(q.options)) {
      q.options.forEach((opt) => {
        const lbl = typeof opt === 'string' ? opt.trim() : String((opt && (opt.label || opt.value || opt.text)) || '').trim();
        if (lbl && counts[lbl] === undefined) {
          counts[lbl] = 0;
          orderedLabels.push(lbl);
        }
      });
    } else if (qType === 'star_rating' || qType === 'rating') {
      const maxS = Number(q.max || 5);
      for (let s = maxS; s >= 1; s--) {
        const lbl = String(s);
        counts[lbl] = 0;
        orderedLabels.push(lbl);
      }
    }

    let numericSum = 0;
    let numericCount = 0;
    let npsPromoters = 0;
    let npsDetractors = 0;

    responses.forEach((r) => {
      const raw = r?.answers?.[q.id];
      if (raw === undefined || raw === null || raw === '') return;
      if (Array.isArray(raw)) {
        const vals = raw.map((v) => String(v || '').trim()).filter(Boolean);
        if (vals.length === 0) return;
        answered++;
        vals.forEach((v) => {
          if (counts[v] === undefined) {
            counts[v] = 0;
            orderedLabels.push(v);
          }
          counts[v]++;
        });
      } else if (typeof raw === 'object') {
        const v = String(raw.label || raw.level1 || raw.name || raw.value || '').trim();
        if (!v) return;
        answered++;
        if (counts[v] === undefined) {
          counts[v] = 0;
          orderedLabels.push(v);
        }
        counts[v]++;
      } else {
        const v = String(raw).trim();
        if (!v) return;
        answered++;
        if (counts[v] === undefined) {
          counts[v] = 0;
          orderedLabels.push(v);
        }
        counts[v]++;
        const num = Number(v);
        if (Number.isFinite(num)) {
          numericSum += num;
          numericCount++;
          if (qType === 'nps') {
            if (num >= 9) npsPromoters++;
            else if (num <= 6) npsDetractors++;
          }
        }
      }
    });

    const rows = orderedLabels.map((label) => {
      const count = counts[label] || 0;
      const pct = answered > 0 ? Number(((count / answered) * 100).toFixed(1)) : 0;
      return { label, count, pct };
    });

    if (!Array.isArray(q.options) && qType !== 'star_rating' && qType !== 'rating') {
      rows.sort((a, b) => b.count - a.count);
    }

    return {
      kind: 'categorical',
      qType,
      answered,
      totalN,
      rows: rows.slice(0, 12),
      mean: numericCount > 0 ? Number((numericSum / numericCount).toFixed(2)) : null,
      npsScore: qType === 'nps' && numericCount > 0
        ? Math.round(((npsPromoters - npsDetractors) / numericCount) * 100)
        : null
    };
  }

  function _renderBarCell(pct, colorHex) {
    const safePct = Math.max(0, Math.min(100, Number(pct) || 0));
    const fillW = Math.round(safePct);
    const fillColor = colorHex || '#247B50';
    return `
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; background-color:#EFEFEF; height:10px;">
        <tr>
          ${fillW > 0 ? `<td style="width:${fillW}%; background-color:${fillColor}; height:10px; font-size:1px; line-height:1px;">&nbsp;</td>` : ''}
          ${fillW < 100 ? `<td style="width:${100 - fillW}%; background-color:#EFEFEF; height:10px; font-size:1px; line-height:1px;">&nbsp;</td>` : ''}
        </tr>
      </table>
    `;
  }

  function _resolveSurveyAndResponses(surveyId) {
    const store = globalScope.aeStore;
    if (!store) return { survey: null, responses: [] };
    const survey = typeof store.getSurveyById === 'function'
      ? store.getSurveyById(surveyId)
      : (Array.isArray(store.surveys) ? store.surveys.find((s) => s.id === surveyId) : null);
    let responses = [];
    if (globalScope.AEAnalytics && typeof globalScope.AEAnalytics.getFilteredResponses === 'function') {
      responses = globalScope.AEAnalytics.getFilteredResponses(surveyId) || [];
    } else if (typeof store.getResponsesForSurvey === 'function') {
      const user = globalScope.AESession && typeof globalScope.AESession.getCurrentUser === 'function'
        ? globalScope.AESession.getCurrentUser()
        : null;
      responses = store.getResponsesForSurvey(surveyId, user) || [];
    }
    return { survey, responses };
  }

  const AEReportExport = {
    version: '1.0.0',

    /**
     * Builds a clean, self-contained, zero-app-chrome, XSS-safe Executive Briefing HTML document
     * compatible with both Browser Print-to-PDF and Microsoft Word (.doc).
     */
    buildExecutiveReportHTML(survey, responses, options = {}) {
      const safeSurvey = (survey && typeof survey === 'object') ? survey : { id: 'survey', title: 'Untitled Survey', pages: [] };
      const safeResponses = Array.isArray(responses) ? responses : [];
      const opts = (options && typeof options === 'object') ? options : {};
      const questions = _getQuestions(safeSurvey);
      const totalN = safeResponses.length;
      const generatedDate = _formatDate(opts.generatedAt || new Date());
      const merkleHash = opts.merkleHash ? String(opts.merkleHash).trim() : '';

      // Completion & Sync Summary
      const syncedCount = safeResponses.filter((r) => r && (r.synced === true || r.syncStatus === 'synced' || r.status === 'synced')).length;
      const offlineCount = Math.max(0, totalN - syncedCount);
      const syncPct = totalN > 0 ? Math.round((syncedCount / totalN) * 100) : 0;

      let totalPossibleCells = totalN * Math.max(1, questions.length);
      let answeredCells = 0;
      safeResponses.forEach((r) => {
        if (!r || !r.answers) return;
        questions.forEach((q) => {
          const v = r.answers[q.id];
          if (v !== undefined && v !== null && String(v).trim() !== '' && (!Array.isArray(v) || v.length > 0)) {
            answeredCells++;
          }
        });
      });
      const completionRatePct = totalN > 0 && questions.length > 0
        ? Math.min(100, Math.round((answeredCells / totalPossibleCells) * 100))
        : 0;

      // Verbatim Intelligence & Theme-to-Score Impact
      const engine = globalScope.AETeXtEngine;
      const analysis = engine && typeof engine.analyzeVerbatims === 'function'
        ? engine.analyzeVerbatims(safeResponses, safeSurvey, {
            questionId: 'all',
            segmentQId: opts.segmentQId || 'auto',
            translationsMap: opts.translationsMap || {}
          })
        : { totalAnalyzed: 0, sentimentSummary: { positive: 0, neutral: 0, negative: 0, avgScore: 0 }, themes: [], records: [] };

      const briefing = engine && typeof engine.generateExecutiveBriefing === 'function'
        ? engine.generateExecutiveBriefing(analysis, safeSurvey)
        : { headline: '', summaryBullets: [], topThemesSummary: [], actionableRecommendations: [], urgentAlerts: [] };

      const themeImpact = engine && typeof engine.computeThemeScoreImpact === 'function'
        ? engine.computeThemeScoreImpact(analysis, safeResponses, safeSurvey, opts.impactMetricQId || 'auto')
        : { hasMetric: false, impacts: [], availableMetrics: [] };

      // Pinned Quotes resolution (supports explicit options.pinnedQuotes OR localStorage via AETeXtEngine)
      const pinnedKeySet = new Set(
        Array.isArray(opts.pinnedQuoteKeys)
          ? opts.pinnedQuoteKeys.map(String)
          : (engine && typeof engine.getPinnedQuotes === 'function' ? engine.getPinnedQuotes(safeSurvey.id) : [])
      );
      const pinnedRecords = Array.isArray(opts.pinnedQuotes) && opts.pinnedQuotes.length > 0
        ? opts.pinnedQuotes
        : (analysis.records || []).filter((rec) => rec && (rec.isPinned || pinnedKeySet.has(String(rec.key || ''))));

      // KPI 3: Primary Score / Rating Metric
      let kpi3Label = 'Questions analyzed';
      let kpi3Value = String(questions.length);
      let kpi3Sub = `${completionRatePct}% avg completion`;
      if (themeImpact.hasMetric && themeImpact.overallMean !== null) {
        kpi3Label = themeImpact.metricTitle || themeImpact.metricLabel || 'Primary score';
        if (kpi3Label.length > 34) kpi3Label = kpi3Label.slice(0, 31) + '...';
        kpi3Value = String(themeImpact.overallMean);
        kpi3Sub = `Scale: ${themeImpact.metricScale || 'numeric'} (n = ${themeImpact.totalScored})`;
      }

      // KPI 4: Verbatim Sentiment Index
      const totalVerbatims = analysis.totalAnalyzed || 0;
      const ss = analysis.sentimentSummary || { positive: 0, neutral: 0, negative: 0 };
      const posPct = totalVerbatims > 0 ? Math.round((ss.positive / totalVerbatims) * 100) : 0;
      const negPct = totalVerbatims > 0 ? Math.round((ss.negative / totalVerbatims) * 100) : 0;
      const kpi4Label = totalVerbatims > 0 ? 'Response sentiment' : 'Avg completion';
      const kpi4Value = totalVerbatims > 0 ? `${posPct}% positive` : `${completionRatePct}%`;
      const kpi4Sub = totalVerbatims > 0
        ? `${totalVerbatims} responses · ${negPct}% negative`
        : `${answeredCells} answered items`;

      // Question Breakdowns HTML
      const questionBlocksHtml = questions.map((q, idx) => {
        const cleanTitle = _cleanTitle(q, safeSurvey);
        const qCode = q.code || `Q${idx + 1}`;
        const bd = _computeQuestionBreakdown(q, safeResponses);
        const respPct = totalN > 0 ? Math.round((bd.answered / totalN) * 100) : 0;

        let bodyHtml = '';
        if (bd.kind === 'numeric') {
          const unitSuffix = bd.unit ? ` ${_esc(bd.unit)}` : '';
          bodyHtml = `
            <table cellpadding="8" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; font-size:12px; margin-top:10px;">
              <tr style="background-color:#F8F9F8; color:#525B56; font-weight:600;">
                <td style="border-top:1px solid #E4E7E4; border-bottom:1px solid #CFD5D0; text-align:center;">Mean</td>
                <td style="border-top:1px solid #E4E7E4; border-bottom:1px solid #CFD5D0; text-align:center;">Median</td>
                <td style="border-top:1px solid #E4E7E4; border-bottom:1px solid #CFD5D0; text-align:center;">Min</td>
                <td style="border-top:1px solid #E4E7E4; border-bottom:1px solid #CFD5D0; text-align:center;">Max</td>
                <td style="border-top:1px solid #E4E7E4; border-bottom:1px solid #CFD5D0; text-align:center;">Std Dev</td>
              </tr>
              <tr style="color:#111613; font-weight:600;">
                <td style="border-bottom:1px solid #EFEFEF; text-align:center;">${_esc(bd.mean)}${unitSuffix}</td>
                <td style="border-bottom:1px solid #EFEFEF; text-align:center;">${_esc(bd.median)}${unitSuffix}</td>
                <td style="border-bottom:1px solid #EFEFEF; text-align:center;">${_esc(bd.min)}${unitSuffix}</td>
                <td style="border-bottom:1px solid #EFEFEF; text-align:center;">${_esc(bd.max)}${unitSuffix}</td>
                <td style="border-bottom:1px solid #EFEFEF; text-align:center;">${_esc(bd.stdDev)}</td>
              </tr>
            </table>
          `;
        } else if (bd.kind === 'text') {
          bodyHtml = bd.sampleQuotes.length > 0
            ? `<div style="margin-top:10px; font-size:12px; color:#2C3530;">
                <div style="font-size:11px; font-weight:600; color:#525B56; margin-bottom:6px;">Selected responses (${bd.answered} recorded)</div>
                ${bd.sampleQuotes.map((qt) => `<div style="padding:7px 12px; margin-bottom:6px; background-color:#FAFBF9; border-left:2px solid #247B50; font-style:italic; line-height:1.5;">&ldquo;${_esc(qt.length > 220 ? qt.slice(0, 217) + '...' : qt)}&rdquo;</div>`).join('')}
              </div>`
            : `<p style="font-size:12px; color:#646E68; margin:8px 0 0 0;">No written responses were recorded for this question.</p>`;
        } else {
          const extraStats = bd.npsScore !== null
            ? `<span style="font-size:11px; font-weight:600; color:#04250E; background-color:#DCFAE5; padding:2px 8px; border-radius:3px;">NPS: ${bd.npsScore >= 0 ? '+' : ''}${bd.npsScore}</span>`
            : (bd.mean !== null ? `<span style="font-size:11px; font-weight:600; color:#04250E; background-color:#DCFAE5; padding:2px 8px; border-radius:3px;">Mean: ${bd.mean}</span>` : '');

          bodyHtml = bd.rows.length > 0
            ? `
              ${extraStats ? `<div style="margin:6px 0 8px 0;">${extraStats}</div>` : ''}
              <table cellpadding="6" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; font-size:11.5px; margin-top:6px;">
                <tr style="background-color:#F8F9F8; color:#525B56; font-weight:600;">
                  <td style="border-bottom:1px solid #CFD5D0; width:40%;">Response option</td>
                  <td style="border-bottom:1px solid #CFD5D0; width:36%;">Distribution</td>
                  <td style="border-bottom:1px solid #CFD5D0; width:12%; text-align:right;">Count</td>
                  <td style="border-bottom:1px solid #CFD5D0; width:12%; text-align:right;">Share</td>
                </tr>
                ${bd.rows.map((row) => `
                  <tr>
                    <td style="border-bottom:1px solid #EFEFEF; color:#111613; font-weight:500;">${_esc(row.label)}</td>
                    <td style="border-bottom:1px solid #EFEFEF; vertical-align:middle;">${_renderBarCell(row.pct, '#247B50')}</td>
                    <td style="border-bottom:1px solid #EFEFEF; text-align:right; color:#525B56;">${row.count}</td>
                    <td style="border-bottom:1px solid #EFEFEF; text-align:right; font-weight:600; color:#111613;">${row.pct}%</td>
                  </tr>
                `).join('')}
              </table>
            `
            : `<p style="font-size:12px; color:#646E68; margin:8px 0 0 0;">No responses were recorded for this question.</p>`;
        }

        return `
          <div style="border:1px solid #E4E7E4; border-radius:6px; padding:14px 16px; margin-bottom:14px; page-break-inside:avoid; background-color:#FFFFFF;">
            <table cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;">
              <tr>
                <td style="font-size:13px; font-weight:600; color:#111613; line-height:1.4;">
                  <span style="display:inline-block; background-color:#F4F6F4; color:#247B50; border:1px solid #E4E7E4; font-size:10.5px; font-weight:600; padding:1px 6px; border-radius:3px; margin-right:6px;">${_esc(qCode)}</span>
                  ${_esc(cleanTitle)}
                </td>
                <td style="text-align:right; font-size:11px; color:#646E68; white-space:nowrap; padding-left:12px;">
                  n = ${bd.answered} (${respPct}%)
                </td>
              </tr>
            </table>
            ${bodyHtml}
          </div>
        `;
      }).join('');

      // Verbatim Intelligence Section HTML
      const themes = analysis.themes || [];
      const topRecs = briefing.actionableRecommendations || [];
      const urgentAlerts = briefing.urgentAlerts || [];
      const impactRows = themeImpact.impacts || [];

      const themesTableHtml = themes.length > 0
        ? `
          <h3 style="font-family:Georgia, 'Times New Roman', serif; font-size:14px; font-weight:600; color:#111613; margin:18px 0 8px 0;">Recurring Themes</h3>
          <table cellpadding="7" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; font-size:11.5px; border:1px solid #E4E7E4;">
            <tr style="background-color:#F8F9F8; color:#525B56; font-weight:600;">
              <td style="border-bottom:1px solid #CFD5D0;">Theme</td>
              <td style="border-bottom:1px solid #CFD5D0; text-align:right;">Mentions</td>
              <td style="border-bottom:1px solid #CFD5D0; text-align:right;">Share</td>
              <td style="border-bottom:1px solid #CFD5D0; text-align:center;">+ / ~ / &minus;</td>
              <td style="border-bottom:1px solid #CFD5D0; text-align:right;">Net sentiment</td>
            </tr>
            ${themes.slice(0, 8).map((t) => {
              const net = Number(t.netSentiment ?? 0);
              const netBg = net > 10 ? '#DCFAE5' : (net < -10 ? '#FFEDEA' : '#F4F6F4');
              const netColor = net > 10 ? '#04250E' : (net < -10 ? '#831C1E' : '#525B56');
              return `
                <tr>
                  <td style="border-bottom:1px solid #EFEFEF; font-weight:600; color:#111613;">
                    ${_esc(t.name)}
                    ${t.isCustom ? ' <span style="font-size:9.5px; background-color:#DCFAE5; color:#04250E; padding:1px 5px; border-radius:2px; font-weight:600;">Custom</span>' : ''}
                  </td>
                  <td style="border-bottom:1px solid #EFEFEF; text-align:right;">${t.count}</td>
                  <td style="border-bottom:1px solid #EFEFEF; text-align:right;">${t.pct}%</td>
                  <td style="border-bottom:1px solid #EFEFEF; text-align:center; color:#525B56;">+${t.positive || 0} / ~${t.neutral || 0} / -${t.negative || 0}</td>
                  <td style="border-bottom:1px solid #EFEFEF; text-align:right;">
                    <span style="background-color:${netBg}; color:${netColor}; font-weight:600; padding:2px 6px; border-radius:3px;">${net > 0 ? '+' : ''}${net}%</span>
                  </td>
                </tr>
              `;
            }).join('')}
          </table>
        `
        : '';

      const impactTableHtml = themeImpact.hasMetric && impactRows.length > 0
        ? `
          <h3 style="font-family:Georgia, 'Times New Roman', serif; font-size:14px; font-weight:600; color:#111613; margin:20px 0 5px 0;">What Drives Your Scores</h3>
          <p style="font-size:11.5px; color:#525B56; margin:0 0 8px 0; line-height:1.5;">
            How mentioning each theme relates to <strong>${_esc(themeImpact.metricLabel)}</strong> (overall mean: <strong>${_esc(themeImpact.overallMean)}</strong>, scale: ${_esc(themeImpact.metricScale)}, n = ${themeImpact.totalScored}).
          </p>
          <table cellpadding="7" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; font-size:11.5px; border:1px solid #E4E7E4;">
            <tr style="background-color:#F8F9F8; color:#525B56; font-weight:600;">
              <td style="border-bottom:1px solid #CFD5D0;">Theme</td>
              <td style="border-bottom:1px solid #CFD5D0; text-align:right;">With theme</td>
              <td style="border-bottom:1px solid #CFD5D0; text-align:right;">Without theme</td>
              <td style="border-bottom:1px solid #CFD5D0; text-align:right;">Score difference</td>
              <td style="border-bottom:1px solid #CFD5D0; text-align:center;">Sample (n)</td>
              <td style="border-bottom:1px solid #CFD5D0; text-align:right;">Welch p-value</td>
            </tr>
            ${impactRows.slice(0, 8).map((row) => {
              const isPos = row.delta > 0;
              const isNeg = row.delta < 0;
              const dBg = isPos ? '#DCFAE5' : (isNeg ? '#FFEDEA' : '#F4F6F4');
              const dColor = isPos ? '#04250E' : (isNeg ? '#831C1E' : '#525B56');
              const pLabel = row.pValue === null
                ? 'n &lt; 2'
                : (row.isSignificant ? `<strong style="color:#04250E;">p = ${row.pValue} *</strong>` : `p = ${row.pValue}`);
              return `
                <tr>
                  <td style="border-bottom:1px solid #EFEFEF; font-weight:600; color:#111613;">${_esc(row.name)}</td>
                  <td style="border-bottom:1px solid #EFEFEF; text-align:right;">${row.meanWith}</td>
                  <td style="border-bottom:1px solid #EFEFEF; text-align:right; color:#525B56;">${row.meanWithout}</td>
                  <td style="border-bottom:1px solid #EFEFEF; text-align:right;">
                    <span style="background-color:${dBg}; color:${dColor}; font-weight:600; padding:2px 6px; border-radius:3px;">${row.delta > 0 ? '+' : ''}${row.delta} pts</span>
                  </td>
                  <td style="border-bottom:1px solid #EFEFEF; text-align:center; color:#525B56;">${row.nWith} vs ${row.nWithout}</td>
                  <td style="border-bottom:1px solid #EFEFEF; text-align:right;">${pLabel}</td>
                </tr>
              `;
            }).join('')}
          </table>
        `
        : '';

      const recsHtml = topRecs.length > 0
        ? `
          <h3 style="font-family:Georgia, 'Times New Roman', serif; font-size:14px; font-weight:600; color:#111613; margin:20px 0 8px 0;">Recommended Actions</h3>
          <table cellpadding="7" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; font-size:12px;">
            ${topRecs.slice(0, 5).map((rec, i) => {
              const txt = typeof rec === 'string' ? rec : (rec.translatedText || rec.text || '');
              const meta = typeof rec === 'object' && rec ? [rec.questionCode, rec.segment].filter(Boolean).join(' · ') : '';
              return `
                <tr>
                  <td style="width:24px; vertical-align:top; font-weight:600; color:#247B50;">${i + 1}.</td>
                  <td style="border-bottom:1px solid #EFEFEF; color:#111613; line-height:1.5;">
                    ${_esc(txt)}
                    ${meta ? `<div style="font-size:10.5px; color:#646E68; margin-top:3px;">${_esc(meta)}</div>` : ''}
                  </td>
                </tr>
              `;
            }).join('')}
          </table>
        `
        : '';

      const alertsHtml = urgentAlerts.length > 0
        ? `
          <h3 style="font-family:Georgia, 'Times New Roman', serif; font-size:14px; font-weight:600; color:#831C1E; margin:20px 0 8px 0;">Items Needing Attention</h3>
          <div style="background-color:#FFF7F6; border:1px solid #F5C2C0; border-left:3px solid #C4242A; border-radius:4px; padding:12px 14px;">
            ${urgentAlerts.slice(0, 5).map((al) => {
              const txt = typeof al === 'string' ? al : (al.translatedText || al.text || '');
              const qCode = typeof al === 'object' && al && al.questionCode ? `[${al.questionCode}] ` : '';
              return `<div style="font-size:11.5px; color:#831C1E; margin-bottom:6px; line-height:1.45;">&bull; ${_esc(qCode)}${_esc(txt)}</div>`;
            }).join('')}
          </div>
        `
        : '';

      const pinnedQuotesHtml = pinnedRecords.length > 0
        ? `
          <h3 style="font-family:Georgia, 'Times New Roman', serif; font-size:14px; font-weight:600; color:#111613; margin:20px 0 8px 0;">Selected Respondent Quotes</h3>
          ${pinnedRecords.slice(0, 10).map((pq) => {
            const txt = typeof pq === 'string' ? pq : (pq.translatedText || pq.text || '');
            const qCode = typeof pq === 'object' && pq && pq.questionCode ? pq.questionCode : 'Quote';
            const sentiment = typeof pq === 'object' && pq && pq.sentiment ? pq.sentiment : 'neutral';
            const seg = typeof pq === 'object' && pq && pq.segment ? pq.segment : '';
            const borderCol = sentiment === 'positive' ? '#247B50' : (sentiment === 'negative' ? '#C4242A' : '#9CA3AF');
            return `
              <div style="padding:10px 14px; margin-bottom:10px; background-color:#FAFBF9; border-left:3px solid ${borderCol}; border-top:1px solid #EFEFEF; border-right:1px solid #EFEFEF; border-bottom:1px solid #EFEFEF; page-break-inside:avoid;">
                <div style="font-size:12px; color:#111613; font-style:italic; line-height:1.55;">&ldquo;${_esc(txt)}&rdquo;</div>
                <div style="font-size:10.5px; color:#646E68; margin-top:5px;">
                  <strong style="color:#111613;">${_esc(qCode)}</strong>${seg ? ` &middot; ${_esc(seg)}` : ''} &middot; ${_esc(sentiment.charAt(0).toUpperCase() + sentiment.slice(1))}
                </div>
              </div>
            `;
          }).join('')}
        `
        : '';

      const isWord = Boolean(opts.forWord);
      const htmlTag = isWord
        ? '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40" lang="en">'
        : '<html lang="en">';

      return `<!DOCTYPE html>
${htmlTag}
<head>
  <meta charset="UTF-8" />
  <title>Research Briefing — ${_esc(safeSurvey.title || 'AE Survey')}</title>
  <style>
    @page { size: A4 portrait; margin: 20mm 18mm; }
    body {
      font-family: 'Plus Jakarta Sans', 'Segoe UI', Arial, Helvetica, sans-serif;
      color: #111613;
      background-color: #FFFFFF;
      margin: 0;
      padding: 28px 24px;
      line-height: 1.55;
      font-variant-numeric: tabular-nums;
      -webkit-font-smoothing: antialiased;
    }
    .report-container { max-width: 780px; margin: 0 auto; }
    h1, h2, h3 { margin: 0; }
    table { border-collapse: collapse; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <!-- 1. EDITORIAL RESEARCH MASTHEAD -->
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%; border-top:3px solid #141A17; border-bottom:1px solid #CFD5D0; padding:16px 0 14px 0; margin-bottom:22px;">
      <tr>
        <td style="vertical-align:top; padding-right:18px;">
          <div style="font-size:11px; font-weight:600; color:#247B50; margin-bottom:6px;">
            Agri Experience Limited &middot; Research Briefing
          </div>
          <h1 style="font-family:Georgia, 'Times New Roman', serif; font-size:25px; font-weight:600; color:#111613; line-height:1.25;">
            ${_esc(safeSurvey.title || 'Survey Results Report')}
          </h1>
          ${safeSurvey.description ? `<p style="font-size:12.5px; color:#525B56; margin:6px 0 0 0; line-height:1.5;">${_esc(safeSurvey.description)}</p>` : ''}
        </td>
        <td style="vertical-align:top; text-align:right; font-size:11px; color:#525B56; white-space:nowrap; line-height:1.65;">
          <div><strong style="color:#111613;">Prepared:</strong> ${_esc(generatedDate)}</div>
          <div><strong style="color:#111613;">Sample:</strong> n = ${totalN}</div>
          <div><strong style="color:#111613;">Sync:</strong> ${syncedCount} synced &middot; ${offlineCount} local (${syncPct}%)</div>
          <div><strong style="color:#111613;">Completion:</strong> ${completionRatePct}%</div>
        </td>
      </tr>
    </table>

    ${merkleHash ? `
      <div style="background-color:#F8F9F8; border:1px solid #E4E7E4; border-left:3px solid #247B50; border-radius:4px; padding:8px 12px; margin-bottom:20px; font-size:10.5px; color:#37413C;">
        <strong style="color:#04250E;">Merkle Integrity Seal (RFC 6962):</strong>
        <code style="font-family:Consolas, monospace; font-size:10.5px; word-break:break-all;">${_esc(merkleHash)}</code>
      </div>
    ` : ''}

    <!-- 2. DIVIDED EXECUTIVE KPI STRIP -->
    <table cellpadding="12" cellspacing="0" border="0" style="width:100%; margin-bottom:26px; border-collapse:collapse; border:1px solid #E4E7E4; background-color:#FFFFFF;">
      <tr>
        <td style="width:25%; border-right:1px solid #EFEFEF; vertical-align:top;">
          <div style="font-size:11px; font-weight:600; color:#525B56;">Sample size</div>
          <div style="font-size:22px; font-weight:600; color:#111613; margin-top:4px;">${totalN}</div>
          <div style="font-size:10.5px; color:#646E68; margin-top:2px;">Valid responses</div>
        </td>
        <td style="width:25%; border-right:1px solid #EFEFEF; vertical-align:top;">
          <div style="font-size:11px; font-weight:600; color:#525B56;">Sync coverage</div>
          <div style="font-size:22px; font-weight:600; color:#247B50; margin-top:4px;">${syncPct}%</div>
          <div style="font-size:10.5px; color:#646E68; margin-top:2px;">${syncedCount} of ${totalN} synced</div>
        </td>
        <td style="width:25%; border-right:1px solid #EFEFEF; vertical-align:top;">
          <div style="font-size:11px; font-weight:600; color:#525B56;">${_esc(kpi3Label)}</div>
          <div style="font-size:22px; font-weight:600; color:#111613; margin-top:4px;">${_esc(kpi3Value)}</div>
          <div style="font-size:10.5px; color:#646E68; margin-top:2px;">${_esc(kpi3Sub)}</div>
        </td>
        <td style="width:25%; vertical-align:top;">
          <div style="font-size:11px; font-weight:600; color:#525B56;">${_esc(kpi4Label)}</div>
          <div style="font-size:22px; font-weight:600; color:#111613; margin-top:4px;">${_esc(kpi4Value)}</div>
          <div style="font-size:10.5px; color:#646E68; margin-top:2px;">${_esc(kpi4Sub)}</div>
        </td>
      </tr>
    </table>

    <!-- 3. QUESTION-BY-QUESTION FINDINGS -->
    <div style="margin-bottom:28px;">
      <h2 style="font-family:Georgia, 'Times New Roman', serif; font-size:17px; font-weight:600; color:#111613; border-bottom:1px solid #CFD5D0; padding-bottom:6px; margin-bottom:14px;">
        Question-by-Question Findings
      </h2>
      ${questionBlocksHtml || '<p style="font-size:12px; color:#646E68;">This survey does not contain any questions yet.</p>'}
    </div>

    <!-- 4. OPEN-ENDED FINDINGS & SYNTHESIS -->
    <div style="margin-bottom:26px; page-break-before:auto;">
      <h2 style="font-family:Georgia, 'Times New Roman', serif; font-size:17px; font-weight:600; color:#111613; border-bottom:1px solid #CFD5D0; padding-bottom:6px; margin-bottom:14px;">
        Open-Ended Findings &amp; Synthesis
      </h2>
      ${totalVerbatims > 0 ? `
        <div style="background-color:#F8FBF9; border:1px solid #D7E6DD; border-left:3px solid #247B50; border-radius:4px; padding:14px 16px; margin-bottom:16px;">
          <div style="font-size:13.5px; font-weight:600; color:#111613; line-height:1.45;">${_esc(briefing.headline)}</div>
          ${Array.isArray(briefing.summaryBullets) && briefing.summaryBullets.length > 0 ? `
            <ul style="margin:8px 0 0 18px; padding:0; font-size:12px; color:#37413C; line-height:1.55;">
              ${briefing.summaryBullets.map((b) => `<li style="margin-bottom:4px;">${_esc(b)}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
        ${themesTableHtml}
        ${impactTableHtml}
        ${recsHtml}
        ${alertsHtml}
        ${pinnedQuotesHtml}
      ` : '<p style="font-size:12px; color:#646E68;">No open-ended responses were recorded in the current filter scope.</p>'}
    </div>

    <!-- FOOTER -->
    <div style="border-top:1px solid #E4E7E4; padding-top:10px; margin-top:28px; font-size:10px; color:#646E68; text-align:center;">
      Agri Experience Limited &middot; Research Briefing &middot; Prepared ${_esc(generatedDate)} &middot; Survey ID: ${_esc(safeSurvey.id || '')}
    </div>
  </div>
</body>
</html>`;
    },

    /**
     * Opens a clean print-only window with the Executive Briefing HTML and invokes window.print().
     */
    async exportPDF(surveyId, options = {}) {
      const { survey, responses } = _resolveSurveyAndResponses(surveyId);
      if (!survey) {
        if (globalScope.AEApp && typeof globalScope.AEApp.showToast === 'function') {
          globalScope.AEApp.showToast('Survey not found for Executive PDF export.', 'error');
        }
        return false;
      }

      let merkleHash = options.merkleHash || '';
      if (!merkleHash && globalScope.aeStore && typeof globalScope.aeStore.computeSurveyMerkleRoot === 'function') {
        try {
          const m = await globalScope.aeStore.computeSurveyMerkleRoot(survey.id);
          if (m && m.root) merkleHash = m.root;
        } catch (e) {}
      }

      const impactMetricQId = options.impactMetricQId ||
        (globalScope.AEAnalytics && globalScope.AEAnalytics.verbatimImpactMetricQId) || 'auto';

      const html = this.buildExecutiveReportHTML(survey, responses, {
        ...options,
        merkleHash,
        impactMetricQId,
        forWord: false
      });

      if (typeof globalScope.open !== 'function') return html;
      const printWin = globalScope.open('', '_blank', 'width=1024,height=800');
      if (!printWin) {
        if (globalScope.AEApp && typeof globalScope.AEApp.showToast === 'function') {
          globalScope.AEApp.showToast('Pop-up blocked. Please allow pop-ups to open the Executive PDF print view.', 'warning');
        }
        return false;
      }

      printWin.document.open();
      printWin.document.write(html);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        try {
          printWin.print();
        } catch (e) {}
      }, 250);
      return true;
    },

    /**
     * Downloads a Microsoft Word-compatible (.doc) Executive Briefing document.
     */
    async exportWordDoc(surveyId, options = {}) {
      const { survey, responses } = _resolveSurveyAndResponses(surveyId);
      if (!survey) {
        if (globalScope.AEApp && typeof globalScope.AEApp.showToast === 'function') {
          globalScope.AEApp.showToast('Survey not found for Word (.doc) export.', 'error');
        }
        return false;
      }

      let merkleHash = options.merkleHash || '';
      if (!merkleHash && globalScope.aeStore && typeof globalScope.aeStore.computeSurveyMerkleRoot === 'function') {
        try {
          const m = await globalScope.aeStore.computeSurveyMerkleRoot(survey.id);
          if (m && m.root) merkleHash = m.root;
        } catch (e) {}
      }

      const impactMetricQId = options.impactMetricQId ||
        (globalScope.AEAnalytics && globalScope.AEAnalytics.verbatimImpactMetricQId) || 'auto';

      const html = this.buildExecutiveReportHTML(survey, responses, {
        ...options,
        merkleHash,
        impactMetricQId,
        forWord: true
      });

      const dateStr = new Date().toISOString().slice(0, 10);
      const safeId = String(survey.id || 'survey').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `AE_Executive_Briefing_${safeId}_${dateStr}.doc`;

      if (typeof Blob !== 'undefined' && typeof document !== 'undefined' && typeof URL !== 'undefined') {
        const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        if (globalScope.AEApp && typeof globalScope.AEApp.showToast === 'function') {
          globalScope.AEApp.showToast(`Downloaded ${filename}`, 'success');
        }
        return filename;
      }
      return { filename, html };
    }
  };

  if (typeof globalScope !== 'undefined') {
    globalScope.AEReportExport = AEReportExport;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AEReportExport;
  }
})(typeof window !== 'undefined' ? window : globalThis);
