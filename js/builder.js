/**
 * ============================================================================
 * AE SURVEY — Stage 2: Design Survey (AE Survey Builder Module)
 * Supports 11 Question Types, Multi-Page Sections, Conditional Skip Logic,
 * Theme Customization, and Schema Export.
 * ============================================================================
 */

const QUESTION_TYPES_CATALOG = [
  { type: 'multiple_choice', label: 'Multiple Choice', icon: 'fa-circle-dot', group: 'Choice questions' },
  { type: 'checkboxes', label: 'Checkboxes', icon: 'fa-square-check', group: 'Choice questions' },
  { type: 'dropdown', label: 'Dropdown Menu', icon: 'fa-caret-down', group: 'Choice questions' },
  { type: 'cascading_dropdown', label: 'Cascading / Dependent Select', icon: 'fa-sitemap', group: 'Choice questions' },
  { type: 'star_rating', label: 'Star Rating (1–5)', icon: 'fa-star', group: 'Ratings & scales' },
  { type: 'nps', label: 'Net Promoter Score (0–10)', icon: 'fa-gauge-high', group: 'Ratings & scales' },
  { type: 'matrix', label: 'Matrix / Likert Grid', icon: 'fa-table-cells', group: 'Ratings & scales' },
  { type: 'number_yield', label: 'Numerical / Yield Metric', icon: 'fa-scale-balanced', group: 'Agri & field telemetry' },
  { type: 'gps_location', label: 'GPS Plot Coordinates', icon: 'fa-location-crosshairs', group: 'Agri & field telemetry' },
  { type: 'barcode_scanner', label: 'Optical Barcode / KEPHIS QR', icon: 'fa-barcode', group: 'Agri & field telemetry' },
  { type: 'signature', label: 'Farmer / Dealer Signature', icon: 'fa-signature', group: 'Agri & field telemetry' },
  { type: 'photo_proof', label: 'Photo Proof / Field Camera', icon: 'fa-camera', group: 'Agri & field telemetry' },
  { type: 'audio_note', label: 'Audio Note / Voice Testimony', icon: 'fa-microphone', group: 'Agri & field telemetry' },
  { type: 'repeat_group', label: 'Repeat Roster (Multi-variety/plot)', icon: 'fa-layer-group', group: 'Agri & field telemetry' },
  { type: 'date_time', label: 'Date / Season Picker', icon: 'fa-calendar-day', group: 'Agri & field telemetry' },
  { type: 'short_text', label: 'Single-Line Text', icon: 'fa-font', group: 'Open text' },
  { type: 'long_text', label: 'Multi-Line Field Notes', icon: 'fa-align-left', group: 'Open text' }
];

window.QUESTION_TYPES_CATALOG = QUESTION_TYPES_CATALOG;

