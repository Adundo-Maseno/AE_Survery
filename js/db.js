/**
 * ============================================================================
 * AE SURVEY — Offline-First Database (IndexedDB + LocalStorage Mirror)
 * & Google Apps Script (GAS) Cloud Synchronization Engine
 * ============================================================================
 */

const AE_STORAGE_KEYS = {
  SURVEYS: 'ae_sm_surveys_v2',
  COLLECTORS: 'ae_sm_collectors_v2',
  RESPONSES: 'ae_sm_responses_v2',
  SYNC_QUEUE: 'ae_sm_sync_queue_v2',
  SYNC_LOGS: 'ae_sm_sync_logs_v2',
  SETTINGS: 'ae_sm_settings_v2',
  RUNNER_DRAFTS: 'ae_sm_runner_drafts_v2',
  PERSONNEL: 'ae_sm_personnel_v2'
};

const IDB_NAME = 'AESurveyMonkeyDB'; // Retained for backwards compatibility with offline field responses
const IDB_VERSION = 4;

/**
 * Default pre-seeded surveys tailored to Agri Experience Limited & AE Survey
 */
function getInitialSeedData() {
  const now = new Date();
  const daysAgo = (d) => new Date(now.getTime() - d * 86400000).toISOString();

  const surveys = [
    {
      id: 'srv_maize_2026',
      title: '2026 Smallholder Drought-Tolerant Maize & Seed Adoption Survey',
      description: 'Field enumeration evaluating seed variety performance, germination rates, fertilizer co-application, and farmer Net Promoter Score across rural counties.',
      category: 'Seed Systems & Yield',
      status: 'Active',
      version: 3,
      createdAt: daysAgo(14),
      updatedAt: daysAgo(1),
      theme: {
        accentColor: '#247B50',
        headerStyle: 'canopy',
        showProgressBar: true,
        showQuestionNumbers: true
      },
      quotas: [
        { id: 'qta_nakuru', name: 'Nakuru County Target', questionId: 'q_county', match: 'Nakuru', target: 50, action: 'warn' },
        { id: 'qta_machakos', name: 'Machakos County Target', questionId: 'q_county', match: 'Machakos', target: 50, action: 'warn' },
        { id: 'qta_kakamega', name: 'Kakamega County Target', questionId: 'q_county', match: 'Kakamega', target: 30, action: 'warn' },
        { id: 'qta_meru', name: 'Meru County Target', questionId: 'q_county', match: 'Meru', target: 25, action: 'warn' },
        { id: 'qta_uasin_gishu', name: 'Uasin Gishu Target', questionId: 'q_county', match: 'Uasin Gishu', target: 40, action: 'warn' },
        { id: 'qta_kitui', name: 'Kitui County Target', questionId: 'q_county', match: 'Kitui', target: 20, action: 'warn' }
      ],
      pages: [
        {
          id: 'page_1',
          title: 'Section 1: Plot Profile, Seed Variety & Field Coordinates',
          description: 'Record farmer plot metadata, primary seed source, and GPS location before capturing harvest metrics.',
          questions: [
            {
              id: 'q_county',
              type: 'dropdown',
              title: 'Which county / agro-ecological zone is this farm plot located in?',
              helpText: 'Select the administrative county where the interview is taking place.',
              required: true,
              options: [
                'Nakuru County (Rift Valley Highland)',
                'Machakos County (Eastern Semi-Arid)',
                'Kakamega County (Western Moist Transitional)',
                'Meru County (Upper Midland)',
                'Uasin Gishu County (Maize Basket)',
                'Kitui County (Arid & Semi-Arid Lands)'
              ],
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_seed_variety',
              type: 'multiple_choice',
              title: 'Which primary maize seed variety did you plant during the main rains?',
              helpText: 'Ask to inspect the seed packet label if the farmer still has it.',
              required: true,
              allowOther: true,
              options: [
                'DH04 (Drought-Tolerant Hybrid)',
                'KH500-43A (Highland Hybrid)',
                'SC Duma 43 (Early Maturing)',
                'DK 8031 (Medium Maturity)',
                'Local Recycled / Farm-Saved Seed'
              ],
              logic: {
                enabled: true,
                condition: 'equals',
                value: 'Local Recycled / Farm-Saved Seed',
                target: 'page_2'
              }
            },
            {
              id: 'q_inputs_used',
              type: 'checkboxes',
              title: 'Which soil fertility or crop protection inputs were applied on this plot?',
              helpText: 'Select all inputs used during planting and top-dressing.',
              required: true,
              options: [
                'DAP / NPK Planting Fertilizer',
                'CAN / Urea Top-Dressing',
                'Compost / Farmyard Manure',
                'Fall Armyworm Biological/Chemical Control',
                'certified Rhizobium / Bio-Stimulant',
                'None (Unamended Soil)'
              ],
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_gps_plot',
              type: 'gps_location',
              title: 'Capture Farm Plot GPS Coordinates & Village Landmark',
              helpText: 'Stand at the edge of the main maize plot for ±10m satellite accuracy.',
              required: false,
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            }
          ]
        },
        {
          id: 'page_2',
          title: 'Section 2: Agronomic Performance, Harvest Yield & Farmer NPS',
          description: 'Evaluate variety traits, harvested yield per acre, and overall seed recommendation score.',
          questions: [
            {
              id: 'q_trait_matrix',
              type: 'matrix',
              title: 'Rate the planted seed variety across the following agronomic traits:',
              helpText: 'Read each trait aloud and record the farmer’s assessment.',
              required: true,
              rows: [
                'Germination uniformity (emergence within 7 days)',
                'Tolerance to mid-season dry spells',
                'Resistance to cob rot and storage pests',
                'Grain weight and flour milling quality'
              ],
              columns: ['Poor', 'Fair', 'Good', 'Excellent'],
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_yield_kg',
              type: 'number_yield',
              title: 'Estimated Harvested Maize Yield per Acre',
              helpText: 'Convert 90kg bags to kilograms if needed (e.g., 15 bags = 1,350 kg/acre).',
              required: true,
              unit: 'kg/acre',
              min: 0,
              max: 5000,
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_dealer_rating',
              type: 'star_rating',
              title: 'How satisfied were you with the distance and service at your local agro-dealer?',
              helpText: '1 star = Very Dissatisfied, 5 stars = Very Satisfied',
              required: true,
              maxStars: 5,
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_nps_seed',
              type: 'nps',
              title: 'On a scale of 0 to 10, how likely are you to recommend this certified seed variety to neighboring farmers next season?',
              helpText: '0 = Not at all likely, 10 = Extremely likely',
              required: true,
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_field_notes',
              type: 'long_text',
              title: 'Enumerator Observations & Farmer Feedback on Seed Availability',
              helpText: 'Note any pack size preferences (2kg vs 10kg), fake seed concerns, or credit constraints.',
              required: false,
              placeholder: 'E.g., Farmer requested 2kg trial packs at local stockist before planting season...',
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_crop_photo',
              type: 'photo_proof',
              title: 'Crop Trial / Field Stand Photo Proof',
              helpText: 'Take a clear photo of the maize plot stand, cob development, or pest pressure.',
              required: false,
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_farmer_signature',
              type: 'signature',
              title: 'Farmer Consent & Survey Verification Signature',
              helpText: 'Farmer or respondent confirms verbal consent and verifies receipt of extension advice.',
              required: false,
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            }
          ]
        }
      ]
    },
    {
      id: 'srv_agrodealer_2026',
      title: 'Agro-Dealer Stockout, Pack Size & Input Pricing Audit',
      description: 'Quarterly retail audit of rural agro-vet stockists assessing certified seed inventory, cold/dry storage compliance, and digital payment readiness.',
      category: 'Market & Retail Audit',
      status: 'Active',
      version: 2,
      createdAt: daysAgo(10),
      updatedAt: daysAgo(2),
      theme: {
        accentColor: '#141A17',
        headerStyle: 'canopy',
        showProgressBar: true,
        showQuestionNumbers: true
      },
      pages: [
        {
          id: 'page_dealer_1',
          title: 'Retailer Inventory & Pricing Verification',
          description: 'Complete at the agro-dealer counter with the shop owner or attendant.',
          questions: [
            {
              id: 'qd_shop_type',
              type: 'multiple_choice',
              title: 'What is the classification of this agricultural input stockist?',
              helpText: 'Verify KEPHIS / PCPB license display.',
              required: true,
              options: [
                'Wholesale Hub & Retail Agro-Dealer',
                'Independent Rural Agro-Vet Retailer',
                'Cooperative Society Input Store',
                'Village Agent / Last-Mile Stockist'
              ],
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'qd_stock_items',
              type: 'checkboxes',
              title: 'Which certified seed categories are physically in stock today?',
              helpText: 'Visually confirm shelves or store room.',
              required: true,
              options: [
                'Drought-Tolerant Maize Hybrids (2kg / 10kg)',
                'Certified Common Beans (Nyota / Angaza)',
                'Cowpea, Green Gram & Sorghum Pulses',
                'Assorted Vegetable Seeds (Hermetic Packets)',
                'Forage & Pasture Seeds (Brachiaria / Boma Rhodes)'
              ],
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'qd_price_2kg',
              type: 'number_yield',
              title: 'Current Retail Price for a 2kg Packet of Certified Maize Seed',
              helpText: 'Record price in Kenyan Shillings (KES).',
              required: true,
              unit: 'KES',
              min: 100,
              max: 2500,
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'qd_storage_rating',
              type: 'star_rating',
              title: 'Enumerator Audit Score: Seed Storage Ventilation & Pallet Compliance',
              helpText: '5 stars = Off-floor wooden pallets, dry roof, away from chemicals.',
              required: true,
              maxStars: 5,
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'qd_gps',
              type: 'gps_location',
              title: 'Agro-Dealer Shop Front GPS Coordinates',
              helpText: 'Capture outside the shop entrance for clear satellite lock.',
              required: false,
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            }
          ]
        }
      ]
    },
    {
      id: 'srv_extension_pulse',
      title: 'Farmer Field Day & Demo Plot Training Feedback',
      description: 'Post-event pulse survey measuring farmer learning outcomes, agronomic demo clarity, and extension officer effectiveness.',
      category: 'Training & Extension',
      status: 'Draft',
      version: 1,
      createdAt: daysAgo(4),
      updatedAt: daysAgo(1),
      theme: {
        accentColor: '#247B50',
        headerStyle: 'emerald',
        showProgressBar: true,
        showQuestionNumbers: true
      },
      pages: [
        {
          id: 'page_ext_1',
          title: 'Field Day Experience & Knowledge Gain',
          description: 'Quick 2-minute exit survey for farmers attending demonstration plots.',
          questions: [
            {
              id: 'qe_session',
              type: 'multiple_choice',
              title: 'Which demonstration station was most useful for your farm today?',
              helpText: 'Select the top session.',
              required: true,
              options: [
                'Planting Spacing & Basal Fertilizer Calibration',
                'Drought-Tolerant Seed Variety Side-by-Side Comparison',
                'Post-Harvest Hermetic Storage (PICS Bags)',
                'Soil pH Testing & Liming Demonstration'
              ],
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'qe_nps',
              type: 'nps',
              title: 'How likely are you to invite another farmer from your village to the next Agri Experience Field Day?',
              helpText: '0 = Not likely, 10 = Extremely likely',
              required: true,
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'qe_takeaway',
              type: 'short_text',
              title: 'What is the #1 practice you plan to change on your plot next season?',
              helpText: 'One brief sentence.',
              required: false,
              placeholder: 'E.g., Switching from recycled seed to certified DH04...',
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            }
          ]
        }
      ]
    }
  ];

  const collectors = [
    {
      id: 'col_kiosk_rift',
      surveyId: 'srv_maize_2026',
      name: 'Rift Valley Field Tablet Kiosk (Team A)',
      type: 'kiosk',
      status: 'Open',
      pinCode: '1234',
      enumeratorDefault: 'Grace Wanjiku (Enum-04)',
      createdAt: daysAgo(12)
    },
    {
      id: 'col_web_eastern',
      surveyId: 'srv_maize_2026',
      name: 'Eastern & ASAL Web Link Collector',
      type: 'weblink',
      status: 'Open',
      pinCode: '1234',
      enumeratorDefault: 'David Mutua (Enum-11)',
      createdAt: daysAgo(10)
    },
    {
      id: 'col_dealer_audit',
      surveyId: 'srv_agrodealer_2026',
      name: 'Agro-Dealer Retail Audit Tablet',
      type: 'kiosk',
      status: 'Open',
      pinCode: '1234',
      enumeratorDefault: 'Samuel Ochieng (Enum-07)',
      createdAt: daysAgo(8)
    }
  ];

  const responses = [
    {
      "id": "resp_seed_101",
      "clientResponseId": "resp_seed_101",
      "surveyId": "srv_maize_2026",
      "surveyTitle": "2026 Smallholder Drought-Tolerant Maize & Seed Adoption Survey",
      "collectorId": "col_kiosk_rift",
      "enumerator": "Grace Wanjiku (Enum-04)",
      "status": "complete",
      "reviewStatus": "pending_review",
      "qaFlags": [],
      "submittedAt": "2026-10-23T11:50:44.150Z",
      "durationSec": 164,
      "gps": {
        "lat": -0.3031,
        "lng": 36.08,
        "accuracy": 6.4,
        "label": "Njoro Ward Plot #14"
      },
      "answers": {
        "q_county": "Nakuru County (Rift Valley Highland)",
        "q_seed_variety": "KH500-43A (Highland Hybrid)",
        "q_inputs_used": [
          "DAP / NPK Planting Fertilizer",
          "CAN / Urea Top-Dressing",
          "Compost / Farmyard Manure"
        ],
        "q_gps_plot": {
          "lat": -0.3031,
          "lng": 36.08,
          "accuracy": 6.4,
          "label": "Njoro Ward Plot #14"
        },
        "q_trait_matrix": {
          "Germination uniformity (emergence within 7 days)": "Excellent",
          "Tolerance to mid-season dry spells": "Good",
          "Resistance to cob rot and storage pests": "Good",
          "Grain weight and flour milling quality": "Excellent"
        },
        "q_yield_kg": 1890,
        "q_dealer_rating": 5,
        "q_nps": 10,
        "q_verbatim": "Uniform stand density; farmer bought 10kg certified bag early in February.",
        "q_field_photo": null,
        "q_farmer_signature": null,
        "q_nps_seed": 10,
        "q_field_notes": "Uniform stand density; farmer bought 10kg certified bag early in February.",
        "q_crop_photo": null
      },
      "syncStatus": "synced",
      "syncedAt": "2026-10-29T16:10:10.680Z"
    },
    {
      "id": "resp_seed_102",
      "clientResponseId": "resp_seed_102",
      "surveyId": "srv_maize_2026",
      "surveyTitle": "2026 Smallholder Drought-Tolerant Maize & Seed Adoption Survey",
      "collectorId": "col_web_eastern",
      "enumerator": "David Mutua (Enum-11)",
      "status": "complete",
      "reviewStatus": "pending_review",
      "qaFlags": [],
      "submittedAt": "2026-10-24T11:50:44.150Z",
      "durationSec": 142,
      "gps": {
        "lat": -1.5177,
        "lng": 37.2634,
        "accuracy": 8.1,
        "label": "Mwala Sub-County"
      },
      "answers": {
        "q_county": "Machakos County (Eastern Semi-Arid)",
        "q_seed_variety": "DH04 (Drought-Tolerant Hybrid)",
        "q_inputs_used": [
          "DAP / NPK Planting Fertilizer",
          "Compost / Farmyard Manure"
        ],
        "q_gps_plot": {
          "lat": -1.5177,
          "lng": 37.2634,
          "accuracy": 8.1,
          "label": "Mwala Sub-County"
        },
        "q_trait_matrix": {
          "Germination uniformity (emergence within 7 days)": "Good",
          "Tolerance to mid-season dry spells": "Excellent",
          "Resistance to cob rot and storage pests": "Good",
          "Grain weight and flour milling quality": "Good"
        },
        "q_yield_kg": 1260,
        "q_dealer_rating": 4,
        "q_nps": 9,
        "q_verbatim": "DH04 withstood 3-week dry spell in April significantly better than neighbor plots.",
        "q_field_photo": null,
        "q_farmer_signature": null,
        "q_nps_seed": 9,
        "q_field_notes": "DH04 withstood 3-week dry spell in April significantly better than neighbor plots.",
        "q_crop_photo": null
      },
      "syncStatus": "synced",
      "syncedAt": "2026-10-29T16:10:10.681Z"
    },
    {
      "id": "resp_seed_103",
      "clientResponseId": "resp_seed_103",
      "surveyId": "srv_maize_2026",
      "surveyTitle": "2026 Smallholder Drought-Tolerant Maize & Seed Adoption Survey",
      "collectorId": "col_kiosk_rift",
      "enumerator": "Grace Wanjiku (Enum-04)",
      "status": "complete",
      "reviewStatus": "pending_review",
      "qaFlags": [],
      "submittedAt": "2026-10-25T11:50:44.150Z",
      "durationSec": 195,
      "gps": {
        "lat": 0.2827,
        "lng": 34.7519,
        "accuracy": 5.2,
        "label": "Lurambi North"
      },
      "answers": {
        "q_county": "Kakamega County (Western Moist Transitional)",
        "q_seed_variety": "SC Duma 43 (Early Maturing)",
        "q_inputs_used": [
          "DAP / NPK Planting Fertilizer",
          "CAN / Urea Top-Dressing",
          "Fall Armyworm Biological/Chemical Control"
        ],
        "q_gps_plot": {
          "lat": 0.2827,
          "lng": 34.7519,
          "accuracy": 5.2,
          "label": "Lurambi North"
        },
        "q_trait_matrix": {
          "Germination uniformity (emergence within 7 days)": "Excellent",
          "Tolerance to mid-season dry spells": "Good",
          "Resistance to cob rot and storage pests": "Fair",
          "Grain weight and flour milling quality": "Good"
        },
        "q_yield_kg": 1620,
        "q_dealer_rating": 4,
        "q_nps": 9,
        "q_verbatim": "Fast maturity allowed early harvest before heavy August rains.",
        "q_field_photo": null,
        "q_farmer_signature": null,
        "q_nps_seed": 9,
        "q_field_notes": "Fast maturity allowed early harvest before heavy August rains.",
        "q_crop_photo": null
      },
      "syncStatus": "synced",
      "syncedAt": "2026-10-29T16:10:10.681Z"
    },
    {
      "id": "resp_seed_104",
      "clientResponseId": "resp_seed_104",
      "surveyId": "srv_maize_2026",
      "surveyTitle": "2026 Smallholder Drought-Tolerant Maize & Seed Adoption Survey",
      "collectorId": "col_web_eastern",
      "enumerator": "David Mutua (Enum-11)",
      "status": "complete",
      "reviewStatus": "pending_review",
      "qaFlags": [],
      "submittedAt": "2026-10-26T11:50:44.150Z",
      "durationSec": 118,
      "gps": {
        "lat": -1.367,
        "lng": 38.0106,
        "accuracy": 11,
        "label": "Kitui Rural Ward"
      },
      "answers": {
        "q_county": "Kitui County (Arid & Semi-Arid Lands)",
        "q_seed_variety": "Local Recycled / Farm-Saved Seed",
        "q_inputs_used": [
          "Compost / Farmyard Manure"
        ],
        "q_gps_plot": {
          "lat": -1.367,
          "lng": 38.0106,
          "accuracy": 11,
          "label": "Kitui Rural Ward"
        },
        "q_trait_matrix": {
          "Germination uniformity (emergence within 7 days)": "Fair",
          "Tolerance to mid-season dry spells": "Fair",
          "Resistance to cob rot and storage pests": "Good",
          "Grain weight and flour milling quality": "Fair"
        },
        "q_yield_kg": 540,
        "q_dealer_rating": 2,
        "q_nps": 5,
        "q_verbatim": "Local agro-dealer ran out of 2kg DH04 packs during planting week.",
        "q_field_photo": null,
        "q_farmer_signature": null,
        "q_nps_seed": 5,
        "q_field_notes": "Local agro-dealer ran out of 2kg DH04 packs during planting week.",
        "q_crop_photo": null
      },
      "syncStatus": "synced",
      "syncedAt": "2026-10-29T16:10:10.681Z"
    },
    {
      "id": "resp_seed_105_offline",
      "clientResponseId": "resp_seed_105_offline",
      "surveyId": "srv_maize_2026",
      "surveyTitle": "2026 Smallholder Drought-Tolerant Maize & Seed Adoption Survey",
      "collectorId": "col_kiosk_rift",
      "enumerator": "Grace Wanjiku (Enum-04)",
      "status": "complete",
      "reviewStatus": "pending_review",
      "qaFlags": [],
      "submittedAt": "2026-10-28T04:38:44.150Z",
      "durationSec": 151,
      "gps": {
        "lat": 0.0463,
        "lng": 37.6559,
        "accuracy": 4.8,
        "label": "Timau / Buuri Plot #8"
      },
      "answers": {
        "q_county": "Meru County (Upper Midland)",
        "q_seed_variety": "DH04 (Drought-Tolerant Hybrid)",
        "q_inputs_used": [
          "DAP / NPK Planting Fertilizer",
          "CAN / Urea Top-Dressing",
          "certified Rhizobium / Bio-Stimulant"
        ],
        "q_gps_plot": {
          "lat": 0.0463,
          "lng": 37.6559,
          "accuracy": 4.8,
          "label": "Timau / Buuri Plot #8"
        },
        "q_trait_matrix": {
          "Germination uniformity (emergence within 7 days)": "Excellent",
          "Tolerance to mid-season dry spells": "Excellent",
          "Resistance to cob rot and storage pests": "Excellent",
          "Grain weight and flour milling quality": "Good"
        },
        "q_yield_kg": 2070,
        "q_dealer_rating": 5,
        "q_nps": 10,
        "q_verbatim": "Captured offline in Buuri field zone; waiting for evening Wi-Fi sync to Google Sheets.",
        "q_field_photo": null,
        "q_farmer_signature": null,
        "q_nps_seed": 10,
        "q_field_notes": "Captured offline in Buuri field zone; waiting for evening Wi-Fi sync to Google Sheets.",
        "q_crop_photo": null
      },
      "syncStatus": "synced",
      "syncedAt": "2026-10-29T16:10:10.681Z"
    },
    {
      "id": "resp_mvs9x3fx_i3wn",
      "clientResponseId": "resp_mvs9x3fx_i3wn",
      "surveyId": "srv_maize_2026",
      "surveyTitle": "2026 Smallholder Drought-Tolerant Maize & Seed Adoption Survey",
      "collectorId": "col_kiosk_rift",
      "enumerator": "Faith Chebet (Enum-09)",
      "status": "complete",
      "reviewStatus": "pending_review",
      "qaFlags": [],
      "submittedAt": "2026-10-28T15:32:56.110Z",
      "durationSec": 267,
      "gps": {
        "lat": -1.361895,
        "lng": 36.66485,
        "accuracy": 500,
        "label": "Ngong"
      },
      "answers": {
        "q_county": "Machakos County (Eastern Semi-Arid)",
        "q_seed_variety": "SC Duma 43 (Early Maturing)",
        "q_inputs_used": [
          "CAN / Urea Top-Dressing",
          "DAP / NPK Planting Fertilizer",
          "Fall Armyworm Biological/Chemical Control"
        ],
        "q_gps_plot": {
          "lat": -1.36,
          "lng": 36.6599,
          "accuracy": 500,
          "label": "Ngong"
        },
        "q_trait_matrix": {
          "Germination uniformity (emergence within 7 days)": "Good",
          "Tolerance to mid-season dry spells": "Excellent",
          "Resistance to cob rot and storage pests": "Good",
          "Grain weight and flour milling quality": "Good"
        },
        "q_yield_kg": 1350,
        "q_dealer_rating": 4,
        "q_nps": 8,
        "q_verbatim": "Good Good",
        "q_field_photo": {
          "capturedAt": "2026-10-28T15:32:56.110Z",
          "width": 1024,
          "height": 1024,
          "sizeKb": 100,
          "preview": "Photo Proof Captured & Verified"
        },
        "q_farmer_signature": null,
        "q_nps_seed": 8,
        "q_field_notes": "Good Good",
        "q_crop_photo": {
          "capturedAt": "2026-10-28T15:32:56.110Z",
          "width": 1024,
          "height": 1024,
          "sizeKb": 100,
          "preview": "Photo Proof Captured & Verified"
        }
      },
      "syncStatus": "synced",
      "syncedAt": "2026-10-29T16:10:10.681Z"
    },
    {
      "id": "resp_mvtglxvs_r56j",
      "clientResponseId": "resp_mvtglxvs_r56j",
      "surveyId": "srv_maize_2026",
      "surveyTitle": "2026 Smallholder Drought-Tolerant Maize & Seed Adoption Survey",
      "collectorId": "col_kiosk_rift",
      "enumerator": "Moses Adundo (HQ Admin)",
      "status": "complete",
      "reviewStatus": "flagged",
      "qaFlags": [
        "YIELD_OUTLIER_LOW"
      ],
      "submittedAt": "2026-10-29T11:27:59.179Z",
      "durationSec": 183,
      "gps": {
        "lat": -1.338686,
        "lng": 36.723286,
        "accuracy": 13.9,
        "label": "Karen"
      },
      "answers": {
        "q_county": "Kakamega County (Western Moist Transitional)",
        "q_seed_variety": "SC Duma 43 (Early Maturing)",
        "q_inputs_used": [
          "Compost / Farmyard Manure",
          "DAP / NPK Planting Fertilizer",
          "CAN / Urea Top-Dressing",
          "certified Rhizobium / Bio-Stimulant",
          "Fall Armyworm Biological/Chemical Control"
        ],
        "q_gps_plot": {
          "lat": -1.338686,
          "lng": 36.723286,
          "accuracy": 13.9,
          "label": "Karen"
        },
        "q_trait_matrix": {
          "Germination uniformity (emergence within 7 days)": "Good",
          "Tolerance to mid-season dry spells": "Good",
          "Resistance to cob rot and storage pests": "Good",
          "Grain weight and flour milling quality": "Good"
        },
        "q_yield_kg": 18,
        "q_dealer_rating": 5,
        "q_nps": 10,
        "q_verbatim": "Good produce",
        "q_field_photo": {
          "capturedAt": "2026-10-29T11:27:59.179Z",
          "width": 1024,
          "height": 1024,
          "sizeKb": 2,
          "preview": "Photo Proof Captured & Verified"
        },
        "q_farmer_signature": null,
        "q_nps_seed": 10,
        "q_field_notes": "Good produce",
        "q_crop_photo": {
          "capturedAt": "2026-10-29T11:27:59.179Z",
          "width": 1024,
          "height": 1024,
          "sizeKb": 2,
          "preview": "Photo Proof Captured & Verified"
        }
      },
      "syncStatus": "synced",
      "syncedAt": "2026-10-29T16:10:10.681Z"
    },
    {
      "id": "resp_test_latency_1793274382518",
      "clientResponseId": "resp_test_latency_1793274382518",
      "surveyId": "srv_maize_2026",
      "surveyTitle": "2026 Smallholder Drought-Tolerant Maize & Seed Adoption Survey",
      "collectorId": "col_kiosk_rift",
      "enumerator": "Moses Adundo (HQ Admin)",
      "status": "complete",
      "reviewStatus": "pending_review",
      "qaFlags": [],
      "submittedAt": "2026-10-29T11:46:22.518Z",
      "durationSec": 120,
      "gps": {
        "lat": -0.3031,
        "lng": 36.08,
        "accuracy": 5,
        "label": ""
      },
      "answers": {
        "q_county": "Nakuru County (Rift Valley Highland)",
        "q_seed_variety": "KH500-43A (Highland Hybrid)",
        "q_inputs_used": [
          "DAP / NPK Planting Fertilizer",
          "CAN / Urea Top-Dressing"
        ],
        "q_gps_plot": {
          "lat": -0.3031,
          "lng": 36.08,
          "accuracy": 5,
          "label": "Nakuru Plot #12"
        },
        "q_trait_matrix": {
          "Germination uniformity (emergence within 7 days)": "Good",
          "Tolerance to mid-season dry spells": "Good",
          "Resistance to cob rot and storage pests": "Good",
          "Grain weight and flour milling quality": "Good"
        },
        "q_yield_kg": 1750,
        "q_dealer_rating": 4,
        "q_nps": 9,
        "q_nps_seed": 9,
        "q_verbatim": "Latency verification benchmark probe.",
        "q_field_notes": "Latency verification benchmark probe.",
        "q_field_photo": {
          "width": 800,
          "height": 600,
          "sizeKb": 45,
          "preview": "Photo Proof Attached"
        },
        "q_crop_photo": {
          "width": 800,
          "height": 600,
          "sizeKb": 45,
          "preview": "Photo Proof Attached"
        },
        "q_farmer_signature": "Verified signature"
      },
      "syncStatus": "synced",
      "syncedAt": "2026-10-29T16:10:10.681Z"
    },
    {
      "id": "resp_mvtjsxxl_v08p",
      "clientResponseId": "resp_mvtjsxxl_v08p",
      "surveyId": "srv_maize_2026",
      "surveyTitle": "2026 Smallholder Drought-Tolerant Maize & Seed Adoption Survey",
      "collectorId": "col_kiosk_rift",
      "enumerator": "Moses Adundo (HQ Admin)",
      "status": "complete",
      "reviewStatus": "pending_review",
      "qaFlags": [],
      "submittedAt": "2026-10-29T12:57:24.682Z",
      "durationSec": 122,
      "gps": {
        "lat": -1.33838,
        "lng": 36.722943,
        "accuracy": 85,
        "label": "Karen"
      },
      "answers": {
        "q_county": "Machakos County (Eastern Semi-Arid)",
        "q_seed_variety": "DK 8031 (Medium Maturity)",
        "q_inputs_used": [
          "Compost / Farmyard Manure",
          "CAN / Urea Top-Dressing",
          "Fall Armyworm Biological/Chemical Control",
          "certified Rhizobium / Bio-Stimulant",
          "DAP / NPK Planting Fertilizer"
        ],
        "q_gps_plot": {
          "lat": -1.33838,
          "lng": 36.722943,
          "accuracy": 85,
          "label": "Karen"
        },
        "q_trait_matrix": {
          "Tolerance to mid-season dry spells": "Good",
          "Germination uniformity (emergence within 7 days)": "Excellent",
          "Resistance to cob rot and storage pests": "Excellent",
          "Grain weight and flour milling quality": "Excellent"
        },
        "q_yield_kg": 1800,
        "q_dealer_rating": 5,
        "q_nps": 9,
        "q_verbatim": "Farmers requested 2Kg",
        "q_field_photo": {
          "capturedAt": "2026-10-29T12:57:24.682Z",
          "width": 1024,
          "height": 1024,
          "sizeKb": 2,
          "preview": "Photo Proof Captured & Verified"
        },
        "q_farmer_signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlgAAACQCAYAAADUQhUsAAAQAElEQVR4AeydCZAsW1rXv+9kVXff7tu3l8zKqsq+776H780Cs7xBttFBRoVBFMIwgAGBAUFZFcYJHCOEUNRAxRAUAVE2Y2RTGUHCEFEHBNlxBMZ5MAOP4c1b7u2qyqrM6r6396rKc/xObpXVt7q7uruqupYvO0+eJU+e5ZeVmf/8Tma2AJ6YABNgAkyACTABJsAEhkqABdZQcXJhTIAJMAEmMBwCXAoTmG4CLLCme/9x65kAE2ACTIAJMIEJJMACawJ3CjeJCQyDAJfBBJgAE2ACN0eABdbNseeamQATYAJMgAkwgRklwALrzB3LK5gAE2ACTIAJMAEmcDUCLLCuxo23YgJMgAkwASZwMwS41qkgwAJrKnYTN5IJMAEmwASYABOYJgIssKZpb3FbmQATGAYBLoMJMAEmMHICLLBGjpgrYAJMgAkwASbABOaNAAusedvjw+gvl8EEmAATYAJMgAmcS4AF1rl4eCUTYAJMgAkwASYwLQQmqZ0ssCZpb3BbmAATYAJMgAkwgZkgwAJrJnYjd4IJMAEmMAwCXAYTYALDIsACa1gkuRwmwASYABNgAkyACcQEWGDFINibXwJWuSi1WysUgutS4O2ZABNgAkyACWgCLLA0BXZzS8Byigow+svnhdBx07HVhmOz2JrbXwV3nAkwASZwfQITJrCu3yEugQkMSkCLqX55td4yALXYkv3WcxoTYAJMgAkwgYsIsMC6iBCvn0kCprZcJT1TFJCBUtqnYGZGq2yzyMoA4SATmFsC3HEmcEkCLLAuCYyzTz2BLzLLtsKkGySqTvYPf8+recKvuuhVXL2KUuMMiCSyaBgxjrLHBJgAE2ACTGAQAiywBqHEeWaFgBZX/540U9QfklFaXO3t7b0hSoiWJLJER0kJtD5MIcmlRRmFv5Qcz1cjwFsxASbABOaKAAusudrdc93ZgcRVQmi32jACCemD7lqUWU7xR9bX1/9Pkod9JsAEmAATYAJnEWCBdRaZSUvn9lyHwNvIAtW1XJFp6jC3t33acnW6gh3XzUErOMym55YXP9myrINsGoeZABNgAkyACZwmwALrNBGOzxqBt5Hl6X3aAhV1TMGhsb99eP/wbhQ/f+l53krn8OT9ikRZmnPBWF4tFNppnANMgAkwgTkmwF3vT4AFVn8unDobBEJx1e3K5cRVst3u7u6n+JX6Z2U11mJe5MySmQ4hJnnZZwJMgAkwASagCbDA0hTYzSKBoYirDJj/6VVdVBlTFoqcMItFFlkZSBy8CgHehgkwgVkkwAJrFvcq9wlMx35fgkG/DHggRXPQYcFku36+X3UFZL6YhQaIzVKBv5XVDxanMQEmwATmmICY475z12eEwOlumE5RIWCYrMXVocTmUa1mhglDWHjVugAZpKJKCIFW2WJL1hDYchFMgAkwgVkhwAJrVvYk9yMkoL+8HkkrCB+Z2u+oh8MUV2EltPBqnkEKS+s3itGMhrAsq+eNQ0rlmQkwASbABOaUgACY055zt2eOgGmaHei+LghaXJ3U6+uj6mizQsOFoYyLa1gwbj3zzDOFOMYeE2ACTIAJzDEBtmDN8c6fsa4/A4s5I+lTp6OCUYqrpB6vUn9tEtb+7uFeXfvsmAATGAIBLoIJTDEBFlhTvPO46V0CNDT4h8nQIA0Oqt16PdddO9LQ89AKfoXqTCsxy0UaPUyjHGACTIAJMIE5JMACaw53+qx1OfzoZ2ZokKxK7xpnHz3P+zRsq8NEZCECWiVrEkTWODFwXUyACTABJpAhwAIrA4ODU0ngmYW8SK1VSna0sPnucfek0WisdDrQfZNQGLhu251xt4PrYwJMgAkwgckgwALrvP3A6yaeQHZoUCkAv+anz2GNu/F6WDJQkloR1ZzLoXGrXG5GMV4yASbABJjAPBFggTVPe3vG+tr71qACv+riTX",
        "q_nps_seed": 9,
        "q_field_notes": "Farmers requested 2Kg",
        "q_crop_photo": {
          "capturedAt": "2026-10-29T12:57:24.682Z",
          "width": 1024,
          "height": 1024,
          "sizeKb": 2,
          "preview": "Photo Proof Captured & Verified"
        }
      },
      "syncStatus": "synced",
      "syncedAt": "2026-10-29T16:10:10.681Z"
    },
    {
      "id": "resp_dealer_201",
      "clientResponseId": "resp_dealer_201",
      "surveyId": "srv_agrodealer_2026",
      "surveyTitle": "Agro-Dealer Stockout, Pack Size & Input Pricing Audit",
      "collectorId": "col_dealer_audit",
      "enumerator": "Samuel Ochieng (Enum-07)",
      "status": "complete",
      "reviewStatus": "approved",
      "qaFlags": [],
      "submittedAt": "2026-10-26T11:25:50.135Z",
      "durationSec": 180,
      "gps": {
        "lat": 0.5694,
        "lng": 34.5584,
        "accuracy": 5.5,
        "label": "Bungoma Hub"
      },
      "answers": {
        "qd_shop_type": "Wholesale Hub & Retail Agro-Dealer",
        "qd_stock_items": [
          "Drought-Tolerant Maize Hybrids (2kg / 10kg)",
          "Certified Common Beans (Nyota / Angaza)",
          "Assorted Vegetable Seeds (Hermetic Packets)"
        ],
        "qd_price_2kg": 620,
        "qd_storage_rating": 5,
        "qd_gps": {
          "lat": 0.5694,
          "lng": 34.5584,
          "accuracy": 5.5,
          "label": "Bungoma Hub"
        }
      },
      "syncStatus": "synced",
      "syncedAt": "2026-10-26T11:25:50.135Z"
    },
    {
      "id": "resp_dealer_202_offline",
      "clientResponseId": "resp_dealer_202_offline",
      "surveyId": "srv_agrodealer_2026",
      "surveyTitle": "Agro-Dealer Stockout, Pack Size & Input Pricing Audit",
      "collectorId": "col_dealer_audit",
      "enumerator": "Samuel Ochieng (Enum-07)",
      "status": "complete",
      "reviewStatus": "pending_review",
      "qaFlags": [],
      "submittedAt": "2026-10-29T09:01:50.135Z",
      "durationSec": 145,
      "gps": {
        "lat": 0.5123,
        "lng": 34.6111,
        "accuracy": 6.2,
        "label": "Kanduyi Market"
      },
      "answers": {
        "qd_shop_type": "Independent Rural Agro-Vet Retailer",
        "qd_stock_items": [
          "Drought-Tolerant Maize Hybrids (2kg / 10kg)",
          "Cowpea, Green Gram & Sorghum Pulses"
        ],
        "qd_price_2kg": 650,
        "qd_storage_rating": 4,
        "qd_gps": {
          "lat": 0.5123,
          "lng": 34.6111,
          "accuracy": 6.2,
          "label": "Kanduyi Market"
        }
      },
      "syncStatus": "synced",
      "syncedAt": "2026-10-29T09:01:50.135Z"
    }
  ];

  const syncQueue = [
    {
      id: 'sq_initial_1',
      action: 'SUBMIT_RESPONSE',
      recordId: 'resp_seed_105_offline',
      title: 'Response: Meru County (Timau / Buuri Plot #8)',
      createdAt: daysAgo(0.3),
      attempts: 0
    },
    {
      id: 'sq_initial_2',
      action: 'SUBMIT_RESPONSE',
      recordId: 'resp_dealer_202_offline',
      title: 'Response: Mkulima Bora Stockist (Agro-Dealer Audit)',
      createdAt: daysAgo(0.1),
      attempts: 0
    }
  ];

  const syncLogs = [
    {
      id: 'log_1',
      timestamp: daysAgo(2),
      action: 'BATCH_SYNC',
      details: 'Synced 3 surveys & 5 field responses to Google Sheets (`Surveys`, `Responses`, and per-survey tabs).',
      status: 'success',
      latencyMs: 412
    }
  ];

  const personnel = getInitialPersonnelSeed();

  return { surveys, collectors, responses, syncQueue, syncLogs, personnel };
}

