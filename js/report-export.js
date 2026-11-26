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

  function _safeColor(val, fallback) {
    const str = String(val || '').trim();
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(str)) return str;
    return fallback || '#247B50';
  }

  function _getSafeBrandLogo(survey) {
    const branding = survey && survey.branding && typeof survey.branding === 'object' ? survey.branding : null;
    if (!branding) return '';
    const dataUrl = typeof branding.logoDataUrl === 'string' ? branding.logoDataUrl.trim() : '';
    if (dataUrl && /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(dataUrl)) {
      return dataUrl;
    }
    if (dataUrl && /^data:image\//i.test(dataUrl) && !/^data:image\/svg/i.test(dataUrl)) {
      return dataUrl;
    }
    const logoUrl = typeof branding.logoUrl === 'string' ? branding.logoUrl.trim() : '';
    if (logoUrl && /^https:\/\/[^\s"'<>]+$/i.test(logoUrl)) {
      return logoUrl;
    }
    return '';
  }

  function _resolveTheme(survey) {
    const raw = globalScope.AEThemePresets && typeof globalScope.AEThemePresets.resolve === 'function'
      ? globalScope.AEThemePresets.resolve(survey && survey.theme)
      : {};
    return {
      name: String(raw.name || 'Canopy Classic'),
      pageBg: _safeColor(raw.pageBg, '#F4F6F4'),
      cardBg: _safeColor(raw.cardBg, '#FFFFFF'),
      cardBorder: _safeColor(raw.cardBorder, '#E4E7E4'),
      ink: _safeColor(raw.ink, '#111613'),
      mutedInk: _safeColor(raw.mutedInk, '#525B56'),
      accentColor: _safeColor(raw.accentColor, '#247B50'),
      headingFont: '"Fraunces", Georgia, serif'
    };
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
    },

    /**
     * Builds a self-contained, zero-dependency 16:9 Widescreen Interactive Presentation Deck
     * styled with the survey's resolved AEThemePresets accent & Fraunces + Plus Jakarta Sans typography.
     */
    buildSlideDeckHTML(survey, responses, options = {}) {
      const safeSurvey = (survey && typeof survey === 'object') ? survey : { id: 'survey', title: 'Untitled Survey', pages: [] };
      const safeResponses = Array.isArray(responses) ? responses : [];
      const opts = (options && typeof options === 'object') ? options : {};
      const questions = _getQuestions(safeSurvey);
      const totalN = safeResponses.length;
      const generatedDate = _formatDate(opts.generatedAt || new Date());
      const merkleHash = opts.merkleHash ? String(opts.merkleHash).trim() : '';
      const theme = _resolveTheme(safeSurvey);
      const accent = theme.accentColor;
      const brandLogo = _getSafeBrandLogo(safeSurvey);

      // Sync & Completion Metrics
      const syncedCount = safeResponses.filter((r) => r && (r.synced === true || r.syncStatus === 'synced' || r.status === 'synced')).length;
      const syncPct = totalN > 0 ? Math.round((syncedCount / totalN) * 100) : 0;

      const totalPossibleCells = totalN * Math.max(1, questions.length);
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

      const pinnedKeySet = new Set(
        Array.isArray(opts.pinnedQuoteKeys)
          ? opts.pinnedQuoteKeys.map(String)
          : (engine && typeof engine.getPinnedQuotes === 'function' ? engine.getPinnedQuotes(safeSurvey.id) : [])
      );
      const pinnedRecords = Array.isArray(opts.pinnedQuotes) && opts.pinnedQuotes.length > 0
        ? opts.pinnedQuotes
        : (analysis.records || []).filter((rec) => rec && (rec.isPinned || pinnedKeySet.has(String(rec.key || rec.recordKey || ''))));

      // KPI 3: Primary Score Mean
      let kpi3Label = 'Primary Score Mean';
      let kpi3Value = '—';
      let kpi3Sub = `${questions.length} questions analyzed`;
      if (themeImpact.hasMetric && themeImpact.overallMean !== null && themeImpact.overallMean !== undefined) {
        kpi3Label = themeImpact.metricTitle || themeImpact.metricLabel || 'Primary Score Mean';
        if (kpi3Label.length > 36) kpi3Label = kpi3Label.slice(0, 33) + '...';
        kpi3Value = String(themeImpact.overallMean);
        kpi3Sub = `Scale: ${themeImpact.metricScale || 'numeric'} (n = ${themeImpact.totalScored})`;
      } else {
        // Fallback: first numeric/rating/NPS question with a mean
        for (let i = 0; i < questions.length; i++) {
          const bd = _computeQuestionBreakdown(questions[i], safeResponses);
          if (bd.mean !== null && bd.mean !== undefined && bd.answered > 0) {
            const lbl = _cleanTitle(questions[i], safeSurvey);
            kpi3Label = lbl.length > 36 ? lbl.slice(0, 33) + '...' : lbl;
            kpi3Value = bd.unit ? `${bd.mean} ${bd.unit}` : String(bd.mean);
            kpi3Sub = `Mean across n = ${bd.answered}`;
            break;
          }
        }
      }

      // KPI 4: Verbatim Net Sentiment
      const totalVerbatims = analysis.totalAnalyzed || 0;
      const ss = analysis.sentimentSummary || { positive: 0, neutral: 0, negative: 0 };
      const netSentiment = totalVerbatims > 0 ? Math.round(((ss.positive - ss.negative) / totalVerbatims) * 100) : 0;
      const kpi4Value = totalVerbatims > 0 ? `${netSentiment > 0 ? '+' : ''}${netSentiment}%` : 'N/A';
      const kpi4Sub = totalVerbatims > 0
        ? `${ss.positive} positive · ${ss.neutral} neutral · ${ss.negative} negative (n = ${totalVerbatims})`
        : 'No open-ended verbatims recorded';

      const slides = [];

      // SLIDE 1: Title Slide
      const logoMarkup = brandLogo
        ? `<img src="${_esc(brandLogo)}" alt="Survey Brand Logo" class="brand-logo" />`
        : `<img src="./icons/agri_experience_logo.png" alt="Agri Experience Limited" class="brand-logo" onerror="this.style.display='none'" />`;

      slides.push(`
        <section class="slide slide-title" data-slide-type="title">
          <div class="title-accent-bar"></div>
          <div class="slide-inner title-layout">
            <div class="title-top">
              <div class="brand-lockup">
                ${logoMarkup}
                <div class="brand-kicker">Agri Experience Limited &middot; Executive Presentation</div>
              </div>
              <span class="pill-badge">${_esc(generatedDate)}</span>
            </div>
            <div class="title-center">
              <h1 class="display-title">${_esc(safeSurvey.title || 'Survey Results Presentation')}</h1>
              ${safeSurvey.description ? `<p class="title-desc">${_esc(safeSurvey.description)}</p>` : ''}
            </div>
            <div class="title-meta-strip">
              <div class="meta-chip">
                <span class="meta-label">Sample Size</span>
                <span class="meta-val">n = ${totalN}</span>
              </div>
              <div class="meta-chip">
                <span class="meta-label">Completion Rate</span>
                <span class="meta-val">${completionRatePct}%</span>
              </div>
              <div class="meta-chip">
                <span class="meta-label">Questions</span>
                <span class="meta-val">${questions.length}</span>
              </div>
              <div class="meta-chip">
                <span class="meta-label">Prepared</span>
                <span class="meta-val">${_esc(generatedDate)}</span>
              </div>
            </div>
          </div>
        </section>
      `);

      // SLIDE 2: Executive KPIs
      const sentimentTone = netSentiment > 10 ? '#04250E' : (netSentiment < -10 ? '#831C1E' : theme.ink);
      slides.push(`
        <section class="slide" data-slide-type="kpis">
          <div class="slide-inner">
            <div class="slide-header">
              <div>
                <div class="slide-eyebrow">Executive Summary</div>
                <h2 class="slide-heading">Key Performance Indicators</h2>
              </div>
              <div class="slide-tag">${_esc(safeSurvey.title || 'AE Survey')}</div>
            </div>
            <div class="kpi-grid">
              <div class="kpi-card">
                <div class="kpi-label">Total Responses</div>
                <div class="kpi-value">${totalN}</div>
                <div class="kpi-sub">Valid responses in active scope</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Sync / Completion Rate</div>
                <div class="kpi-value" style="color:${accent};">${syncPct}% <span class="kpi-slash">/</span> ${completionRatePct}%</div>
                <div class="kpi-sub">${syncedCount} of ${totalN} synced &middot; ${completionRatePct}% item completion</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">${_esc(kpi3Label)}</div>
                <div class="kpi-value">${_esc(kpi3Value)}</div>
                <div class="kpi-sub">${_esc(kpi3Sub)}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Verbatim Net Sentiment</div>
                <div class="kpi-value" style="color:${sentimentTone};">${_esc(kpi4Value)}</div>
                <div class="kpi-sub">${_esc(kpi4Sub)}</div>
              </div>
            </div>
            <div class="kpi-callout">
              <div class="callout-label">Headline Takeaway</div>
              <div class="callout-text">${_esc(briefing.headline || `Collected ${totalN} responses across ${questions.length} survey items with ${completionRatePct}% average item completion.`)}</div>
            </div>
          </div>
        </section>
      `);

      // SLIDES 3..K: Key Quantitative Findings (up to 6 top questions, 2 per slide max)
      const textTypes = new Set(['long_text', 'short_text', 'textarea', 'text', 'audio_note']);
      const quantCandidates = questions
        .map((q, idx) => ({ q, idx, bd: _computeQuestionBreakdown(q, safeResponses) }))
        .filter((item) => !textTypes.has(String(item.q.type || '').toLowerCase()));

      const selectedFindings = (quantCandidates.length > 0 ? quantCandidates : questions.map((q, idx) => ({ q, idx, bd: _computeQuestionBreakdown(q, safeResponses) })))
        .sort((a, b) => (b.bd.answered - a.bd.answered) || (a.idx - b.idx))
        .slice(0, 6)
        .sort((a, b) => a.idx - b.idx);

      for (let i = 0; i < selectedFindings.length; i += 2) {
        const pair = selectedFindings.slice(i, i + 2);
        const pageNum = Math.floor(i / 2) + 1;
        const totalQuantSlides = Math.ceil(selectedFindings.length / 2);

        const cardsHtml = pair.map(({ q, idx, bd }) => {
          const cleanTitle = _cleanTitle(q, safeSurvey);
          const qCode = q.code || `Q${idx + 1}`;
          const respPct = totalN > 0 ? Math.round((bd.answered / totalN) * 100) : 0;

          let contentHtml = '';
          if (bd.kind === 'numeric') {
            const u = bd.unit ? ` ${_esc(bd.unit)}` : '';
            contentHtml = `
              <div class="num-grid">
                <div class="num-box"><div class="num-lbl">Mean</div><div class="num-val">${_esc(bd.mean)}${u}</div></div>
                <div class="num-box"><div class="num-lbl">Median</div><div class="num-val">${_esc(bd.median)}${u}</div></div>
                <div class="num-box"><div class="num-lbl">Min</div><div class="num-val">${_esc(bd.min)}${u}</div></div>
                <div class="num-box"><div class="num-lbl">Max</div><div class="num-val">${_esc(bd.max)}${u}</div></div>
                <div class="num-box"><div class="num-lbl">Std Dev</div><div class="num-val">${_esc(bd.stdDev)}</div></div>
              </div>
            `;
          } else if (bd.kind === 'text') {
            contentHtml = bd.sampleQuotes.length > 0
              ? `<div class="mini-quotes">${bd.sampleQuotes.slice(0, 2).map((qt) => `<div class="mini-quote">&ldquo;${_esc(qt.length > 150 ? qt.slice(0, 147) + '...' : qt)}&rdquo;</div>`).join('')}</div>`
              : '<div class="empty-note">No responses recorded.</div>';
          } else {
            const topRows = (bd.rows || []).slice(0, 6);
            const statBadge = bd.npsScore !== null
              ? `<span class="stat-pill">NPS ${bd.npsScore >= 0 ? '+' : ''}${bd.npsScore}</span>`
              : (bd.mean !== null ? `<span class="stat-pill">Mean ${bd.mean}</span>` : '');
            contentHtml = topRows.length > 0
              ? `
                ${statBadge ? `<div class="stat-row">${statBadge}</div>` : ''}
                <div class="bar-list">
                  ${topRows.map((row) => {
                    const safePct = Math.max(0, Math.min(100, Number(row.pct) || 0));
                    return `
                      <div class="bar-item">
                        <div class="bar-meta">
                          <span class="bar-label">${_esc(row.label)}</span>
                          <span class="bar-nums"><strong>${row.pct}%</strong> <span class="bar-count">(n=${row.count})</span></span>
                        </div>
                        <div class="bar-track">
                          <div class="bar-fill" style="width:${safePct}%;"></div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              `
              : '<div class="empty-note">No responses recorded.</div>';
          }

          return `
            <div class="finding-card">
              <div class="finding-head">
                <div class="finding-title-wrap">
                  <span class="q-code">${_esc(qCode)}</span>
                  <h3 class="finding-title">${_esc(cleanTitle)}</h3>
                </div>
                <span class="finding-n">n = ${bd.answered} (${respPct}%)</span>
              </div>
              ${contentHtml}
            </div>
          `;
        }).join('');

        slides.push(`
          <section class="slide" data-slide-type="findings">
            <div class="slide-inner">
              <div class="slide-header">
                <div>
                  <div class="slide-eyebrow">Key Quantitative Findings &middot; ${pageNum} of ${totalQuantSlides}</div>
                  <h2 class="slide-heading">Response Distributions</h2>
                </div>
                <div class="slide-tag">n = ${totalN}</div>
              </div>
              <div class="findings-grid ${pair.length === 1 ? 'single' : 'two-col'}">
                ${cardsHtml}
              </div>
            </div>
          </section>
        `);
      }

      // SLIDE K+1: Qualitative Themes & Score Impact (when verbatims exist)
      const themes = analysis.themes || [];
      const impactRows = themeImpact.impacts || [];
      if (totalVerbatims > 0 || themes.length > 0 || (themeImpact.hasMetric && impactRows.length > 0)) {
        const themesListHtml = themes.length > 0
          ? themes.slice(0, 6).map((t) => {
              const net = Number(t.netSentiment ?? 0);
              const badgeCls = net > 10 ? 'pill-pos' : (net < -10 ? 'pill-neg' : 'pill-neu');
              const safePct = Math.max(0, Math.min(100, Number(t.pct) || 0));
              return `
                <div class="theme-row">
                  <div class="theme-row-top">
                    <span class="theme-name">
                      ${_esc(t.name)}
                      ${t.isCustom ? '<span class="custom-tag">Custom</span>' : ''}
                    </span>
                    <span class="theme-right">
                      <span class="theme-count">${t.count} (${t.pct}%)</span>
                      <span class="sent-pill ${badgeCls}">${net > 0 ? '+' : ''}${net}%</span>
                    </span>
                  </div>
                  <div class="bar-track compact"><div class="bar-fill" style="width:${safePct}%;"></div></div>
                </div>
              `;
            }).join('')
          : '<div class="empty-note">No recurring themes detected yet.</div>';

        const impactPanelHtml = themeImpact.hasMetric && impactRows.length > 0
          ? `
            <div class="panel-title">Theme-to-Score Impact Drivers</div>
            <div class="panel-sub">Impact on <strong>${_esc(themeImpact.metricLabel || 'Primary Metric')}</strong> (mean: ${_esc(themeImpact.overallMean)}, n = ${themeImpact.totalScored})</div>
            <table class="impact-table">
              <thead>
                <tr>
                  <th>Theme</th>
                  <th class="num">With</th>
                  <th class="num">Without</th>
                  <th class="num">Delta</th>
                  <th class="num">p-val</th>
                </tr>
              </thead>
              <tbody>
                ${impactRows.slice(0, 6).map((row) => {
                  const dCls = row.delta > 0 ? 'pill-pos' : (row.delta < 0 ? 'pill-neg' : 'pill-neu');
                  const pTxt = row.pValue === null ? 'n&lt;2' : `${row.pValue}${row.isSignificant ? ' *' : ''}`;
                  return `
                    <tr>
                      <td class="td-strong">${_esc(row.name)}</td>
                      <td class="num">${_esc(row.meanWith)}</td>
                      <td class="num muted">${_esc(row.meanWithout)}</td>
                      <td class="num"><span class="sent-pill ${dCls}">${row.delta > 0 ? '+' : ''}${row.delta}</span></td>
                      <td class="num">${pTxt}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          `
          : `
            <div class="panel-title">Verbatim Sentiment Synthesis</div>
            <div class="panel-sub">${totalVerbatims} open-ended responses analyzed</div>
            <div class="sent-summary-cards">
              <div class="sent-mini pos"><div class="sent-mini-val">${ss.positive}</div><div class="sent-mini-lbl">Positive</div></div>
              <div class="sent-mini neu"><div class="sent-mini-val">${ss.neutral}</div><div class="sent-mini-lbl">Neutral</div></div>
              <div class="sent-mini neg"><div class="sent-mini-val">${ss.negative}</div><div class="sent-mini-lbl">Negative / Alerts</div></div>
            </div>
            ${Array.isArray(briefing.summaryBullets) && briefing.summaryBullets.length > 0
              ? `<ul class="bullet-list">${briefing.summaryBullets.slice(0, 3).map((b) => `<li>${_esc(b)}</li>`).join('')}</ul>`
              : ''}
          `;

        slides.push(`
          <section class="slide" data-slide-type="qualitative">
            <div class="slide-inner">
              <div class="slide-header">
                <div>
                  <div class="slide-eyebrow">Qualitative Intelligence</div>
                  <h2 class="slide-heading">Themes &amp; Score Impact</h2>
                </div>
                <div class="slide-tag">${totalVerbatims} verbatims</div>
              </div>
              <div class="two-col-split">
                <div class="panel-box">
                  <div class="panel-title">Top Discovered &amp; Custom Themes</div>
                  <div class="panel-sub">Share of open-ended mentions and net sentiment</div>
                  <div class="theme-list">${themesListHtml}</div>
                </div>
                <div class="panel-box">
                  ${impactPanelHtml}
                </div>
              </div>
            </div>
          </section>
        `);
      }

      // SLIDE K+2: Recommendations & Key Quotes + Merkle Integrity Seal
      const topRecs = (briefing.actionableRecommendations || []).slice(0, 4);
      const fallbackRecs = topRecs.length > 0
        ? topRecs
        : (Array.isArray(briefing.summaryBullets) && briefing.summaryBullets.length > 0
            ? briefing.summaryBullets.slice(0, 4)
            : [`Review question-level distributions across n = ${totalN} responses (${completionRatePct}% completion).`, `Sync coverage stands at ${syncPct}% (${syncedCount} of ${totalN} records synced).`]);

      const quotePool = pinnedRecords.length > 0
        ? pinnedRecords.slice(0, 3)
        : (analysis.records || []).slice(0, 3);

      const recsHtml = fallbackRecs.map((rec, i) => {
        const txt = typeof rec === 'string' ? rec : (rec.translatedText || rec.text || '');
        const meta = typeof rec === 'object' && rec ? [rec.questionCode, rec.segment].filter(Boolean).join(' · ') : '';
        return `
          <div class="rec-item">
            <div class="rec-num">${i + 1}</div>
            <div class="rec-body">
              <div class="rec-text">${_esc(txt)}</div>
              ${meta ? `<div class="rec-meta">${_esc(meta)}</div>` : ''}
            </div>
          </div>
        `;
      }).join('');

      const quotesHtml = quotePool.length > 0
        ? quotePool.map((pq) => {
            const txt = typeof pq === 'string' ? pq : (pq.translatedText || pq.text || '');
            const clipped = txt.length > 180 ? txt.slice(0, 177) + '...' : txt;
            const qCode = typeof pq === 'object' && pq && pq.questionCode ? pq.questionCode : 'Respondent';
            const sentiment = typeof pq === 'object' && pq && pq.sentiment ? pq.sentiment : 'neutral';
            const seg = typeof pq === 'object' && pq && pq.segment ? pq.segment : '';
            const borderCol = sentiment === 'positive' ? accent : (sentiment === 'negative' ? '#C4242A' : '#94A3B8');
            return `
              <blockquote class="quote-card" style="border-left-color:${borderCol};">
                <p class="quote-text">&ldquo;${_esc(clipped)}&rdquo;</p>
                <footer class="quote-meta"><strong>${_esc(qCode)}</strong>${seg ? ` &middot; ${_esc(seg)}` : ''} &middot; ${_esc(sentiment.charAt(0).toUpperCase() + sentiment.slice(1))}</footer>
              </blockquote>
            `;
          }).join('')
        : '<div class="empty-note">Pin representative respondent quotes in the Text Analysis tab to feature them here.</div>';

      slides.push(`
        <section class="slide" data-slide-type="closing">
          <div class="slide-inner closing-inner">
            <div class="slide-header">
              <div>
                <div class="slide-eyebrow">Action Plan &amp; Voices</div>
                <h2 class="slide-heading">Recommendations &amp; Key Quotes</h2>
              </div>
              <div class="slide-tag">${_esc(generatedDate)}</div>
            </div>
            <div class="two-col-split closing-split">
              <div class="panel-box">
                <div class="panel-title">Actionable Recommendations</div>
                <div class="rec-list">${recsHtml}</div>
              </div>
              <div class="panel-box">
                <div class="panel-title">${pinnedRecords.length > 0 ? 'Pinned Respondent Quotes' : 'Representative Quotes'}</div>
                <div class="quote-list">${quotesHtml}</div>
              </div>
            </div>
            <div class="merkle-footer">
              <div class="merkle-left">
                ${merkleHash
                  ? `<span class="seal-badge">Merkle Integrity Seal (RFC 6962)</span> <code class="seal-hash">${_esc(merkleHash)}</code>`
                  : `<span class="seal-badge">Verified Research Deck</span> <span class="seal-muted">Agri Experience Limited &middot; Survey ID: ${_esc(safeSurvey.id || '')}</span>`}
              </div>
              <div class="merkle-right">Prepared ${_esc(generatedDate)} &middot; n = ${totalN}</div>
            </div>
          </div>
        </section>
      `);

      const totalSlides = slides.length;

      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Presentation — ${_esc(safeSurvey.title || 'AE Survey')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --ae-accent: ${accent};
      --ae-bg: ${theme.pageBg};
      --ae-card: ${theme.cardBg};
      --ae-border: ${theme.cardBorder};
      --ae-ink: ${theme.ink};
      --ae-muted: ${theme.mutedInk};
      --ae-font-display: 'Fraunces', Georgia, 'Times New Roman', serif;
      --ae-font-body: 'Plus Jakarta Sans', 'Segoe UI', system-ui, -apple-system, sans-serif;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #111613;
      color: var(--ae-ink);
      font-family: var(--ae-font-body);
      font-variant-numeric: tabular-nums;
      -webkit-font-smoothing: antialiased;
      overflow: hidden;
    }
    .deck-viewport {
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .slide {
      display: none;
      width: min(96vw, calc(94vh * 16 / 9), 1280px);
      aspect-ratio: 16 / 9;
      background: var(--ae-bg);
      border-radius: 14px;
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.45);
      overflow: hidden;
      position: relative;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .slide.active { display: flex; flex-direction: column; }
    .slide-inner {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 36px 46px 32px;
      gap: 20px;
      min-height: 0;
    }

    /* Slide 1: Title */
    .slide-title { background: var(--ae-card); }
    .title-accent-bar {
      height: 8px;
      width: 100%;
      background: var(--ae-accent);
      flex-shrink: 0;
    }
    .title-layout { justify-content: space-between; padding: 38px 56px 44px; }
    .title-top { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .brand-lockup { display: flex; align-items: center; gap: 14px; }
    .brand-logo { max-height: 44px; max-width: 180px; object-fit: contain; }
    .brand-kicker { font-size: 13px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: var(--ae-accent); }
    .pill-badge {
      font-size: 12px;
      font-weight: 600;
      color: var(--ae-muted);
      background: var(--ae-bg);
      border: 1px solid var(--ae-border);
      padding: 6px 14px;
      border-radius: 999px;
    }
    .title-center { max-width: 920px; }
    .display-title {
      font-family: var(--ae-font-display);
      font-size: clamp(32px, 3.8vw, 52px);
      font-weight: 700;
      line-height: 1.12;
      color: var(--ae-ink);
      margin: 0;
      letter-spacing: -0.02em;
    }
    .title-desc {
      font-size: clamp(15px, 1.4vw, 19px);
      line-height: 1.55;
      color: var(--ae-muted);
      margin: 18px 0 0;
      max-width: 780px;
    }
    .title-meta-strip {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
      padding-top: 22px;
      border-top: 1px solid var(--ae-border);
    }
    .meta-chip { display: flex; flex-direction: column; gap: 4px; }
    .meta-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ae-muted); }
    .meta-val { font-size: 20px; font-weight: 700; color: var(--ae-ink); }

    /* Shared Slide Header */
    .slide-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 2px solid var(--ae-border);
      padding-bottom: 12px;
      flex-shrink: 0;
    }
    .slide-eyebrow {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--ae-accent);
      margin-bottom: 4px;
    }
    .slide-heading {
      font-family: var(--ae-font-display);
      font-size: clamp(22px, 2.2vw, 30px);
      font-weight: 700;
      color: var(--ae-ink);
      margin: 0;
      line-height: 1.15;
    }
    .slide-tag {
      font-size: 12px;
      font-weight: 600;
      color: var(--ae-muted);
      background: var(--ae-card);
      border: 1px solid var(--ae-border);
      padding: 5px 12px;
      border-radius: 6px;
      white-space: nowrap;
      max-width: 320px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Slide 2: KPIs */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
      flex: 1;
      min-height: 0;
    }
    .kpi-card {
      background: var(--ae-card);
      border: 1px solid var(--ae-border);
      border-top: 4px solid var(--ae-accent);
      border-radius: 10px;
      padding: 22px 26px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 8px;
    }
    .kpi-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ae-muted); }
    .kpi-value { font-family: var(--ae-font-display); font-size: clamp(30px, 3vw, 44px); font-weight: 700; color: var(--ae-ink); line-height: 1.1; }
    .kpi-slash { font-family: var(--ae-font-body); font-weight: 400; opacity: 0.4; font-size: 0.7em; }
    .kpi-sub { font-size: 12.5px; color: var(--ae-muted); line-height: 1.4; }
    .kpi-callout {
      background: var(--ae-card);
      border: 1px solid var(--ae-border);
      border-left: 4px solid var(--ae-accent);
      border-radius: 8px;
      padding: 14px 20px;
      flex-shrink: 0;
    }
    .callout-label { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ae-accent); margin-bottom: 4px; }
    .callout-text { font-size: 14px; font-weight: 500; color: var(--ae-ink); line-height: 1.45; }

    /* Slides 3..K: Findings */
    .findings-grid { display: grid; gap: 20px; flex: 1; min-height: 0; }
    .findings-grid.two-col { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .findings-grid.single { grid-template-columns: 1fr; }
    .finding-card {
      background: var(--ae-card);
      border: 1px solid var(--ae-border);
      border-radius: 10px;
      padding: 20px 22px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      overflow: hidden;
    }
    .finding-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
    .finding-title-wrap { display: flex; align-items: flex-start; gap: 8px; min-width: 0; }
    .q-code {
      display: inline-block;
      background: var(--ae-accent);
      color: #FFFFFF;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 5px;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .finding-title { font-size: 15px; font-weight: 700; color: var(--ae-ink); margin: 0; line-height: 1.35; }
    .finding-n { font-size: 11px; font-weight: 600; color: var(--ae-muted); white-space: nowrap; flex-shrink: 0; }
    .stat-row { display: flex; gap: 8px; }
    .stat-pill {
      font-size: 11px;
      font-weight: 700;
      color: #04250E;
      background: #DCFAE5;
      padding: 3px 10px;
      border-radius: 999px;
    }
    .bar-list { display: flex; flex-direction: column; gap: 11px; flex: 1; justify-content: center; }
    .bar-item { display: flex; flex-direction: column; gap: 4px; }
    .bar-meta { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; font-size: 12.5px; }
    .bar-label { color: var(--ae-ink); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bar-nums { color: var(--ae-ink); white-space: nowrap; font-size: 12px; }
    .bar-count { color: var(--ae-muted); font-weight: 400; }
    .bar-track { width: 100%; height: 11px; background: #E9ECEA; border-radius: 999px; overflow: hidden; }
    .bar-track.compact { height: 7px; }
    .bar-fill { height: 100%; background: var(--ae-accent); border-radius: 999px; }
    .num-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; margin-top: 12px; }
    .num-box { background: var(--ae-bg); border: 1px solid var(--ae-border); border-radius: 8px; padding: 14px 8px; text-align: center; }
    .num-lbl { font-size: 10.5px; font-weight: 600; color: var(--ae-muted); text-transform: uppercase; }
    .num-val { font-size: 17px; font-weight: 700; color: var(--ae-ink); margin-top: 4px; }
    .mini-quotes { display: flex; flex-direction: column; gap: 10px; }
    .mini-quote { background: var(--ae-bg); border-left: 3px solid var(--ae-accent); padding: 10px 14px; font-size: 12.5px; font-style: italic; color: var(--ae-ink); line-height: 1.45; }

    /* Qualitative & Closing Split */
    .two-col-split { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; flex: 1; min-height: 0; }
    .panel-box {
      background: var(--ae-card);
      border: 1px solid var(--ae-border);
      border-radius: 10px;
      padding: 20px 22px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      overflow: hidden;
    }
    .panel-title { font-size: 15px; font-weight: 700; color: var(--ae-ink); }
    .panel-sub { font-size: 11.5px; color: var(--ae-muted); margin-top: -4px; }
    .theme-list { display: flex; flex-direction: column; gap: 11px; margin-top: 4px; }
    .theme-row { display: flex; flex-direction: column; gap: 4px; }
    .theme-row-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 12.5px; }
    .theme-name { font-weight: 600; color: var(--ae-ink); }
    .custom-tag { font-size: 9.5px; font-weight: 700; background: #DCFAE5; color: #04250E; padding: 1px 6px; border-radius: 3px; margin-left: 4px; }
    .theme-right { display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; }
    .theme-count { font-size: 11.5px; color: var(--ae-muted); }
    .sent-pill { font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 4px; display: inline-block; }
    .pill-pos { background: #DCFAE5; color: #04250E; }
    .pill-neg { background: #FFEDEA; color: #831C1E; }
    .pill-neu { background: #F1F5F3; color: #525B56; }

    .impact-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 4px; }
    .impact-table th { text-align: left; font-size: 11px; font-weight: 700; color: var(--ae-muted); padding: 7px 6px; border-bottom: 1px solid var(--ae-border); }
    .impact-table td { padding: 8px 6px; border-bottom: 1px solid #F1F3F1; color: var(--ae-ink); }
    .impact-table .num { text-align: right; white-space: nowrap; }
    .impact-table .td-strong { font-weight: 600; }
    .impact-table .muted { color: var(--ae-muted); }

    .sent-summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 8px 0; }
    .sent-mini { border-radius: 8px; padding: 14px 10px; text-align: center; border: 1px solid var(--ae-border); }
    .sent-mini.pos { background: #F0FDF4; color: #04250E; }
    .sent-mini.neu { background: #F8F9F8; color: #37413C; }
    .sent-mini.neg { background: #FFF7F6; color: #831C1E; }
    .sent-mini-val { font-size: 24px; font-weight: 700; }
    .sent-mini-lbl { font-size: 11px; font-weight: 600; margin-top: 2px; }
    .bullet-list { margin: 6px 0 0 18px; padding: 0; font-size: 12.5px; color: var(--ae-ink); line-height: 1.5; }
    .bullet-list li { margin-bottom: 6px; }

    /* Closing Slide */
    .closing-inner { gap: 16px; }
    .rec-list { display: flex; flex-direction: column; gap: 12px; margin-top: 4px; }
    .rec-item { display: flex; align-items: flex-start; gap: 12px; }
    .rec-num {
      width: 24px;
      height: 24px;
      border-radius: 999px;
      background: var(--ae-accent);
      color: #FFFFFF;
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .rec-text { font-size: 13px; color: var(--ae-ink); line-height: 1.45; font-weight: 500; }
    .rec-meta { font-size: 11px; color: var(--ae-muted); margin-top: 2px; }
    .quote-list { display: flex; flex-direction: column; gap: 12px; margin-top: 4px; }
    .quote-card {
      margin: 0;
      padding: 12px 14px;
      background: var(--ae-bg);
      border: 1px solid var(--ae-border);
      border-left: 4px solid var(--ae-accent);
      border-radius: 6px;
    }
    .quote-text { margin: 0; font-size: 12.5px; font-style: italic; color: var(--ae-ink); line-height: 1.45; }
    .quote-meta { font-size: 11px; color: var(--ae-muted); margin-top: 6px; }
    .empty-note { font-size: 12.5px; color: var(--ae-muted); padding: 12px 0; }

    .merkle-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      background: var(--ae-card);
      border: 1px solid var(--ae-border);
      border-left: 4px solid var(--ae-accent);
      border-radius: 8px;
      padding: 9px 14px;
      font-size: 11px;
      color: var(--ae-muted);
      flex-shrink: 0;
    }
    .merkle-left { display: flex; align-items: center; gap: 8px; min-width: 0; overflow: hidden; }
    .seal-badge { font-weight: 700; color: var(--ae-ink); white-space: nowrap; }
    .seal-hash { font-family: Consolas, monospace; font-size: 10.5px; color: var(--ae-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .seal-muted { color: var(--ae-muted); }
    .merkle-right { white-space: nowrap; font-weight: 600; }

    /* Minimalist Bottom-Right Presenter Controls */
    .presenter-controls {
      position: fixed;
      right: 20px;
      bottom: 18px;
      z-index: 999;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(17, 22, 19, 0.88);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 999px;
      padding: 6px 10px;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
      color: #F4F6F4;
      font-size: 12px;
    }
    .ctrl-btn {
      appearance: none;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: rgba(255, 255, 255, 0.06);
      color: #FFFFFF;
      font-family: var(--ae-font-body);
      font-size: 12px;
      font-weight: 600;
      padding: 5px 11px;
      border-radius: 999px;
      cursor: pointer;
      transition: background 0.15s ease, opacity 0.15s ease;
      white-space: nowrap;
    }
    .ctrl-btn:hover:not(:disabled) { background: var(--ae-accent); border-color: var(--ae-accent); }
    .ctrl-btn:disabled { opacity: 0.38; cursor: not-allowed; }
    .ctrl-counter {
      padding: 0 8px;
      font-weight: 600;
      color: #DCE5DF;
      white-space: nowrap;
    }
    .ctrl-sep { width: 1px; height: 16px; background: rgba(255, 255, 255, 0.18); margin: 0 2px; }

    /* Landscape 16:9 Print / PDF Export */
    @page { size: landscape; margin: 0; }
    @media print {
      html, body {
        width: auto;
        height: auto;
        background: #FFFFFF !important;
        overflow: visible !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .deck-viewport {
        display: block;
        width: 100%;
        height: auto;
        padding: 0;
      }
      .slide, .slide.active {
        display: flex !important;
        flex-direction: column;
        width: 100vw;
        height: 100vh;
        max-width: none;
        aspect-ratio: auto;
        border-radius: 0;
        box-shadow: none;
        border: none;
        page-break-after: always;
        break-after: page;
      }
      .slide:last-of-type {
        page-break-after: auto;
        break-after: auto;
      }
      .presenter-controls { display: none !important; }
    }
  </style>
</head>
<body>
  <main class="deck-viewport" id="deckViewport" aria-label="Presentation Slide Deck">
    ${slides.join('\n')}
  </main>

  <nav class="presenter-controls" aria-label="Slide Navigation Controls">
    <button type="button" class="ctrl-btn" id="btnPrev" aria-label="Previous Slide">&larr; Prev</button>
    <span class="ctrl-counter" id="slideCounter">Slide 1 / ${totalSlides}</span>
    <button type="button" class="ctrl-btn" id="btnNext" aria-label="Next Slide">Next &rarr;</button>
    <span class="ctrl-sep" aria-hidden="true"></span>
    <button type="button" class="ctrl-btn" id="btnFullscreen" title="Toggle Fullscreen (F)">Fullscreen (F)</button>
    <button type="button" class="ctrl-btn" id="btnPrint" title="Print Slides to PDF (P)">Print Slides (P)</button>
  </nav>

  <script>
    (function () {
      var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
      var total = slides.length;
      var current = 0;
      var counterEl = document.getElementById('slideCounter');
      var btnPrev = document.getElementById('btnPrev');
      var btnNext = document.getElementById('btnNext');
      var btnFullscreen = document.getElementById('btnFullscreen');
      var btnPrint = document.getElementById('btnPrint');

      function showSlide(index) {
        if (!total) return;
        current = Math.max(0, Math.min(total - 1, index));
        for (var i = 0; i < total; i++) {
          slides[i].classList.toggle('active', i === current);
        }
        if (counterEl) counterEl.textContent = 'Slide ' + (current + 1) + ' / ' + total;
        if (btnPrev) btnPrev.disabled = current === 0;
        if (btnNext) btnNext.disabled = current === total - 1;
      }

      function nextSlide() { showSlide(current + 1); }
      function prevSlide() { showSlide(current - 1); }

      function toggleFullscreen() {
        var doc = document;
        if (!doc.fullscreenElement) {
          if (doc.documentElement.requestFullscreen) {
            doc.documentElement.requestFullscreen().catch(function () {});
          }
        } else if (doc.exitFullscreen) {
          doc.exitFullscreen().catch(function () {});
        }
      }

      function printSlides() {
        window.print();
      }

      if (btnPrev) btnPrev.addEventListener('click', prevSlide);
      if (btnNext) btnNext.addEventListener('click', nextSlide);
      if (btnFullscreen) btnFullscreen.addEventListener('click', toggleFullscreen);
      if (btnPrint) btnPrint.addEventListener('click', printSlides);

      document.addEventListener('keydown', function (e) {
        var key = e.key;
        if (key === 'ArrowRight' || key === ' ' || key === 'Spacebar' || key === 'PageDown') {
          e.preventDefault();
          nextSlide();
        } else if (key === 'ArrowLeft' || key === 'PageUp') {
          e.preventDefault();
          prevSlide();
        } else if (key === 'Home') {
          e.preventDefault();
          showSlide(0);
        } else if (key === 'End') {
          e.preventDefault();
          showSlide(total - 1);
        } else if (key === 'f' || key === 'F') {
          e.preventDefault();
          toggleFullscreen();
        } else if (key === 'p' || key === 'P') {
          e.preventDefault();
          printSlides();
        }
      });

      showSlide(0);
    })();
  </script>
</body>
</html>`;
    },

    /**
     * Opens a new window with the self-contained 16:9 Interactive Presentation Slide Deck.
     */
    async openSlideDeck(surveyId, options = {}) {
      const { survey, responses } = _resolveSurveyAndResponses(surveyId);
      if (!survey) {
        if (globalScope.AEApp && typeof globalScope.AEApp.showToast === 'function') {
          globalScope.AEApp.showToast('Survey not found for Presentation Deck.', 'error');
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

      const html = this.buildSlideDeckHTML(survey, responses, {
        ...options,
        merkleHash,
        impactMetricQId
      });

      if (typeof globalScope.open !== 'function') return html;
      const deckWin = globalScope.open('', '_blank', 'width=1280,height=760');
      if (!deckWin) {
        if (globalScope.AEApp && typeof globalScope.AEApp.showToast === 'function') {
          globalScope.AEApp.showToast('Pop-up blocked. Please allow pop-ups to open the Presentation Slide Deck.', 'warning');
        }
        return false;
      }

      deckWin.document.open();
      deckWin.document.write(html);
      deckWin.document.close();
      deckWin.focus();
      return true;
    }
  };

  if (typeof globalScope !== 'undefined') {
    globalScope.AEReportExport = AEReportExport;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AEReportExport;
  }
})(typeof window !== 'undefined' ? window : globalThis);
