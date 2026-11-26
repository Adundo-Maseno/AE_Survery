/**
 * ============================================================================
 * AE SURVEY — Domain-Agnostic Template Library & Paste-to-Survey Parser
 * Exposes `window.AETemplates`:
 *  - TEMPLATES: 6 domain-agnostic survey blueprints with pre-wired 2a/2b
 *    conditional sub-questions (`parentQuestionId` + `displayRule`) & piping.
 *  - buildSurveyFromTemplate(templateId): deep-clones with fresh unique IDs
 *    and remaps all parentQuestionId, displayRule.sourceQuestionId, logic.target,
 *    and {{q_id}} dynamic piping tokens.
 *  - parseOutlineToSurvey(title, rawText): converts pasted plain-text or
 *    numbered outlines (including 1a/1b follow-ups & inline options) into a
 *    structured AE Survey.
 * ============================================================================
 */

(function (root) {
  'use strict';

  function uid(prefix) {
    return (
      prefix +
      '_' +
      Date.now().toString(36) +
      '_' +
      Math.random().toString(36).slice(2, 7)
    );
  }

  const TEMPLATES = [
    {
      id: 'tpl_team_building',
      name: 'Team Building & Strategy Workshop',
      category: 'Corporate & Team',
      icon: 'fa-people-group',
      accentColor: '#247B50',
      estimatedMins: 4,
      description:
        'Capture session ratings, breakout effectiveness, strategic alignment, and conditional follow-ups for offsites and retreats.',
      pages: [
        {
          id: 'p_tb_1',
          title: 'Session & Workshop Experience',
          description: 'Share candid feedback on today’s workshop sessions and facilitation.',
          questions: [
            {
              id: 'q_tb_session',
              type: 'multiple_choice',
              title: 'Which workshop session was most valuable to your work?',
              helpText: 'Select the single session that had the highest impact for you.',
              required: true,
              options: [
                'Strategy & Annual Roadmap',
                'Cross-Team Breakout Exercises',
                'Leadership Q&A & Alignment',
                'Team Collaboration Activities'
              ],
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_tb_rating',
              type: 'multiple_choice',
              title: 'How would you rate the overall quality of {{q_tb_session}}?',
              helpText: 'Select one rating.',
              required: true,
              options: ['Excellent', 'Good', 'Average', 'Needs Improvement'],
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_tb_rating_why',
              type: 'long_text',
              parentQuestionId: 'q_tb_rating',
              subQuestionPart: 'b',
              displayRule: {
                enabled: true,
                sourceQuestionId: 'q_tb_rating',
                mode: 'any_answer',
                value: ''
              },
              title: 'What stood out or could be improved about {{q_tb_session}}?',
              helpText: 'Share specific moments, pacing notes, or facilitation suggestions.',
              required: false,
              placeholder: 'Type your observations here…',
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_tb_matrix',
              type: 'matrix',
              title: 'Please rate each aspect of the workshop:',
              helpText: 'Select one rating per row.',
              required: true,
              rows: [
                'Clarity of objectives',
                'Facilitation & energy',
                'Time allocation & pacing',
                'Venue & logistics'
              ],
              columns: ['Poor', 'Fair', 'Good', 'Excellent'],
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_tb_nps',
              type: 'nps',
              title: 'How likely are you to recommend this workshop format to other teams?',
              helpText: '0 = Not at all likely, 10 = Extremely likely',
              required: true,
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_tb_takeaway',
              type: 'long_text',
              title: 'What is one concrete action or takeaway you will apply next week?',
              helpText: 'Optional but highly valued for post-workshop follow-through.',
              required: false,
              placeholder: 'e.g. Weekly cross-functional standup on priorities…',
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            }
          ]
        }
      ]
    },
    {
      id: 'tpl_training_event',
      name: 'Training & Event Evaluation',
      category: 'Learning & Events',
      icon: 'fa-chalkboard-user',
      accentColor: '#0F766E',
      estimatedMins: 4,
      description:
        'Measure curriculum relevance, instructor quality, practical readiness, and conditional improvement feedback.',
      pages: [
        {
          id: 'p_tr_1',
          title: 'Course Content & Delivery',
          description: 'Help us improve future cohorts and training materials.',
          questions: [
            {
              id: 'q_tr_track',
              type: 'dropdown',
              title: 'Which training track or module did you attend?',
              helpText: 'Choose your primary track.',
              required: true,
              options: [
                'Foundations & Core Skills',
                'Applied Technical Workshop',
                'Leadership & Management',
                'Compliance & Operations'
              ],
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_tr_readiness',
              type: 'multiple_choice',
              title: 'How confident do you feel applying {{q_tr_track}} concepts in your daily role?',
              helpText: 'Select the statement that best reflects your readiness.',
              required: true,
              options: [
                'Very confident — ready immediately',
                'Somewhat confident — need minor practice',
                'Neutral — need additional resources',
                'Not yet confident — need hands-on coaching'
              ],
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_tr_support',
              type: 'long_text',
              parentQuestionId: 'q_tr_readiness',
              subQuestionPart: 'b',
              displayRule: {
                enabled: true,
                sourceQuestionId: 'q_tr_readiness',
                mode: 'not_equals',
                value: 'Very confident — ready immediately'
              },
              title: 'What additional practice, job aids, or coaching would help you master {{q_tr_track}}?',
              helpText: 'Shown when further support or practice is helpful.',
              required: false,
              placeholder: 'Describe templates, follow-up sessions, or examples needed…',
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_tr_stars',
              type: 'star_rating',
              title: 'Overall rating of the trainer and materials for {{q_tr_track}}:',
              helpText: '1 star = Poor, 5 stars = Outstanding',
              maxStars: 5,
              required: true,
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_tr_topics',
              type: 'checkboxes',
              title: 'Which elements of the event worked best for you?',
              helpText: 'Select all that apply.',
              required: false,
              options: [
                'Hands-on case studies',
                'Live demonstrations',
                'Peer Q&A discussions',
                'Reference slides & handouts'
              ],
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_tr_nps',
              type: 'nps',
              title: 'How likely are you to recommend this training to a peer?',
              helpText: '0 = Not at all likely, 10 = Extremely likely',
              required: true,
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            }
          ]
        }
      ]
    },
    {
      id: 'tpl_csat_nps',
      name: 'Customer Satisfaction & NPS',
      category: 'Customer Experience',
      icon: 'fa-face-smile',
      accentColor: '#247B50',
      estimatedMins: 3,
      description:
        'Track CSAT, Net Promoter Score, root-cause drivers for non-promoters, and product/service touchpoint quality.',
      pages: [
        {
          id: 'p_cs_1',
          title: 'Service Experience & Loyalty',
          description: 'Your feedback takes under 3 minutes and directly shapes our service quality.',
          questions: [
            {
              id: 'q_cs_channel',
              type: 'multiple_choice',
              title: 'Which product or service touchpoint did you recently use?',
              helpText: 'Select your primary interaction.',
              required: true,
              options: [
                'Customer Support Desk',
                'Online Portal / App',
                'In-Person Branch / Delivery',
                'Account Onboarding'
              ],
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_cs_sat',
              type: 'multiple_choice',
              title: 'How satisfied were you with {{q_cs_channel}}?',
              helpText: 'Select one option.',
              required: true,
              options: [
                'Very Satisfied',
                'Satisfied',
                'Neutral',
                'Dissatisfied',
                'Very Dissatisfied'
              ],
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_cs_sat_detail',
              type: 'long_text',
              parentQuestionId: 'q_cs_sat',
              subQuestionPart: 'b',
              displayRule: {
                enabled: true,
                sourceQuestionId: 'q_cs_sat',
                mode: 'not_equals',
                value: 'Very Satisfied'
              },
              title: 'What could we have done better during your {{q_cs_channel}} experience?',
              helpText: 'Help our team resolve friction points.',
              required: false,
              placeholder: 'Share what fell short or took too long…',
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_cs_nps',
              type: 'nps',
              title: 'How likely are you to recommend us to a friend or colleague?',
              helpText: '0 = Not at all likely, 10 = Extremely likely',
              required: true,
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_cs_nps_reason',
              type: 'long_text',
              parentQuestionId: 'q_cs_nps',
              subQuestionPart: 'b',
              displayRule: {
                enabled: true,
                sourceQuestionId: 'q_cs_nps',
                mode: 'any_answer',
                value: ''
              },
              title: 'What is the primary reason for your score?',
              helpText: 'Briefly tell us what drove your rating.',
              required: false,
              placeholder: 'Type your primary reason here…',
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            }
          ]
        }
      ]
    },
    {
      id: 'tpl_employee_pulse',
      name: 'Employee Engagement Pulse',
      category: 'People & HR',
      icon: 'fa-heart-pulse',
      accentColor: '#1E293B',
      estimatedMins: 4,
      description:
        'Anonymous quarterly pulse checking eNPS, workload sustainability, manager support, and conditional burnout follow-ups.',
      pages: [
        {
          id: 'p_ep_1',
          title: 'Team Pulse & Workplace Support',
          description: 'Responses are aggregated to improve team health and clarity.',
          questions: [
            {
              id: 'q_ep_dept',
              type: 'dropdown',
              title: 'Which department or function are you part of?',
              helpText: 'Used for aggregate team-level insights.',
              required: true,
              options: [
                'Operations & Delivery',
                'Product & Engineering',
                'Commercial & Partnerships',
                'Finance, People & Admin'
              ],
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_ep_workload',
              type: 'multiple_choice',
              title: 'How sustainable does your current workload in {{q_ep_dept}} feel?',
              helpText: 'Select the option that best matches the past 30 days.',
              required: true,
              options: [
                'Balanced & sustainable',
                'Busy but manageable',
                'Stretched — occasional bottlenecks',
                'Overloaded — unsustainable'
              ],
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_ep_workload_fix',
              type: 'long_text',
              parentQuestionId: 'q_ep_workload',
              subQuestionPart: 'b',
              displayRule: {
                enabled: true,
                sourceQuestionId: 'q_ep_workload',
                mode: 'equals',
                value: 'Overloaded — unsustainable'
              },
              title: 'What are the biggest bottlenecks or blockers creating overload in {{q_ep_dept}}?',
              helpText: 'Shown only when workload feels unsustainable.',
              required: false,
              placeholder: 'e.g. Unclear priorities, tooling gaps, staffing…',
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_ep_matrix',
              type: 'matrix',
              title: 'How strongly do you agree with the following statements?',
              helpText: 'Select one rating per row.',
              required: true,
              rows: [
                'I know what is expected of me at work',
                'I have the tools and resources to do my job well',
                'My manager provides constructive feedback',
                'My ideas and contributions are valued'
              ],
              columns: ['Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_ep_enps',
              type: 'nps',
              title: 'How likely are you to recommend this organization as a great place to work?',
              helpText: '0 = Not at all likely, 10 = Extremely likely',
              required: true,
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_ep_notes',
              type: 'long_text',
              title: 'What is one change leadership could make this quarter to better support you?',
              helpText: 'Optional open feedback.',
              required: false,
              placeholder: 'Share your suggestion…',
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            }
          ]
        }
      ]
    },
    {
      id: 'tpl_healthcare_service',
      name: 'Healthcare / Service Experience',
      category: 'Healthcare & Public Service',
      icon: 'fa-hospital-user',
      accentColor: '#0F766E',
      estimatedMins: 4,
      description:
        'Patient and client service audit covering department touchpoints, wait times, staff empathy, and conditional delay diagnostics.',
      pages: [
        {
          id: 'p_hc_1',
          title: 'Visit Experience & Care Quality',
          description: 'Help us improve patient flow, communication, and quality of care.',
          questions: [
            {
              id: 'q_hc_dept',
              type: 'multiple_choice',
              title: 'Which department or clinic did you visit today?',
              helpText: 'Select the primary service point.',
              required: true,
              options: [
                'Outpatient / Consultation',
                'Pharmacy & Dispensing',
                'Laboratory & Diagnostics',
                'Maternal & Child Health'
              ],
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_hc_wait',
              type: 'multiple_choice',
              title: 'How was your waiting time at {{q_hc_dept}}?',
              helpText: 'From arrival/check-in until being attended.',
              required: true,
              options: [
                'Prompt (< 15 mins)',
                'Reasonable (15–30 mins)',
                'Moderate delay (30–45 mins)',
                'Long wait (> 45 mins)'
              ],
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_hc_wait_cause',
              type: 'long_text',
              parentQuestionId: 'q_hc_wait',
              subQuestionPart: 'b',
              displayRule: {
                enabled: true,
                sourceQuestionId: 'q_hc_wait',
                mode: 'equals',
                value: 'Long wait (> 45 mins)'
              },
              title: 'Where did the delay occur at {{q_hc_dept}}, and were you kept informed?',
              helpText: 'Shown only for wait times exceeding 45 minutes.',
              required: false,
              placeholder: 'e.g. Registration queue, lab results, billing desk…',
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_hc_matrix',
              type: 'matrix',
              title: 'Please rate your care experience across these dimensions:',
              helpText: 'Select one rating per row.',
              required: true,
              rows: [
                'Staff courtesy and empathy',
                'Clarity of medical/service explanation',
                'Facility cleanliness & comfort',
                'Privacy & respectful treatment'
              ],
              columns: ['Poor', 'Fair', 'Good', 'Excellent'],
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_hc_stars',
              type: 'star_rating',
              title: 'Overall rating of your visit to {{q_hc_dept}}:',
              helpText: '1 star = Very Poor, 5 stars = Excellent',
              maxStars: 5,
              required: true,
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_hc_comments',
              type: 'long_text',
              title: 'Any compliments for staff or suggestions for improving care?',
              helpText: 'Optional verbatim feedback.',
              required: false,
              placeholder: 'Share your comments…',
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            }
          ]
        }
      ]
    },
    {
      id: 'tpl_field_agronomic',
      name: 'Field & Agronomic Baseline',
      category: 'Field & Agriculture',
      icon: 'fa-seedling',
      accentColor: '#247B50',
      estimatedMins: 6,
      description:
        'Offline-ready field enumeration with GPS plot lock, primary enterprise selection, yield metrics, and conditional challenge diagnostics.',
      pages: [
        {
          id: 'p_ag_1',
          title: 'Plot Profile & Enterprise',
          description: 'Capture baseline household/plot details and GPS verification.',
          questions: [
            {
              id: 'q_ag_crop',
              type: 'multiple_choice',
              title: 'Primary crop or agricultural enterprise assessed on this plot:',
              helpText: 'Select the main focus crop for this season.',
              required: true,
              options: [
                'Maize (Hybrid / OPV)',
                'Beans & Legumes',
                'Horticulture (Vegetables / Fruits)',
                'Dairy / Livestock Fodder'
              ],
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_ag_gps',
              type: 'gps_location',
              title: 'Capture GPS Plot Coordinates for {{q_ag_crop}} site',
              helpText: 'Tap Capture GPS while standing at the plot boundary.',
              required: false,
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_ag_yield',
              type: 'number_yield',
              title: 'Estimated harvest yield for {{q_ag_crop}} (kg/acre):',
              helpText: 'Enter numeric figure in kilograms per acre.',
              unit: 'kg/acre',
              min: 0,
              max: 50000,
              required: true,
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_ag_yield_drivers',
              type: 'long_text',
              parentQuestionId: 'q_ag_yield',
              subQuestionPart: 'b',
              displayRule: {
                enabled: true,
                sourceQuestionId: 'q_ag_yield',
                mode: 'any_answer',
                value: ''
              },
              title: 'What were the main factors affecting {{q_ag_crop}} yield this season?',
              helpText: 'Note rainfall, seed quality, fertilizer timing, or pest pressure.',
              required: false,
              placeholder: 'Describe key agronomic drivers or constraints…',
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_ag_practices',
              type: 'checkboxes',
              title: 'Which improved agronomic practices were applied on {{q_ag_crop}}?',
              helpText: 'Select all practices observed or confirmed.',
              required: false,
              options: [
                'Certified seed from licensed agro-dealer',
                'Basal & top-dressing fertilizer',
                'Timely weeding & spacing',
                'Integrated pest & disease management'
              ],
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_ag_notes',
              type: 'long_text',
              title: 'Enumerator field observations & recommendations:',
              helpText: 'Record any additional context from the farm visit.',
              required: false,
              placeholder: 'Type field notes…',
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            }
          ]
        }
      ]
    }
  ];

  function remapPipingTokens(str, idMap) {
    if (typeof str !== 'string' || !str.includes('{{')) return str;
    return str.replace(
      /\{\{\s*([a-zA-Z0-9_-]+)(\s*\|\s*(?:'[^']*'|"[^"]*"))?\s*\}\}/g,
      (match, oldId, fallbackPart) => {
        const nextId = idMap[oldId];
        if (!nextId) return match;
        return `{{${nextId}${fallbackPart || ''}}}`;
      }
    );
  }

  function buildSurveyFromTemplate(templateId) {
    const tpl = TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return null;

    const now = new Date().toISOString();
    const surveyId = uid('srv');
    const qIdMap = {};
    const pIdMap = {};

    // First pass: allocate fresh IDs for every page and question
    const clonedPages = JSON.parse(JSON.stringify(tpl.pages || []));
    clonedPages.forEach((p, pIdx) => {
      const newPageId = uid(`page${pIdx + 1}`);
      if (p.id) pIdMap[p.id] = newPageId;
      p.id = newPageId;
      (p.questions || []).forEach((q, qIdx) => {
        const newQId = uid(`q${pIdx + 1}_${qIdx + 1}`);
        if (q.id) qIdMap[q.id] = newQId;
        q.id = newQId;
      });
    });

    // Second pass: remap parentQuestionId, displayRule.sourceQuestionId, logic.target, and {{q_id}} tokens
    clonedPages.forEach((p) => {
      p.title = remapPipingTokens(p.title || '', qIdMap);
      p.description = remapPipingTokens(p.description || '', qIdMap);
      (p.questions || []).forEach((q) => {
        if (q.parentQuestionId && qIdMap[q.parentQuestionId]) {
          q.parentQuestionId = qIdMap[q.parentQuestionId];
        }
        if (q.displayRule && typeof q.displayRule === 'object') {
          if (q.displayRule.sourceQuestionId && qIdMap[q.displayRule.sourceQuestionId]) {
            q.displayRule.sourceQuestionId = qIdMap[q.displayRule.sourceQuestionId];
          } else if (q.parentQuestionId) {
            q.displayRule.sourceQuestionId = q.parentQuestionId;
          }
        }
        if (q.logic && typeof q.logic === 'object' && q.logic.target && pIdMap[q.logic.target]) {
          q.logic.target = pIdMap[q.logic.target];
        }
        q.title = remapPipingTokens(q.title || '', qIdMap);
        if (q.helpText) q.helpText = remapPipingTokens(q.helpText, qIdMap);
        if (q.placeholder) q.placeholder = remapPipingTokens(q.placeholder, qIdMap);
      });
    });

    return {
      id: surveyId,
      title: tpl.name,
      description: tpl.description,
      category: tpl.category,
      status: 'Draft',
      collectionMode: 'hybrid',
      version: 1,
      createdAt: now,
      updatedAt: now,
      theme: {
        accentColor: tpl.accentColor || '#247B50',
        headerStyle: 'canopy',
        showProgressBar: true,
        showQuestionNumbers: true
      },
      pages: clonedPages
    };
  }

  function inferQuestionTypeAndOptions(promptText, explicitOptions) {
    const lower = promptText.toLowerCase();
    const hasOptions = Array.isArray(explicitOptions) && explicitOptions.length >= 2;

    if (hasOptions) {
      const isMulti =
        /\b(select all|check all|choose all|all that apply|multiple|multi-select|\[multi\])\b/i.test(promptText);
      return {
        type: isMulti ? 'checkboxes' : 'multiple_choice',
        options: explicitOptions
      };
    }

    if (/\b(nps|net promoter|0\s*[-–to]+\s*10|likely to recommend)\b/i.test(lower)) {
      return { type: 'nps' };
    }
    if (/\b(star|stars|1\s*[-–to]+\s*5|out of 5|rate the|rating)\b/i.test(lower)) {
      return { type: 'star_rating', maxStars: 5 };
    }
    if (/\b(gps|coordinates|latitude|longitude|plot location)\b/i.test(lower)) {
      return { type: 'gps_location' };
    }
    if (/\b(photo|picture|image proof|snap a photo)\b/i.test(lower)) {
      return { type: 'photo_proof', maxDimension: 1024, maxKb: 150 };
    }
    if (/\b(signature|sign[- ]?off|sign here)\b/i.test(lower)) {
      return { type: 'signature' };
    }
    if (/\b(date of|select date|calendar date|date\/time)\b/i.test(lower)) {
      return { type: 'date_time' };
    }
    if (/\b(how many|quantity|number of|total amount|yield|acres|budget|cost|revenue|hours spent)\b/i.test(lower)) {
      return { type: 'number_yield', unit: 'units', min: 0, max: 100000 };
    }
    if (
      /\b(explain|why|elaborate|improve|improved|improvement|comment|comments|feedback|takeaway|describe|suggestion|suggestions|observations|details|thoughts)\b/i.test(
        lower
      )
    ) {
      return { type: 'long_text', placeholder: 'Type your detailed response here…' };
    }
    return { type: 'short_text', placeholder: 'Enter your answer…' };
  }

  function extractInlineOptions(text) {
    // Match trailing parenthetical with 2+ comma / slash / pipe-separated choices:
    // e.g. "Rate the session (Excellent, Good, Average, Poor)"
    const match = text.match(/\(([^()]{3,220})\)\s*[\?\.\!]*\s*$/);
    if (!match) return { cleaned: text, options: null };

    const inner = match[1].trim();
    // Ignore purely instructional parentheticals like "(optional)" or "(1-5)" or "(if Poor)"
    if (/^(optional|required|multi|select all|if\s+.+|0\s*[-–]\s*10|1\s*[-–]\s*5)$/i.test(inner)) {
      return { cleaned: text, options: null };
    }

    let parts = null;
    if (inner.includes(',')) {
      parts = inner.split(',');
    } else if (inner.includes('|')) {
      parts = inner.split('|');
    } else if (inner.includes('/')) {
      parts = inner.split('/');
    }

    if (!parts) return { cleaned: text, options: null };
    const cleanedParts = parts.map((p) => p.trim()).filter(Boolean);
    if (cleanedParts.length < 2) return { cleaned: text, options: null };

    const cleanedPrompt = text.slice(0, match.index).trim().replace(/[:\-–]+$/, '').trim();
    return {
      cleaned: cleanedPrompt || text,
      options: cleanedParts
    };
  }

  function parseOutlineToSurvey(title, rawText) {
    const cleanTitle = String(title || '').trim() || 'Untitled Parsed Survey';
    const text = String(rawText || '').replace(/\r\n/g, '\n');
    const lines = text.split('\n');

    const now = new Date().toISOString();
    const pages = [];
    let currentPage = {
      id: uid('page1'),
      title: 'Section 1: Survey Questions',
      description: '',
      questions: []
    };
    pages.push(currentPage);

    // Track main numbered questions by their integer number on the active page (e.g. "1" -> qObj)
    let numberToParent = {};
    let lastQuestion = null;
    let qCounter = 0;

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const trimmed = rawLine.trim();
      if (!trimmed) continue;

      // 1. Detect Section / Page headers: "## Title", "# Title", "Section 2: Title", "Page 2: Title"
      const sectionMatch =
        trimmed.match(/^#{1,3}\s+(.+)$/) ||
        trimmed.match(/^(?:section|page)\s+\d*\s*[:\-–]\s*(.+)$/i);
      if (sectionMatch) {
        const secTitle = sectionMatch[1].trim();
        if (currentPage.questions.length === 0 && pages.length === 1) {
          currentPage.title = secTitle;
        } else {
          currentPage = {
            id: uid(`page${pages.length + 1}`),
            title: secTitle,
            description: '',
            questions: []
          };
          pages.push(currentPage);
          numberToParent = {};
          lastQuestion = null;
        }
        continue;
      }

      // 2. Detect bulleted option line under an existing question: "- Option A", "* Option B"
      const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
      if (bulletMatch && lastQuestion && !/^\s*(?:Q?\d+[a-z]?[\.\):])/i.test(bulletMatch[1])) {
        const optText = bulletMatch[1].trim();
        if (optText) {
          if (!Array.isArray(lastQuestion.options)) {
            lastQuestion.options = [];
          }
          lastQuestion.options.push(optText);
          if (lastQuestion.type !== 'checkboxes' && lastQuestion.type !== 'multiple_choice' && lastQuestion.type !== 'dropdown') {
            const isMulti = /\b(select all|check all|all that apply|multiple)\b/i.test(lastQuestion.title || '');
            lastQuestion.type = isMulti ? 'checkboxes' : 'multiple_choice';
            delete lastQuestion.placeholder;
          }
        }
        continue;
      }

      // 3. Parse numbered question or sub-question:
      //    e.g. "1. ...", "1a. ...", "1b. ...", "2b) ...", "Q3: ...", "Q2b. ..."
      let mainNum = null;
      let subLetter = null;
      let body = trimmed;

      const numberedMatch = trimmed.match(/^(?:Q\s*)?(\d+)([a-z])?\s*[\.\):\-]\s*(.+)$/i);
      const letterOnlySubMatch = !numberedMatch ? trimmed.match(/^([b-z])\s*[\.\)]\s*(.+)$/i) : null;

      if (numberedMatch) {
        mainNum = numberedMatch[1];
        subLetter = numberedMatch[2] ? numberedMatch[2].toLowerCase() : null;
        body = numberedMatch[3].trim();
      } else if (letterOnlySubMatch && lastQuestion) {
        subLetter = letterOnlySubMatch[1].toLowerCase();
        body = letterOnlySubMatch[2].trim();
      }

      // Check optional/required markers
      let explicitOptional = /\(optional\)/i.test(body);
      let explicitRequired = /\*\s*$/.test(body);
      body = body.replace(/\(optional\)/gi, '').replace(/\*\s*$/, '').trim();

      // Check inline conditional hint like "[if Poor]" or "(if Yes)"
      let inlineCondValue = '';
      const condMatch = body.match(/[\[\(]\s*if\s+([^\[\]\(\)]+)\s*[\]\)]/i);
      if (condMatch) {
        inlineCondValue = condMatch[1].trim();
        body = (body.slice(0, condMatch.index) + body.slice(condMatch.index + condMatch[0].length)).trim();
      }

      // Extract inline options e.g. "(Excellent, Good, Average, Poor)"
      const { cleaned, options } = extractInlineOptions(body);
      const promptText = cleaned.trim();
      if (!promptText) continue;

      const inferred = inferQuestionTypeAndOptions(promptText, options);
      qCounter++;
      const qId = uid(`q${qCounter}`);

      const questionObj = {
        id: qId,
        type: inferred.type,
        title: promptText,
        helpText: '',
        required: explicitOptional ? false : true,
        logic: { enabled: false, condition: 'equals', value: '', target: '' }
      };

      if (inferred.options) questionObj.options = inferred.options;
      if (inferred.maxStars) questionObj.maxStars = inferred.maxStars;
      if (inferred.unit) {
        questionObj.unit = inferred.unit;
        questionObj.min = inferred.min;
        questionObj.max = inferred.max;
      }
      if (inferred.placeholder) questionObj.placeholder = inferred.placeholder;
      if (inferred.maxDimension) {
        questionObj.maxDimension = inferred.maxDimension;
        questionObj.maxKb = inferred.maxKb;
      }

      // Auto-link sub-questions (e.g. 1b, 2b, 2c, or letter-only b. under a parent)
      let parentQ = null;
      if (subLetter && subLetter !== 'a') {
        if (mainNum && numberToParent[mainNum]) {
          parentQ = numberToParent[mainNum];
        } else if (lastQuestion) {
          parentQ = lastQuestion.parentQuestionId
            ? currentPage.questions.find((item) => item.id === lastQuestion.parentQuestionId) || lastQuestion
            : lastQuestion;
        }
      }

      if (parentQ) {
        questionObj.parentQuestionId = parentQ.id;
        questionObj.subQuestionPart = subLetter;
        questionObj.required = explicitRequired ? true : false;
        questionObj.displayRule = {
          enabled: true,
          sourceQuestionId: parentQ.id,
          mode: inlineCondValue ? 'equals' : 'any_answer',
          value: inlineCondValue || ''
        };
      } else if (mainNum) {
        numberToParent[mainNum] = questionObj;
      }

      currentPage.questions.push(questionObj);
      lastQuestion = questionObj;
    }

    // Remove empty trailing/leading pages if others have questions
    const nonEmptyPages = pages.filter((p) => p.questions.length > 0);
    const finalPages =
      nonEmptyPages.length > 0
        ? nonEmptyPages
        : [
            {
              id: uid('page1'),
              title: 'Section 1: Survey Questions',
              description: '',
              questions: []
            }
          ];

    return {
      id: uid('srv'),
      title: cleanTitle,
      description: 'Generated from pasted survey outline. Review question types and conditional rules below.',
      category: 'Custom Survey',
      status: 'Draft',
      collectionMode: 'hybrid',
      version: 1,
      createdAt: now,
      updatedAt: now,
      theme: {
        accentColor: '#247B50',
        headerStyle: 'canopy',
        showProgressBar: true,
        showQuestionNumbers: true
      },
      pages: finalPages
    };
  }

  const AETemplates = {
    TEMPLATES,
    buildSurveyFromTemplate,
    parseOutlineToSurvey
  };

  if (typeof root !== 'undefined') {
    root.AETemplates = AETemplates;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AETemplates;
  }
})(typeof window !== 'undefined' ? window : globalThis);
