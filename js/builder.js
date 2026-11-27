/**
 * ============================================================================
 * AE SURVEY — Stage 2: Design Survey (AE Survey Builder Module)
 * Supports 11 Question Types, Multi-Page Sections, Conditional Skip Logic,
 * Theme Customization, and Schema Export.
 * ============================================================================
 */

const QUESTION_TYPES_CATALOG = [
  // 1. Choice & Categorical Selection
  { type: 'multiple_choice', label: 'Single Choice (Radio)', icon: 'fa-circle-dot', group: 'Choice & Selection' },
  { type: 'checkboxes', label: 'Multiple Choice (Checkboxes)', icon: 'fa-square-check', group: 'Choice & Selection' },
  { type: 'dropdown', label: 'Dropdown Menu', icon: 'fa-caret-down', group: 'Choice & Selection' },
  { type: 'cascading_dropdown', label: 'Cascading / Hierarchical Select', icon: 'fa-sitemap', group: 'Choice & Selection' },

  // 2. Evaluative Scales & Matrices
  { type: 'star_rating', label: 'Star Rating (1–5)', icon: 'fa-star', group: 'Ratings & Scales' },
  { type: 'nps', label: 'Net Promoter Score (0–10 NPS)', icon: 'fa-gauge-high', group: 'Ratings & Scales' },
  { type: 'matrix', label: 'Matrix / Likert Rating Grid', icon: 'fa-table-cells', group: 'Ratings & Scales' },

  // 3. Text & Numerical Data
  { type: 'short_text', label: 'Single-Line Text', icon: 'fa-font', group: 'Text & Numeric' },
  { type: 'long_text', label: 'Multi-Line Notes / Verbatim', icon: 'fa-align-left', group: 'Text & Numeric' },
  { type: 'number_yield', label: 'Continuous Numeric / Metric', icon: 'fa-calculator', group: 'Text & Numeric' },
  { type: 'calculated', label: 'Calculated Field (Formula)', icon: 'fa-equals', group: 'Text & Numeric' },
  { type: 'date_time', label: 'Date / Time Picker', icon: 'fa-calendar-day', group: 'Text & Numeric' },

  // 4. Media, Verification & Advanced Telemetry
  { type: 'gps_location', label: 'Geographic GPS Plot Lock', icon: 'fa-location-crosshairs', group: 'Media & Field Telemetry' },
  { type: 'barcode_scanner', label: 'Barcode / QR / Serial Scanner', icon: 'fa-barcode', group: 'Media & Field Telemetry' },
  { type: 'signature', label: 'Digital Sign-off / Signature', icon: 'fa-signature', group: 'Media & Field Telemetry' },
  { type: 'photo_proof', label: 'Photo Verification / Camera', icon: 'fa-camera', group: 'Media & Field Telemetry' },
  { type: 'audio_note', label: 'Voice Testimony / Audio Memo', icon: 'fa-microphone', group: 'Media & Field Telemetry' },
  { type: 'repeat_group', label: 'Repeat Table / Multi-Item Roster', icon: 'fa-layer-group', group: 'Media & Field Telemetry' }
];

window.QUESTION_TYPES_CATALOG = QUESTION_TYPES_CATALOG;

