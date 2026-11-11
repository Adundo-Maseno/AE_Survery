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

    return `
      <div class="space-y-5">
        <!-- 1. Builder Stage Header Row (Screen-Fit & Aligned with Overview) -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#EFEFEF]">
          <div class="min-w-0 flex-1">
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
              <span class="text-xs font-medium text-[#525B56] block">Active Instrument</span>
              <div class="mt-1 min-w-0">
                <strong class="text-sm font-semibold text-[#111613] block truncate" title="${AEApp.escapeAttr(survey.title)}">${AEApp.escapeHtml(survey.title)}</strong>
                <span class="text-xs text-[#247B50] font-medium block truncate">${AEApp.escapeHtml(survey.category || 'Agricultural Field Survey')}</span>
              </div>
            </div>
            <div class="p-4 min-w-0">
              <span class="text-xs font-medium text-[#525B56] block">Structure &amp; Scale</span>
              <div class="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <strong class="text-[24px] font-semibold text-[#111613] tabular-nums leading-none">${totalQuestions}</strong>
                <span class="text-xs text-[#525B56]">questions across ${survey.pages.length} ${survey.pages.length === 1 ? 'section' : 'sections'}</span>
              </div>
            </div>
            <div class="p-4 min-w-0">
              <span class="text-xs font-medium text-[#525B56] block">Publication Lifecycle</span>
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
                <span class="text-xs text-[#525B56] tabular-nums">Revision ${survey.version || 1}</span>
              </div>
            </div>
            <div class="p-4 min-w-0">
              <span class="text-xs font-medium text-[#525B56] block">Storage &amp; Cloud State</span>
              <div class="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
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
            <span class="text-xs text-[#646E68]">Simulating live field entry · IndexedDB active</span>
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
                ${questions
                  .map(
                    (q, idx) => `
                  <div class="p-4 rounded-[8px] border border-[#E4E7E4] bg-[#FAFBF9] space-y-2">
                    <div class="flex items-start justify-between gap-2">
                      <label class="text-xs font-semibold text-[#111613]">
                        <span class="text-[#247B50] font-mono mr-1">${idx + 1}.</span>
                        ${AEApp.escapeHtml(q.title)}
                        ${q.required ? '<span class="text-[#C4242A] ml-0.5">*</span>' : ''}
                      </label>
                      <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-[#E4E7E4] text-[#646E68]">
                        ${q.type}
                      </span>
                    </div>
                    ${q.subtitle ? `<p class="text-[11px] text-[#525B56]">${AEApp.escapeHtml(q.subtitle)}</p>` : ''}

                    <div class="pt-1">
                      ${this.renderSimulatedQuestionInput(q)}
                    </div>
                  </div>
                `
                  )
                  .join('')}
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
          Select a question type to append to <strong class="text-[#111613]">Page ${this.activePageIndex + 1}</strong>. Universal across commercial, public health, NGO, and agricultural domains.
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
            <label class="block text-xs font-semibold text-[#111613]">Supported Languages for this Survey</label>
            <span class="text-[10px] uppercase font-bold tracking-wider text-[#247B50] bg-[#DCFAE5] px-1.5 py-0.5 rounded">Field Scope</span>
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
            Leverages Google Translate via Google Apps Script with local agricultural fallback to translate questions, options, matrices, and section titles into ${langLabel}.
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
                      .map((p, idx) =>
                        idx > this.activePageIndex || logic.target === p.id
                          ? `<option value="${p.id}" ${logic.target === p.id ? 'selected' : ''}>Page ${idx + 1}: ${AEApp.escapeHtml(p.title.substring(0, 25))}</option>`
                          : ''
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
      return `
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
