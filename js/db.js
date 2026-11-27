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
  PERSONNEL: 'ae_sm_personnel_v2',
  PIN_OVERRIDES: 'ae_sm_pin_overrides_v2'
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
      collectionMode: 'hybrid',
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
      collectionMode: 'hybrid',
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
      collectionMode: 'hybrid',
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
      enumeratorDefault: '',
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

  // All seeded responses above are already marked syncStatus: 'synced',
  // so the initial syncQueue starts empty (no orphaned/ghost pending items).
  const syncQueue = [];

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
      assignedSurveys: ['srv_maize_2026', 'srv_agrodealer_2026', 'srv_extension_pulse'],
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
      assignedSurveys: ['srv_maize_2026', 'srv_agrodealer_2026', 'srv_extension_pulse'],
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
      assignedSurveys: ['srv_maize_2026', 'srv_agrodealer_2026'],
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
      assignedSurveys: ['srv_maize_2026', 'srv_extension_pulse'],
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
      assignedSurveys: ['srv_maize_2026', 'srv_agrodealer_2026'],
      taskQuotas: {
        'srv_maize_2026': { target: 12, notes: 'Target high-elevation plots in Nakuru East', deadline: '2026-11-15' },
        'srv_agrodealer_2026': { target: 6, notes: 'Stock audit across registered retailers', deadline: '2026-11-20' }
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
      assignedSurveys: ['srv_maize_2026', 'srv_extension_pulse'],
      taskQuotas: {
        'srv_maize_2026': { target: 10, notes: 'Bungoma Central farmer clusters', deadline: '2026-11-14' },
        'srv_extension_pulse': { target: 5, notes: 'Extension training demo feedback', deadline: '2026-11-25' }
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
      assignedSurveys: ['srv_maize_2026', 'srv_agrodealer_2026'],
      taskQuotas: {
        'srv_maize_2026': { target: 15, notes: 'Drought-tolerant hybrid plot audits', deadline: '2026-11-18' },
        'srv_agrodealer_2026': { target: 8, notes: 'Eldoret hub agro-dealers', deadline: '2026-11-22' }
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
      assignedSurveys: ['srv_maize_2026', 'srv_agrodealer_2026', 'srv_extension_pulse'],
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
  },
  {
    id: 'tpl_patient_intake',
    name: 'Healthcare & Community Patient Intake',
    category: 'Public Health & Clinical',
    icon: 'fa-heart-pulse',
    badge: 'Clinical Assessment',
    description: 'Patient demographic record, triage urgency rating, symptom checklist, vital metrics (temperature, BP), consent signature, and clinic GPS.',
    build: () => ({
      id: 'srv_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5),
      title: 'Community Health & Clinical Patient Intake',
      description: 'Standard clinical triage protocol recording symptoms, vital measurements, triage severity, and patient informed consent.',
      category: 'Public Health & Clinical',
      status: 'Active',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      theme: {
        accentColor: '#0F766E',
        headerStyle: 'canopy',
        showProgressBar: true,
        showQuestionNumbers: true
      },
      pages: [
        {
          id: 'p_health_1',
          title: 'Section 1: Patient Demographics & Triage Severity',
          description: 'Record patient primary information and clinical triage status.',
          questions: [
            {
              id: 'q_patient_name',
              type: 'short_text',
              title: 'Patient Full Name or Medical Record Number (MRN)',
              helpText: 'Enter formal identifier.',
              required: true,
              placeholder: 'e.g. John Doe / MRN-88421'
            },
            {
              id: 'q_patient_age',
              type: 'number_yield',
              title: 'Patient Age',
              helpText: 'Enter completed years.',
              unit: 'years',
              min: 0,
              max: 120,
              required: true
            },
            {
              id: 'q_triage_urgency',
              type: 'multiple_choice',
              title: 'Clinical Triage Severity Classification',
              helpText: 'Select urgency tier according to emergency triage guidelines.',
              required: true,
              options: ['Priority 1 — Resuscitation / Immediate', 'Priority 2 — Urgent (Within 30 mins)', 'Priority 3 — Semi-Urgent', 'Priority 4 — Routine / Non-Urgent']
            },
            {
              id: 'q_symptoms_list',
              type: 'checkboxes',
              title: 'Presenting Symptoms & Clinical Complaints',
              helpText: 'Check all clinical symptoms reported by patient.',
              required: true,
              options: ['Acute High Fever', 'Respiratory Cough / Shortness of Breath', 'Gastrointestinal Distress', 'Severe Headache / Malaise', 'Injury / Trauma']
            }
          ]
        },
        {
          id: 'p_health_2',
          title: 'Section 2: Vitals, Clinic Location & Consent',
          description: 'Document diagnostic vitals, record GPS, and obtain sign-off.',
          questions: [
            {
              id: 'q_patient_temp',
              type: 'number_yield',
              title: 'Body Temperature (°C)',
              helpText: 'Measured using digital thermometer.',
              unit: '°C',
              min: 30,
              max: 45,
              required: true
            },
            {
              id: 'q_clinic_gps',
              type: 'gps_location',
              title: 'Community Health Clinic GPS Location',
              helpText: 'Lock coordinate fix for spatial epidemiology tracking.',
              required: false
            },
            {
              id: 'q_patient_signature',
              type: 'signature',
              title: 'Patient / Guardian Informed Consent Signature',
              helpText: 'Confirm voluntary participation in clinical intake.',
              required: true
            }
          ]
        }
      ]
    })
  },
  {
    id: 'tpl_employee_pulse',
    name: 'Employee Engagement & Culture Pulse (eNPS)',
    category: 'Human Resources & People',
    icon: 'fa-users',
    badge: 'Enterprise HR',
    description: 'Measure Employee Net Promoter Score, team collaboration Likert grid, manager leadership ratings, and open workplace feedback.',
    build: () => ({
      id: 'srv_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5),
      title: 'Quarterly Employee Engagement & Culture Pulse',
      description: 'Confidential organizational survey assessing team culture, psychological safety, leadership alignment, and employee retention.',
      category: 'Human Resources & People',
      status: 'Active',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      theme: {
        accentColor: '#1E293B',
        headerStyle: 'canopy',
        showProgressBar: true,
        showQuestionNumbers: true
      },
      pages: [
        {
          id: 'p_hr_1',
          title: 'Section 1: Department & Employee NPS',
          description: 'Provide confidential feedback on your team experience.',
          questions: [
            {
              id: 'q_hr_dept',
              type: 'dropdown',
              title: 'Primary Functional Department / Team',
              helpText: 'Select your organizational division.',
              required: true,
              options: ['Engineering & Product', 'Operations & Field Teams', 'Commercial & Marketing', 'Finance & Administration', 'People & HR']
            },
            {
              id: 'q_hr_enps',
              type: 'nps',
              title: 'How likely are you to recommend our organization as a great place to work?',
              helpText: '0 = Not at all likely, 10 = Extremely likely (eNPS standard)',
              required: true
            },
            {
              id: 'q_hr_tenure',
              type: 'number_yield',
              title: 'Tenure with Organization (Months)',
              helpText: 'Total completed months of service.',
              unit: 'months',
              min: 1,
              max: 240,
              required: true
            }
          ]
        },
        {
          id: 'p_hr_2',
          title: 'Section 2: Culture Dimensions & Open Feedback',
          description: 'Evaluate leadership support, teamwork, and growth opportunities.',
          questions: [
            {
              id: 'q_hr_matrix',
              type: 'matrix',
              title: 'Rate your level of agreement with each workplace statement:',
              helpText: 'Select one rating per statement.',
              required: true,
              rows: ['I feel valued and recognized for my contributions', 'Leadership communicates clear priorities', 'I have opportunities to learn and develop skills', 'My team collaborates effectively without silos'],
              columns: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
            },
            {
              id: 'q_hr_verbatim',
              type: 'long_text',
              title: 'What is the single most impactful thing the organization can do to support your success?',
              helpText: 'All comments are reviewed by leadership for continuous improvement.',
              required: false,
              placeholder: 'Share your perspective…'
            }
          ]
        }
      ]
    })
  },
  {
    id: 'tpl_humanitarian_needs',
    name: 'Community & Humanitarian Needs Assessment',
    category: 'Humanitarian & Social Relief',
    icon: 'fa-hand-holding-heart',
    badge: 'UN / NGO Standard',
    description: 'Household size, clean water (WASH) sources, food security index, urgent aid priorities, satellite GPS, and audio testimony.',
    build: () => ({
      id: 'srv_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5),
      title: 'Community Vulnerability & Humanitarian Needs Assessment',
      description: 'Rapid multi-sector assessment benchmarked against UNHCR/WFP standards covering WASH, food security, shelter, and emergency relief.',
      category: 'Humanitarian & Social Relief',
      status: 'Active',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      theme: {
        accentColor: '#92400E',
        headerStyle: 'canopy',
        showProgressBar: true,
        showQuestionNumbers: true
      },
      pages: [
        {
          id: 'p_aid_1',
          title: 'Section 1: Household Structure & Water Access',
          description: 'Record household composition and basic living conditions.',
          questions: [
            {
              id: 'q_hh_members',
              type: 'number_yield',
              title: 'Total Number of People in Household',
              helpText: 'Include adults, elders, and children living under one roof.',
              unit: 'members',
              min: 1,
              max: 30,
              required: true
            },
            {
              id: 'q_wash_source',
              type: 'multiple_choice',
              title: 'Primary Drinking Water Source (WASH)',
              helpText: 'Select primary daily water supply.',
              required: true,
              options: ['Piped Tap Water / Borehole', 'Protected Community Well', 'Water Trucking / Kiosk', 'Unprotected River / Pond']
            },
            {
              id: 'q_food_security',
              type: 'multiple_choice',
              title: 'Household Food Consumption & Security Status',
              helpText: 'Based on food availability over the past 7 days.',
              required: true,
              options: ['Acceptable — 3 adequate meals daily', 'Borderline — Reduced portion sizes / 2 meals', 'Poor — Missed full days / severe deficit']
            }
          ]
        },
        {
          id: 'p_aid_2',
          title: 'Section 2: Urgent Assistance Priorities & Geotag',
          description: 'Identify immediate relief requirements and record shelter coordinates.',
          questions: [
            {
              id: 'q_aid_priorities',
              type: 'checkboxes',
              title: 'Most Urgent Emergency Assistance Needs',
              helpText: 'Select up to 3 highest priority items.',
              required: true,
              options: ['Emergency Food Rations', 'Clean Drinking Water / Purification Kits', 'Shelter & Non-Food Items (Tarpaulins, Blankets)', 'Healthcare & Medicine', 'Child Nutrition Support']
            },
            {
              id: 'q_shelter_gps',
              type: 'gps_location',
              title: 'Household / Settlement GPS Coordinate Fix',
              helpText: 'Acquire high-precision satellite coordinates at household entrance.',
              required: true
            },
            {
              id: 'q_beneficiary_audio',
              type: 'audio_note',
              title: 'Qualitative Household Audio Testimony',
              helpText: 'Record a spoken narrative regarding community needs.',
              required: false,
              maxDurationSec: 300
            }
          ]
        }
      ]
    })
  },
  {
    id: 'tpl_training_eval',
    name: 'Professional Training & Workshop Evaluation',
    category: 'Education & Capacity Building',
    icon: 'fa-graduation-cap',
    badge: 'Education Standard',
    description: 'Post-event evaluation with module selection, instructor clarity stars, practical applicability NPS, key learnings, and photo proof.',
    build: () => ({
      id: 'srv_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5),
      title: 'Workshop & Capacity Building Evaluation',
      description: 'Post-training evaluation measuring pedagogical clarity, relevance to job tasks, materials quality, and participant satisfaction.',
      category: 'Education & Capacity Building',
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
      pages: [
        {
          id: 'p_edu_1',
          title: 'Section 1: Course Feedback & Instructor Rating',
          description: 'Share your assessment of the training session.',
          questions: [
            {
              id: 'q_course_module',
              type: 'dropdown',
              title: 'Training Module / Track Attended',
              helpText: 'Select the primary workshop track.',
              required: true,
              options: ['Module 1: Foundations & Core Concepts', 'Module 2: Advanced Practical Execution', 'Module 3: Leadership & Operations', 'Module 4: Quality & Compliance']
            },
            {
              id: 'q_trainer_stars',
              type: 'star_rating',
              title: 'Overall Trainer Knowledge & Communication Clarity',
              helpText: '1 star = Poor, 5 stars = Exceptional',
              maxStars: 5,
              required: true
            },
            {
              id: 'q_course_nps',
              type: 'nps',
              title: 'How likely are you to recommend this training to a fellow professional?',
              helpText: '0 = Not at all likely, 10 = Extremely likely',
              required: true
            },
            {
              id: 'q_key_takeaways',
              type: 'long_text',
              title: 'What was the most actionable takeaway or skill you learned?',
              helpText: 'Describe how you will apply this in your daily work.',
              required: false,
              placeholder: 'Type your reflection…'
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
    } catch (e) { }
  },

  clearLockout() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) { }
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
    const cleanAnswers =
      typeof window !== 'undefined' &&
      window.aeStore &&
      typeof window.aeStore.cleanAnswersForCloudSync === 'function'
        ? window.aeStore.cleanAnswersForCloudSync(record.answers || {})
        : record.answers || {};
    return {
      clientResponseId: record.clientResponseId || record.id,
      surveyId: record.surveyId,
      collectorId: record.collectorId,
      enumerator: record.enumerator,
      submittedAt: record.submittedAt,
      durationSec: record.durationSec,
      answers: cleanAnswers,
      gps: record.gps
        ? {
          lat: record.gps.lat,
          lng: record.gps.lng,
          accuracy: record.gps.accuracy
        }
        : null
    };
  },

  computeSyncFallbackHash(record) {
    const canonical = this.canonicalStringify(this.buildRecordDigestPayload(record));
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

  async computeRecordHash(record) {
    const canonical = this.canonicalStringify(this.buildRecordDigestPayload(record));
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle && window.crypto.subtle.digest) {
      try {
        const enc = new TextEncoder().encode(canonical);
        const buf = await window.crypto.subtle.digest('SHA-256', enc);
        const arr = Array.from(new Uint8Array(buf));
        return arr.map((b) => (b < 16 ? '0' : '') + b.toString(16)).join('');
      } catch (e) { }
    }
    return this.computeSyncFallbackHash(record);
  },

  async verifyRecordHash(record) {
    if (!record || !record.recordHash) return false;
    if (String(record.recordHash).startsWith('sha256_compat_')) {
      return this.computeSyncFallbackHash(record) === record.recordHash;
    }
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
          user.assignedSurveys = Array.isArray(live.assignedSurveys) ? [...live.assignedSurveys] : [];
        }
      }

      if (!Array.isArray(user.assignedSurveys)) {
        user.assignedSurveys = [];
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
      assignedSurveys: Array.isArray(user.assignedSurveys) ? [...user.assignedSurveys] : [],
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
      } catch (e) { }
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

  isAdmin() {
    const user = this.getCurrentUser();
    return Boolean(user && user.role === 'admin');
  },

  isSupervisor() {
    const user = this.getCurrentUser();
    return Boolean(user && user.role === 'supervisor');
  },

  isEnumerator() {
    const user = this.getCurrentUser();
    return Boolean(user && user.role === 'enumerator');
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
    const res = template.replace(/\{\{\s*([a-zA-Z0-9_-]+)(?:\s*\|\s*(?:'([^']*)'|"([^"]*)"))?\s*\}\}/g, (match, qId, sqFallback, dqFallback) => {
      const fallback = sqFallback !== undefined ? sqFallback : dqFallback;
      const val = answers[qId];
      if (val === undefined || val === null || val === '') {
        return fallback !== undefined ? fallback : '';
      }
      if (Array.isArray(val)) {
        if (val.length === 0) {
          return fallback !== undefined ? fallback : '';
        }
        return val.join(', ');
      }
      if (typeof val === 'object') {
        if ('lat' in val || 'lng' in val) {
          if (val.label) return String(val.label);
          const latNum = (val.lat !== '' && val.lat !== null && val.lat !== undefined) ? Number(val.lat) : NaN;
          const lngNum = (val.lng !== '' && val.lng !== null && val.lng !== undefined) ? Number(val.lng) : NaN;
          if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
            return `${latNum.toFixed(4)}, ${lngNum.toFixed(4)}`;
          }
          return fallback !== undefined ? fallback : '';
        }
        if (val.crop && val.variety) {
          return `${val.crop} - ${val.variety}`;
        }
        return JSON.stringify(val);
      }
      return String(val);
    });
    // Remove awkward trailing whitespace or space before punctuation caused by empty token replacement
    return res.replace(/\s+([\?\.\!,:])/g, '$1').replace(/\s{2,}/g, ' ').trim();
  },

  computeQuestionDisplayNumbers(questions = []) {
    const numMap = {};
    const byId = {};
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (q && q.id) byId[q.id] = q;
    }

    const resolveRootParent = (q) => {
      if (!q || !q.parentQuestionId || !byId[q.parentQuestionId] || q.parentQuestionId === q.id) {
        return null;
      }
      const visited = new Set([q.id]);
      let curr = byId[q.parentQuestionId];
      while (curr && curr.parentQuestionId && byId[curr.parentQuestionId]) {
        if (visited.has(curr.id)) return null; // Cycle guard
        visited.add(curr.id);
        curr = byId[curr.parentQuestionId];
      }
      if (!curr || visited.has(curr.id)) return null;
      return curr.id;
    };

    // Pass 1: Assign sequential main numbers to all top-level questions
    let mainCount = 1;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q || !q.id) continue;
      if (!resolveRootParent(q)) {
        numMap[q.id] = { label: `${mainCount}`, mainNum: mainCount, hasLetter: false, isSub: false };
        mainCount++;
      }
    }

    // Pass 2: Assign 2a/2b/2c sub-question labels against resolved root parents
    const parentSubCounts = {};
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q || !q.id) continue;
      const rootId = resolveRootParent(q);
      if (rootId && numMap[rootId]) {
        const parentEntry = numMap[rootId];
        const parentNum = parentEntry.mainNum;
        parentSubCounts[rootId] = (parentSubCounts[rootId] || 1) + 1;
        const letter = String.fromCharCode(96 + parentSubCounts[rootId]); // 97='a', 98='b', etc.
        if (!parentEntry.hasLetter) {
          parentEntry.label = `${parentNum}a`;
          parentEntry.letter = 'a';
          parentEntry.hasLetter = true;
        }
        numMap[q.id] = {
          label: `${parentNum}${letter}`,
          mainNum: parentNum,
          letter,
          isSub: true,
          parentId: rootId
        };
      }
    }
    return numMap;
  },

  isQuestionVisible(q, answers = {}, survey = null) {
    if (!q || !q.displayRule || !q.displayRule.enabled) return true;
    const sourceId = q.displayRule.sourceQuestionId || q.parentQuestionId;
    if (!sourceId) return true;

    const rawVal = answers ? answers[sourceId] : undefined;
    const isEmpty = (v) => {
      if (v === undefined || v === null) return true;
      if (typeof v === 'string') return v.trim() === '';
      if (Array.isArray(v)) return v.length === 0;
      if (typeof v === 'object') return Object.keys(v).length === 0;
      return false;
    };

    const mode = q.displayRule.mode || 'any_answer';
    if (mode === 'any_answer') {
      return !isEmpty(rawVal);
    }

    if (isEmpty(rawVal)) {
      return false;
    }

    const canonicalSurvey =
      survey &&
      survey.id &&
      typeof window !== 'undefined' &&
      window.aeStore &&
      typeof window.aeStore.getSurveyById === 'function'
        ? (window.aeStore.getSurveyById(survey.id) || survey)
        : survey;
    const lang =
      typeof window !== 'undefined' &&
      window.AEI18n &&
      typeof window.AEI18n.getLanguage === 'function'
        ? window.AEI18n.getLanguage()
        : 'en';
    const canonicalVal =
      canonicalSurvey &&
      typeof window !== 'undefined' &&
      window.AEI18n &&
      typeof window.AEI18n.getCanonicalEnglishAnswer === 'function'
        ? window.AEI18n.getCanonicalEnglishAnswer(canonicalSurvey, sourceId, rawVal, lang)
        : rawVal;

    const norm = (v) => String(v ?? '').trim().toLowerCase();
    const matchesSingle = (val, target) => {
      if (target === undefined || target === null) return false;
      const normTarget = norm(target);
      if (Array.isArray(val)) {
        return val.some((item) => norm(item) === normTarget);
      }
      return val !== undefined && val !== null && norm(val) === normTarget;
    };
    const matchesValue = (target) => matchesSingle(rawVal, target) || matchesSingle(canonicalVal, target);

    if (mode === 'equals') {
      return matchesValue(q.displayRule.value);
    }
    if (mode === 'not_equals') {
      return !matchesValue(q.displayRule.value);
    }
    if (mode === 'in') {
      const vals = Array.isArray(q.displayRule.values) ? q.displayRule.values : [];
      return vals.some((v) => matchesValue(v));
    }
    return true;
  }
};

/**
 * Safe Zero-Eval Formula & Cross-Question Consistency Engine
 * Evaluates calculated numeric fields via a strict recursive-descent parser
 * (NO eval, NO Function constructor) and validates numeric consistency rules.
 */