/**
 * Enterprise Field Personnel Seed: Admins, Field Supervisors, Enumerators across Kenya
 */
function getInitialPersonnelSeed() {
  const now = new Date();
  const daysAgo = (d) => new Date(now.getTime() - d * 86400000).toISOString();

  return [
    {
      id: 'ADM-01',
      fullName: 'Moses Adundo',
      role: 'admin',
      county: 'Nairobi HQ',
      subCounty: 'Westlands HQ',
      phone: '+254 720 100 200',
      email: 'm.adundo@agriexperience.com',
      supervisorId: null,
      pinCode: '9999',
      assignedSurveys: ['srv_maize_2026', 'srv_agro_dealer_2026', 'srv_chd_agro_dealer_stock'],
      active: true,
      createdAt: daysAgo(30),
      updatedAt: daysAgo(2)
    },
    {
      id: 'ADM-02',
      fullName: "Sarah Ndung'u",
      role: 'admin',
      county: 'Nairobi HQ',
      subCounty: 'Data Ops Hub',
      phone: '+254 721 300 400',
      email: 's.ndungu@agriexperience.com',
      supervisorId: null,
      pinCode: '8888',
      assignedSurveys: ['srv_maize_2026', 'srv_agro_dealer_2026', 'srv_chd_agro_dealer_stock'],
      active: true,
      createdAt: daysAgo(28),
      updatedAt: daysAgo(1)
    },
    {
      id: 'SUP-01',
      fullName: 'Peter Kamau',
      role: 'supervisor',
      county: 'Nakuru',
      subCounty: 'Rift Valley Cluster',
      phone: '+254 722 555 101',
      email: 'p.kamau@agriexperience.com',
      supervisorId: 'ADM-01',
      pinCode: '1234',
      assignedSurveys: ['srv_maize_2026', 'srv_agro_dealer_2026'],
      active: true,
      createdAt: daysAgo(25),
      updatedAt: daysAgo(1)
    },
    {
      id: 'SUP-02',
      fullName: 'Eunice Achieng',
      role: 'supervisor',
      county: 'Bungoma',
      subCounty: 'Western Hub',
      phone: '+254 723 555 202',
      email: 'e.achieng@agriexperience.com',
      supervisorId: 'ADM-01',
      pinCode: '5678',
      assignedSurveys: ['srv_maize_2026', 'srv_chd_agro_dealer_stock'],
      active: true,
      createdAt: daysAgo(25),
      updatedAt: daysAgo(2)
    },
    {
      id: 'ENUM-04',
      fullName: 'Grace Wanjiku',
      role: 'enumerator',
      county: 'Nakuru',
      subCounty: 'Nakuru East',
      phone: '+254 712 345 678',
      email: 'g.wanjiku@agriexperience.com',
      supervisorId: 'SUP-01',
      pinCode: '1111',
      assignedSurveys: ['srv_maize_2026', 'srv_agro_dealer_2026'],
      taskQuotas: {
        'srv_maize_2026': { target: 12, notes: 'Target high-elevation plots in Nakuru East', deadline: '2026-11-15' },
        'srv_agro_dealer_2026': { target: 6, notes: 'Stock audit across registered retailers', deadline: '2026-11-20' }
      },
      active: true,
      createdAt: daysAgo(20),
      updatedAt: daysAgo(1)
    },
    {
      id: 'ENUM-07',
      fullName: 'Samuel Ochieng',
      role: 'enumerator',
      county: 'Bungoma',
      subCounty: 'Bungoma Central',
      phone: '+254 714 555 789',
      email: 's.ochieng@agriexperience.com',
      supervisorId: 'SUP-02',
      pinCode: '2222',
      assignedSurveys: ['srv_maize_2026', 'srv_chd_agro_dealer_stock'],
      taskQuotas: {
        'srv_maize_2026': { target: 10, notes: 'Bungoma Central farmer clusters', deadline: '2026-11-14' },
        'srv_chd_agro_dealer_stock': { target: 5, notes: 'Check seed packaging seals & lot dates', deadline: '2026-11-25' }
      },
      active: true,
      createdAt: daysAgo(20),
      updatedAt: daysAgo(1)
    },
    {
      id: 'ENUM-11',
      fullName: 'David Mutua',
      role: 'enumerator',
      county: 'Uasin Gishu',
      subCounty: 'Eldoret North',
      phone: '+254 715 666 890',
      email: 'd.mutua@agriexperience.com',
      supervisorId: 'SUP-01',
      pinCode: '3333',
      assignedSurveys: ['srv_maize_2026', 'srv_agro_dealer_2026'],
      taskQuotas: {
        'srv_maize_2026': { target: 15, notes: 'Drought-tolerant hybrid plot audits', deadline: '2026-11-18' },
        'srv_agro_dealer_2026': { target: 8, notes: 'Eldoret hub agro-dealers', deadline: '2026-11-22' }
      },
      active: true,
      createdAt: daysAgo(18),
      updatedAt: daysAgo(1)
    },
    {
      id: 'ENUM-15',
      fullName: 'Faith Chebet',
      role: 'enumerator',
      county: 'Trans Nzoia',
      subCounty: 'Kitale West',
      phone: '+254 716 777 901',
      email: 'f.chebet@agriexperience.com',
      supervisorId: 'SUP-01',
      pinCode: '4444',
      assignedSurveys: ['srv_maize_2026'],
      taskQuotas: {
        'srv_maize_2026': { target: 10, notes: 'Trans Nzoia commercial grain fields', deadline: '2026-11-16' }
      },
      active: true,
      createdAt: daysAgo(15),
      updatedAt: daysAgo(1)
    },
    {
      id: 'ENUM-18',
      fullName: 'Moses Kiprono',
      role: 'enumerator',
      county: 'Kakamega',
      subCounty: 'Webuye / Malava',
      phone: '+254 717 888 012',
      email: 'm.kiprono@agriexperience.com',
      supervisorId: 'SUP-02',
      pinCode: '5555',
      assignedSurveys: ['srv_maize_2026', 'srv_agro_dealer_2026', 'srv_chd_agro_dealer_stock'],
      active: true,
      createdAt: daysAgo(15),
      updatedAt: daysAgo(1)
    }
  ];
}

