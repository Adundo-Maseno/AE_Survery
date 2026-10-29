/**
 * ============================================================================
 * Agri Experience Survey — Internationalization & Multi-Language Engine
 * Supports:
 * - English (EN)
 * - Kiswahili / Swahili (SW)
 * - Français / French (FR)
 * Covers:
 * - Survey Titles, Descriptions, Section Headers
 * - Questions, Help Text, Options, Placeholders, Matrix Dimensions & Units
 * - Field App & Admin Studio UI Controls, Receipts, and Validation Messages
 * ============================================================================
 */

(function (root) {
  'use strict';

  const LANGUAGES = [
    { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'sw', label: 'Swahili', native: 'Kiswahili', flag: '🇰🇪' },
    { code: 'fr', label: 'French', native: 'Français', flag: '🇫🇷' }
  ];

  const UI_STRINGS = {
    en: {
      fieldCollector: 'AE Field App',
      fieldAppBadge: 'Field App',
      adminStudio: 'Admin Studio',
      adminStudioDesc: 'Enter Supervisor PIN to access Survey Builder & Analytics',
      verifyPin: 'Verify Supervisor PIN',
      enterPin: 'Security PIN',
      openAdmin: 'Open Admin',
      cancel: 'Cancel',
      close: 'Close',
      section: 'Section',
      of: 'of',
      draftSaved: 'Draft saved',
      nextSection: 'Next Section',
      prevSection: 'Previous Section',
      submitSurvey: 'Submit & Verify Receipt',
      nextInterview: 'Next Interview',
      interviewLogged: 'Interview Record Logged',
      interviewLoggedSub: 'Data saved to local IndexedDB storage. Ready for Google Sheets synchronization.',
      receiptId: 'Receipt ID',
      submittedAt: 'Submitted At',
      enumerator: 'Enumerator',
      duration: 'Duration',
      gpsCoordinates: 'GPS Coordinates',
      offlineQueueStatus: 'Cloud Sync Status',
      storedLocallyPending: 'Stored locally in IndexedDB (Pending Sync)',
      syncedDirectly: 'Synced directly with Google Sheets',
      selectOption: 'Select an option…',
      typeAnswer: 'Type your answer…',
      enterFieldNotes: 'Enter detailed field notes…',
      selectOrSearch: 'Select or search…',
      otherSpecify: 'Other (please specify)…',
      captureGps: 'Capture Live Satellite GPS',
      gpsCapturing: 'Accessing satellite receiver…',
      gpsLocked: 'Locked',
      gpsOfflineNote: 'Captures offline via tablet satellite receiver',
      bagConverterLabel: '90kg bag converter:',
      bags: 'bags',
      range: 'Range:',
      reviewErrors: 'Please review the highlighted required questions.',
      selectActiveSurvey: 'Select Survey to Administer',
      switchEnumerator: 'Switch Active Enumerator',
      offlineQueue: 'Offline queue',
      online: 'Online',
      syncSheets: 'Sync Sheets',
      switchLanguage: 'Language',
      selectLanguage: 'Select Language'
    },
    sw: {
      fieldCollector: 'Mkusanyaji wa Nyanjani wa AE',
      fieldAppBadge: 'Programu ya Nyanjani',
      adminStudio: 'Studio ya Wasimamizi',
      adminStudioDesc: 'Weka PIN ya msimamizi kufikia Mjenzi wa Utafiti na Uchambuzi',
      verifyPin: 'Thibitisha PIN ya Msimamizi',
      enterPin: 'Weka PIN ya Usalama',
      openAdmin: 'Fungua Studio',
      cancel: 'Ghairi',
      close: 'Funga',
      section: 'Sehemu',
      of: 'kati ya',
      draftSaved: 'Rasimu imehifadhiwa',
      nextSection: 'Sehemu Inayofuata',
      prevSection: 'Sehemu Iliyopita',
      submitSurvey: 'Wasilisha na Uhakiki Stakabadhi',
      nextInterview: 'Mahojiano Mapya',
      interviewLogged: 'Mahojiano Yamehifadhiwa Kikamilifu',
      interviewLoggedSub: 'Takwimu zimehifadhiwa kwenye kumbukumbu ya kifaa (IndexedDB). Ziko tayari kusawazishwa kwenye Google Sheets.',
      receiptId: 'Nambari ya Stakabadhi',
      submittedAt: 'Muda wa Kuwasilisha',
      enumerator: 'Mtafiti',
      duration: 'Muda Uliotumika',
      gpsCoordinates: 'Majira ya GPS',
      offlineQueueStatus: 'Hali ya Usawazishaji',
      storedLocallyPending: 'Imehifadhiwa ndani ya kifaa (Inasubiri mtandao)',
      syncedDirectly: 'Imesawazishwa moja kwa moja na Google Sheets',
      selectOption: 'Chagua jibu…',
      typeAnswer: 'Andika jibu lako…',
      enterFieldNotes: 'Andika maelezo ya kina ya nyanjani…',
      selectOrSearch: 'Chagua au tafuta…',
      otherSpecify: 'Nyingine (fafanua tafadhali)…',
      captureGps: 'Nasa Majira ya GPS ya Satelaiti',
      gpsCapturing: 'Inatafuta mawimbi ya satelaiti…',
      gpsLocked: 'Imenaswa',
      gpsOfflineNote: 'Hufanya kazi bila mtandao kupitia kigunduzi cha satelaiti cha kifaa',
      bagConverterLabel: 'Kigeuzi cha magunia ya kilo 90:',
      bags: 'magunia',
      range: 'Masafa:',
      reviewErrors: 'Tafadhali kagua na ujaze maswali ya lazima yaliyoangaziwa.',
      selectActiveSurvey: 'Chagua Utafiti wa Kuendesha',
      switchEnumerator: 'Badilisha Mtafiti wa Nyanjani',
      offlineQueue: 'Foleni ya nje ya mtandao',
      online: 'Mtandaoni',
      syncSheets: 'Sawazisha na Majedwali',
      switchLanguage: 'Lugha',
      selectLanguage: 'Chagua Lugha'
    },
    fr: {
      fieldCollector: 'Collecteur de Terrain AE',
      fieldAppBadge: 'App de Terrain',
      adminStudio: 'Studio d’Administration',
      adminStudioDesc: 'Entrez le code PIN superviseur pour accéder au Concepteur et aux Analyses',
      verifyPin: 'Vérifier le Code PIN Superviseur',
      enterPin: 'Code PIN de Sécurité',
      openAdmin: 'Ouvrir Studio',
      cancel: 'Annuler',
      close: 'Fermer',
      section: 'Section',
      of: 'sur',
      draftSaved: 'Brouillon enregistré',
      nextSection: 'Section Suivante',
      prevSection: 'Section Précédente',
      submitSurvey: 'Soumettre et Vérifier le Reçu',
      nextInterview: 'Nouvel Entretien',
      interviewLogged: 'Entretien Enregistré avec Succès',
      interviewLoggedSub: 'Données enregistrées dans la base locale IndexedDB. Prêtes pour la synchronisation Google Sheets.',
      receiptId: 'N° de Reçu',
      submittedAt: 'Heure de Soumission',
      enumerator: 'Enquêteur',
      duration: 'Durée',
      gpsCoordinates: 'Coordonnées GPS',
      offlineQueueStatus: 'Statut de Synchronisation',
      storedLocallyPending: 'Stocké localement sur l’appareil (En attente réseau)',
      syncedDirectly: 'Synchronisé directement avec Google Sheets',
      selectOption: 'Sélectionnez une option…',
      typeAnswer: 'Tapez votre réponse…',
      enterFieldNotes: 'Entrez des notes détaillées de terrain…',
      selectOrSearch: 'Sélectionnez ou recherchez…',
      otherSpecify: 'Autre (veuillez préciser)…',
      captureGps: 'Capturer le GPS Satellite',
      gpsCapturing: 'Connexion au récepteur satellite…',
      gpsLocked: 'Verrouillé',
      gpsOfflineNote: 'Fonctionne hors ligne grâce au récepteur satellite de la tablette',
      bagConverterLabel: 'Convertisseur sacs de 90 kg :',
      bags: 'sacs',
      range: 'Plage :',
      reviewErrors: 'Veuillez vérifier les questions obligatoires surlignées.',
      selectActiveSurvey: 'Choisir l’Enquête à Administrer',
      switchEnumerator: 'Changer d’Enquêteur Actif',
      offlineQueue: 'File hors ligne',
      online: 'En ligne',
      syncSheets: 'Synchroniser Google Sheets',
      switchLanguage: 'Langue',
      selectLanguage: 'Sélectionner la Langue'
    }
  };

  const SURVEY_TRANSLATIONS = {
    // 1. Maize Adoption Survey 2026
    srv_maize_2026: {
      sw: {
        title: 'Utafiti wa Wakulima Wadogo wa Mahindi Yanayovumilia Ukame na Mbegu Bora 2026',
        description: 'Utafiti wa nyanjani unaotathmini ufanisi wa mbegu bora za mahindi, viwango vya uotaji, mbolea, na kiwango cha kuridhika cha wakulima (NPS) kote kauntini.',
        pages: {
          page_1: {
            title: 'Sehemu 1: Wasifu wa Shamba, Aina ya Mbegu na Majira ya GPS',
            description: 'Rekodi taarifa za msingi za shamba la mkulima, chanzo kikuu cha mbegu, na eneo la GPS kabla ya kukusanya takwimu za mavuno.'
          },
          page_2: {
            title: 'Sehemu 2: Ufanisi wa Kilimo, Makadirio ya Mavuno na Tathmini ya Mkulima (NPS)',
            description: 'Tathmini sifa za mbegu zilizopandwa, mavuno yaliyopatikana kwa ekari, na kiwango cha mkulima kupendekeza mbegu hiyo.'
          }
        },
        questions: {
          q_county: {
            title: 'Je, shamba hili liko katika kaunti au eneo gani la kikilimo?',
            helpText: 'Chagua kaunti ya kiutawala ambapo mahojiano haya yanafanyika.',
            options: [
              'Kaunti ya Nakuru (Nyanda za Juu za Bonde la Ufa)',
              'Kaunti ya Machakos (Ukanda wa Mashariki Nusu-Ukame)',
              'Kaunti ya Kakamega (Magharibi Mvua ya Kutosha)',
              'Kaunti ya Meru (Nyanda za Kati)',
              'Kaunti ya Uasin Gishu (Kikapu cha Mahindi)',
              'Kaunti ya Kitui (Kame na Nusu-Kame)'
            ]
          },
          q_seed_variety: {
            title: 'Ni aina gani kuu ya mbegu ya mahindi uliyopanda msimu wa mvua kuu?',
            helpText: 'Omba kukagua pakiti ya mbegu ikiwa mkulima bado anayo.',
            options: [
              'DH04 (Chotara Inayovumilia Ukame)',
              'KH500-43A (Chotara ya Nyanda za Juu)',
              'SC Duma 43 (Inayokomaa Mapema)',
              'DK 8031 (Ukomavu wa Kati)',
              'Mbegu ya Kienyeji Iliyohifadhiwa / Kuzalishwa Shambani'
            ]
          },
          q_inputs_used: {
            title: 'Ni pembejeo gani za kurutubisha udongo au kukinga mimea zilizotumika shambani humu?',
            helpText: 'Chagua pembejeo zote zilizotumika wakati wa kupanda na kukuzia.',
            options: [
              'Mbolea ya Kupandia ya DAP / NPK',
              'Mbolea ya Kukuzia ya CAN / Urea',
              'Mbolea ya Samadi / Mboji',
              'Dawa ya Kudhibiti Funza wa Mahindi (Fall Armyworm)',
              'Virutubisho vya Biolojia / Rhizobium',
              'Hakuna (Udongo Bila Mbolea)'
            ]
          },
          q_gps_plot: {
            title: 'Nasa Majira ya GPS ya Shamba la Mkulima na Alama ya Kijiji',
            helpText: 'Simama kwenye ukingo wa shamba kuu la mahindi ili kupata usahihi wa ±10m wa satelaiti.'
          },
          q_trait_matrix: {
            title: 'Tathmini ubora wa aina ya mbegu uliyopanda kulingana na sifa zifuatazo za kilimo:',
            helpText: 'Soma kila sifa kwa sauti na urekodi tathmini ya mkulima.',
            rows: [
              'Ulinganifu wa uotaji (kuota ndani ya siku 7)',
              'Kustahimili ukame wa katikati ya msimu',
              'Ustahimilivu dhidi ya kuoza kwa mahindi na wadudu ghalani',
              'Uzito wa punje na ubora wa unga wakati wa kusaga'
            ],
            columns: ['Duni', 'Wastani', 'Nzuri', 'Bora Kabisa']
          },
          q_yield_kg: {
            title: 'Makadirio ya Mavuno ya Mahindi Yaliyovunwa kwa Ekari Moja',
            helpText: 'Geuza magunia ya kilo 90 kuwa kilo (mfano: magunia 15 = kilo 1,350 kwa ekari).'
          },
          q_dealer_rating: {
            title: 'Je, umeridhika kwa kiwango gani na umbali na huduma ya duka lako la karibu la pembejeo?',
            helpText: 'Nyota 1 = Hajaridhika Kabisa, Nyota 5 = Ameridhika Sana'
          },
          q_nps_seed: {
            title: 'Kwenye mizani ya 0 hadi 10, una uwezekano gani wa kuipendekeza mbegu hii iliyoidhinishwa kwa wakulima wengine msimu ujao?',
            helpText: '0 = Haiwezekani kabisa, 10 = Inawezekana sana'
          },
          q_field_notes: {
            title: 'Maoni ya Mtafiti na Maoni ya Mkulima kuhusu Upatikanaji wa Mbegu',
            helpText: 'Taja mapendekezo ya ukubwa wa pakiti (2kg dhidi ya 10kg), hofu ya mbegu bandia, au changamoto za mikopo.',
            placeholder: 'Weka maelezo ya kina ya mkulima na mtazamo wa mtafiti hapa…'
          }
        }
      },
      fr: {
        title: 'Enquête 2026 sur l’Adoption du Maïs Tolérant à la Sécheresse et des Semences',
        description: 'Évaluation sur le terrain des performances variétales, des taux de germination, de la fertilisation et du score de recommandation des agriculteurs (NPS).',
        pages: {
          page_1: {
            title: 'Section 1 : Profil de la Parcelle, Variété de Semence & Coordonnées GPS',
            description: 'Enregistrez les métadonnées de la parcelle, la source des semences et la localisation GPS avant de saisir les rendements.'
          },
          page_2: {
            title: 'Section 2 : Performance Agronomique, Rendement Récolté et Score NPS',
            description: 'Évaluez les caractéristiques de la variété, le rendement récolté par acre et le niveau de recommandation du producteur.'
          }
        },
        questions: {
          q_county: {
            title: 'Dans quel comté ou zone agro-écologique cette parcelle est-elle située ?',
            helpText: 'Sélectionnez le comté administratif où se déroule l’entretien.',
            options: [
              'Comté de Nakuru (Hautes Terres de la Vallée du Rift)',
              'Comté de Machakos (Est Semi-Aride)',
              'Comté de Kakamega (Ouest Humide de Transition)',
              'Comté de Meru (Moyenne Altitude)',
              'Comté d’Uasin Gishu (Grenier à Maïs)',
              'Comté de Kitui (Terres Arides et Semi-Arides)'
            ]
          },
          q_seed_variety: {
            title: 'Quelle variété principale de maïs avez-vous semée pendant la saison principale ?',
            helpText: 'Demandez à vérifier l’étiquette de l’emballage si le producteur la possède encore.',
            options: [
              'DH04 (Hybride Tolérant à la Sécheresse)',
              'KH500-43A (Hybride des Hautes Terres)',
              'SC Duma 43 (Précocité Élevée)',
              'DK 8031 (Maturité Moyenne)',
              'Semence Fermière Recyclée / Locale'
            ]
          },
          q_inputs_used: {
            title: 'Quels intrants de fertilité ou de protection des cultures ont été appliqués sur cette parcelle ?',
            helpText: 'Sélectionnez tous les intrants utilisés au semis et en couverture.',
            options: [
              'Engrais de Semis DAP / NPK',
              'Engrais de Couverture CAN / Urée',
              'Compost / Fumier de Ferme',
              'Traitement Biologique/Chimique Chenille Légionnaire',
              'Inoculant Rhizobium / Bio-stimulant Certifié',
              'Aucun (Sol Non Amendé)'
            ]
          },
          q_gps_plot: {
            title: 'Capturer les Coordonnées GPS de la Parcelle et Repère du Village',
            helpText: 'Tenez-vous en bordure du champ principal pour obtenir une précision satellite de ±10m.'
          },
          q_trait_matrix: {
            title: 'Évaluez la variété semée selon les critères agronomiques suivants :',
            helpText: 'Lisez chaque critère à voix haute et notez l’avis du producteur.',
            rows: [
              'Uniformité de la germination (levée en 7 jours)',
              'Tolérance aux périodes de sécheresse en cours de saison',
              'Résistance à la pourriture des épis et aux ravageurs de stockage',
              'Poids spécifique du grain et qualité de la farine'
            ],
            columns: ['Médiocre', 'Passable', 'Bon', 'Excellent']
          },
          q_yield_kg: {
            title: 'Rendement Estimé de Maïs Récolté par Acre',
            helpText: 'Convertissez les sacs de 90 kg en kilogrammes (ex : 15 sacs = 1 350 kg/acre).'
          },
          q_dealer_rating: {
            title: 'Quel est votre niveau de satisfaction concernant la proximité et le service de votre distributeur d’intrants ?',
            helpText: '1 étoile = Très insatisfait, 5 étoiles = Très satisfait'
          },
          q_nps_seed: {
            title: 'Sur une échelle de 0 à 10, quelle est la probabilité que vous recommandiez cette semence certifiée à vos voisins la saison prochaine ?',
            helpText: '0 = Pas du tout probable, 10 = Extrêmement probable'
          },
          q_field_notes: {
            title: 'Observations de l’Enquêteur et Retours du Producteur sur la Disponibilité des Semences',
            helpText: 'Notez les préférences de taille d’emballage (2kg vs 10kg), craintes de fausses semences ou contraintes de crédit.',
            placeholder: 'Saisissez les observations de terrain et commentaires du producteur…'
          }
        }
      }
    },

    // 2. Agro-Dealer Audit Survey 2026
    srv_agrodealer_2026: {
      sw: {
        title: 'Ukaguzi wa Hisa za Pembejeo za Maduka ya Kilimo, Ukubwa wa Pakiti na Bei 2026',
        description: 'Ukaguzi wa robo mwaka wa maduka ya pembejeo za kilimo vijijini unaopima hisa za mbegu zilizoidhinishwa, ubora wa uhifadhi, na mifumo ya malipo ya kidijitali.',
        pages: {
          page_dealer_1: {
            title: 'Uhakiki wa Hisa za Muuzaji na Bei za Pembejeo',
            description: 'Kamilisha kwenye kaunta ya duka la kilimo pamoja na mmiliki au mhudumu.'
          }
        },
        questions: {
          qd_shop_type: {
            title: 'Je, duka hili la pembejeo za kilimo limeainishwa katika kundi gani?',
            helpText: 'Thibitisha leseni ya KEPHIS / PCPB iliyoonyeshwa ukutani.',
            options: [
              'Kituo cha Jumla na Rejareja cha Pembejeo',
              'Duka Huru la Rejareja la Mifugo na Kilimo Kijijini (Agro-Vet)',
              'Duka la Pembejeo la Chama cha Ushirika',
              'Wakala wa Kijiji / Muuzaji wa Hatua ya Mwisho'
            ]
          },
          qd_stock_items: {
            title: 'Ni aina gani za mbegu zilizoidhinishwa zilizopo dukani leo kwa vitendo?',
            helpText: 'Kagua rafu na chumba cha kuhifadhia kwa macho.',
            options: [
              'Mbegu za Chotara za Mahindi Zinazovumilia Ukame (2kg / 10kg)',
              'Maharagwe Yaliyoidhinishwa (Nyota / Angaza)',
              'Kunde, Choko na Mtama',
              'Mbegu Mbalimbali za Mboga (Pakiti Maalumu zisizoingia Hewa)',
              'Mbegu za Malisho na Nyasi za Mifugo (Brachiaria / Boma Rhodes)'
            ]
          },
          qd_price_2kg: {
            title: 'Bei ya Sasa ya Rejareja kwa Pakiti ya Kilo 2 ya Mbegu Iliyoidhinishwa ya Mahindi',
            helpText: 'Rekodi bei kwa Shilingi ya Kenya (KES).'
          },
          qd_storage_rating: {
            title: 'Alama ya Ukaguzi wa Mtafiti: Mzunguko wa Hewa Ghalani na Utumiaji wa Paleti',
            helpText: 'Nyota 5 = Imewekwa juu ya mbao (paleti), paa kavu, mbali na kemikali hatarishi.'
          },
          qd_gps: {
            title: 'Majira ya GPS ya Mlango wa Duka la Pembejeo',
            helpText: 'Nasa ukiwa nje ya mlango wa duka ili kupata mawimbi safi ya satelaiti.'
          }
        }
      },
      fr: {
        title: 'Audit des Stocks des Distributeurs Agricoles, Formats d’Emballage et Prix 2026',
        description: 'Audit trimestriel des points de vente ruraux évaluant les stocks de semences certifiées, la conformité du stockage et l’adoption des paiements mobiles.',
        pages: {
          page_dealer_1: {
            title: 'Vérification des Stocks et des Prix chez le Détaillant',
            description: 'À compléter au comptoir avec le propriétaire ou le gérant du magasin.'
          }
        },
        questions: {
          qd_shop_type: {
            title: 'Quelle est la classification de ce point de vente d’intrants agricoles ?',
            helpText: 'Vérifiez l’affichage des agréments et licences officielles.',
            options: [
              'Grossiste & Détaillant d’Intrants Agricoles',
              'Détaillant Indépendant Rural (Agro-Vétérinaire)',
              'Magasin d’Intrants d’une Coopérative Agricole',
              'Agent Villageois / Détaillant du Dernier Kilomètre'
            ]
          },
          qd_stock_items: {
            title: 'Quelles catégories de semences certifiées sont physiquement en stock aujourd’hui ?',
            helpText: 'Confirmez visuellement les étagères ou l’entrepôt.',
            options: [
              'Hybrides de Maïs Tolérants à la Sécheresse (2kg / 10kg)',
              'Haricots Communs Certifiés (Nyota / Angaza)',
              'Niébé, Pois Masque & Sorgho',
              'Semences Maraîchères Variées (Sachets Hermétiques)',
              'Semences Fourragères et Pastorales (Brachiaria / Boma Rhodes)'
            ]
          },
          qd_price_2kg: {
            title: 'Prix de Vente Actuel au Détail pour un Sachet de 2 kg de Maïs Certifié',
            helpText: 'Enregistrez le prix en Shillings Kényans (KES).'
          },
          qd_storage_rating: {
            title: 'Score d’Audit de l’Enquêteur : Ventilation du Stockage et Utilisation de Palettes',
            helpText: '5 étoiles = Palettes en bois surélevées, toiture étanche, séparé des produits chimiques toxiques.'
          },
          qd_gps: {
            title: 'Coordonnées GPS de la Façade du Magasin d’Intrants',
            helpText: 'Capturez à l’extérieur de l’entrée pour un verrouillage satellite optimal.'
          }
        }
      }
    },

    // 3. Extension Pulse Survey
    srv_extension_pulse: {
      sw: {
        title: 'Maoni ya Wakulima kuhusu Siku ya Nyanjani na Mafunzo ya Mashamba ya Maonyesho',
        description: 'Utafiti wa haraka unaopima mafunzo ya wakulima, uwazi wa maonyesho ya kilimo, na ufanisi wa maafisa ugani.',
        pages: {
          page_ext_1: {
            title: 'Uzoefu wa Siku ya Nyanjani na Maarifa Yaliyopatikana',
            description: 'Utafiti mfupi wa dakika 2 kwa wakulima waliohudhuria mashamba ya maonyesho.'
          }
        },
        questions: {
          qe_session: {
            title: 'Ni kituo gani cha maonyesho kilichokuwa na manufaa zaidi kwa shamba lako leo?',
            helpText: 'Chagua kipindi kilichoongoza kwa manufaa.',
            options: [
              'Nafasi ya Upandaji na Upimaji Sahihi wa Mbolea ya Kupandia',
              'Ulinganisho wa Aina za Mbegu Zinazovumilia Ukame Pamoja',
              'Uhifadhi wa Mahindi Baada ya Mavuno (Mifuko ya PICS Isiyoingiza Hewa)',
              'Upimaji wa Tindikali ya Udongo (pH) na Utumiaji wa Chokaa'
            ]
          },
          qe_nps: {
            title: 'Kwenye mizani ya 0 hadi 10, una uwezekano gani wa kumwalika mkulima mwingine kutoka kijijini kwako kwenye Siku ya Nyanjani ijayo ya Agri Experience?',
            helpText: '0 = Haiwezekani, 10 = Inawezekana sana'
          },
          qe_takeaway: {
            title: 'Ni hatua gani kuu ya kwanza unayopanga kubadilisha kwenye shamba lako msimu ujao?',
            helpText: 'Sentensi moja fupi.',
            placeholder: 'Mfano: Kuacha kutumia mbegu iliyohifadhiwa na kuanza kupanda chotara ya DH04…'
          }
        }
      },
      fr: {
        title: 'Retour d’Expérience sur la Journée Champêtre et la Parcelle de Démonstration',
        description: 'Sondage rapide évaluant les acquis des agriculteurs, la clarté des démonstrations et l’efficacité des agents de vulgarisation.',
        pages: {
          page_ext_1: {
            title: 'Expérience de la Journée Champêtre & Connaissances Acquises',
            description: 'Enquête de sortie rapide de 2 minutes pour les agriculteurs présents aux parcelles de démonstration.'
          }
        },
        questions: {
          qe_session: {
            title: 'Quelle station de démonstration a été la plus utile pour votre exploitation aujourd’hui ?',
            helpText: 'Sélectionnez la session principale.',
            options: [
              'Écartement des Semis & Calibrage de l’Engrais de Fond',
              'Comparaison Côte à Côte des Variétés Tolérantes à la Sécheresse',
              'Stockage Hermétique Post-Récolte (Sacs PICS)',
              'Analyse du pH du Sol & Démonstration de Chaulage'
            ]
          },
          qe_nps: {
            title: 'Sur une échelle de 0 à 10, quelle est la probabilité que vous invitiez un autre agriculteur de votre village à la prochaine Journée Champêtre Agri Experience ?',
            helpText: '0 = Peu probable, 10 = Extrêmement probable'
          },
          qe_takeaway: {
            title: 'Quelle est la pratique n°1 que vous prévoyez d’adopter sur votre parcelle la saison prochaine ?',
            helpText: 'Une courte phrase.',
            placeholder: 'Ex : Remplacer les semences fermières par la variété certifiée DH04…'
          }
        }
      }
    }
  };

  const COMMON_DICTIONARY = {
    // English -> Swahili / French terms
    'Yes': { sw: 'Ndiyo', fr: 'Oui' },
    'No': { sw: 'Hapana', fr: 'Non' },
    'Other': { sw: 'Nyingine', fr: 'Autre' },
    'Poor': { sw: 'Duni', fr: 'Médiocre' },
    'Fair': { sw: 'Wastani', fr: 'Passable' },
    'Good': { sw: 'Nzuri', fr: 'Bon' },
    'Excellent': { sw: 'Bora Kabisa', fr: 'Excellent' },
    'Male': { sw: 'Mwanaume', fr: 'Homme' },
    'Female': { sw: 'Mwanamke', fr: 'Femme' },
    'Smallholder': { sw: 'Mkulima Mdogo', fr: 'Petit Exploitant' },
    'Commercial': { sw: 'Kibiashara', fr: 'Commercial' },
    'Select one option.': { sw: 'Chagua jibu moja.', fr: 'Sélectionnez une option.' },
    'Select all that apply.': { sw: 'Chagua zote zinazohusika.', fr: 'Sélectionnez toutes les réponses applicables.' },
    'Choose from the list.': { sw: 'Chagua kutoka kwenye orodha.', fr: 'Choisissez dans la liste.' },
    'Enter numeric value.': { sw: 'Weka nambari.', fr: 'Entrez une valeur numérique.' },
    'Select calendar date.': { sw: 'Chagua tarehe ya kalenda.', fr: 'Sélectionnez une date.' },
    'Enter respondent name or ID…': { sw: 'Weka jina la mhojiwa au nambari…', fr: 'Entrez le nom ou l’identifiant…' },
    'Write detailed field notes…': { sw: 'Andika maelezo ya kina ya nyanjani…', fr: 'Rédigez des notes de terrain détaillées…' },
    'Which primary crop or seed variety did you plant this season?': {
      sw: 'Ni aina gani kuu ya zao au mbegu uliyopanda msimu huu?',
      fr: 'Quelle culture ou variété principale avez-vous semée cette saison ?'
    },
    'Which agronomic practices or inputs were applied on this plot?': {
      sw: 'Ni mazoea gani ya kilimo au pembejeo zilizotumika shambani humu?',
      fr: 'Quelles pratiques agronomiques ou intrants ont été appliqués sur cette parcelle ?'
    },
    'Select County / Administrative Ward': {
      sw: 'Chagua Kaunti / Kata ya Kiutawala',
      fr: 'Sélectionnez le Comté / Secteur Administratif'
    },
    'Total Harvested Yield per Acre': {
      sw: 'Jumla ya Mavuno Yaliyovunwa kwa Ekari',
      fr: 'Rendement Total Récolté par Acre'
    },
    'Capture Farm Plot GPS Coordinates': {
      sw: 'Nasa Majira ya GPS ya Shamba',
      fr: 'Capturer les Coordonnées GPS de la Parcelle'
    },
    'Date of Planting / Field Inspection': {
      sw: 'Tarehe ya Kupanda / Ukaguzi wa Shamba',
      fr: 'Date de Semis / Inspection au Champ'
    },
    'Farmer / Respondent Full Name or Household ID': {
      sw: 'Jina Kamili la Mkulima / Nambari ya Kaya',
      fr: 'Nom Complet du Producteur / ID du Foyer'
    },
    'Additional Enumerator Observations & Qualitative Feedback': {
      sw: 'Maoni ya Ziada ya Mtafiti na Taarifa za Ubora',
      fr: 'Observations Supplémentaires de l’Enquêteur & Retours Qualitatifs'
    },
    'How satisfied are you with the germination rate of this seed lot?': {
      sw: 'Umeridhika kwa kiwango gani na uotaji wa mbegu hizi?',
      fr: 'Quel est votre niveau de satisfaction concernant le taux de germination de ce lot de semences ?'
    },
    'On a scale of 0 to 10, how likely are you to recommend this seed variety to another farmer?': {
      sw: 'Kwenye mizani ya 0 hadi 10, una uwezekano gani wa kuipendekeza mbegu hii kwa mkulima mwingine?',
      fr: 'Sur une échelle de 0 à 10, quelle est la probabilité que vous recommandiez cette variété à un autre producteur ?'
    },
    'Rate the seed variety on each agronomic characteristic:': {
      sw: 'Tathmini aina ya mbegu kulingana na sifa zifuatazo za kilimo:',
      fr: 'Évaluez la variété selon chaque caractéristique agronomique :'
    },
    'Early germination vigor': { sw: 'Nguvu ya uotaji wa mapema', fr: 'Vigueur de germination précoce' },
    'Drought & dry-spell resilience': { sw: 'Ustahimilivu wa ukame na vipindi vikavu', fr: 'Résilience à la sécheresse et aux poches de sécheresse' },
    'Marketability of harvested grain': { sw: 'Uuzaji na ubora wa nafaka sokoni', fr: 'Commercialisation et qualité marchande du grain' },
    'Certified Hybrid Seed': { sw: 'Mbegu ya Chotara Iliyoidhinishwa', fr: 'Semences Hybrides Certifiées' },
    'Improved Open-Pollinated Variety (OPV)': { sw: 'Mbegu Iliyoboreshwa (OPV)', fr: 'Variété Améliorée à Pollinisation Libre (OPV)' },
    'Local Farm-Saved Seed': { sw: 'Mbegu ya Kienyeji Iliyohifadhiwa Shambani', fr: 'Semences Fermières Locales' },
    'Basal Planting Fertilizer (DAP/NPK)': { sw: 'Mbolea ya Kupandia (DAP/NPK)', fr: 'Engrais de Fond (DAP/NPK)' },
    'Top-Dressing Fertilizer (CAN/Urea)': { sw: 'Mbolea ya Kukuzia (CAN/Urea)', fr: 'Engrais de Couverture (CAN/Urée)' },
    'Organic Manure / Compost': { sw: 'Samadi ya Wanyama / Mboji', fr: 'Fumier Organique / Compost' },
    'Crop Rotation with Legumes': { sw: 'Mzunguko wa Mazao na Mikunde', fr: 'Rotation des Cultures avec des Légumineuses' },
    'Nakuru County': { sw: 'Kaunti ya Nakuru', fr: 'Comté de Nakuru' },
    'Machakos County': { sw: 'Kaunti ya Machakos', fr: 'Comté de Machakos' },
    'Kakamega County': { sw: 'Kaunti ya Kakamega', fr: 'Comté de Kakamega' },
    'Meru County': { sw: 'Kaunti ya Meru', fr: 'Comté de Meru' },
    'Uasin Gishu County': { sw: 'Kaunti ya Uasin Gishu', fr: 'Comté d’Uasin Gishu' }
  };

  const AEI18n = {
    LANGUAGES,

    getLanguage() {
      try {
        const stored = localStorage.getItem('ae_language');
        if (stored && (stored === 'en' || stored === 'sw' || stored === 'fr')) {
          return stored;
        }
      } catch (e) {}
      return 'en';
    },

    setLanguage(langCode) {
      const code = (langCode || 'en').toLowerCase();
      const valid = code === 'sw' || code === 'fr' ? code : 'en';
      try {
        localStorage.setItem('ae_language', valid);
      } catch (e) {}
      return valid;
    },

    t(key, langOverride = null) {
      const lang = langOverride || this.getLanguage();
      const bundle = UI_STRINGS[lang] || UI_STRINGS.en;
      if (bundle && bundle[key] !== undefined) {
        return bundle[key];
      }
      return UI_STRINGS.en[key] || key;
    },

    translateTerm(term, langOverride = null) {
      if (!term || typeof term !== 'string') return term;
      const lang = langOverride || this.getLanguage();
      if (lang === 'en') return term;
      const entry = COMMON_DICTIONARY[term.trim()];
      if (entry && entry[lang]) {
        return entry[lang];
      }
      return term;
    },

    /**
     * Produces a localized view of a Survey object for display.
     * Preserves all canonical question and page IDs, logic conditions, and values,
     * while localizing titles, descriptions, options, placeholders, and matrix rows/cols.
     */
    localizeSurvey(rawSurvey, langOverride = null) {
      if (!rawSurvey) return null;
      const lang = langOverride || this.getLanguage();
      if (lang === 'en') return rawSurvey;

      const surveyI18n = (SURVEY_TRANSLATIONS[rawSurvey.id] && SURVEY_TRANSLATIONS[rawSurvey.id][lang]) ||
        (rawSurvey.translations && rawSurvey.translations[lang]) || {};

      const localizedPages = (rawSurvey.pages || []).map((page) => {
        const pageI18n = (surveyI18n.pages && surveyI18n.pages[page.id]) || {};
        const localizedQuestions = (page.questions || []).map((q) => {
          const qI18n = (surveyI18n.questions && surveyI18n.questions[q.id]) ||
            (q.translations && q.translations[lang]) || {};

          let translatedOptions = q.options;
          if (Array.isArray(qI18n.options) && qI18n.options.length > 0) {
            translatedOptions = qI18n.options;
          } else if (Array.isArray(q.options)) {
            translatedOptions = q.options.map((opt) => this.translateTerm(opt, lang));
          }

          let translatedRows = q.rows;
          if (Array.isArray(qI18n.rows)) {
            translatedRows = qI18n.rows;
          }

          let translatedColumns = q.columns;
          if (Array.isArray(qI18n.columns)) {
            translatedColumns = qI18n.columns;
          } else if (Array.isArray(q.columns)) {
            translatedColumns = q.columns.map((col) => this.translateTerm(col, lang));
          }

          return {
            ...q,
            title: qI18n.title || q.title,
            helpText: qI18n.helpText !== undefined ? qI18n.helpText : q.helpText,
            placeholder: qI18n.placeholder !== undefined ? qI18n.placeholder : q.placeholder,
            options: translatedOptions,
            rows: translatedRows,
            columns: translatedColumns,
            _canonicalOptions: q.options || []
          };
        });

        return {
          ...page,
          title: pageI18n.title || page.title,
          description: pageI18n.description !== undefined ? pageI18n.description : page.description,
          questions: localizedQuestions
        };
      });

      return {
        ...rawSurvey,
        title: surveyI18n.title || rawSurvey.title,
        description: surveyI18n.description !== undefined ? surveyI18n.description : rawSurvey.description,
        pages: localizedPages,
        _activeLang: lang
      };
    },

    translatePhrase(phrase, lang = 'sw') {
      if (!phrase || typeof phrase !== 'string') return phrase;
      if (lang === 'en') return phrase;
      const trimmed = phrase.trim();
      if (COMMON_DICTIONARY[trimmed] && COMMON_DICTIONARY[trimmed][lang]) {
        return COMMON_DICTIONARY[trimmed][lang];
      }
      return phrase;
    },

    /**
     * Auto-translates a survey's title, description, sections, questions, and options
     * into the specified target language ('sw' or 'fr') using the agricultural dictionary.
     */
    autoTranslateSurvey(survey, targetLang = 'sw') {
      if (!survey) return null;
      if (!survey.translations) survey.translations = {};
      if (!survey.translations[targetLang]) survey.translations[targetLang] = { pages: {}, questions: {} };

      const trans = survey.translations[targetLang];
      if (!trans.pages) trans.pages = {};
      if (!trans.questions) trans.questions = {};

      if (!trans.title) {
        trans.title = this.translatePhrase(survey.title, targetLang);
      }
      if (!trans.description && survey.description) {
        trans.description = this.translatePhrase(survey.description, targetLang);
      }

      (survey.pages || []).forEach((page, pIdx) => {
        if (!trans.pages[page.id]) trans.pages[page.id] = {};
        const pTrans = trans.pages[page.id];
        if (!pTrans.title) {
          pTrans.title = this.translatePhrase(page.title, targetLang) || `${this.t('section', targetLang)} ${pIdx + 1}`;
        }
        if (!pTrans.description && page.description) {
          pTrans.description = this.translatePhrase(page.description, targetLang);
        }

        (page.questions || []).forEach((q) => {
          if (!trans.questions[q.id]) trans.questions[q.id] = {};
          const qTrans = trans.questions[q.id];
          if (!qTrans.title) qTrans.title = this.translatePhrase(q.title, targetLang);
          if (!qTrans.helpText && q.helpText) qTrans.helpText = this.translatePhrase(q.helpText, targetLang);
          if (Array.isArray(q.options) && (!qTrans.options || qTrans.options.length === 0)) {
            qTrans.options = q.options.map((opt) => this.translatePhrase(opt, targetLang));
          }
          if (Array.isArray(q.rows) && (!qTrans.rows || qTrans.rows.length === 0)) {
            qTrans.rows = q.rows.map((row) => this.translatePhrase(row, targetLang));
          }
          if (Array.isArray(q.columns) && (!qTrans.columns || qTrans.columns.length === 0)) {
            qTrans.columns = q.columns.map((col) => this.translatePhrase(col, targetLang));
          }
        });
      });

      return survey;
    },

    /**
     * Renders a clean segmented language picker (EN · SW · FR) for headers or toolbars.
     * @param {string} currentLang - Active language code ('en' | 'sw' | 'fr')
     * @param {string} onSelectCallbackExpr - JavaScript expression to invoke, e.g. "AEFieldApp.setLanguage"
     * @param {string} theme - 'dark' (for canopy headers) | 'light' (for white surfaces)
     */
    renderLanguageSwitch(currentLang, onSelectCallbackExpr = 'AEFieldApp.setLanguage', theme = 'dark') {
      const isDark = theme === 'dark';
      const containerClass = isDark
        ? 'h-8 p-0.5 rounded-[6px] bg-white/10 flex items-center text-xs font-semibold'
        : 'h-8 p-0.5 rounded-[6px] bg-[#F8F9F8] border border-[#CFD5D0] flex items-center text-xs font-semibold';

      return `
        <div class="${containerClass}" role="group" aria-label="Language Selector">
          ${LANGUAGES.map((l) => {
            const active = currentLang === l.code;
            const btnClass = active
              ? (isDark ? 'bg-[#247B50] text-white' : 'bg-[#141A17] text-white') + ' h-7 px-2 rounded-[4px] ae-press'
              : (isDark ? 'text-[#CFD5D0] hover:text-white' : 'text-[#525B56] hover:text-[#111613]') + ' h-7 px-2 rounded-[4px] ae-press';
            return `
              <button type="button"
                onclick="${onSelectCallbackExpr}('${l.code}')"
                aria-pressed="${active}"
                title="${l.native} (${l.label})"
                class="${btnClass} inline-flex items-center justify-center font-semibold text-[11px] tracking-wide">
                <span>${l.code.toUpperCase()}</span>
              </button>
            `;
          }).join('')}
        </div>
      `;
    }
  };

  root.AEI18n = AEI18n;
})(typeof window !== 'undefined' ? window : this);