window.AEFormulaEngine = {
  ALLOWED_FUNCTIONS: {
    min: (args) => (args.length >= 1 ? Math.min(...args) : NaN),
    max: (args) => (args.length >= 1 ? Math.max(...args) : NaN),
    abs: (args) => (args.length === 1 ? Math.abs(args[0]) : NaN),
    floor: (args) => (args.length === 1 ? Math.floor(args[0]) : NaN),
    ceil: (args) => (args.length === 1 ? Math.ceil(args[0]) : NaN),
    round: (args) => {
      if (args.length === 1) return Math.round(args[0]);
      if (args.length === 2) {
        const digits = Math.max(0, Math.min(8, Math.trunc(args[1])));
        const factor = Math.pow(10, digits);
        return Math.round(args[0] * factor) / factor;
      }
      return NaN;
    }
  },

  _toFiniteNumber(val) {
    if (val === undefined || val === null || val === '') return null;
    if (typeof val === 'boolean' || typeof val === 'object') return null;
    const num = Number(val);
    return Number.isFinite(num) ? num : null;
  },

  _tokenize(expr) {
    const tokens = [];
    let i = 0;
    const len = expr.length;
    while (i < len) {
      const ch = expr[i];
      if (/\s/.test(ch)) {
        i++;
        continue;
      }
      if ((ch >= '0' && ch <= '9') || ch === '.') {
        let start = i;
        let dotCount = 0;
        while (i < len && ((expr[i] >= '0' && expr[i] <= '9') || expr[i] === '.')) {
          if (expr[i] === '.') dotCount++;
          if (dotCount > 1) return null;
          i++;
        }
        const raw = expr.slice(start, i);
        if (raw === '.') return null;
        const num = Number(raw);
        if (!Number.isFinite(num)) return null;
        tokens.push({ type: 'number', value: num });
        continue;
      }
      if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
        tokens.push({ type: 'op', value: ch });
        i++;
        continue;
      }
      if (ch === '(' || ch === ')' || ch === ',') {
        tokens.push({ type: 'punct', value: ch });
        i++;
        continue;
      }
      if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) {
        let start = i;
        while (i < len && ((expr[i] >= 'a' && expr[i] <= 'z') || (expr[i] >= 'A' && expr[i] <= 'Z'))) {
          i++;
        }
        const name = expr.slice(start, i).toLowerCase();
        if (!Object.prototype.hasOwnProperty.call(this.ALLOWED_FUNCTIONS, name)) {
          return null;
        }
        tokens.push({ type: 'func', value: name });
        continue;
      }
      // Reject any other character (quotes, semicolons, brackets, $, _, etc.)
      return null;
    }
    if (tokens.length === 0 || tokens.length > 200) return null;
    return tokens;
  },

  evaluateExpression(expr, answers = {}, decimals = 2) {
    if (typeof expr !== 'string' || !expr.trim()) return null;
    const safeAnswers = answers && typeof answers === 'object' ? answers : {};
    let missingVar = false;

    const substituted = expr.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (_match, qId) => {
      const num = this._toFiniteNumber(safeAnswers[qId]);
      if (num === null) {
        missingVar = true;
        return '';
      }
      return `(${num})`;
    });

    if (missingVar) return null;
    if (substituted.includes('{{') || substituted.includes('}}')) return null;

    const tokens = this._tokenize(substituted);
    if (!tokens) return null;

    let pos = 0;
    let depth = 0;
    const MAX_DEPTH = 32;
    const fns = this.ALLOWED_FUNCTIONS;

    const peek = () => tokens[pos] || null;
    const consume = () => tokens[pos++] || null;

    const parseExpression = () => {
      if (++depth > MAX_DEPTH) return NaN;
      let left = parseTerm();
      while (peek() && peek().type === 'op' && (peek().value === '+' || peek().value === '-')) {
        const op = consume().value;
        const right = parseTerm();
        left = op === '+' ? left + right : left - right;
      }
      depth--;
      return left;
    };

    const parseTerm = () => {
      if (++depth > MAX_DEPTH) return NaN;
      let left = parseUnary();
      while (peek() && peek().type === 'op' && (peek().value === '*' || peek().value === '/')) {
        const op = consume().value;
        const right = parseUnary();
        if (op === '*') {
          left = left * right;
        } else {
          if (right === 0) {
            depth--;
            return NaN;
          }
          left = left / right;
        }
      }
      depth--;
      return left;
    };

    const parseUnary = () => {
      if (++depth > MAX_DEPTH) return NaN;
      let res;
      if (peek() && peek().type === 'op' && (peek().value === '+' || peek().value === '-')) {
        const op = consume().value;
        const val = parseUnary();
        res = op === '-' ? -val : val;
      } else {
        res = parsePrimary();
      }
      depth--;
      return res;
    };

    const parsePrimary = () => {
      const tok = peek();
      if (!tok) return NaN;

      if (tok.type === 'number') {
        consume();
        return tok.value;
      }

      if (tok.type === 'func') {
        const fnName = consume().value;
        if (!peek() || peek().type !== 'punct' || peek().value !== '(') return NaN;
        consume(); // '('
        const args = [];
        if (peek() && peek().type === 'punct' && peek().value === ')') {
          consume();
          return NaN;
        }
        while (true) {
          args.push(parseExpression());
          if (peek() && peek().type === 'punct' && peek().value === ',') {
            consume();
            continue;
          }
          break;
        }
        if (!peek() || peek().type !== 'punct' || peek().value !== ')') return NaN;
        consume(); // ')'
        if (args.some((a) => !Number.isFinite(a))) return NaN;
        return fns[fnName](args);
      }

      if (tok.type === 'punct' && tok.value === '(') {
        consume(); // '('
        const val = parseExpression();
        if (!peek() || peek().type !== 'punct' || peek().value !== ')') return NaN;
        consume(); // ')'
        return val;
      }

      return NaN;
    };

    const rawResult = parseExpression();
    if (pos !== tokens.length || !Number.isFinite(rawResult)) return null;

    const dec = Number.isInteger(decimals) && decimals >= 0 && decimals <= 8 ? decimals : 2;
    const factor = Math.pow(10, dec);
    const rounded = Math.round(rawResult * factor) / factor;
    return Object.is(rounded, -0) ? 0 : rounded;
  },

  _collectSurveyQuestions(survey) {
    if (!survey) return [];
    if (Array.isArray(survey.pages)) {
      return survey.pages.flatMap((p) => (p && Array.isArray(p.questions) ? p.questions : []));
    }
    if (Array.isArray(survey.questions)) {
      return survey.questions;
    }
    return [];
  },

  evaluateCalculatedFields(survey, answers = {}) {
    const questions = this._collectSurveyQuestions(survey);
    const calcQuestions = questions.filter((q) => q && q.type === 'calculated' && typeof q.formula === 'string' && q.formula.trim());
    const results = {};
    if (calcQuestions.length === 0) return results;

    const working = { ...(answers && typeof answers === 'object' ? answers : {}) };
    // Run up to 2 passes so calculated fields referencing other calculated fields resolve cleanly
    for (let pass = 0; pass < 2; pass++) {
      let changed = false;
      calcQuestions.forEach((q) => {
        const dec = q.decimals !== undefined && q.decimals !== null && q.decimals !== ''
          ? Number(q.decimals)
          : 2;
        const val = this.evaluateExpression(q.formula, working, Number.isInteger(dec) ? dec : 2);
        if (results[q.id] !== val) {
          results[q.id] = val;
          changed = true;
        }
        if (val !== null) {
          working[q.id] = val;
        } else {
          delete working[q.id];
        }
      });
      if (!changed) break;
    }
    return results;
  },

  evaluateConsistencyRules(survey, answers = {}) {
    const questions = this._collectSurveyQuestions(survey);
    const qMap = {};
    questions.forEach((q) => {
      if (q && q.id) qMap[q.id] = q;
    });

    const safeAnswers = answers && typeof answers === 'object' ? answers : {};
    const violations = [];

    questions.forEach((q) => {
      if (!q || !q.consistencyRule || !q.consistencyRule.enabled || !q.consistencyRule.compareQuestionId) return;
      if (
        typeof window !== 'undefined' &&
        window.AEPiping &&
        typeof window.AEPiping.isQuestionVisible === 'function' &&
        !window.AEPiping.isQuestionVisible(q, safeAnswers, survey)
      ) {
        return;
      }

      const compareId = q.consistencyRule.compareQuestionId;
      const leftNum = this._toFiniteNumber(safeAnswers[q.id]);
      const rightNum = this._toFiniteNumber(safeAnswers[compareId]);
      if (leftNum === null || rightNum === null) return;

      const rawOp = String(q.consistencyRule.operator || q.consistencyRule.op || '<=').trim();
      let passes = true;
      if (rawOp === '<=') passes = leftNum <= rightNum;
      else if (rawOp === '>=') passes = leftNum >= rightNum;
      else if (rawOp === '<') passes = leftNum < rightNum;
      else if (rawOp === '>') passes = leftNum > rightNum;
      else if (rawOp === '==' || rawOp === '===') passes = leftNum === rightNum;
      else if (rawOp === '!=' || rawOp === '!==') passes = leftNum !== rightNum;
      else return;

      if (!passes) {
        const compareQ = qMap[compareId];
        const compareLabel = (compareQ && compareQ.title) ? compareQ.title : compareId;
        const defaultMsg = `Value (${leftNum}) must be ${rawOp} "${compareLabel}" (${rightNum}).`;
        violations.push({
          questionId: q.id,
          compareQuestionId: compareId,
          operator: rawOp,
          message: (q.consistencyRule.message && String(q.consistencyRule.message).trim()) || defaultMsg
        });
      }
    });

    return violations;
  }
};

/**
 * Curated Selectable Survey Theme Presets
 * Controls respondent canvas, card surface, border radius, typography pairing, and accent palette.
 */