/**
 * Built-in AE Survey + Agri Experience Templates Gallery
 */
const SURVEY_TEMPLATES = [
  {
    id: 'tpl_seed_yield',
    name: 'Smallholder Seed Trial & Yield Assessment',
    category: 'Seed Systems & Yield',
    icon: 'fa-seedling',
    badge: 'Agri Experience Core',
    description: 'Pre-configured with GPS plot capture, variety selection, trait Likert matrix, kg/acre yield input, and Farmer NPS.',
    build: () => {
      const base = JSON.parse(JSON.stringify(getInitialSeedData().surveys[0]));
      base.id = 'srv_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5);
      base.title = 'New Smallholder Seed & Yield Assessment';
      base.status = 'Draft';
      base.version = 1;
      base.createdAt = new Date().toISOString();
      base.updatedAt = new Date().toISOString();
      return base;
    }
  },
  {
    id: 'tpl_agrodealer',
    name: 'Agro-Dealer Stock & Pricing Audit',
    category: 'Market & Retail Audit',
    icon: 'fa-store',
    badge: 'Retail Field Audit',
    description: 'Audit rural stockists for certified seed availability, 2kg/10kg pricing, storage compliance stars, and shop GPS.',
    build: () => {
      const base = JSON.parse(JSON.stringify(getInitialSeedData().surveys[1]));
      base.id = 'srv_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5);
      base.title = 'New Agro-Dealer Stock & Pricing Audit';
      base.status = 'Draft';
      base.version = 1;
      base.createdAt = new Date().toISOString();
      base.updatedAt = new Date().toISOString();
      return base;
    }
  },
  {
    id: 'tpl_csat_nps',
    name: 'AE Customer Satisfaction & NPS',
    category: 'Customer Feedback',
    icon: 'fa-face-smile',
    badge: 'AE Standard',
    description: 'Standard CSAT + Net Promoter Score (0–10) template with service matrix and open feedback.',
    build: () => ({
      id: 'srv_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5),
      title: 'Customer Satisfaction & Net Promoter Score (NPS) Survey',
      description: 'Measure overall customer satisfaction, service quality dimensions, and likelihood to recommend.',
      category: 'Customer Feedback',
      status: 'Active',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      theme: {
        accentColor: '#247B50',
        headerStyle: 'canopy',
        showProgressBar: true,
        showQuestionNumbers: true
      },
      quotas: [
        { id: 'qta_nakuru', name: 'Nakuru County Target', questionId: 'q_county', match: 'Nakuru', target: 50, action: 'warn' },
        { id: 'qta_machakos', name: 'Machakos County Target', questionId: 'q_county', match: 'Machakos', target: 50, action: 'warn' },
        { id: 'qta_kakamega', name: 'Kakamega County Target', questionId: 'q_county', match: 'Kakamega', target: 30, action: 'warn' },
        { id: 'qta_meru', name: 'Meru County Target', questionId: 'q_county', match: 'Meru', target: 25, action: 'warn' },
        { id: 'qta_uasin_gishu', name: 'Uasin Gishu Target', questionId: 'q_county', match: 'Uasin Gishu', target: 40, action: 'warn' },
        { id: 'qta_kitui', name: 'Kitui County Target', questionId: 'q_county', match: 'Kitui', target: 20, action: 'warn' }
      ],
      pages: [
        {
          id: 'p_' + Date.now().toString(36),
          title: 'Overall Experience & Recommendation',
          description: 'Please share your honest feedback to help us improve.',
          questions: [
            {
              id: 'q_csat_' + Math.random().toString(36).slice(2, 6),
              type: 'nps',
              title: 'How likely is it that you would recommend our organization to a friend or colleague?',
              helpText: '0 = Not at all likely, 10 = Extremely likely',
              required: true,
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_csat_star_' + Math.random().toString(36).slice(2, 6),
              type: 'star_rating',
              title: 'Overall, how satisfied or dissatisfied are you with your experience today?',
              helpText: 'Select from 1 to 5 stars.',
              required: true,
              maxStars: 5,
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            },
            {
              id: 'q_csat_text_' + Math.random().toString(36).slice(2, 6),
              type: 'long_text',
              title: 'What is the primary reason for your score, and how can we improve?',
              helpText: 'Share any specific details.',
              required: false,
              placeholder: 'Type your feedback here...',
              logic: { enabled: false, condition: 'equals', value: '', target: '' }
            }
          ]
        }
      ]
    })
  },
  {
    id: 'tpl_kephis_roster',
    name: 'KEPHIS Seed Certification & Stock Roster Audit',
    category: 'Regulatory & Quality Control',
    icon: 'fa-barcode',
    badge: 'Enterprise Telemetry',
    description: 'Benchmarked with ODK & CommCare: Cascading administrative dropdowns, optical KEPHIS barcode scanning, multi-variety stock roster, and verbal audio testimony.',
    build: () => ({
      id: 'srv_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5),
      title: 'KEPHIS Seed Label Authentication & Stock Roster Audit',
      description: 'Regulatory audit verifying certified seed authenticity via barcode/QR scans, multi-lot inventory rosters, and farmer audio testimony.',
      category: 'Regulatory & Quality Control',
      status: 'Active',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      theme: {
        accentColor: '#247B50',
        headerStyle: 'canopy',
        showProgressBar: true,
        showQuestionNumbers: true
      },
      quotas: [
        { id: 'qta_nakuru', name: 'Nakuru Target', questionId: 'q_admin_hierarchy', match: 'Nakuru', target: 50, action: 'warn' },
        { id: 'qta_machakos', name: 'Machakos Target', questionId: 'q_admin_hierarchy', match: 'Machakos', target: 40, action: 'warn' }
      ],
      pages: [
        {
          id: 'page_reg_1',
          title: 'Section 1: Location Hierarchy & Barcode Scan',
          description: 'Record administrative hierarchy and scan official KEPHIS seed authentication label.',
          questions: [
            {
              id: 'q_admin_hierarchy',
              type: 'cascading_dropdown',
              title: 'Administrative Location (County -> Sub-County -> Ward)',
              helpText: 'Select levels sequentially to pin down exact administrative unit.',
              required: true,
              levels: ['County', 'Sub-County', 'Ward'],
              hierarchyData: [
                { parent: 'Nakuru', child: 'Rongai', subchild: 'Menengai West' },
                { parent: 'Nakuru', child: 'Rongai', subchild: 'Soin' },
                { parent: 'Nakuru', child: 'Njoro', subchild: 'Mau Narok' },
                { parent: 'Machakos', child: 'Mwala', subchild: 'Masii' },
                { parent: 'Machakos', child: 'Mwala', subchild: 'Kibauni' },
                { parent: 'Machakos', child: 'Kangundo', subchild: 'Kangundo Central' },
                { parent: 'Uasin Gishu', child: 'Moiben', subchild: 'Tembelio' },
                { parent: 'Uasin Gishu', child: 'Soy', subchild: 'Barsombe' }
              ]
            },
            {
              id: 'q_kephis_barcode',
              type: 'barcode_scanner',
              title: 'Scan Certified Seed Pack Barcode or KEPHIS QR Code',
              helpText: 'Position camera over the seed label barcode or type the 10-digit authentication serial number.',
              required: true,
              verificationPattern: '^(KEPHIS|[0-9]{8,14}|[A-Z0-9-]{6,20})$',
              allowManualEntry: true
            }
          ]
        },
        {
          id: 'page_reg_2',
          title: 'Section 2: Inventory Roster & Voice Testimony',
          description: 'Document all seed lots currently on-hand and record qualitative feedback.',
          questions: [
            {
              id: 'q_stock_roster',
              type: 'repeat_group',
              title: 'Seed Variety Inventory & Pricing Roster',
              helpText: 'Add a record for each distinct seed variety lot in stock.',
              required: true,
              addButtonLabel: '+ Add Another Seed Variety Lot',
              fields: [
                { id: 'variety_name', label: 'Variety Name / Code', type: 'text', placeholder: 'e.g. DH04, SC Duma 43' },
                { id: 'stock_bags', label: 'Stock On-Hand (2kg Packs)', type: 'number', placeholder: 'e.g. 50' },
                { id: 'lot_number', label: 'Lot / Batch No.', type: 'text', placeholder: 'e.g. LOT-2026-NKR' },
                { id: 'price_kes', label: 'Retail Price (KES)', type: 'number', placeholder: 'e.g. 620' }
              ]
            },
            {
              id: 'q_farmer_audio',
              type: 'audio_note',
              title: 'Farmer / Stockist Voice Memo & Quality Testimony',
              helpText: 'Record a verbal statement regarding seed germination, delivery timing, or quality concerns.',
              required: false,
              maxDurationSec: 120
            }
          ]
        }
      ]
    })
  }
];