window.AEBuilder = {
  activePageIndex: 0,
  leftTab: 'questions', // 'questions' | 'translations' | 'theme'
  targetLang: 'sw', // 'sw' | 'fr'
  previewMode: false, // false = editor, true = interactive simulator
  previewDevice: 'desktop', // 'desktop' | 'mobile'
  showPreFlightPanel: false,
  _draggedQuestionId: null,

  // --------------------------------------------------------------------------
  // FEATURE: PRE-FLIGHT SURVEY LINTER (PRE-LAUNCH QUALITY AUDIT)
  // --------------------------------------------------------------------------
  runPreFlightAudit(survey) {
    const issues = [];
    const pages = Array.isArray(survey?.pages) ? survey.pages : [];
    const allQuestions = pages.flatMap((p, pIdx) => (p.questions || []).map((q) => ({ q, pageIndex: pIdx, pageId: p.id })));
    const qIdSet = new Set(allQuestions.map((x) => x.q.id));
    const pageIdSet = new Set(pages.map((p) => p.id));

    if (allQuestions.length === 0) {
      issues.push({ severity: 'error', code: 'EMPTY_SURVEY', message: 'Survey has no questions yet. Add at least one question before publishing.' });
    }

    const titleCounts = {};
    let totalEstimatedSec = 0;
    let hasOpenEnded = false;

    allQuestions.forEach(({ q, pageIndex }, idx) => {
      const label = `Q${idx + 1}`;
      const title = String(q.title || '').trim();
      if (!title || /^untitled question$/i.test(title)) {
        issues.push({ severity: 'error', code: 'UNTITLED', qId: q.id, message: `${label} still has a placeholder or empty title.` });
      } else {
        const norm = title.toLowerCase();
        titleCounts[norm] = (titleCounts[norm] || 0) + 1;
        if (titleCounts[norm] === 2) {
          issues.push({ severity: 'warning', code: 'DUPLICATE_TITLE', qId: q.id, message: `${label} duplicates an earlier question title ("${title.slice(0, 40)}").` });
        }
      }

      // Choice option checks
      if (q.type === 'multiple_choice' || q.type === 'checkboxes' || q.type === 'dropdown') {
        const opts = Array.isArray(q.options) ? q.options.map((o) => String(o || '').trim()).filter(Boolean) : [];
        if (opts.length < 2) {
          issues.push({ severity: 'error', code: 'TOO_FEW_OPTIONS', qId: q.id, message: `${label} ("${title.slice(0, 32)}") needs at least 2 answer choices.` });
        }
        const seenOpts = new Set();
        opts.forEach((o) => {
          const ol = o.toLowerCase();
          if (seenOpts.has(ol)) {
            issues.push({ severity: 'error', code: 'DUPLICATE_OPTION', qId: q.id, message: `${label} has a duplicate option "${o}".` });
          }
          seenOpts.add(ol);
        });
      }

      // Broken skip-logic target check
      if (q.logic && q.logic.enabled && q.logic.target) {
        const tgt = String(q.logic.target).trim();
        if (tgt !== 'submit' && tgt !== 'end' && tgt !== 'END_SURVEY' && !pageIdSet.has(tgt) && !qIdSet.has(tgt)) {
          issues.push({ severity: 'error', code: 'BROKEN_LOGIC', qId: q.id, message: `${label} skip-logic points to a missing target ("${tgt}").` });
        }
      }

      // Broken display rule source check
      if (q.displayRule && q.displayRule.enabled && q.displayRule.sourceQuestionId) {
        if (!qIdSet.has(q.displayRule.sourceQuestionId)) {
          issues.push({ severity: 'error', code: 'BROKEN_DISPLAY_RULE', qId: q.id, message: `${label} conditional display rule references a deleted question.` });
        }
      }

      // Formula validation for calculated fields
      if (q.type === 'calculated' && !String(q.formula || '').trim()) {
        issues.push({ severity: 'error', code: 'EMPTY_FORMULA', qId: q.id, message: `${label} is a Calculated Field with no formula configured.` });
      }

      if (q.type === 'short_text' || q.type === 'long_text' || q.type === 'audio_note') {
        hasOpenEnded = true;
        totalEstimatedSec += q.type === 'long_text' ? 35 : 20;
      } else if (q.type === 'matrix') {
        totalEstimatedSec += Math.max(20, ((q.rows || []).length || 3) * 8);
      } else {
        totalEstimatedSec += 12;
      }
    });

    // Long unpaginated page warning
    pages.forEach((p, idx) => {
      if ((p.questions || []).length > 12) {
        issues.push({ severity: 'warning', code: 'LONG_PAGE', message: `Page ${idx + 1} has ${p.questions.length} questions. Splitting into pages improves mobile completion rates.` });
      }
    });

    // Incomplete translations check (only if user started translating into any language)
    if (survey && survey.translations && typeof survey.translations === 'object') {
      Object.keys(survey.translations).forEach((lang) => {
        const dict = survey.translations[lang];
        if (!dict || Object.keys(dict).length === 0) return;
        const missing = allQuestions.filter(({ q }) => !dict[q.id] || !String(dict[q.id].title || '').trim());
        if (missing.length > 0) {
          issues.push({
            severity: 'warning',
            code: 'INCOMPLETE_TRANSLATION',
            qId: missing[0].q.id,
            message: `${missing.length} ${missing.length === 1 ? 'question is' : 'questions are'} missing ${lang.toUpperCase()} translations (use Auto-Translate in Translations tab).`
          });
        }
      });
    }

    if (allQuestions.length > 0 && !hasOpenEnded) {
      issues.push({ severity: 'tip', code: 'NO_OPEN_ENDED', message: 'Consider adding 1 optional open-ended question to capture unexpected insights.' });
    }

    const errors = issues.filter((i) => i.severity === 'error').length;
    const warnings = issues.filter((i) => i.severity === 'warning').length;
    const estimatedMinutes = Math.max(1, Math.round(totalEstimatedSec / 60));

    return {
      ok: errors === 0,
      errors,
      warnings,
      tips: issues.filter((i) => i.severity === 'tip').length,
      estimatedMinutes,
      issues
    };
  },

  renderLogicFlowMap(survey) {
    const pages = Array.isArray(survey?.pages) ? survey.pages : [];
    const pageTitleById = Object.fromEntries(pages.map((p, idx) => [p.id, `Page ${idx + 1}: ${p.title || 'Section'}`]));
    const allQs = pages.flatMap((p) => p.questions || []);
    const qLabelById = {};
    allQs.forEach((q, idx) => { qLabelById[q.id] = `Q${idx + 1}`; });

    let totalRules = 0;
    pages.forEach((p) => {
      (p.questions || []).forEach((q) => {
        if (q.logic && q.logic.enabled && q.logic.target) totalRules++;
        if (q.displayRule && q.displayRule.enabled && q.displayRule.sourceQuestionId) totalRules++;
      });
    });

    return `
      <div class="bg-white border border-[#247B50]/40 rounded-[8px] p-4 space-y-3 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#EFEFEF]">
          <div class="flex items-center gap-2 text-xs">
            <span class="font-semibold text-[#111613]"><i class="fa-solid fa-diagram-project text-[#247B50] mr-1.5"></i>Survey Logic &amp; Branching Flow Map</span>
            <span class="px-2 py-0.5 rounded bg-[#F3FBF6] text-[#04250E] font-semibold tabular-nums">${pages.length} pages &middot; ${allQs.length} questions &middot; ${totalRules} ${totalRules === 1 ? 'rule' : 'rules'}</span>
          </div>
          <button type="button" onclick="window.AEBuilder.showLogicMap=false; window.AEApp.render();"
            class="w-7 h-7 rounded-full hover:bg-[#F4F6F4] text-[#525B56] flex items-center justify-center">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          ${pages.map((p, pIdx) => `
            <div class="p-3 rounded-[6px] border border-[#E4E7E4] bg-[#FAFBF9] space-y-2">
              <div class="font-semibold text-[#04250E] flex items-center justify-between">
                <span class="truncate">Page ${pIdx + 1}: ${AEApp.escapeHtml(p.title || 'Untitled')}</span>
                <span class="text-[10px] text-[#646E68] tabular-nums">${(p.questions || []).length} Qs</span>
              </div>
              <div class="space-y-1.5">
                ${(p.questions || []).map((q) => {
                  const hasSkip = Boolean(q.logic && q.logic.enabled && q.logic.target);
                  const hasDisp = Boolean(q.displayRule && q.displayRule.enabled && q.displayRule.sourceQuestionId);
                  const skipTargetLabel = hasSkip
                    ? (q.logic.target === 'END_SURVEY' || q.logic.target === 'end' || q.logic.target === 'submit'
                        ? 'End Survey'
                        : (pageTitleById[q.logic.target] || qLabelById[q.logic.target] || 'Missing Target!'))
                    : '';
                  const isBroken = skipTargetLabel === 'Missing Target!';
                  return `
                    <div class="p-2 rounded bg-white border ${isBroken ? 'border-[#C4242A]' : 'border-[#EFEFEF]'} space-y-1">
                      <button type="button" onclick="AEBuilder.scrollToQuestion('${AEApp.escapeJs(q.id)}')" class="text-left w-full flex items-center gap-1.5 hover:text-[#247B50]">
                        <span class="font-semibold text-[#247B50] shrink-0">${qLabelById[q.id]}</span>
                        <span class="truncate text-[#111613]">${AEApp.escapeHtml((q.title || 'Untitled').slice(0, 42))}</span>
                      </button>
                      ${hasDisp ? `<div class="text-[10.5px] text-[#0369A1] bg-[#F0F9FF] px-1.5 py-0.5 rounded">&#8627; Shown when ${AEApp.escapeHtml(qLabelById[q.displayRule.sourceQuestionId] || 'Q')} ${q.displayRule.mode === 'equals' ? `= "${AEApp.escapeHtml(q.displayRule.value || '')}"` : 'is answered'}</div>` : ''}
                      ${hasSkip ? `<div class="text-[10.5px] ${isBroken ? 'text-[#831C1E] bg-[#FEE2E2]' : 'text-[#04250E] bg-[#DCFAE5]'} px-1.5 py-0.5 rounded">&#8594; If "${AEApp.escapeHtml(q.logic.value || '*')}" jump to <strong>${AEApp.escapeHtml(skipTargetLabel)}</strong></div>` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  renderPreFlightPanel(survey, audit) {
    if (!this.showPreFlightPanel || !audit) return '';
    return `
      <div class="bg-white border ${audit.errors > 0 ? 'border-[#C4242A]/50' : 'border-[#247B50]/40'} rounded-[8px] p-4 space-y-3 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#EFEFEF]">
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <span class="font-semibold text-[#111613]">
              <i class="fa-solid ${audit.errors > 0 ? 'fa-triangle-exclamation text-[#C4242A]' : 'fa-circle-check text-[#247B50]'} mr-1.5"></i>
              Pre-Flight Survey Check
            </span>
            <span class="px-2 py-0.5 rounded-[4px] ${audit.errors > 0 ? 'bg-[#FEE2E2] text-[#831C1E]' : 'bg-[#DCFAE5] text-[#04250E]'} text-[11px] font-semibold tabular-nums">
              ${audit.errors} errors &middot; ${audit.warnings} warnings
            </span>
            <span class="text-[11px] text-[#646E68] tabular-nums">Est. completion: ~${audit.estimatedMinutes} min</span>
          </div>
          <button type="button" onclick="window.AEBuilder.showPreFlightPanel=false; window.AEApp.render();"
            class="w-7 h-7 rounded-full hover:bg-[#F4F6F4] text-[#525B56] flex items-center justify-center">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        ${
          audit.issues.length === 0
            ? `<div class="p-3 rounded-[6px] bg-[#F3FBF6] text-xs text-[#04250E] font-medium">All checks passed! Your survey is ready for field deployment.</div>`
            : `<ul class="space-y-1.5 text-xs">
                ${audit.issues
                  .map((iss) => {
                    const badge = iss.severity === 'error'
                      ? 'bg-[#FEE2E2] text-[#831C1E]'
                      : iss.severity === 'warning'
                      ? 'bg-[#FFFBEB] text-[#92400E]'
                      : 'bg-[#F4F6F4] text-[#525B56]';
                    return `
                      <li class="flex items-center justify-between gap-2 p-2 rounded-[5px] bg-[#FAFBF9] border border-[#EFEFEF]">
                        <div class="flex items-center gap-2 min-w-0">
                          <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase shrink-0 ${badge}">${iss.severity}</span>
                          <span class="text-[#111613] ae-break-words">${AEApp.escapeHtml(iss.message)}</span>
                        </div>
                        ${
                          iss.qId
                            ? `<button type="button" onclick="window.AEBuilder.scrollToQuestion('${AEApp.escapeJs(iss.qId)}')"
                                class="h-6 px-2 rounded border border-[#CFD5D0] bg-white hover:bg-[#141A17] hover:text-white text-[11px] font-medium shrink-0 ae-press">
                                Jump
                              </button>`
                            : ''
                        }
                      </li>
                    `;
                  })
                  .join('')}
              </ul>`
        }
      </div>
    `;
  },

  handleQuestionDragStart(e, qId) {
    if (e && e.target && /^(INPUT|TEXTAREA|SELECT|OPTION)$/i.test(e.target.tagName || '')) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      return;
    }
    this._draggedQuestionId = qId;
    if (e && e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      try {
        e.dataTransfer.setData('text/plain', String(qId));
      } catch (_) {}
    }
    const card = typeof document !== 'undefined' ? document.getElementById(`builder_q_${qId}`) : null;
    if (card) card.classList.add('opacity-50');
  },

  handleQuestionDragOver(e, qId) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (e && e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    if (!this._draggedQuestionId || this._draggedQuestionId === qId) return;
    const card = typeof document !== 'undefined' ? document.getElementById(`builder_q_${qId}`) : null;
    if (card) {
      card.classList.add('ring-2', 'ring-[#247B50]');
    }
  },

  handleQuestionDragLeave(e, qId) {
    if (e && e.currentTarget && e.relatedTarget && typeof e.currentTarget.contains === 'function' && e.currentTarget.contains(e.relatedTarget)) {
      return;
    }
    const card = typeof document !== 'undefined' ? document.getElementById(`builder_q_${qId}`) : null;
    if (card) {
      card.classList.remove('ring-2', 'ring-[#247B50]');
    }
  },

  handleQuestionDrop(e, targetQId) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const card = typeof document !== 'undefined' ? document.getElementById(`builder_q_${targetQId}`) : null;
    if (card) {
      card.classList.remove('ring-2', 'ring-[#247B50]');
    }
    const draggedQId =
      this._draggedQuestionId ||
      (e && e.dataTransfer && typeof e.dataTransfer.getData === 'function' ? e.dataTransfer.getData('text/plain') : null);
    this._draggedQuestionId = null;
    if (draggedQId && targetQId && draggedQId !== targetQId && window.AEApp && typeof window.AEApp.reorderQuestionBlock === 'function') {
      window.AEApp.reorderQuestionBlock(draggedQId, targetQId);
    }
  },

  handleQuestionDragEnd(e) {
    this._draggedQuestionId = null;
    if (typeof document !== 'undefined') {
      document.querySelectorAll('[id^="builder_q_"]').forEach((el) => {
        el.classList.remove('opacity-50', 'ring-2', 'ring-[#247B50]');
      });
    }
  },

  scrollToQuestion(qId) {
    if (typeof document === 'undefined' || !qId) return;
    const el = document.getElementById(`builder_q_${qId}`);
    if (!el) return;
    if (typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    el.classList.add('ring-2', 'ring-[#247B50]');
    setTimeout(() => {
      el.classList.remove('ring-2', 'ring-[#247B50]');
    }, 1200);
  },

  createDefaultQuestion(type) {
    const id = 'q_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5);
    const base = {
      id,
      type,
      title: 'Untitled Question',
      helpText: '',
      required: true,
      logic: { enabled: false, condition: 'equals', value: '', target: '' }
    };

    switch (type) {
      case 'multiple_choice':
        return {
          ...base,
          title: 'Please select your primary preference or classification:',
          helpText: 'Select one option.',
          options: ['Primary Option A', 'Secondary Option B', 'Alternative Option C', 'Other / None of the above']
        };
      case 'checkboxes':
        return {
          ...base,
          title: 'Which of the following factors or criteria apply to this record?',
          helpText: 'Select all applicable options.',
          options: ['Condition / Practice 1', 'Condition / Practice 2', 'Condition / Practice 3', 'Verified Standard Compliant']
        };
      case 'dropdown':
        return {
          ...base,
          title: 'Select Region / Administrative Jurisdiction:',
          helpText: 'Choose from the dropdown list.',
          options: ['Region / County A', 'Region / County B', 'Region / County C', 'Region / County D']
        };
      case 'cascading_dropdown':
        return {
          ...base,
          title: 'Hierarchical Classification (Primary -> Secondary -> Detailed Unit):',
          helpText: 'Select levels sequentially. Child choices update dynamically.',
          levels: ['Primary Tier', 'Secondary Tier', 'Specific Unit'],
          hierarchyData: [
            { parent: 'Sector Alpha', child: 'District 1', subchild: 'Unit 101' },
            { parent: 'Sector Alpha', child: 'District 1', subchild: 'Unit 102' },
            { parent: 'Sector Alpha', child: 'District 2', subchild: 'Unit 201' },
            { parent: 'Sector Beta', child: 'District 3', subchild: 'Unit 301' },
            { parent: 'Sector Beta', child: 'District 3', subchild: 'Unit 302' }
          ]
        };
      case 'star_rating':
        return {
          ...base,
          title: 'How would you rate the overall quality or effectiveness?',
          helpText: '1 star = Unsatisfactory, 5 stars = Outstanding',
          maxStars: 5
        };
      case 'nps':
        return {
          ...base,
          title: 'On a scale of 0 to 10, how likely are you to recommend this program or product to a colleague?',
          helpText: '0 = Not at all likely, 10 = Extremely likely'
        };
      case 'matrix':
        return {
          ...base,
          title: 'Please evaluate each dimension on the performance scale:',
          helpText: 'Select one rating per evaluation row.',
          rows: ['Operational Reliability', 'Response Speed & Timeliness', 'Quality of Execution', 'Overall Value & Impact'],
          columns: ['Poor', 'Fair', 'Good', 'Excellent']
        };
      case 'number_yield':
        return {
          ...base,
          title: 'Recorded Numerical Metric / Quantitative Output',
          helpText: 'Enter positive numeric figure.',
          unit: 'units',
          min: 0,
          max: 100000
        };
      case 'calculated':
        return {
          ...base,
          title: 'Calculated Metric (Auto-Computed)',
          helpText: 'Automatically computed from earlier numeric responses.',
          required: false,
          formula: '',
          unit: 'units',
          decimals: 2
        };
      case 'gps_location':
        return {
          ...base,
          title: 'Record Geographic Coordinates (GPS Plot Fix)',
          helpText: 'Tap "Capture GPS" to acquire a satellite-verified coordinate lock.',
          required: false
        };
      case 'signature':
        return {
          ...base,
          title: 'Respondent / Auditor Verification Signature',
          helpText: 'Sign with finger or stylus on the canvas to authenticate this submission.',
          required: false
        };
      case 'photo_proof':
        return {
          ...base,
          title: 'Photo Verification / Visual Field Documentation',
          helpText: 'Snap or upload a clear photo proof. Images are compressed automatically for offline storage.',
          required: false,
          maxDimension: 1024,
          maxKb: 150
        };
      case 'barcode_scanner':
        return {
          ...base,
          title: 'Scan Barcode, QR Code, or Serial Identifier',
          helpText: 'Position camera viewfinder over the code or enter serial number manually.',
          verificationPattern: '^[A-Z0-9-]{4,32}$',
          allowManualEntry: true
        };
      case 'audio_note':
        return {
          ...base,
          title: 'Voice Testimony / Audio Qualitative Memo',
          helpText: 'Record a spoken testimonial or qualitative field observation using the microphone.',
          required: false,
          maxDurationSec: 300
        };
      case 'repeat_group':
        return {
          ...base,
          title: 'Multi-Item Roster / Tabular Records',
          helpText: 'Add a sub-record for each individual item, lot, or person.',
          required: false,
          addButtonLabel: '+ Add Sub-Record Row',
          fields: [
            { id: 'item_name', label: 'Item Name / Description', type: 'text', placeholder: 'e.g. Item Code or Name' },
            { id: 'item_qty', label: 'Quantity / Units', type: 'number', placeholder: 'e.g. 10' },
            { id: 'item_cost', label: 'Unit Cost / Rate', type: 'number', placeholder: 'e.g. 50' },
            { id: 'item_notes', label: 'Status / Notes', type: 'text', placeholder: 'e.g. Verified In-Stock' }
          ]
        };
      case 'date_time':
        return {
          ...base,
          title: 'Date of Activity / Inspection Event',
          helpText: 'Select calendar date.',
          required: false
        };
      case 'short_text':
        return {
          ...base,
          title: 'Respondent Name, Identifier, or Short Field',
          helpText: 'Enter brief text response.',
          required: false,
          placeholder: 'Enter text here…'
        };
      case 'long_text':
        return {
          ...base,
          title: 'Detailed Observations, Comments, or Open Feedback',
          helpText: 'Record extended observations, explanations, or qualitative insights.',
          required: false,
          placeholder: 'Type detailed observations or feedback here…'
        };
      default:
        return base;
    }
  },

  renderBuilder(survey) {
    if (!survey) return '<div class="p-8 text-center">No survey selected.</div>';
    if (!Array.isArray(survey.pages) || survey.pages.length === 0) {
      survey.pages = [{ id: 'page_1', title: 'Page 1', description: '', questions: [] }];
    }
    if (this.activePageIndex >= survey.pages.length) {
      this.activePageIndex = 0;
    }

    const totalQuestions = window.aeStore.getQuestionsForSurvey(survey).length;
    const currentPage = survey.pages[this.activePageIndex];
    const allSurveys = window.aeStore.surveys || [];
    const schemaVer = Number(survey.schemaVersion || 1);
    const historyCount = Array.isArray(survey.versionHistory) ? survey.versionHistory.length : 0;
    const existingResponseCount = window.aeStore && typeof window.aeStore.getResponsesForSurvey === 'function'
      ? window.aeStore.getResponsesForSurvey(survey.id).length
      : 0;
    const preFlightAudit = this.runPreFlightAudit(survey);

    return `
      <div class="space-y-5">
        <!-- 1. Builder Stage Header Row (Screen-Fit & Aligned with Overview) -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#EFEFEF]">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2.5">
              <h1 class="text-[24px] font-semibold text-[#111613] tracking-tight leading-tight">Survey Builder</h1>
              <span class="inline-flex items-center gap-1.5 text-xs text-[#525B56]">
                <span class="w-1.5 h-1.5 rounded-full bg-[#247B50]"></span>
                <span>Saved automatically</span>
              </span>
              ${
                existingResponseCount > 0
                  ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-[11px] font-medium tabular-nums" title="Destructive edits are guarded and option renames automatically unify existing answers">
                      <i class="fa-solid fa-shield-halved text-[10px]"></i> Live guard &middot; ${existingResponseCount} ${existingResponseCount === 1 ? 'response' : 'responses'}
                    </span>`
                  : ''
              }
            </div>
            <p class="text-sm text-[#525B56] mt-1">
              Build multi-page surveys with branching rules, translations, and offline field controls.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <!-- Pre-Flight Quality Linter -->
            <button onclick="window.AEBuilder.showPreFlightPanel = !window.AEBuilder.showPreFlightPanel; window.AEApp.render();"
              title="Audit survey logic, translations, and options before publishing"
              class="h-8 px-2.5 rounded-[6px] border ${
                preFlightAudit.errors > 0
                  ? 'border-[#C4242A]/50 bg-[#FFF7F6] text-[#831C1E]'
                  : 'border-[#247B50]/35 bg-[#F3FBF6] text-[#04250E]'
              } text-xs font-semibold inline-flex items-center gap-1.5 ae-press tabular-nums">
              <i class="fa-solid ${preFlightAudit.errors > 0 ? 'fa-triangle-exclamation text-[#C4242A]' : 'fa-clipboard-check text-[#247B50]'}"></i>
              Pre-Flight${preFlightAudit.errors + preFlightAudit.warnings > 0 ? ` (${preFlightAudit.errors + preFlightAudit.warnings})` : ' ✓'}
            </button>

            <!-- Version History -->
            <button onclick="AEApp.openVersionHistoryModal()"
              title="Inspect or restore previous survey versions"
              class="h-8 px-2.5 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#111613] inline-flex items-center gap-1.5 ae-press tabular-nums">
              <i class="fa-solid fa-clock-rotate-left text-[#247B50]"></i> v${schemaVer}${historyCount > 0 ? ` (${historyCount})` : ''}
            </button>

            <!-- Assign Field Team -->
            <button onclick="AEApp.openAssignTeamModal('${survey.id}')"
              class="h-8 px-3 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#111613] inline-flex items-center gap-1.5 ae-press">
              <i class="fa-solid fa-users-gear text-[#247B50]"></i> Assign Team
            </button>

            <!-- Live Device Simulator Toggle -->
            <button onclick="window.AEBuilder.previewMode = !window.AEBuilder.previewMode; window.AEApp.render();"
              class="h-8 px-3 rounded-[6px] border ${
                this.previewMode ? 'bg-[#141A17] text-white border-[#141A17]' : 'border-[#CFD5D0] bg-white text-[#111613]'
              } text-xs font-semibold inline-flex items-center gap-1.5 ae-press">
              <i class="fa-solid ${this.previewMode ? 'fa-pen-to-square text-[#3FC07A]' : 'fa-mobile-screen text-[#247B50]'}"></i>
              ${this.previewMode ? 'Editor Canvas' : 'Live Simulator'}
            </button>

            <!-- Visual Logic & Branching Map -->
            <button onclick="window.AEBuilder.showLogicMap = !window.AEBuilder.showLogicMap; window.AEApp.render();"
              title="Visualize survey pages, conditional sub-questions, and skip-logic jumps"
              class="h-8 px-2.5 rounded-[6px] border ${this.showLogicMap ? 'bg-[#141A17] text-white border-[#141A17]' : 'border-[#CFD5D0] bg-white text-[#111613] hover:bg-[#F4F6F4]'} text-xs font-medium inline-flex items-center gap-1.5 ae-press">
              <i class="fa-solid fa-diagram-project ${this.showLogicMap ? 'text-[#3FC07A]' : 'text-[#247B50]'}"></i> Logic Map
            </button>

            <!-- Print Blank Paper Form -->
            <button onclick="AEReportExport.exportBlankFormPDF('${AEApp.escapeJs(survey.id)}')"
              title="Export print-ready A4 blank paper questionnaire for client sign-off or offline backup"
              class="h-8 px-2.5 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#111613] inline-flex items-center gap-1.5 ae-press">
              <i class="fa-solid fa-print text-[#247B50]"></i> Blank Form
            </button>

            <!-- Preview & Kiosk -->
            <button onclick="AEApp.switchStage('collect', '${survey.id}')"
              class="h-8 px-3 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#111613] inline-flex items-center gap-1.5 ae-press">
              <i class="fa-solid fa-tablet-screen-button text-[#247B50]"></i> Preview &amp; Kiosk
            </button>

            <!-- Save & Sync -->
            <button onclick="AEApp.saveAndSyncSurvey()"
              class="h-8 px-3.5 rounded-[6px] text-xs font-semibold bg-[#141A17] text-white hover:bg-[#232C27] inline-flex items-center gap-1.5 ae-press">
              <i class="fa-solid fa-cloud-arrow-up text-xs"></i> Save &amp; Sync
            </button>
          </div>
        </div>

        <!-- 1a. Pre-Flight Quality Linter Drawer (when toggled) -->
        ${this.renderPreFlightPanel(survey, preFlightAudit)}

        <!-- 1a2. Visual Survey Logic & Branching Map (when toggled) -->
        ${this.showLogicMap ? this.renderLogicFlowMap(survey) : ''}

        <!-- 1b. Active Instrument & Access Control Bar (Matching Overview Scope Bar) -->
        <div class="bg-white p-3 rounded-[8px] border border-[#E4E7E4] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div class="flex flex-wrap sm:flex-nowrap items-center gap-2.5 min-w-0 flex-1">
            <span class="w-2 h-2 rounded-full bg-[#247B50] shrink-0"></span>
            <label for="ae_builder_active_survey_select" class="text-xs font-semibold text-[#111613] whitespace-nowrap shrink-0">Active Survey</label>
            <select id="ae_builder_active_survey_select"
              onchange="AEApp.switchStage('design', this.value)"
              aria-label="Select Survey to Edit"
              class="h-8 text-xs font-semibold bg-[#F8F9F8] hover:bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613] focus:outline-none focus:border-[#247B50] w-full sm:w-auto min-w-0 sm:max-w-[440px] truncate">
              ${allSurveys
                .map(
                  (s) =>
                    `<option value="${s.id}" ${s.id === survey.id ? 'selected' : ''}>${AEApp.escapeHtml(
                      s.title.substring(0, 48)
                    )}${s.title.length > 48 ? '…' : ''}</option>`
                )
                .join('')}
            </select>
          </div>

          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <!-- Status Dropdown -->
            <select onchange="AEApp.updateSurveyMeta('status', this.value)"
              aria-label="Survey Status"
              class="h-8 text-xs font-medium bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613] focus:outline-none focus:border-[#247B50] max-w-[180px] truncate">
              <option value="Active" ${survey.status === 'Active' ? 'selected' : ''}>Status: Active</option>
              <option value="Draft" ${survey.status === 'Draft' ? 'selected' : ''}>Status: Draft</option>
              <option value="Closed" ${survey.status === 'Closed' ? 'selected' : ''}>Status: Closed</option>
              <option value="Archived" ${survey.status === 'Archived' ? 'selected' : ''}>Status: Archived</option>
            </select>

            <!-- Collection Mode Dropdown (Self-Administered vs Enumerator) -->
            <select onchange="AEApp.updateSurveyMeta('collectionMode', this.value)"
              aria-label="Collection Mode"
              class="h-8 text-xs font-medium bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613] focus:outline-none focus:border-[#247B50] max-w-[240px] truncate">
              <option value="hybrid" ${(survey.collectionMode || 'hybrid') === 'hybrid' ? 'selected' : ''}>Mode: Hybrid (Team + Public Link)</option>
              <option value="self_administered" ${survey.collectionMode === 'self_administered' ? 'selected' : ''}>Mode: Self-Administered (Public Link)</option>
              <option value="enumerator" ${survey.collectionMode === 'enumerator' ? 'selected' : ''}>Mode: Enumerator-Assisted Only</option>
            </select>
          </div>
        </div>

        ${
          this.previewMode
            ? this.renderLiveSimulator(survey)
            : `
        <!-- 2. Divided 4-Cell Metadata Strip (Matching Overview KPI Architecture) -->
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] overflow-hidden">
          <div class="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EFEFEF]">
            <div class="p-4 min-w-0">
              <span class="text-xs font-medium text-[#525B56] block">Active survey</span>
              <div class="mt-1 min-w-0">
                <strong class="text-sm font-semibold text-[#111613] block truncate" title="${AEApp.escapeAttr(survey.title)}">${AEApp.escapeHtml(survey.title)}</strong>
                <span class="text-xs text-[#247B50] font-medium block truncate">${AEApp.escapeHtml(survey.category || 'Field Survey')}</span>
              </div>
            </div>
            <div class="p-4 min-w-0">
              <span class="text-xs font-medium text-[#525B56] block">Structure</span>
              <div class="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <strong class="text-[24px] font-semibold text-[#111613] tabular-nums leading-none">${totalQuestions}</strong>
                <span class="text-xs text-[#525B56]">questions across ${survey.pages.length} ${survey.pages.length === 1 ? 'page' : 'pages'}</span>
              </div>
            </div>
            <div class="p-4 min-w-0">
              <span class="text-xs font-medium text-[#525B56] block">Status</span>
              <div class="mt-1 flex flex-wrap items-center gap-2">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-xs font-semibold ${
                  survey.status === 'Active'
                    ? 'bg-[#DCFAE5] text-[#04250E]'
                    : survey.status === 'Draft'
                    ? 'bg-[#FFFBEB] text-[#92400E]'
                    : survey.status === 'Archived'
                    ? 'bg-[#F4F6F4] text-[#646E68] border border-[#CFD5D0]'
                    : 'bg-[#EAECE9] text-[#525B56]'
                }">
                  ${AEApp.escapeHtml(survey.status)}
                </span>
                <span class="text-xs text-[#525B56] tabular-nums">v${survey.version || 1}</span>
              </div>
            </div>
            <div class="p-4 min-w-0">
              <span class="text-xs font-medium text-[#525B56] block">Local backup</span>
              <div class="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <strong class="text-xs font-semibold text-[#247B50] flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#247B50]"></span> Saved on device
                </strong>
                <span class="text-xs text-[#525B56]">Ready to sync</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Builder Main Workspace Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <!-- LEFT SIDEBAR: Question Bank & Theme -->
          <aside class="lg:col-span-4 xl:col-span-3 bg-white border border-[#E4E7E4] rounded-[8px] lg:sticky lg:top-16 overflow-hidden">
            <div class="grid grid-cols-4 border-b border-[#EFEFEF] bg-[#F8F9F8]">
              <button onclick="AEApp.setBuilderLeftTab('questions')"
                class="h-10 px-1 text-[11px] font-medium flex items-center justify-center gap-1 border-b-2 transition-colors ${
                  this.leftTab === 'questions'
                    ? 'border-[#247B50] text-[#111613] font-semibold bg-white'
                    : 'border-transparent text-[#525B56] hover:text-[#111613]'
                }">
                <i class="fa-solid fa-plus text-[#247B50]"></i> Add
              </button>
              <button onclick="AEApp.setBuilderLeftTab('library')"
                class="h-10 px-1 text-[11px] font-medium flex items-center justify-center gap-1 border-b-2 transition-colors ${
                  this.leftTab === 'library'
                    ? 'border-[#247B50] text-[#111613] font-semibold bg-white'
                    : 'border-transparent text-[#525B56] hover:text-[#111613]'
                }">
                <i class="fa-solid fa-bookmark text-[#247B50]"></i> Library
              </button>
              <button onclick="AEApp.setBuilderLeftTab('translations')"
                class="h-10 px-1 text-[11px] font-medium flex items-center justify-center gap-1 border-b-2 transition-colors ${
                  this.leftTab === 'translations'
                    ? 'border-[#247B50] text-[#111613] font-semibold bg-white'
                    : 'border-transparent text-[#525B56] hover:text-[#111613]'
                }">
                <i class="fa-solid fa-language text-[#247B50]"></i> Lang
              </button>
              <button onclick="AEApp.setBuilderLeftTab('theme')"
                class="h-10 px-1 text-[11px] font-medium flex items-center justify-center gap-1 border-b-2 transition-colors ${
                  this.leftTab === 'theme'
                    ? 'border-[#247B50] text-[#111613] font-semibold bg-white'
                    : 'border-transparent text-[#525B56] hover:text-[#111613]'
                }">
                <i class="fa-solid fa-sliders text-[#525B56]"></i> Theme
              </button>
            </div>

            ${
              this.leftTab === 'questions'
                ? this.renderQuestionBankSidebar(survey)
                : this.leftTab === 'library'
                ? this.renderLibrarySidebar(survey)
                : this.leftTab === 'translations'
                ? this.renderTranslationsSidebar(survey)
                : this.renderThemeSidebar(survey)
            }
          </aside>

          <!-- CENTER / RIGHT: Survey Header, Page Tabs & Interactive Question Canvas -->
          <section class="lg:col-span-8 xl:col-span-9 space-y-5">
            <!-- Survey Title & Header Editor -->
            <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-5">
              <div>
                <div class="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <span class="text-xs font-semibold text-[#247B50] flex items-center gap-1.5">
                    <i class="fa-solid fa-pen-to-square text-[11px]"></i> Survey Title &amp; Field Instructions
                  </span>
                  <span class="text-[11px] text-[#525B56]">Visible to enumerators in Field App</span>
                </div>
                <input type="text"
                  id="ae_builder_survey_title"
                  maxlength="160"
                  value="${AEApp.escapeAttr(survey.title)}"
                  aria-label="Survey Title"
                  onchange="AEApp.updateSurveyMeta('title', this.value)"
                  class="w-full text-[20px] sm:text-[22px] font-semibold tracking-tight text-[#111613] bg-white border border-[#CFD5D0] rounded-[6px] px-3.5 py-2 hover:border-[#247B50] focus:border-[#247B50] focus:outline-none transition-colors"
                  placeholder="Survey title…" />
                <textarea
                  id="ae_builder_survey_desc"
                  rows="2"
                  maxlength="300"
                  aria-label="Survey Description"
                  onchange="AEApp.updateSurveyMeta('description', this.value)"
                  class="w-full text-xs text-[#525B56] bg-white border border-[#CFD5D0] rounded-[6px] px-3.5 py-2 hover:border-[#247B50] focus:border-[#247B50] focus:outline-none mt-2 transition-colors resize-none"
                  placeholder="Add survey instructions or enumerator briefing notes…">${AEApp.escapeHtml(survey.description || '')}</textarea>
              </div>

            <!-- Multi-Page Section Tabs -->
            <div class="mt-4 pt-3.5 border-t border-[#EFEFEF] flex flex-wrap items-center justify-between gap-3">
              <div class="flex flex-wrap items-center gap-1.5">
                ${survey.pages
                  .map(
                    (p, idx) => `
                  <button onclick="AEApp.selectBuilderPage(${idx})"
                    class="h-8 inline-flex items-center gap-2 px-3 rounded-[6px] text-xs font-medium transition-colors ${
                      idx === this.activePageIndex
                        ? 'bg-[#141A17] text-white font-semibold'
                        : 'bg-[#F8F9F8] text-[#525B56] hover:text-[#111613] border border-[#E4E7E4]'
                    }">
                    <span>Page ${idx + 1}: ${AEApp.escapeHtml(p.title.substring(0, 26))}${p.title.length > 26 ? '…' : ''}</span>
                    <span class="px-1.5 py-0.5 rounded-[4px] ${
                      idx === this.activePageIndex ? 'bg-white/15 text-white' : 'bg-[#EAECE9] text-[#111613]'
                    } text-[11px] tabular-nums">${(p.questions || []).length}</span>
                  </button>
                `
                  )
                  .join('')}
                <button onclick="AEApp.addSurveyPage()"
                  class="h-8 inline-flex items-center gap-1.5 px-3 rounded-[6px] text-xs font-medium text-[#247B50] bg-[#DCFAE5]/60 hover:bg-[#DCFAE5] transition-colors">
                  <i class="fa-solid fa-plus text-[10px]"></i> Add Page Break
                </button>
              </div>

              ${
                survey.pages.length > 1
                  ? `<button onclick="AEApp.deleteSurveyPage(${this.activePageIndex})"
                      class="text-xs text-[#C4242A] hover:underline font-medium inline-flex items-center gap-1">
                      <i class="fa-regular fa-trash-can"></i> Delete Page ${this.activePageIndex + 1}
                    </button>`
                  : ''
              }
            </div>
          </div>

          <!-- Active Page Header Card -->
          <div class="bg-[#F8F9F8] border border-[#E4E7E4] rounded-[8px] p-4">
            <div class="flex items-center justify-between gap-4 mb-1.5">
              <label for="ae_builder_page_title" class="text-xs font-medium text-[#247B50]">Page ${this.activePageIndex + 1} of ${survey.pages.length} section header</label>
              <span class="text-xs text-[#646E68] tabular-nums">${(currentPage.questions || []).length} ${(currentPage.questions || []).length === 1 ? 'question' : 'questions'} on this page</span>
            </div>
            <input type="text"
              id="ae_builder_page_title"
              maxlength="140"
              value="${AEApp.escapeAttr(currentPage.title)}"
              onchange="AEApp.updatePageMeta(${this.activePageIndex}, 'title', this.value)"
              class="w-full bg-white text-base font-semibold text-[#111613] border border-[#CFD5D0] focus:border-[#247B50] rounded-[6px] px-3 py-1.5 focus:outline-none"
              placeholder="Section title…" />
            <input type="text"
              id="ae_builder_page_desc"
              maxlength="240"
              aria-label="Section instructions"
              value="${AEApp.escapeAttr(currentPage.description || '')}"
              onchange="AEApp.updatePageMeta(${this.activePageIndex}, 'description', this.value)"
              class="w-full bg-transparent text-xs text-[#525B56] border-b border-transparent focus:border-[#247B50] focus:outline-none mt-2 pb-1 px-1"
              placeholder="Section instructions shown to respondent or enumerator…" />
          </div>

          <!-- Quick Outline Navigator (shown when active page has 3+ questions) -->
          ${(() => {
            const pageQuestions = currentPage.questions || [];
            if (pageQuestions.length < 3) return '';
            const outlineNumMap = window.AEPiping && typeof window.AEPiping.computeQuestionDisplayNumbers === 'function'
              ? window.AEPiping.computeQuestionDisplayNumbers(pageQuestions)
              : {};
            return `
          <div class="bg-white border border-[#E4E7E4] rounded-[8px] px-3.5 py-2.5 flex items-center gap-2 overflow-x-auto" aria-label="Quick Outline Navigator">
            <span class="text-[11px] font-semibold text-[#525B56] shrink-0 inline-flex items-center gap-1.5 pr-2 border-r border-[#EFEFEF]">
              <i class="fa-solid fa-list-ol text-[#247B50]"></i> Outline
            </span>
            <div class="flex items-center gap-1.5 flex-nowrap">
              ${pageQuestions
                .map((q, idx) => {
                  const nInfo = (outlineNumMap && outlineNumMap[q.id]) || { label: String(idx + 1), isSub: false };
                  const rawTitle = String(q.title || 'Untitled Question').trim();
                  const shortTitle = rawTitle.length > 22 ? rawTitle.substring(0, 22) + '…' : rawTitle;
                  return `
                <button type="button"
                  onclick="AEBuilder.scrollToQuestion('${q.id}')"
                  title="Q${AEApp.escapeAttr(nInfo.label)}: ${AEApp.escapeAttr(rawTitle)}"
                  class="h-7 px-2.5 rounded-[5px] border text-[11px] font-medium inline-flex items-center gap-1.5 shrink-0 transition-colors ae-press ${
                    q.parentQuestionId
                      ? 'bg-[#DCFAE5]/50 border-[#247B50]/30 text-[#04250E] hover:bg-[#DCFAE5]'
                      : 'bg-[#F8F9F8] border-[#E4E7E4] text-[#111613] hover:bg-[#DCFAE5]/40 hover:border-[#247B50]'
                  }">
                  <span class="font-semibold tabular-nums ${q.parentQuestionId ? 'text-[#247B50]' : 'text-[#141A17]'}">Q${AEApp.escapeHtml(nInfo.label)}</span>
                  <span class="text-[#525B56] max-w-[120px] truncate hidden sm:inline">${AEApp.escapeHtml(shortTitle)}</span>
                </button>`;
                })
                .join('')}
            </div>
          </div>`;
          })()}

          <!-- Questions List on Active Page -->
          <div class="space-y-4">
            ${
              (currentPage.questions || []).length === 0
                ? `<div class="bg-white border border-dashed border-[#CFD5D0] rounded-[10px] p-10 text-center">
                    <h3 class="text-sm font-semibold text-[#111613]">Page ${this.activePageIndex + 1} is empty</h3>
                    <p class="text-xs text-[#525B56] mt-1.5 max-w-sm mx-auto leading-relaxed">Pick any question type from the panel on the left to add your first question to this page.</p>
                  </div>`
                : (() => {
                    const qNumMap = window.AEPiping && typeof window.AEPiping.computeQuestionDisplayNumbers === 'function'
                      ? window.AEPiping.computeQuestionDisplayNumbers(currentPage.questions || [])
                      : {};
                    return (currentPage.questions || [])
                      .map((q, qIdx) => this.renderQuestionEditorCard(survey, currentPage, q, qIdx, qNumMap))
                      .join('');
                  })()
            }
          </div>

          <!-- Inline End Screen / Thank-You Note Card (directly on canvas) -->
          ${(() => {
            const branding = survey.branding || {};
            const cw = survey.completionWorkflow || {};
            return `
              <div class="bg-[#F8FBF9] border border-[#247B50]/30 rounded-[8px] p-5 space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#247B50]/15">
                  <div class="flex items-center gap-2">
                    <span class="w-7 h-7 rounded-[6px] bg-[#DCFAE5] text-[#247B50] flex items-center justify-center text-xs shrink-0">
                      <i class="fa-solid fa-circle-check"></i>
                    </span>
                    <div>
                      <div class="text-xs font-semibold text-[#04250E]">Survey Closing &amp; Thank-You Screen</div>
                      <div class="text-[11px] text-[#525B56]">Shown automatically to respondents after they submit the final page.</div>
                    </div>
                  </div>
                  <span class="px-2 py-0.5 rounded-[4px] bg-white border border-[#247B50]/25 text-[10.5px] font-medium text-[#247B50]">End Screen</span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label for="ae_canvas_ty_title" class="block text-[11px] font-medium text-[#525B56] mb-1">Thank-You Title</label>
                    <input id="ae_canvas_ty_title" type="text" maxlength="120"
                      value="${AEApp.escapeAttr(branding.thankYouTitle || '')}"
                      onchange="AEApp.updateSurveyBranding('thankYouTitle', this.value)"
                      placeholder="e.g. Asante! Thank you for your feedback"
                      class="w-full h-8 px-2.5 bg-white border border-[#CFD5D0] rounded-[6px] text-xs text-[#111613] focus:outline-none focus:border-[#247B50]" />
                  </div>
                  <div>
                    <label for="ae_canvas_ty_redirect" class="block text-[11px] font-medium text-[#525B56] mb-1">Optional Redirect URL (https://)</label>
                    <input id="ae_canvas_ty_redirect" type="url" maxlength="300"
                      value="${AEApp.escapeAttr(branding.redirectUrl || '')}"
                      onchange="AEApp.updateSurveyBranding('redirectUrl', this.value)"
                      placeholder="https://example.org/thank-you"
                      class="w-full h-8 px-2.5 bg-white border border-[#CFD5D0] rounded-[6px] text-xs text-[#111613] focus:outline-none focus:border-[#247B50]" />
                  </div>
                </div>
                <div>
                  <label for="ae_canvas_ty_msg" class="block text-[11px] font-medium text-[#525B56] mb-1">Closing / Thank-You Message</label>
                  <textarea id="ae_canvas_ty_msg" rows="2" maxlength="400"
                    onchange="AEApp.updateSurveyBranding('thankYouMessage', this.value)"
                    placeholder="Write the thank-you note or next steps respondents see upon completion…"
                    class="w-full px-2.5 py-1.5 bg-white border border-[#CFD5D0] rounded-[6px] text-xs text-[#111613] focus:outline-none focus:border-[#247B50] resize-none">${AEApp.escapeHtml(branding.thankYouMessage || '')}</textarea>
                </div>
                <div class="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                  <label class="inline-flex items-center gap-2 text-[#111613] font-medium cursor-pointer">
                    <input type="checkbox" ${cw.autoRedirect ? 'checked' : ''}
                      onchange="AEApp.updateSurveyCompletionWorkflow('autoRedirect', this.checked)"
                      class="accent-[#247B50] w-3.5 h-3.5 rounded" />
                    <span>Auto-redirect after 3s (when Redirect URL is set)</span>
                  </label>
                  <span class="text-[#646E68]">Need conditional messages or webhooks? Open the <strong>Theme</strong> sidebar tab.</span>
                </div>
              </div>
            `;
          })()}
        </section>
      </div>
      `
        }
      </div>
    `;
  },

  renderLiveSimulator(survey) {
    const device = this.previewDevice || 'mobile';
    const widthClass = device === 'mobile' ? 'max-w-[420px]' : device === 'tablet' ? 'max-w-[768px]' : 'max-w-4xl';
    const questions = window.aeStore.getQuestionsForSurvey(survey);

    return `
      <div class="space-y-4">
        <!-- Device Controls -->
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-3 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-[#111613]">Device Viewport:</span>
            <div class="inline-flex rounded-[6px] border border-[#CFD5D0] p-0.5 bg-[#FAFBF9]">
              <button onclick="window.AEBuilder.previewDevice = 'mobile'; window.AEApp.render();"
                class="px-2.5 py-1 text-xs rounded-[4px] font-medium transition-colors ${device === 'mobile' ? 'bg-[#141A17] text-white' : 'text-[#525B56] hover:text-[#111613]'}">
                <i class="fa-solid fa-mobile-screen mr-1"></i> Mobile (390px)
              </button>
              <button onclick="window.AEBuilder.previewDevice = 'tablet'; window.AEApp.render();"
                class="px-2.5 py-1 text-xs rounded-[4px] font-medium transition-colors ${device === 'tablet' ? 'bg-[#141A17] text-white' : 'text-[#525B56] hover:text-[#111613]'}">
                <i class="fa-solid fa-tablet-screen-button mr-1"></i> Tablet (768px)
              </button>
              <button onclick="window.AEBuilder.previewDevice = 'desktop'; window.AEApp.render();"
                class="px-2.5 py-1 text-xs rounded-[4px] font-medium transition-colors ${device === 'desktop' ? 'bg-[#141A17] text-white' : 'text-[#525B56] hover:text-[#111613]'}">
                <i class="fa-solid fa-desktop mr-1"></i> Desktop (Full)
              </button>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-[#646E68]">Interactive preview</span>
            <button onclick="window.AEBuilder.previewMode = false; window.AEApp.render();"
              class="h-7 px-2.5 rounded-[4px] text-xs font-medium border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-[#111613]">
              Exit Preview
            </button>
          </div>
        </div>

        <!-- Frame -->
        <div class="flex justify-center p-4 sm:p-8 bg-[#F4F6F4] rounded-[12px] border border-[#E4E7E4] overflow-hidden">
          <div class="${widthClass} w-full bg-white rounded-[16px] shadow-sm border border-[#CFD5D0] overflow-hidden">
            <!-- Simulated Device Header Bar -->
            <div class="bg-[#141A17] text-white px-4 py-2 flex items-center justify-between text-[11px] font-mono">
              <span>09:41</span>
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-signal"></i>
                <i class="fa-solid fa-wifi"></i>
                <i class="fa-solid fa-battery-full"></i>
              </div>
            </div>

            <!-- Survey Content Inside Simulator -->
            <div class="p-5 sm:p-6 space-y-6">
              <div class="border-b border-[#EFEFEF] pb-4">
                <div class="flex items-center gap-2 text-xs text-[#247B50] font-semibold">
                  <span class="w-2 h-2 rounded-full bg-[#247B50]"></span>
                  ${AEApp.escapeHtml(survey.category || 'Universal Field Survey')}
                </div>
                <h2 class="text-lg font-bold text-[#111613] mt-1">${AEApp.escapeHtml(survey.title)}</h2>
                ${survey.description ? `<p class="text-xs text-[#525B56] mt-1">${AEApp.escapeHtml(survey.description)}</p>` : ''}
              </div>

              <!-- Question List -->
              <div class="space-y-4">
                ${questions.length === 0 ? '<div class="p-6 text-center text-xs text-[#646E68]">No questions in this survey yet. Add questions from the editor.</div>' : ''}
                ${(() => {
                  const qNumMap = (window.AEPiping && typeof window.AEPiping.computeQuestionDisplayNumbers === 'function')
                    ? window.AEPiping.computeQuestionDisplayNumbers(questions)
                    : {};
                  return questions
                    .map((q, idx) => {
                      const numInfo = (qNumMap && qNumMap[q.id]) || { label: String(idx + 1), isSub: false };
                      const pipedTitle = (window.AEPiping && typeof window.AEPiping.interpolate === 'function')
                        ? window.AEPiping.interpolate(q.title || '', {}, survey)
                        : (q.title || '');
                      const rawHelp = q.subtitle || q.helpText || '';
                      const pipedHelp = (window.AEPiping && typeof window.AEPiping.interpolate === 'function')
                        ? window.AEPiping.interpolate(rawHelp, {}, survey)
                        : rawHelp;
                      return `
                  <div class="p-4 rounded-[8px] border border-[#E4E7E4] bg-[#FAFBF9] space-y-2 ${q.parentQuestionId ? 'ml-4 border-l-[3px] border-l-[#247B50]' : ''}">
                    <div class="flex items-start justify-between gap-2">
                      <label class="text-xs font-semibold text-[#111613]">
                        <span class="text-[#247B50] tabular-nums mr-1">${numInfo.label}.</span>
                        ${AEApp.escapeHtml(pipedTitle)}
                        ${q.parentQuestionId ? `<span class="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-[#DCFAE5] text-[#04250E] ml-1.5">Part ${AEApp.escapeHtml(numInfo.letter || 'b')}</span>` : ''}
                        ${q.required ? '<span class="text-[#C4242A] ml-0.5">*</span>' : ''}
                      </label>
                      <span class="text-[11px] px-1.5 py-0.5 rounded bg-white border border-[#E4E7E4] text-[#646E68] shrink-0">
                        ${q.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    ${pipedHelp ? `<p class="text-[11px] text-[#525B56]">${AEApp.escapeHtml(pipedHelp)}</p>` : ''}

                    <div class="pt-1">
                      ${this.renderSimulatedQuestionInput(q)}
                    </div>
                  </div>
                `;
                    })
                    .join('');
                })()}
              </div>

              <!-- Submit Simulation -->
              <div class="pt-4 border-t border-[#EFEFEF]">
                <button onclick="window.AEApp.showToast('Simulator: Validation Passed! Form input is valid and ready for submission.', 'success')"
                  class="w-full h-10 rounded-[6px] bg-[#247B50] hover:bg-[#1F6A45] text-white font-semibold text-xs flex items-center justify-center gap-2 ae-press">
                  <i class="fa-solid fa-paper-plane text-xs"></i> Test Form Submission
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderSimulatedQuestionInput(q) {
    if (q.type === 'multiple_choice' || q.type === 'dropdown') {
      return `
        <select class="w-full h-8 text-xs bg-white border border-[#CFD5D0] rounded-[4px] px-2 text-[#111613]">
          <option value="">-- Select an option --</option>
          ${(q.options || []).map((opt) => `<option value="${AEApp.escapeAttr(opt)}">${AEApp.escapeHtml(opt)}</option>`).join('')}
        </select>
      `;
    }
    if (q.type === 'checkboxes') {
      return `
        <div class="space-y-1.5 pt-1">
          ${(q.options || []).map((opt) => `
            <label class="flex items-center gap-2 text-xs text-[#111613] cursor-pointer">
              <input type="checkbox" class="rounded text-[#247B50] focus:ring-[#247B50]" />
              <span>${AEApp.escapeHtml(opt)}</span>
            </label>
          `).join('')}
        </div>
      `;
    }
    if (q.type === 'star_rating') {
      return `
        <div class="flex items-center gap-1.5 text-base text-[#D97706]">
          <i class="fa-solid fa-star cursor-pointer"></i>
          <i class="fa-solid fa-star cursor-pointer"></i>
          <i class="fa-solid fa-star cursor-pointer"></i>
          <i class="fa-solid fa-star cursor-pointer"></i>
          <i class="fa-regular fa-star cursor-pointer text-[#CFD5D0]"></i>
          <span class="text-xs text-[#525B56] ml-2 font-mono">4.0 / 5.0</span>
        </div>
      `;
    }
    if (q.type === 'nps') {
      return `
        <div class="flex items-center gap-1 overflow-x-auto py-1">
          ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            .map(
              (n) => `
            <button type="button" class="w-7 h-7 rounded-[4px] border border-[#CFD5D0] bg-white text-xs font-mono font-medium hover:bg-[#247B50] hover:text-white transition-colors">
              ${n}
            </button>
          `
            )
            .join('')}
        </div>
      `;
    }
    if (q.type === 'number_yield') {
      return `
        <div class="flex items-center gap-2">
          <input type="number" placeholder="0" class="h-8 w-32 px-2 text-xs border border-[#CFD5D0] rounded-[4px] bg-white font-mono" />
          <span class="text-xs text-[#525B56] font-medium">${AEApp.escapeHtml(q.unit || 'units')}</span>
        </div>
      `;
    }
    if (q.type === 'calculated') {
      return `
        <div class="flex items-center justify-between gap-2 p-2.5 rounded-[6px] bg-white border border-[#CFD5D0] text-xs">
          <span class="inline-flex items-center gap-1.5 text-[#525B56]">
            <i class="fa-solid fa-equals text-[#247B50]"></i>
            <code class="font-mono text-[11px] text-[#111613]">${AEApp.escapeHtml(q.formula || 'No formula set')}</code>
          </span>
          <span class="font-mono font-semibold text-[#247B50]">— ${AEApp.escapeHtml(q.unit || '')}</span>
        </div>
      `;
    }
    if (q.type === 'gps' || q.type === 'gps_location') {
      return `
        <div class="flex items-center gap-2 p-2 rounded-[4px] bg-white border border-[#CFD5D0] text-xs">
          <i class="fa-solid fa-location-dot text-[#247B50]"></i>
          <span class="text-[#111613] font-mono">-1.2921, 36.8219</span>
          <span class="text-[11px] text-[#646E68] ml-auto">±4m accuracy</span>
        </div>
      `;
    }
    if (q.type === 'signature') {
      return `
        <div class="h-16 border border-dashed border-[#CFD5D0] rounded-[4px] bg-white flex items-center justify-center text-xs text-[#A0AAA3]">
          <i class="fa-solid fa-signature mr-1.5"></i> Touch or click to sign
        </div>
      `;
    }
    if (q.type === 'photo_camera' || q.type === 'photo_proof') {
      return `
        <div class="h-20 border border-dashed border-[#CFD5D0] rounded-[4px] bg-white flex flex-col items-center justify-center text-xs text-[#525B56] gap-1 cursor-pointer hover:bg-[#F4F6F4]">
          <i class="fa-solid fa-camera text-base text-[#247B50]"></i>
          <span>Click to capture photo or upload</span>
        </div>
      `;
    }
    return `
      <input type="text" placeholder="${AEApp.escapeAttr(q.placeholder || 'Type your response...')}"
        class="w-full h-8 px-2.5 text-xs border border-[#CFD5D0] rounded-[4px] bg-white focus:outline-none focus:border-[#247B50]" />
    `;
  },

  renderQuestionBankSidebar(survey) {
    const groups = Array.from(new Set(QUESTION_TYPES_CATALOG.map((item) => item.group)));
    return `
      <div class="p-4 space-y-4 lg:max-h-[calc(100dvh-160px)] lg:overflow-y-auto">
        <div class="flex items-center justify-between pb-1 border-b border-[#EFEFEF]">
          <span class="text-xs font-semibold text-[#111613]">Question Catalog</span>
          <span class="text-[10px] text-[#525B56] tabular-nums">Page ${this.activePageIndex + 1}</span>
        </div>
        <p class="text-xs text-[#525B56] leading-relaxed">
          Pick a question type to add it to <strong class="text-[#111613]">Page ${this.activePageIndex + 1}</strong>.
        </p>

        ${groups
          .map((groupName) => {
            const items = QUESTION_TYPES_CATALOG.filter((item) => item.group === groupName);
            return `
              <div>
                <h4 class="text-xs font-semibold text-[#525B56] mb-1.5">${groupName}</h4>
                <div class="grid grid-cols-1 gap-1">
                  ${items
                    .map(
                      (item) => `
                    <button onclick="AEApp.addQuestionToActivePage('${item.type}')"
                      class="w-full h-9 flex items-center justify-between px-3 rounded-[6px] border border-[#E4E7E4] bg-[#F8F9F8] hover:bg-white hover:border-[#247B50] text-left group ae-press">
                      <span class="flex items-center gap-2.5 text-xs font-medium text-[#111613]">
                        <i class="fa-solid ${item.icon} text-[#525B56] group-hover:text-[#247B50] w-4 text-center"></i>
                        <span>${item.label}</span>
                      </span>
                      <i class="fa-solid fa-plus text-[10px] text-[#646E68] group-hover:text-[#247B50]"></i>
                    </button>
                  `
                    )
                    .join('')}
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  },

  renderThemeSidebar(survey) {
    const theme = survey.theme || { accentColor: '#247B50', showProgressBar: true, showQuestionNumbers: true };
    const branding = survey.branding || {};
    const schedule = survey.schedule || {};
    const accessControl = survey.accessControl || { limitOnePerDevice: false, requireInviteToken: false, inviteTokens: [] };
    const alerts = survey.alerts || { enabled: false, recipients: '', alertOnUrgency: true, alertOnVelocity: true };
    const logoSrc = branding.logoDataUrl || branding.logoUrl || '';
    const formatDatetimeLocal = (val) => {
      if (!val) return '';
      const str = String(val).trim();
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str)) return str.slice(0, 16);
      const d = new Date(str);
      if (Number.isNaN(d.getTime())) return '';
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    const swatches = [
      { name: 'Agri Emerald', hex: '#247B50' },
      { name: 'Canopy Forest Ink', hex: '#141A17' },
      { name: 'Harvest Ochre', hex: '#92400E' },
      { name: 'Rift Highland Teal', hex: '#0F766E' },
      { name: 'Neutral Slate', hex: '#1E293B' }
    ];

    return `
      <div class="p-4 space-y-5 lg:max-h-[calc(100dvh-160px)] lg:overflow-y-auto">
        <div>
          <label for="ae_builder_category" class="block text-xs font-medium text-[#111613] mb-1.5">Survey Category</label>
          <input type="text"
            id="ae_builder_category"
            maxlength="80"
            value="${AEApp.escapeAttr(survey.category || 'Field Survey')}"
            onchange="AEApp.updateSurveyMeta('category', this.value)"
            class="w-full h-9 text-xs bg-white border border-[#CFD5D0] rounded-[6px] px-3 text-[#111613] focus:outline-none focus:border-[#247B50]" />
        </div>

        <div class="pt-3 border-t border-[#EFEFEF] space-y-2">
          <label for="ae_builder_col_mode" class="block text-xs font-medium text-[#111613]">Administration &amp; Access Mode</label>
          <select id="ae_builder_col_mode"
            onchange="AEApp.updateSurveyMeta('collectionMode', this.value)"
            class="w-full h-9 text-xs bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613] focus:outline-none focus:border-[#247B50]">
            <option value="hybrid" ${(survey.collectionMode || 'hybrid') === 'hybrid' ? 'selected' : ''}>Hybrid (Enumerators + Self-Administered Link)</option>
            <option value="self_administered" ${survey.collectionMode === 'self_administered' ? 'selected' : ''}>Self-Administered Only (Public Link, No Login)</option>
            <option value="enumerator" ${survey.collectionMode === 'enumerator' ? 'selected' : ''}>Enumerator-Assisted Only (Assigned Staff)</option>
          </select>
          <p class="text-[11px] text-[#525B56] leading-relaxed">
            ${
              survey.collectionMode === 'enumerator'
                ? 'Requires an authenticated field enumerator assigned to this survey.'
                : 'Respondents can complete this survey directly via web link with zero login required.'
            }
          </p>
        </div>

        <div>
          <label class="block text-xs font-medium text-[#111613] mb-2">Survey Theme Preset</label>
          <div class="grid grid-cols-1 gap-2">
            ${(window.AEThemePresets ? window.AEThemePresets.PRESETS : [])
              .map((p) => {
                const isActive = (theme.preset || 'canopy_emerald') === p.id;
                return `
                  <button type="button" onclick="AEApp.applySurveyThemePreset('${p.id}')"
                    class="w-full text-left p-2.5 rounded-[8px] border transition-colors ${
                      isActive
                        ? 'border-[#247B50] bg-[#DCFAE5]/35 ring-1 ring-[#247B50]/20'
                        : 'border-[#E4E7E4] bg-white hover:border-[#CFD5D0] hover:bg-[#FAFBF9]'
                    }">
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-2.5 min-w-0">
                        <span class="w-8 h-6 rounded-[4px] border shrink-0 flex items-center justify-center overflow-hidden"
                          style="background:${p.pageBg};border-color:${p.cardBorder};">
                          <span class="w-4 h-2 rounded-[2px]" style="background:${p.accentColor};"></span>
                        </span>
                        <div class="min-w-0">
                          <div class="text-xs font-semibold text-[#111613] truncate">${p.name}</div>
                          <div class="text-[10px] text-[#646E68] truncate">${p.tagline}</div>
                        </div>
                      </div>
                      ${isActive ? '<i class="fa-solid fa-check text-[#247B50] text-xs shrink-0"></i>' : ''}
                    </div>
                  </button>
                `;
              })
              .join('')}
          </div>
        </div>

        <div class="pt-3 border-t border-[#EFEFEF]">
          <label class="block text-xs font-medium text-[#111613] mb-2">Custom Accent Override</label>
          <div class="space-y-1.5">
            ${swatches
              .map(
                (s) => `
              <button onclick="AEApp.updateSurveyTheme('accentColor', '${s.hex}')"
                class="w-full h-9 flex items-center justify-between px-3 rounded-[6px] border text-xs font-medium ${
                  theme.accentColor === s.hex
                    ? 'border-[#247B50] bg-[#DCFAE5]/50 text-[#111613] font-semibold'
                    : 'border-[#E4E7E4] bg-white text-[#525B56]'
                }">
                <span class="flex items-center gap-2.5">
                  <span class="w-3.5 h-3.5 rounded-full border border-black/10" style="background:${s.hex}"></span>
                  <span>${s.name}</span>
                </span>
                ${theme.accentColor === s.hex ? '<i class="fa-solid fa-check text-[#247B50] text-xs"></i>' : ''}
              </button>
            `
              )
              .join('')}
          </div>
        </div>

        <div class="space-y-2.5 pt-3 border-t border-[#EFEFEF]">
          <label class="flex items-center justify-between text-xs font-medium text-[#111613] cursor-pointer">
            <span>Show respondent progress bar</span>
            <input type="checkbox" ${theme.showProgressBar !== false ? 'checked' : ''}
              onchange="AEApp.updateSurveyTheme('showProgressBar', this.checked)"
              class="accent-[#247B50] w-4 h-4 rounded" />
          </label>
          <label class="flex items-center justify-between text-xs font-medium text-[#111613] cursor-pointer">
            <span>Auto-number questions (Q1, Q2…)</span>
            <input type="checkbox" ${theme.showQuestionNumbers !== false ? 'checked' : ''}
              onchange="AEApp.updateSurveyTheme('showQuestionNumbers', this.checked)"
              class="accent-[#247B50] w-4 h-4 rounded" />
          </label>
        </div>

        <!-- Branding & Thank-You Screen -->
        <div class="pt-3 border-t border-[#EFEFEF] space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#111613] flex items-center gap-1.5">
              <i class="fa-solid fa-palette text-[#247B50] text-[11px]"></i> Branding &amp; Thank-You Screen
            </span>
          </div>

          <div class="space-y-1.5">
            <label for="ae_builder_logo_upload" class="block text-[11px] font-medium text-[#525B56]">Custom Organization Logo</label>
            ${
              logoSrc
                ? `<div class="p-2 rounded-[6px] border border-[#E4E7E4] bg-[#F8F9F8] flex items-center justify-between gap-2">
                    <img src="${AEApp.escapeAttr(logoSrc)}" alt="Survey logo preview" class="max-h-10 max-w-[140px] object-contain" />
                    <button type="button" onclick="AEApp.updateSurveyBranding('logoDataUrl', '')"
                      class="h-7 px-2 rounded-[5px] border border-[#CFD5D0] bg-white hover:bg-[#FFEDEA] hover:text-[#C4242A] hover:border-[#F5C2C0] text-[11px] font-medium text-[#525B56] shrink-0">
                      Remove
                    </button>
                  </div>`
                : ''
            }
            <input id="ae_builder_logo_upload" type="file" accept="image/*"
              onchange="AEApp.uploadSurveyLogo(this)"
              class="block w-full text-[11px] text-[#525B56] file:mr-2 file:py-1 file:px-2.5 file:rounded-[5px] file:border file:border-[#CFD5D0] file:text-[11px] file:font-medium file:bg-white file:text-[#111613] hover:file:bg-[#F4F6F4] cursor-pointer" />
            <p class="text-[10px] text-[#646E68]">Auto-resized to max 240×80px for offline &amp; Google Sheets sync.</p>
          </div>

          <div>
            <label for="ae_builder_ty_title" class="block text-[11px] font-medium text-[#525B56] mb-1">Thank-You Title</label>
            <input id="ae_builder_ty_title" type="text" maxlength="120"
              value="${AEApp.escapeAttr(branding.thankYouTitle || '')}"
              onchange="AEApp.updateSurveyBranding('thankYouTitle', this.value)"
              placeholder="e.g. Asante! Response Recorded"
              class="w-full h-8 text-xs bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613] focus:outline-none focus:border-[#247B50]" />
          </div>

          <div>
            <label for="ae_builder_ty_msg" class="block text-[11px] font-medium text-[#525B56] mb-1">Thank-You Message</label>
            <textarea id="ae_builder_ty_msg" rows="2" maxlength="400"
              onchange="AEApp.updateSurveyBranding('thankYouMessage', this.value)"
              placeholder="Custom closing message shown after submission…"
              class="w-full text-xs bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 py-1.5 text-[#111613] focus:outline-none focus:border-[#247B50] resize-none">${AEApp.escapeHtml(branding.thankYouMessage || '')}</textarea>
          </div>

          <div>
            <label for="ae_builder_ty_redirect" class="block text-[11px] font-medium text-[#525B56] mb-1">Optional Redirect URL (https://)</label>
            <input id="ae_builder_ty_redirect" type="url" maxlength="300"
              value="${AEApp.escapeAttr(branding.redirectUrl || '')}"
              onchange="AEApp.updateSurveyBranding('redirectUrl', this.value)"
              placeholder="https://example.org/thank-you"
              class="w-full h-8 text-xs bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613] focus:outline-none focus:border-[#247B50]" />
          </div>

          <!-- Completion Workflows: Auto-Redirect, Conditional Thank-You & Webhooks -->
          ${(() => {
            const cw = survey.completionWorkflow || {};
            const allQs = window.aeStore.getQuestionsForSurvey(survey);
            const condQs = allQs.filter((q) => ['multiple_choice', 'dropdown', 'nps', 'star_rating'].includes(q.type));
            return `
              <div class="pt-2.5 border-t border-[#EFEFEF] space-y-2.5">
                <span class="text-xs font-semibold text-[#111613] flex items-center gap-1.5">
                  <i class="fa-solid fa-bolt text-[#247B50] text-[11px]"></i> Completion Workflows &amp; Webhooks
                </span>

                <label class="flex items-center justify-between text-xs font-medium text-[#111613] cursor-pointer gap-2">
                  <span>Auto-redirect after 3s (respondent mode)</span>
                  <input type="checkbox" ${cw.autoRedirect ? 'checked' : ''}
                    onchange="AEApp.updateSurveyCompletionWorkflow('autoRedirect', this.checked)"
                    class="accent-[#247B50] w-4 h-4 rounded shrink-0" />
                </label>

                <label class="flex items-center justify-between text-xs font-medium text-[#111613] cursor-pointer gap-2">
                  <span>Conditional Thank-You message</span>
                  <input type="checkbox" ${cw.conditionalEnabled ? 'checked' : ''}
                    onchange="AEApp.updateSurveyCompletionWorkflow('conditionalEnabled', this.checked)"
                    class="accent-[#247B50] w-4 h-4 rounded shrink-0" />
                </label>

                ${
                  cw.conditionalEnabled && condQs.length > 0
                    ? `<div class="p-2.5 rounded-[6px] bg-[#FAFBF9] border border-[#E4E7E4] space-y-2">
                        <select onchange="AEApp.updateSurveyCompletionWorkflow('condQuestionId', this.value)"
                          class="w-full h-7 text-[11px] bg-white border border-[#CFD5D0] rounded-[5px] px-2 text-[#111613]">
                          <option value="">Trigger question…</option>
                          ${condQs.map((q) => `<option value="${AEApp.escapeAttr(q.id)}" ${cw.condQuestionId === q.id ? 'selected' : ''}>${AEApp.escapeHtml((q.title || q.id).slice(0, 42))}</option>`).join('')}
                        </select>
                        <div class="grid grid-cols-2 gap-1.5">
                          <select onchange="AEApp.updateSurveyCompletionWorkflow('condOperator', this.value)"
                            class="h-7 text-[11px] bg-white border border-[#CFD5D0] rounded-[5px] px-1.5 text-[#111613]">
                            <option value="equals" ${(cw.condOperator || 'equals') === 'equals' ? 'selected' : ''}>Equals</option>
                            <option value="lte" ${cw.condOperator === 'lte' ? 'selected' : ''}>≤ (Score)</option>
                            <option value="gte" ${cw.condOperator === 'gte' ? 'selected' : ''}>≥ (Score)</option>
                          </select>
                          <input type="text" value="${AEApp.escapeAttr(cw.condValue || '')}"
                            onchange="AEApp.updateSurveyCompletionWorkflow('condValue', this.value)"
                            placeholder="e.g. 6 or Yes"
                            class="h-7 text-[11px] bg-white border border-[#CFD5D0] rounded-[5px] px-2 text-[#111613]" />
                        </div>
                        <input type="text" value="${AEApp.escapeAttr(cw.condTitle || '')}"
                          onchange="AEApp.updateSurveyCompletionWorkflow('condTitle', this.value)"
                          placeholder="Conditional Thank-You Title"
                          class="w-full h-7 text-[11px] bg-white border border-[#CFD5D0] rounded-[5px] px-2 text-[#111613]" />
                        <textarea rows="2" onchange="AEApp.updateSurveyCompletionWorkflow('condMessage', this.value)"
                          placeholder="Custom message shown when trigger matches…"
                          class="w-full text-[11px] bg-white border border-[#CFD5D0] rounded-[5px] px-2 py-1 text-[#111613] resize-none">${AEApp.escapeHtml(cw.condMessage || '')}</textarea>
                      </div>`
                    : ''
                }

                <label class="flex items-center justify-between text-xs font-medium text-[#111613] cursor-pointer gap-2 pt-1">
                  <span>Fire Webhook on new response</span>
                  <input type="checkbox" ${cw.webhookEnabled ? 'checked' : ''}
                    onchange="AEApp.updateSurveyCompletionWorkflow('webhookEnabled', this.checked)"
                    class="accent-[#247B50] w-4 h-4 rounded shrink-0" />
                </label>

                ${
                  cw.webhookEnabled
                    ? `<div class="p-2.5 rounded-[6px] bg-[#FAFBF9] border border-[#E4E7E4] space-y-2">
                        <input type="url" value="${AEApp.escapeAttr(cw.webhookUrl || '')}"
                          onchange="AEApp.updateSurveyCompletionWorkflow('webhookUrl', this.value)"
                          placeholder="https://hooks.slack.com/… or Zapier/n8n URL"
                          class="w-full h-7 text-[11px] bg-white border border-[#CFD5D0] rounded-[5px] px-2 text-[#111613]" />
                        <input type="text" value="${AEApp.escapeAttr(cw.webhookSecret || '')}"
                          onchange="AEApp.updateSurveyCompletionWorkflow('webhookSecret', this.value)"
                          placeholder="Optional X-AE-Webhook-Secret header"
                          class="w-full h-7 text-[11px] bg-white border border-[#CFD5D0] rounded-[5px] px-2 text-[#111613]" />
                        <button type="button" onclick="AEApp.testSurveyWebhook('${AEApp.escapeJs(survey.id)}')"
                          class="w-full h-7 rounded-[5px] border border-[#247B50]/40 bg-[#F3FBF6] hover:bg-[#DCFAE5] text-[#04250E] text-[11px] font-semibold ae-press">
                          <i class="fa-solid fa-paper-plane mr-1 text-[10px]"></i> Send Test Ping
                        </button>
                      </div>`
                    : ''
                }
              </div>
            `;
          })()}
        </div>

        <!-- Schedule & Response Quota -->
        <div class="pt-3 border-t border-[#EFEFEF] space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#111613] flex items-center gap-1.5">
              <i class="fa-solid fa-calendar-check text-[#247B50] text-[11px]"></i> Schedule &amp; Response Quota
            </span>
          </div>

          <div>
            <label for="ae_builder_open_at" class="block text-[11px] font-medium text-[#525B56] mb-1">Open Date &amp; Time</label>
            <input id="ae_builder_open_at" type="datetime-local"
              value="${AEApp.escapeAttr(formatDatetimeLocal(schedule.openAt))}"
              onchange="AEApp.updateSurveySchedule('openAt', this.value)"
              class="w-full h-8 text-xs bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613] focus:outline-none focus:border-[#247B50]" />
          </div>

          <div>
            <label for="ae_builder_close_at" class="block text-[11px] font-medium text-[#525B56] mb-1">Close Date &amp; Time</label>
            <input id="ae_builder_close_at" type="datetime-local"
              value="${AEApp.escapeAttr(formatDatetimeLocal(schedule.closeAt))}"
              onchange="AEApp.updateSurveySchedule('closeAt', this.value)"
              class="w-full h-8 text-xs bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613] focus:outline-none focus:border-[#247B50]" />
          </div>

          <div>
            <label for="ae_builder_max_responses" class="block text-[11px] font-medium text-[#525B56] mb-1">Max Response Quota</label>
            <input id="ae_builder_max_responses" type="number" min="0" step="1"
              value="${schedule.maxResponses ? Number(schedule.maxResponses) : ''}"
              onchange="AEApp.updateSurveySchedule('maxResponses', this.value)"
              placeholder="Leave blank for unlimited"
              class="w-full h-8 text-xs bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 tabular-nums text-[#111613] focus:outline-none focus:border-[#247B50]" />
          </div>

          <div>
            <label for="ae_builder_closed_msg" class="block text-[11px] font-medium text-[#525B56] mb-1">Closed / Quota Reached Message</label>
            <input id="ae_builder_closed_msg" type="text" maxlength="240"
              value="${AEApp.escapeAttr(schedule.closedMessage || '')}"
              onchange="AEApp.updateSurveySchedule('closedMessage', this.value)"
              placeholder="e.g. This survey has reached its target responses."
              class="w-full h-8 text-xs bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613] focus:outline-none focus:border-[#247B50]" />
          </div>

          <!-- Stratified Sampling Quotas (Targets per Region / Segment) -->
          ${(() => {
            const sq = survey.stratifiedQuotas || {};
            const allQs = window.aeStore.getQuestionsForSurvey(survey);
            const strataQs = allQs.filter((q) => ['multiple_choice', 'dropdown', 'checkboxes'].includes(q.type) && Array.isArray(q.options) && q.options.length > 0);
            const activeQ = strataQs.find((q) => q.id === sq.questionId) || null;
            const targets = sq.targets || {};
            return `
              <div class="pt-2.5 border-t border-[#EFEFEF] space-y-2">
                <label class="flex items-center justify-between text-xs font-medium text-[#111613] cursor-pointer gap-2">
                  <span><i class="fa-solid fa-bullseye text-[#247B50] text-[10px] mr-1"></i>Stratified Sampling Quotas</span>
                  <input type="checkbox" ${sq.enabled ? 'checked' : ''}
                    onchange="AEApp.updateSurveyStratifiedQuota('enabled', this.checked)"
                    class="accent-[#247B50] w-4 h-4 rounded shrink-0" />
                </label>
                ${
                  sq.enabled
                    ? `<div class="p-2.5 rounded-[6px] bg-[#FAFBF9] border border-[#E4E7E4] space-y-2">
                        <select onchange="AEApp.updateSurveyStratifiedQuota('questionId', this.value)"
                          class="w-full h-7 text-[11px] bg-white border border-[#CFD5D0] rounded-[5px] px-2 text-[#111613]">
                          <option value="">Choose stratification question…</option>
                          ${strataQs.map((q) => `<option value="${AEApp.escapeAttr(q.id)}" ${sq.questionId === q.id ? 'selected' : ''}>${AEApp.escapeHtml((q.title || q.id).slice(0, 42))}</option>`).join('')}
                        </select>
                        ${
                          activeQ
                            ? `<div class="space-y-1.5">
                                ${activeQ.options
                                  .map((opt) => {
                                    const lbl = typeof opt === 'string' ? opt : String(opt.label || opt.value || '');
                                    return `
                                      <div class="flex items-center justify-between gap-2 text-[11px]">
                                        <span class="text-[#111613] truncate flex-1">${AEApp.escapeHtml(lbl)}</span>
                                        <input type="number" min="0" step="1" value="${targets[lbl] ? Number(targets[lbl]) : ''}"
                                          placeholder="Target"
                                          onchange="AEApp.updateSurveyStratifiedTarget('${AEApp.escapeAttr(AEApp.escapeJs(lbl))}', this.value)"
                                          class="w-16 h-6 px-1.5 text-[11px] text-right bg-white border border-[#CFD5D0] rounded-[4px] tabular-nums" />
                                      </div>
                                    `;
                                  })
                                  .join('')}
                              </div>
                              <label class="flex items-center justify-between text-[11px] text-[#525B56] cursor-pointer pt-1">
                                <span>Warn collector when stratum is full</span>
                                <input type="checkbox" ${sq.warnWhenFull !== false ? 'checked' : ''}
                                  onchange="AEApp.updateSurveyStratifiedQuota('warnWhenFull', this.checked)"
                                  class="accent-[#247B50] w-3.5 h-3.5 rounded" />
                              </label>`
                            : ''
                        }
                      </div>`
                    : ''
                }
              </div>
            `;
          })()}
        </div>

        <!-- Live Report Access Controls (Passcode, Expiry & Tab Visibility) -->
        ${(() => {
          const ra = survey.reportAccess || {};
          const sc = survey.scoring || {};
          return `
            <div class="pt-3 border-t border-[#EFEFEF] space-y-2.5">
              <span class="text-xs font-semibold text-[#111613] flex items-center gap-1.5">
                <i class="fa-solid fa-lock text-[#247B50] text-[11px]"></i> Live Report Access Control
              </span>
              <div>
                <label class="block text-[11px] font-medium text-[#525B56] mb-1">Optional Report Passcode</label>
                <input type="text" maxlength="40" value="${AEApp.escapeAttr(ra.passcode || '')}"
                  onchange="AEApp.updateSurveyReportAccess('passcode', this.value)"
                  placeholder="Leave blank for open link"
                  class="w-full h-8 text-xs bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613]" />
              </div>
              <div>
                <label class="block text-[11px] font-medium text-[#525B56] mb-1">Report Link Expiry Date</label>
                <input type="date" value="${AEApp.escapeAttr(ra.expiresAt || '')}"
                  onchange="AEApp.updateSurveyReportAccess('expiresAt', this.value)"
                  class="w-full h-8 text-xs bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613]" />
              </div>
              <label class="flex items-center justify-between text-xs text-[#111613] cursor-pointer gap-2">
                <span>Hide Open-Ended tab on live report</span>
                <input type="checkbox" ${ra.hideOpenEnded ? 'checked' : ''}
                  onchange="AEApp.updateSurveyReportAccess('hideOpenEnded', this.checked)"
                  class="accent-[#247B50] w-4 h-4 rounded" />
              </label>
              <label class="flex items-center justify-between text-xs text-[#111613] cursor-pointer gap-2">
                <span>Hide Evidence Gallery on live report</span>
                <input type="checkbox" ${ra.hideGallery ? 'checked' : ''}
                  onchange="AEApp.updateSurveyReportAccess('hideGallery', this.checked)"
                  class="accent-[#247B50] w-4 h-4 rounded" />
              </label>
            </div>

            <!-- Scoring & Readiness Tiers (Audits, Quizzes, Checklists) -->
            <div class="pt-3 border-t border-[#EFEFEF] space-y-2.5">
              <label class="flex items-center justify-between text-xs font-semibold text-[#111613] cursor-pointer gap-2">
                <span><i class="fa-solid fa-award text-[#247B50] text-[11px] mr-1"></i>Scoring &amp; Readiness Tiers</span>
                <input type="checkbox" ${sc.enabled ? 'checked' : ''}
                  onchange="AEApp.updateSurveyScoring('enabled', this.checked)"
                  class="accent-[#247B50] w-4 h-4 rounded" />
              </label>
              ${
                sc.enabled
                  ? `<div class="p-2.5 rounded-[6px] bg-[#FAFBF9] border border-[#E4E7E4] space-y-2 text-[11px]">
                      <label class="flex items-center justify-between text-[#111613] cursor-pointer">
                        <span>Show score &amp; tier on Thank-You</span>
                        <input type="checkbox" ${sc.showScoreToRespondent !== false ? 'checked' : ''}
                          onchange="AEApp.updateSurveyScoring('showScoreToRespondent', this.checked)"
                          class="accent-[#247B50] w-3.5 h-3.5 rounded" />
                      </label>
                      <p class="text-[#646E68]">Assign point values (<code>pts</code>) directly beside each answer option in your questions.</p>
                    </div>`
                  : ''
              }
            </div>
          `;
        })()}

        <!-- Access & Anti-Duplicate -->
        <div class="pt-3 border-t border-[#EFEFEF] space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#111613] flex items-center gap-1.5">
              <i class="fa-solid fa-shield-halved text-[#247B50] text-[11px]"></i> Access &amp; Anti-Duplicate
            </span>
          </div>

          <label class="flex items-center justify-between text-xs font-medium text-[#111613] cursor-pointer gap-2">
            <span>Limit to 1 response per device</span>
            <input type="checkbox" ${accessControl.limitOnePerDevice ? 'checked' : ''}
              onchange="AEApp.updateSurveyAccessControl('limitOnePerDevice', this.checked)"
              class="accent-[#247B50] w-4 h-4 rounded shrink-0" />
          </label>

          <label class="flex items-center justify-between text-xs font-medium text-[#111613] cursor-pointer gap-2">
            <span>Require single-use invite link</span>
            <input type="checkbox" ${accessControl.requireInviteToken ? 'checked' : ''}
              onchange="AEApp.updateSurveyAccessControl('requireInviteToken', this.checked)"
              class="accent-[#247B50] w-4 h-4 rounded shrink-0" />
          </label>

          ${
            accessControl.requireInviteToken
              ? (() => {
                  const tokens = Array.isArray(accessControl.inviteTokens) ? accessControl.inviteTokens : [];
                  const unusedCount = tokens.filter((t) => t && !t.used).length;
                  return `
                <div class="pt-1 space-y-1.5">
                  <div class="flex items-center justify-between text-[11px] text-[#525B56]">
                    <span>Unused invite links</span>
                    <span class="font-semibold text-[#111613] tabular-nums">${unusedCount} / ${tokens.length}</span>
                  </div>
                  <button type="button" onclick="AEApp.generateSurveyInvites('${survey.id}', 5)"
                    class="w-full h-8 px-3 rounded-[6px] border border-[#247B50] bg-[#DCFAE5]/60 hover:bg-[#DCFAE5] text-xs font-semibold text-[#04250E] flex items-center justify-center gap-1.5 ae-press">
                    <i class="fa-solid fa-ticket text-[#247B50] text-[11px]"></i> Generate 5 Invite Links
                  </button>
                </div>`;
                })()
              : ''
          }
        </div>

        <!-- Email Alerts & Digest -->
        <div class="pt-3 border-t border-[#EFEFEF] space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#111613] flex items-center gap-1.5">
              <i class="fa-solid fa-bell text-[#247B50] text-[11px]"></i> Email Alerts &amp; Digest
            </span>
          </div>

          <label class="flex items-center justify-between text-xs font-medium text-[#111613] cursor-pointer">
            <span>Enable real-time alerts &amp; digest</span>
            <input type="checkbox" ${alerts.enabled ? 'checked' : ''}
              onchange="AEApp.updateSurveyAlerts('enabled', this.checked)"
              class="accent-[#247B50] w-4 h-4 rounded" />
          </label>

          <div>
            <label for="ae_builder_alert_recipients" class="block text-[11px] font-medium text-[#525B56] mb-1">Recipient Emails (comma-separated)</label>
            <input id="ae_builder_alert_recipients" type="text" maxlength="300"
              value="${AEApp.escapeAttr(alerts.recipients || '')}"
              onchange="AEApp.updateSurveyAlerts('recipients', this.value)"
              placeholder="lead@agriexperience.org, qa@agriexperience.org"
              class="w-full h-8 text-xs bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613] focus:outline-none focus:border-[#247B50]" />
          </div>

          <div class="space-y-1.5">
            <label class="flex items-center justify-between text-[11px] font-medium text-[#525B56] cursor-pointer">
              <span>Alert on urgent / risk keywords</span>
              <input type="checkbox" ${alerts.alertOnUrgency !== false ? 'checked' : ''}
                onchange="AEApp.updateSurveyAlerts('alertOnUrgency', this.checked)"
                class="accent-[#247B50] w-3.5 h-3.5 rounded" />
            </label>
            <label class="flex items-center justify-between text-[11px] font-medium text-[#525B56] cursor-pointer">
              <span>Alert on GPS travel velocity flags</span>
              <input type="checkbox" ${alerts.alertOnVelocity !== false ? 'checked' : ''}
                onchange="AEApp.updateSurveyAlerts('alertOnVelocity', this.checked)"
                class="accent-[#247B50] w-3.5 h-3.5 rounded" />
            </label>
          </div>

          <button type="button" onclick="AEApp.triggerDailyDigest('${survey.id}')"
            class="w-full h-8 px-3 rounded-[6px] border border-[#247B50] bg-[#DCFAE5]/60 hover:bg-[#DCFAE5] text-xs font-semibold text-[#04250E] flex items-center justify-center gap-1.5 ae-press">
            <i class="fa-solid fa-envelope-open-text text-[#247B50] text-[11px]"></i> Send Daily Digest Now
          </button>
        </div>

        <div class="pt-3 border-t border-[#EFEFEF]">
          <button onclick="AEApp.exportSurveySchemaJSON('${survey.id}')"
            class="w-full h-9 px-3 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#111613] flex items-center justify-center gap-2 ae-press">
            <i class="fa-solid fa-file-code text-[#247B50]"></i> Export Survey Schema (.json)
          </button>
        </div>
      </div>
    `;
  },

  STANDARD_LIBRARY_BLOCKS: [
    {
      id: 'blk_consent',
      name: 'Informed Consent & Privacy',
      desc: 'Voluntary participation & data privacy agreement',
      icon: 'fa-file-signature',
      questions: [
        { type: 'multiple_choice', title: 'Do you voluntarily consent to participate in this survey?', helpText: 'All responses are confidential and used strictly for research.', required: true, options: ['Yes, I consent', 'No, I decline'] }
      ]
    },
    {
      id: 'blk_demographics',
      name: 'Standard Demographics (3 Qs)',
      desc: 'Gender, Age Group, and Education Level',
      icon: 'fa-users',
      questions: [
        { type: 'multiple_choice', title: 'Gender', required: false, options: ['Female', 'Male', 'Prefer not to say'] },
        { type: 'dropdown', title: 'Age Group', required: false, options: ['18–24', '25–34', '35–44', '45–54', '55+'] },
        { type: 'dropdown', title: 'Highest Education Level', required: false, options: ['No formal schooling', 'Primary', 'Secondary', 'College / Diploma', 'University Degree'] }
      ]
    },
    {
      id: 'blk_nps_why',
      name: 'NPS + Follow-Up "Why?"',
      desc: '0–10 loyalty score paired with open-ended reason',
      icon: 'fa-gauge-high',
      questions: [
        { type: 'nps', title: 'How likely are you to recommend this program or service to others?', helpText: '0 = Not at all likely, 10 = Extremely likely', required: true },
        { type: 'long_text', title: 'What is the primary reason for your score?', helpText: 'Please share any specific experience or suggestion.', required: false }
      ]
    },
    {
      id: 'blk_field_verify',
      name: 'Field Verification Pack',
      desc: 'GPS plot lock + photo evidence + enumerator notes',
      icon: 'fa-location-crosshairs',
      questions: [
        { type: 'gps_location', title: 'Capture Site / Plot GPS Coordinates', required: true },
        { type: 'photo_proof', title: 'Capture Field Verification Photo', required: false },
        { type: 'long_text', title: 'Enumerator Field Observations', required: false }
      ]
    }
  ],

  getSavedLibraryQuestions() {
    try {
      if (typeof localStorage === 'undefined') return [];
      const raw = localStorage.getItem('ae_question_library_v1');
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  },

  renderLibrarySidebar(survey) {
    const saved = this.getSavedLibraryQuestions();
    return `
      <div class="p-3.5 space-y-4 max-h-[75vh] overflow-y-auto">
        <div class="space-y-2">
          <div class="text-[11px] font-semibold uppercase tracking-wide text-[#247B50]">Standard Research Blocks</div>
          <div class="space-y-1.5">
            ${this.STANDARD_LIBRARY_BLOCKS.map((blk) => `
              <button type="button" onclick="AEApp.insertLibraryBlock('${blk.id}')"
                class="w-full text-left p-2.5 rounded-[6px] border border-[#E4E7E4] bg-[#FAFBF9] hover:border-[#247B50]/50 hover:bg-[#F3FBF6] transition-colors space-y-0.5 ae-press">
                <div class="flex items-center justify-between gap-2 text-xs font-semibold text-[#111613]">
                  <span><i class="fa-solid ${blk.icon} text-[#247B50] mr-1.5 text-[11px]"></i>${AEApp.escapeHtml(blk.name)}</span>
                  <i class="fa-solid fa-plus text-[10px] text-[#247B50]"></i>
                </div>
                <div class="text-[11px] text-[#646E68]">${AEApp.escapeHtml(blk.desc)}</div>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="pt-3 border-t border-[#EFEFEF] space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-semibold uppercase tracking-wide text-[#525B56]">Saved Questions (${saved.length})</span>
          </div>
          ${
            saved.length === 0
              ? `<div class="p-3 rounded-[6px] bg-[#FAFBF9] border border-dashed border-[#CFD5D0] text-[11px] text-[#646E68] leading-relaxed">
                  Click the <i class="fa-regular fa-bookmark"></i> icon on any question card to save it here for reuse across surveys.
                </div>`
              : `<div class="space-y-1.5">
                  ${saved.map((item, idx) => `
                    <div class="p-2.5 rounded-[6px] border border-[#E4E7E4] bg-white flex items-start justify-between gap-2 text-xs">
                      <button type="button" onclick="AEApp.insertSavedLibraryQuestion(${idx})" class="text-left min-w-0 flex-1 hover:text-[#247B50]">
                        <div class="font-medium text-[#111613] truncate">${AEApp.escapeHtml(item.title || 'Saved Question')}</div>
                        <div class="text-[10.5px] text-[#646E68]">${AEApp.escapeHtml(item.type || 'short_text')}</div>
                      </button>
                      <button type="button" onclick="AEApp.removeSavedLibraryQuestion(${idx})" title="Remove from library"
                        class="text-[#646E68] hover:text-[#C4242A] p-1">
                        <i class="fa-solid fa-xmark text-[11px]"></i>
                      </button>
                    </div>
                  `).join('')}
                </div>`
          }
        </div>
      </div>
    `;
  },

  renderTranslationsSidebar(survey) {
    const targetLang = this.targetLang || 'sw';
    const langLabel = targetLang === 'sw' ? 'Kiswahili' : targetLang === 'pt' ? 'Português' : 'Français';
    const trans = (survey.translations && survey.translations[targetLang]) || {};
    const currentPage = (survey.pages || [])[this.activePageIndex] || { id: 'page_1', title: 'Page 1', questions: [] };
    const pTrans = (trans.pages && trans.pages[currentPage.id]) || {};
    const qTransMap = trans.questions || {};

    const supportedLangs = Array.isArray(survey.supportedLanguages) && survey.supportedLanguages.length > 0
      ? survey.supportedLanguages
      : ['en', 'sw', 'pt', 'fr'];

    const isLangSupported = (code) => supportedLangs.includes(code);

    return `
      <div class="p-4 space-y-4 lg:max-h-[calc(100dvh-160px)] lg:overflow-y-auto">
        <!-- 1. Supported Languages Offering Configuration -->
        <div class="space-y-2 bg-[#F8F9F8] border border-[#CFD5D0] rounded-[6px] p-3">
          <div class="flex items-center justify-between">
            <label class="block text-xs font-semibold text-[#111613]">Supported languages</label>
            <span class="text-[11px] font-medium text-[#04250E] bg-[#DCFAE5] px-2 py-0.5 rounded-full">Field tablets</span>
          </div>
          <p class="text-[11px] text-[#525B56] leading-snug">
            Configure which languages field tablets can toggle between. English is always the base language and is recorded in Google Sheets.
          </p>
          <div class="space-y-1.5 pt-1.5 border-t border-[#E4E7E4]">
            <label class="flex items-center gap-2 text-xs font-medium text-[#111613]">
              <input type="checkbox" checked disabled class="rounded text-[#247B50]" />
              <span>🇬🇧 English <span class="text-[10px] text-[#646E68]">(Base / Mandatory)</span></span>
            </label>
            <label class="flex items-center gap-2 text-xs font-medium text-[#111613] cursor-pointer">
              <input type="checkbox" ${isLangSupported('sw') ? 'checked' : ''}
                onchange="AEApp.toggleSurveySupportedLanguage('sw')" class="rounded text-[#247B50]" />
              <span>🇰🇪 Kiswahili (Swahili)</span>
            </label>
            <label class="flex items-center gap-2 text-xs font-medium text-[#111613] cursor-pointer">
              <input type="checkbox" ${isLangSupported('pt') ? 'checked' : ''}
                onchange="AEApp.toggleSurveySupportedLanguage('pt')" class="rounded text-[#247B50]" />
              <span>🇵🇹 Português (Portuguese)</span>
            </label>
            <label class="flex items-center gap-2 text-xs font-medium text-[#111613] cursor-pointer">
              <input type="checkbox" ${isLangSupported('fr') ? 'checked' : ''}
                onchange="AEApp.toggleSurveySupportedLanguage('fr')" class="rounded text-[#247B50]" />
              <span>🇫🇷 Français (French)</span>
            </label>
          </div>
        </div>

        <!-- 2. Target Translation Language Switcher -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-[#111613]">Active Target Language Preview</label>
          <div class="grid grid-cols-3 gap-1.5">
            <button type="button" onclick="AEApp.setBuilderTranslationLang('sw')"
              class="h-9 px-2 rounded-[6px] border text-xs font-medium flex items-center justify-center gap-1 ae-press ${
                targetLang === 'sw'
                  ? 'border-[#247B50] bg-[#DCFAE5] text-[#04250E] font-semibold'
                  : 'border-[#CFD5D0] bg-white text-[#525B56]'
              }">
              <span>🇰🇪</span> SW
            </button>
            <button type="button" onclick="AEApp.setBuilderTranslationLang('pt')"
              class="h-9 px-2 rounded-[6px] border text-xs font-medium flex items-center justify-center gap-1 ae-press ${
                targetLang === 'pt'
                  ? 'border-[#247B50] bg-[#DCFAE5] text-[#04250E] font-semibold'
                  : 'border-[#CFD5D0] bg-white text-[#525B56]'
              }">
              <span>🇵🇹</span> PT
            </button>
            <button type="button" onclick="AEApp.setBuilderTranslationLang('fr')"
              class="h-9 px-2 rounded-[6px] border text-xs font-medium flex items-center justify-center gap-1 ae-press ${
                targetLang === 'fr'
                  ? 'border-[#247B50] bg-[#DCFAE5] text-[#04250E] font-semibold'
                  : 'border-[#CFD5D0] bg-white text-[#525B56]'
              }">
              <span>🇫🇷</span> FR
            </button>
          </div>
        </div>

        <div class="pt-2 border-t border-[#EFEFEF] space-y-2">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button type="button" onclick="AEApp.autoTranslateSurvey(false)"
              ${this.isTranslating ? 'disabled' : ''}
              class="h-9 px-3 rounded-[6px] bg-[#247B50] hover:bg-[#1F6A45] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 ae-press ${this.isTranslating ? 'opacity-70 cursor-wait' : ''}">
              <i class="fa-solid ${this.isTranslating ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'} text-xs"></i>
              <span>${this.isTranslating ? 'Translating...' : 'Google Auto-Translate'}</span>
            </button>
            <button type="button" onclick="AEApp.autoTranslateSurvey(true)"
              ${this.isTranslating ? 'disabled' : ''}
              title="Force re-translation of any questions, matrix rows, or options that remain in English"
              class="h-9 px-3 rounded-[6px] border border-[#247B50] bg-[#DCFAE5] hover:bg-[#C9F7D6] text-[#04250E] text-xs font-semibold inline-flex items-center justify-center gap-1.5 ae-press ${this.isTranslating ? 'opacity-70 cursor-wait' : ''}">
              <i class="fa-solid ${this.isTranslating ? 'fa-spinner fa-spin' : 'fa-arrows-rotate'} text-xs"></i>
              <span>Refresh Unchanged</span>
            </button>
          </div>
          <p class="text-[11px] text-[#525B56] leading-snug">
            Translates questions, choices, matrices, and section titles into ${langLabel} using Google Translate with a built-in offline fallback.
          </p>
        </div>

        <div class="pt-2 border-t border-[#EFEFEF] space-y-2.5">
          <div>
            <label class="block text-xs font-medium text-[#525B56] mb-1">
              Survey title (${langLabel})
            </label>
            <input type="text"
              maxlength="200"
              value="${AEApp.escapeAttr(trans.title || '')}"
              onchange="AEApp.updateSurveyTranslationMeta('title', this.value)"
              placeholder="E.g. ${targetLang === 'sw' ? 'Utafiti wa...' : 'Enquête sur...'}"
              class="w-full h-8 text-xs bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613] focus:border-[#247B50] focus:outline-none" />
          </div>

          <div>
            <label class="block text-xs font-medium text-[#525B56] mb-1">
              Section ${this.activePageIndex + 1} title (${langLabel})
            </label>
            <input type="text"
              maxlength="140"
              value="${AEApp.escapeAttr(pTrans.title || '')}"
              onchange="AEApp.updatePageTranslationMeta('${currentPage.id}', 'title', this.value)"
              placeholder="E.g. ${targetLang === 'sw' ? 'Sehemu 1...' : 'Section 1...'}"
              class="w-full h-8 text-xs bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613] focus:border-[#247B50] focus:outline-none" />
          </div>
        </div>

        <div class="pt-2 border-t border-[#EFEFEF] space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#111613]">Question Translations</span>
            <span class="text-[11px] text-[#525B56] tabular-nums">${(currentPage.questions || []).length} questions</span>
          </div>

          <div class="space-y-3">
            ${(currentPage.questions || [])
              .map((q, idx) => {
                const qT = qTransMap[q.id] || {};
                return `
                  <div class="p-2.5 rounded-[6px] border border-[#E4E7E4] bg-[#F8F9F8] space-y-2 text-xs">
                    <div class="font-medium text-[#111613] truncate" title="${AEApp.escapeAttr(q.title)}">
                      <span class="text-[#525B56]">${idx + 1}.</span> ${AEApp.escapeHtml(q.title)}
                    </div>
                    <div>
                      <input type="text"
                        value="${AEApp.escapeAttr(qT.title || '')}"
                        onchange="AEApp.updateQuestionTranslationMeta('${q.id}', 'title', this.value)"
                        placeholder="${langLabel} question title…"
                        class="w-full h-7 text-xs bg-white border border-[#CFD5D0] rounded-[4px] px-2 text-[#111613] focus:border-[#247B50] focus:outline-none" />
                    </div>
                    ${
                      q.helpText
                        ? `<div class="pt-1 border-t border-[#EFEFEF]">
                            <label class="block text-[10px] text-[#525B56] mb-0.5">Help text (${langLabel}):</label>
                            <input type="text"
                              value="${AEApp.escapeAttr(qT.helpText || '')}"
                              onchange="AEApp.updateQuestionTranslationMeta('${q.id}', 'helpText', this.value)"
                              placeholder="${AEApp.escapeAttr(q.helpText)}"
                              class="w-full h-6 text-[11px] bg-white border border-[#CFD5D0] rounded-[4px] px-1.5 text-[#111613] focus:border-[#247B50] focus:outline-none" />
                          </div>`
                        : ''
                    }
                    ${
                      Array.isArray(q.options) && q.options.length > 0
                        ? `<div class="space-y-1 pt-1 border-t border-[#EFEFEF]">
                            <span class="text-[10px] text-[#525B56] font-medium">Options (${langLabel}):</span>
                            ${q.options
                              .map((opt, optIdx) => {
                                const optVal = (qT.options && qT.options[optIdx]) || '';
                                return `
                                  <div class="flex items-center gap-1.5">
                                    <span class="text-[10px] text-[#646E68] w-4 text-center shrink-0">${optIdx + 1}</span>
                                    <input type="text"
                                      value="${AEApp.escapeAttr(optVal)}"
                                      onchange="AEApp.updateQuestionOptionTranslation('${q.id}', ${optIdx}, this.value)"
                                      placeholder="${AEApp.escapeAttr(opt)}"
                                      class="flex-1 min-w-0 h-6 text-[11px] bg-white border border-[#CFD5D0] rounded-[4px] px-1.5 text-[#111613] focus:border-[#247B50] focus:outline-none" />
                                  </div>
                                `;
                              })
                              .join('')}
                          </div>`
                        : ''
                    }
                    ${
                      Array.isArray(q.rows) && q.rows.length > 0
                        ? `<div class="space-y-1 pt-1 border-t border-[#EFEFEF]">
                            <span class="text-[10px] text-[#525B56] font-medium">Matrix Rows (${langLabel}):</span>
                            ${q.rows
                              .map((row, rowIdx) => {
                                const rowVal = (qT.rows && qT.rows[rowIdx]) || '';
                                return `
                                  <div class="flex items-center gap-1.5">
                                    <span class="text-[10px] text-[#646E68] w-4 text-center shrink-0">${rowIdx + 1}</span>
                                    <input type="text"
                                      value="${AEApp.escapeAttr(rowVal)}"
                                      onchange="AEApp.updateQuestionMatrixRowTranslation('${q.id}', ${rowIdx}, this.value)"
                                      placeholder="${AEApp.escapeAttr(row)}"
                                      class="flex-1 min-w-0 h-6 text-[11px] bg-white border border-[#CFD5D0] rounded-[4px] px-1.5 text-[#111613] focus:border-[#247B50] focus:outline-none" />
                                  </div>
                                `;
                              })
                              .join('')}
                          </div>`
                        : ''
                    }
                    ${
                      Array.isArray(q.columns) && q.columns.length > 0
                        ? `<div class="space-y-1 pt-1 border-t border-[#EFEFEF]">
                            <span class="text-[10px] text-[#525B56] font-medium">Matrix Columns (${langLabel}):</span>
                            ${q.columns
                              .map((col, colIdx) => {
                                const colVal = (qT.columns && qT.columns[colIdx]) || '';
                                return `
                                  <div class="flex items-center gap-1.5">
                                    <span class="text-[10px] text-[#646E68] w-4 text-center shrink-0">${colIdx + 1}</span>
                                    <input type="text"
                                      value="${AEApp.escapeAttr(colVal)}"
                                      onchange="AEApp.updateQuestionMatrixColTranslation('${q.id}', ${colIdx}, this.value)"
                                      placeholder="${AEApp.escapeAttr(col)}"
                                      class="flex-1 min-w-0 h-6 text-[11px] bg-white border border-[#CFD5D0] rounded-[4px] px-1.5 text-[#111613] focus:border-[#247B50] focus:outline-none" />
                                  </div>
                                `;
                              })
                              .join('')}
                          </div>`
                        : ''
                    }
                  </div>
                `;
              })
              .join('')}
          </div>
        </div>
      </div>
    `;
  },

  renderQuestionEditorCard(survey, page, q, qIdx, qNumMap = {}) {
    const typeMeta = QUESTION_TYPES_CATALOG.find((t) => t.type === q.type) || {
      label: q.type,
      icon: 'fa-circle-question'
    };
    const logic = q.logic || { enabled: false, condition: 'equals', value: '', target: '' };
    const displayRule = q.displayRule || {
      enabled: false,
      sourceQuestionId: q.parentQuestionId || '',
      mode: 'any_answer',
      value: ''
    };
    const parentQ = q.parentQuestionId
      ? ((page.questions || []).find((item) => item.id === q.parentQuestionId) ||
         (survey.pages || []).flatMap((p) => p.questions || []).find((item) => item.id === q.parentQuestionId) ||
         null)
      : null;
    const numInfo = (qNumMap && qNumMap[q.id]) || { label: String(qIdx + 1), isSub: false };

    const isIndependent = !q.parentQuestionId;
    const dragAttrs = isIndependent
      ? `draggable="true"
        ondragstart="AEBuilder.handleQuestionDragStart(event, '${q.id}')"
        ondragover="AEBuilder.handleQuestionDragOver(event, '${q.id}')"
        ondragleave="AEBuilder.handleQuestionDragLeave(event, '${q.id}')"
        ondrop="AEBuilder.handleQuestionDrop(event, '${q.id}')"
        ondragend="AEBuilder.handleQuestionDragEnd(event)"`
      : '';

    return `
      <div id="builder_q_${q.id}" ${dragAttrs} class="bg-white border ${
        q.parentQuestionId ? 'border-[#E4E7E4] border-l-[3px] border-l-[#247B50] ml-3 sm:ml-6 bg-[#FAFBF9]' : 'border-[#E4E7E4]'
      } rounded-[10px] p-5 sm:p-6 ae-card-hover transition-colors duration-150">
        <!-- Top Row: Question Number, Quiet Type Label, Required Toggle & Actions -->
        <div class="flex flex-wrap items-center justify-between gap-2 pb-3.5 mb-4 border-b border-[#EFEFEF]">
          <div class="flex items-center gap-2.5 flex-wrap">
            ${
              isIndependent
                ? `<span title="Drag to reorder" class="cursor-grab text-[#9CA69F] hover:text-[#111613] px-1"><i class="fa-solid fa-grip-vertical text-xs"></i></span>`
                : ''
            }
            <span class="inline-flex items-center justify-center px-2 py-0.5 rounded-[5px] ${
              q.parentQuestionId ? 'bg-[#247B50]' : 'bg-[#141A17]'
            } text-white text-xs font-semibold tabular-nums">
              Q${numInfo.label}
            </span>
            <span class="inline-flex items-center gap-1.5 text-xs font-medium text-[#525B56]">
              <i class="fa-solid ${typeMeta.icon} text-[#247B50] text-[11px]"></i>
              <span>${typeMeta.label}</span>
            </span>
            ${
              q.parentQuestionId
                ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#DCFAE5]/80 text-[#04250E] text-[11px] font-medium">
                    Part ${AEApp.escapeHtml(numInfo.letter || 'b')} of Q${numInfo.mainNum}
                  </span>`
                : ''
            }
            ${
              q.parentQuestionId && displayRule.enabled
                ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1E40AF] text-[11px] font-medium">
                    <i class="fa-solid fa-eye text-[10px]"></i> Conditional
                  </span>`
                : ''
            }
            ${
              logic.enabled
                ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#92400E] text-[11px] font-medium">
                    <i class="fa-solid fa-code-branch text-[10px]"></i> Branching
                  </span>`
                : ''
            }
          </div>

          <div class="flex items-center gap-1">
            <label class="inline-flex items-center gap-1.5 text-xs font-medium text-[#525B56] cursor-pointer mr-2 select-none">
              <input type="checkbox" ${q.required ? 'checked' : ''}
                onchange="AEApp.updateQuestionField('${q.id}', 'required', this.checked)"
                class="accent-[#247B50] w-3.5 h-3.5" />
              <span>Required</span>
            </label>

            <button onclick="AEApp.moveQuestion('${q.id}', -1)" title="Move up" aria-label="Move Question Up"
              class="w-7 h-7 rounded-[6px] text-[#646E68] hover:text-[#111613] hover:bg-[#F4F6F4] flex items-center justify-center text-xs transition-colors">
              <i class="fa-solid fa-arrow-up"></i>
            </button>
            <button onclick="AEApp.moveQuestion('${q.id}', 1)" title="Move down" aria-label="Move Question Down"
              class="w-7 h-7 rounded-[6px] text-[#646E68] hover:text-[#111613] hover:bg-[#F4F6F4] flex items-center justify-center text-xs transition-colors">
              <i class="fa-solid fa-arrow-down"></i>
            </button>
            <button onclick="AEApp.saveQuestionToLibrary('${q.id}')" title="Save to reusable Question Library" aria-label="Save to Library"
              class="w-7 h-7 rounded-[6px] text-[#646E68] hover:text-[#247B50] hover:bg-[#F3FBF6] flex items-center justify-center text-xs transition-colors">
              <i class="fa-regular fa-bookmark"></i>
            </button>
            <button onclick="AEApp.duplicateQuestion('${q.id}')" title="Duplicate question" aria-label="Duplicate Question"
              class="w-7 h-7 rounded-[6px] text-[#646E68] hover:text-[#247B50] hover:bg-[#F4F6F4] flex items-center justify-center text-xs transition-colors">
              <i class="fa-regular fa-copy"></i>
            </button>
            <button onclick="AEApp.deleteQuestion('${q.id}')" title="Delete question" aria-label="Delete Question"
              class="w-7 h-7 rounded-[6px] text-[#646E68] hover:text-[#C4242A] hover:bg-[#FFEDEA] flex items-center justify-center text-xs transition-colors">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
        </div>

        <!-- Primary Star: Question Prompt & Helper Text -->
        <div class="space-y-2.5 mb-4">
          <input type="text"
            id="ae_q_title_${q.id}"
            maxlength="220"
            aria-label="Question ${qIdx + 1} Prompt"
            value="${AEApp.escapeAttr(q.title)}"
            onchange="AEApp.updateQuestionField('${q.id}', 'title', this.value)"
            class="w-full h-11 text-[15px] font-semibold text-[#111613] bg-white border border-[#CFD5D0] rounded-[8px] px-3.5 focus:border-[#247B50] focus:ring-2 focus:ring-[#247B50]/15 focus:outline-none transition-colors"
            placeholder="Write your question here…" />

          <input type="text"
            id="ae_q_help_${q.id}"
            maxlength="240"
            aria-label="Question ${qIdx + 1} Helper Text"
            value="${AEApp.escapeAttr(q.helpText || '')}"
            onchange="AEApp.updateQuestionField('${q.id}', 'helpText', this.value)"
            class="w-full h-8 text-xs text-[#525B56] bg-transparent border border-transparent hover:border-[#E4E7E4] focus:bg-white focus:border-[#247B50] rounded-[6px] px-2.5 focus:outline-none transition-colors"
            placeholder="Add optional guidance or hint for respondents…" />
        </div>

        <!-- Type-Specific Options / Settings Editor -->
        <div class="bg-[#F8F9F8]/80 border border-[#EAECE9] rounded-[8px] p-4 min-w-0">
          ${this.renderQuestionTypeConfig(q, survey)}
        </div>

        <!-- Quiet Secondary Controls: Piping, Visibility, Skip Logic & Append -->
        <div class="mt-4 pt-3.5 border-t border-[#EFEFEF] space-y-2.5 text-xs">
          ${
            (survey.pages || []).flatMap((p) => p.questions || []).filter((item) => item.id !== q.id).length > 0
              ? `<!-- Answer Piping Strip -->
          <div class="flex flex-wrap items-center justify-between gap-2 text-[#525B56]">
            <span class="inline-flex items-center gap-1.5">
              <i class="fa-solid fa-link text-[#646E68] text-[10px]"></i>
              <span>Recall a prior answer</span>
            </span>
            <select aria-label="Insert piped variable"
              onchange="if(this.value){ AEBuilder.insertPipedVariable('${q.id}', this.value); this.value=''; }"
              class="h-7 px-2.5 text-xs font-medium text-[#111613] bg-white border border-[#CFD5D0] rounded-[6px] focus:outline-none focus:border-[#247B50] hover:border-[#247B50] transition-colors">
              <option value="">+ Insert prior answer…</option>
              ${(survey.pages || [])
                .flatMap((p) => p.questions || [])
                .filter((item) => item.id !== q.id)
                .map(
                  (pq) =>
                    `<option value="{{${pq.id}}}">${AEApp.escapeHtml(pq.title.substring(0, 32))}</option>`
                )
                .join('')}
            </select>
          </div>`
              : ''
          }

          ${
            q.parentQuestionId
              ? `<!-- Conditional Visibility (Show Part b only when…) -->
          <div class="pt-2.5 border-t border-[#EFEFEF] flex flex-wrap items-center justify-between gap-2.5">
            <label class="inline-flex items-center gap-2 text-xs font-medium text-[#111613] cursor-pointer">
              <input type="checkbox" ${displayRule.enabled ? 'checked' : ''}
                onchange="AEApp.updateQuestionDisplayRule('${q.id}', 'enabled', this.checked)"
                class="accent-[#247B50] w-3.5 h-3.5" />
              <span>Show Part ${AEApp.escapeHtml(numInfo.letter || 'b')} only when…</span>
            </label>

            ${
              displayRule.enabled
                ? `<div class="flex flex-wrap items-center gap-2 text-xs">
                    <select aria-label="Conditional visibility mode"
                      onchange="AEApp.updateQuestionDisplayRule('${q.id}', 'mode', this.value)"
                      class="bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 h-7 text-xs font-medium text-[#111613] focus:outline-none focus:border-[#247B50]">
                      <option value="any_answer" ${(displayRule.mode || 'any_answer') === 'any_answer' ? 'selected' : ''}>Parent is answered</option>
                      <option value="equals" ${displayRule.mode === 'equals' ? 'selected' : ''}>Parent equals</option>
                      <option value="not_equals" ${displayRule.mode === 'not_equals' ? 'selected' : ''}>Parent does not equal</option>
                    </select>
                    ${
                      displayRule.mode === 'equals' || displayRule.mode === 'not_equals'
                        ? parentQ && Array.isArray(parentQ.options) && parentQ.options.length > 0
                          ? `<select aria-label="Conditional visibility trigger value"
                              onchange="AEApp.updateQuestionDisplayRule('${q.id}', 'value', this.value)"
                              class="bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 h-7 text-xs font-medium text-[#111613] max-w-[220px] truncate focus:outline-none focus:border-[#247B50]">
                              <option value="">Choose parent option…</option>
                              ${parentQ.options
                                .map(
                                  (opt) =>
                                    `<option value="${AEApp.escapeAttr(opt)}" ${displayRule.value === opt ? 'selected' : ''}>${AEApp.escapeHtml(opt)}</option>`
                                )
                                .join('')}
                            </select>`
                          : `<input type="text"
                              aria-label="Conditional visibility trigger value"
                              maxlength="140"
                              value="${AEApp.escapeAttr(displayRule.value || '')}"
                              onchange="AEApp.updateQuestionDisplayRule('${q.id}', 'value', this.value)"
                              placeholder="Expected answer…"
                              class="bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 h-7 text-xs text-[#111613] w-44 focus:outline-none focus:border-[#247B50]" />`
                        : ''
                    }
                  </div>`
                : `<span class="text-[11px] text-[#646E68]">Always shown under Q${numInfo.mainNum || ''}</span>`
            }
          </div>`
              : ''
          }

          <!-- Skip Logic / Branching Strip -->
          <div class="pt-2.5 border-t border-[#EFEFEF] flex flex-wrap items-center justify-between gap-2.5">
            <label class="inline-flex items-center gap-2 text-xs font-medium text-[#525B56] cursor-pointer">
              <input type="checkbox" ${logic.enabled ? 'checked' : ''}
                onchange="AEApp.updateQuestionLogic('${q.id}', 'enabled', this.checked)"
                class="accent-[#247B50] w-3.5 h-3.5" />
              <span>Skip to another page based on answer</span>
            </label>

            ${
              logic.enabled
                ? `<div class="flex flex-wrap items-center gap-2 text-xs">
                    <span class="text-[#525B56]">If answer is</span>
                    ${
                      Array.isArray(q.options) && q.options.length > 0
                        ? `<select aria-label="Skip rule trigger value"
                            onchange="AEApp.updateQuestionLogic('${q.id}', 'value', this.value)"
                            class="bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 h-7 text-xs font-medium text-[#111613] max-w-[220px] truncate focus:outline-none focus:border-[#247B50]">
                            <option value="">Choose option…</option>
                            ${q.options
                              .map(
                                (opt) =>
                                  `<option value="${AEApp.escapeAttr(opt)}" ${logic.value === opt ? 'selected' : ''}>${AEApp.escapeHtml(opt)}</option>`
                              )
                              .join('')}
                          </select>`
                        : `<input type="text"
                            aria-label="Skip rule trigger value"
                            maxlength="120"
                            value="${AEApp.escapeAttr(logic.value || '')}"
                            onchange="AEApp.updateQuestionLogic('${q.id}', 'value', this.value)"
                            placeholder="Answer value…"
                            class="bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 h-7 text-xs text-[#111613] w-44 focus:outline-none focus:border-[#247B50]" />`
                    }
                    <span class="text-[#525B56]">go to</span>
                    <select aria-label="Skip rule target page"
                      onchange="AEApp.updateQuestionLogic('${q.id}', 'target', this.value)"
                      class="bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 h-7 text-xs font-medium text-[#111613] focus:outline-none focus:border-[#247B50]">
                      <option value="">Choose destination…</option>
                      ${survey.pages
                        .map((p, idx) =>
                          idx > this.activePageIndex || logic.target === p.id
                            ? `<option value="${p.id}" ${logic.target === p.id ? 'selected' : ''}>Page ${idx + 1}: ${AEApp.escapeHtml(p.title.substring(0, 25))}</option>`
                            : ''
                        )
                        .join('')}
                      <option value="END_SURVEY" ${logic.target === 'END_SURVEY' ? 'selected' : ''}>End of survey (Submit)</option>
                    </select>
                  </div>`
                : ''
            }
          </div>

          <!-- Append Question & Parent Grouping Strip -->
          <div class="pt-2.5 border-t border-[#EFEFEF] flex flex-wrap items-center justify-between gap-2.5">
            <div class="flex flex-wrap items-center gap-2">
              ${!q.parentQuestionId ? `<button type="button" onclick="AEApp.appendSubQuestion('${q.id}', 'short_text')"
                title="Add a follow-up question (Part b) directly under Q${numInfo.label}"
                class="h-7 px-2.5 rounded-[6px] bg-white hover:bg-[#DCFAE5]/60 text-[#04250E] border border-[#CFD5D0] hover:border-[#247B50] text-xs font-medium inline-flex items-center gap-1.5 ae-press transition-colors">
                <i class="fa-solid fa-turn-down text-[10px] text-[#247B50]"></i>
                <span>Add follow-up (Part b)</span>
              </button>` : ''}

              <div class="inline-flex items-center rounded-[6px] border border-[#CFD5D0] bg-white overflow-hidden">
                <button type="button" onclick="AEApp.appendQuestionAfter('${q.id}', 'short_text')"
                  title="Insert a new question below Q${numInfo.label}"
                  class="h-7 px-2.5 hover:bg-[#F4F6F4] text-xs font-medium text-[#111613] inline-flex items-center gap-1.5 ae-press transition-colors">
                  <i class="fa-solid fa-plus text-[10px] text-[#247B50]"></i>
                  <span>Add question below</span>
                </button>
                <select aria-label="Select type for appended question"
                  onchange="if(this.value){ AEApp.appendQuestionAfter('${q.id}', this.value); this.value=''; }"
                  class="h-7 px-2 text-xs text-[#525B56] bg-[#F8F9F8] border-l border-[#CFD5D0] hover:bg-white focus:outline-none cursor-pointer">
                  <option value="">Type…</option>
                  ${QUESTION_TYPES_CATALOG.map((t) => `<option value="${t.type}">${t.label}</option>`).join('')}
                </select>
              </div>
            </div>

            <!-- Parent Question Attachment Linker -->
            <div class="flex items-center gap-1.5 text-xs">
              <span class="text-[#646E68] text-[11px]">Grouped under:</span>
              <select aria-label="Attach under parent question"
                onchange="AEApp.setQuestionParent('${q.id}', this.value)"
                class="h-7 px-2 text-xs font-medium ${
                  q.parentQuestionId ? 'text-[#04250E] bg-[#DCFAE5]/50 border-[#247B50]' : 'text-[#525B56] bg-white border-[#CFD5D0]'
                } rounded-[6px] border focus:outline-none max-w-[210px] truncate">
                <option value="">None (standalone)</option>
                ${(page.questions || [])
                  .filter((other) => other.id !== q.id && !other.parentQuestionId)
                  .map(
                    (parent) =>
                      `<option value="${parent.id}" ${q.parentQuestionId === parent.id ? 'selected' : ''}>Under: ${AEApp.escapeHtml(
                        (parent.title || 'Question').substring(0, 24)
                      )}…</option>`
                  )
                  .join('')}
              </select>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderQuestionTypeConfig(q, survey = null) {
    const allSurveyQuestions = survey && Array.isArray(survey.pages)
      ? survey.pages.flatMap((p) => p.questions || [])
      : [];
    const numericPeerQuestions = allSurveyQuestions.filter(
      (item) =>
        item &&
        item.id !== q.id &&
        (item.type === 'number_yield' || item.type === 'calculated' || item.type === 'star_rating' || item.type === 'nps')
    );

    if (q.type === 'multiple_choice' || q.type === 'checkboxes' || q.type === 'dropdown') {
      const options = Array.isArray(q.options) ? q.options : [];
      const activeS = window.aeStore && window.AEApp ? window.aeStore.getSurveyById(window.AEApp.activeSurveyId) : null;
      const scoringOn = Boolean(activeS && activeS.scoring && activeS.scoring.enabled);
      const ptsMap = (q.optionPoints && typeof q.optionPoints === 'object') ? q.optionPoints : {};
      return `
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-[#525B56] tabular-nums">Answer choices (${options.length})${scoringOn ? ' · Points enabled' : ''}</span>
            <button onclick="AEApp.addQuestionOption('${q.id}')"
              class="text-xs font-medium text-[#247B50] hover:underline inline-flex items-center gap-1">
              <i class="fa-solid fa-plus text-[10px]"></i> Add choice
            </button>
          </div>
          <div class="space-y-1.5">
            ${options
              .map(
                (opt, idx) => `
              <div class="flex items-center gap-2 min-w-0">
                <i class="fa-regular ${
                  q.type === 'multiple_choice'
                    ? 'fa-circle'
                    : q.type === 'checkboxes'
                    ? 'fa-square'
                    : 'fa-circle-dot'
                } text-xs text-[#646E68] shrink-0"></i>
                <input type="text"
                  maxlength="140"
                  aria-label="Choice ${idx + 1}"
                  value="${AEApp.escapeAttr(opt)}"
                  onchange="AEApp.updateQuestionOption('${q.id}', ${idx}, this.value)"
                  class="flex-1 min-w-0 h-8 text-xs bg-white border border-[#CFD5D0] rounded-[5px] px-2.5 text-[#111613] focus:outline-none focus:border-[#247B50]" />
                ${
                  scoringOn
                    ? `<input type="number" min="0" step="1" value="${ptsMap[opt] !== undefined ? Number(ptsMap[opt]) : ''}"
                        placeholder="pts" title="Point value for this option"
                        onchange="AEApp.updateQuestionOptionPoints('${q.id}', '${AEApp.escapeAttr(AEApp.escapeJs(opt))}', this.value)"
                        class="w-16 h-8 text-xs text-right bg-[#F3FBF6] border border-[#247B50]/40 rounded-[5px] px-2 tabular-nums text-[#04250E]" />`
                    : ''
                }
                ${
                  options.length > 1
                    ? `<button onclick="AEApp.removeQuestionOption('${q.id}', ${idx})"
                        class="text-xs text-[#646E68] hover:text-[#C4242A] px-1.5 shrink-0" aria-label="Remove Option ${idx + 1}">
                        <i class="fa-solid fa-xmark"></i>
                      </button>`
                    : ''
                }
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `;
    }

    if (q.type === 'matrix') {
      const rows = Array.isArray(q.rows) ? q.rows : [];
      const cols = Array.isArray(q.columns) ? q.columns : ['Poor', 'Fair', 'Good', 'Excellent'];
      return `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="ae_q_rows_${q.id}" class="block text-xs font-medium text-[#525B56] mb-1">Row statements (one per line)</label>
            <textarea id="ae_q_rows_${q.id}" rows="4"
              onchange="AEApp.updateQuestionLines('${q.id}', 'rows', this.value)"
              class="w-full text-xs bg-white border border-[#CFD5D0] rounded-[6px] p-2.5 text-[#111613] focus:outline-none focus:border-[#247B50]">${AEApp.escapeHtml(rows.join('\n'))}</textarea>
          </div>
          <div>
            <label for="ae_q_cols_${q.id}" class="block text-xs font-medium text-[#525B56] mb-1">Scale columns (one per line)</label>
            <textarea id="ae_q_cols_${q.id}" rows="4"
              onchange="AEApp.updateQuestionLines('${q.id}', 'columns', this.value)"
              class="w-full text-xs bg-white border border-[#CFD5D0] rounded-[6px] p-2.5 text-[#111613] focus:outline-none focus:border-[#247B50]">${AEApp.escapeHtml(cols.join('\n'))}</textarea>
          </div>
        </div>
      `;
    }

    if (q.type === 'number_yield') {
      const rule = q.consistencyRule || { enabled: false, operator: '<=', compareQuestionId: '', message: '' };
      return `
        <div class="space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label for="ae_q_unit_${q.id}" class="block text-xs font-medium text-[#525B56] mb-1">Measurement Unit</label>
              <input id="ae_q_unit_${q.id}" type="text" maxlength="32" value="${AEApp.escapeAttr(q.unit || 'units')}"
                onchange="AEApp.updateQuestionField('${q.id}', 'unit', this.value)"
                placeholder="e.g. units, USD, KES, kg, %, hours"
                class="w-full h-8 text-xs bg-white border border-[#CFD5D0] rounded-[5px] px-2.5 text-[#111613]" />
              <div class="flex flex-wrap gap-1 mt-1.5">
                <button type="button" onclick="AEApp.updateQuestionField('${q.id}', 'unit', 'units')" class="px-1.5 py-0.5 rounded text-[10px] bg-white border border-[#CFD5D0] text-[#525B56] hover:text-[#111613] hover:border-[#247B50]">units</button>
                <button type="button" onclick="AEApp.updateQuestionField('${q.id}', 'unit', 'USD ($)')" class="px-1.5 py-0.5 rounded text-[10px] bg-white border border-[#CFD5D0] text-[#525B56] hover:text-[#111613] hover:border-[#247B50]">USD</button>
                <button type="button" onclick="AEApp.updateQuestionField('${q.id}', 'unit', 'KES')" class="px-1.5 py-0.5 rounded text-[10px] bg-white border border-[#CFD5D0] text-[#525B56] hover:text-[#111613] hover:border-[#247B50]">KES</button>
                <button type="button" onclick="AEApp.updateQuestionField('${q.id}', 'unit', '%')" class="px-1.5 py-0.5 rounded text-[10px] bg-white border border-[#CFD5D0] text-[#525B56] hover:text-[#111613] hover:border-[#247B50]">%</button>
                <button type="button" onclick="AEApp.updateQuestionField('${q.id}', 'unit', 'hours')" class="px-1.5 py-0.5 rounded text-[10px] bg-white border border-[#CFD5D0] text-[#525B56] hover:text-[#111613] hover:border-[#247B50]">hours</button>
                <button type="button" onclick="AEApp.updateQuestionField('${q.id}', 'unit', 'kg/acre')" class="px-1.5 py-0.5 rounded text-[10px] bg-white border border-[#CFD5D0] text-[#525B56] hover:text-[#111613] hover:border-[#247B50]">kg/acre</button>
              </div>
            </div>
            <div>
              <label for="ae_q_min_${q.id}" class="block text-xs font-medium text-[#525B56] mb-1">Minimum Value</label>
              <input id="ae_q_min_${q.id}" type="number" value="${q.min ?? 0}"
                onchange="AEApp.updateQuestionField('${q.id}', 'min', Number(this.value))"
                class="w-full h-8 text-xs bg-white border border-[#CFD5D0] rounded-[5px] px-2.5 tabular-nums text-[#111613]" />
            </div>
            <div>
              <label for="ae_q_max_${q.id}" class="block text-xs font-medium text-[#525B56] mb-1">Maximum Value</label>
              <input id="ae_q_max_${q.id}" type="number" value="${q.max ?? 10000}"
                onchange="AEApp.updateQuestionField('${q.id}', 'max', Number(this.value))"
                class="w-full h-8 text-xs bg-white border border-[#CFD5D0] rounded-[5px] px-2.5 tabular-nums text-[#111613]" />
            </div>
          </div>

          <!-- Consistency Rule Strip -->
          <div class="pt-2.5 border-t border-[#E4E7E4] space-y-2 text-xs">
            <label class="inline-flex items-center gap-2 font-medium text-[#111613] cursor-pointer">
              <input type="checkbox" ${rule.enabled ? 'checked' : ''}
                onchange="AEApp.updateQuestionConsistencyRule('${q.id}', 'enabled', this.checked)"
                class="accent-[#247B50] w-3.5 h-3.5" />
              <span>Consistency Rule <span class="text-[11px] font-normal text-[#525B56]">(cross-check against another numeric question)</span></span>
            </label>
            ${
              rule.enabled
                ? `<div class="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <select aria-label="Consistency operator"
                      onchange="AEApp.updateQuestionConsistencyRule('${q.id}', 'operator', this.value)"
                      class="sm:col-span-3 h-7 px-2 text-xs font-medium bg-white border border-[#CFD5D0] rounded-[5px] text-[#111613] focus:outline-none focus:border-[#247B50]">
                      <option value="<=" ${(rule.operator || '<=') === '<=' ? 'selected' : ''}>Must be &lt;=</option>
                      <option value=">=" ${rule.operator === '>=' ? 'selected' : ''}>Must be &gt;=</option>
                      <option value="<" ${rule.operator === '<' ? 'selected' : ''}>Must be &lt;</option>
                      <option value=">" ${rule.operator === '>' ? 'selected' : ''}>Must be &gt;</option>
                      <option value="==" ${rule.operator === '==' ? 'selected' : ''}>Must equal</option>
                      <option value="!=" ${rule.operator === '!=' ? 'selected' : ''}>Must not equal</option>
                    </select>
                    <select aria-label="Comparison numeric question"
                      onchange="AEApp.updateQuestionConsistencyRule('${q.id}', 'compareQuestionId', this.value)"
                      class="sm:col-span-4 h-7 px-2 text-xs font-medium bg-white border border-[#CFD5D0] rounded-[5px] text-[#111613] truncate focus:outline-none focus:border-[#247B50]">
                      <option value="">Select numeric question…</option>
                      ${numericPeerQuestions
                        .map(
                          (nq) =>
                            `<option value="${nq.id}" ${rule.compareQuestionId === nq.id ? 'selected' : ''}>${AEApp.escapeHtml(
                              (nq.title || nq.id).substring(0, 36)
                            )}</option>`
                        )
                        .join('')}
                    </select>
                    <input type="text" maxlength="160"
                      aria-label="Consistency validation message"
                      value="${AEApp.escapeAttr(rule.message || '')}"
                      onchange="AEApp.updateQuestionConsistencyRule('${q.id}', 'message', this.value)"
                      placeholder="Custom error message…"
                      class="sm:col-span-5 h-7 px-2 text-xs bg-white border border-[#CFD5D0] rounded-[5px] text-[#111613] focus:outline-none focus:border-[#247B50]" />
                  </div>`
                : ''
            }
          </div>
        </div>
      `;
    }

    if (q.type === 'calculated') {
      return `
        <div class="space-y-3 text-xs">
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div class="sm:col-span-6">
              <label for="ae_q_formula_${q.id}" class="block text-xs font-medium text-[#525B56] mb-1">
                Formula Expression <span class="text-[10px] text-[#646E68]">(+ - * / ( ) min max round abs floor ceil)</span>
              </label>
              <input id="ae_q_formula_${q.id}" type="text" maxlength="240"
                value="${AEApp.escapeAttr(q.formula || '')}"
                onchange="AEApp.updateQuestionField('${q.id}', 'formula', this.value)"
                placeholder="e.g. {{q_harvest_kg}} / {{q_acres}}"
                class="w-full h-8 text-xs font-mono bg-white border border-[#CFD5D0] rounded-[5px] px-2.5 text-[#111613] focus:outline-none focus:border-[#247B50]" />
            </div>
            <div class="sm:col-span-4">
              <label for="ae_q_calc_unit_${q.id}" class="block text-xs font-medium text-[#525B56] mb-1">Display Unit</label>
              <input id="ae_q_calc_unit_${q.id}" type="text" maxlength="32"
                value="${AEApp.escapeAttr(q.unit || '')}"
                onchange="AEApp.updateQuestionField('${q.id}', 'unit', this.value)"
                placeholder="e.g. kg/acre, %, KES"
                class="w-full h-8 text-xs bg-white border border-[#CFD5D0] rounded-[5px] px-2.5 text-[#111613] focus:outline-none focus:border-[#247B50]" />
            </div>
            <div class="sm:col-span-2">
              <label for="ae_q_calc_dec_${q.id}" class="block text-xs font-medium text-[#525B56] mb-1">Decimals</label>
              <input id="ae_q_calc_dec_${q.id}" type="number" min="0" max="6"
                value="${q.decimals !== undefined ? Number(q.decimals) : 2}"
                onchange="AEApp.updateQuestionField('${q.id}', 'decimals', Math.max(0, Math.min(6, Number(this.value) || 0)))"
                class="w-full h-8 text-xs font-mono bg-white border border-[#CFD5D0] rounded-[5px] px-2 text-[#111613] focus:outline-none focus:border-[#247B50]" />
            </div>
          </div>

          <div class="space-y-1.5">
            <span class="block text-[11px] font-medium text-[#525B56]">Insert numeric question token:</span>
            ${
              numericPeerQuestions.length > 0
                ? `<div class="flex flex-wrap gap-1.5">
                    ${numericPeerQuestions
                      .map(
                        (nq) => `
                      <button type="button"
                        onclick="AEBuilder.insertFormulaToken('${q.id}', '{{${nq.id}}}')"
                        title="${AEApp.escapeAttr(nq.title || nq.id)}"
                        class="px-2 py-1 rounded-[5px] bg-white border border-[#CFD5D0] hover:border-[#247B50] hover:bg-[#DCFAE5]/40 text-[11px] font-mono text-[#111613] inline-flex items-center gap-1 ae-press">
                        <span class="text-[#247B50] font-semibold">{{${AEApp.escapeHtml(nq.id)}}}</span>
                        <span class="font-sans text-[#525B56] max-w-[140px] truncate">${AEApp.escapeHtml((nq.title || '').substring(0, 24))}</span>
                      </button>
                    `
                      )
                      .join('')}
                  </div>`
                : `<p class="text-[11px] text-[#646E68]">Add numeric, rating, or NPS questions to this survey to reference them in formulas.</p>`
            }
          </div>
        </div>
      `;
    }

    if (q.type === 'star_rating') {
      return `
        <div class="flex items-center justify-between text-xs text-[#525B56]">
          <div class="flex items-center gap-1.5 text-[#D97706] text-sm">
            <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
          </div>
          <span>1 to 5 interactive star rating scale</span>
        </div>
      `;
    }

    if (q.type === 'nps') {
      return `
        <div class="space-y-1.5">
          <div class="grid grid-cols-11 gap-1 text-center tabular-nums text-xs">
            ${Array.from({ length: 11 }, (_, i) => i)
              .map(
                (n) => `
              <div class="py-1.5 rounded-[4px] border border-[#E4E7E4] bg-white font-medium text-[#111613]">${n}</div>
            `
              )
              .join('')}
          </div>
          <div class="flex justify-between text-xs text-[#525B56]">
            <span>0–6: Detractors</span>
            <span>7–8: Passives</span>
            <span>9–10: Promoters</span>
          </div>
        </div>
      `;
    }

    if (q.type === 'gps_location') {
      return `
        <div class="flex items-center justify-between text-xs text-[#525B56]">
          <span class="inline-flex items-center gap-2 font-medium text-[#111613]">
            <i class="fa-solid fa-satellite-dish text-[#247B50]"></i>
            Captures Latitude, Longitude, Satellite Accuracy (±m), and Village Landmark
          </span>
          <span class="text-xs bg-white px-2 py-0.5 rounded-[4px] border border-[#E4E7E4] text-[#247B50] font-medium">Offline GPS ready</span>
        </div>
      `;
    }

    if (q.type === 'signature') {
      return `
        <div class="p-3 bg-[#F8F9F8] border border-[#E4E7E4] rounded-[6px] text-xs text-[#525B56] flex items-center justify-between gap-3">
          <div class="flex items-center gap-2 font-medium text-[#111613]">
            <i class="fa-solid fa-signature text-[#247B50] text-sm"></i>
            <span>Touchscreen / Stylus Digital Signature Canvas</span>
          </div>
          <span class="text-xs bg-white px-2 py-0.5 rounded-[4px] border border-[#E4E7E4] text-[#247B50] font-medium">Vector PNG</span>
        </div>
      `;
    }

    if (q.type === 'photo_proof') {
      return `
        <div class="p-3 bg-[#F8F9F8] border border-[#E4E7E4] rounded-[6px] text-xs text-[#525B56] flex items-center justify-between gap-3">
          <div class="flex items-center gap-2 font-medium text-[#111613]">
            <i class="fa-solid fa-camera text-[#247B50] text-sm"></i>
            <span>Camera Proof Capture (Auto-compressed to &le;150KB JPEG for IndexedDB)</span>
          </div>
          <span class="text-xs bg-white px-2 py-0.5 rounded-[4px] border border-[#E4E7E4] text-[#247B50] font-medium">1024px downscaled</span>
        </div>
      `;
    }

    if (q.type === 'cascading_dropdown') {
      const levels = Array.isArray(q.levels) ? q.levels : ['County', 'Sub-County', 'Ward'];
      return `
        <div class="space-y-2 text-xs text-[#525B56]">
          <div class="flex items-center justify-between font-semibold text-[#111613]">
            <span class="flex items-center gap-1.5"><i class="fa-solid fa-sitemap text-[#247B50]"></i> Cascading Hierarchy Levels</span>
            <span class="text-[11px] font-normal text-[#646E68]">3-Tier Dynamic Filter</span>
          </div>
          <div class="grid grid-cols-3 gap-2">
            ${levels
              .map(
                (lvl, idx) => `
              <div class="p-2 bg-white border border-[#E4E7E4] rounded-[5px] text-center">
                <div class="text-[10px] text-[#646E68]">Level ${idx + 1}</div>
                <div class="font-medium text-[#111613] truncate">${AEApp.escapeHtml(lvl)}</div>
              </div>
            `
              )
              .join('')}
          </div>
          <p class="text-[11px] text-[#525B56]">Pre-loaded with Kenya agro-ecological zones (Nakuru, Machakos, Kakamega, Uasin Gishu).</p>
        </div>
      `;
    }

    if (q.type === 'barcode_scanner') {
      return `
        <div class="p-3 bg-white border border-[#E4E7E4] rounded-[6px] text-xs text-[#525B56] flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2 font-medium text-[#111613]">
            <i class="fa-solid fa-barcode text-[#247B50] text-sm"></i>
            <span>Camera barcode &amp; QR scanner</span>
          </div>
          <span class="px-2 py-0.5 rounded bg-[#DCFAE5] text-[#04250E] text-[11px] font-medium">Camera + manual entry</span>
        </div>
      `;
    }

    if (q.type === 'audio_note') {
      return `
        <div class="p-3 bg-white border border-[#E4E7E4] rounded-[6px] text-xs text-[#525B56] flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2 font-medium text-[#111613]">
            <i class="fa-solid fa-microphone text-[#247B50] text-sm"></i>
            <span>Voice note recording</span>
          </div>
          <span class="px-2 py-0.5 rounded bg-[#F4F6F4] text-[#525B56] text-[11px] font-medium">Up to 2 min · Saved offline</span>
        </div>
      `;
    }

    if (q.type === 'repeat_group') {
      const fields = Array.isArray(q.fields)
        ? q.fields
        : [
            { id: 'variety_name', label: 'Variety Name / Code' },
            { id: 'stock_bags', label: 'Stock On-Hand (Packs)' },
            { id: 'lot_number', label: 'Lot / Batch No.' },
            { id: 'price_kes', label: 'Retail Price (KES)' }
          ];
      return `
        <div class="space-y-2 text-xs text-[#525B56]">
          <div class="flex items-center justify-between font-semibold text-[#111613]">
            <span class="flex items-center gap-1.5"><i class="fa-solid fa-layer-group text-[#247B50]"></i> Multi-Row Roster Schema (${fields.length} columns)</span>
            <span class="text-[11px] text-[#247B50] font-medium">+ Add Row in Field</span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            ${fields
              .map(
                (f) => `
              <div class="p-2 bg-white border border-[#E4E7E4] rounded-[5px] text-center">
                <div class="font-medium text-[#111613] truncate">${AEApp.escapeHtml(f.label)}</div>
                <div class="text-[10px] text-[#646E68]">${f.id}</div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `;
    }

    return `
      <div class="text-xs text-[#525B56]">
        Answer field (${q.type.replace(/_/g, ' ')}).
      </div>
    `;
  },

  insertPipedVariable(qId, token) {
    const input = document.getElementById(`ae_q_title_${qId}`);
    if (input) {
      input.value = (input.value ? input.value + ' ' : '') + token;
      window.AEApp.updateQuestionField(qId, 'title', input.value);
    }
  },

  insertFormulaToken(qId, token) {
    const input = document.getElementById(`ae_q_formula_${qId}`);
    if (input) {
      const current = input.value || '';
      const sep = current && !/\s$/.test(current) ? ' ' : '';
      input.value = current + sep + token;
      window.AEApp.updateQuestionField(qId, 'formula', input.value);
    }
  }
};