window.AEBuilder = {
  activePageIndex: 0,
  selectedQuestionId: null,
  leftTab: 'questions', // 'questions' | 'translations' | 'theme'
  targetLang: 'sw', // 'sw' | 'fr'

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
          title: 'Which primary crop or seed variety did you plant this season?',
          helpText: 'Select one option.',
          options: ['Certified Hybrid Seed', 'Improved Open-Pollinated Variety (OPV)', 'Local Farm-Saved Seed']
        };
      case 'checkboxes':
        return {
          ...base,
          title: 'Which agronomic practices or inputs were applied on this plot?',
          helpText: 'Select all that apply.',
          options: ['Basal Planting Fertilizer (DAP/NPK)', 'Top-Dressing Fertilizer (CAN/Urea)', 'Organic Manure / Compost', 'Crop Rotation with Legumes']
        };
      case 'dropdown':
        return {
          ...base,
          title: 'Select County / Administrative Ward',
          helpText: 'Choose from the list.',
          options: ['Nakuru County', 'Machakos County', 'Kakamega County', 'Meru County', 'Uasin Gishu County']
        };
      case 'cascading_dropdown':
        return {
          ...base,
          title: 'Administrative Location (County -> Sub-County -> Ward)',
          helpText: 'Select levels sequentially. Child choices update dynamically.',
          levels: ['County', 'Sub-County', 'Ward'],
          hierarchyData: [
            { parent: 'Nakuru', child: 'Rongai', subchild: 'Menengai West' },
            { parent: 'Nakuru', child: 'Rongai', subchild: 'Soin' },
            { parent: 'Nakuru', child: 'Njoro', subchild: 'Mau Narok' },
            { parent: 'Machakos', child: 'Mwala', subchild: 'Masii' },
            { parent: 'Machakos', child: 'Mwala', subchild: 'Kibauni' },
            { parent: 'Kakamega', child: 'Lugari', subchild: 'Chekalini' },
            { parent: 'Uasin Gishu', child: 'Moiben', subchild: 'Tembelio' }
          ]
        };
      case 'star_rating':
        return {
          ...base,
          title: 'How satisfied are you with the germination rate of this seed lot?',
          helpText: '1 star = Very Dissatisfied, 5 stars = Very Satisfied',
          maxStars: 5
        };
      case 'nps':
        return {
          ...base,
          title: 'On a scale of 0 to 10, how likely are you to recommend this seed variety to another farmer?',
          helpText: '0 = Not at all likely, 10 = Extremely likely'
        };
      case 'matrix':
        return {
          ...base,
          title: 'Rate the seed variety on each agronomic characteristic:',
          helpText: 'Select one rating per row.',
          rows: ['Early germination vigor', 'Drought & dry-spell resilience', 'Marketability of harvested grain'],
          columns: ['Poor', 'Fair', 'Good', 'Excellent']
        };
      case 'number_yield':
        return {
          ...base,
          title: 'Total Harvested Yield per Acre',
          helpText: 'Enter numeric value.',
          unit: 'kg/acre',
          min: 0,
          max: 10000
        };
      case 'gps_location':
        return {
          ...base,
          title: 'Capture Farm Plot GPS Coordinates',
          helpText: 'Tap "Capture GPS" while standing at the plot boundary.',
          required: false
        };
      case 'signature':
        return {
          ...base,
          title: 'Farmer / Respondent Signature or Mark',
          helpText: 'Sign with finger or stylus to confirm survey consent and seed receipt.',
          required: false
        };
      case 'photo_proof':
        return {
          ...base,
          title: 'Photo Proof of Crop Trial / Agro-Dealer Stock',
          helpText: 'Snap a clear photo of the trial plot, seed packet, or agro-dealer shelf. Compressed automatically.',
          required: false,
          maxDimension: 1024,
          maxKb: 150
        };
      case 'barcode_scanner':
        return {
          ...base,
          title: 'Scan Certified Seed Pack Barcode or KEPHIS QR Code',
          helpText: 'Position camera over the seed label barcode or type the serial number.',
          verificationPattern: '^(KEPHIS|[0-9]{8,14}|[A-Z0-9-]{6,20})$',
          allowManualEntry: true
        };
      case 'audio_note':
        return {
          ...base,
          title: 'Farmer Voice Testimony / Qualitative Field Memo',
          helpText: 'Record a verbal statement or field observation using the microphone.',
          required: false,
          maxDurationSec: 120
        };
      case 'repeat_group':
        return {
          ...base,
          title: 'Seed Variety Inventory & Pricing Roster',
          helpText: 'Add a record for each distinct seed variety lot in stock.',
          required: true,
          addButtonLabel: '+ Add Another Seed Variety Lot',
          fields: [
            { id: 'variety_name', label: 'Variety Name / Code', type: 'text', placeholder: 'e.g. DH04' },
            { id: 'stock_bags', label: 'Stock On-Hand (2kg Packs)', type: 'number', placeholder: 'e.g. 50' },
            { id: 'lot_number', label: 'Lot / Batch No.', type: 'text', placeholder: 'e.g. LOT-2026' },
            { id: 'price_kes', label: 'Retail Price (KES)', type: 'number', placeholder: 'e.g. 600' }
          ]
        };
      case 'date_time':
        return {
          ...base,
          title: 'Date of Planting / Field Inspection',
          helpText: 'Select calendar date.',
          required: false
        };
      case 'short_text':
        return {
          ...base,
          title: 'Farmer / Respondent Full Name or Household ID',
          helpText: '',
          required: false,
          placeholder: 'Enter respondent name or ID…'
        };
      case 'long_text':
        return {
          ...base,
          title: 'Additional Enumerator Observations & Qualitative Feedback',
          helpText: 'Record any pest pressure, weather anomalies, or supply issues.',
          required: false,
          placeholder: 'Write detailed field notes…'
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

    return `
      <div class="space-y-6">
        <!-- 1. Builder Stage Header Row (Screen-Fit & Aligned with Overview) -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EFEFEF]">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2.5">
              <h1 class="text-[24px] font-semibold text-[#111613] tracking-tight leading-tight">Survey Builder &amp; Design</h1>
              <span class="inline-flex items-center gap-1.5 text-xs text-[#525B56]">
                <span class="w-1.5 h-1.5 rounded-full bg-[#247B50]"></span>
                <span>Auto-saved to IndexedDB</span>
              </span>
            </div>
            <p class="text-sm text-[#525B56] mt-1">
              Design multi-page field questionnaires, skip branching, multilingual translations, and GPS telemetry.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <!-- Active Survey Switcher -->
            <select onchange="AEApp.switchStage('design', this.value)"
              aria-label="Select Survey to Edit"
              class="h-8 text-xs font-semibold bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613] focus:outline-none focus:border-[#247B50] max-w-[220px] truncate">
              ${allSurveys
                .map(
                  (s) =>
                    `<option value="${s.id}" ${s.id === survey.id ? 'selected' : ''}>${AEApp.escapeHtml(
                      s.title.substring(0, 32)
                    )}${s.title.length > 32 ? '…' : ''}</option>`
                )
                .join('')}
            </select>

            <!-- Status Dropdown -->
            <select onchange="AEApp.updateSurveyMeta('status', this.value)"
              aria-label="Survey Status"
              class="h-8 text-xs font-medium bg-white border border-[#CFD5D0] rounded-[6px] px-2.5 text-[#111613] focus:outline-none focus:border-[#247B50]">
              <option value="Active" ${survey.status === 'Active' ? 'selected' : ''}>Status: Active</option>
              <option value="Draft" ${survey.status === 'Draft' ? 'selected' : ''}>Status: Draft</option>
              <option value="Closed" ${survey.status === 'Closed' ? 'selected' : ''}>Status: Closed</option>
              <option value="Archived" ${survey.status === 'Archived' ? 'selected' : ''}>Status: Archived (Field Locked)</option>
            </select>

            <!-- Assign Field Team -->
            <button onclick="AEApp.openAssignTeamModal('${survey.id}')"
              class="h-8 px-3 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#111613] inline-flex items-center gap-1.5 ae-press">
              <i class="fa-solid fa-users-gear text-[#247B50]"></i> Assign Team
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

        <!-- 2. Divided 4-Cell Metadata Strip (Matching Overview KPI Architecture) -->
        <div class="bg-white border border-[#E4E7E4] rounded-[8px] overflow-hidden">
          <div class="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EFEFEF]">
            <div class="p-4">
              <span class="text-xs font-medium text-[#525B56] block">Active Instrument</span>
              <div class="mt-1">
                <strong class="text-sm font-semibold text-[#111613] block truncate" title="${AEApp.escapeAttr(survey.title)}">${AEApp.escapeHtml(survey.title)}</strong>
                <span class="text-xs text-[#247B50] font-medium">${AEApp.escapeHtml(survey.category || 'Agricultural Field Survey')}</span>
              </div>
            </div>
            <div class="p-4">
              <span class="text-xs font-medium text-[#525B56] block">Structure &amp; Scale</span>
              <div class="mt-1 flex items-baseline gap-2">
                <strong class="text-[24px] font-semibold text-[#111613] tabular-nums leading-none">${totalQuestions}</strong>
                <span class="text-xs text-[#525B56]">questions across ${survey.pages.length} ${survey.pages.length === 1 ? 'section' : 'sections'}</span>
              </div>
            </div>
            <div class="p-4">
              <span class="text-xs font-medium text-[#525B56] block">Publication Lifecycle</span>
              <div class="mt-1 flex items-center gap-2">
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
                <span class="text-xs text-[#525B56] tabular-nums">Revision ${survey.version || 1}</span>
              </div>
            </div>
            <div class="p-4">
              <span class="text-xs font-medium text-[#525B56] block">Storage &amp; Cloud State</span>
              <div class="mt-1 flex items-baseline gap-2">
                <strong class="text-xs font-semibold text-[#247B50] flex items-center gap-1.5">
                  <i class="fa-solid fa-database text-[11px]"></i> IndexedDB Local
                </strong>
                <span class="text-xs text-[#525B56]">Ready for rural sync</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Builder Main Workspace Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <!-- LEFT SIDEBAR: Question Bank & Theme -->
          <aside class="lg:col-span-4 xl:col-span-3 bg-white border border-[#E4E7E4] rounded-[8px] lg:sticky lg:top-16 overflow-hidden">
            <div class="grid grid-cols-3 border-b border-[#EFEFEF] bg-[#F8F9F8]">
              <button onclick="AEApp.setBuilderLeftTab('questions')"
                class="h-10 px-2 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                  this.leftTab === 'questions'
                    ? 'border-[#247B50] text-[#111613] font-semibold bg-white'
                    : 'border-transparent text-[#525B56] hover:text-[#111613]'
                }">
                <i class="fa-solid fa-plus text-[#247B50]"></i> Questions
              </button>
              <button onclick="AEApp.setBuilderLeftTab('translations')"
                class="h-10 px-2 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                  this.leftTab === 'translations'
                    ? 'border-[#247B50] text-[#111613] font-semibold bg-white'
                    : 'border-transparent text-[#525B56] hover:text-[#111613]'
                }">
                <i class="fa-solid fa-language text-[#247B50]"></i> Languages
              </button>
              <button onclick="AEApp.setBuilderLeftTab('theme')"
                class="h-10 px-2 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
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
                <div class="flex items-center justify-between gap-2 mb-1.5">
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
                    <span class="px-1.5 py-0.2 rounded-[4px] bg-white/15 text-[11px] tabular-nums">${(p.questions || []).length}</span>
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

          <!-- Questions List on Active Page -->
          <div class="space-y-4">
            ${
              (currentPage.questions || []).length === 0
                ? `<div class="bg-white border border-dashed border-[#CFD5D0] rounded-[8px] p-8 text-center">
                    <h3 class="text-sm font-semibold text-[#111613]">No questions on Page ${this.activePageIndex + 1} yet</h3>
                    <p class="text-xs text-[#525B56] mt-1 max-w-md mx-auto">Select any question type from the left Question Bank (Multiple Choice, Net Promoter Score, Likert Matrix, Yield Metric, or GPS Coordinates) to append it to this page.</p>
                  </div>`
                : (currentPage.questions || [])
                    .map((q, qIdx) => this.renderQuestionEditorCard(survey, currentPage, q, qIdx))
                    .join('')
            }
          </div>
        </section>
      </div>
    `;
  },

  renderQuestionBankSidebar(survey) {
    const groups = ['Choice questions', 'Ratings & scales', 'Agri & field telemetry', 'Open text'];
    return `
      <div class="p-4 space-y-4 lg:max-h-[calc(100dvh-160px)] lg:overflow-y-auto">
        <p class="text-xs text-[#525B56] leading-relaxed">
          Select a question type to append to <strong class="text-[#111613]">Page ${this.activePageIndex + 1}</strong>. All controls run offline.
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
    const swatches = [
      { name: 'Agri Emerald', hex: '#247B50' },
      { name: 'Canopy Forest Ink', hex: '#141A17' },
      { name: 'Harvest Ochre', hex: '#92400E' },
      { name: 'Rift Highland Teal', hex: '#0F766E' },
      { name: 'Neutral Slate', hex: '#1E293B' }
    ];

    return `
      <div class="p-4 space-y-5">
        <div>
          <label for="ae_builder_category" class="block text-xs font-medium text-[#111613] mb-1.5">Survey Category</label>
          <input type="text"
            id="ae_builder_category"
            maxlength="80"
            value="${AEApp.escapeAttr(survey.category || 'Field Survey')}"
            onchange="AEApp.updateSurveyMeta('category', this.value)"
            class="w-full h-9 text-xs bg-white border border-[#CFD5D0] rounded-[6px] px-3 text-[#111613] focus:outline-none focus:border-[#247B50]" />
        </div>

        <div>
          <label class="block text-xs font-medium text-[#111613] mb-2">Respondent Header Accent</label>
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

        <div class="pt-3 border-t border-[#EFEFEF]">
          <button onclick="AEApp.exportSurveySchemaJSON('${survey.id}')"
            class="w-full h-9 px-3 rounded-[6px] border border-[#CFD5D0] bg-white hover:bg-[#F4F6F4] text-xs font-medium text-[#111613] flex items-center justify-center gap-2 ae-press">
            <i class="fa-solid fa-file-code text-[#247B50]"></i> Export Survey Schema (.json)
          </button>
        </div>
      </div>
    `;
  },

  renderTranslationsSidebar(survey) {
    const targetLang = this.targetLang || 'sw';
    const langLabel = targetLang === 'sw' ? 'Kiswahili' : 'Français';
    const trans = (survey.translations && survey.translations[targetLang]) || {};
    const currentPage = (survey.pages || [])[this.activePageIndex] || { id: 'page_1', title: 'Page 1', questions: [] };
    const pTrans = (trans.pages && trans.pages[currentPage.id]) || {};
    const qTransMap = trans.questions || {};

    return `
      <div class="p-4 space-y-4 lg:max-h-[calc(100dvh-160px)] lg:overflow-y-auto">
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-[#111613]">Active Target Language</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button type="button" onclick="AEApp.setBuilderTranslationLang('sw')"
              class="h-9 px-2.5 rounded-[6px] border text-xs font-medium flex items-center justify-center gap-1.5 ae-press ${
                targetLang === 'sw'
                  ? 'border-[#247B50] bg-[#DCFAE5] text-[#04250E] font-semibold'
                  : 'border-[#CFD5D0] bg-white text-[#525B56]'
              }">
              <span>🇰🇪</span> Kiswahili
            </button>
            <button type="button" onclick="AEApp.setBuilderTranslationLang('fr')"
              class="h-9 px-2.5 rounded-[6px] border text-xs font-medium flex items-center justify-center gap-1.5 ae-press ${
                targetLang === 'fr'
                  ? 'border-[#247B50] bg-[#DCFAE5] text-[#04250E] font-semibold'
                  : 'border-[#CFD5D0] bg-white text-[#525B56]'
              }">
              <span>🇫🇷</span> Français
            </button>
          </div>
        </div>

        <div class="pt-2 border-t border-[#EFEFEF]">
          <button type="button" onclick="AEApp.autoTranslateSurvey()"
            class="w-full h-9 rounded-[6px] bg-[#247B50] hover:bg-[#1F6A45] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 ae-press">
            <i class="fa-solid fa-wand-magic-sparkles text-xs"></i>
            <span>Auto-Translate Questions</span>
          </button>
          <p class="text-[11px] text-[#525B56] mt-1.5 leading-snug">
            Applies agricultural dictionary presets to all questions and options in this survey.
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
                  </div>
                `;
              })
              .join('')}
          </div>
        </div>
      </div>
    `;
  },

  renderQuestionEditorCard(survey, page, q, qIdx) {
    const typeMeta = QUESTION_TYPES_CATALOG.find((t) => t.type === q.type) || {
      label: q.type,
      icon: 'fa-circle-question'
    };
    const logic = q.logic || { enabled: false, condition: 'equals', value: '', target: '' };

    return `
      <div class="bg-white border border-[#E4E7E4] rounded-[8px] p-5 ae-card-hover">
        <!-- Top Row: Question Number, Type Badge, Required Toggle & Reorder/Delete Actions -->
        <div class="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#EFEFEF]">
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center justify-center px-2 py-0.5 rounded-[4px] bg-[#141A17] text-white text-xs font-semibold tabular-nums">
              Q${qIdx + 1}
            </span>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] bg-[#F8F9F8] border border-[#E4E7E4] text-[#111613] text-xs font-medium">
              <i class="fa-solid ${typeMeta.icon} text-[#247B50]"></i> ${typeMeta.label}
            </span>
            ${
              logic.enabled
                ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#FFFBEB] text-[#92400E] text-xs font-medium">
                    <i class="fa-solid fa-code-branch"></i> Skip rule active
                  </span>`
                : ''
            }
          </div>

          <div class="flex items-center gap-1.5">
            <label class="inline-flex items-center gap-1.5 text-xs font-medium text-[#525B56] cursor-pointer mr-2">
              <input type="checkbox" ${q.required ? 'checked' : ''}
                onchange="AEApp.updateQuestionField('${q.id}', 'required', this.checked)"
                class="accent-[#247B50] w-3.5 h-3.5" />
              <span>Required</span>
            </label>

            <button onclick="AEApp.moveQuestion('${q.id}', -1)" title="Move Up" aria-label="Move Question Up"
              class="w-7 h-7 rounded-[5px] border border-[#CFD5D0] text-[#525B56] hover:text-[#111613] hover:bg-[#F4F6F4] flex items-center justify-center text-xs">
              <i class="fa-solid fa-arrow-up"></i>
            </button>
            <button onclick="AEApp.moveQuestion('${q.id}', 1)" title="Move Down" aria-label="Move Question Down"
              class="w-7 h-7 rounded-[5px] border border-[#CFD5D0] text-[#525B56] hover:text-[#111613] hover:bg-[#F4F6F4] flex items-center justify-center text-xs">
              <i class="fa-solid fa-arrow-down"></i>
            </button>
            <button onclick="AEApp.duplicateQuestion('${q.id}')" title="Duplicate Question" aria-label="Duplicate Question"
              class="w-7 h-7 rounded-[5px] border border-[#CFD5D0] text-[#525B56] hover:text-[#247B50] hover:bg-[#F4F6F4] flex items-center justify-center text-xs">
              <i class="fa-regular fa-copy"></i>
            </button>
            <button onclick="AEApp.deleteQuestion('${q.id}')" title="Delete Question" aria-label="Delete Question"
              class="w-7 h-7 rounded-[5px] border border-[#CFD5D0] text-[#525B56] hover:text-[#C4242A] hover:bg-[#FFEDEA] flex items-center justify-center text-xs">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
        </div>

        <!-- Question Prompt & Help Hint -->
        <div class="space-y-2 mb-4">
          <input type="text"
            id="ae_q_title_${q.id}"
            maxlength="220"
            aria-label="Question ${qIdx + 1} Prompt"
            value="${AEApp.escapeAttr(q.title)}"
            onchange="AEApp.updateQuestionField('${q.id}', 'title', this.value)"
            class="w-full h-10 text-sm font-semibold text-[#111613] bg-white border border-[#CFD5D0] rounded-[6px] px-3 focus:border-[#247B50] focus:outline-none"
            placeholder="Enter question prompt…" />

          <!-- Variable Recall / Dynamic Piping Assistant -->
          <div class="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-[#525B56]">
            <span>Dynamic piping: <code class="text-[#247B50] bg-[#F8F9F8] px-1 py-0.5 rounded border border-[#E4E7E4] font-mono">&#123;&#123;question_id&#125;&#125;</code></span>
            ${
              (survey.pages || []).flatMap((p) => p.questions || []).filter((item) => item.id !== q.id).length > 0
                ? `<select aria-label="Insert piped variable"
                    onchange="if(this.value){ AEBuilder.insertPipedVariable('${q.id}', this.value); this.value=''; }"
                    class="h-6 px-2 text-[11px] font-medium text-[#247B50] bg-white border border-[#CFD5D0] rounded-[4px] focus:outline-none hover:border-[#247B50]">
                    <option value="">+ Pipe Field from Prior Question…</option>
                    ${(survey.pages || [])
                      .flatMap((p) => p.questions || [])
                      .filter((item) => item.id !== q.id)
                      .map(
                        (pq) =>
                          `<option value="{{${pq.id}}}">${AEApp.escapeHtml(pq.title.substring(0, 32))}</option>`
                      )
                      .join('')}
                  </select>`
                : ''
            }
          </div>

          <input type="text"
            id="ae_q_help_${q.id}"
            maxlength="240"
            aria-label="Question ${qIdx + 1} Helper Text"
            value="${AEApp.escapeAttr(q.helpText || '')}"
            onchange="AEApp.updateQuestionField('${q.id}', 'helpText', this.value)"
            class="w-full h-8 text-xs text-[#525B56] bg-[#F8F9F8] border border-[#E4E7E4] focus:bg-white focus:border-[#247B50] rounded-[6px] px-3 focus:outline-none"
            placeholder="Optional enumerator hint or respondent helper text…" />
        </div>

        <!-- Type-Specific Options / Settings Editor -->
        <div class="bg-[#F8F9F8] border border-[#E4E7E4] rounded-[6px] p-3.5 min-w-0">
          ${this.renderQuestionTypeConfig(q)}
        </div>

        <!-- Conditional Skip Logic / Branching Strip -->
        <div class="mt-3 pt-3 border-t border-[#EFEFEF] flex flex-wrap items-center justify-between gap-3">
          <label class="inline-flex items-center gap-2 text-xs font-medium text-[#525B56] cursor-pointer">
            <input type="checkbox" ${logic.enabled ? 'checked' : ''}
              onchange="AEApp.updateQuestionLogic('${q.id}', 'enabled', this.checked)"
              class="accent-[#247B50] w-3.5 h-3.5" />
            <span><i class="fa-solid fa-code-branch text-[#247B50] mr-1"></i> Conditional skip / branching rule</span>
          </label>

          ${
            logic.enabled
              ? `<div class="flex flex-wrap items-center gap-2 text-xs">
                  <span class="text-[#525B56]">If answer equals</span>
                  ${
                    Array.isArray(q.options) && q.options.length > 0
                      ? `<select aria-label="Skip rule trigger value"
                          onchange="AEApp.updateQuestionLogic('${q.id}', 'value', this.value)"
                          class="bg-white border border-[#CFD5D0] rounded-[5px] px-2.5 h-7 text-xs font-medium text-[#111613] max-w-[220px] truncate focus:outline-none focus:border-[#247B50]">
                          <option value="">Select choice…</option>
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
                          placeholder="Option value…"
                          class="bg-white border border-[#CFD5D0] rounded-[5px] px-2.5 h-7 text-xs text-[#111613] w-44 focus:outline-none focus:border-[#247B50]" />`
                  }
                  <span class="text-[#525B56]">jump to</span>
                  <select aria-label="Skip rule target page"
                    onchange="AEApp.updateQuestionLogic('${q.id}', 'target', this.value)"
                    class="bg-white border border-[#CFD5D0] rounded-[5px] px-2.5 h-7 text-xs font-medium text-[#111613] focus:outline-none focus:border-[#247B50]">
                    <option value="">Select target page</option>
                    ${survey.pages
                      .map(
                        (p, idx) =>
                          `<option value="${p.id}" ${logic.target === p.id ? 'selected' : ''}>Page ${idx + 1}: ${AEApp.escapeHtml(p.title.substring(0, 25))}</option>`
                      )
                      .join('')}
                    <option value="END_SURVEY" ${logic.target === 'END_SURVEY' ? 'selected' : ''}>End of Survey (Submit)</option>
                  </select>
                </div>`
              : ''
          }
        </div>
      </div>
    `;
  },

  renderQuestionTypeConfig(q) {
    if (q.type === 'multiple_choice' || q.type === 'checkboxes' || q.type === 'dropdown') {
      const options = Array.isArray(q.options) ? q.options : [];
      return `
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-[#525B56] tabular-nums">Answer choices (${options.length})</span>
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
              class="w-full text-xs bg-white border border-[#CFD5D0] rounded-[6px] p-2.5 text-[#111613] focus:outline-none focus:border-[#247B50]">${rows.join('\n')}</textarea>
          </div>
          <div>
            <label for="ae_q_cols_${q.id}" class="block text-xs font-medium text-[#525B56] mb-1">Scale columns (one per line)</label>
            <textarea id="ae_q_cols_${q.id}" rows="4"
              onchange="AEApp.updateQuestionLines('${q.id}', 'columns', this.value)"
              class="w-full text-xs bg-white border border-[#CFD5D0] rounded-[6px] p-2.5 text-[#111613] focus:outline-none focus:border-[#247B50]">${cols.join('\n')}</textarea>
          </div>
        </div>
      `;
    }

    if (q.type === 'number_yield') {
      return `
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label for="ae_q_unit_${q.id}" class="block text-xs font-medium text-[#525B56] mb-1">Measurement unit</label>
            <input id="ae_q_unit_${q.id}" type="text" maxlength="32" value="${AEApp.escapeAttr(q.unit || 'kg/acre')}"
              onchange="AEApp.updateQuestionField('${q.id}', 'unit', this.value)"
              class="w-full h-8 text-xs bg-white border border-[#CFD5D0] rounded-[5px] px-2.5 text-[#111613]" />
          </div>
          <div>
            <label for="ae_q_min_${q.id}" class="block text-xs font-medium text-[#525B56] mb-1">Minimum value</label>
            <input id="ae_q_min_${q.id}" type="number" value="${q.min ?? 0}"
              onchange="AEApp.updateQuestionField('${q.id}', 'min', Number(this.value))"
              class="w-full h-8 text-xs bg-white border border-[#CFD5D0] rounded-[5px] px-2.5 tabular-nums text-[#111613]" />
          </div>
          <div>
            <label for="ae_q_max_${q.id}" class="block text-xs font-medium text-[#525B56] mb-1">Maximum value</label>
            <input id="ae_q_max_${q.id}" type="number" value="${q.max ?? 10000}"
              onchange="AEApp.updateQuestionField('${q.id}', 'max', Number(this.value))"
              class="w-full h-8 text-xs bg-white border border-[#CFD5D0] rounded-[5px] px-2.5 tabular-nums text-[#111613]" />
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
            <i class="fa-solid fa-barcode text-[#247B50] text-base"></i>
            <span>Optical Camera Barcode & KEPHIS QR Scanner</span>
          </div>
          <span class="px-2 py-0.5 rounded bg-[#DCFAE5] text-[#04250E] text-[11px] font-semibold">Live Camera Stream + Serial Match</span>
        </div>
      `;
    }

    if (q.type === 'audio_note') {
      return `
        <div class="p-3 bg-white border border-[#E4E7E4] rounded-[6px] text-xs text-[#525B56] flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2 font-medium text-[#111613]">
            <i class="fa-solid fa-microphone text-[#247B50] text-base"></i>
            <span>HTML5 MediaRecorder Audio Note & Field Testimony</span>
          </div>
          <span class="px-2 py-0.5 rounded bg-[#F4F6F4] text-[#111613] text-[11px] font-medium">Max 120s &middot; IndexedDB Blobs</span>
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
        Respondent input control configured (${q.type.replace('_', ' ')}).
      </div>
    `;
  },

  insertPipedVariable(qId, token) {
    const input = document.getElementById(`ae_q_title_${qId}`);
    if (input) {
      input.value = (input.value ? input.value + ' ' : '') + token;
      window.AEApp.updateQuestionField(qId, 'title', input.value);
    }
  }
};