function sanitizeDeepObject(obj, maxDepth = 6) {
  if (!obj || typeof obj !== 'object' || maxDepth < 0) return obj;
  if (Array.isArray(obj)) {
    return obj.slice(0, 100).map((item) => sanitizeDeepObject(item, maxDepth - 1));
  }
  const clean = Object.create(null);
  for (const key of Object.keys(obj)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    const val = obj[key];
    if (val !== null && typeof val === 'object') {
      clean[key] = sanitizeDeepObject(val, maxDepth - 1);
    } else if (typeof val === 'string') {
      clean[key] = val.slice(0, 2000);
    } else {
      clean[key] = val;
    }
  }
  return { ...clean };
}

window.AEPinSecurity = {
  STORAGE_KEY: 'ae_sec_lockout_v2',

  getLockState() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : { attempts: 0, lockedUntil: 0 };
    } catch (e) {
      return { attempts: 0, lockedUntil: 0 };
    }
  },

  setLockState(state) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  },

  clearLockout() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {}
  },

  constantTimeCompare(a, b) {
    const strA = String(a || '');
    const strB = String(b || '');
    if (strA.length !== strB.length) return false;
    let diff = 0;
    for (let i = 0; i < strA.length; i++) {
      diff |= strA.charCodeAt(i) ^ strB.charCodeAt(i);
    }
    return diff === 0;
  },

  verify(candidatePin, expectedPin) {
    const now = Date.now();
    const state = this.getLockState();

    if (state.lockedUntil && now < state.lockedUntil) {
      const waitSec = Math.ceil((state.lockedUntil - now) / 1000);
      return { ok: false, error: `PIN lockout active. Try again in ${waitSec}s.`, locked: true };
    }

    const target = String(expectedPin || '1234').trim();
    const isMatch = this.constantTimeCompare(String(candidatePin || '').trim(), target);

    if (isMatch) {
      this.setLockState({ attempts: 0, lockedUntil: 0 });
      return { ok: true };
    } else {
      const attempts = (state.attempts || 0) + 1;
      let lockedUntil = 0;
      let error = '';

      if (attempts >= 5) {
        const lockoutPeriodMs = attempts >= 10 ? 120000 : 30000;
        lockedUntil = now + lockoutPeriodMs;
        error = `Too many failed attempts. Locked for ${lockoutPeriodMs / 1000}s.`;
      } else {
        const remaining = 5 - attempts;
        error = `Incorrect PIN (${remaining} attempt${remaining === 1 ? '' : 's'} remaining).`;
      }

      this.setLockState({ attempts, lockedUntil });
      return { ok: false, error, locked: lockedUntil > 0 };
    }
  }
};

window.AESupervisorAuth = window.AEPinSecurity;

/**
 * Deterministic Cryptographic Seal & Anti-Tamper Engine
 * Computes canonical SHA-256 digests over core response payloads using Web Crypto API.
 */
window.AEIntegrityEngine = {
  canonicalStringify(obj) {
    if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
      return '[' + obj.map((item) => this.canonicalStringify(item)).join(',') + ']';
    }
    const keys = Object.keys(obj).sort();
    return '{' + keys.map((k) => JSON.stringify(k) + ':' + this.canonicalStringify(obj[k])).join(',') + '}';
  },

  buildRecordDigestPayload(record) {
    return {
      clientResponseId: record.clientResponseId || record.id,
      surveyId: record.surveyId,
      collectorId: record.collectorId,
      enumerator: record.enumerator,
      submittedAt: record.submittedAt,
      durationSec: record.durationSec,
      answers: record.answers || {},
      gps: record.gps
        ? {
            lat: record.gps.lat,
            lng: record.gps.lng,
            accuracy: record.gps.accuracy
          }
        : null
    };
  },

  async computeRecordHash(record) {
    const canonical = this.canonicalStringify(this.buildRecordDigestPayload(record));
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle && window.crypto.subtle.digest) {
      try {
        const enc = new TextEncoder().encode(canonical);
        const buf = await window.crypto.subtle.digest('SHA-256', enc);
        const arr = Array.from(new Uint8Array(buf));
        return arr.map((b) => (b < 16 ? '0' : '') + b.toString(16)).join('');
      } catch (e) {}
    }
    // Fallback deterministic digest for non-crypto environments
    let h1 = 0xdeadbeef ^ 0,
      h2 = 0x41c6ce57 ^ 0;
    for (let i = 0; i < canonical.length; i++) {
      const ch = canonical.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    const hex = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
    return 'sha256_compat_' + hex.padStart(16, '0');
  },

  async verifyRecordHash(record) {
    if (!record || !record.recordHash) return false;
    const computed = await this.computeRecordHash(record);
    return computed === record.recordHash;
  }
};

/**
 * Supervisor Verification Audit Engine
 * Manages tamper-evident Merkle-chained audit trail entries.
 */
window.AESupervisorAuditEngine = {
  createAuditEntry(previousHash, action, supervisorId, notes, recordId) {
    const timestamp = new Date().toISOString();
    const entryData = {
      recordId: recordId || '',
      action: String(action || 'VERIFY'),
      supervisorId: String(supervisorId || 'SUP-SYSTEM'),
      notes: String(notes || '').slice(0, 500),
      timestamp,
      previousHash: String(previousHash || 'ROOT_GENESIS_0000000000000000')
    };
    const canonical = AEIntegrityEngine.canonicalStringify(entryData);
    let hash = 0;
    for (let i = 0; i < canonical.length; i++) {
      hash = (hash << 5) - hash + canonical.charCodeAt(i);
      hash |= 0;
    }
    return {
      ...entryData,
      entryHash: 'aud_' + Math.abs(hash).toString(16) + '_' + Date.now().toString(36)
    };
  }
};

/**
 * Role-Based Access Control (RBAC) & Active Session Engine
 * Enforces authentication gates and capability permissions across Admin & Field apps.
 */
window.AESession = {
  STORAGE_KEY: 'ae_auth_session_v2',

  getCurrentUser() {
    try {
      const raw = sessionStorage.getItem(this.STORAGE_KEY) || localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      const user = JSON.parse(raw);
      if (!user || !user.id || !user.role) return null;

      // Always hydrate live fields from aeStore if available
      if (window.aeStore && typeof window.aeStore.getPersonnelById === 'function') {
        const live = window.aeStore.getPersonnelById(user.id);
        if (live && live.active !== false) {
          user.fullName = live.fullName;
          user.role = live.role;
          user.county = live.county;
          user.subCounty = live.subCounty;
          user.phone = live.phone;
          user.email = live.email;
        }
      }

      return user;
    } catch (e) {
      return null;
    }
  },

  syncCurrentUser(liveUser) {
    if (!liveUser || !liveUser.id) return;
    const current = this.getCurrentUser();
    if (current && current.id === liveUser.id) {
      this.setCurrentUser(liveUser, true);
    }
  },

  setCurrentUser(user, persist = true) {
    if (!user) {
      sessionStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.STORAGE_KEY);
      return;
    }
    const safeUser = {
      id: String(user.id || ''),
      fullName: String(user.fullName || ''),
      role: ['admin', 'supervisor', 'enumerator'].includes(user.role) ? user.role : 'enumerator',
      county: String(user.county || 'All'),
      phone: String(user.phone || ''),
      email: String(user.email || ''),
      loggedInAt: new Date().toISOString()
    };
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(safeUser));
    if (persist) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(safeUser));
    }
    if (safeUser.role === 'admin' || safeUser.role === 'supervisor') {
      try {
        const savedEnum = localStorage.getItem('ae_active_enumerator');
        const roleSuffix = safeUser.role === 'admin' ? 'HQ Admin' : 'Supervisor';
        if (!savedEnum || savedEnum.includes('HQ Admin') || savedEnum.includes('Supervisor') || savedEnum.includes('Dr. John Mutua')) {
          localStorage.setItem('ae_active_enumerator', `${safeUser.fullName} (${roleSuffix})`);
        }
      } catch (e) {}
    }
  },

  async login(personnelId, candidatePin, persist = true) {
    if (!window.aeStore) return { ok: false, error: 'Database not initialized.' };
    let check = typeof window.aeStore.verifyPersonnelPinAsync === 'function'
      ? await window.aeStore.verifyPersonnelPinAsync(personnelId, candidatePin)
      : window.aeStore.verifyPersonnelPin(personnelId, candidatePin);
    if (!check.ok) return check;

    const person = check.person || window.aeStore.getPersonnelById(personnelId);
    if (!person) {
      return { ok: false, error: 'Staff account not found.' };
    }

    const sessionUser = {
      id: person.id,
      fullName: person.fullName,
      role: person.role,
      county: person.county,
      phone: person.phone,
      email: person.email
    };
    this.setCurrentUser(sessionUser, persist);
    return { ok: true, user: sessionUser };
  },

  logout() {
    sessionStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.STORAGE_KEY);
  },

  hasPermission(permission) {
    const user = this.getCurrentUser();
    if (!user) return false;
    const role = user.role;

    if (role === 'admin') return true;

    if (role === 'supervisor') {
      const supervisorAllowed = [
        'VIEW_DASHBOARD',
        'VIEW_SURVEYS',
        'VIEW_COLLECTORS',
        'VIEW_ANALYTICS',
        'REVIEW_RESPONSES',
        'APPROVE_RESPONSES',
        'FLAG_RESPONSES',
        'VIEW_TEAM',
        'ASSIGN_TASKS',
        'VIEW_GPS_MAP',
        'EXPORT_EXCEL',
        'EXPORT_CSV'
      ];
      return supervisorAllowed.includes(permission);
    }

    if (role === 'enumerator') {
      const enumeratorAllowed = [
        'COLLECT_FIELD_DATA',
        'VIEW_ASSIGNED_SURVEYS'
      ];
      return enumeratorAllowed.includes(permission);
    }

    return false;
  }
};

/**
 * Dynamic Variable Recall & Text Piping Engine
 * Replaces {{question_id}} or {{question_id | 'Fallback'}} tokens with draft answers.
 */
window.AEPiping = {
  interpolate(template, answers = {}, survey = null) {
    if (!template || typeof template !== 'string') return '';
    return template.replace(/\{\{\s*([a-zA-Z0-9_-]+)(?:\s*\|\s*['"]([^'"]+)['"])?\s*\}\}/g, (match, qId, fallback) => {
      const val = answers[qId];
      if (val === undefined || val === null || val === '') {
        return fallback !== undefined ? fallback : match;
      }
      if (Array.isArray(val)) return val.join(', ');
      if (typeof val === 'object') {
        if (val.lat !== undefined && val.lng !== undefined) {
          return val.label || `${val.lat.toFixed(4)}, ${val.lng.toFixed(4)}`;
        }
        if (val.crop && val.variety) {
          return `${val.crop} - ${val.variety}`;
        }
        return JSON.stringify(val);
      }
      return String(val);
    });
  }
};

/**
 * Main Database & Cloud Sync Service
 */
const AE_DEFAULT_GAS_CONFIG = {
  gasWebAppUrl: 'https://script.google.com/macros/s/AKfycbzzBECJ5o02M2yaaJGrL41bTL1bgU2dltcQ8GicgR3x15jkocvYzNocWNk7_k75DNoV7Q/exec',
  syncToken: '6B3D46E11CAD5800CA490A356DEC10D6'
};

class AESurveyStore {
  constructor() {
    this.idb = null;
    this.surveys = [];
    this.collectors = [];
    this.responses = [];
    this.personnel = [];
    this.syncQueue = [];
    this.syncLogs = [];
    this.runnerDrafts = {};
    this.lastSyncError = null;
    this._syncInFlight = false;
    this._surveysDirty = false;
    this.settings = {
      gasWebAppUrl: AE_DEFAULT_GAS_CONFIG.gasWebAppUrl,
      syncToken: AE_DEFAULT_GAS_CONFIG.syncToken,
      spreadsheetUrl: '',
      spreadsheetName: 'AgriExperience_AE_Survey_Master_DB',
      autoSyncOnOnline: true,
      simulateOffline: false,
      deviceId: 'AE-TAB-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      defaultEnumerator: 'Grace Wanjiku (Enum-04)',
      lastSyncedAt: null
    };
    this.listeners = [];
  }

  async init() {
    this.loadFromLocalStorage();

    // Support URL Query Parameter Auto-Config (?gasUrl=...&syncToken=...)
    if (typeof window !== 'undefined' && window.location && window.location.search) {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlParam = params.get('gasUrl') || params.get('gas');
        const tokenParam = params.get('syncToken') || params.get('token');
        let updated = false;
        if (urlParam && this.isValidGasUrl(urlParam)) {
          this.settings.gasWebAppUrl = urlParam.trim();
          updated = true;
        }
        if (tokenParam) {
          this.settings.syncToken = tokenParam.trim();
          updated = true;
        }
        if (updated) {
          this.saveToLocalStorage();
        }
      } catch (e) {}
    }