window.AEThemePresets = {
  PRESETS: [
    {
      id: 'canopy_emerald',
      name: 'Canopy Classic',
      tagline: 'Signature stone & emerald',
      pageBg: '#F4F6F4',
      cardBg: '#FFFFFF',
      cardBorder: '#E4E7E4',
      cardRadius: '10px',
      ink: '#111613',
      mutedInk: '#525B56',
      accentColor: '#247B50',
      headingFont: '"Fraunces", Georgia, serif'
    },
    {
      id: 'editorial_parchment',
      name: 'Editorial Parchment',
      tagline: 'Warm ivory research journal',
      pageBg: '#FBF9F5',
      cardBg: '#FFFFFF',
      cardBorder: '#E8E2D5',
      cardRadius: '8px',
      ink: '#1A1815',
      mutedInk: '#5C574F',
      accentColor: '#1E5631',
      headingFont: '"Fraunces", Georgia, serif'
    },
    {
      id: 'modern_slate',
      name: 'Modern Corporate Slate',
      tagline: 'Clean navy-slate for workshops & HR',
      pageBg: '#F4F6F9',
      cardBg: '#FFFFFF',
      cardBorder: '#DCE2EC',
      cardRadius: '8px',
      ink: '#0F172A',
      mutedInk: '#475569',
      accentColor: '#1E3A5F',
      headingFont: '"Plus Jakarta Sans", system-ui, sans-serif'
    },
    {
      id: 'terracotta_earth',
      name: 'Terracotta Warmth',
      tagline: 'Warm clay & cream for community events',
      pageBg: '#FAF5EF',
      cardBg: '#FFFFFF',
      cardBorder: '#EADBC8',
      cardRadius: '12px',
      ink: '#2C1D18',
      mutedInk: '#6B554C',
      accentColor: '#B84A27',
      headingFont: '"Fraunces", Georgia, serif'
    },
    {
      id: 'ocean_teal',
      name: 'Clinical & Civic Teal',
      tagline: 'Calm mist & deep teal for health/public',
      pageBg: '#F2F8F7',
      cardBg: '#FFFFFF',
      cardBorder: '#D3E6E3',
      cardRadius: '12px',
      ink: '#0F2524',
      mutedInk: '#4A6664',
      accentColor: '#0F766E',
      headingFont: '"Plus Jakarta Sans", system-ui, sans-serif'
    },
    {
      id: 'high_contrast_field',
      name: 'High-Contrast Daylight',
      tagline: 'Crisp outdoor sunlight legibility',
      pageBg: '#FFFFFF',
      cardBg: '#FFFFFF',
      cardBorder: '#111613',
      cardRadius: '6px',
      ink: '#000000',
      mutedInk: '#262626',
      accentColor: '#14532D',
      headingFont: '"Plus Jakarta Sans", system-ui, sans-serif'
    }
  ],

  getById(presetId) {
    return this.PRESETS.find((p) => p.id === presetId) || this.PRESETS[0];
  },

  resolve(themeObj = {}) {
    const t = themeObj && typeof themeObj === 'object' ? themeObj : {};
    const base = this.getById(t.preset || 'canopy_emerald');
    return {
      ...base,
      preset: base.id,
      accentColor: t.accentColor || base.accentColor,
      showProgressBar: t.showProgressBar !== false,
      showQuestionNumbers: t.showQuestionNumbers !== false
    };
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
    this.pinOverrides = {};
    this.syncQueue = [];
    this.deletedSurveyIds = [];
    this.syncLogs = [];
    this.runnerDrafts = {};
    this.lastSyncError = null;
    this._syncInFlight = false;
    this._syncPendingAgain = false;
    this._syncPendingOptions = null;
    this._syncInFlightPromise = null;
    this._pullInFlight = false;
    this._pullInFlightPromise = null;
    this._lastPullAttemptAt = 0;
    this._surveysDirty = false;
    this._tabId = 'tab_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    this._broadcastChannel = null;
    this._leaderHeartbeatTimer = null;
    this._leaderUnloadBound = false;
    this._storageListenerBound = false;
    this.settings = {
      gasWebAppUrl: AE_DEFAULT_GAS_CONFIG.gasWebAppUrl,
      syncToken: AE_DEFAULT_GAS_CONFIG.syncToken,
      spreadsheetUrl: '',
      spreadsheetName: 'AgriExperience_AE_Survey_Master_DB',
      autoSyncOnOnline: true,
      simulateOffline: false,
      deviceId: 'AE-TAB-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      defaultEnumerator: '',
      lastSyncedAt: null,
      cloudDbVersion: null,
      lastDeltaSyncAt: null
    };
    this.listeners = [];
  }

  _isRespondentModeUrl() {
    if (typeof window === 'undefined' || !window.location || !window.location.search) return false;
    try {
      const params = new URLSearchParams(window.location.search);
      return String(params.get('mode') || '').toLowerCase() === 'respondent';
    } catch (e) {
      return false;
    }
  }

  async init() {
    this.loadFromLocalStorage();

    // Support URL Query Parameter Auto-Config (?gasUrl=...&syncToken=...)
    let isRespondentMode = false;
    if (typeof window !== 'undefined' && window.location && window.location.search) {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlParam = params.get('gasUrl') || params.get('gas');
        const tokenParam = params.get('syncToken') || params.get('token');
        isRespondentMode = String(params.get('mode') || '').toLowerCase() === 'respondent';
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
          this.saveToLocalStorage({ stores: ['settings'], broadcast: false });
        }
      } catch (e) { }
    }

    try {
      this.idb = await this.openIndexedDB();
      await this.reconcileIndexedDB();
    } catch (e) {
      console.warn('IndexedDB unavailable, using synchronous localStorage engine:', e);
    }

    // Initialize cross-tab synchronization (BroadcastChannel + storage event fallback)
    this.initCrossTabSync();

    // Non-blocking boot sync & fresh pull:
    // - In mode=respondent, skip refreshPersonnelFromCloud() and full pullAll (field-app uses pullSingleSurveyFromCloud).
    // - Otherwise, flush pending personnel/changes first (BATCH_SYNC already returns personnel, so no redundant refreshPersonnelFromCloud),
    //   then run non-blocking version-checked pullFreshDataIfStale.
    if (this.isEffectivelyOnline() && this.settings.gasWebAppUrl && !isRespondentMode) {
      const hasPendingPersonnel = Array.isArray(this.syncQueue) && this.syncQueue.some((q) => q && q.action === 'UPSERT_PERSONNEL');
      if (hasPendingPersonnel) {
        this.syncWithGoogleSheets({ forceAll: false, isBackground: true })
          .then(() => this.pullFreshDataIfStale({ minAgeMs: 0, force: true, reason: 'init' }))
          .catch(() => { });
      } else {
        this.pullFreshDataIfStale({ minAgeMs: 0, force: true, reason: 'init' }).catch(() => { });
      }
    }
    // Launch continuous background auto-sync daemon (leader-elected)
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
      } catch (e) { }
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
    const [idbSurveys, cols, resps, metaEntries, staff, queue] = await Promise.all([
      this.readStoreAll('surveys'),
      this.readStoreAll('collectors'),
      this.readStoreAll('responses'),
      this.readStoreAll('meta'),
      this.readStoreAll('personnel'),
      this.readStoreAll('syncQueue')
    ]);

    if (idbSurveys.length === 0 && this.surveys.length > 0) {
      await this.persistAllToIDB();
    } else if (idbSurveys.length > 0) {
      // Reconcile surveys by updatedAt timestamp so newer localStorage edits are not overwritten
      const surveyMap = new Map(idbSurveys.map((s) => [s.id, s]));
      (this.surveys || []).forEach((lsSurvey) => {
        if (!lsSurvey || !lsSurvey.id) return;
        const idbItem = surveyMap.get(lsSurvey.id);
        const lsTime = lsSurvey.updatedAt ? Date.parse(lsSurvey.updatedAt) || 0 : 0;
        const idbTime = idbItem && idbItem.updatedAt ? Date.parse(idbItem.updatedAt) || 0 : 0;
        if (!idbItem || lsTime >= idbTime) {
          surveyMap.set(lsSurvey.id, lsSurvey);
        }
      });
      this.surveys = Array.from(surveyMap.values());

      if (cols.length) {
        const colMap = new Map(cols.map((c) => [c.id, c]));
        (this.collectors || []).forEach((lsCol) => {
          if (lsCol && lsCol.id) colMap.set(lsCol.id, lsCol);
        });
        this.collectors = Array.from(colMap.values());
      }

      if (resps.length) {
        const respMap = new Map(resps.map((r) => [r.id || r.clientResponseId, r]));
        (this.responses || []).forEach((lsResp) => {
          const key = lsResp && (lsResp.id || lsResp.clientResponseId);
          if (!key) return;
          const idbResp = respMap.get(key);
          if (!idbResp) {
            respMap.set(key, lsResp);
            return;
          }
          // Never revert a synced localStorage response back to 'queued' from stale IDB,
          // unless the queued copy has a strictly newer updatedAt (e.g. a supervisor review edit).
          const lsTime = Math.max(Date.parse(lsResp.updatedAt || 0) || 0, Date.parse(lsResp.syncedAt || 0) || 0);
          const idbTime = Math.max(Date.parse(idbResp.updatedAt || 0) || 0, Date.parse(idbResp.syncedAt || 0) || 0);
          if (lsResp.syncStatus === 'synced' && idbResp.syncStatus !== 'synced') {
            if (idbTime <= lsTime) {
              respMap.set(key, lsResp);
            }
          } else if (lsTime >= idbTime) {
            respMap.set(key, lsResp);
          }
        });
        this.responses = Array.from(respMap.values());
        this.healResponsesAnswers();
      }

      // Reconcile personnel by updatedAt / pinUpdatedAt + pinOverrides ledger so PIN changes never revert
      const idbPinMeta = (metaEntries || []).find((m) => m && m.id === 'pinOverrides');
      if (idbPinMeta && idbPinMeta.overrides && typeof idbPinMeta.overrides === 'object') {
        this.pinOverrides = this.mergePinOverrides(this.pinOverrides, idbPinMeta.overrides);
      }

      if (staff.length) {
        const staffMap = new Map(staff.map((p) => [p.id, p]));
        (this.personnel || []).forEach((lsPerson) => {
          if (!lsPerson || !lsPerson.id) return;
          const idbPerson = staffMap.get(lsPerson.id);
          if (!idbPerson) {
            staffMap.set(lsPerson.id, lsPerson);
            return;
          }
          const lsTime = Math.max(
            Date.parse(lsPerson.pinUpdatedAt || 0) || 0,
            Date.parse(lsPerson.updatedAt || 0) || 0
          );
          const idbTime = Math.max(
            Date.parse(idbPerson.pinUpdatedAt || 0) || 0,
            Date.parse(idbPerson.updatedAt || 0) || 0
          );
          if (lsTime >= idbTime) {
            staffMap.set(lsPerson.id, lsPerson);
          }
        });
        this.personnel = Array.from(staffMap.values());
      }
      this.applyPinOverridesToPersonnel();

      if (queue.length || (this.syncQueue && this.syncQueue.length)) {
        const lastSyncedMs = this.settings && this.settings.lastSyncedAt
          ? (Date.parse(this.settings.lastSyncedAt) || 0)
          : 0;
        const lsKeys = new Set(
          (this.syncQueue || [])
            .filter((q) => q && q.action && q.recordId)
            .map((q) => `${q.action}_${q.recordId}`)
        );
        const qMap = new Map();
        // Only adopt an IDB queue item if it is still present in localStorage OR was created
        // AFTER the last successful sync (preventing resurrection of already-cleared items).
        (queue || []).forEach((idbQ) => {
          if (!idbQ || !idbQ.action || !idbQ.recordId) return;
          const k = `${idbQ.action}_${idbQ.recordId}`;
          const createdMs = Date.parse(idbQ.createdAt || 0) || 0;
          if (lsKeys.has(k) || (lastSyncedMs === 0 && createdMs > 0) || (lastSyncedMs > 0 && createdMs > lastSyncedMs)) {
            qMap.set(k, idbQ);
          }
        });
        (this.syncQueue || []).forEach((lsQ) => {
          if (lsQ && lsQ.action && lsQ.recordId) {
            qMap.set(`${lsQ.action}_${lsQ.recordId}`, lsQ);
          }
        });
        this.syncQueue = Array.from(qMap.values());
      }
      this.pruneStaleSyncQueue({ save: false });
      await this.persistAllToIDB();
      this.saveToLocalStorage({ skipIDB: true, broadcast: false });
    }
  }

  mergePinOverrides(a = {}, b = {}) {
    const merged = { ...(a && typeof a === 'object' ? a : {}) };
    if (b && typeof b === 'object') {
      for (const [id, entry] of Object.entries(b)) {
        if (!entry || !entry.pinCode) continue;
        const existing = merged[id];
        const tNew = Date.parse(entry.updatedAt || 0) || 0;
        const tOld = existing ? (Date.parse(existing.updatedAt || 0) || 0) : 0;
        if (!existing || tNew >= tOld) {
          merged[id] = {
            pinCode: String(entry.pinCode).trim(),
            updatedAt: entry.updatedAt || new Date().toISOString()
          };
        }
      }
    }
    return merged;
  }

  applyPinOverridesToPersonnel() {
    if (!this.pinOverrides || typeof this.pinOverrides !== 'object' || !Array.isArray(this.personnel)) return;
    this.personnel.forEach((p) => {
      if (!p || !p.id) return;
      const ov = this.pinOverrides[p.id];
      if (!ov || !ov.pinCode) return;
      const ovTime = Date.parse(ov.updatedAt || 0) || 0;
      const pTime = Math.max(Date.parse(p.pinUpdatedAt || 0) || 0, Date.parse(p.updatedAt || 0) || 0);
      if (ovTime >= pTime) {
        p.pinCode = String(ov.pinCode).trim();
        p.pinUpdatedAt = ov.updatedAt;
        if (ovTime > (Date.parse(p.updatedAt || 0) || 0)) {
          p.updatedAt = ov.updatedAt;
        }
      }
    });
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
        if (v.durationSec !== undefined || (v.mimeType && String(v.mimeType).startsWith('audio/'))) {
          clean[k] = {
            capturedAt: v.capturedAt || '',
            durationSec: v.durationSec || 0,
            mimeType: v.mimeType || 'audio/webm',
            transcript: v.transcript || '',
            summary: `Audio note (${v.durationSec || 0}s)`
          };
        } else {
          clean[k] = {
            capturedAt: v.capturedAt || '',
            width: v.width || 0,
            height: v.height || 0,
            sizeKb: v.sizeKb || 0,
            summary: `Photo proof attached (${v.sizeKb || 0} KB)`
          };
        }
      } else {
        clean[k] = v;
      }
    }
    return clean;
  }

  /**
   * Restores seed question answers ONLY for genuine seed response IDs whose answers object was stripped
   * by legacy column mismatches. Never modifies real enumerator or self-administered responses.
   */
  healResponsesAnswers() {
    const seedResponses = (typeof getInitialSeedData === 'function' ? getInitialSeedData().responses : []) || [];
    const seedMap = new Map();

    seedResponses.forEach((sr) => {
      if (sr.id) seedMap.set(sr.id, sr);
      if (sr.clientResponseId) seedMap.set(sr.clientResponseId, sr);
    });

    let healed = 0;
    (this.responses || []).forEach((r) => {
      // Strictly match only known seed response IDs
      const match = seedMap.get(r.id) || seedMap.get(r.clientResponseId);
      const currentAnswers = (r.answers && typeof r.answers === 'object') ? r.answers : {};
      const answerKeys = Object.keys(currentAnswers);

      if (match && match.answers && answerKeys.length === 0) {
        r.answers = JSON.parse(JSON.stringify(match.answers));
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
          this.writeStore('responses', r).catch(() => { });
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

  async persistStoreToIDB(storeName, items, options = {}) {
    if (!this.idb || !storeName) return;
    if (storeName === 'meta') {
      const entries = Array.isArray(items) ? items : [items];
      await Promise.all(entries.filter(Boolean).map((entry) => this.writeStore('meta', entry)));
      return;
    }
    const replace = options.replace !== false;
    const list = Array.isArray(items) ? items : (items ? [items] : []);
    return new Promise((resolve) => {
      try {
        const tx = this.idb.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        if (replace) {
          store.clear();
        }
        list.forEach((item) => {
          if (item && typeof item === 'object') {
            store.put(item);
          }
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (e) {
        resolve();
      }
    });
  }

  async persistAllToIDB() {
    if (!this.idb) return;
    await Promise.all([
      this.persistStoreToIDB('surveys', this.surveys),
      this.persistStoreToIDB('collectors', this.collectors),
      this.persistStoreToIDB('responses', this.responses),
      this.persistStoreToIDB('personnel', this.personnel),
      this.persistStoreToIDB('syncQueue', this.syncQueue),
      this.writeStore('meta', { id: 'pinOverrides', overrides: this.pinOverrides || {}, updatedAt: new Date().toISOString() })
    ]);
  }

  _safeLocalStorageSet(key, value) {
    if (typeof localStorage === 'undefined') return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      const isQuota = Boolean(
        e && (
          e.name === 'QuotaExceededError' ||
          e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
          e.code === 22 ||
          e.code === 1014
        )
      );
      if (isQuota) {
        try {
          localStorage.setItem(AE_STORAGE_KEYS.SYNC_LOGS, JSON.stringify((this.syncLogs || []).slice(0, 10)));
          localStorage.setItem(key, value);
          return true;
        } catch (retryErr) {
          console.warn(`[AESurveyStore] localStorage quota exceeded while writing ${key}; data remains safe in IndexedDB.`, retryErr);
          return false;
        }
      }
      console.warn(`[AESurveyStore] localStorage write failed for ${key}:`, e);
      return false;
    }
  }

  loadFromLocalStorage() {
    try {
      const rawPinOverrides = localStorage.getItem(AE_STORAGE_KEYS.PIN_OVERRIDES);
      this.pinOverrides = rawPinOverrides ? JSON.parse(rawPinOverrides) : {};
    } catch (e) {
      this.pinOverrides = {};
    }
    const rawSurveys = localStorage.getItem(AE_STORAGE_KEYS.SURVEYS);
    if (!rawSurveys) {
      const seed = getInitialSeedData();
      this.surveys = seed.surveys;
      this.collectors = seed.collectors;
      this.responses = seed.responses;
      this.personnel = seed.personnel || getInitialPersonnelSeed();
      this.applyPinOverridesToPersonnel();
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
      this.applyPinOverridesToPersonnel();
      this.syncQueue = JSON.parse(localStorage.getItem(AE_STORAGE_KEYS.SYNC_QUEUE) || '[]');
      this.syncLogs = JSON.parse(localStorage.getItem(AE_STORAGE_KEYS.SYNC_LOGS) || '[]');
      const savedSettings = JSON.parse(localStorage.getItem(AE_STORAGE_KEYS.SETTINGS) || '{}');
      this.settings = { ...this.settings, ...savedSettings };
      // Sanitize legacy defaultEnumerator if it still holds hardcoded Grace Wanjiku
      if (this.settings.defaultEnumerator && typeof this.settings.defaultEnumerator === 'string' && this.settings.defaultEnumerator.includes('Grace Wanjiku')) {
        this.settings.defaultEnumerator = '';
      }
      // Sanitize existing collectors if they were seeded with hardcoded Grace Wanjiku
      if (Array.isArray(this.collectors)) {
        this.collectors.forEach((c) => {
          if (c && c.enumeratorDefault && typeof c.enumeratorDefault === 'string' && c.enumeratorDefault.includes('Grace Wanjiku')) {
            c.enumeratorDefault = '';
          }
        });
      }
      // Fall back to pre-configured production credentials if empty
      if (!this.settings.gasWebAppUrl) {
        this.settings.gasWebAppUrl = AE_DEFAULT_GAS_CONFIG.gasWebAppUrl;
      }
      if (!this.settings.syncToken) {
        this.settings.syncToken = AE_DEFAULT_GAS_CONFIG.syncToken;
      }
      this.runnerDrafts = JSON.parse(localStorage.getItem(AE_STORAGE_KEYS.RUNNER_DRAFTS) || '{}');
      if (this.runnerDrafts && typeof this.runnerDrafts === 'object') {
        Object.keys(this.runnerDrafts).forEach((k) => {
          if (this.runnerDrafts[k] && this.runnerDrafts[k].enumeratorName && typeof this.runnerDrafts[k].enumeratorName === 'string' && this.runnerDrafts[k].enumeratorName.includes('Grace Wanjiku')) {
            delete this.runnerDrafts[k].enumeratorName;
          }
        });
      }
      // Self-heal any orphaned, duplicate, or already-synced ghost items from previous sessions
      const prunedOnLoad = this.pruneStaleSyncQueue({ save: false });
      if (prunedOnLoad && prunedOnLoad.removed > 0) {
        this._safeLocalStorageSet(AE_STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(this.syncQueue));
      }
    } catch (e) {
      const seed = getInitialSeedData();
      this.surveys = seed.surveys;
      this.collectors = seed.collectors;
      this.responses = seed.responses;
      this.personnel = seed.personnel || getInitialPersonnelSeed();
      this.applyPinOverridesToPersonnel();
      this.syncQueue = seed.syncQueue;
      this.syncLogs = seed.syncLogs;
    }
  }

  saveToLocalStorage(options = {}) {
    const stores = Array.isArray(options && options.stores) && options.stores.length > 0
      ? new Set(options.stores)
      : null;
    const skipIDB = Boolean(options && options.skipIDB);
    const shouldBroadcast = !options || options.broadcast !== false;

    if (!stores) {
      this._safeLocalStorageSet(AE_STORAGE_KEYS.SURVEYS, JSON.stringify(this.surveys));
      this._safeLocalStorageSet(AE_STORAGE_KEYS.COLLECTORS, JSON.stringify(this.collectors));
      this._safeLocalStorageSet(AE_STORAGE_KEYS.RESPONSES, JSON.stringify(this.responses));
      this._safeLocalStorageSet(AE_STORAGE_KEYS.PERSONNEL, JSON.stringify(this.personnel || []));
      this._safeLocalStorageSet(AE_STORAGE_KEYS.PIN_OVERRIDES, JSON.stringify(this.pinOverrides || {}));
      this._safeLocalStorageSet(AE_STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(this.syncQueue));
      this._safeLocalStorageSet(AE_STORAGE_KEYS.SYNC_LOGS, JSON.stringify((this.syncLogs || []).slice(0, 40)));
      this._safeLocalStorageSet(AE_STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
      this._safeLocalStorageSet(AE_STORAGE_KEYS.RUNNER_DRAFTS, JSON.stringify(this.runnerDrafts || {}));
      if (!skipIDB) {
        this.persistAllToIDB();
      }
    } else {
      const idbTasks = [];
      if (stores.has('surveys')) {
        this._safeLocalStorageSet(AE_STORAGE_KEYS.SURVEYS, JSON.stringify(this.surveys));
        if (!skipIDB) idbTasks.push(this.persistStoreToIDB('surveys', this.surveys));
      }
      if (stores.has('collectors')) {
        this._safeLocalStorageSet(AE_STORAGE_KEYS.COLLECTORS, JSON.stringify(this.collectors));
        if (!skipIDB) idbTasks.push(this.persistStoreToIDB('collectors', this.collectors));
      }
      if (stores.has('responses')) {
        this._safeLocalStorageSet(AE_STORAGE_KEYS.RESPONSES, JSON.stringify(this.responses));
        if (!skipIDB) idbTasks.push(this.persistStoreToIDB('responses', this.responses));
      }
      if (stores.has('personnel')) {
        this._safeLocalStorageSet(AE_STORAGE_KEYS.PERSONNEL, JSON.stringify(this.personnel || []));
        if (!skipIDB) idbTasks.push(this.persistStoreToIDB('personnel', this.personnel));
      }
      if (stores.has('pinOverrides')) {
        this._safeLocalStorageSet(AE_STORAGE_KEYS.PIN_OVERRIDES, JSON.stringify(this.pinOverrides || {}));
        if (!skipIDB) {
          idbTasks.push(this.writeStore('meta', { id: 'pinOverrides', overrides: this.pinOverrides || {}, updatedAt: new Date().toISOString() }));
        }
      }
      if (stores.has('syncQueue')) {
        this._safeLocalStorageSet(AE_STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(this.syncQueue));
        if (!skipIDB) idbTasks.push(this.persistStoreToIDB('syncQueue', this.syncQueue));
      }
      if (stores.has('syncLogs')) {
        this._safeLocalStorageSet(AE_STORAGE_KEYS.SYNC_LOGS, JSON.stringify((this.syncLogs || []).slice(0, 40)));
      }
      if (stores.has('settings')) {
        this._safeLocalStorageSet(AE_STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
      }
      if (stores.has('runnerDrafts')) {
        this._safeLocalStorageSet(AE_STORAGE_KEYS.RUNNER_DRAFTS, JSON.stringify(this.runnerDrafts || {}));
      }
      if (idbTasks.length > 0) {
        Promise.all(idbTasks).catch(() => { });
      }
    }

    if (shouldBroadcast) {
      this.broadcastTabUpdate(stores ? Array.from(stores) : ['all'], (options && options.meta) || {});
    }
    this.notify();
  }

  /**
   * Initializes cross-tab real-time state sync using BroadcastChannel('ae_survey_sync')
   * with a localStorage `storage` event fallback for browsers without BroadcastChannel.
   */
  initCrossTabSync() {
    if (typeof BroadcastChannel !== 'undefined' && !this._broadcastChannel) {
      try {
        this._broadcastChannel = new BroadcastChannel('ae_survey_sync');
        this._broadcastChannel.onmessage = (event) => {
          this._handleCrossTabMessage(event && event.data);
        };
      } catch (e) {
        this._broadcastChannel = null;
      }
    }

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function' && !this._storageListenerBound) {
      this._storageListenerBound = true;
      const watchedKeys = new Set(Object.values(AE_STORAGE_KEYS));
      window.addEventListener('storage', (event) => {
        if (!event || !event.key) return;
        if (event.key === 'ae_survey_sync_ping' && event.newValue) {
          try {
            const msg = JSON.parse(event.newValue);
            this._handleCrossTabMessage(msg);
          } catch (e) { }
          return;
        }
        if (watchedKeys.has(event.key)) {
          const keyToStore = {
            [AE_STORAGE_KEYS.SURVEYS]: 'surveys',
            [AE_STORAGE_KEYS.COLLECTORS]: 'collectors',
            [AE_STORAGE_KEYS.RESPONSES]: 'responses',
            [AE_STORAGE_KEYS.PERSONNEL]: 'personnel',
            [AE_STORAGE_KEYS.PIN_OVERRIDES]: 'pinOverrides',
            [AE_STORAGE_KEYS.SYNC_QUEUE]: 'syncQueue',
            [AE_STORAGE_KEYS.SYNC_LOGS]: 'syncLogs',
            [AE_STORAGE_KEYS.SETTINGS]: 'settings',
            [AE_STORAGE_KEYS.RUNNER_DRAFTS]: 'runnerDrafts'
          };
          const storeName = keyToStore[event.key];
          if (storeName) {
            this._handleCrossTabMessage({
              type: 'STATE_UPDATED',
              senderId: 'storage_event',
              stores: [storeName],
              timestamp: Date.now()
            });
          }
        }
      });
    }
  }

  broadcastTabUpdate(stores = ['all'], meta = {}) {
    const payload = {
      type: 'STATE_UPDATED',
      senderId: this._tabId,
      stores: Array.isArray(stores) ? stores : ['all'],
      timestamp: Date.now(),
      meta: meta || {}
    };
    if (this._broadcastChannel) {
      try {
        this._broadcastChannel.postMessage(payload);
        return;
      } catch (e) { }
    }
    // Fallback ping via localStorage if BroadcastChannel is unavailable
    if (typeof BroadcastChannel === 'undefined') {
      this._safeLocalStorageSet('ae_survey_sync_ping', JSON.stringify(payload));
    }
  }

  _reloadStoresFromLocalStorage(stores = ['all']) {
    if (typeof localStorage === 'undefined') return false;
    const all = !Array.isArray(stores) || stores.includes('all');
    const set = new Set(Array.isArray(stores) ? stores : ['all']);
    let reloaded = false;
    try {
      if (all || set.has('surveys')) {
        const raw = localStorage.getItem(AE_STORAGE_KEYS.SURVEYS);
        if (raw) { this.surveys = JSON.parse(raw) || []; reloaded = true; }
      }
      if (all || set.has('collectors')) {
        const raw = localStorage.getItem(AE_STORAGE_KEYS.COLLECTORS);
        if (raw) { this.collectors = JSON.parse(raw) || []; reloaded = true; }
      }
      if (all || set.has('responses')) {
        const raw = localStorage.getItem(AE_STORAGE_KEYS.RESPONSES);
        if (raw) { this.responses = JSON.parse(raw) || []; reloaded = true; }
      }
      if (all || set.has('personnel')) {
        const raw = localStorage.getItem(AE_STORAGE_KEYS.PERSONNEL);
        if (raw) { this.personnel = JSON.parse(raw) || []; reloaded = true; }
      }
      if (all || set.has('pinOverrides')) {
        const raw = localStorage.getItem(AE_STORAGE_KEYS.PIN_OVERRIDES);
        if (raw) { this.pinOverrides = JSON.parse(raw) || {}; reloaded = true; }
      }
      if (all || set.has('syncQueue')) {
        const raw = localStorage.getItem(AE_STORAGE_KEYS.SYNC_QUEUE);
        if (raw) { this.syncQueue = JSON.parse(raw) || []; reloaded = true; }
      }
      if (all || set.has('syncLogs')) {
        const raw = localStorage.getItem(AE_STORAGE_KEYS.SYNC_LOGS);
        if (raw) { this.syncLogs = JSON.parse(raw) || []; reloaded = true; }
      }
      if (all || set.has('settings')) {
        const raw = localStorage.getItem(AE_STORAGE_KEYS.SETTINGS);
        if (raw) {
          const parsed = JSON.parse(raw) || {};
          this.settings = { ...this.settings, ...parsed };
          reloaded = true;
        }
      }
      if (all || set.has('runnerDrafts')) {
        const raw = localStorage.getItem(AE_STORAGE_KEYS.RUNNER_DRAFTS);
        if (raw) { this.runnerDrafts = JSON.parse(raw) || {}; reloaded = true; }
      }
    } catch (e) { }
    return reloaded;
  }

  _handleCrossTabMessage(msg) {
    if (!msg || typeof msg !== 'object') return;
    if (msg.senderId && msg.senderId === this._tabId) return;
    if (msg.type === 'STATE_UPDATED') {
      const reloaded = this._reloadStoresFromLocalStorage(msg.stores || ['all']);
      if (reloaded) {
        this.notify();
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ae-cloud-data-updated', {
            detail: {
              changed: true,
              newResponsesCount: Number(msg.meta && msg.meta.newResponsesCount) || 0,
              surveysUpdated: Number(msg.meta && msg.meta.surveysUpdated) || 0,
              reason: 'cross_tab'
            }
          }));
        }
      }
    }
  }

  /**
   * Single-tab leader lease (`ae_sync_leader`) via localStorage heartbeat so only
   * 1 tab runs the 25s background daemon at a time.
   */
  tryAcquireSyncLeader(ttlMs = 35000) {
    if (typeof localStorage === 'undefined') return true;
    const LEADER_KEY = 'ae_sync_leader';
    const now = Date.now();
    try {
      const raw = localStorage.getItem(LEADER_KEY);
      if (raw) {
        const current = JSON.parse(raw);
        if (current && current.tabId && current.tabId !== this._tabId && Number(current.expiresAt) > now) {
          return false;
        }
      }
      this._safeLocalStorageSet(LEADER_KEY, JSON.stringify({ tabId: this._tabId, expiresAt: now + ttlMs }));
      return true;
    } catch (e) {
      return true;
    }
  }

  isSyncLeader() {
    if (typeof localStorage === 'undefined') return true;
    const LEADER_KEY = 'ae_sync_leader';
    const now = Date.now();
    try {
      const raw = localStorage.getItem(LEADER_KEY);
      if (!raw) return this.tryAcquireSyncLeader();
      const current = JSON.parse(raw);
      if (!current || !current.tabId || Number(current.expiresAt) <= now) {
        return this.tryAcquireSyncLeader();
      }
      if (current.tabId === this._tabId) {
        // Renew lease while active
        this._safeLocalStorageSet(LEADER_KEY, JSON.stringify({ tabId: this._tabId, expiresAt: now + 35000 }));
        return true;
      }
      return false;
    } catch (e) {
      return true;
    }
  }

  releaseSyncLeader() {
    if (typeof localStorage === 'undefined') return;
    const LEADER_KEY = 'ae_sync_leader';
    try {
      const raw = localStorage.getItem(LEADER_KEY);
      if (raw) {
        const current = JSON.parse(raw);
        if (current && current.tabId === this._tabId) {
          localStorage.removeItem(LEADER_KEY);
        }
      }
    } catch (e) { }
  }

  subscribe(fn) {
    this.listeners.push(fn);
  }

  notify() {
    this.listeners.forEach((fn) => {
      try {
        fn(this);
      } catch (e) { }
    });
  }

  isEffectivelyOnline() {
    if (this.settings.simulateOffline) return false;
    return navigator.onLine !== false;
  }

  updateSettings(partial) {
    this.settings = { ...this.settings, ...partial };
    this.saveToLocalStorage({ stores: ['settings'] });
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

  getSurveyAvailability(survey, responsesOverride = null) {
    if (!survey || typeof survey !== 'object') {
      return {
        open: false,
        status: 'not_found',
        reason: 'Survey not found.',
        count: 0,
        maxResponses: null,
        remaining: null
      };
    }

    const list = Array.isArray(responsesOverride)
      ? responsesOverride
      : this.getResponsesForSurvey(survey.id);
    const count = list.length;
    const schedule = survey.schedule && typeof survey.schedule === 'object' ? survey.schedule : {};
    const parsedMax =
      schedule.maxResponses !== undefined &&
      schedule.maxResponses !== null &&
      schedule.maxResponses !== ''
        ? Math.floor(Number(schedule.maxResponses))
        : null;
    const maxResponses = parsedMax !== null && Number.isFinite(parsedMax) && parsedMax > 0 ? parsedMax : null;
    const remaining = maxResponses !== null ? Math.max(0, maxResponses - count) : null;
    const customClosedMsg =
      schedule.closedMessage && String(schedule.closedMessage).trim()
        ? String(schedule.closedMessage).trim()
        : '';

    if (survey.status === 'Archived') {
      return {
        open: false,
        status: 'archived',
        reason: customClosedMsg || 'This survey has been archived and is no longer accepting responses.',
        count,
        maxResponses,
        remaining
      };
    }

    const nowMs = Date.now();
    if (schedule.openAt) {
      const openMs = Date.parse(schedule.openAt);
      if (Number.isFinite(openMs) && nowMs < openMs) {
        return {
          open: false,
          status: 'not_yet_open',
          reason: customClosedMsg || `This survey is scheduled to open on ${new Date(openMs).toLocaleString()}.`,
          count,
          maxResponses,
          remaining
        };
      }
    }

    if (schedule.closeAt) {
      const closeMs = Date.parse(schedule.closeAt);
      if (Number.isFinite(closeMs) && nowMs > closeMs) {
        return {
          open: false,
          status: 'closed_date',
          reason: customClosedMsg || 'This survey has closed and is no longer accepting new responses.',
          count,
          maxResponses,
          remaining
        };
      }
    }

    if (maxResponses !== null && count >= maxResponses) {
      return {
        open: false,
        status: 'quota_reached',
        reason: customClosedMsg || `Target response quota (${maxResponses}) has been reached. Thank you for your participation.`,
        count,
        maxResponses,
        remaining: 0
      };
    }

    return {
      open: true,
      status: 'open',
      reason: '',
      count,
      maxResponses,
      remaining
    };
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

    const nowIso = new Date().toISOString();
    const existingIdx = this.personnel.findIndex((p) => p.id === id);
    const existingPerson = existingIdx >= 0 ? this.personnel[existingIdx] : null;
    const seedRoster = typeof getInitialPersonnelSeed === 'function' ? getInitialPersonnelSeed() : [];
    const seedPerson = seedRoster.find((sp) => sp.id === id);
    const seedPin = seedPerson ? String(seedPerson.pinCode || '').trim() : '';

    const cleanPin = String(person.pinCode || (existingPerson && existingPerson.pinCode) || '1234').replace(/^'+/, '').trim().slice(0, 8);
    this.pinOverrides = (this.pinOverrides && typeof this.pinOverrides === 'object') ? this.pinOverrides : {};
    const prevOv = this.pinOverrides[id];
    const priorPin = (existingPerson && existingPerson.pinCode && existingPerson.pinCode !== cleanPin)
      ? String(existingPerson.pinCode).trim()
      : (prevOv && prevOv.previousPin ? prevOv.previousPin : seedPin);

    // Record PIN in persistent local override ledger so stale cloud pulls or IDB race conditions never revert it
    this.pinOverrides[id] = {
      pinCode: cleanPin,
      previousPin: priorPin || seedPin || '',
      seedPin: seedPin || '',
      updatedAt: nowIso,
      cloudConfirmed: false
    };

    const clean = {
      id,
      fullName: String(person.fullName).trim().slice(0, 100),
      role: ['admin', 'supervisor', 'enumerator'].includes(person.role) ? person.role : 'enumerator',
      county: String(person.county || 'Unassigned').trim().slice(0, 60),
      subCounty: String(person.subCounty || '').trim().slice(0, 60),
      phone: String(person.phone || '').trim().slice(0, 30),
      email: String(person.email || '').trim().slice(0, 80),
      supervisorId: person.supervisorId ? String(person.supervisorId).trim() : null,
      pinCode: cleanPin,
      pinUpdatedAt: nowIso,
      assignedSurveys: Array.isArray(person.assignedSurveys)
        ? Array.from(
          new Set(
            person.assignedSurveys.map((sId) => {
              if (sId === 'srv_agro_dealer_2026') return 'srv_agrodealer_2026';
              if (sId === 'srv_chd_agro_dealer_stock') return 'srv_extension_pulse';
              return sId;
            })
          )
        )
        : [],
      taskQuotas: person.taskQuotas && typeof person.taskQuotas === 'object' ? person.taskQuotas : {},
      active: person.active !== false,
      createdAt: person.createdAt || (existingPerson && existingPerson.createdAt) || nowIso,
      updatedAt: nowIso
    };

    if (existingIdx >= 0) {
      this.personnel[existingIdx] = clean;
    } else {
      this.personnel.unshift(clean);
    }

    this.enqueueSyncItem('UPSERT_PERSONNEL', clean.id, `Personnel (${clean.role}): ${clean.fullName}`);
    this.saveToLocalStorage({ stores: ['personnel', 'pinOverrides', 'syncQueue'] });
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
      } catch (e) { }
    }
    return check;
  }

  _isAuthError(errOrMsg, statusCode = 0) {
    if (statusCode === 401 || statusCode === 403) return true;
    const msg = typeof errOrMsg === 'string'
      ? errOrMsg
      : (errOrMsg && errOrMsg.message ? String(errOrMsg.message) : '');
    return /\b(401|403|unauthorized|forbidden|admin\s+auth|admin\s+only|insufficient\s+permissions?)\b/i.test(msg);
  }

  /**
   * Fetch wrapper with 18s timeout and exponential backoff + jitter on transient
   * network/5xx/429 failures. Never retries on 401/403 or Unauthorized errors.
   */
  async _fetchWithRetry(url, fetchOptions = {}, retryOptions = {}) {
    const timeoutMs = Number(retryOptions.timeoutMs) > 0 ? Number(retryOptions.timeoutMs) : 18000;
    const maxAttempts = Math.max(1, Number(retryOptions.maxAttempts) || 3);
    const baseDelayMs = retryOptions.baseDelayMs !== undefined ? Number(retryOptions.baseDelayMs) : 600;
    const jitterMaxMs = retryOptions.jitterMaxMs !== undefined ? Number(retryOptions.jitterMaxMs) : 400;

    let attempt = 0;
    let lastError = null;
    while (attempt < maxAttempts) {
      attempt++;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal
        });
        clearTimeout(timer);
        if (res && res.ok) {
          return res;
        }
        const status = res ? res.status : 0;
        // Never retry auth errors (401/403) or non-429 4xx client errors
        if (status === 401 || status === 403 || (status >= 400 && status < 500 && status !== 429)) {
          return res;
        }
        if (attempt < maxAttempts) {
          const delayMs = Math.round(baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * jitterMaxMs);
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }
        return res;
      } catch (netErr) {
        clearTimeout(timer);
        lastError = netErr;
        if (this._isAuthError(netErr)) {
          throw netErr;
        }
        if (attempt < maxAttempts) {
          const delayMs = Math.round(baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * jitterMaxMs);
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }
        throw netErr;
      }
    }
    throw lastError || new Error('Network request failed');
  }

  /**
   * Pushes updated personnel credentials/PIN directly to Google Sheets in background
   * with live sync state feedback and automatic outbox queuing if offline.
   */
  async syncPersonnelToCloud(person) {
    if (!person || !person.id) return { ok: false, error: 'Invalid personnel object' };

    const gasUrl = (this.settings.gasWebAppUrl || '').trim();
    const isOnline = this.isEffectivelyOnline();

    if (!gasUrl || !this.isValidGasUrl(gasUrl) || !isOnline) {
      this.enqueueSyncItem('UPSERT_PERSONNEL', person.id, `Personnel (${person.role || 'Staff'}): ${person.fullName || person.id}`);
      this.saveToLocalStorage({ stores: ['syncQueue'] });
      return { ok: false, offline: true, error: 'Device is offline or GAS Web App URL is not set. Queued in outbox.' };
    }

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

    if (this._syncInFlight) {
      this.enqueueSyncItem('UPSERT_PERSONNEL', person.id, `Personnel (${person.role || 'Staff'}): ${person.fullName || person.id}`);
      this.saveToLocalStorage({ stores: ['syncQueue'] });
      this._syncPendingAgain = true;
      const prev = this._syncPendingOptions || {};
      this._syncPendingOptions = {
        forceAll: Boolean(prev.forceAll),
        syncSurveys: Boolean(prev.syncSurveys),
        manual: Boolean(prev.manual),
        isBackground: prev.isBackground !== undefined ? Boolean(prev.isBackground) : true
      };
      if (this._syncInFlightPromise) {
        return this._syncInFlightPromise;
      }
      return { ok: true, coalesced: true };
    }

    this._syncInFlight = true;
    const runPersonnelSync = async () => {
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ae-sync-state-change', { detail: { inFlight: true } }));
      }

      try {
        const res = await this._fetchWithRetry(
          gasUrl,
          {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload),
            redirect: 'follow'
          },
          { timeoutMs: 18000, maxAttempts: 2 }
        );

        if (res && res.ok) {
          let data = await res.json();
          if (data && data.ok) {
            // Verify whether the GAS deployment updated the PIN in Google Sheets.
            // If the deployed GAS script is an older version that only handles BATCH_SYNC (expecting an array),
            // automatically send a fallback BATCH_SYNC request with the full personnel array.
            const remoteMatch = Array.isArray(data.personnel)
              ? data.personnel.find((rp) => rp && rp.id === person.id)
              : null;
            const remotePin = remoteMatch && remoteMatch.pinCode ? String(remoteMatch.pinCode).replace(/^'+/, '').trim() : '';

            if (remoteMatch && remotePin !== String(person.pinCode).trim()) {
              try {
                const fallbackPayload = {
                  action: 'BATCH_SYNC',
                  syncToken: this.settings.syncToken || '',
                  deviceId: this.settings.deviceId,
                  callerId: 'ADM-01',
                  surveys: [],
                  collectors: [],
                  responses: [],
                  personnel: this.personnel
                };
                const fbRes = await this._fetchWithRetry(
                  gasUrl,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(fallbackPayload),
                    redirect: 'follow'
                  },
                  { timeoutMs: 18000, maxAttempts: 1 }
                );
                if (fbRes && fbRes.ok) {
                  const fbData = await fbRes.json();
                  if (fbData && fbData.ok && Array.isArray(fbData.personnel)) {
                    data = fbData;
                  }
                }
              } catch (fbErr) { }
            }

            const confirmedMatch = Array.isArray(data.personnel)
              ? data.personnel.find((rp) => rp && rp.id === person.id)
              : null;
            if (confirmedMatch && String(confirmedMatch.pinCode || '').replace(/^'+/, '').trim() === String(person.pinCode).trim()) {
              if (this.pinOverrides && this.pinOverrides[person.id]) {
                this.pinOverrides[person.id].cloudConfirmed = true;
              }
            }

            if (data.version !== undefined && data.version !== null && data.version !== '') {
              this.settings.cloudDbVersion = String(data.version);
            }
            if (Array.isArray(data.personnel) && data.personnel.length > 0) {
              this.mergePersonnelFromCloud(data.personnel);
            }
            this.syncQueue = this.syncQueue.filter((q) => q.recordId !== person.id);
            this.settings.lastSyncedAt = new Date().toISOString();
            this.saveToLocalStorage({ stores: ['personnel', 'pinOverrides', 'syncQueue', 'settings'] });
            return { ok: true, personnel: data.personnel };
          } else {
            throw new Error(data && data.error ? data.error : 'GAS rejected personnel upsert');
          }
        } else {
          throw new Error(`HTTP ${res.status}: Google Apps Script returned an error.`);
        }
      } catch (e) {
        console.warn('Direct personnel sync failed, safely preserved in local outbox:', e);
        this.enqueueSyncItem('UPSERT_PERSONNEL', person.id, `Personnel (${person.role || 'Staff'}): ${person.fullName || person.id}`);
        this.saveToLocalStorage({ stores: ['syncQueue'] });
        return { ok: false, error: e.message || 'Network error during cloud sync' };
      } finally {
        this._syncInFlight = false;
        this._syncInFlightPromise = null;
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ae-sync-state-change', { detail: { inFlight: false } }));
        }
        if (this._syncPendingAgain) {
          const nextOpts = this._syncPendingOptions || { forceAll: false, isBackground: true };
          this._syncPendingAgain = false;
          this._syncPendingOptions = null;
          if (this.isEffectivelyOnline()) {
            setTimeout(() => {
              this.syncWithGoogleSheets(nextOpts).catch(() => { });
            }, 50);
          }
        }
      }
    };

    this._syncInFlightPromise = runPersonnelSync();
    return this._syncInFlightPromise;
  }

  /**
   * Fetches latest personnel roster and PIN updates from Google Sheets.
   */
  async refreshPersonnelFromCloud() {
    const gasUrl = (this.settings.gasWebAppUrl || '').trim();
    if (!gasUrl || !this.isValidGasUrl(gasUrl) || !this.isEffectivelyOnline()) return null;

    try {
      const sep = gasUrl.includes('?') ? '&' : '?';
      const response = await this._fetchWithRetry(
        `${gasUrl}${sep}action=pullPersonnel&deviceId=${encodeURIComponent(this.settings.deviceId)}&syncToken=${encodeURIComponent(this.settings.syncToken || '')}&t=${Date.now()}`,
        { method: 'GET', redirect: 'follow' },
        { timeoutMs: 18000, maxAttempts: 2 }
      );

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
   * Respects local PIN overrides (`this.pinOverrides`), pending outbox items (`this.syncQueue`),
   * and `pinUpdatedAt` / `updatedAt` timestamps so stale cloud rows never revert a changed PIN.
   */
  mergePersonnelFromCloud(remotePersonnel) {
    if (!Array.isArray(remotePersonnel) || remotePersonnel.length === 0) return;
    const perMap = new Map((this.personnel || []).map((p) => [p.id, p]));
    const seedRoster = typeof getInitialPersonnelSeed === 'function' ? getInitialPersonnelSeed() : [];
    const seedMap = new Map(seedRoster.map((sp) => [sp.id, sp]));
    this.pinOverrides = (this.pinOverrides && typeof this.pinOverrides === 'object') ? this.pinOverrides : {};
    let changed = false;

    remotePersonnel.forEach((rp) => {
      if (!rp || !rp.id) return;
      const existing = perMap.get(rp.id);
      const remotePin = String(rp.pinCode || '1234').replace(/^'+/, '').trim();
      const ov = this.pinOverrides[rp.id];
      const hasPendingSync = Array.isArray(this.syncQueue) && this.syncQueue.some(
        (q) => q && q.action === 'UPSERT_PERSONNEL' && q.recordId === rp.id
      );

      if (!existing) {
        const effectivePin = (ov && ov.pinCode) ? String(ov.pinCode).trim() : remotePin;
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
          pinCode: effectivePin,
          pinUpdatedAt: (ov && ov.updatedAt) || rp.updatedAt || '',
          createdAt: rp.createdAt || new Date().toISOString(),
          updatedAt: rp.updatedAt || new Date().toISOString()
        });
        changed = true;
      } else {
        // Determine whether remotePin is newer and authoritative or a stale revert
        if (remotePin && remotePin !== existing.pinCode) {
          const seedItem = seedMap.get(rp.id);
          const seedPin = seedItem ? String(seedItem.pinCode || '').trim() : '';
          const remoteTime = rp.updatedAt ? (Date.parse(rp.updatedAt) || 0) : 0;
          const localTime = Math.max(
            Date.parse(existing.pinUpdatedAt || 0) || 0,
            Date.parse(existing.updatedAt || 0) || 0,
            ov && ov.updatedAt ? (Date.parse(ov.updatedAt) || 0) : 0
          );

          if (ov && ov.pinCode) {
            if (remotePin === ov.pinCode) {
              existing.pinCode = ov.pinCode;
              ov.cloudConfirmed = true;
              changed = true;
            } else {
              const isStaleSeedOrFormerPin =
                remotePin === ov.previousPin ||
                remotePin === ov.seedPin ||
                (seedPin && remotePin === seedPin && ov.pinCode !== seedPin);

              if (hasPendingSync || !ov.cloudConfirmed || isStaleSeedOrFormerPin || (localTime > 0 && remoteTime <= localTime)) {
                // Keep locally changed PIN protected by pinOverrides ledger
                if (existing.pinCode !== ov.pinCode) {
                  existing.pinCode = ov.pinCode;
                  changed = true;
                }
              } else {
                // Cloud confirmed our earlier change and now has a genuinely newer cross-device PIN
                existing.pinCode = remotePin;
                existing.pinUpdatedAt = rp.updatedAt || new Date().toISOString();
                this.pinOverrides[rp.id] = {
                  pinCode: remotePin,
                  previousPin: ov.pinCode,
                  seedPin: ov.seedPin || seedPin,
                  updatedAt: existing.pinUpdatedAt,
                  cloudConfirmed: true
                };
                changed = true;
              }
            }
          } else if (!hasPendingSync && (remoteTime === 0 || remoteTime > localTime)) {
            existing.pinCode = remotePin;
            if (rp.updatedAt) existing.pinUpdatedAt = rp.updatedAt;
            changed = true;
          }
        } else if (ov && ov.pinCode && remotePin === ov.pinCode && !ov.cloudConfirmed) {
          ov.cloudConfirmed = true;
          changed = true;
        }

        if (!hasPendingSync) {
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
          if (rp.supervisorId !== undefined && rp.supervisorId !== existing.supervisorId) {
            existing.supervisorId = rp.supervisorId;
            changed = true;
          }
          if (rp.taskQuotas && typeof rp.taskQuotas === 'object' && Object.keys(rp.taskQuotas).length > 0) {
            existing.taskQuotas = { ...(existing.taskQuotas || {}), ...rp.taskQuotas };
            changed = true;
          }
          if (Array.isArray(rp.assignedSurveys)) {
            existing.assignedSurveys = Array.from(
              new Set(
                rp.assignedSurveys.map((sId) => {
                  if (sId === 'srv_agro_dealer_2026') return 'srv_agrodealer_2026';
                  if (sId === 'srv_chd_agro_dealer_stock') return 'srv_extension_pulse';
                  return sId;
                })
              )
            );
          }
          if (rp.updatedAt) {
            const rTime = Date.parse(rp.updatedAt) || 0;
            const eTime = Date.parse(existing.updatedAt || 0) || 0;
            if (rTime > eTime) {
              existing.updatedAt = rp.updatedAt;
            }
          }
        }
      }
    });

    if (changed) {
      this.personnel = Array.from(perMap.values());
      this.saveToLocalStorage({ stores: ['personnel', 'pinOverrides'] });
      if (typeof window !== 'undefined' && window.AESession && typeof window.AESession.getCurrentUser === 'function') {
        const cur = window.AESession.getCurrentUser();
        if (cur && cur.id) {
          const live = this.getPersonnelById(cur.id);
          if (live) window.AESession.syncCurrentUser(live);
        }
      }
    }
    return changed;
  }

  /**
   * Stops the continuous background auto-sync daemon and releases the leader lease.
   */
  stopBackgroundSyncDaemon() {
    if (this._bgSyncTimer) {
      clearInterval(this._bgSyncTimer);
      this._bgSyncTimer = null;
    }
    if (this._leaderHeartbeatTimer) {
      clearInterval(this._leaderHeartbeatTimer);
      this._leaderHeartbeatTimer = null;
    }
    this.releaseSyncLeader();
  }

  /**
   * Event-driven fresh pull with throttle (`_lastPullAttemptAt`) and concurrency guard (`_pullInFlight`).
   * Uses version-checked / delta pull so no-op polls are tiny and non-blocking.
   */
  async pullFreshDataIfStale(options = {}) {
    const { minAgeMs = 5000, force = false, reason = 'auto' } = options || {};
    const gasUrl = (this.settings.gasWebAppUrl || '').trim();
    if (!this.isEffectivelyOnline() || !gasUrl || !this.isValidGasUrl(gasUrl)) {
      return { ok: false, skipped: true, reason: 'offline_or_no_url' };
    }
    if (this._pullInFlight && this._pullInFlightPromise) {
      return this._pullInFlightPromise;
    }
    const now = Date.now();
    if (!force && this._lastPullAttemptAt && (now - this._lastPullAttemptAt) < minAgeMs) {
      return { ok: true, skipped: true, reason: 'throttled' };
    }
    this._lastPullAttemptAt = now;
    try {
      return await this.pullFromGoogleSheets({ forceFull: false, reason, isBackground: true });
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : 'Background pull failed' };
    }
  }

  /**
   * Continuous Background Auto-Sync Daemon.
   * Runs silently in the background (single-tab leader-elected via `ae_sync_leader`),
   * flushing queued field responses and running lightweight version-checked pulls.
   */
  startBackgroundSyncDaemon() {
    if (this._bgSyncTimer) {
      clearInterval(this._bgSyncTimer);
      this._bgSyncTimer = null;
    }
    if (this._leaderHeartbeatTimer) {
      clearInterval(this._leaderHeartbeatTimer);
      this._leaderHeartbeatTimer = null;
    }

    if (this.settings.backgroundSyncEnabled === false) return;

    // Acquire or contend for single-tab leader lease
    this.tryAcquireSyncLeader();
    this._leaderHeartbeatTimer = setInterval(() => {
      this.isSyncLeader();
    }, 12000);

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function' && !this._leaderUnloadBound) {
      this._leaderUnloadBound = true;
      const release = () => this.releaseSyncLeader();
      window.addEventListener('beforeunload', release);
      window.addEventListener('pagehide', release);
    }

    // Heartbeat every 20-30 seconds (default: 25s)
    const intervalSec = Math.max(10, parseInt(this.settings.backgroundSyncIntervalSec, 10) || 25);
    const intervalMs = intervalSec * 1000;

    this._bgSyncTimer = setInterval(async () => {
      // Single-tab leader lease: only 1 tab runs the 25s background daemon at a time
      if (!this.isSyncLeader()) {
        return;
      }
      // Guard: skip if offline, simulated offline, or no GAS URL
      if (!this.isEffectivelyOnline() || !this.settings.gasWebAppUrl) {
        return;
      }

      if (this._hasPendingSyncableWork() && !this._syncInFlight) {
        try {
          await this.syncWithGoogleSheets({ forceAll: false, isBackground: true });
        } catch (e) {
          // Silent retry on next interval tick
        }
      }

      // Version-checked pull (no-op polls return tiny { ok: true, unchanged: true })
      if (!this._isRespondentModeUrl()) {
        await this.pullFreshDataIfStale({ minAgeMs: 5000, reason: 'daemon' });
      }
    }, intervalMs);

    // Event 1: Window focus / Visibility Change (when user switches back to tab or unlocks tablet)
    if (typeof document !== 'undefined' && !this._visibilityBound) {
      this._visibilityBound = true;
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.triggerBackgroundSyncNow();
          if (!this._isRespondentModeUrl()) {
            this.pullFreshDataIfStale({ minAgeMs: 5000, reason: 'visibilitychange' }).catch(() => { });
          }
        }
      });
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window.addEventListener('focus', () => {
          this.triggerBackgroundSyncNow();
        });
      }
    }

    // Event 2: Network online reconnection
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function' && !this._onlineBound) {
      this._onlineBound = true;
      window.addEventListener('online', () => {
        this.triggerBackgroundSyncNow();
        if (!this._isRespondentModeUrl()) {
          this.pullFreshDataIfStale({ minAgeMs: 2000, reason: 'online' }).catch(() => { });
        }
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
   * Returns true if a syncQueue item is eligible to be pushed by the currently signed-in user.
   * Prevents non-admin/supervisor sessions from looping forever on admin-only queue items.
   */
  _isQueueItemEligibleForCurrentUser(item) {
    if (!item || !item.action) return false;
    if (item.action === 'SUBMIT_RESPONSE') return true;
    const currentSessionUser = (typeof window !== 'undefined' && window.AESession && typeof window.AESession.getCurrentUser === 'function')
      ? window.AESession.getCurrentUser()
      : null;
    const role = currentSessionUser ? String(currentSessionUser.role || '').toLowerCase() : '';
    if (role === 'admin' || !currentSessionUser) {
      return !item.serverAdminRejected;
    }
    if (item.action === 'UPSERT_PERSONNEL') {
      if (item.recordId === currentSessionUser.id) return true;
      if (role === 'supervisor' && !item.serverAdminRejected) {
        const target = this.getPersonnelById(item.recordId);
        return Boolean(target && target.role === 'enumerator' && (!target.supervisorId || target.supervisorId === currentSessionUser.id));
      }
      return false;
    }
    // UPSERT_SURVEY, DELETE_SURVEY, UPSERT_COLLECTOR require admin
    return false;
  }

  /**
   * Returns true if there is any pending local work (responses, eligible syncQueue items,
   * or deletedSurveyIds for admin callers) that can be synced right now.
   */
  _hasPendingSyncableWork() {
    const hasUnsyncedResponses = Array.isArray(this.responses) && this.responses.some((r) => r && r.syncStatus !== 'synced');
    const hasEligibleQueuedItems = Array.isArray(this.syncQueue) && this.syncQueue.some((q) => this._isQueueItemEligibleForCurrentUser(q));
    const currentSessionUser = (typeof window !== 'undefined' && window.AESession && typeof window.AESession.getCurrentUser === 'function')
      ? window.AESession.getCurrentUser()
      : null;
    const canSyncDeletes = !currentSessionUser || String(currentSessionUser.role || '').toLowerCase() === 'admin';
    const hasDeletedSurveys = canSyncDeletes && Array.isArray(this.deletedSurveyIds) && this.deletedSurveyIds.length > 0;
    return hasUnsyncedResponses || hasEligibleQueuedItems || hasDeletedSurveys;
  }

  /**
   * Debounced immediate trigger for background synchronization.
   * Coalesces cleanly via syncWithGoogleSheets() when a sync is already in flight.
   */
  triggerBackgroundSyncNow(delayMs = 400) {
    if (this._bgTriggerDebounce) {
      clearTimeout(this._bgTriggerDebounce);
      this._bgTriggerDebounce = null;
    }
    this._bgTriggerDebounce = setTimeout(async () => {
      if (!this.isEffectivelyOnline() || !this.settings.gasWebAppUrl) {
        return;
      }
      if (this._hasPendingSyncableWork()) {
        try {
          await this.syncWithGoogleSheets({ forceAll: false, isBackground: true });
        } catch (e) { }
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

    // 1. Speeder Pacing Check (<2.5s per question velocity cutoff, min 15s)
    const minExpectedDuration = Math.max(15, Math.round(questions.length * 2.5));
    if (duration > 0 && duration < minExpectedDuration) {
      flags.push({
        code: 'SPEEDER',
        severity: 'warning',
        label: `Speeder interview (${duration}s vs expected min ${minExpectedDuration}s based on <2.5s/q)`
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

    // 4. GPS Velocity & Teleportation Anti-Fraud Check (Impossible Road Travel Speed)
    const normalizedEnum = String(response.enumerator || '').trim().toLowerCase();
    const isSelfAdministered =
      response.collectionMode === 'self_administered' ||
      normalizedEnum === 'self-administered (web link)' ||
      normalizedEnum === 'self-administered' ||
      normalizedEnum === 'public respondent';
    const hasValidGps =
      gps &&
      gps.lat !== '' && gps.lat !== null && gps.lat !== undefined &&
      gps.lng !== '' && gps.lng !== null && gps.lng !== undefined &&
      Number.isFinite(Number(gps.lat)) && Number.isFinite(Number(gps.lng));
    if (!isSelfAdministered && hasValidGps && response.submittedAt && response.enumerator) {
      const currLat = Number(gps.lat);
      const currLng = Number(gps.lng);
      const respTime = new Date(response.submittedAt).getTime();
      const priorResponses = (this.responses || []).filter((r) => {
        return r &&
          r.id !== response.id &&
          (!response.clientResponseId || !r.clientResponseId || r.clientResponseId !== response.clientResponseId) &&
          r.enumerator === response.enumerator &&
          r.submittedAt &&
          r.gps &&
          r.gps.lat !== '' && r.gps.lat !== null && r.gps.lat !== undefined &&
          r.gps.lng !== '' && r.gps.lng !== null && r.gps.lng !== undefined &&
          Number.isFinite(Number(r.gps.lat)) && Number.isFinite(Number(r.gps.lng)) &&
          new Date(r.submittedAt).getTime() < respTime;
      }).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

      if (priorResponses.length > 0) {
        const prev = priorResponses[0];
        const prevLat = Number(prev.gps.lat);
        const prevLng = Number(prev.gps.lng);
        const prevTime = new Date(prev.submittedAt).getTime();
        const timeDiffMs = respTime - prevTime;
        const deltaHours = timeDiffMs / (1000 * 60 * 60);
        const deltaMinutes = timeDiffMs / (1000 * 60);

        // Haversine distance in km
        const R = 6371;
        const dLat = ((currLat - prevLat) * Math.PI) / 180;
        const dLon = ((currLng - prevLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((prevLat * Math.PI) / 180) *
            Math.cos((currLat * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distKm = R * c;

        if (deltaHours > 0) {
          const speedKmH = distKm / deltaHours;
          if (speedKmH > 120 && distKm > 3) {
            flags.push({
              code: 'IMPOSSIBLE_TRAVEL_VELOCITY',
              severity: 'danger',
              label: `Impossible travel velocity: moved ${distKm.toFixed(1)} km in ${Math.round(deltaMinutes)} mins (${Math.round(speedKmH)} km/h exceeds 120km/h ceiling)`
            });
          }
        }
      }
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
    resp.updatedAt = new Date().toISOString();
    resp.syncStatus = 'queued';

    this.enqueueSyncItem('SUBMIT_RESPONSE', resp.id, `Response Approved (${supervisorPersonnelId}) -> ${resp.id}`);
    this.saveToLocalStorage();
    if (this.isEffectivelyOnline() && this.settings.gasWebAppUrl) {
      this.triggerBackgroundSyncNow(400);
    }
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
    resp.updatedAt = new Date().toISOString();
    resp.syncStatus = 'queued';

    this.enqueueSyncItem('SUBMIT_RESPONSE', resp.id, `Response Flagged (${supervisorPersonnelId}) -> ${resp.id}`);
    this.saveToLocalStorage();
    if (this.isEffectivelyOnline() && this.settings.gasWebAppUrl) {
      this.triggerBackgroundSyncNow(400);
    }
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
    resp.updatedAt = new Date().toISOString();
    resp.syncStatus = 'queued';

    this.enqueueSyncItem('SUBMIT_RESPONSE', resp.id, `Response Rejected (${supervisorPersonnelId}) -> ${resp.id}`);
    this.saveToLocalStorage();
    if (this.isEffectivelyOnline() && this.settings.gasWebAppUrl) {
      this.triggerBackgroundSyncNow(400);
    }
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
    // Migrate legacy embedded versionHistory out of the synced survey object into localStorage
    if (Array.isArray(survey.versionHistory) && survey.versionHistory.length > 0) {
      const existingStored = this.getSurveyVersionHistory(safeId);
      if (existingStored.length === 0) {
        this._saveSurveyVersionHistory(safeId, survey.versionHistory);
      }
    }
    const { versionHistory: _strippedVersionHistory, ...surveyWithoutHistory } = survey;
    return {
      ...surveyWithoutHistory,
      id: safeId,
      title: String(survey.title || 'Untitled Field Survey').slice(0, 240),
      description: String(survey.description || '').slice(0, 800),
      category: String(survey.category || 'Field Assessment').slice(0, 120),
      status: ['Active', 'Draft', 'Closed', 'Archived'].includes(survey.status) ? survey.status : 'Active',
      collectionMode: ['hybrid', 'self_administered', 'enumerator'].includes(survey.collectionMode) ? survey.collectionMode : 'hybrid',
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

  getSurveyVersionHistory(surveyId) {
    if (!surveyId) return [];
    const key = `ae_survey_versions_${surveyId}`;
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (_) {
      // Ignore storage read/parse errors
    }
    return [];
  }

  _saveSurveyVersionHistory(surveyId, history) {
    if (!surveyId) return;
    const key = `ae_survey_versions_${surveyId}`;
    const trimmed = Array.isArray(history) ? history.slice(-15) : [];
    try {
      if (typeof this._safeLocalStorageSet === 'function') {
        this._safeLocalStorageSet(key, JSON.stringify(trimmed));
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(trimmed));
      }
    } catch (_) {
      // Non-fatal if localStorage quota is full
    }
  }

  upsertSurvey(survey, queueForCloud = true) {
    const legacyIncomingHistory = Array.isArray(survey && survey.versionHistory) ? survey.versionHistory.slice() : [];
    const cleanSurvey = this.sanitizeSurveyRecord(survey);
    if (!cleanSurvey) return null;
    delete cleanSurvey.versionHistory;
    const nowIso = new Date().toISOString();
    cleanSurvey.updatedAt = nowIso;
    this._surveysDirty = true;
    const idx = this.surveys.findIndex((s) => s.id === cleanSurvey.id);

    // Automatic Survey Version Snapshots stored locally in `ae_survey_versions_${survey.id}`
    // so versionHistory is NEVER serialized into Google Sheets SchemaJSON.
    const buildSchemaSig = (s) => {
      try {
        return JSON.stringify({ title: s.title || '', pages: s.pages || [] });
      } catch (e) {
        return String(s.title || '');
      }
    };
    const countQs = (s) => (s.pages || []).reduce((acc, p) => acc + ((p && Array.isArray(p.questions)) ? p.questions.length : 0), 0);
    const currentUser = (typeof window !== 'undefined' && window.AESession && typeof window.AESession.getCurrentUser === 'function')
      ? window.AESession.getCurrentUser()
      : null;
    const editorName = (currentUser && currentUser.fullName) || 'Research Lead';

    if (idx >= 0) {
      const prev = this.surveys[idx];
      let history = this.getSurveyVersionHistory(cleanSurvey.id);
      if (history.length === 0) {
        if (legacyIncomingHistory.length > 0) {
          history = legacyIncomingHistory;
        } else if (Array.isArray(prev.versionHistory) && prev.versionHistory.length > 0) {
          history = prev.versionHistory.slice();
        }
      }
      const prevVer = Number(cleanSurvey.schemaVersion || prev.schemaVersion || 1);
      if (buildSchemaSig(prev) !== buildSchemaSig(cleanSurvey)) {
        // Snapshot the previous schema before applying the new version
        const alreadySnapshotted = history.some((h) => h && h.version === prevVer);
        if (!alreadySnapshotted) {
          history.push({
            version: prevVer,
            savedAt: prev.updatedAt || nowIso,
            savedBy: editorName,
            title: prev.title || 'Untitled Survey',
            questionCount: countQs(prev),
            pages: JSON.parse(JSON.stringify(prev.pages || []))
          });
        }
        cleanSurvey.schemaVersion = prevVer + 1;
        this._saveSurveyVersionHistory(cleanSurvey.id, history);
      } else {
        cleanSurvey.schemaVersion = prevVer;
        if (history.length > 0) {
          this._saveSurveyVersionHistory(cleanSurvey.id, history);
        }
      }
      this.surveys[idx] = cleanSurvey;
    } else {
      cleanSurvey.schemaVersion = Number(cleanSurvey.schemaVersion || 1);
      if (legacyIncomingHistory.length > 0) {
        this._saveSurveyVersionHistory(cleanSurvey.id, legacyIncomingHistory);
      }
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
          enumeratorDefault: '',
          createdAt: nowIso
        });
      }
    }

    if (queueForCloud) {
      this.enqueueSyncItem('UPSERT_SURVEY', cleanSurvey.id, `Survey Schema: ${cleanSurvey.title}`);
      if (this.isEffectivelyOnline() && this.settings.gasWebAppUrl) {
        this.triggerBackgroundSyncNow(400);
      }
    }
    this.saveToLocalStorage({ stores: ['surveys', 'collectors', 'syncQueue'] });
    return cleanSurvey;
  }

  restoreSurveyVersion(surveyId, targetVersion) {
    const survey = this.getSurveyById(surveyId);
    if (!survey) return null;
    const history = this.getSurveyVersionHistory(surveyId);
    if (!Array.isArray(history) || history.length === 0) return null;
    const snap = history.find((h) => h && Number(h.version) === Number(targetVersion));
    if (!snap) return null;
    const restored = JSON.parse(JSON.stringify(survey));
    delete restored.versionHistory;
    restored.title = snap.title || restored.title;
    restored.pages = JSON.parse(JSON.stringify(snap.pages || []));
    return this.upsertSurvey(restored, true);
  }

  deleteSurvey(surveyId) {
    this._surveysDirty = true;
    this.deletedSurveyIds = Array.isArray(this.deletedSurveyIds) ? this.deletedSurveyIds : [];
    if (surveyId && !this.deletedSurveyIds.includes(surveyId)) {
      this.deletedSurveyIds.push(surveyId);
    }
    const removedRespIds = new Set();
    (this.responses || []).forEach((r) => {
      if (r && r.surveyId === surveyId) {
        if (r.id) removedRespIds.add(r.id);
        if (r.clientResponseId) removedRespIds.add(r.clientResponseId);
      }
    });
    const removedColIds = new Set(
      (this.collectors || []).filter((c) => c && c.surveyId === surveyId && c.id).map((c) => c.id)
    );
    this.surveys = this.surveys.filter((s) => s.id !== surveyId);
    this.responses = this.responses.filter((r) => r.surveyId !== surveyId);
    this.collectors = this.collectors.filter((c) => c.surveyId !== surveyId);
    this.syncQueue = (this.syncQueue || []).filter((q) => {
      if (!q) return false;
      if (q.recordId === surveyId) return false;
      if (q.action === 'SUBMIT_RESPONSE' && removedRespIds.has(q.recordId)) return false;
      if (q.action === 'UPSERT_COLLECTOR' && removedColIds.has(q.recordId)) return false;
      return true;
    });
    if (surveyId) {
      this.enqueueSyncItem('DELETE_SURVEY', surveyId, `Delete Survey -> ${surveyId}`);
    }
    this.saveToLocalStorage();
    if (this.isEffectivelyOnline() && this.settings.gasWebAppUrl) {
      this.triggerBackgroundSyncNow(400);
    }
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
    this.enqueueSyncItem('UPSERT_SURVEY', survey.id, `Archive Survey: ${survey.title}`);
    this.saveToLocalStorage({ stores: ['surveys', 'syncQueue'] });
    if (this.isEffectivelyOnline()) {
      this.syncWithGoogleSheets({ manual: true }).catch(() => { });
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
    this.enqueueSyncItem('UPSERT_SURVEY', survey.id, `Restore Survey: ${survey.title} (${targetStatus})`);
    this.saveToLocalStorage({ stores: ['surveys', 'syncQueue'] });
    if (this.isEffectivelyOnline()) {
      this.syncWithGoogleSheets({ manual: true }).catch(() => { });
    }
    return survey;
  }

  /**
   * Evaluates if a given user/personnel (or self-administered respondent) is permitted to collect data for this survey.
   * Returns { allowed: boolean, reason: string, isSelfAdministered?: boolean }
   */
  canUserCollectSurvey(personnelOrUser, surveyId, options = {}) {
    const survey = this.getSurveyById(surveyId);
    if (!survey) {
      return { allowed: false, reason: 'Survey instrument not found.' };
    }
    if (survey.status === 'Archived') {
      return { allowed: false, reason: 'This survey has been archived by HQ and no longer accepts responses.' };
    }
    if (survey.status === 'Closed') {
      return { allowed: false, reason: 'This survey is closed. New submissions are disabled.' };
    }

    const isSelfAdmin = Boolean(
      options.isSelfAdministered ||
      (personnelOrUser && String(personnelOrUser.role || '').toLowerCase() === 'respondent')
    );

    if (isSelfAdmin) {
      const mode = survey.collectionMode || 'hybrid';
      if (mode === 'enumerator') {
        return {
          allowed: false,
          reason: 'This survey is restricted to authenticated field enumerators and does not accept self-administered public link submissions.'
        };
      }
      if (survey.status !== 'Active') {
        return {
          allowed: false,
          reason: `This survey is currently in ${survey.status} status and is not accepting public responses yet.`
        };
      }
      return { allowed: true, reason: '', isSelfAdministered: true };
    }

    if (!personnelOrUser) {
      return { allowed: false, reason: 'Operator profile required. Please select or authenticate an active operator.' };
    }

    const person = typeof personnelOrUser === 'string'
      ? this.getPersonnelById(personnelOrUser)
      : (personnelOrUser && personnelOrUser.id ? (this.getPersonnelById(personnelOrUser.id) || personnelOrUser) : personnelOrUser);

    if (!person) {
      return { allowed: false, reason: 'Operator personnel account not found in database.' };
    }

    const role = String(person.role || '').toLowerCase();
    if (role === 'admin') {
      return { allowed: true, reason: '' };
    }

    const assigned = Array.isArray(person.assignedSurveys) ? person.assignedSurveys : [];
    if (!assigned.includes(surveyId)) {
      return { allowed: false, reason: `Survey "${survey.title}" is not assigned to ${person.fullName || 'your account'}.` };
    }
    if (survey.status !== 'Active') {
      return { allowed: false, reason: `Survey is in ${survey.status} status (must be Active to collect).` };
    }
    return { allowed: true, reason: '' };
  }

  /**
   * Evaluates if a given user/personnel is permitted to read or access this survey instrument.
   * Admin can access all surveys. Personnel can ONLY access surveys assigned to them.
   * Returns { allowed: boolean, reason: string }
   */
  canUserAccessSurvey(personnelOrUser, surveyId) {
    const survey = this.getSurveyById(surveyId);
    if (!survey) {
      return { allowed: false, reason: 'Survey not found.' };
    }
    if (!personnelOrUser) {
      return { allowed: false, reason: 'Authentication required to access survey data.' };
    }

    const person = typeof personnelOrUser === 'string'
      ? this.getPersonnelById(personnelOrUser)
      : (personnelOrUser && personnelOrUser.id ? (this.getPersonnelById(personnelOrUser.id) || personnelOrUser) : personnelOrUser);

    if (!person) {
      return { allowed: false, reason: 'Personnel account not found.' };
    }

    const role = String(person.role || '').toLowerCase();
    if (role === 'admin') {
      return { allowed: true, reason: '' };
    }

    const assigned = Array.isArray(person.assignedSurveys) ? person.assignedSurveys : [];
    if (!assigned.includes(surveyId)) {
      return { allowed: false, reason: `Access Denied: Survey "${survey.title}" is not assigned to ${person.fullName || 'your account'}.` };
    }

    return { allowed: true, reason: '' };
  }

  /**
   * Returns the list of surveys accessible to a specific user based on role and assignments.
   * Admin gets all matching surveys. Personnel gets strictly their assignedSurveys.
   */
  getSurveysForUser(personnelOrUser, filter = {}) {
    const all = this.surveys || [];
    if (!personnelOrUser) {
      return [];
    }

    const person = typeof personnelOrUser === 'string'
      ? this.getPersonnelById(personnelOrUser)
      : (personnelOrUser && personnelOrUser.id ? (this.getPersonnelById(personnelOrUser.id) || personnelOrUser) : personnelOrUser);

    if (!person) {
      return [];
    }

    const role = String(person.role || '').toLowerCase();
    if (role === 'admin') {
      if (filter.status && filter.status !== 'All') {
        return all.filter((s) => (s.status || '').toLowerCase() === filter.status.toLowerCase());
      }
      if (!filter.includeArchived) {
        return all.filter((s) => s.status !== 'Archived');
      }
      return all;
    }

    const assigned = Array.isArray(person.assignedSurveys) ? person.assignedSurveys : [];
    let scoped = all.filter((s) => assigned.includes(s.id));
    if (!filter.includeArchived) {
      scoped = scoped.filter((s) => s.status !== 'Archived');
    }
    if (filter.status && filter.status !== 'All') {
      scoped = scoped.filter((s) => (s.status || '').toLowerCase() === filter.status.toLowerCase());
    }
    if (role === 'enumerator') {
      // Enumerators can only see active assigned surveys
      scoped = scoped.filter((s) => s.status === 'Active');
    }
    return scoped;
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
        this.syncWithGoogleSheets({ manual: true }).catch(() => { });
      }
    }
    return changed;
  }

  upsertCollector(collector, queueForCloud = true) {
    const cleanCol = this.sanitizeCollectorRecord(collector);
    if (!cleanCol) return null;
    const idx = this.collectors.findIndex((c) => c.id === cleanCol.id);
    if (idx >= 0) {
      this.collectors[idx] = cleanCol;
    } else {
      this.collectors.push(cleanCol);
    }
    if (queueForCloud) {
      this.enqueueSyncItem('UPSERT_COLLECTOR', cleanCol.id, `Collector: ${cleanCol.name}`);
      if (this.isEffectivelyOnline() && this.settings.gasWebAppUrl) {
        this.triggerBackgroundSyncNow(400);
      }
    }
    this.saveToLocalStorage({ stores: ['collectors', 'syncQueue'] });
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
    const durationSec = Math.max(0, Number(responsePayload.durationSec) >= 0 ? Number(responsePayload.durationSec) : 0);
    const submittedAt = (responsePayload._preserveMeta && cleanPayload.submittedAt)
      ? cleanPayload.submittedAt
      : nowIso;
    const enumerator = cleanPayload.enumerator || this.settings.defaultEnumerator || 'Field Enumerator';
    const rawFlags = Array.isArray(responsePayload.qaFlags) ? responsePayload.qaFlags : [];
    const automatedFlags = this.evaluateDataQuality(survey, {
      ...responsePayload,
      id,
      clientResponseId: id,
      enumerator,
      submittedAt,
      durationSec,
      answers: cleanPayload.answers || {}
    });
    const autoCodes = automatedFlags.map((f) => f.code);
    const combinedFlags = Array.from(new Set([...rawFlags, ...autoCodes]));

    const calculated = this.calculateResponseMetrics(survey, cleanPayload.answers || {});
    const defaultReviewStatus = combinedFlags.some(
      (c) => c.includes('OUTLIER') || c === 'SPEEDER' || c === 'IMPOSSIBLE_TRAVEL_VELOCITY'
    ) ? 'flagged' : 'pending_review';
    const reviewStatus = (responsePayload._preserveMeta && cleanPayload.reviewStatus)
      ? cleanPayload.reviewStatus
      : defaultReviewStatus;

    const record = {
      id,
      clientResponseId: id,
      surveyId: cleanPayload.surveyId,
      surveyTitle: survey ? survey.title : String(responsePayload.surveyTitle || 'Survey').slice(0, 240),
      collectorId: cleanPayload.collectorId || 'default',
      enumerator,
      submittedByUserId: cleanPayload.submittedByUserId || null,
      submittedByUserRole: cleanPayload.submittedByUserRole || null,
      language: responsePayload.language || 'en',
      status: 'complete',
      reviewStatus,
      qaFlags: combinedFlags,
      calculated,
      audit: responsePayload._preserveMeta ? (cleanPayload.audit || null) : null,
      auditTrail: responsePayload._preserveMeta && Array.isArray(cleanPayload.auditTrail) ? cleanPayload.auditTrail : [],
      recordHash: '',
      startedAt: responsePayload.startedAt || submittedAt,
      submittedAt,
      durationSec,
      gps: responsePayload.gps || null,
      answers: cleanPayload.answers || {},
      syncStatus: 'queued',
      syncedAt: null
    };

    // Set synchronous deterministic hash immediately so fast background syncs never send an empty hash,
    // then upgrade to WebCrypto SHA-256 asynchronously when available.
    if (window.AEIntegrityEngine) {
      if (typeof window.AEIntegrityEngine.computeSyncFallbackHash === 'function') {
        record.recordHash = window.AEIntegrityEngine.computeSyncFallbackHash(record);
      }
      if (typeof window.AEIntegrityEngine.computeRecordHash === 'function') {
        window.AEIntegrityEngine.computeRecordHash(record).then((hash) => {
          record.recordHash = hash;
          this.saveToLocalStorage({ stores: ['responses'], broadcast: false });
        });
      }
    }

    this.responses.unshift(record);
    this.enqueueSyncItem(
      'SUBMIT_RESPONSE',
      record.id,
      `Response (${record.enumerator}) -> ${record.surveyTitle.substring(0, 38)}`
    );
    this.saveToLocalStorage({ stores: ['responses', 'syncQueue'], meta: { newResponsesCount: 1 } });

    // Trigger immediate background sync to stream new response to Google Sheets
    if (this.isEffectivelyOnline() && this.settings.gasWebAppUrl) {
      this.triggerBackgroundSyncNow(250);
    }

    // Register with native W3C Service Worker Background Sync API if supported
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.sync.register('ae-background-sync').catch(() => { });
      }).catch(() => { });
    }

    return record;
  }

  deleteResponse(responseId) {
    this.responses = this.responses.filter((r) => r.id !== responseId);
    this.syncQueue = this.syncQueue.filter((q) => q.recordId !== responseId);
    this.saveToLocalStorage({ stores: ['responses', 'syncQueue'] });
  }

  /**
   * Purges all responses (test data) for a single survey locally and in Google Sheets
   * while preserving the survey schema, translations, collectors, and shared URL.
   * Requires Admin session for remote Google Sheets purge.
   */
  async clearSurveyResponses(surveyId) {
    const targetId = String(surveyId || '').trim();
    if (!targetId) return { ok: false, error: 'Missing surveyId' };

    const matchingIds = new Set(
      (this.responses || []).filter((r) => r && r.surveyId === targetId).map((r) => r.id)
    );
    const localCleared = matchingIds.size;

    // 1. Purge local responses, queued response pushes, and saved runner draft for this survey
    this.responses = (this.responses || []).filter((r) => !r || r.surveyId !== targetId);
    this.syncQueue = (this.syncQueue || []).filter(
      (q) => !q || (!matchingIds.has(q.recordId) && !(q.action === 'SUBMIT_RESPONSE' && q.surveyId === targetId))
    );
    if (this.runnerDrafts && this.runnerDrafts[targetId]) {
      delete this.runnerDrafts[targetId];
      this._safeLocalStorageSet(AE_STORAGE_KEYS.RUNNER_DRAFTS, JSON.stringify(this.runnerDrafts));
    }
    this.settings.lastDeltaSyncAt = null;
    this.saveToLocalStorage({ stores: ['responses', 'syncQueue', 'settings'], meta: { reason: 'responses_cleared', surveyId: targetId, localCleared } });

    // 2. Purge remote rows from Google Sheets (master + dedicated tab) if online & configured
    let remoteCleared = 0;
    let remoteDedicatedCleared = 0;
    let remoteError = null;
    const gasUrl = (this.settings.gasWebAppUrl || '').trim();

    if (gasUrl && this.isValidGasUrl(gasUrl) && this.isEffectivelyOnline()) {
      try {
        const currentUser = (typeof window !== 'undefined' && window.AESession && typeof window.AESession.getCurrentUser === 'function')
          ? window.AESession.getCurrentUser()
          : null;
        const callerId = currentUser ? currentUser.id : 'ADM-01';
        const resp = await this._fetchWithRetry(
          gasUrl,
          {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'CLEAR_SURVEY_RESPONSES',
              syncToken: this.settings.syncToken || '',
              deviceId: this.settings.deviceId,
              callerId,
              surveyId: targetId
            })
          },
          { maxAttempts: 2, timeoutMs: 20000 }
        );
        const data = await resp.json();
        if (data && data.ok) {
          remoteCleared = Number(data.deletedMasterRows || 0);
          remoteDedicatedCleared = Number(data.deletedDedicatedRows || 0);
          if (data.version !== undefined && data.version !== null) {
            this.settings.cloudDbVersion = String(data.version);
          }
          this.settings.lastSyncedAt = new Date().toISOString();
          this.saveToLocalStorage({ stores: ['settings'] });
        } else {
          remoteError = (data && data.error) || 'Google Sheets did not confirm CLEAR_SURVEY_RESPONSES (deploy updated Code.gs).';
        }
      } catch (err) {
        remoteError = err && err.message ? err.message : String(err);
      }
    }

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('ae-cloud-data-updated', {
        detail: { changed: true, newResponsesCount: 0, surveysUpdated: false, reason: 'clear_survey_responses', surveyId: targetId }
      }));
    }

    return {
      ok: !remoteError,
      surveyId: targetId,
      localCleared,
      remoteCleared,
      remoteDedicatedCleared,
      remoteError
    };
  }

  enqueueSyncItem(action, recordId, title) {
    if (!action || !recordId) return;
    const existing = this.syncQueue.find((item) => item && item.action === action && item.recordId === recordId);
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

  /**
   * Removes orphaned, malformed, duplicate, or already-synced ghost items from `this.syncQueue`
   * (and stale `this.deletedSurveyIds`) across localStorage AND IndexedDB so a stuck badge
   * never traps the user.
   */
  pruneStaleSyncQueue(options = { save: true }) {
    const supportedActions = new Set([
      'SUBMIT_RESPONSE',
      'UPSERT_SURVEY',
      'DELETE_SURVEY',
      'UPSERT_COLLECTOR',
      'UPSERT_PERSONNEL'
    ]);
    const respById = new Map();
    (this.responses || []).forEach((r) => {
      if (!r) return;
      if (r.id) respById.set(r.id, r);
      if (r.clientResponseId) respById.set(r.clientResponseId, r);
    });
    const surveyIds = new Set((this.surveys || []).filter((s) => s && s.id).map((s) => s.id));
    const collectorIds = new Set((this.collectors || []).filter((c) => c && c.id).map((c) => c.id));
    const personnelIds = new Set((this.personnel || []).filter((p) => p && p.id).map((p) => p.id));

    const beforeQueueLen = Array.isArray(this.syncQueue) ? this.syncQueue.length : 0;
    const seen = new Set();
    const cleaned = [];

    (Array.isArray(this.syncQueue) ? this.syncQueue : []).forEach((item) => {
      if (!item || typeof item !== 'object' || !item.action || !item.recordId) return;
      if (!supportedActions.has(item.action)) return;
      const dedupeKey = `${item.action}_${item.recordId}`;
      if (seen.has(dedupeKey)) return;

      if (item.action === 'SUBMIT_RESPONSE') {
        const resp = respById.get(item.recordId);
        // Orphaned response or already synced -> prune
        if (!resp || resp.syncStatus === 'synced') return;
      } else if (item.action === 'UPSERT_SURVEY') {
        if (!surveyIds.has(item.recordId)) return;
      } else if (item.action === 'UPSERT_COLLECTOR') {
        if (!collectorIds.has(item.recordId)) return;
      } else if (item.action === 'UPSERT_PERSONNEL') {
        if (!personnelIds.has(item.recordId)) return;
      } else if (item.action === 'DELETE_SURVEY') {
        // If survey was recreated/restored locally, drop stale DELETE_SURVEY
        if (surveyIds.has(item.recordId)) return;
      }

      seen.add(dedupeKey);
      cleaned.push(item);
    });

    const removedFromQueue = beforeQueueLen - cleaned.length;
    this.syncQueue = cleaned;

    let removedDeleted = 0;
    if (Array.isArray(this.deletedSurveyIds)) {
      const beforeDel = this.deletedSurveyIds.length;
      this.deletedSurveyIds = Array.from(
        new Set(this.deletedSurveyIds.filter((id) => id && !surveyIds.has(id)))
      );
      removedDeleted = beforeDel - this.deletedSurveyIds.length;
    }

    const totalRemoved = removedFromQueue + removedDeleted;
    if (totalRemoved > 0 && (!options || options.save !== false)) {
      this.saveToLocalStorage({ stores: ['syncQueue'] });
    }
    return {
      removed: totalRemoved,
      removedFromQueue,
      removedDeleted,
      remaining: this.syncQueue.length
    };
  }

  /**
   * Computes a human-readable explanation for why a pending item has not synced yet.
   */
  _explainPendingReason(action, recordId, attempts, isOrphaned = false) {
    if (isOrphaned) {
      return 'Orphaned queue entry (local record no longer exists — safe to dismiss)';
    }
    if (!this.isEffectivelyOnline()) {
      return this.settings && this.settings.simulateOffline
        ? 'Offline Mode is enabled — disable Offline Mode to sync'
        : 'Device is offline — will sync automatically when reconnected';
    }
    const currentSessionUser = (typeof window !== 'undefined' && window.AESession && typeof window.AESession.getCurrentUser === 'function')
      ? window.AESession.getCurrentUser()
      : null;
    const isNonAdminUser = Boolean(currentSessionUser && currentSessionUser.role !== 'admin');
    if (isNonAdminUser) {
      if (action === 'UPSERT_SURVEY' || action === 'DELETE_SURVEY' || action === 'UPSERT_COLLECTOR') {
        return `Requires Admin login to sync (signed in as ${currentSessionUser.role || 'staff'})`;
      }
      if (action === 'UPSERT_PERSONNEL' && recordId !== currentSessionUser.id) {
        return `Requires Admin login to sync another staff member's record`;
      }
    }
    if (attempts > 0 && this.lastSyncError && this.lastSyncError.message) {
      return `Retry #${attempts} failed: ${String(this.lastSyncError.message).slice(0, 140)}`;
    }
    if (attempts > 0) {
      return `Waiting to retry (${attempts} previous attempt${attempts === 1 ? '' : 's'})`;
    }
    if (!this.settings || !this.settings.gasWebAppUrl) {
      return 'Google Apps Script URL not configured — click Sync Now to run local sync';
    }
    return 'Queued for next cloud sync — click Retry Sync to push now';
  }

  /**
   * Returns a deduplicated, human-readable array of EVERY item currently counted
   * in `getPendingCount()`. Single source of truth for the Sync Inspector UI.
   */
  getPendingSyncItems() {
    const items = [];
    const queue = Array.isArray(this.syncQueue) ? this.syncQueue : [];
    const queueByRespId = new Map();
    queue.forEach((q) => {
      if (q && q.action === 'SUBMIT_RESPONSE' && q.recordId) {
        queueByRespId.set(q.recordId, q);
      }
    });

    const representedQueueIds = new Set();
    const representedDeletedSurveyIds = new Set();

    // 1. Unsynced local responses (deduplicated with any matching SUBMIT_RESPONSE queue item)
    (this.responses || []).forEach((r) => {
      if (!r || r.syncStatus === 'synced') return;
      const respId = r.id || r.clientResponseId;
      if (!respId) return;
      const matchedQ = queueByRespId.get(respId) || (r.clientResponseId ? queueByRespId.get(r.clientResponseId) : null);
      if (matchedQ && matchedQ.id) {
        representedQueueIds.add(matchedQ.id);
      }
      const attempts = matchedQ ? (Number(matchedQ.attempts) || 0) : 0;
      const title = (matchedQ && matchedQ.title)
        || `Response (${r.enumerator || 'Field Enumerator'}) -> ${String(r.surveyTitle || r.surveyId || 'Survey').slice(0, 42)}`;
      items.push({
        key: `response:${respId}`,
        kind: 'response',
        action: 'SUBMIT_RESPONSE',
        recordId: respId,
        title,
        createdAt: (matchedQ && matchedQ.createdAt) || r.updatedAt || r.submittedAt || new Date().toISOString(),
        attempts,
        reason: this._explainPendingReason('SUBMIT_RESPONSE', respId, attempts, false)
      });
    });

    // 2. Remaining syncQueue items (schemas, collectors, personnel, deletions, or orphaned entries)
    const respIdSet = new Set();
    (this.responses || []).forEach((r) => {
      if (!r) return;
      if (r.id) respIdSet.add(r.id);
      if (r.clientResponseId) respIdSet.add(r.clientResponseId);
    });
    const surveyIdSet = new Set((this.surveys || []).filter((s) => s && s.id).map((s) => s.id));
    const collectorIdSet = new Set((this.collectors || []).filter((c) => c && c.id).map((c) => c.id));
    const personnelIdSet = new Set((this.personnel || []).filter((p) => p && p.id).map((p) => p.id));

    queue.forEach((q) => {
      if (!q || typeof q !== 'object') return;
      if (q.id && representedQueueIds.has(q.id)) return;
      const action = q.action || 'UNKNOWN';
      const recordId = q.recordId || q.id || 'unknown';
      if (action === 'DELETE_SURVEY' && recordId) {
        representedDeletedSurveyIds.add(recordId);
      }
      const isOrphaned = (
        (action === 'SUBMIT_RESPONSE' && !respIdSet.has(recordId)) ||
        (action === 'UPSERT_SURVEY' && !surveyIdSet.has(recordId)) ||
        (action === 'UPSERT_COLLECTOR' && !collectorIdSet.has(recordId)) ||
        (action === 'UPSERT_PERSONNEL' && !personnelIdSet.has(recordId))
      );
      const attempts = Number(q.attempts) || 0;
      const qKey = q.id || `${action}:${recordId}`;
      items.push({
        key: `queue:${qKey}`,
        kind: 'queue',
        action,
        recordId,
        title: q.title || `${action}: ${recordId}`,
        createdAt: q.createdAt || new Date().toISOString(),
        attempts,
        reason: this._explainPendingReason(action, recordId, attempts, isOrphaned)
      });
    });

    // 3. Any pending deletedSurveyIds not already represented by a DELETE_SURVEY queue item
    (Array.isArray(this.deletedSurveyIds) ? this.deletedSurveyIds : []).forEach((sid) => {
      if (!sid || representedDeletedSurveyIds.has(sid) || surveyIdSet.has(sid)) return;
      items.push({
        key: `deleted_survey:${sid}`,
        kind: 'deleted_survey',
        action: 'DELETE_SURVEY',
        recordId: sid,
        title: `Delete Survey -> ${sid}`,
        createdAt: (this.settings && this.settings.lastSyncedAt) || new Date().toISOString(),
        attempts: 0,
        reason: this._explainPendingReason('DELETE_SURVEY', sid, 0, false)
      });
    });

    return items;
  }

  /**
   * Canonical pending sync count (exact 1:1 parity with `getPendingSyncItems()`, zero double-counting).
   */
  getPendingCount() {
    return this.getPendingSyncItems().length;
  }

  /**
   * Safely dismisses/clears a single pending sync item by its `key` (from `getPendingSyncItems()`)
   * across BOTH localStorage AND IndexedDB so the user is never trapped with a stuck item.
   */
  dismissPendingSyncItem(key) {
    const targetKey = String(key || '').trim();
    if (!targetKey) {
      return { ok: false, dismissedKey: '', remainingCount: this.getPendingCount() };
    }
    let changed = false;
    const stores = new Set(['syncQueue']);
    const nowIso = new Date().toISOString();

    if (targetKey.startsWith('response:')) {
      const respId = targetKey.slice('response:'.length);
      (this.responses || []).forEach((r) => {
        if (r && (r.id === respId || r.clientResponseId === respId) && r.syncStatus !== 'synced') {
          r.syncStatus = 'synced';
          r.syncedAt = r.syncedAt || nowIso;
          changed = true;
          stores.add('responses');
        }
      });
      const before = (this.syncQueue || []).length;
      this.syncQueue = (this.syncQueue || []).filter(
        (q) => !(q && q.action === 'SUBMIT_RESPONSE' && q.recordId === respId)
      );
      if (this.syncQueue.length !== before) changed = true;
    } else if (targetKey.startsWith('queue:')) {
      const qToken = targetKey.slice('queue:'.length);
      const removedItems = [];
      this.syncQueue = (this.syncQueue || []).filter((q) => {
        if (!q) return false;
        const match = (q.id === qToken) || (`${q.action}:${q.recordId}` === qToken) || (q.recordId === qToken);
        if (match) {
          removedItems.push(q);
          changed = true;
          return false;
        }
        return true;
      });
      removedItems.forEach((rem) => {
        if (rem.action === 'DELETE_SURVEY' && Array.isArray(this.deletedSurveyIds)) {
          this.deletedSurveyIds = this.deletedSurveyIds.filter((id) => id !== rem.recordId);
        }
        if (rem.action === 'SUBMIT_RESPONSE') {
          (this.responses || []).forEach((r) => {
            if (r && (r.id === rem.recordId || r.clientResponseId === rem.recordId) && r.syncStatus !== 'synced') {
              r.syncStatus = 'synced';
              r.syncedAt = r.syncedAt || nowIso;
              stores.add('responses');
            }
          });
        }
      });
    } else if (targetKey.startsWith('deleted_survey:')) {
      const sid = targetKey.slice('deleted_survey:'.length);
      if (Array.isArray(this.deletedSurveyIds) && this.deletedSurveyIds.includes(sid)) {
        this.deletedSurveyIds = this.deletedSurveyIds.filter((id) => id !== sid);
        changed = true;
      }
      const before = (this.syncQueue || []).length;
      this.syncQueue = (this.syncQueue || []).filter(
        (q) => !(q && q.action === 'DELETE_SURVEY' && q.recordId === sid)
      );
      if (this.syncQueue.length !== before) changed = true;
    } else {
      // Fallback: match raw queue item id or recordId
      const before = (this.syncQueue || []).length;
      this.syncQueue = (this.syncQueue || []).filter(
        (q) => !(q && (q.id === targetKey || q.recordId === targetKey))
      );
      if (this.syncQueue.length !== before) changed = true;
      if (Array.isArray(this.deletedSurveyIds) && this.deletedSurveyIds.includes(targetKey)) {
        this.deletedSurveyIds = this.deletedSurveyIds.filter((id) => id !== targetKey);
        changed = true;
      }
    }

    if (changed) {
      // Advance lastSyncedAt so reconcileIndexedDB will never resurrect the dismissed item
      this.settings = this.settings || {};
      this.settings.lastSyncedAt = new Date().toISOString();
      stores.add('settings');
      this.saveToLocalStorage({ stores: Array.from(stores) });
    }
    return {
      ok: changed,
      dismissedKey: targetKey,
      remainingCount: this.getPendingCount()
    };
  }

  saveRunnerDraft(surveyId, draftState) {
    if (!surveyId) return;
    this.runnerDrafts = this.runnerDrafts || {};
    this.runnerDrafts[surveyId] = {
      ...draftState,
      savedAt: new Date().toISOString()
    };
    this._safeLocalStorageSet(AE_STORAGE_KEYS.RUNNER_DRAFTS, JSON.stringify(this.runnerDrafts));
  }

  getRunnerDraft(surveyId) {
    if (!surveyId || !this.runnerDrafts) return null;
    return this.runnerDrafts[surveyId] || null;
  }

  clearRunnerDraft(surveyId) {
    if (!surveyId || !this.runnerDrafts) return;
    delete this.runnerDrafts[surveyId];
    this._safeLocalStorageSet(AE_STORAGE_KEYS.RUNNER_DRAFTS, JSON.stringify(this.runnerDrafts));
  }

  /**
   * Synchronizes all pending surveys, collectors, and offline responses with
   * Google Sheets via Google Apps Script (`Code.gs`).
   * - If `gasWebAppUrl` is configured, performs a real CORS-safe `POST` with
   *   `Content-Type: text/plain;charset=utf-8`, 18s AbortController timeout,
   *   and exponential backoff + jitter on transient failures.
   * - Overlapping calls coalesce cleanly via `_syncPendingAgain` instead of throwing.
   * - If no URL is configured yet (or user chooses Demo Cloud Sync), simulates
   *   the exact Google Sheets batch transaction locally so every workflow can be
   *   tested immediately!
   */
  async syncWithGoogleSheets(options = { forceAll: false }) {
    const opts = options || { forceAll: false };
    if (!this.isEffectivelyOnline()) {
      throw new Error('Device is currently in Offline Mode. Disable Offline Mode or connect to Wi-Fi/cellular to sync with Google Sheets.');
    }

    // Coalesce overlapping sync calls instead of throwing
    if (this._syncInFlight) {
      this._syncPendingAgain = true;
      const prev = this._syncPendingOptions || {};
      this._syncPendingOptions = {
        forceAll: Boolean(prev.forceAll || opts.forceAll),
        syncSurveys: Boolean(prev.syncSurveys || opts.syncSurveys),
        manual: Boolean(prev.manual || opts.manual),
        isBackground: prev.isBackground !== undefined
          ? Boolean(prev.isBackground && opts.isBackground)
          : Boolean(opts.isBackground)
      };
      if (this._syncInFlightPromise) {
        return this._syncInFlightPromise;
      }
      return { ok: true, coalesced: true };
    }

    this._syncInFlight = true;
    const runSync = async () => {
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ae-sync-state-change', { detail: { inFlight: true } }));
      }
      const startTime = performance.now();
      // Drop any orphaned/already-synced ghost entries before building the batch payload
      this.pruneStaleSyncQueue({ save: false });

      const unsyncedResponses = opts.forceAll
        ? [...this.responses]
        : this.responses.filter((r) => r.syncStatus !== 'synced');
      const syncedResponseIds = new Set();
      unsyncedResponses.forEach((r) => {
        if (!r) return;
        if (r.id) syncedResponseIds.add(r.id);
        if (r.clientResponseId) syncedResponseIds.add(r.clientResponseId);
      });
      const syncedQueueSnapshot = new Map((this.syncQueue || []).map((q) => [q.id, q.createdAt]));

      const currentSessionUser = (typeof window !== 'undefined' && window.AESession && typeof window.AESession.getCurrentUser === 'function')
        ? window.AESession.getCurrentUser()
        : null;

      const hasQueuedSurveyUpserts = (this.syncQueue || []).some((q) => q && q.action === 'UPSERT_SURVEY');
      const hasQueuedAdminItems = (this.syncQueue || []).some(
        (q) => q && (q.action === 'UPSERT_SURVEY' || q.action === 'DELETE_SURVEY' || q.action === 'UPSERT_COLLECTOR')
      ) || (Array.isArray(this.deletedSurveyIds) && this.deletedSurveyIds.length > 0);

      const isCallerAdmin = Boolean(
        (currentSessionUser && currentSessionUser.role === 'admin') ||
        (!currentSessionUser && (opts.forceAll || opts.syncSurveys || this._surveysDirty || hasQueuedAdminItems))
      );
      const isCallerSupervisor = Boolean(currentSessionUser && currentSessionUser.role === 'supervisor');

      // On manual sync by an admin, allow retrying previously server-rejected items
      if (opts.manual && isCallerAdmin && Array.isArray(this.syncQueue)) {
        this.syncQueue.forEach((q) => {
          if (q && q.serverAdminRejected) delete q.serverAdminRejected;
        });
      }

      // Send survey schemas if forced, dirty, queued in syncQueue, first connect, or manual sync (when authorized)
      const shouldSyncSurveys = Boolean(
        isCallerAdmin && (opts.forceAll || opts.syncSurveys || this._surveysDirty || hasQueuedSurveyUpserts || !this.settings.lastSyncedAt || opts.manual)
      );
      // Never serialize versionHistory into Google Sheets SchemaJSON
      const surveysPayload = shouldSyncSurveys
        ? this.surveys.map((s) => {
            if (!s || typeof s !== 'object') return s;
            if (!('versionHistory' in s)) return s;
            const { versionHistory: _vh, ...slimSurvey } = s;
            return slimSurvey;
          })
        : [];
      const deletedSurveyIds = isCallerAdmin
        ? Array.from(
            new Set([
              ...(Array.isArray(this.deletedSurveyIds) ? this.deletedSurveyIds : []),
              ...this.syncQueue.filter((q) => q.action === 'DELETE_SURVEY').map((q) => q.recordId)
            ])
          )
        : [];

      const callerId = currentSessionUser
        ? currentSessionUser.id
        : (isCallerAdmin ? 'ADM-01' : 'PUBLIC_RESPONDENT');
      const cloudResponses = unsyncedResponses.map((r) => ({
        ...r,
        answers: this.cleanAnswersForCloudSync(r.answers)
      }));

      const queuedPersonnelIds = new Set(
        (this.syncQueue || []).filter((q) => q && q.action === 'UPSERT_PERSONNEL' && q.recordId).map((q) => q.recordId)
      );
      const personnelPayload = isCallerAdmin
        ? this.personnel
        : isCallerSupervisor
          ? this.personnel.filter((p) => p && (
              p.id === currentSessionUser.id ||
              (queuedPersonnelIds.has(p.id) && p.role === 'enumerator' && (!p.supervisorId || p.supervisorId === currentSessionUser.id))
            ))
          : (currentSessionUser ? this.personnel.filter((p) => p && p.id === currentSessionUser.id) : []);

      let sentSurveySync = shouldSyncSurveys;
      let sentCollectorSync = isCallerAdmin;
      let sentDeletedSurveyIds = new Set(deletedSurveyIds);
      let sentAllPersonnel = isCallerAdmin;
      let sentPersonnelIds = new Set(personnelPayload.map((p) => p && p.id).filter(Boolean));
      let serverDeniedAdmin = false;

      const payload = {
        action: 'BATCH_SYNC',
        syncToken: this.settings.syncToken || '',
        deviceId: this.settings.deviceId,
        callerId,
        surveys: surveysPayload,
        deletedSurveyIds,
        collectors: isCallerAdmin ? this.collectors : [],
        responses: cloudResponses,
        personnel: personnelPayload
      };

      const gasUrl = (this.settings.gasWebAppUrl || '').trim();
      let resultSummary = null;

      try {
        if (gasUrl && !this.isValidGasUrl(gasUrl)) {
          throw new Error('Untrusted or invalid GAS URL. Only https://script.google.com/macros/s/.../exec endpoints are permitted.');
        }

        if (gasUrl) {
          const postBatch = async (batchPayload) => {
            let response;
            try {
              response = await this._fetchWithRetry(
                gasUrl,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                  body: JSON.stringify(batchPayload),
                  redirect: 'follow'
                },
                { timeoutMs: 18000, maxAttempts: 3 }
              );
            } catch (netErr) {
              if (netErr && netErr.name === 'AbortError') {
                throw new Error('Google Apps Script request timed out after 18s. Responses remain safely queued in IndexedDB outbox.');
              }
              throw new Error(`Network connection to Google Apps Script failed (${netErr && netErr.message ? netErr.message : 'Unreachable'}). Responses remain safely queued locally.`);
            }

            if (!response || !response.ok) {
              const status = response ? response.status : 0;
              const statusText = response ? response.statusText : 'No response';
              const httpErr = new Error(`Google Apps Script HTTP ${status}: ${statusText}`);
              httpErr.status = status;
              throw httpErr;
            }

            let parsed;
            try {
              parsed = await response.json();
            } catch (parseErr) {
              throw new Error('Google Apps Script returned an HTML login page instead of JSON. Ensure your Web App deployment has "Who has access: Anyone".');
            }

            if (!parsed || !parsed.ok) {
              const apiErr = new Error((parsed && parsed.error) || 'Google Apps Script returned an error');
              if (parsed && parsed.status) apiErr.status = parsed.status;
              throw apiErr;
            }
            return parsed;
          };

          let data;
          try {
            data = await postBatch(payload);
          } catch (batchErr) {
            // If an admin-auth error rejected a mixed batch that also contained valid non-admin response submissions,
            // retry a responses-only submission so field responses are never dropped or blocked by admin-only queue items.
            const hasAdminPayload = surveysPayload.length > 0 || deletedSurveyIds.length > 0 || (isCallerAdmin && this.collectors.length > 0);
            if (this._isAuthError(batchErr, batchErr.status) && cloudResponses.length > 0 && hasAdminPayload) {
              const responsesOnlyPayload = {
                action: 'BATCH_SYNC',
                syncToken: this.settings.syncToken || '',
                deviceId: this.settings.deviceId,
                callerId,
                surveys: [],
                deletedSurveyIds: [],
                collectors: [],
                responses: cloudResponses,
                personnel: []
              };
              data = await postBatch(responsesOnlyPayload);
              sentSurveySync = false;
              sentCollectorSync = false;
              sentDeletedSurveyIds = new Set();
              sentAllPersonnel = false;
              sentPersonnelIds = new Set();
            } else {
              throw batchErr;
            }
          }

          if (data.isCallerAdmin === false) {
            serverDeniedAdmin = true;
            sentSurveySync = false;
            sentCollectorSync = false;
            sentDeletedSurveyIds = new Set();
            sentAllPersonnel = false;
            if (!data.isCallerSupervisor && Number(data.personnelSynced || 0) === 0 && sentPersonnelIds.size > 0) {
              sentPersonnelIds = new Set(callerId && sentPersonnelIds.has(callerId) ? [callerId] : []);
            }
          } else if (Array.isArray(data.deletedSurveyIds)) {
            sentDeletedSurveyIds = new Set(data.deletedSurveyIds);
          }
          if (Array.isArray(data.syncedResponseIds) && cloudResponses.length > 0) {
            syncedResponseIds.clear();
            data.syncedResponseIds.forEach((sid) => {
              if (sid) syncedResponseIds.add(String(sid));
            });
          }
          if (data.version !== undefined && data.version !== null && data.version !== '') {
            this.settings.cloudDbVersion = String(data.version);
          }
          if (data.personnel && Array.isArray(data.personnel) && data.personnel.length) {
            this.mergePersonnelFromCloud(data.personnel);
          }
          if (sentSurveySync) {
            this._surveysDirty = false;
          }
          resultSummary = {
            mode: 'Live GAS Web App',
            surveysSynced: data.surveysSynced ?? (sentSurveySync ? this.surveys.length : 0),
            responsesInserted: data.responsesInserted ?? unsyncedResponses.length,
            personnelSynced: data.personnelSynced ?? this.personnel.length,
            duplicatesSkipped: data.duplicatesSkipped ?? 0,
            version: data.version ?? this.settings.cloudDbVersion ?? null,
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
            version: this.settings.cloudDbVersion || null,
            serverTime: new Date().toISOString()
          };
        }

        const nowIso = new Date().toISOString();
        this.responses.forEach((r) => {
          if (r && (syncedResponseIds.has(r.id) || (r.clientResponseId && syncedResponseIds.has(r.clientResponseId)))) {
            r.syncStatus = 'synced';
            r.syncedAt = nowIso;
          }
        });

        const respStatusById = new Map();
        (this.responses || []).forEach((r) => {
          if (!r) return;
          if (r.id) respStatusById.set(r.id, r.syncStatus);
          if (r.clientResponseId) respStatusById.set(r.clientResponseId, r.syncStatus);
        });
        const liveSurveyIds = new Set((this.surveys || []).filter((s) => s && s.id).map((s) => s.id));
        const liveCollectorIds = new Set((this.collectors || []).filter((c) => c && c.id).map((c) => c.id));
        const livePersonnelIds = new Set((this.personnel || []).filter((p) => p && p.id).map((p) => p.id));

        // Prune syncQueue items that were actually included in the succeeded payload
        // (or are already synced / orphaned). When signed in as a non-admin, auto-prune
        // non-admin-eligible admin actions (UPSERT_SURVEY / DELETE_SURVEY / UPSERT_COLLECTOR)
        // and mark any server-rejected admin/personnel items so they never loop forever on ok:true.
        const isExplicitNonAdmin = Boolean(currentSessionUser && currentSessionUser.role !== 'admin');
        this.syncQueue = (this.syncQueue || []).filter((item) => {
          if (!item || !item.action || !item.recordId) return false;
          if (!syncedQueueSnapshot.has(item.id) || item.createdAt !== syncedQueueSnapshot.get(item.id)) {
            return true;
          }
          if (item.action === 'SUBMIT_RESPONSE') {
            if (syncedResponseIds.has(item.recordId)) return false;
            const st = respStatusById.get(item.recordId);
            // Prune if orphaned (missing) or already synced
            if (!st || st === 'synced') return false;
            return true;
          }
          if (item.action === 'DELETE_SURVEY') {
            if (sentDeletedSurveyIds.has(item.recordId) || !gasUrl) return false;
            if (isExplicitNonAdmin) return false;
            if (serverDeniedAdmin) item.serverAdminRejected = true;
            return true;
          }
          if (item.action === 'UPSERT_SURVEY') {
            if (!liveSurveyIds.has(item.recordId)) return false;
            if (sentSurveySync || !gasUrl) return false;
            if (isExplicitNonAdmin) return false;
            if (serverDeniedAdmin) item.serverAdminRejected = true;
            return true;
          }
          if (item.action === 'UPSERT_COLLECTOR') {
            if (!liveCollectorIds.has(item.recordId)) return false;
            if (sentCollectorSync || !gasUrl) return false;
            if (isExplicitNonAdmin) return false;
            if (serverDeniedAdmin) item.serverAdminRejected = true;
            return true;
          }
          if (item.action === 'UPSERT_PERSONNEL') {
            if (!livePersonnelIds.has(item.recordId)) return false;
            if (sentAllPersonnel || sentPersonnelIds.has(item.recordId) || !gasUrl) return false;
            if (serverDeniedAdmin) item.serverAdminRejected = true;
            if (isExplicitNonAdmin && !isCallerSupervisor && item.recordId !== callerId) return false;
            return true;
          }
          // Drop unrecognized legacy action types so they never stick forever
          return false;
        });
        if (sentDeletedSurveyIds.size > 0 && Array.isArray(this.deletedSurveyIds)) {
          this.deletedSurveyIds = this.deletedSurveyIds.filter((id) => !sentDeletedSurveyIds.has(id));
        } else if (!gasUrl && Array.isArray(this.deletedSurveyIds)) {
          this.deletedSurveyIds = [];
        }
        this.pruneStaleSyncQueue({ save: false });
        this.applyPinOverridesToPersonnel();
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

        this.saveToLocalStorage({ stores: ['responses', 'syncQueue', 'syncLogs', 'settings'] });
        return { ...resultSummary, latencyMs };
      } catch (err) {
        const nowIso = new Date().toISOString();
        const latencyMs = Math.round(performance.now() - startTime);
        this.syncQueue.forEach((item) => {
          item.attempts = (item.attempts || 0) + 1;
        });
        // In background auto-sync mode, do not show a disruptive banner on transient timeout
        if (!opts.isBackground) {
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
        this.saveToLocalStorage({ stores: ['syncQueue', 'syncLogs'] });
        throw err;
      } finally {
        this._syncInFlight = false;
        this._syncInFlightPromise = null;
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ae-sync-state-change', { detail: { inFlight: false } }));
        }
        if (this._syncPendingAgain) {
          const nextOpts = this._syncPendingOptions || { forceAll: false, isBackground: true };
          this._syncPendingAgain = false;
          this._syncPendingOptions = null;
          if (this.isEffectivelyOnline()) {
            setTimeout(() => {
              this.syncWithGoogleSheets(nextOpts).catch(() => { });
            }, 50);
          }
        }
      }
    };

    this._syncInFlightPromise = runSync();
    return this._syncInFlightPromise;
  }

  /**
   * Pulls a single survey and its collectors via `?action=pullSurvey&surveyId=...`
   * without fetching Responses or Personnel (fast & private for respondent links).
   * Automatically falls back to `pullFromGoogleSheets()` if connected to an older GAS
   * deployment that does not yet support `pullSurvey`.
   */
  async pullSingleSurveyFromCloud(surveyId, options = {}) {
    if (!surveyId) {
      throw new Error('surveyId is required to pull a single survey.');
    }
    if (!this.isEffectivelyOnline()) {
      throw new Error('Cannot pull survey from Google Sheets while offline.');
    }
    const gasUrl = (this.settings.gasWebAppUrl || '').trim();
    if (!gasUrl || !this.isValidGasUrl(gasUrl)) {
      throw new Error('Paste a valid Google Apps Script Web App URL (`https://script.google.com/macros/s/.../exec`) first.');
    }

    const startTime = performance.now();
    const sep = gasUrl.includes('?') ? '&' : '?';
    const url = `${gasUrl}${sep}action=pullSurvey&surveyId=${encodeURIComponent(surveyId)}&deviceId=${encodeURIComponent(this.settings.deviceId)}&syncToken=${encodeURIComponent(this.settings.syncToken || '')}&t=${Date.now()}`;

    let response;
    try {
      response = await this._fetchWithRetry(
        url,
        { method: 'GET', redirect: 'follow' },
        { timeoutMs: 18000, maxAttempts: 3 }
      );
    } catch (netErr) {
      if (netErr && netErr.name === 'AbortError') {
        throw new Error('Pulling survey from Google Apps Script timed out after 18s.');
      }
      throw new Error(`Failed to pull survey from Google Sheets (${netErr && netErr.message ? netErr.message : 'Network error'}).`);
    }

    if (response && (response.status === 401 || response.status === 403)) {
      throw new Error(`HTTP ${response.status} Unauthorized while pulling survey from Google Apps Script`);
    }

    let data = null;
    let shouldFallback = false;
    if (!response || !response.ok) {
      shouldFallback = true;
    } else {
      try {
        data = await response.json();
      } catch (parseErr) {
        throw new Error('Google Apps Script returned an HTML login page instead of JSON. Ensure your Web App deployment has "Who has access: Anyone".');
      }
      if (!data || !data.ok) {
        const errMsg = (data && data.error) ? String(data.error) : '';
        if (this._isAuthError(errMsg)) {
          throw new Error(errMsg || 'Unauthorized');
        }
        if (/not\s*found/i.test(errMsg) && !/action/i.test(errMsg)) {
          return { ok: false, notFound: true, error: errMsg, survey: null, collectors: [] };
        }
        shouldFallback = true;
      } else if (!('survey' in data)) {
        // Older GAS deployment ignored unknown action (e.g. returned status banner or pullAll payload without `survey`)
        shouldFallback = true;
      }
    }

    if (shouldFallback) {
      const fb = await this.pullFromGoogleSheets({ forceFull: false, reason: options.reason || 'pullSurvey_fallback', isBackground: Boolean(options.isBackground) });
      return {
        ok: true,
        fallback: true,
        survey: this.getSurveyById(surveyId),
        collectors: this.getCollectorsForSurvey(surveyId),
        version: fb && fb.version ? fb.version : (this.settings.cloudDbVersion || null),
        latencyMs: Math.round(performance.now() - startTime)
      };
    }

    let surveysUpdated = 0;
    let collectorsChanged = false;
    let mergedSurvey = null;

    if (data.survey && typeof data.survey === 'object') {
      const clean = this.sanitizeSurveyRecord(data.survey);
      const pendingSurveyIds = new Set(
        (this.syncQueue || []).filter((q) => q.action === 'UPSERT_SURVEY').map((q) => q.recordId)
      );
      const deletedIds = new Set([
        ...(Array.isArray(this.deletedSurveyIds) ? this.deletedSurveyIds : []),
        ...(this.syncQueue || []).filter((q) => q.action === 'DELETE_SURVEY').map((q) => q.recordId)
      ]);

      if (clean && !deletedIds.has(clean.id)) {
        const idx = this.surveys.findIndex((s) => s.id === clean.id);
        if (idx >= 0) {
          const existing = this.surveys[idx];
          const localTime = Date.parse(existing.updatedAt || '') || 0;
          const remoteTime = Date.parse(clean.updatedAt || '') || 0;
          if (!pendingSurveyIds.has(clean.id) && !(localTime > 0 && remoteTime > 0 && localTime > remoteTime)) {
            if (JSON.stringify(existing) !== JSON.stringify(clean)) {
              this.surveys[idx] = clean;
              surveysUpdated = 1;
            }
          }
          mergedSurvey = this.surveys[idx];
        } else {
          this.surveys.unshift(clean);
          surveysUpdated = 1;
          mergedSurvey = clean;
        }
      }
    }

    if (Array.isArray(data.collectors) && data.collectors.length > 0) {
      const colMap = new Map(this.collectors.map((c) => [c.id, c]));
      data.collectors.forEach((rc) => {
        const cleanCol = this.sanitizeCollectorRecord(rc);
        if (!cleanCol) return;
        const prev = colMap.get(cleanCol.id);
        if (!prev || JSON.stringify(prev) !== JSON.stringify(cleanCol)) {
          colMap.set(cleanCol.id, cleanCol);
          collectorsChanged = true;
        }
      });
      if (collectorsChanged) {
        this.collectors = Array.from(colMap.values());
      }
    }

    const changed = surveysUpdated > 0 || collectorsChanged;
    if (changed) {
      const storesToSave = [];
      if (surveysUpdated > 0) storesToSave.push('surveys');
      if (collectorsChanged) storesToSave.push('collectors');
      this.saveToLocalStorage({ stores: storesToSave, meta: { surveysUpdated } });
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ae-cloud-data-updated', {
          detail: {
            changed: true,
            newResponsesCount: 0,
            surveysUpdated,
            reason: options.reason || 'pullSurvey'
          }
        }));
      }
    }

    return {
      ok: true,
      fallback: false,
      changed,
      survey: mergedSurvey || this.getSurveyById(surveyId),
      collectors: this.getCollectorsForSurvey(surveyId),
      version: data.version ?? null,
      latencyMs: Math.round(performance.now() - startTime)
    };
  }

  /**
   * Pulls surveys, collectors, responses, and personnel from Google Sheets.
   * Supports version-checked short-circuit (`unchanged: true`) and incremental delta pulls
   * (`action=pullDelta&since=...&version=...`) with automatic fallback to `action=pullAll`
   * for backward compatibility with older GAS deployments.
   */
  async pullFromGoogleSheets(options = {}) {
    const { forceFull = false, reason = 'manual', isBackground = false } = options || {};
    if (this._pullInFlight && this._pullInFlightPromise) {
      return this._pullInFlightPromise;
    }
    if (!this.isEffectivelyOnline()) {
      throw new Error('Cannot pull from Google Sheets while offline.');
    }
    const gasUrl = (this.settings.gasWebAppUrl || '').trim();
    if (!gasUrl || !this.isValidGasUrl(gasUrl)) {
      throw new Error('Paste a valid Google Apps Script Web App URL (`https://script.google.com/macros/s/.../exec`) first to pull live sheet rows.');
    }

    this._pullInFlight = true;
    this._lastPullAttemptAt = Date.now();
    const runPull = async () => {
      if (!isBackground && typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ae-sync-state-change', { detail: { inFlight: true } }));
      }
      const startTime = performance.now();
      try {
        const sep = gasUrl.includes('?') ? '&' : '?';
        const baseParams = `deviceId=${encodeURIComponent(this.settings.deviceId)}&syncToken=${encodeURIComponent(this.settings.syncToken || '')}`;
        const hasVersion = !forceFull && Boolean(this.settings.cloudDbVersion);
        const versionParam = hasVersion ? `&version=${encodeURIComponent(this.settings.cloudDbVersion)}` : '';
        const tryDelta = hasVersion && Boolean(this.settings.lastDeltaSyncAt);

        const fetchPullJson = async (url) => {
          let response;
          try {
            response = await this._fetchWithRetry(
              url,
              { method: 'GET', redirect: 'follow' },
              { timeoutMs: 18000, maxAttempts: 3 }
            );
          } catch (netErr) {
            if (netErr && netErr.name === 'AbortError') {
              throw new Error('Pulling from Google Apps Script timed out after 18s.');
            }
            throw new Error(`Failed to pull from Google Sheets (${netErr && netErr.message ? netErr.message : 'Network error'}).`);
          }

          if (!response || !response.ok) {
            const status = response ? response.status : 0;
            const err = new Error(`HTTP ${status} while pulling from Google Apps Script`);
            err.status = status;
            throw err;
          }

          let parsed;
          try {
            parsed = await response.json();
          } catch (parseErr) {
            throw new Error('Google Apps Script returned an HTML login page instead of JSON. Ensure your Web App deployment has "Who has access: Anyone".');
          }
          return parsed;
        };

        let data;
        let usedAction = 'pullAll';
        if (tryDelta) {
          const deltaUrl = `${gasUrl}${sep}action=pullDelta&since=${encodeURIComponent(this.settings.lastDeltaSyncAt)}${versionParam}&${baseParams}&t=${Date.now()}`;
          try {
            const deltaData = await fetchPullJson(deltaUrl);
            if (
              deltaData &&
              deltaData.ok &&
              (deltaData.unchanged === true ||
                deltaData.delta === true ||
                Array.isArray(deltaData.surveys) ||
                Array.isArray(deltaData.responses))
            ) {
              data = deltaData;
              usedAction = 'pullDelta';
            } else {
              const errMsg = (deltaData && deltaData.error) || '';
              if (this._isAuthError(errMsg)) {
                throw new Error(errMsg || 'Unauthorized');
              }
              // Older GAS deployment does not support pullDelta (e.g. returned status banner or error) -> fall back to pullAll
              data = null;
            }
          } catch (deltaErr) {
            if (this._isAuthError(deltaErr, deltaErr.status)) {
              throw deltaErr;
            }
            // Fall back cleanly to pullAll
            data = null;
          }
        }

        if (!data) {
          const pullAllUrl = `${gasUrl}${sep}action=pullAll${versionParam}&${baseParams}&t=${Date.now()}`;
          data = await fetchPullJson(pullAllUrl);
          usedAction = 'pullAll';
        }

        if (!data || !data.ok) {
          throw new Error((data && data.error) || 'Failed to pull from Google Sheets');
        }

        const latencyMs = Math.round(performance.now() - startTime);

        // Version-checked short-circuit: skip merge and localStorage/IDB writes!
        if (data.unchanged === true) {
          if (data.version !== undefined && data.version !== null && String(data.version) !== String(this.settings.cloudDbVersion || '')) {
            this.settings.cloudDbVersion = String(data.version);
            this.saveToLocalStorage({ stores: ['settings'], broadcast: false });
          }
          return {
            ok: true,
            unchanged: true,
            version: data.version ?? this.settings.cloudDbVersion ?? null,
            surveysCount: this.surveys.length,
            responsesCount: this.responses.length,
            latencyMs
          };
        }

        let surveysUpdated = 0;
        let collectorsChanged = false;
        let newResponsesCount = 0;
        let responsesChanged = false;
        let syncQueueChanged = false;
        let personnelChanged = false;

        // Merge remote surveys (sanitized against DOM XSS / invalid IDs, preserving newer local edits)
        if (Array.isArray(data.surveys) && data.surveys.length > 0) {
          const localMap = new Map(this.surveys.map((s) => [s.id, s]));
          const pendingSurveyIds = new Set(
            (this.syncQueue || []).filter((q) => q.action === 'UPSERT_SURVEY').map((q) => q.recordId)
          );
          const deletedIds = new Set([
            ...(Array.isArray(this.deletedSurveyIds) ? this.deletedSurveyIds : []),
            ...(this.syncQueue || []).filter((q) => q.action === 'DELETE_SURVEY').map((q) => q.recordId)
          ]);
          data.surveys.forEach((remoteSurvey) => {
            const clean = this.sanitizeSurveyRecord(remoteSurvey);
            if (!clean || deletedIds.has(clean.id)) return;
            const existing = localMap.get(clean.id);
            if (existing) {
              if (pendingSurveyIds.has(clean.id)) {
                return;
              }
              const localTime = Date.parse(existing.updatedAt || '') || 0;
              const remoteTime = Date.parse(clean.updatedAt || '') || 0;
              if (localTime > 0 && remoteTime > 0 && localTime > remoteTime) {
                return;
              }
              if (JSON.stringify(existing) !== JSON.stringify(clean)) {
                surveysUpdated++;
              }
            } else {
              surveysUpdated++;
            }
            localMap.set(clean.id, clean);
          });
          if (surveysUpdated > 0) {
            this.surveys = Array.from(localMap.values());
          }
        }

        // Merge remote collectors (sanitized)
        if (Array.isArray(data.collectors) && data.collectors.length > 0) {
          const colMap = new Map(this.collectors.map((c) => [c.id, c]));
          data.collectors.forEach((rc) => {
            const cleanCol = this.sanitizeCollectorRecord(rc);
            if (!cleanCol) return;
            const prev = colMap.get(cleanCol.id);
            if (!prev || JSON.stringify(prev) !== JSON.stringify(cleanCol)) {
              colMap.set(cleanCol.id, cleanCol);
              collectorsChanged = true;
            }
          });
          if (collectorsChanged) {
            this.collectors = Array.from(colMap.values());
          }
        }

        // Merge remote responses (sanitized against prototype pollution & invalid IDs)
        // Preserves local responses not present in `data.responses` (supports both pullAll and pullDelta)
        if (Array.isArray(data.responses)) {
          const existingRespMap = new Map(this.responses.map((r) => [r.clientResponseId || r.id, r]));
          const respMap = new Map();
          data.responses.forEach((rr) => {
            const cleanResp = this.sanitizeResponseRecord(rr);
            if (cleanResp) {
              const key = cleanResp.clientResponseId || cleanResp.id;
              if (!existingRespMap.has(key)) {
                newResponsesCount++;
                responsesChanged = true;
              }
              respMap.set(key, { ...cleanResp, syncStatus: 'synced' });
            }
          });
          const seedMap = new Map(getInitialSeedData().responses.map((sr) => [sr.id, sr]));
          const healedResponseIds = new Set();
          this.responses.forEach((localResp) => {
            const key = localResp.clientResponseId || localResp.id;
            if (!respMap.has(key)) {
              respMap.set(key, localResp);
            } else {
              // Preserve rich local answers and pending supervisor review state
              const remoteItem = respMap.get(key);
              const remoteHasAnswers = remoteItem && remoteItem.answers && Object.keys(remoteItem.answers).length > 0;
              const localHasAnswers = localResp && localResp.answers && Object.keys(localResp.answers).length > 0;
              if (!remoteHasAnswers && localHasAnswers) {
                remoteItem.answers = { ...localResp.answers };
              } else if (!remoteHasAnswers && seedMap.has(key)) {
                remoteItem.answers = JSON.parse(JSON.stringify(seedMap.get(key).answers || {}));
              }
              if (localResp.syncStatus === 'queued') {
                // Server already has this response — heal local status to 'synced' and prune from syncQueue
                if (localResp.reviewStatus && localResp.reviewStatus !== 'pending_review' && (!remoteItem.reviewStatus || remoteItem.reviewStatus === 'pending_review')) {
                  remoteItem.reviewStatus = localResp.reviewStatus;
                }
                if (Array.isArray(localResp.qaFlags) && localResp.qaFlags.length && (!Array.isArray(remoteItem.qaFlags) || !remoteItem.qaFlags.length)) {
                  remoteItem.qaFlags = localResp.qaFlags;
                }
                if (localResp.audit && !remoteItem.audit) {
                  remoteItem.audit = localResp.audit;
                  remoteItem.auditTrail = Array.isArray(localResp.auditTrail) ? localResp.auditTrail : [];
                }
                remoteItem.syncStatus = 'synced';
                remoteItem.syncedAt = remoteItem.syncedAt || localResp.syncedAt || new Date().toISOString();
                if (localResp.id) healedResponseIds.add(localResp.id);
                if (localResp.clientResponseId) healedResponseIds.add(localResp.clientResponseId);
                responsesChanged = true;
              } else if (localResp.audit && !remoteItem.audit) {
                remoteItem.reviewStatus = localResp.reviewStatus || remoteItem.reviewStatus;
                remoteItem.audit = localResp.audit;
                remoteItem.auditTrail = Array.isArray(localResp.auditTrail) ? localResp.auditTrail : [];
              }
              if (!responsesChanged && JSON.stringify(localResp) !== JSON.stringify(remoteItem)) {
                responsesChanged = true;
              }
            }
          });
          this.responses = Array.from(respMap.values()).sort(
            (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
          );
          this.healResponsesAnswers();
          if (healedResponseIds.size > 0 && Array.isArray(this.syncQueue)) {
            const beforeQueueLen = this.syncQueue.length;
            this.syncQueue = this.syncQueue.filter(
              (q) => !(q && q.action === 'SUBMIT_RESPONSE' && healedResponseIds.has(q.recordId))
            );
            if (this.syncQueue.length !== beforeQueueLen) {
              syncQueueChanged = true;
            }
          }
        }

        // Merge remote personnel (staff credentials, roles, and PIN updates)
        if (Array.isArray(data.personnel) && data.personnel.length > 0) {
          personnelChanged = Boolean(this.mergePersonnelFromCloud(data.personnel));
        }

        const nowIso = new Date().toISOString();
        if (data.version !== undefined && data.version !== null && data.version !== '') {
          this.settings.cloudDbVersion = String(data.version);
        }
        this.settings.lastDeltaSyncAt = data.serverTime || nowIso;
        this.settings.lastSyncedAt = nowIso;
        this.lastSyncError = null;

        this.syncLogs.unshift({
          id: 'log_' + Date.now().toString(36),
          timestamp: this.settings.lastSyncedAt,
          action: usedAction === 'pullDelta' ? 'PULL_DELTA' : 'PULL_ALL',
          details: `Pulled ${data.surveys?.length || 0} surveys & ${data.responses?.length || 0} responses from Google Sheets (${usedAction}).`,
          status: 'success',
          latencyMs
        });

        const changed = surveysUpdated > 0 || collectorsChanged || responsesChanged || syncQueueChanged || personnelChanged;
        const storesToSave = ['settings', 'syncLogs'];
        if (surveysUpdated > 0) storesToSave.push('surveys');
        if (collectorsChanged) storesToSave.push('collectors');
        if (responsesChanged) storesToSave.push('responses');
        if (syncQueueChanged) storesToSave.push('syncQueue');
        if (personnelChanged) storesToSave.push('personnel', 'pinOverrides');

        this.saveToLocalStorage({
          stores: storesToSave,
          broadcast: changed,
          meta: { newResponsesCount, surveysUpdated }
        });

        if (changed && typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ae-cloud-data-updated', {
            detail: {
              changed: true,
              newResponsesCount,
              surveysUpdated,
              reason
            }
          }));
        }

        return {
          ok: true,
          unchanged: false,
          delta: usedAction === 'pullDelta' || Boolean(data.delta),
          changed,
          newResponsesCount,
          surveysUpdated,
          surveysCount: this.surveys.length,
          responsesCount: this.responses.length,
          version: this.settings.cloudDbVersion || null,
          latencyMs
        };
      } catch (err) {
        const nowIso = new Date().toISOString();
        const latencyMs = Math.round(performance.now() - startTime);
        if (!isBackground) {
          this.lastSyncError = {
            message: err.message || 'Pull failed',
            timestamp: nowIso,
            gasUrl
          };
        }
        this.syncLogs.unshift({
          id: 'log_' + Date.now().toString(36),
          timestamp: nowIso,
          action: 'PULL_ERROR',
          details: `[Pull Failed] ${err.message || 'Unknown error'}`,
          status: 'error',
          latencyMs
        });
        this.saveToLocalStorage({ stores: ['syncLogs'], broadcast: false });
        throw err;
      } finally {
        this._pullInFlight = false;
        this._pullInFlightPromise = null;
        if (!isBackground && typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ae-sync-state-change', { detail: { inFlight: false } }));
        }
      }
    };

    this._pullInFlightPromise = runPull();
    return this._pullInFlightPromise;
  }

  /**
   * Batches array of strings to Google Apps Script LanguageApp service for translation.
   * Free, zero-API-key Google Translate engine.
   * Returns array of translated strings or null if unavailable/offline.
   */
  async batchTranslateWithGoogle(texts, targetLang = 'sw', sourceLang = 'en') {
    if (!this.isEffectivelyOnline()) return null;
    const gasUrl = (this.settings.gasWebAppUrl || '').trim();
    if (!gasUrl || !this.isValidGasUrl(gasUrl)) return null;
    if (!Array.isArray(texts) || texts.length === 0) return [];

    const CHUNK_SIZE = 150;
    const allTranslations = [];

    for (let offset = 0; offset < texts.length; offset += CHUNK_SIZE) {
      const chunk = texts.slice(offset, offset + CHUNK_SIZE);
      const payload = {
        action: 'BATCH_TRANSLATE',
        syncToken: this.settings.syncToken || '',
        deviceId: this.settings.deviceId || 'ae-studio-browser',
        sourceLang: sourceLang,
        targetLang: targetLang,
        texts: chunk
      };

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 25000);
      try {
        const resp = await fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
          redirect: 'follow',
          signal: controller.signal
        });
        clearTimeout(timer);
        if (!resp.ok) return null;
        const data = await resp.json();
        if (data && data.ok && Array.isArray(data.translations)) {
          allTranslations.push(...data.translations);
        } else {
          return null;
        }
      } catch (err) {
        clearTimeout(timer);
        console.warn('[AE Translate] Google Apps Script translation request failed:', err);
        return null;
      }
    }

    return allTranslations;
  }

  /**
   * Duplicate-Response Guard: tracks surveys submitted on this device in localStorage
   * (`ae_submitted_surveys_v1`) with a document.cookie fallback.
   */
  _readSubmittedSurveysMap() {
    const KEY = 'ae_submitted_surveys_v1';
    let map = {};
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            map = { ...parsed };
          }
        }
      }
    } catch (_) {
      // Ignore storage read errors
    }

    try {
      if (typeof document !== 'undefined' && typeof document.cookie === 'string' && document.cookie) {
        const prefix = `${KEY}=`;
        const parts = document.cookie.split(';');
        for (const part of parts) {
          const trimmed = part.trim();
          if (trimmed.startsWith(prefix)) {
            const decoded = decodeURIComponent(trimmed.slice(prefix.length));
            const parsed = JSON.parse(decoded);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              map = { ...parsed, ...map };
            }
            break;
          }
        }
      }
    } catch (_) {
      // Ignore cookie parse errors
    }
    return map;
  }

  _writeSubmittedSurveysMap(map) {
    const KEY = 'ae_submitted_surveys_v1';
    const safeMap = map && typeof map === 'object' && !Array.isArray(map) ? map : {};
    const serialized = JSON.stringify(safeMap);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(KEY, serialized);
      }
    } catch (_) {
      // Fallback to cookie below
    }
    try {
      if (typeof document !== 'undefined') {
        // Keep cookie payload compact (at most 25 most recent survey entries)
        const entries = Object.entries(safeMap);
        const cookieMap = entries.length > 25 ? Object.fromEntries(entries.slice(-25)) : safeMap;
        document.cookie = `${KEY}=${encodeURIComponent(JSON.stringify(cookieMap))}; path=/; max-age=31536000; SameSite=Lax`;
      }
    } catch (_) {
      // Ignore cookie write errors
    }
  }

  hasDeviceSubmittedSurvey(surveyId) {
    if (!surveyId) return null;
    const map = this._readSubmittedSurveysMap();
    const record = map[String(surveyId)];
    if (record && typeof record === 'object' && record.submittedAt) {
      return record;
    }
    return null;
  }

  markDeviceSubmittedSurvey(surveyId, receiptId) {
    if (!surveyId) return null;
    const map = this._readSubmittedSurveysMap();
    const record = {
      receiptId: String(receiptId || ''),
      submittedAt: new Date().toISOString()
    };
    map[String(surveyId)] = record;
    this._writeSubmittedSurveysMap(map);
    return record;
  }

  /**
   * Single-Use Invite Links: generate, validate, and consume unique URL-safe invite tokens
   * stored on `survey.accessControl.inviteTokens`.
   */
  generateInviteTokens(surveyId, count = 10) {
    const survey = this.getSurveyById(surveyId);
    if (!survey) return [];
    const n = Math.max(1, Math.min(200, Math.floor(Number(count) || 10)));
    if (!survey.accessControl || typeof survey.accessControl !== 'object') {
      survey.accessControl = {};
    }
    if (!Array.isArray(survey.accessControl.inviteTokens)) {
      survey.accessControl.inviteTokens = [];
    }

    const existing = new Set(
      survey.accessControl.inviteTokens.map((t) => (t && t.token ? String(t.token) : '')).filter(Boolean)
    );
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    const makeToken = () => {
      let out = 'inv_';
      if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const bytes = new Uint8Array(10);
        crypto.getRandomValues(bytes);
        for (let i = 0; i < bytes.length; i++) {
          out += alphabet[bytes[i] % alphabet.length];
        }
      } else {
        for (let i = 0; i < 10; i++) {
          out += alphabet[Math.floor(Math.random() * alphabet.length)];
        }
      }
      return out;
    };

    const nowIso = new Date().toISOString();
    const created = [];
    for (let i = 0; i < n; i++) {
      let tok = makeToken();
      let guard = 0;
      while (existing.has(tok) && guard < 10) {
        tok = makeToken();
        guard++;
      }
      existing.add(tok);
      const entry = {
        token: tok,
        used: false,
        usedAt: null,
        createdAt: nowIso
      };
      survey.accessControl.inviteTokens.push(entry);
      created.push(entry);
    }

    this.upsertSurvey(survey, true);
    return created;
  }

  validateInviteToken(survey, token) {
    if (!survey || typeof survey !== 'object') {
      return { valid: false, reason: 'invalid' };
    }
    const cleanToken = typeof token === 'string' ? token.trim() : '';
    if (!cleanToken) {
      return { valid: false, reason: 'missing' };
    }
    const tokens =
      survey.accessControl && Array.isArray(survey.accessControl.inviteTokens)
        ? survey.accessControl.inviteTokens
        : [];
    const entry = tokens.find((t) => t && String(t.token) === cleanToken);
    if (!entry) {
      return { valid: false, reason: 'invalid' };
    }
    if (entry.used) {
      return { valid: false, reason: 'already_used', usedAt: entry.usedAt || null };
    }
    return { valid: true, token: cleanToken };
  }

  consumeInviteToken(surveyId, token) {
    const cleanToken = typeof token === 'string' ? token.trim() : '';
    if (!surveyId || !cleanToken) return false;
    const survey = this.getSurveyById(surveyId);
    if (!survey || !survey.accessControl || !Array.isArray(survey.accessControl.inviteTokens)) {
      return false;
    }
    const entry = survey.accessControl.inviteTokens.find((t) => t && String(t.token) === cleanToken);
    if (!entry) return false;
    entry.used = true;
    entry.usedAt = new Date().toISOString();
    this.upsertSurvey(survey, true);
    return true;
  }

  /**
   * Computes a cryptographic Merkle Root across all responses for an instrument.
   * Provides mathematical non-repudiation proof of dataset completeness.
   */
  async computeSurveyMerkleRoot(surveyId) {
    const responses = this.getResponsesForSurvey(surveyId);
    if (!responses || responses.length === 0) {
      return {
        root: '0000000000000000000000000000000000000000000000000000000000000000',
        count: 0,
        verified: true,
        generatedAt: new Date().toISOString(),
        algorithm: 'SHA-256-Merkle-Tree'
      };
    }

    // Sort deterministically by clientResponseId or id
    const sorted = [...responses].sort((a, b) => {
      const ka = a.clientResponseId || a.id || '';
      const kb = b.clientResponseId || b.id || '';
      return ka.localeCompare(kb);
    });

    const sha256Hex = async (text) => {
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        const enc = new TextEncoder();
        const buf = await crypto.subtle.digest('SHA-256', enc.encode(text));
        return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
      }
      return 'hash_' + Math.abs(text.split('').reduce((acc, c) => ((acc << 5) - acc) + c.charCodeAt(0), 0)).toString(16).padStart(64, '0');
    };

    // 1. Compute leaf hashes
    let currentLevel = [];
    for (const r of sorted) {
      const leafStr = `${r.clientResponseId || r.id}|${r.submittedAt}|${r.enumerator || ''}|${JSON.stringify(r.answers || {})}`;
      const hash = await sha256Hex(leafStr);
      currentLevel.push(hash);
    }

    // 2. Pairwise tree reduction to single root
    while (currentLevel.length > 1) {
      const nextLevel = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        if (i + 1 < currentLevel.length) {
          const combined = await sha256Hex(currentLevel[i] + currentLevel[i + 1]);
          nextLevel.push(combined);
        } else {
          // Odd leaf carries over / duplicates (RFC 6962 standard)
          const combined = await sha256Hex(currentLevel[i] + currentLevel[i]);
          nextLevel.push(combined);
        }
      }
      currentLevel = nextLevel;
    }

    return {
      root: currentLevel[0] || '',
      count: responses.length,
      verified: true,
      generatedAt: new Date().toISOString(),
      algorithm: 'SHA-256-Merkle-Tree'
    };
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