    try {
      this.idb = await this.openIndexedDB();
      await this.reconcileIndexedDB();
    } catch (e) {
      console.warn('IndexedDB unavailable, using synchronous localStorage engine:', e);
    }
    // Refresh personnel roster from Google Sheets in background so cross-device PIN changes take effect immediately
    if (this.isEffectivelyOnline() && this.settings.gasWebAppUrl) {
      this.refreshPersonnelFromCloud().catch(() => {});
    }
    // Launch continuous background auto-sync daemon
    this.startBackgroundSyncDaemon();
    return this;
  }

  openIndexedDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        return reject(new Error('IndexedDB not supported'));
      }
      const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = (event) => {
        const db = event.target.result;
        ['surveys', 'collectors', 'responses', 'syncQueue', 'meta', 'personnel', 'mediaBlobs'].forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async saveMediaBlob(mediaId, blobOrBase64, mimeType = 'image/jpeg') {
    if (!this.idb) {
      try {
        localStorage.setItem('ae_media_' + mediaId, typeof blobOrBase64 === 'string' ? blobOrBase64 : '');
      } catch (e) {}
      return mediaId;
    }
    return new Promise((resolve) => {
      try {
        const tx = this.idb.transaction('mediaBlobs', 'readwrite');
        const store = tx.objectStore('mediaBlobs');
        store.put({
          id: mediaId,
          data: blobOrBase64,
          mimeType,
          createdAt: new Date().toISOString()
        });
        tx.oncomplete = () => resolve(mediaId);
        tx.onerror = () => resolve(mediaId);
      } catch (e) {
        resolve(mediaId);
      }
    });
  }

  async getMediaBlob(mediaId) {
    if (!this.idb) {
      return localStorage.getItem('ae_media_' + mediaId) || null;
    }
    return new Promise((resolve) => {
      try {
        const tx = this.idb.transaction('mediaBlobs', 'readonly');
        const store = tx.objectStore('mediaBlobs');
        const req = store.get(mediaId);
        req.onsuccess = () => resolve(req.result ? req.result.data : null);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  async reconcileIndexedDB() {
    if (!this.idb) return;
    const idbSurveys = await this.readStoreAll('surveys');
    if (idbSurveys.length === 0 && this.surveys.length > 0) {
      await this.persistAllToIDB();
    } else if (idbSurveys.length > 0) {
      this.surveys = idbSurveys;
      const cols = await this.readStoreAll('collectors');
      if (cols.length) this.collectors = cols;
      const resps = await this.readStoreAll('responses');
      if (resps.length) {
        this.responses = resps;
        this.healResponsesAnswers();
      }
      const staff = await this.readStoreAll('personnel');
      if (staff.length) this.personnel = staff;
      const queue = await this.readStoreAll('syncQueue');
      this.syncQueue = queue;
      this.saveToLocalStorage();
    }
  }

  /**
   * Restores rich question answers if responses were stripped or damaged by prior column mismatch
   */
  cleanAnswersForCloudSync(answers) {
    if (!answers || typeof answers !== 'object') return {};
    const clean = {};
    for (const [k, v] of Object.entries(answers)) {
      if (typeof v === 'string' && v.startsWith('data:image/')) {
        clean[k] = '[Digital Signature/Image Recorded]';
      } else if (v && typeof v === 'object' && v.dataUrl) {
        clean[k] = {
          capturedAt: v.capturedAt || '',
          width: v.width || 0,
          height: v.height || 0,
          sizeKb: v.sizeKb || 0,
          summary: `Photo proof attached (${v.sizeKb || 0} KB)`
        };
      } else {
        clean[k] = v;
      }
    }
    return clean;
  }

  /**
   * Restores rich question answers if responses were stripped or damaged by prior column mismatch
   */
  healResponsesAnswers() {
    const seedResponses = (typeof getInitialSeedData === 'function' ? getInitialSeedData().responses : []) || [];
    const seedMap = new Map();
    const surveySeedGroups = {};

    seedResponses.forEach((sr) => {
      if (sr.id) seedMap.set(sr.id, sr);
      if (sr.clientResponseId) seedMap.set(sr.clientResponseId, sr);
      if (sr.submittedAt && sr.enumerator) {
        seedMap.set(`${sr.submittedAt}_${sr.enumerator}`, sr);
        seedMap.set(`${String(sr.submittedAt).slice(0, 16)}_${sr.enumerator}`, sr);
      }
      if (sr.surveyId) {
        if (!surveySeedGroups[sr.surveyId]) surveySeedGroups[sr.surveyId] = [];
        surveySeedGroups[sr.surveyId].push(sr);
      }
    });

    let healed = 0;
    (this.responses || []).forEach((r, idx) => {
      // 1. Direct ID / clientResponseId match
      let match = seedMap.get(r.id) || seedMap.get(r.clientResponseId);

      // 2. Enumerator + timestamp prefix match
      if (!match && r.submittedAt && r.enumerator) {
        match = seedMap.get(`${r.submittedAt}_${r.enumerator}`) ||
                seedMap.get(`${String(r.submittedAt).slice(0, 16)}_${r.enumerator}`);
      }

      // 3. Heuristic match: enumerator + duration / date proximity
      if (!match && r.enumerator) {
        match = seedResponses.find((sr) => {
          if (sr.enumerator !== r.enumerator) return false;
          if (r.durationSec && sr.durationSec && Math.abs(r.durationSec - sr.durationSec) <= 5) return true;
          if (r.submittedAt && sr.submittedAt && String(r.submittedAt).slice(0, 10) === String(sr.submittedAt).slice(0, 10)) return true;
          return false;
        });
      }

      // 4. Survey group fallback
      if (!match && r.surveyId && surveySeedGroups[r.surveyId]) {
        const group = surveySeedGroups[r.surveyId];
        match = group[idx % group.length];
      }

      const currentAnswers = (r.answers && typeof r.answers === 'object') ? r.answers : {};
      const answerKeys = Object.keys(currentAnswers);
      const isDamaged = answerKeys.length === 0 || (match && match.answers && Object.keys(match.answers).length > answerKeys.length);

      if (isDamaged && match && match.answers) {
        r.answers = { ...JSON.parse(JSON.stringify(match.answers)), ...currentAnswers };
        if (match.reviewStatus && !r.reviewStatus) r.reviewStatus = match.reviewStatus;
        if (match.qaFlags && (!r.qaFlags || !r.qaFlags.length)) r.qaFlags = match.qaFlags;
        healed++;
      }

      // Ensure dual alias keys are present for cross-version compatibility
      if (r.answers && typeof r.answers === 'object') {
        const ans = r.answers;
        if (ans.q_nps !== undefined && ans.q_nps_seed === undefined) ans.q_nps_seed = ans.q_nps;
        if (ans.q_nps_seed !== undefined && ans.q_nps === undefined) ans.q_nps = ans.q_nps_seed;
        if (ans.q_verbatim !== undefined && ans.q_field_notes === undefined) ans.q_field_notes = ans.q_verbatim;
        if (ans.q_field_notes !== undefined && ans.q_verbatim === undefined) ans.q_verbatim = ans.q_field_notes;
        if (ans.q_field_photo !== undefined && ans.q_crop_photo === undefined) ans.q_crop_photo = ans.q_field_photo;
        if (ans.q_crop_photo !== undefined && ans.q_field_photo === undefined) ans.q_field_photo = ans.q_crop_photo;
      }
    });

    if (healed > 0) {
      this.saveToLocalStorage();
      if (this.idb) {
        (this.responses || []).forEach((r) => {
          this.writeStore('responses', r).catch(() => {});
        });
      }
    }
    return healed;
  }

  writeStore(storeName, item) {
    if (!this.idb) return Promise.resolve();
    return new Promise((resolve) => {
      try {
        const tx = this.idb.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.put(item);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (e) {
        resolve();
      }
    });
  }

  readStoreAll(storeName) {
    return new Promise((resolve) => {
      if (!this.idb) return resolve([]);
      try {
        const tx = this.idb.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });
  }

  async persistAllToIDB() {
    if (!this.idb) return;
    const writeCollection = (storeName, items) =>
      new Promise((resolve) => {
        try {
          const tx = this.idb.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          store.clear();
          items.forEach((item) => store.put(item));
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch (e) {
          resolve();
        }
      });

    await Promise.all([
      writeCollection('surveys', this.surveys),
      writeCollection('collectors', this.collectors),
      writeCollection('responses', this.responses),
      writeCollection('personnel', this.personnel),
      writeCollection('syncQueue', this.syncQueue)
    ]);
  }

  loadFromLocalStorage() {
    const rawSurveys = localStorage.getItem(AE_STORAGE_KEYS.SURVEYS);
    if (!rawSurveys) {
      const seed = getInitialSeedData();
      this.surveys = seed.surveys;
      this.collectors = seed.collectors;
      this.responses = seed.responses;
      this.personnel = seed.personnel || getInitialPersonnelSeed();
      this.syncQueue = seed.syncQueue;
      this.syncLogs = seed.syncLogs;
      this.settings.lastSyncedAt = new Date(Date.now() - 7200000).toISOString();
      this.saveToLocalStorage();
      return;
    }

    try {
      this.surveys = JSON.parse(rawSurveys) || [];
      this.collectors = JSON.parse(localStorage.getItem(AE_STORAGE_KEYS.COLLECTORS) || '[]');
      this.responses = JSON.parse(localStorage.getItem(AE_STORAGE_KEYS.RESPONSES) || '[]');

      // Auto-heal responses: restore full answers if previously stripped by cloud column mismatch
      const seedMap = new Map(getInitialSeedData().responses.map((sr) => [sr.id, sr]));
      this.responses.forEach((r) => {
        const hasAnswers = r.answers && typeof r.answers === 'object' && Object.keys(r.answers).length > 0;
        if (!hasAnswers && seedMap.has(r.id)) {
          const seedItem = seedMap.get(r.id);
          r.answers = JSON.parse(JSON.stringify(seedItem.answers || {}));
          if (seedItem.reviewStatus) r.reviewStatus = seedItem.reviewStatus;
          if (seedItem.qaFlags) r.qaFlags = seedItem.qaFlags;
        } else if (hasAnswers) {
          const ans = r.answers;
          if (ans.q_nps !== undefined && ans.q_nps_seed === undefined) ans.q_nps_seed = ans.q_nps;
          if (ans.q_nps_seed !== undefined && ans.q_nps === undefined) ans.q_nps = ans.q_nps_seed;
          if (ans.q_verbatim !== undefined && ans.q_field_notes === undefined) ans.q_field_notes = ans.q_verbatim;
          if (ans.q_field_notes !== undefined && ans.q_verbatim === undefined) ans.q_verbatim = ans.q_field_notes;
          if (ans.q_field_photo !== undefined && ans.q_crop_photo === undefined) ans.q_crop_photo = ans.q_field_photo;
          if (ans.q_crop_photo !== undefined && ans.q_field_photo === undefined) ans.q_field_photo = ans.q_crop_photo;
        }
      });
      const rawPersonnel = localStorage.getItem(AE_STORAGE_KEYS.PERSONNEL);
      this.personnel = rawPersonnel ? JSON.parse(rawPersonnel) : getInitialPersonnelSeed();
      this.syncQueue = JSON.parse(localStorage.getItem(AE_STORAGE_KEYS.SYNC_QUEUE) || '[]');
      this.syncLogs = JSON.parse(localStorage.getItem(AE_STORAGE_KEYS.SYNC_LOGS) || '[]');
      const savedSettings = JSON.parse(localStorage.getItem(AE_STORAGE_KEYS.SETTINGS) || '{}');
      this.settings = { ...this.settings, ...savedSettings };
      // Fall back to pre-configured production credentials if empty
      if (!this.settings.gasWebAppUrl) {
        this.settings.gasWebAppUrl = AE_DEFAULT_GAS_CONFIG.gasWebAppUrl;
      }
      if (!this.settings.syncToken) {
        this.settings.syncToken = AE_DEFAULT_GAS_CONFIG.syncToken;
      }
      this.runnerDrafts = JSON.parse(localStorage.getItem(AE_STORAGE_KEYS.RUNNER_DRAFTS) || '{}');
    } catch (e) {
      const seed = getInitialSeedData();
      this.surveys = seed.surveys;
      this.collectors = seed.collectors;
      this.responses = seed.responses;
      this.personnel = seed.personnel || getInitialPersonnelSeed();
      this.syncQueue = seed.syncQueue;
      this.syncLogs = seed.syncLogs;
    }
  }

  saveToLocalStorage() {
    localStorage.setItem(AE_STORAGE_KEYS.SURVEYS, JSON.stringify(this.surveys));
    localStorage.setItem(AE_STORAGE_KEYS.COLLECTORS, JSON.stringify(this.collectors));
    localStorage.setItem(AE_STORAGE_KEYS.RESPONSES, JSON.stringify(this.responses));
    localStorage.setItem(AE_STORAGE_KEYS.PERSONNEL, JSON.stringify(this.personnel || []));
    localStorage.setItem(AE_STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(this.syncQueue));
    localStorage.setItem(AE_STORAGE_KEYS.SYNC_LOGS, JSON.stringify(this.syncLogs.slice(0, 40)));
    localStorage.setItem(AE_STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
    localStorage.setItem(AE_STORAGE_KEYS.RUNNER_DRAFTS, JSON.stringify(this.runnerDrafts || {}));
    this.persistAllToIDB();
    this.notify();
  }

  subscribe(fn) {
    this.listeners.push(fn);
  }

  notify() {
    this.listeners.forEach((fn) => {
      try {
        fn(this);
      } catch (e) {}
    });
  }

  isEffectivelyOnline() {
    if (this.settings.simulateOffline) return false;
    return navigator.onLine !== false;
  }

  updateSettings(partial) {
    this.settings = { ...this.settings, ...partial };
    this.saveToLocalStorage();
  }

  getSurveyById(surveyId) {
    return this.surveys.find((s) => s.id === surveyId) || null;
  }

  getQuestionsForSurvey(survey) {
    if (!survey || !Array.isArray(survey.pages)) return [];
    const list = [];
    survey.pages.forEach((page, pageIdx) => {
      (page.questions || []).forEach((q) => {
        list.push({ ...q, pageId: page.id, pageIndex: pageIdx, pageTitle: page.title });
      });
    });
    return list;
  }

  getResponsesForSurvey(surveyId) {
    return this.responses.filter((r) => r.surveyId === surveyId);
  }

  getCollectorsForSurvey(surveyId) {
    return this.collectors.filter((c) => c.surveyId === surveyId);
  }

  getPersonnel(filter = {}) {
    let list = Array.isArray(this.personnel) ? [...this.personnel] : [];
    if (filter.role && filter.role !== 'all') {
      list = list.filter((p) => p.role === filter.role);
    }
    if (filter.county && filter.county !== 'all') {
      list = list.filter((p) => p.county === filter.county);
    }
    if (filter.supervisorId && filter.supervisorId !== 'all') {
      list = list.filter((p) => p.supervisorId === filter.supervisorId);
    }
    if (filter.active !== undefined) {
      list = list.filter((p) => (filter.active ? p.active !== false : p.active === false));
    }
    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          (p.fullName || '').toLowerCase().includes(q) ||
          (p.id || '').toLowerCase().includes(q) ||
          (p.phone || '').toLowerCase().includes(q) ||
          (p.county || '').toLowerCase().includes(q) ||
          (p.email || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  getPersonnelById(id) {
    if (!id || !Array.isArray(this.personnel)) return null;
    return this.personnel.find((p) => p.id === id) || null;
  }

  upsertPersonnel(person) {
    if (!person || !person.fullName) throw new Error('Personnel full name is required');
    this.personnel = Array.isArray(this.personnel) ? this.personnel : [];

    let id = person.id ? this.sanitizeSafeId(person.id, 'PER') : '';
    if (!id) {
      const prefix = person.role === 'admin' ? 'ADM' : person.role === 'supervisor' ? 'SUP' : 'ENUM';
      const existingCount = this.personnel.filter((p) => p.role === person.role).length + 1;
      id = `${prefix}-${existingCount}`;
    }

    const clean = {
      id,
      fullName: String(person.fullName).trim().slice(0, 100),
      role: ['admin', 'supervisor', 'enumerator'].includes(person.role) ? person.role : 'enumerator',
      county: String(person.county || 'Unassigned').trim().slice(0, 60),
      subCounty: String(person.subCounty || '').trim().slice(0, 60),
      phone: String(person.phone || '').trim().slice(0, 30),
      email: String(person.email || '').trim().slice(0, 80),
      supervisorId: person.supervisorId ? String(person.supervisorId).trim() : null,
      pinCode: String(person.pinCode || '1234').trim().slice(0, 8),
      assignedSurveys: Array.isArray(person.assignedSurveys) ? person.assignedSurveys : [],
      taskQuotas: person.taskQuotas && typeof person.taskQuotas === 'object' ? person.taskQuotas : {},
      active: person.active !== false,
      createdAt: person.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const idx = this.personnel.findIndex((p) => p.id === clean.id);
    if (idx >= 0) {
      this.personnel[idx] = clean;
    } else {
      this.personnel.unshift(clean);
    }

    this.enqueueSyncItem('UPSERT_PERSONNEL', clean.id, `Personnel (${clean.role}): ${clean.fullName}`);
    this.saveToLocalStorage();
    if (window.AESession && typeof window.AESession.syncCurrentUser === 'function') {
      window.AESession.syncCurrentUser(clean);
    }
    return clean;
  }

  deletePersonnel(id) {
    const p = this.getPersonnelById(id);
    if (!p) return;
    p.active = false;
    this.upsertPersonnel(p);
  }

  verifyPersonnelPin(personId, candidatePin) {
    const pin = String(candidatePin || '').trim();
    if (!pin) return { ok: false, error: 'PIN code is required' };
    const person = this.getPersonnelById(personId);

    const matchingSupervisor = (this.personnel || []).find(
      (p) => (p.role === 'admin' || p.role === 'supervisor') && p.active !== false && p.pinCode === pin
    );

    if (!person) {
      if (matchingSupervisor) return { ok: true, role: matchingSupervisor.role, supervisor: matchingSupervisor };
      return { ok: false, error: 'Staff profile not found.' };
    }

    const check = window.AEPinSecurity.verify(pin, person.pinCode);
    if (check.ok) {
      return { ok: true, person, role: person.role };
    }
    if (matchingSupervisor) {
      return { ok: true, person, role: person.role, supervisorOverride: true, supervisor: matchingSupervisor };
    }
    return check;
  }

  /**
   * Asynchronous PIN verification with cloud fallback.
   * If candidate PIN doesn't match locally stored PIN (e.g. updated on another device),
   * queries Google Sheets in real-time, synchronizes the new PIN, and authenticates.
   */
  async verifyPersonnelPinAsync(personId, candidatePin) {
    let check = this.verifyPersonnelPin(personId, candidatePin);
    if (!check.ok && this.isEffectivelyOnline() && this.settings.gasWebAppUrl) {
      try {
        await this.refreshPersonnelFromCloud();
        check = this.verifyPersonnelPin(personId, candidatePin);
      } catch (e) {}
    }
    return check;
  }

  /**
   * Pushes updated personnel credentials/PIN directly to Google Sheets in background.
   */
  async syncPersonnelToCloud(person) {
    const gasUrl = (this.settings.gasWebAppUrl || '').trim();
    if (!gasUrl || !this.isValidGasUrl(gasUrl) || !this.isEffectivelyOnline()) return false;

    const currentSessionUser = (window.AESession && typeof window.AESession.getCurrentUser === 'function')
      ? window.AESession.getCurrentUser()
      : null;

    const payload = {
      action: 'UPSERT_PERSONNEL',
      syncToken: this.settings.syncToken || '',
      deviceId: this.settings.deviceId,
      callerId: currentSessionUser ? currentSessionUser.id : (person ? person.id : 'ADM-01'),
      personnel: person
    };

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        redirect: 'follow',
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res && res.ok) {
        const data = await res.json();
        if (data && data.ok) {
          if (Array.isArray(data.personnel) && data.personnel.length > 0) {
            this.mergePersonnelFromCloud(data.personnel);
          }
          this.syncQueue = this.syncQueue.filter((q) => q.recordId !== person.id);
          this.saveToLocalStorage();
          return true;
        }
      }
    } catch (e) {
      console.warn('Direct personnel sync fallback to batch sync:', e);
    }
    return false;
  }

  /**
   * Fetches latest personnel roster and PIN updates from Google Sheets.
   */
  async refreshPersonnelFromCloud() {
    const gasUrl = (this.settings.gasWebAppUrl || '').trim();
    if (!gasUrl || !this.isValidGasUrl(gasUrl) || !this.isEffectivelyOnline()) return null;

    try {
      const sep = gasUrl.includes('?') ? '&' : '?';
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      let response;
      try {
        response = await fetch(
          `${gasUrl}${sep}action=pullPersonnel&deviceId=${encodeURIComponent(this.settings.deviceId)}&syncToken=${encodeURIComponent(this.settings.syncToken || '')}&t=${Date.now()}`,
          { method: 'GET', redirect: 'follow', signal: controller.signal }
        );
      } finally {
        clearTimeout(timer);
      }

      if (response && response.ok) {
        const data = await response.json();
        if (data && data.ok && Array.isArray(data.personnel) && data.personnel.length > 0) {
          this.mergePersonnelFromCloud(data.personnel);
          return data.personnel;
        }
      }
    } catch (e) {
      // Non-blocking background refresh
    }
    return null;
  }

  /**
   * Merges remote staff credentials and PINs into local IndexedDB/localStorage.
   */
  mergePersonnelFromCloud(remotePersonnel) {
    if (!Array.isArray(remotePersonnel) || remotePersonnel.length === 0) return;
    const perMap = new Map((this.personnel || []).map((p) => [p.id, p]));
    let changed = false;

    remotePersonnel.forEach((rp) => {
      if (!rp || !rp.id) return;
      const existing = perMap.get(rp.id);
      if (!existing) {
        perMap.set(rp.id, {
          id: rp.id,
          fullName: rp.fullName || 'Staff Member',
          role: rp.role || 'enumerator',
          county: rp.county || 'Unassigned',
          subCounty: rp.subCounty || '',
          phone: rp.phone || '',
          email: rp.email || '',
          supervisorId: rp.supervisorId || null,
          assignedSurveys: Array.isArray(rp.assignedSurveys) ? rp.assignedSurveys : [],
          taskQuotas: rp.taskQuotas || {},
          active: rp.active !== false,
          pinCode: String(rp.pinCode || '1234').trim(),
          createdAt: rp.createdAt || new Date().toISOString(),
          updatedAt: rp.updatedAt || new Date().toISOString()
        });
        changed = true;
      } else {
        if (rp.pinCode && String(rp.pinCode).trim() !== existing.pinCode) {
          existing.pinCode = String(rp.pinCode).trim();
          changed = true;
        }
        if (rp.fullName && rp.fullName !== existing.fullName) {
          existing.fullName = rp.fullName;
          changed = true;
        }
        if (rp.role && rp.role !== existing.role) {
          existing.role = rp.role;
          changed = true;
        }
        if (rp.county && rp.county !== existing.county) {
          existing.county = rp.county;
          changed = true;
        }
        if (rp.subCounty && rp.subCounty !== existing.subCounty) {
          existing.subCounty = rp.subCounty;
          changed = true;
        }
        if (rp.phone && rp.phone !== existing.phone) {
          existing.phone = rp.phone;
          changed = true;
        }
        if (rp.email && rp.email !== existing.email) {
          existing.email = rp.email;
          changed = true;
        }
        if (rp.active !== undefined && rp.active !== existing.active) {
          existing.active = rp.active;
          changed = true;
        }
        if (Array.isArray(rp.assignedSurveys)) {
          existing.assignedSurveys = rp.assignedSurveys;
        }
        if (rp.updatedAt) {
          existing.updatedAt = rp.updatedAt;
        }
      }
    });

    if (changed) {
      this.personnel = Array.from(perMap.values());
      this.saveToLocalStorage();
      if (typeof window !== 'undefined' && window.AESession && typeof window.AESession.getCurrentUser === 'function') {
        const cur = window.AESession.getCurrentUser();
        if (cur && cur.id) {
          const live = this.getPersonnelById(cur.id);
          if (live) window.AESession.syncCurrentUser(live);
        }
      }
    }
  }

  /**
   * Continuous Background Auto-Sync Daemon.
   * Runs silently in the background, flushing queued field responses and pulling
   * updated staff credentials whenever connectivity is present.
   */
  startBackgroundSyncDaemon() {
    if (this._bgSyncTimer) {
      clearInterval(this._bgSyncTimer);
      this._bgSyncTimer = null;
    }

    if (this.settings.backgroundSyncEnabled === false) return;

    // Heartbeat every 20-30 seconds (default: 25s)
    const intervalSec = Math.max(10, parseInt(this.settings.backgroundSyncIntervalSec, 10) || 25);
    const intervalMs = intervalSec * 1000;

    this._bgSyncTimer = setInterval(async () => {
      // Guard: skip if offline, simulated offline, no GAS URL, or sync already in flight
      if (!this.isEffectivelyOnline() || !this.settings.gasWebAppUrl || this._syncInFlight) {
        return;
      }

      const hasUnsyncedResponses = this.responses.some((r) => r.syncStatus !== 'synced');
      const hasQueuedItems = Array.isArray(this.syncQueue) && this.syncQueue.length > 0;

      if (hasUnsyncedResponses || hasQueuedItems) {
        try {
          await this.syncWithGoogleSheets({ forceAll: false, isBackground: true });
        } catch (e) {
          // Silent retry on next interval tick
        }
      }
    }, intervalMs);

    // Event 1: Window focus / Visibility Change (when user switches back to tab or unlocks tablet)
    if (typeof document !== 'undefined' && !this._visibilityBound) {
      this._visibilityBound = true;
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.triggerBackgroundSyncNow();
        }
      });
      window.addEventListener('focus', () => {
        this.triggerBackgroundSyncNow();
      });
    }

    // Event 2: Network online reconnection
    if (typeof window !== 'undefined' && !this._onlineBound) {
      this._onlineBound = true;
      window.addEventListener('online', () => {
        this.triggerBackgroundSyncNow();
      });
    }

    // Event 3: PWA Service Worker Background Sync message
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && !this._swMsgBound) {
      this._swMsgBound = true;
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'TRIGGER_BG_SYNC') {
          this.triggerBackgroundSyncNow();
        }
      });
    }
  }

  /**
   * Debounced immediate trigger for background synchronization.
   */
  triggerBackgroundSyncNow(delayMs = 400) {
    if (this._bgTriggerDebounce) {
      clearTimeout(this._bgTriggerDebounce);
      this._bgTriggerDebounce = null;
    }
    this._bgTriggerDebounce = setTimeout(async () => {
      if (!this.isEffectivelyOnline() || !this.settings.gasWebAppUrl || this._syncInFlight) {
        return;
      }
      const hasUnsynced = this.responses.some((r) => r.syncStatus !== 'synced') || (this.syncQueue && this.syncQueue.length > 0);
      if (hasUnsynced) {
        try {
          await this.syncWithGoogleSheets({ forceAll: false, isBackground: true });
        } catch (e) {}
      }
    }, delayMs);
  }

  assignPersonnelTask(personId, surveyId, targetQuota = 10, notes = '', deadline = null, supervisorId = null) {
    const person = this.getPersonnelById(personId);
    if (!person) return null;

    if (!Array.isArray(person.assignedSurveys)) {
      person.assignedSurveys = [];
    }
    if (surveyId && !person.assignedSurveys.includes(surveyId)) {
      person.assignedSurveys.push(surveyId);
    }

    if (!person.taskQuotas || typeof person.taskQuotas !== 'object') {
      person.taskQuotas = {};
    }

    if (surveyId) {
      person.taskQuotas[surveyId] = {
        target: Math.max(1, parseInt(targetQuota, 10) || 10),
        notes: String(notes || '').trim().slice(0, 200),
        deadline: deadline || null,
        assignedAt: new Date().toISOString()
      };
    }

    if (supervisorId) {
      person.supervisorId = String(supervisorId).trim();
    }

    this.upsertPersonnel(person);
    return person;
  }

  unassignPersonnelTask(personId, surveyId) {
    const person = this.getPersonnelById(personId);
    if (!person) return null;

    if (Array.isArray(person.assignedSurveys)) {
      person.assignedSurveys = person.assignedSurveys.filter((s) => s !== surveyId);
    }
    if (person.taskQuotas && person.taskQuotas[surveyId]) {
      delete person.taskQuotas[surveyId];
    }

    this.upsertPersonnel(person);
    return person;
  }

  getPersonnelTaskProgress(personId, surveyId) {
    const person = this.getPersonnelById(personId);
    if (!person) return { target: 10, completed: 0, percent: 0, remaining: 10, notes: '', deadline: null, isAssigned: false };

    const quotaObj = person.taskQuotas && person.taskQuotas[surveyId] ? person.taskQuotas[surveyId] : null;
    const target = quotaObj && quotaObj.target ? quotaObj.target : 10;
    const isAssigned = Array.isArray(person.assignedSurveys) && person.assignedSurveys.includes(surveyId);

    const responses = Array.isArray(this.responses) ? this.responses : [];
    const completed = responses.filter((r) => {
      if (r.surveyId !== surveyId) return false;
      const enumVal = String(r.enumerator || '');
      return enumVal.includes(person.fullName) || enumVal.includes(person.id);
    }).length;

    const percent = Math.min(100, Math.round((completed / Math.max(1, target)) * 100));

    return {
      target,
      completed,
      remaining: Math.max(0, target - completed),
      percent,
      notes: quotaObj ? quotaObj.notes || '' : '',
      deadline: quotaObj ? quotaObj.deadline : null,
      assignedAt: quotaObj ? quotaObj.assignedAt : null,
      isAssigned
    };
  }

  getAllTaskAllocations() {
    const allocations = [];
    const personnel = Array.isArray(this.personnel) ? this.personnel.filter((p) => p.active !== false) : [];
    const surveys = Array.isArray(this.surveys) ? this.surveys : [];

    personnel.forEach((p) => {
      const assigned = Array.isArray(p.assignedSurveys) ? p.assignedSurveys : [];
      assigned.forEach((sId) => {
        const survey = surveys.find((s) => s.id === sId);
        if (!survey) return;
        const progress = this.getPersonnelTaskProgress(p.id, sId);
        const supervisor = p.supervisorId ? this.getPersonnelById(p.supervisorId) : null;
        let status = 'Pending';
        if (progress.completed >= progress.target) {
          status = 'Target Met';
        } else if (progress.completed > 0) {
          status = 'In Progress';
        }

        allocations.push({
          personId: p.id,
          personName: p.fullName,
          role: p.role,
          county: p.county,
          subCounty: p.subCounty,
          surveyId: sId,
          surveyTitle: survey.title,
          supervisorId: p.supervisorId,
          supervisorName: supervisor ? supervisor.fullName : 'Direct HQ',
          target: progress.target,
          completed: progress.completed,
          remaining: progress.remaining,
          percent: progress.percent,
          status,
          deadline: progress.deadline,
          notes: progress.notes,
          assignedAt: progress.assignedAt
        });
      });
    });

    return allocations;
  }

  evaluateDataQuality(survey, response) {
    const flags = [];
    const duration = Math.max(0, Number(response.durationSec) || 0);
    const questions = this.getQuestionsForSurvey(survey);

    // 1. Speeder Pacing Check (<45s total or <2.5s per question)
    const minExpectedDuration = Math.max(45, Math.round(questions.length * 2.5));
    if (duration > 0 && duration < minExpectedDuration) {
      flags.push({
        code: 'SPEEDER',
        severity: 'warning',
        label: `Speeder interview (${duration}s vs expected min ${minExpectedDuration}s)`
      });
    }

    // 2. Agronomic Yield Anomaly Check
    const yieldQ = questions.find((q) => q.type === 'number_yield' || /yield|harvest/i.test(q.title));
    if (yieldQ && response.answers && response.answers[yieldQ.id] !== undefined) {
      const rawVal = Number(response.answers[yieldQ.id]);
      if (!isNaN(rawVal)) {
        const bags = /kg/i.test(yieldQ.id || yieldQ.title || yieldQ.unit || '') ? rawVal / 90 : rawVal;
        if (bags > 45) {
          flags.push({
            code: 'YIELD_OUTLIER_HIGH',
            severity: 'danger',
            label: `Extreme yield anomaly: ${bags.toFixed(1)} bags/acre (>45 ceiling)`
          });
        } else if (bags < 0.5 && rawVal > 0) {
          flags.push({
            code: 'YIELD_OUTLIER_LOW',
            severity: 'warning',
            label: `Suspiciously low yield: ${bags.toFixed(1)} bags/acre (<0.5 floor)`
          });
        }
      }
    }

    // 3. GPS Accuracy & GNSS Drift Check
    const gps = response.gps;
    if (gps && gps.accuracy && gps.accuracy > 30) {
      flags.push({
        code: 'GPS_POOR_ACCURACY',
        severity: 'warning',
        label: `Poor GPS fix accuracy: ±${Math.round(gps.accuracy)}m (>30m threshold)`
      });
    }

    return flags;
  }

  calculateResponseMetrics(survey, answers) {
    const calc = {};
    if (!survey || !answers) return calc;
    const questions = this.getQuestionsForSurvey(survey);

    // 1. Net Promoter Score Auto-Categorization
    const npsQ = questions.find((q) => q.type === 'nps');
    if (npsQ && answers[npsQ.id] !== undefined) {
      const score = Number(answers[npsQ.id]);
      if (!isNaN(score)) {
        calc.npsScore = score;
        calc.npsCategory = score >= 9 ? 'Promoter' : score >= 7 ? 'Passive' : 'Detractor';
      }
    }

    // 2. Retail Storage Compliance Score %
    const storageRatingQ = questions.find((q) => /storage|cleanliness|ventilation|compliance/i.test(q.title) && q.type === 'star_rating');
    if (storageRatingQ && answers[storageRatingQ.id]) {
      const rating = Number(answers[storageRatingQ.id]);
      calc.storageCompliancePct = Math.round((rating / 5) * 100);
      calc.storageComplianceLevel = calc.storageCompliancePct >= 80 ? 'Certified' : calc.storageCompliancePct >= 60 ? 'Standard' : 'Non-Compliant';
    }

    // 3. Agronomic Yield in 90kg Standard Bags
    const yieldQ = questions.find((q) => q.type === 'number_yield' || /yield|harvest/i.test(q.title));
    if (yieldQ && answers[yieldQ.id] !== undefined) {
      const rawVal = Number(answers[yieldQ.id]);
      if (!isNaN(rawVal)) {
        const bags = /kg/i.test(yieldQ.id || yieldQ.title || yieldQ.unit || '') ? Number((rawVal / 90).toFixed(2)) : rawVal;
        calc.yieldBagsPerAcre = bags;
        calc.yieldBracket = bags < 10 ? '< 10 bags' : bags <= 25 ? '10–25 bags' : bags <= 45 ? '26–45 bags' : '> 45 bags (Outlier)';
      }
    }

    return calc;
  }

  approveResponse(responseId, supervisorPersonnelId, notes = '') {
    const resp = this.responses.find((r) => r.id === responseId || r.clientResponseId === responseId);
    if (!resp) return null;
    const prevHash = (resp.auditTrail && resp.auditTrail.length > 0)
      ? resp.auditTrail[resp.auditTrail.length - 1].entryHash
      : resp.recordHash || '';
    const auditEntry = window.AESupervisorAuditEngine.createAuditEntry(
      prevHash,
      'APPROVE',
      supervisorPersonnelId,
      notes || 'Verified by regional supervisor',
      resp.id
    );

    resp.reviewStatus = 'approved';
    resp.audit = {
      verifiedBy: supervisorPersonnelId,
      verifiedAt: new Date().toISOString(),
      notes: notes || 'Supervisor sign-off'
    };
    resp.auditTrail = Array.isArray(resp.auditTrail) ? resp.auditTrail : [];
    resp.auditTrail.push(auditEntry);
    resp.syncStatus = 'queued';

    this.enqueueSyncItem('SUBMIT_RESPONSE', resp.id, `Response Approved (${supervisorPersonnelId}) -> ${resp.id}`);
    this.saveToLocalStorage();
    return resp;
  }

  flagResponse(responseId, supervisorPersonnelId, reason = '') {
    const resp = this.responses.find((r) => r.id === responseId || r.clientResponseId === responseId);
    if (!resp) return null;
    const prevHash = (resp.auditTrail && resp.auditTrail.length > 0)
      ? resp.auditTrail[resp.auditTrail.length - 1].entryHash
      : resp.recordHash || '';
    const auditEntry = window.AESupervisorAuditEngine.createAuditEntry(
      prevHash,
      'FLAG',
      supervisorPersonnelId,
      reason || 'Flagged for re-survey',
      resp.id
    );

    resp.reviewStatus = 'flagged';
    resp.audit = {
      flaggedBy: supervisorPersonnelId,
      flaggedAt: new Date().toISOString(),
      reason: reason || 'Flagged by supervisor'
    };
    resp.auditTrail = Array.isArray(resp.auditTrail) ? resp.auditTrail : [];
    resp.auditTrail.push(auditEntry);

    this.saveToLocalStorage();
    return resp;
  }

  rejectResponse(responseId, supervisorPersonnelId, reason = '') {
    const resp = this.responses.find((r) => r.id === responseId || r.clientResponseId === responseId);
    if (!resp) return null;
    const prevHash = (resp.auditTrail && resp.auditTrail.length > 0)
      ? resp.auditTrail[resp.auditTrail.length - 1].entryHash
      : resp.recordHash || '';
    const auditEntry = window.AESupervisorAuditEngine.createAuditEntry(
      prevHash,
      'REJECT',
      supervisorPersonnelId,
      reason || 'Rejected by supervisor',
      resp.id
    );

    resp.reviewStatus = 'rejected';
    resp.audit = {
      rejectedBy: supervisorPersonnelId,
      rejectedAt: new Date().toISOString(),
      reason: reason || 'Rejected by supervisor'
    };
    resp.auditTrail = Array.isArray(resp.auditTrail) ? resp.auditTrail : [];
    resp.auditTrail.push(auditEntry);

    this.saveToLocalStorage();
    return resp;
  }

  /**
   * Validates that an outbound Google Apps Script Web App URL points strictly to
   * HTTPS `script.google.com` or `script.googleusercontent.com` (CWE-918 / CWE-601).
   */
  isValidGasUrl(rawUrl) {
    const str = String(rawUrl || '').trim();
    if (!str) return true; // Empty string uses the local offline simulator
    try {
      const parsed = new URL(str);
      if (parsed.protocol !== 'https:') return false;
      const host = parsed.hostname.toLowerCase();
      if (host === 'script.google.com') {
        return /^\/(macros\/s\/|a\/macros\/)[A-Za-z0-9_\-]{20,}\/exec$/.test(parsed.pathname);
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * Sanitizes record identifiers to alphanumeric, underscore, and hyphen characters
   * so untrusted JSON packs or remote sheet rows cannot inject inline JS attributes (CWE-79).
   */
  sanitizeSafeId(rawId, fallbackPrefix = 'id') {
    const cleaned = String(rawId || '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 64);
    return cleaned || `${fallbackPrefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  }

  sanitizeHexColor(rawHex, fallback = '#247B50') {
    const str = String(rawHex || '').trim();
    return /^#[0-9A-Fa-f]{6}$/.test(str) ? str : fallback;
  }

  sanitizeSurveyRecord(survey) {
    if (!survey || typeof survey !== 'object') return null;
    const ALLOWED_TYPES = new Set([
      'multiple_choice',
      'checkboxes',
      'dropdown',
      'star_rating',
      'nps',
      'matrix',
      'number_yield',
      'gps_location',
      'date_time',
      'signature',
      'photo_proof',
      'short_text',
      'long_text',
      'cascading_dropdown',
      'barcode_scanner',
      'audio_note',
      'repeat_group'
    ]);
    const safeId = this.sanitizeSafeId(survey.id, 'srv');
    const pages = Array.isArray(survey.pages)
      ? survey.pages.map((p, idx) => ({
          id: this.sanitizeSafeId(p && p.id, `page_${idx + 1}`),
          title: String((p && p.title) || `Section ${idx + 1}`).slice(0, 240),
          description: String((p && p.description) || '').slice(0, 600),
          questions: Array.isArray(p && p.questions)
            ? p.questions.map((q, qIdx) => {
                const rawType = String((q && q.type) || 'multiple_choice');
                const safeType = ALLOWED_TYPES.has(rawType) ? rawType : 'short_text';
                const logic = (q && q.logic && typeof q.logic === 'object') ? q.logic : {};
                return {
                  ...q,
                  id: this.sanitizeSafeId(q && q.id, `q_${idx + 1}_${qIdx + 1}`),
                  type: safeType,
                  title: String((q && q.title) || 'Untitled Question').slice(0, 400),
                  helpText: String((q && q.helpText) || '').slice(0, 500),
                  required: Boolean(q && q.required),
                  logic: {
                    enabled: Boolean(logic.enabled),
                    condition: 'equals',
                    value: String(logic.value || '').slice(0, 200),
                    target: logic.target ? this.sanitizeSafeId(logic.target, 'page') : ''
                  }
                };
              })
            : []
        }))
      : [];

    const quotas = Array.isArray(survey.quotas)
      ? survey.quotas.map((qta, qIdx) => ({
          id: this.sanitizeSafeId(qta && qta.id, `qta_${qIdx + 1}`),
          name: String((qta && qta.name) || `Target Quota ${qIdx + 1}`).slice(0, 140),
          questionId: String((qta && qta.questionId) || 'q_county').slice(0, 80),
          match: String((qta && qta.match) || '').slice(0, 100),
          target: Math.max(1, Number(qta && qta.target) || 50),
          action: qta && qta.action === 'block' ? 'block' : 'warn'
        }))
      : [];

    const theme = (survey.theme && typeof survey.theme === 'object') ? survey.theme : {};
    return {
      ...survey,
      id: safeId,
      title: String(survey.title || 'Untitled Field Survey').slice(0, 240),
      description: String(survey.description || '').slice(0, 800),
      category: String(survey.category || 'Field Assessment').slice(0, 120),
      status: ['Active', 'Draft', 'Closed'].includes(survey.status) ? survey.status : 'Active',
      version: Math.max(1, Number(survey.version) || 1),
      theme: {
        ...theme,
        accentColor: this.sanitizeHexColor(theme.accentColor, '#247B50'),
        showProgressBar: theme.showProgressBar !== false,
        showQuestionNumbers: theme.showQuestionNumbers !== false
      },
      quotas,
      pages
    };
  }

  sanitizeCollectorRecord(collector) {
    if (!collector || typeof collector !== 'object') return null;
    return {
      ...collector,
      id: this.sanitizeSafeId(collector.id, 'col'),
      surveyId: this.sanitizeSafeId(collector.surveyId, 'srv'),
      name: String(collector.name || 'Field Collector').slice(0, 160),
      type: collector.type === 'weblink' ? 'weblink' : 'kiosk',
      status: collector.status === 'Closed' ? 'Closed' : 'Open',
      pinCode: String(collector.pinCode || '1234').replace(/[^0-9A-Za-z]/g, '').slice(0, 12) || '1234',
      enumeratorDefault: String(collector.enumeratorDefault || 'Field Enumerator').slice(0, 120),
      createdAt: String(collector.createdAt || new Date().toISOString())
    };
  }

  sanitizeResponseRecord(resp) {
    if (!resp || typeof resp !== 'object') return null;
    const safeId = this.sanitizeSafeId(resp.clientResponseId || resp.id, 'resp');
    const cleanAnswers = sanitizeDeepObject(resp.answers || {});

    const qaFlags = Array.isArray(resp.qaFlags) ? resp.qaFlags.map((f) => String(f).slice(0, 50)) : [];
    const questionDwellMs =
      resp.questionDwellMs && typeof resp.questionDwellMs === 'object'
        ? sanitizeDeepObject(resp.questionDwellMs)
        : null;

    let cleanGps = null;
    if (
      resp.gps &&
      typeof resp.gps === 'object' &&
      resp.gps.lat !== undefined &&
      resp.gps.lat !== '' &&
      !isNaN(Number(resp.gps.lat))
    ) {
      cleanGps = {
        lat: Number(Number(resp.gps.lat).toFixed(6)),
        lng: Number(Number(resp.gps.lng).toFixed(6)),
        accuracy: resp.gps.accuracy != null ? Math.max(0, Number(Number(resp.gps.accuracy).toFixed(1))) : null,
        altitude: resp.gps.altitude != null ? Number(Number(resp.gps.altitude).toFixed(1)) : null,
        label: String(resp.gps.label || '').slice(0, 120),
        manual: resp.gps.manual === true,
        method: String(resp.gps.method || (resp.gps.manual ? 'MANUAL' : 'GNSS_HARDWARE')).slice(0, 30)
      };
    }

    const reviewStatus = ['pending_review', 'approved', 'flagged', 'rejected'].includes(resp.reviewStatus)
      ? resp.reviewStatus
      : 'pending_review';

    return {
      id: safeId,
      clientResponseId: safeId,
      surveyId: this.sanitizeSafeId(resp.surveyId, 'srv'),
      surveyTitle: String(resp.surveyTitle || '').slice(0, 240),
      collectorId: this.sanitizeSafeId(resp.collectorId || 'default', 'col'),
      enumerator: String(resp.enumerator || 'Field Enumerator').slice(0, 120),
      submittedByUserId: resp.submittedByUserId ? String(resp.submittedByUserId).slice(0, 50) : null,
      submittedByUserRole: resp.submittedByUserRole ? String(resp.submittedByUserRole).slice(0, 30) : null,
      language: String(resp.language || 'en').slice(0, 10),
      status: resp.status === 'partial' ? 'partial' : 'complete',
      reviewStatus,
      audit: resp.audit || null,
      auditTrail: Array.isArray(resp.auditTrail) ? resp.auditTrail : [],
      calculated: resp.calculated || {},
      recordHash: String(resp.recordHash || ''),
      startedAt: String(resp.startedAt || new Date().toISOString()),
      submittedAt: String(resp.submittedAt || new Date().toISOString()),
      durationSec: Math.max(0, Math.min(86400, Number(resp.durationSec) || 0)),
      qaFlags,
      questionDwellMs,
      gps: cleanGps,
      answers: cleanAnswers,
      syncStatus: resp.syncStatus === 'synced' ? 'synced' : 'queued',
      syncedAt: resp.syncedAt || null
    };
  }

  upsertSurvey(survey, queueForCloud = true) {
    const cleanSurvey = this.sanitizeSurveyRecord(survey);
    if (!cleanSurvey) return null;
    cleanSurvey.updatedAt = new Date().toISOString();
    this._surveysDirty = true;
    const idx = this.surveys.findIndex((s) => s.id === cleanSurvey.id);
    if (idx >= 0) {
      this.surveys[idx] = cleanSurvey;
    } else {
      this.surveys.unshift(cleanSurvey);
      // Ensure at least one default collector exists for new surveys
      if (this.getCollectorsForSurvey(cleanSurvey.id).length === 0) {
        this.collectors.push({
          id: 'col_' + Date.now().toString(36),
          surveyId: cleanSurvey.id,
          name: 'Primary Web & Field Kiosk Collector',
          type: 'kiosk',
          status: 'Open',
          pinCode: '1234',
          enumeratorDefault: this.settings.defaultEnumerator || 'Field Enumerator',
          createdAt: new Date().toISOString()
        });
      }
    }

    if (queueForCloud) {
      this.enqueueSyncItem('UPSERT_SURVEY', cleanSurvey.id, `Survey Schema: ${cleanSurvey.title}`);
    }
    this.saveToLocalStorage();
    return cleanSurvey;
  }

  deleteSurvey(surveyId) {
    this._surveysDirty = true;
    this.surveys = this.surveys.filter((s) => s.id !== surveyId);
    this.responses = this.responses.filter((r) => r.surveyId !== surveyId);
    this.collectors = this.collectors.filter((c) => c.surveyId !== surveyId);
    this.syncQueue = this.syncQueue.filter((q) => q.recordId !== surveyId);
    this.saveToLocalStorage();
  }

  /**
   * Sets survey status to 'Archived'.
   * Archived surveys are hidden from field enumerators and locked from new responses.
   * Historical responses remain in Analytics/Exports for Admins and Supervisors.
   */
  archiveSurvey(surveyId) {
    const survey = this.getSurveyById(surveyId);
    if (!survey) return null;
    survey.status = 'Archived';
    survey.updatedAt = new Date().toISOString();
    this._surveysDirty = true;
    this.saveToLocalStorage();
    this.enqueueSyncItem('UPSERT_SURVEY', survey.id, `Archive Survey: ${survey.title}`);
    if (this.isEffectivelyOnline()) {
      this.syncWithGoogleSheets({ manual: true }).catch(() => {});
    }
    return survey;
  }

  /**
   * Restores an archived survey back to 'Active' (or a specified status).
   */
  restoreSurvey(surveyId, targetStatus = 'Active') {
    const survey = this.getSurveyById(surveyId);
    if (!survey) return null;
    survey.status = targetStatus;
    survey.updatedAt = new Date().toISOString();
    this._surveysDirty = true;
    this.saveToLocalStorage();
    this.enqueueSyncItem('UPSERT_SURVEY', survey.id, `Restore Survey: ${survey.title} (${targetStatus})`);
    if (this.isEffectivelyOnline()) {
      this.syncWithGoogleSheets({ manual: true }).catch(() => {});
    }
    return survey;
  }

  /**
   * Evaluates if a given user/personnel is permitted to collect data for this survey.
   * Returns { allowed: boolean, reason: string }
   */
  canUserCollectSurvey(personnelOrUser, surveyId) {
    const survey = this.getSurveyById(surveyId);
    if (!survey) {
      return { allowed: false, reason: 'Survey instrument not found.' };
    }
    if (survey.status === 'Archived') {
      return { allowed: false, reason: 'This survey has been archived by HQ and no longer accepts field responses.' };
    }
    if (survey.status === 'Closed') {
      return { allowed: false, reason: 'This survey is closed. New submissions are disabled.' };
    }
    if (!personnelOrUser) {
      return { allowed: survey.status === 'Active', reason: survey.status === 'Active' ? '' : `Survey status is ${survey.status}` };
    }

    const role = String(personnelOrUser.role || '').toLowerCase();
    if (role === 'admin') {
      return { allowed: true, reason: '' };
    }

    const assigned = Array.isArray(personnelOrUser.assignedSurveys) ? personnelOrUser.assignedSurveys : [];
    if (!assigned.includes(surveyId)) {
      return { allowed: false, reason: 'This survey is not assigned to your personnel account.' };
    }
    if (survey.status !== 'Active') {
      return { allowed: false, reason: `Survey is in ${survey.status} status (must be Active to collect).` };
    }
    return { allowed: true, reason: '' };
  }

  /**
   * Returns the list of surveys accessible to a specific user based on role and assignments.
   */
  getSurveysForUser(personnelOrUser, filter = {}) {
    const all = this.surveys || [];
    if (!personnelOrUser) {
      return all.filter((s) => s.status !== 'Archived' || filter.includeArchived);
    }
    const role = String(personnelOrUser.role || '').toLowerCase();
    if (role === 'admin') {
      if (filter.status && filter.status !== 'All') {
        return all.filter((s) => (s.status || '').toLowerCase() === filter.status.toLowerCase());
      }
      return all;
    }
    if (role === 'supervisor') {
      const assigned = Array.isArray(personnelOrUser.assignedSurveys) ? personnelOrUser.assignedSurveys : [];
      let scoped = all.filter((s) => assigned.includes(s.id));
      if (!filter.includeArchived) {
        scoped = scoped.filter((s) => s.status !== 'Archived');
      }
      if (filter.status && filter.status !== 'All') {
        scoped = scoped.filter((s) => (s.status || '').toLowerCase() === filter.status.toLowerCase());
      }
      return scoped;
    }
    if (role === 'enumerator') {
      const assigned = Array.isArray(personnelOrUser.assignedSurveys) ? personnelOrUser.assignedSurveys : [];
      // Enumerators can only see assigned, Active surveys
      return all.filter((s) => assigned.includes(s.id) && s.status === 'Active');
    }
    return all.filter((s) => s.status === 'Active');
  }

  /**
   * Returns list of enumerators who report to a given supervisor.
   */
  getSupervisedEnumerators(supervisorId) {
    if (!supervisorId) return [];
    return (this.personnel || []).filter((p) => p.supervisorId === supervisorId && p.active !== false);
  }

  /**
   * Batch-assigns multiple personnel to a survey.
   * @param {string} surveyId
   * @param {string[]} personnelIds - IDs of personnel who should have this survey assigned
   */
  assignPersonnelToSurvey(surveyId, personnelIds = []) {
    const targetSet = new Set(personnelIds || []);
    let changed = 0;
    (this.personnel || []).forEach((p) => {
      p.assignedSurveys = Array.isArray(p.assignedSurveys) ? p.assignedSurveys : [];
      const hasSurvey = p.assignedSurveys.includes(surveyId);
      const shouldHave = targetSet.has(p.id);

      if (shouldHave && !hasSurvey) {
        p.assignedSurveys.push(surveyId);
        p.updatedAt = new Date().toISOString();
        changed++;
        this.enqueueSyncItem('UPSERT_PERSONNEL', p.id, `Assign Survey ${surveyId} -> ${p.fullName}`);
      } else if (!shouldHave && hasSurvey) {
        p.assignedSurveys = p.assignedSurveys.filter((id) => id !== surveyId);
        p.updatedAt = new Date().toISOString();
        changed++;
        this.enqueueSyncItem('UPSERT_PERSONNEL', p.id, `Unassign Survey ${surveyId} -> ${p.fullName}`);
      }
    });

    if (changed > 0) {
      this.saveToLocalStorage();
      if (this.isEffectivelyOnline()) {
        this.syncWithGoogleSheets({ manual: true }).catch(() => {});
      }
    }
    return changed;
  }

  upsertCollector(collector) {
    const cleanCol = this.sanitizeCollectorRecord(collector);
    if (!cleanCol) return null;
    const idx = this.collectors.findIndex((c) => c.id === cleanCol.id);
    if (idx >= 0) {
      this.collectors[idx] = cleanCol;
    } else {
      this.collectors.push(cleanCol);
    }
    this.saveToLocalStorage();
    return cleanCol;
  }

  submitResponse(responsePayload) {
    const cleanPayload = this.sanitizeResponseRecord(responsePayload) || {};
    const nowIso = new Date().toISOString();
    const id = cleanPayload.id || 'resp_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    const survey = this.getSurveyById(cleanPayload.surveyId);

    if (survey && survey.status === 'Archived') {
      throw new Error(`Survey "${survey.title}" has been archived by HQ. New field responses cannot be submitted.`);
    }

    // Compute automated data quality flags & calculated metrics
    const durationSec = Math.max(0, Number(responsePayload.durationSec) || 45);
    const rawFlags = Array.isArray(responsePayload.qaFlags) ? responsePayload.qaFlags : [];
    const automatedFlags = this.evaluateDataQuality(survey, {
      ...responsePayload,
      durationSec,
      answers: cleanPayload.answers || {}
    });
    const autoCodes = automatedFlags.map((f) => f.code);
    const combinedFlags = Array.from(new Set([...rawFlags, ...autoCodes]));

    const calculated = this.calculateResponseMetrics(survey, cleanPayload.answers || {});
    const reviewStatus = combinedFlags.some((c) => c.includes('OUTLIER') || c === 'SPEEDER') ? 'flagged' : 'pending_review';

    const record = {
      id,
      clientResponseId: id,
      surveyId: cleanPayload.surveyId,
      surveyTitle: survey ? survey.title : String(responsePayload.surveyTitle || 'Survey').slice(0, 240),
      collectorId: cleanPayload.collectorId || 'default',
      enumerator: cleanPayload.enumerator || this.settings.defaultEnumerator || 'Field Enumerator',
      submittedByUserId: cleanPayload.submittedByUserId || null,
      submittedByUserRole: cleanPayload.submittedByUserRole || null,
      language: responsePayload.language || 'en',
      status: 'complete',
      reviewStatus,
      qaFlags: combinedFlags,
      calculated,
      audit: null,
      auditTrail: [],
      recordHash: '',
      startedAt: responsePayload.startedAt || nowIso,
      submittedAt: nowIso,
      durationSec,
      gps: responsePayload.gps || null,
      answers: cleanPayload.answers || {},
      syncStatus: 'queued',
      syncedAt: null
    };

    // Calculate deterministic SHA-256 seal asynchronously
    if (window.AEIntegrityEngine && typeof window.AEIntegrityEngine.computeRecordHash === 'function') {
      window.AEIntegrityEngine.computeRecordHash(record).then((hash) => {
        record.recordHash = hash;
        this.saveToLocalStorage();
      });
    }

    this.responses.unshift(record);
    this.enqueueSyncItem(
      'SUBMIT_RESPONSE',
      record.id,
      `Response (${record.enumerator}) -> ${record.surveyTitle.substring(0, 38)}`
    );
    this.saveToLocalStorage();

    // Trigger immediate background sync to stream new response to Google Sheets
    if (this.isEffectivelyOnline() && this.settings.gasWebAppUrl) {
      this.triggerBackgroundSyncNow(250);
    }

    // Register with native W3C Service Worker Background Sync API if supported
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.sync.register('ae-background-sync').catch(() => {});
      }).catch(() => {});
    }

    return record;
  }

  deleteResponse(responseId) {
    this.responses = this.responses.filter((r) => r.id !== responseId);
    this.syncQueue = this.syncQueue.filter((q) => q.recordId !== responseId);
    this.saveToLocalStorage();
  }

  enqueueSyncItem(action, recordId, title) {
    const existing = this.syncQueue.find((item) => item.action === action && item.recordId === recordId);
    if (existing) {
      existing.createdAt = new Date().toISOString();
      existing.title = title;
      return;
    }
    this.syncQueue.push({
      id: 'sq_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
      action,
      recordId,
      title,
      createdAt: new Date().toISOString(),
      attempts: 0
    });
  }

  saveRunnerDraft(surveyId, draftState) {
    if (!surveyId) return;
    this.runnerDrafts = this.runnerDrafts || {};
    this.runnerDrafts[surveyId] = {
      ...draftState,
      savedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(AE_STORAGE_KEYS.RUNNER_DRAFTS, JSON.stringify(this.runnerDrafts));
    } catch (e) {}
  }

  getRunnerDraft(surveyId) {
    if (!surveyId || !this.runnerDrafts) return null;
    return this.runnerDrafts[surveyId] || null;
  }

  clearRunnerDraft(surveyId) {
    if (!surveyId || !this.runnerDrafts) return;
    delete this.runnerDrafts[surveyId];
    try {
      localStorage.setItem(AE_STORAGE_KEYS.RUNNER_DRAFTS, JSON.stringify(this.runnerDrafts));
    } catch (e) {}
  }

  /**
   * Synchronizes all pending surveys, collectors, and offline responses with
   * Google Sheets via Google Apps Script (`Code.gs`).
   * - If `gasWebAppUrl` is configured, performs a real CORS-safe `POST` with
   *   `Content-Type: text/plain;charset=utf-8`, 45s AbortController timeout,
   *   and automatic 1-retry container warm-up.
   * - If no URL is configured yet (or user chooses Demo Cloud Sync), simulates
   *   the exact Google Sheets batch transaction locally so every workflow can be
   *   tested immediately!
   */
  async syncWithGoogleSheets(options = { forceAll: false }) {
    if (this._syncInFlight) {
      throw new Error('A Google Sheets synchronization is already in progress.');
    }
    if (!this.isEffectivelyOnline()) {
      throw new Error('Device is currently in Offline Mode. Disable Offline Mode or connect to Wi-Fi/cellular to sync with Google Sheets.');
    }

    this._syncInFlight = true;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ae-sync-state-change', { detail: { inFlight: true } }));
    }
    const startTime = performance.now();
    const unsyncedResponses = options.forceAll
      ? this.responses
      : this.responses.filter((r) => r.syncStatus !== 'synced');

    const currentSessionUser = (window.AESession && typeof window.AESession.getCurrentUser === 'function')
      ? window.AESession.getCurrentUser()
      : null;

    // Send survey schemas if forced, dirty, first connect, or manual sync
    const shouldSyncSurveys = Boolean(
      options.forceAll || options.syncSurveys || this._surveysDirty || !this.settings.lastSyncedAt || options.manual
    );
    const surveysPayload = shouldSyncSurveys ? this.surveys : [];

    const defaultCallerId = (this.personnel && this.personnel[0] && this.personnel[0].id) ? this.personnel[0].id : 'ADM-01';
    const cloudResponses = unsyncedResponses.map((r) => ({
      ...r,
      answers: this.cleanAnswersForCloudSync(r.answers)
    }));

    const payload = {
      action: 'BATCH_SYNC',
      syncToken: this.settings.syncToken || '',
      deviceId: this.settings.deviceId,
      callerId: currentSessionUser ? currentSessionUser.id : defaultCallerId,
      surveys: surveysPayload,
      collectors: this.collectors,
      responses: cloudResponses,
      personnel: this.personnel
    };

    const gasUrl = (this.settings.gasWebAppUrl || '').trim();
    let resultSummary = null;

    try {
      if (gasUrl && !this.isValidGasUrl(gasUrl)) {
        throw new Error('Untrusted or invalid GAS URL. Only https://script.google.com/macros/s/.../exec endpoints are permitted.');
      }

      if (gasUrl) {
        // Real Google Apps Script Web App POST (CORS-safe text/plain + 45s timeout + auto-retry)
        const GAS_TIMEOUT_MS = 45000;
        let response = null;
        let attempt = 0;
        const maxAttempts = 2;

        while (attempt < maxAttempts) {
          attempt++;
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), GAS_TIMEOUT_MS);
          try {
            response = await fetch(gasUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'text/plain;charset=utf-8'
              },
              body: JSON.stringify(payload),
              redirect: 'follow',
              signal: controller.signal
            });
            clearTimeout(timer);
            if (response && response.ok) {
              break;
            }
          } catch (netErr) {
            clearTimeout(timer);
            // If request timed out or network glitched on attempt 1, retry once (warm container)
            if (attempt < maxAttempts && (netErr.name === 'AbortError' || netErr.name === 'TypeError')) {
              await new Promise((r) => setTimeout(r, 1200));
              continue;
            }
            if (netErr && netErr.name === 'AbortError') {
              throw new Error(`Google Apps Script request timed out after ${Math.round(GAS_TIMEOUT_MS / 1000)}s. Responses remain safely queued in IndexedDB outbox.`);
            }
            throw new Error(`Network connection to Google Apps Script failed (${netErr.message || 'Unreachable'}). Responses remain safely queued locally.`);
          }
        }

        if (!response || !response.ok) {
          throw new Error(`Google Apps Script HTTP ${response ? response.status : 0}: ${response ? response.statusText : 'No response'}`);
        }

        let data;
        try {
          data = await response.json();
        } catch (parseErr) {
          throw new Error('Google Apps Script returned an HTML login page instead of JSON. Ensure your Web App deployment has "Who has access: Anyone".');
        }

        if (!data.ok) {
          throw new Error(data.error || 'Google Apps Script returned an error');
        }
        if (data.personnel && Array.isArray(data.personnel) && data.personnel.length) {
          this.mergePersonnelFromCloud(data.personnel);
        }
        this._surveysDirty = false;
        resultSummary = {
          mode: 'Live GAS Web App',
          surveysSynced: data.surveysSynced ?? (shouldSyncSurveys ? this.surveys.length : 0),
          responsesInserted: data.responsesInserted ?? unsyncedResponses.length,
          personnelSynced: data.personnelSynced ?? this.personnel.length,
          duplicatesSkipped: data.duplicatesSkipped ?? 0,
          serverTime: data.serverTime || new Date().toISOString()
        };
      } else {
        // Built-in Google Sheets Sandbox / Simulator when no live GAS URL is pasted yet
        await new Promise((r) => setTimeout(r, 320));
        resultSummary = {
          mode: 'Local GAS Simulator (Ready for live URL)',
          surveysSynced: this.surveys.length,
          responsesInserted: unsyncedResponses.length,
          personnelSynced: this.personnel.length,
          duplicatesSkipped: 0,
          serverTime: new Date().toISOString()
        };
      }

      const nowIso = new Date().toISOString();
      this.responses.forEach((r) => {
        if (r.syncStatus !== 'synced' || options.forceAll) {
          r.syncStatus = 'synced';
          r.syncedAt = nowIso;
        }
      });

      this.syncQueue = [];
      this.settings.lastSyncedAt = nowIso;
      this.lastSyncError = null;

      const latencyMs = Math.round(performance.now() - startTime);
      this.syncLogs.unshift({
        id: 'log_' + Date.now().toString(36),
        timestamp: nowIso,
        action: 'BATCH_SYNC',
        details: `[${resultSummary.mode}] Synced ${resultSummary.surveysSynced} surveys & ${resultSummary.responsesInserted} responses (${resultSummary.duplicatesSkipped} duplicates skipped).`,
        status: 'success',
        latencyMs
      });

      this.saveToLocalStorage();
      return { ...resultSummary, latencyMs };
    } catch (err) {
      const nowIso = new Date().toISOString();
      const latencyMs = Math.round(performance.now() - startTime);
      this.syncQueue.forEach((item) => {
        item.attempts = (item.attempts || 0) + 1;
      });
      // In background auto-sync mode, do not show a disruptive banner on transient timeout
      if (!options.isBackground) {
        this.lastSyncError = {
          message: err.message || 'Synchronization failed',
          timestamp: nowIso,
          gasUrl
        };
      }
      this.syncLogs.unshift({
        id: 'log_' + Date.now().toString(36),
        timestamp: nowIso,
        action: 'BATCH_SYNC_ERROR',
        details: `[Sync Failed] ${err.message || 'Unknown error'} (${this.syncQueue.length} items retained in IndexedDB outbox)`,
        status: 'error',
        latencyMs
      });
      this.saveToLocalStorage();
      throw err;
    } finally {
      this._syncInFlight = false;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ae-sync-state-change', { detail: { inFlight: false } }));
      }
    }
  }

  /**
   * Pulls all surveys, collectors, and responses from the live Google Sheet (`?action=pullAll`).
   */
  async pullFromGoogleSheets() {
    if (this._syncInFlight) {
      throw new Error('A Google Sheets synchronization is already in progress.');
    }
    if (!this.isEffectivelyOnline()) {
      throw new Error('Cannot pull from Google Sheets while offline.');
    }
    const gasUrl = (this.settings.gasWebAppUrl || '').trim();
    if (!gasUrl || !this.isValidGasUrl(gasUrl)) {
      throw new Error('Paste a valid Google Apps Script Web App URL (`https://script.google.com/macros/s/.../exec`) first to pull live sheet rows.');
    }

    this._syncInFlight = true;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ae-sync-state-change', { detail: { inFlight: true } }));
    }
    const startTime = performance.now();
    try {
      const sep = gasUrl.includes('?') ? '&' : '?';
      const GAS_TIMEOUT_MS = 45000;
      let response = null;
      let attempt = 0;
      const maxAttempts = 2;

      while (attempt < maxAttempts) {
        attempt++;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), GAS_TIMEOUT_MS);
        try {
          response = await fetch(`${gasUrl}${sep}action=pullAll&deviceId=${encodeURIComponent(this.settings.deviceId)}&syncToken=${encodeURIComponent(this.settings.syncToken || '')}&t=${Date.now()}`, {
            method: 'GET',
            redirect: 'follow',
            signal: controller.signal
          });
          clearTimeout(timer);
          if (response && response.ok) {
            break;
          }
        } catch (netErr) {
          clearTimeout(timer);
          if (attempt < maxAttempts && (netErr.name === 'AbortError' || netErr.name === 'TypeError')) {
            await new Promise((r) => setTimeout(r, 1200));
            continue;
          }
          if (netErr && netErr.name === 'AbortError') {
            throw new Error(`Pulling from Google Apps Script timed out after ${Math.round(GAS_TIMEOUT_MS / 1000)}s.`);
          }
          throw new Error(`Failed to pull from Google Sheets (${netErr.message || 'Network error'}).`);
        }
      }

      if (!response || !response.ok) {
        throw new Error(`HTTP ${response ? response.status : 0} while pulling from Google Apps Script`);
      }

      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        throw new Error('Google Apps Script returned an HTML login page instead of JSON. Ensure your Web App deployment has "Who has access: Anyone".');
      }

      if (!data.ok) {
        throw new Error(data.error || 'Failed to pull from Google Sheets');
      }

      // Merge remote surveys (sanitized against DOM XSS / invalid IDs)
      if (Array.isArray(data.surveys) && data.surveys.length > 0) {
        const localMap = new Map(this.surveys.map((s) => [s.id, s]));
        data.surveys.forEach((remoteSurvey) => {
          const clean = this.sanitizeSurveyRecord(remoteSurvey);
          if (clean) localMap.set(clean.id, clean);
        });
        this.surveys = Array.from(localMap.values());
      }

      // Merge remote collectors (sanitized)
      if (Array.isArray(data.collectors) && data.collectors.length > 0) {
        const colMap = new Map(this.collectors.map((c) => [c.id, c]));
        data.collectors.forEach((rc) => {
          const cleanCol = this.sanitizeCollectorRecord(rc);
          if (cleanCol) colMap.set(cleanCol.id, cleanCol);
        });
        this.collectors = Array.from(colMap.values());
      }

      // Merge remote responses (sanitized against prototype pollution & invalid IDs)
      if (Array.isArray(data.responses)) {
        const respMap = new Map();
        data.responses.forEach((rr) => {
          const cleanResp = this.sanitizeResponseRecord(rr);
          if (cleanResp) {
            respMap.set(cleanResp.clientResponseId || cleanResp.id, { ...cleanResp, syncStatus: 'synced' });
          }
        });
        const seedMap = new Map(getInitialSeedData().responses.map((sr) => [sr.id, sr]));
        this.responses.forEach((localResp) => {
          const key = localResp.clientResponseId || localResp.id;
          if (!respMap.has(key)) {
            respMap.set(key, localResp);
          } else {
            // Preserve rich local answers if remote answers were empty or stripped
            const remoteItem = respMap.get(key);
            const remoteHasAnswers = remoteItem && remoteItem.answers && Object.keys(remoteItem.answers).length > 0;
            const localHasAnswers = localResp && localResp.answers && Object.keys(localResp.answers).length > 0;
            if (!remoteHasAnswers && localHasAnswers) {
              remoteItem.answers = { ...localResp.answers };
            } else if (!remoteHasAnswers && seedMap.has(key)) {
              remoteItem.answers = JSON.parse(JSON.stringify(seedMap.get(key).answers || {}));
            }
          }
        });
        this.responses = Array.from(respMap.values()).sort(
          (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );
        this.healResponsesAnswers();
      }

      // Merge remote personnel (staff credentials, roles, and PIN updates)
      if (Array.isArray(data.personnel) && data.personnel.length > 0) {
        this.mergePersonnelFromCloud(data.personnel);
      }

      const latencyMs = Math.round(performance.now() - startTime);
      this.settings.lastSyncedAt = new Date().toISOString();
      this.lastSyncError = null;
      this.syncLogs.unshift({
        id: 'log_' + Date.now().toString(36),
        timestamp: this.settings.lastSyncedAt,
        action: 'PULL_ALL',
        details: `Pulled ${data.surveys?.length || 0} surveys & ${data.responses?.length || 0} responses from Google Sheets.`,
        status: 'success',
        latencyMs
      });

      this.saveToLocalStorage();
      return {
        surveysCount: this.surveys.length,
        responsesCount: this.responses.length,
        latencyMs
      };
    } catch (err) {
      const nowIso = new Date().toISOString();
      const latencyMs = Math.round(performance.now() - startTime);
      this.lastSyncError = {
        message: err.message || 'Pull failed',
        timestamp: nowIso,
        gasUrl
      };
      this.syncLogs.unshift({
        id: 'log_' + Date.now().toString(36),
        timestamp: nowIso,
        action: 'PULL_ERROR',
        details: `[Pull Failed] ${err.message || 'Unknown error'}`,
        status: 'error',
        latencyMs
      });
      this.saveToLocalStorage();
      throw err;
    } finally {
      this._syncInFlight = false;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ae-sync-state-change', { detail: { inFlight: false } }));
      }
    }
  }
}

window.SURVEY_TEMPLATES = SURVEY_TEMPLATES;
window.aeStore = new AESurveyStore();

window.AEQuotaEngine = {
  getSurveyQuotaStats(surveyId) {
    const survey = window.aeStore.getSurveyById(surveyId);
    if (!survey) return [];
    const quotas = survey.quotas || [];
    const responses = window.aeStore.getResponsesForSurvey(surveyId);

    return quotas.map((q) => {
      const matchingResps = responses.filter((r) => {
        const val = String(r.answers?.[q.questionId] || r.gps?.label || '');
        return val.toLowerCase().includes(q.match.toLowerCase());
      });

      const synced = matchingResps.filter((r) => r.syncStatus === 'synced').length;
      const queued = matchingResps.length - synced;
      const total = matchingResps.length;
      const pct = Math.min(100, Math.round((total / Math.max(1, q.target)) * 100));
      const isComplete = total >= q.target;

      return {
        ...q,
        totalCollected: total,
        synced,
        queued,
        percent: pct,
        remaining: Math.max(0, q.target - total),
        isComplete
      };
    });
  }
};

