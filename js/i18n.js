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
    { code: 'fr', label: 'French', native: 'Français', flag: '🇫🇷' },
    { code: 'pt', label: 'Portuguese', native: 'Português', flag: '🇵🇹' }
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
    ,
      skipToSurvey: "Skip to survey questions",
      pwaBadge: "PWA",
      noActiveSurveyAssigned: "No Active Field Survey Assigned",
      loadingSurvey: "Loading survey…",
      noSurveyActive: "No Survey Active",
      synced: "Synced",
      autoSyncing: "Auto-syncing…",
      pending: "pending",
      syncTooltip: "Click to synchronize with Google Sheets",
      installApp: "Install App",
      installed: "Installed",
      addToHome: "Add to Home",
      focusMode: "Focus Mode",
      focus: "Focus",
      focusOn: "Focus On",
      sunlight: "Sunlight",
      sunlightMode: "Sunlight Mode",
      sunlightModeOn: "High Contrast ON",
      standardMode: "Standard",
      singleQuestion: "Single Q",
      sectionView: "Section View",
      offlineBundle: "Offline Bundle",
      saveHtmlFile: "Save .html file",
      adminAudit: "Admin Audit",
      supervisor: "Supervisor",
      supervisorPortal: "Supervisor Portal",
      operationsStudio: "Operations Studio",
      returnToOperations: "Return to Operations Studio",
      returnToSupervisor: "Return to Supervisor Portal",
      adminRequiresPin: "Admin Studio (Requires PIN)",
      dailyShiftPacing: "Daily Shift Pacing",
      assignedTaskQuota: "Assigned Task Quota",
      plots: "Plots",
      outboxQueued: "Outbox Queued",
      due: "Due",
      shiftTargetMet: "Shift Target Met",
      plotsToTarget: "plots to target",
      syncedToSheets: "Synced to Google Sheets",
      queuedLocally: "Queued locally in IndexedDB",
      clearForm: "Clear Form",
      clearFormConfirm: "Clear all entered answers on this form and restart?",
      formResetSuccess: "Form reset for a fresh interview.",
      continue: "Continue",
      previous: "Previous",
      required: "Required",
      optional: "Optional",
      completeSubmit: "Complete & Submit",
      conversationalFocus: "Conversational Focus",
      classicForm: "Classic Form",
      question: "Question",
      selectDeployedSurvey: "Select Deployed Survey",
      connectWifiPrompt: "Connect to Wi-Fi to sync with Google Sheets or ask your team lead to assign an active survey.",
      openCamera: "Open Camera / Upload Photo",
      retakePhoto: "Retake Photo",
      photoProofTitle: "Capture Crop Trial / Agro-Dealer Photo Proof",
      photoProofDesc: "Opens smartphone camera directly. Compressed automatically to ≤150KB for offline storage.",
      compressedJpeg: "Compressed JPEG",
      downscaledForIdb: "Downscaled to 1024px for IndexedDB",
      signPrompt: "Sign with finger, stylus, or mouse inside the box:",
      clearSignature: "Clear Signature",
      signatureHint: "Farmer or Agro-Dealer Signature",
      signatureVerified: "Digital consent signature verified and saved.",
      drawSignaturePrompt: "Draw signature with finger or pen",
      saveSignature: "Save Signature",
      launchBarcodeScanner: "Launch Camera Barcode Scanner",
      opticalBarcodeTitle: "Optical Camera Barcode / QR Scanner",
      opticalBarcodeDesc: "Scan KEPHIS security tag, seed lot barcode, or scratch-off serial number.",
      orTypeSerialManually: "OR TYPE SERIAL MANUALLY",
      kephisVerified: "KEPHIS Verified",
      unverifiedFormat: "Unverified Format",
      scanAnother: "Scan Another",
      verify: "Verify",
      startVoiceRecording: "Start Voice Recording",
      stopSaveRecording: "Stop & Save Recording",
      recordingAudioTestimony: "Recording Field Audio Testimony…",
      voiceTestimonySaved: "Farmer Voice Testimony Saved",
      deleteReRecord: "Delete / Re-record",
      audioTestimonyTitle: "Farmer Qualitative Audio Testimony",
      audioTestimonyDesc: "Record respondent verbal feedback or seed inspection notes (up to 120s).",
      evaluationDimension: "Evaluation Dimension",
      smallholderUnitCalc: "Smallholder Unit Calculator",
      tapToRate: "Tap to rate",
      stars: "stars",
      notLikely: "0 = Not at all likely",
      extremelyLikely: "10 = Extremely likely",
      clearGps: "Clear",
      acquiringGnss: "Acquiring GNSS Satellites…",
      searchingConstellation: "Searching constellation… (stay under open sky)",
      latitudeLabel: "Latitude (−90 to 90)",
      longitudeLabel: "Longitude (−180 to 180)",
      landmarkLabel: "Village / Trial Plot Landmark",
      noRosterItems: "No inventory / plot roster items added yet. Tap below to add a variety record.",
      addAnotherRosterItem: "+ Add Another Roster Item",
      remove: "Remove",
      reset: "Reset",
      fieldOperationsMenu: "Field Operations Menu",
      offlineToolsDesc: "Offline tools & operator controls",
      activeOperator: "Active Operator",
      switchOperator: "Switch Operator",
      lockTablet: "Lock Tablet",
      lockTabletDesc: "Lock Tablet for Field Enumerator (Exit Admin Session)",
      activeSurvey: "Active Survey",
      change: "Change",
      noSurveySelected: "No Survey Selected",
      displayLanguage: "Display Language",
      fieldToolsModes: "Field Tools & Modes",
      deviceHomeScreen: "Device Home Screen",
      addToDevice: "Add to Device",
      installPwa: "Install PWA",
      verifyEnumPin: "Verify Enumerator PIN",
      enter4DigitPin: "Enter 4-digit PIN for",
      securityPin4Digit: "4-Digit Security PIN",
      back: "Back",
      verifyActivate: "Verify & Activate",
      installCollector: "Install Field Collector",
      appleInstructions: "Apple iOS & Safari Instructions",
      gotIt: "Got It",
      copyReceipt: "Copy Receipt",
      receiptCopied: "Receipt copied to clipboard.",
      noAssignedSurveys: "No Assigned Active Surveys",
      assignedPlots: "Assigned",
      questionsLabel: "questions",
      orEnterCustomName: "Or enter custom name…",
      set: "Set",
      taggedOnAllSubmissions: "Tagged on all recorded plot interview submissions",
      completeRequiredBeforeSubmit: "Please complete required questions before submitting.",
      interviewRecordedSuccess: "Interview recorded. Form reset for next respondent.",
      deviceOffline: "Device is offline. Connect to internet to sync."
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
    ,
      skipToSurvey: "Ruka uende kwenye maswali ya utafiti",
      pwaBadge: "PWA",
      noActiveSurveyAssigned: "Hakuna Utafiti wa Nyanjani Uliotolewa",
      loadingSurvey: "Inapakia utafiti…",
      noSurveyActive: "Hakuna Utafiti Uliochaguliwa",
      synced: "Kimesawazishwa",
      autoSyncing: "Inasawazisha kiotomatiki…",
      pending: "inasubiri",
      syncTooltip: "Bofya kusawazisha na Google Sheets",
      installApp: "Sakinisha Programu",
      installed: "Imesakinishwa",
      addToHome: "Weka Ukurasa wa Kwanza",
      focusMode: "Hali ya Kuzingatia",
      focus: "Zingatia",
      focusOn: "Kuzingatia Kazi",
      sunlight: "Mwanga wa Jua",
      sunlightMode: "Hali ya Mwanga wa Jua",
      sunlightModeOn: "Utofautishaji wa Juu UMEWASHA",
      standardMode: "Kawaida",
      singleQuestion: "Swali Moja",
      sectionView: "Mwonekano wa Sehemu",
      offlineBundle: "Kifurushi cha Nje ya Mtandao",
      saveHtmlFile: "Hifadhi faili ya .html",
      adminAudit: "Ukaguzi wa Msimamizi",
      supervisor: "Msimamizi",
      supervisorPortal: "Tovuti ya Msimamizi",
      operationsStudio: "Studio ya Uendeshaji",
      returnToOperations: "Rudi kwenye Studio ya Uendeshaji",
      returnToSupervisor: "Rudi kwenye Tovuti ya Msimamizi",
      adminRequiresPin: "Studio ya Usimamizi (Inahitaji PIN)",
      dailyShiftPacing: "Kasi ya Zamu ya Kila Siku",
      assignedTaskQuota: "Kiwango cha Kazi Uliyopewa",
      plots: "Mashamba",
      outboxQueued: "Kwenye Foleni ya Kutuma",
      due: "Mwisho",
      shiftTargetMet: "Lengo la Zamu Limetimia",
      plotsToTarget: "mashamba kufikia lengo",
      syncedToSheets: "Imesawazishwa kwenye Google Sheets",
      queuedLocally: "Kwenye foleni ya ndani ya kifaa (IndexedDB)",
      clearForm: "Futa Fomu",
      clearFormConfirm: "Je, una uhakika wa kufuta majibu yote na kuanza upya?",
      formResetSuccess: "Fomu imefutwa tayari kwa mahojiano mapya.",
      continue: "Endelea",
      previous: "Iliyopita",
      required: "Inahitajika",
      optional: "Hiari",
      completeSubmit: "Kamilisha na Uwasilishe",
      conversationalFocus: "Uzingatiaji wa Mazungumzo",
      classicForm: "Fomu ya Kawaida",
      question: "Swali",
      selectDeployedSurvey: "Chagua Utafiti Uliotumwa",
      connectWifiPrompt: "Unganisha kwenye mtandao ili kusawazisha na Google Sheets au wasiliana na kiongozi wako akukabidhi utafiti.",
      openCamera: "Fungua Kamera / Pakia Picha",
      retakePhoto: "Piga Picha Tena",
      photoProofTitle: "Piga Picha ya Shamba la Majaribio / Duka la Pembejeo",
      photoProofDesc: "Hufungua kamera ya simu moja kwa moja. Hubanwa kiotomatiki hadi ≤150KB kwa hifadhi ya nje ya mtandao.",
      compressedJpeg: "Picha Iliyobanwa ya JPEG",
      downscaledForIdb: "Imebanwa hadi pikseli 1024 kwa IndexedDB",
      signPrompt: "Weka sahihi kwa kidole, kalamu maalum au kipanya ndani ya sanduku:",
      clearSignature: "Futa Sahihi",
      signatureHint: "Sahihi ya Mkulima au Muuzaji wa Pembejeo",
      signatureVerified: "Sahihi ya kidijitali ya idhini imethibitishwa na kuhifadhiwa.",
      drawSignaturePrompt: "Chora sahihi kwa kidole au kalamu",
      saveSignature: "Hifadhi Sahihi",
      launchBarcodeScanner: "Fungua Kinasaji cha Misimbopau cha Kamera",
      opticalBarcodeTitle: "Kinasaji cha Misimbopau / QR cha Kamera",
      opticalBarcodeDesc: "Nasa lebo ya usalama ya KEPHIS, msimbopau wa mbegu au nambari tambulishi.",
      orTypeSerialManually: "AU ANDIKA NAMBARI KWA MKONO",
      kephisVerified: "Imethibitishwa na KEPHIS",
      unverifiedFormat: "Muundo Haujathibitishwa",
      scanAnother: "Nasa Nyingine",
      verify: "Thibitisha",
      startVoiceRecording: "Anza Kurekodi Sauti",
      stopSaveRecording: "Sitisha na Uhifadhi Rekodi",
      recordingAudioTestimony: "Inarekodi Ushuhuda wa Sauti Nyanjani…",
      voiceTestimonySaved: "Ushuhuda wa Sauti wa Mkulima Umehifadhiwa",
      deleteReRecord: "Futa / Rekodi Tena",
      audioTestimonyTitle: "Ushuhuda wa Kina wa Sauti wa Mkulima",
      audioTestimonyDesc: "Rekodi maoni ya mhojiwa au maelezo ya ukaguzi wa mbegu (hadi sekunde 120).",
      evaluationDimension: "Kipengele cha Tathmini",
      smallholderUnitCalc: "Kikokotoo cha Vipimo vya Wakulima Wadogo",
      tapToRate: "Gusa ili utathmini",
      stars: "nyota",
      notLikely: "0 = Siwezi kamwe kupendekeza",
      extremelyLikely: "10 = Nitapendekeza kwa hakika",
      clearGps: "Futa",
      acquiringGnss: "Inatafuta Mawimbi ya Satelaiti za GNSS…",
      searchingConstellation: "Inatafuta satelaiti… (baki chini ya anga wazi)",
      latitudeLabel: "Latitudo (−90 hadi 90)",
      longitudeLabel: "Longitudo (−180 hadi 180)",
      landmarkLabel: "Kijiji / Alama ya Shamba la Majaribio",
      noRosterItems: "Bado hakuna orodha iliyoongezwa. Gusa hapa chini kuongeza aina ya mbegu.",
      addAnotherRosterItem: "+ Ongeza Kipengele Kingine",
      remove: "Ondoa",
      reset: "Weka Upya",
      fieldOperationsMenu: "Menyu ya Uendeshaji Nyanjani",
      offlineToolsDesc: "Zana za nje ya mtandao na vidhibiti vya mhudumu",
      activeOperator: "Mhudumu Aliye Kazini",
      switchOperator: "Badilisha Mhudumu",
      lockTablet: "Funga Kifaa (Kompyuta Mpakato)",
      lockTabletDesc: "Funga Kifaa kwa ajili ya Mtafiti (Ondoka kwenye Kikao cha Msimamizi)",
      activeSurvey: "Utafiti Unaotumika Sasa",
      change: "Badilisha",
      noSurveySelected: "Hakuna Utafiti Uliochaguliwa",
      displayLanguage: "Lugha ya Mwonekano",
      fieldToolsModes: "Zana na Njia za Nyanjani",
      deviceHomeScreen: "Ukurasa wa Nyumbani wa Kifaa",
      addToDevice: "Weka kwenye Kifaa",
      installPwa: "Sakinisha PWA",
      verifyEnumPin: "Thibitisha PIN ya Mtafiti",
      enter4DigitPin: "Weka PIN ya tarakimu 4 kwa ajili ya",
      securityPin4Digit: "PIN ya Usalama ya Tarakimu 4",
      back: "Nyuma",
      verifyActivate: "Thibitisha na Uwashe",
      installCollector: "Sakinisha Mkusanyaji wa Nyanjani",
      appleInstructions: "Maelekezo ya Apple iOS na Safari",
      gotIt: "Nimeelewa",
      copyReceipt: "Nakili Stakabadhi",
      receiptCopied: "Stakabadhi imenakiliwa.",
      noAssignedSurveys: "Hakuna Tafiti Zinazoendelea Uliyopangiwa",
      assignedPlots: "Iliyopangiwa",
      questionsLabel: "maswali",
      orEnterCustomName: "Au andika jina lingine…",
      set: "Weka",
      taggedOnAllSubmissions: "Hutajwa kwenye mawasilisho yote ya mahojiano ya mashamba",
      completeRequiredBeforeSubmit: "Tafadhali jaza maswali yote ya lazima kabla ya kuwasilisha.",
      interviewRecordedSuccess: "Mahojiano yamerekodiwa. Fomu imefutwa tayari kwa mhojiwa mwingine.",
      deviceOffline: "Kifaa hakina mtandao. Unganisha kwenye intaneti ili kusawazisha."
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
    ,
      skipToSurvey: "Passer aux questions de l’enquête",
      pwaBadge: "PWA",
      noActiveSurveyAssigned: "Aucune Enquête de Terrain Active Assignée",
      loadingSurvey: "Chargement de l’enquête…",
      noSurveyActive: "Aucune Enquête Active",
      synced: "Synchronisé",
      autoSyncing: "Synchronisation automatique…",
      pending: "en attente",
      syncTooltip: "Cliquer pour synchroniser avec Google Sheets",
      installApp: "Installer l’App",
      installed: "Installé",
      addToHome: "Ajouter à l’écran d’accueil",
      focusMode: "Mode Focus",
      focus: "Focus",
      focusOn: "Focus Activé",
      sunlight: "Plein Soleil",
      sunlightMode: "Mode Plein Soleil",
      sunlightModeOn: "Contraste Élevé ACTIVÉ",
      standardMode: "Standard",
      singleQuestion: "Question Unique",
      sectionView: "Vue par Section",
      offlineBundle: "Pack Hors Ligne",
      saveHtmlFile: "Enregistrer le fichier .html",
      adminAudit: "Audit Admin",
      supervisor: "Superviseur",
      supervisorPortal: "Portail Superviseur",
      operationsStudio: "Studio des Opérations",
      returnToOperations: "Retour au Studio des Opérations",
      returnToSupervisor: "Retour au Portail Superviseur",
      adminRequiresPin: "Studio d’Administration (Code PIN requis)",
      dailyShiftPacing: "Rythme de Travail Journalier",
      assignedTaskQuota: "Quota de Tâches Assigné",
      plots: "Parcelles",
      outboxQueued: "En boîte d’envoi",
      due: "Échéance",
      shiftTargetMet: "Objectif du Jour Atteint",
      plotsToTarget: "parcelles restantes pour l’objectif",
      syncedToSheets: "Synchronisé sur Google Sheets",
      queuedLocally: "En attente locale dans IndexedDB",
      clearForm: "Effacer le Formulaire",
      clearFormConfirm: "Effacer toutes les réponses saisies et recommencer ?",
      formResetSuccess: "Formulaire réinitialisé pour un nouvel entretien.",
      continue: "Continuer",
      previous: "Précédent",
      required: "Obligatoire",
      optional: "Facultatif",
      completeSubmit: "Terminer et Soumettre",
      conversationalFocus: "Focus Conversationnel",
      classicForm: "Formulaire Classique",
      question: "Question",
      selectDeployedSurvey: "Sélectionner une Enquête Déployée",
      connectWifiPrompt: "Connectez-vous au Wi-Fi pour synchroniser avec Google Sheets ou demandez à votre superviseur de vous assigner une enquête.",
      openCamera: "Ouvrir l’Appareil Photo / Téléverser",
      retakePhoto: "Reprendre la Photo",
      photoProofTitle: "Preuve Photo de la Parcelle d’Essai / Distributeur",
      photoProofDesc: "Ouvre directement l’appareil photo du smartphone. Compressé automatiquement à ≤150Ko pour stockage hors ligne.",
      compressedJpeg: "JPEG Compressé",
      downscaledForIdb: "Réduit à 1024px pour IndexedDB",
      signPrompt: "Signez avec le doigt, un stylet ou la souris dans le cadre :",
      clearSignature: "Effacer la Signature",
      signatureHint: "Signature de l’Agriculteur ou du Distributeur",
      signatureVerified: "Signature électronique de consentement vérifiée et enregistrée.",
      drawSignaturePrompt: "Dessinez la signature avec le doigt ou un stylet",
      saveSignature: "Enregistrer la Signature",
      launchBarcodeScanner: "Lancer le Scanner de Code-barres",
      opticalBarcodeTitle: "Scanner Optique Code-barres / QR",
      opticalBarcodeDesc: "Scannez l’étiquette de sécurité KEPHIS, le code-barres du lot ou le numéro de série.",
      orTypeSerialManually: "OU SAISIR LE NUMÉRO MANUELLEMENT",
      kephisVerified: "Vérifié par KEPHIS",
      unverifiedFormat: "Format Non Vérifié",
      scanAnother: "Scanner un Autre",
      verify: "Vérifier",
      startVoiceRecording: "Démarrer l’Enregistrement Vocal",
      stopSaveRecording: "Arrêter et Enregistrer",
      recordingAudioTestimony: "Enregistrement du Témoignage Vocal…",
      voiceTestimonySaved: "Témoignage Vocal de l’Agriculteur Enregistré",
      deleteReRecord: "Supprimer / Réenregistrer",
      audioTestimonyTitle: "Témoignage Audio Qualitatif de l’Agriculteur",
      audioTestimonyDesc: "Enregistrez les commentaires du répondant ou les notes d’inspection (jusqu’à 120s).",
      evaluationDimension: "Dimension d’Évaluation",
      smallholderUnitCalc: "Calculateur d’Unités Petits Producteurs",
      tapToRate: "Touchez pour évaluer",
      stars: "étoiles",
      notLikely: "0 = Pas du tout probable",
      extremelyLikely: "10 = Tout à fait probable",
      clearGps: "Effacer",
      acquiringGnss: "Acquisition des Satellites GNSS…",
      searchingConstellation: "Recherche de la constellation satellite… (restez à ciel ouvert)",
      latitudeLabel: "Latitude (−90 à 90)",
      longitudeLabel: "Longitude (−180 à 180)",
      landmarkLabel: "Village / Repère de la Parcelle d’Essai",
      noRosterItems: "Aucun élément ajouté pour le moment. Touchez ci-dessous pour ajouter une variété.",
      addAnotherRosterItem: "+ Ajouter un Autre Élément",
      remove: "Supprimer",
      reset: "Réinitialiser",
      fieldOperationsMenu: "Menu des Opérations de Terrain",
      offlineToolsDesc: "Outils hors ligne et contrôles opérateur",
      activeOperator: "Opérateur Actif",
      switchOperator: "Changer d’Opérateur",
      lockTablet: "Verrouiller la Tablette",
      lockTabletDesc: "Verrouiller la Tablette pour l’Enquêteur (Quitter la Session Admin)",
      activeSurvey: "Enquête Active",
      change: "Changer",
      noSurveySelected: "Aucune Enquête Sélectionnée",
      displayLanguage: "Langue d’Affichage",
      fieldToolsModes: "Outils et Modes de Terrain",
      deviceHomeScreen: "Écran d’Accueil de l’Appareil",
      addToDevice: "Ajouter à l’Appareil",
      installPwa: "Installer la PWA",
      verifyEnumPin: "Vérifier le Code PIN Enquêteur",
      enter4DigitPin: "Entrez le code PIN à 4 chiffres pour",
      securityPin4Digit: "Code PIN de Sécurité à 4 Chiffres",
      back: "Retour",
      verifyActivate: "Vérifier et Activer",
      installCollector: "Installer le Collecteur de Terrain",
      appleInstructions: "Instructions Apple iOS et Safari",
      gotIt: "Compris",
      copyReceipt: "Copier le Reçu",
      receiptCopied: "Reçu copié dans le presse-papiers.",
      noAssignedSurveys: "Aucune Enquête Active Assignée",
      assignedPlots: "Assigné",
      questionsLabel: "questions",
      orEnterCustomName: "Ou entrez un nom personnalisé…",
      set: "Définir",
      taggedOnAllSubmissions: "Associé à toutes les soumissions d’entretiens enregistrées",
      completeRequiredBeforeSubmit: "Veuillez répondre aux questions obligatoires avant de soumettre.",
      interviewRecordedSuccess: "Entretien enregistré. Formulaire prêt pour le prochain répondant.",
      deviceOffline: "L’appareil est hors ligne. Connectez-vous à Internet pour synchroniser."
    },
    pt: {
      fieldCollector: 'Coletor de Campo AE',
      fieldAppBadge: 'App de Campo',
      adminStudio: 'Estúdio de Administração',
      adminStudioDesc: 'Digite o PIN de supervisor para aceder ao Construtor e Análises',
      verifyPin: 'Verificar PIN do Supervisor',
      enterPin: 'PIN de Segurança',
      openAdmin: 'Abrir Administração',
      cancel: 'Cancelar',
      close: 'Fechar',
      section: 'Secção',
      of: 'de',
      draftSaved: 'Rascunho guardado',
      nextSection: 'Próxima Secção',
      prevSection: 'Secção Anterior',
      submitSurvey: 'Submeter e Verificar Recibo',
      nextInterview: 'Próxima Entrevista',
      interviewLogged: 'Registo de Entrevista Concluído',
      interviewLoggedSub: 'Dados guardados na base de dados local IndexedDB. Prontos para sincronização com o Google Sheets.',
      receiptId: 'Nº do Recibo',
      submittedAt: 'Submetido em',
      enumerator: 'Inquiridor',
      duration: 'Duração',
      gpsCoordinates: 'Coordenadas GPS',
      offlineQueueStatus: 'Estado de Sincronização na Nuvem',
      storedLocallyPending: 'Armazenado localmente no dispositivo (Sincronização pendente)',
      syncedDirectly: 'Sincronizado diretamente com o Google Sheets',
      selectOption: 'Selecione uma opção…',
      typeAnswer: 'Escreva a sua resposta…',
      enterFieldNotes: 'Insira observações detalhadas de campo…',
      selectOrSearch: 'Selecione ou pesquise…',
      otherSpecify: 'Outro (por favor especifique)…',
      captureGps: 'Capturar GPS por Satélite',
      gpsCapturing: 'A ligar ao sensor satélite do tablet…',
      gpsLocked: 'Coordenadas Bloqueadas',
      gpsOfflineNote: 'Funciona 100% offline através do receptor de satélite do dispositivo',
      bagConverterLabel: 'Conversor de sacos de 90 kg:',
      bags: 'sacos',
      range: 'Intervalo:',
      reviewErrors: 'Por favor, reveja e responda às perguntas obrigatórias assinaladas.',
      selectActiveSurvey: 'Escolher Inquérito a Administrar',
      switchEnumerator: 'Mudar Inquiridor de Campo',
      offlineQueue: 'Fila offline',
      online: 'Online',
      syncSheets: 'Sincronizar com Sheets',
      switchLanguage: 'Idioma',
      selectLanguage: 'Selecionar Idioma'
    ,
      skipToSurvey: "Saltar para as perguntas do inquérito",
      pwaBadge: "PWA",
      noActiveSurveyAssigned: "Nenhum Inquérito de Campo Ativo Atribuído",
      loadingSurvey: "A carregar inquérito…",
      noSurveyActive: "Nenhum Inquérito Ativo",
      synced: "Sincronizado",
      autoSyncing: "A sincronizar automaticamente…",
      pending: "pendente",
      syncTooltip: "Clique para sincronizar com o Google Sheets",
      installApp: "Instalar App",
      installed: "Instalado",
      addToHome: "Adicionar ao Ecrã Principal",
      focusMode: "Modo de Foco",
      focus: "Foco",
      focusOn: "Foco Ativo",
      sunlight: "Luz Solar",
      sunlightMode: "Modo Luz Solar",
      sunlightModeOn: "Alto Contraste ATIVO",
      standardMode: "Padrão",
      singleQuestion: "Pergunta Única",
      sectionView: "Vista por Secção",
      offlineBundle: "Pacote Offline",
      saveHtmlFile: "Guardar ficheiro .html",
      adminAudit: "Auditoria de Administrador",
      supervisor: "Supervisor",
      supervisorPortal: "Portal do Supervisor",
      operationsStudio: "Estúdio de Operações",
      returnToOperations: "Voltar ao Estúdio de Operações",
      returnToSupervisor: "Voltar ao Portal do Supervisor",
      adminRequiresPin: "Estúdio de Administração (Requer PIN)",
      dailyShiftPacing: "Ritmo do Turno Diário",
      assignedTaskQuota: "Cota de Tarefas Atribuída",
      plots: "Parcelas",
      outboxQueued: "Na Fila de Saída",
      due: "Prazo",
      shiftTargetMet: "Meta do Turno Cumprida",
      plotsToTarget: "parcelas para a meta",
      syncedToSheets: "Sincronizado com Google Sheets",
      queuedLocally: "Em fila localmente no IndexedDB",
      clearForm: "Limpar Formulário",
      clearFormConfirm: "Limpar todas as respostas introduzidas e recomeçar?",
      formResetSuccess: "Formulário reiniciado para uma nova entrevista.",
      continue: "Continuar",
      previous: "Anterior",
      required: "Obrigatório",
      optional: "Opcional",
      completeSubmit: "Concluir e Submeter",
      conversationalFocus: "Foco Conversacional",
      classicForm: "Formulário Clássico",
      question: "Pergunta",
      selectDeployedSurvey: "Selecionar Inquérito Implementado",
      connectWifiPrompt: "Ligue-se ao Wi-Fi para sincronizar com o Google Sheets ou peça ao líder da equipa para atribuir um inquérito ativo.",
      openCamera: "Abrir Câmara / Carregar Foto",
      retakePhoto: "Tirar Nova Foto",
      photoProofTitle: "Comprovativo Fotográfico da Parcela / Distribuidor",
      photoProofDesc: "Abre a câmara do telemóvel diretamente. Comprimido automaticamente para ≤150KB para armazenamento offline.",
      compressedJpeg: "JPEG Comprimido",
      downscaledForIdb: "Reduzido para 1024px para IndexedDB",
      signPrompt: "Assine com o dedo, caneta ou rato dentro da caixa:",
      clearSignature: "Limpar Assinatura",
      signatureHint: "Assinatura do Produtor ou Comerciante",
      signatureVerified: "Assinatura digital de consentimento verificada e guardada.",
      drawSignaturePrompt: "Desenhe a assinatura com o dedo ou caneta",
      saveSignature: "Guardar Assinatura",
      launchBarcodeScanner: "Abrir Leitor de Código de Barras",
      opticalBarcodeTitle: "Leitor Ótico de Código de Barras / QR",
      opticalBarcodeDesc: "Digitalize a etiqueta de segurança KEPHIS, código do lote ou número de série.",
      orTypeSerialManually: "OU DIGITE O NÚMERO MANUALMENTE",
      kephisVerified: "Verificado pelo KEPHIS",
      unverifiedFormat: "Formato Não Verificado",
      scanAnother: "Digitalizar Outro",
      verify: "Verificar",
      startVoiceRecording: "Iniciar Gravação de Voz",
      stopSaveRecording: "Parar e Guardar Gravação",
      recordingAudioTestimony: "A Gravar Testemunho de Voz no Terreno…",
      voiceTestimonySaved: "Testemunho de Voz do Produtor Guardado",
      deleteReRecord: "Eliminar / Gravar de Novo",
      audioTestimonyTitle: "Testemunho de Áudio Qualitativo do Produtor",
      audioTestimonyDesc: "Grave o feedback verbal do inquirido ou notas de inspeção de sementes (até 120s).",
      evaluationDimension: "Dimensão de Avaliação",
      smallholderUnitCalc: "Calculadora de Unidades de Pequenos Produtores",
      tapToRate: "Toque para classificar",
      stars: "estrelas",
      notLikely: "0 = Nada provável",
      extremelyLikely: "10 = Extremamente provável",
      clearGps: "Limpar",
      acquiringGnss: "A Adquirir Satélites GNSS…",
      searchingConstellation: "A procurar satélites… (permaneça sob céu aberto)",
      latitudeLabel: "Latitude (−90 a 90)",
      longitudeLabel: "Longitude (−180 a 180)",
      landmarkLabel: "Aldeia / Ponto de Referência da Parcela",
      noRosterItems: "Nenhum item adicionado à lista. Toque abaixo para adicionar um registo de variedade.",
      addAnotherRosterItem: "+ Adicionar Outro Item",
      remove: "Remover",
      reset: "Reiniciar",
      fieldOperationsMenu: "Menu de Operações de Terreno",
      offlineToolsDesc: "Ferramentas offline e controlos de operador",
      activeOperator: "Operador Ativo",
      switchOperator: "Mudar de Operador",
      lockTablet: "Bloquear Tablet",
      lockTabletDesc: "Bloquear Tablet para o Inquiridor (Sair da Sessão de Admin)",
      activeSurvey: "Inquérito Ativo",
      change: "Mudar",
      noSurveySelected: "Nenhum Inquérito Selecionado",
      displayLanguage: "Idioma de Apresentação",
      fieldToolsModes: "Ferramentas e Modos de Terreno",
      deviceHomeScreen: "Ecrã Principal do Dispositivo",
      addToDevice: "Adicionar ao Dispositivo",
      installPwa: "Instalar PWA",
      verifyEnumPin: "Verificar PIN do Inquiridor",
      enter4DigitPin: "Introduza o PIN de 4 dígitos de",
      securityPin4Digit: "PIN de Segurança de 4 Dígitos",
      back: "Voltar",
      verifyActivate: "Verificar e Ativar",
      installCollector: "Instalar o Coletor de Terreno",
      appleInstructions: "Instruções para Apple iOS e Safari",
      gotIt: "Entendido",
      copyReceipt: "Copiar Recibo",
      receiptCopied: "Recibo copiado para a área de transferência.",
      noAssignedSurveys: "Nenhum Inquérito Ativo Atribuído",
      assignedPlots: "Atribuído",
      questionsLabel: "perguntas",
      orEnterCustomName: "Ou introduza um nome personalizado…",
      set: "Definir",
      taggedOnAllSubmissions: "Associado a todas as submissões de entrevistas de parcelas",
      completeRequiredBeforeSubmit: "Por favor, responda a todas as perguntas obrigatórias antes de submeter.",
      interviewRecordedSuccess: "Entrevista registada. Formulário reiniciado para o próximo inquirido.",
      deviceOffline: "O dispositivo está offline. Ligue-se à Internet para sincronizar."
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
      },
      pt: {
        title: 'Inquérito de 2026 sobre Adoção de Sementes de Milho Tolerantes à Seca por Pequenos Agricultores',
        description: 'Enumeração de campo avaliando desempenho de variedades de sementes, taxas de germinação, co-aplicação de fertilizantes e Net Promoter Score (NPS) dos agricultores nas províncias rurais.',
        pages: {
          page_1: {
            title: 'Secção 1: Perfil da Parcela, Variedade de Semente e Coordenadas GPS',
            description: 'Registar detalhes essenciais da parcela, fonte primária de semente e localização GPS do agricultor antes da recolha de dados de rendimento.'
          },
          page_2: {
            title: 'Secção 2: Desempenho Agronómico, Estimativa de Colheita e Avaliação do Agricultor (NPS)',
            description: 'Avaliar características da variedade cultivada, rendimento colhido por acre e recomendação do agricultor para vizinhos.'
          }
        },
        questions: {
          q_county: {
            title: 'Em qual província / zona agro-ecológica se localiza esta parcela agrícola?',
            helpText: 'Selecione a divisão administrativa onde a entrevista está a decorrer.',
            options: [
              'Província de Nakuru (Planalto do Vale do Rift)',
              'Província de Machakos (Semi-Árido Oriental)',
              'Província de Kakamega (Ocidente Húmido de Transição)',
              'Província de Meru (Terras Altas Centrais do Monte Quénia)',
              'Província de Uasin Gishu (Celeiro Comercial)',
              'Província de Kitui (Terras Baixas Semi-Áridas do Leste)'
            ]
          },
          q_seed_variety: {
            title: 'Qual a principal variedade de semente de milho que semeou durante a época principal das chuvas?',
            helpText: 'Peça para inspecionar o rótulo do saco se o agricultor ainda o guardar.',
            options: [
              'KH500-43A (Híbrido de Terras Altas)',
              'DK 8031 (Maturidade Média)',
              'SC Duma 43 (Maturidade Precoce)',
              'H6213 (Alta Altitude Tardia)',
              'DH04 (Tolerante à Seca para Terras Baixas)',
              'Semente Reciclada da Época Passada (Não Certificada)'
            ]
          },
          q_inputs_used: {
            title: 'Quais insumos de fertilidade do solo ou proteção de culturas foram aplicados nesta parcela?',
            helpText: 'Selecione todos os insumos aplicados no plantio ou em cobertura.',
            options: [
              'Adubo de Plantação DAP / NPK',
              'Adubo de Cobertura CAN / Ureia',
              'Composto / Estrume de Curral',
              'Controlo Biológico/Químico da Lagarta-do-Funil',
              'Rhizobium Certificado / Bio-Estimulante',
              'Nenhum Insumo Aplicado'
            ]
          },
          q_gps_plot: {
            title: 'Capturar Coordenadas GPS da Parcela e Ponto de Referência da Aldeia',
            helpText: 'Permaneça no centro da parcela para obter precisão por satélite inferior a 10 metros.'
          },
          q_trait_matrix: {
            title: 'Avalie a variedade de semente cultivada quanto aos seguintes traços agronómicos:',
            helpText: 'Avalie cada característica de acordo com a observação direta do agricultor.',
            rows: [
              'Uniformidade de germinação (emergência em 7 dias)',
              'Tolerância a períodos secos a meio da época',
              'Resistência à podridão da espiga e pragas de armazém',
              'Peso do grão e qualidade da farinha moída'
            ],
            columns: ['Excelente', 'Bom', 'Razoável', 'Fraco']
          },
          q_yield_kg: {
            title: 'Estimativa de Rendimento de Milho Colhido por Acre',
            helpText: 'Converta os sacos de 90kg para quilogramas (ex: 15 sacos = 1.350 kg/acre).'
          },
          q_dealer_rating: {
            title: 'Qual o seu grau de satisfação com a distância e o atendimento no seu agro-comerciante local?',
            helpText: '1 estrela = Muito Insatisfeito, 5 estrelas = Muito Satisfeito'
          },
          q_nps_seed: {
            title: 'Numa escala de 0 a 10, com que probabilidade recomendaria esta semente certificada aos seus vizinhos na próxima época?',
            helpText: '0 = De modo nenhum recomendaria | 10 = Recomendaria com toda a certeza'
          },
          q_field_notes: {
            title: 'Observações do Inquiridor e Feedback do Agricultor sobre Disponibilidade de Sementes',
            helpText: 'Registe detalhes qualitativos: disponibilidade de pacotes de 2kg, receio de sementes falsas ou restrições de crédito.',
            placeholder: 'Insira observações detalhadas de campo e comentários do agricultor…'
          },
          q_crop_photo: {
            title: 'Fotografia Comprovativa da Parcela / Cultura',
            helpText: 'Tire uma foto nítida da espiga de milho ou do stand da cultura no campo.'
          },
          q_farmer_signature: {
            title: 'Consentimento do Agricultor e Assinatura de Verificação do Inquérito',
            helpText: 'Peça ao agricultor para assinar no ecrã confirmando a veracidade das respostas.'
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
      },
      pt: {
        title: 'Auditoria de Stocks, Formatos de Embalagem e Preços de Agro-Comerciantes 2026',
        description: 'Auditoria trimestral dos retalhistas agrícolas rurais monitorizando disponibilidade de sementes certificadas, conformidade do armazenamento e pagamentos digitais.',
        pages: {
          page_dealer_1: {
            title: 'Verificação de Stocks e Preços do Retalhista',
            description: 'A preencher ao balcão com o proprietário ou operador da loja de insumos.'
          }
        },
        questions: {
          qd_shop_type: {
            title: 'Qual a classificação deste estabelecimento de insumos agrícolas?',
            helpText: 'Verifique o alvará comercial e licença oficial exposta.',
            options: [
              'Grossista e Retalhista de Insumos Agrícolas',
              'Retalhista Rural Independente (Agro-Pecuária)',
              'Loja de Insumos de Cooperativa Agrícola',
              'Agente de Aldeia / Distribuidor de Última Milha'
            ]
          },
          qd_stock_items: {
            title: 'Quais categorias de sementes certificadas estão fisicamente em stock hoje?',
            helpText: 'Inspecione visualmente as prateleiras e armazém.',
            options: [
              'Milho Híbrido Tolerante à Seca (2kg / 10kg)',
              'Feijão Comum Certificado (Nyota / Angaza)',
              'Feijão-Frade, Feijão-Mungo e Sorgo',
              'Sementes Hortícolas Variadas (Pacotes Herméticos)',
              'Sementes de Pastagens e Forrageiras (Brachiaria / Boma Rhodes)'
            ]
          },
          qd_price_2kg: {
            title: 'Preço Atual de Venda ao Público para Pacote de 2kg de Milho Certificado',
            helpText: 'Registe o preço em moeda local (KES / MZN).'
          },
          qd_storage_rating: {
            title: 'Classificação de Auditoria do Inquiridor: Ventilação do Armazém e Uso de Paletes',
            helpText: '5 estrelas = Paletes de madeira elevadas, teto estanque, afastado de agroquímicos tóxicos.'
          },
          qd_gps: {
            title: 'Coordenadas GPS da Entrada do Estabelecimento',
            helpText: 'Capture no exterior da porta de entrada para sinal de satélite ideal.'
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
    // English -> Swahili / French / Portuguese terms
    'Yes': { sw: 'Ndiyo', fr: 'Oui', pt: 'Sim' },
    'No': { sw: 'Hapana', fr: 'Non', pt: 'Não' },
    'Other': { sw: 'Nyingine', fr: 'Autre', pt: 'Outro' },
    'Poor': { sw: 'Duni', fr: 'Médiocre', pt: 'Fraco' },
    'Fair': { sw: 'Wastani', fr: 'Passable', pt: 'Razoável' },
    'Good': { sw: 'Nzuri', fr: 'Bon', pt: 'Bom' },
    'Excellent': { sw: 'Bora Kabisa', fr: 'Excellent', pt: 'Excelente' },
    'Male': { sw: 'Mwanaume', fr: 'Homme', pt: 'Masculino' },
    'Female': { sw: 'Mwanamke', fr: 'Femme', pt: 'Feminino' },
    'Smallholder': { sw: 'Mkulima Mdogo', fr: 'Petit Exploitant', pt: 'Pequeno Agricultor' },
    'Commercial': { sw: 'Kibiashara', fr: 'Commercial', pt: 'Comercial' },
    'Select one option.': { sw: 'Chagua jibu moja.', fr: 'Sélectionnez une option.', pt: 'Selecione uma opção.' },
    'Select all that apply.': { sw: 'Chagua zote zinazohusika.', fr: 'Sélectionnez toutes les réponses applicables.', pt: 'Selecione todas as opções aplicáveis.' },
    'Choose from the list.': { sw: 'Chagua kutoka kwenye orodha.', fr: 'Choisissez dans la liste.', pt: 'Escolha da lista.' },
    'Enter numeric value.': { sw: 'Weka nambari.', fr: 'Entrez une valeur numérique.', pt: 'Insira um valor numérico.' },
    'Select calendar date.': { sw: 'Chagua tarehe ya kalenda.', fr: 'Sélectionnez une date.', pt: 'Selecione a data.' },
    'Enter respondent name or ID…': { sw: 'Weka jina la mhojiwa au nambari…', fr: 'Entrez le nom ou l’identifiant…', pt: 'Insira o nome ou ID do entrevistado…' },
    'Write detailed field notes…': { sw: 'Andika maelezo ya kina ya nyanjani…', fr: 'Rédigez des notes de terrain détaillées…', pt: 'Escreva observações detalhadas de campo…' },
    'Which primary crop or seed variety did you plant this season?': {
      sw: 'Ni aina gani kuu ya zao au mbegu uliyopanda msimu huu?',
      fr: 'Quelle culture ou variété principale avez-vous semée cette saison ?',
      pt: 'Qual a principal cultura ou variedade de semente que semeou nesta época?'
    },
    'Which agronomic practices or inputs were applied on this plot?': {
      sw: 'Ni mazoea gani ya kilimo au pembejeo zilizotumika shambani humu?',
      fr: 'Quelles pratiques agronomiques ou intrants ont été appliqués sur cette parcelle ?',
      pt: 'Quais práticas agronómicas ou insumos foram aplicados nesta parcela?'
    },
    'Select County / Administrative Ward': {
      sw: 'Chagua Kaunti / Kata ya Kiutawala',
      fr: 'Sélectionnez le Comté / Secteur Administratif',
      pt: 'Selecione a Província / Distrito Administrativo'
    },
    'Total Harvested Yield per Acre': {
      sw: 'Jumla ya Mavuno Yaliyovunwa kwa Ekari',
      fr: 'Rendement Total Récolté par Acre',
      pt: 'Rendimento Total Colhido por Acre'
    },
    'Capture Farm Plot GPS Coordinates': {
      sw: 'Nasa Majira ya GPS ya Shamba',
      fr: 'Capturer les Coordonnées GPS de la Parcelle',
      pt: 'Capturar Coordenadas GPS da Parcela'
    },
    'Date of Planting / Field Inspection': {
      sw: 'Tarehe ya Kupanda / Ukaguzi wa Shamba',
      fr: 'Date de Semis / Inspection au Champ',
      pt: 'Data de Semeadura / Inspeção de Campo'
    },
    'Farmer / Respondent Full Name or Household ID': {
      sw: 'Jina Kamili la Mkulima / Nambari ya Kaya',
      fr: 'Nom Complet du Producteur / ID du Foyer',
      pt: 'Nome Completo do Agricultor / ID do Agregado Familiar'
    },
    'Additional Enumerator Observations & Qualitative Feedback': {
      sw: 'Maoni ya Ziada ya Mtafiti na Taarifa za Ubora',
      fr: 'Observations Supplémentaires de l’Enquêteur & Retours Qualitatifs',
      pt: 'Observações Adicionais do Inquiridor e Feedback Qualitativo'
    },
    'How satisfied are you with the germination rate of this seed lot?': {
      sw: 'Umeridhika kwa kiwango gani na uotaji wa mbegu hizi?',
      fr: 'Quel est votre niveau de satisfaction concernant le taux de germination de ce lot de semences ?',
      pt: 'Qual o seu grau de satisfação com a taxa de germinação deste lote de sementes?'
    },
    'On a scale of 0 to 10, how likely are you to recommend this seed variety to another farmer?': {
      sw: 'Kwenye mizani ya 0 hadi 10, una uwezekano gani wa kuipendekeza mbegu hii kwa mkulima mwingine?',
      fr: 'Sur une échelle de 0 à 10, quelle est la probabilité que vous recommandiez cette variété à un autre producteur ?',
      pt: 'Numa escala de 0 a 10, com que probabilidade recomendaria esta variedade a outro agricultor?'
    },
    'Rate the seed variety on each agronomic characteristic:': {
      sw: 'Tathmini aina ya mbegu kulingana na sifa zifuatazo za kilimo:',
      fr: 'Évaluez la variété selon chaque caractéristique agronomique :',
      pt: 'Avalie a variedade de sementes em cada característica agronómica:'
    },
    'Early germination vigor': { sw: 'Nguvu ya uotaji wa mapema', fr: 'Vigueur de germination précoce', pt: 'Vigor de germinação precoce' },
    'Drought & dry-spell resilience': { sw: 'Ustahimilivu wa ukame na vipindi vikavu', fr: 'Résilience à la sécheresse et aux poches de sécheresse', pt: 'Resiliência à seca e estiagem' },
    'Marketability of harvested grain': { sw: 'Uuzaji na ubora wa nafaka sokoni', fr: 'Commercialisation et qualité marchande du grain', pt: 'Comercialização e qualidade do grão' },
    'Certified Hybrid Seed': { sw: 'Mbegu ya Chotara Iliyoidhinishwa', fr: 'Semences Hybrides Certifiées', pt: 'Semente Híbrida Certificada' },
    'Improved Open-Pollinated Variety (OPV)': { sw: 'Mbegu Iliyoboreshwa (OPV)', fr: 'Variété Améliorée à Pollinisation Libre (OPV)', pt: 'Variedade Melhorada de Polinização Aberta (OPV)' },
    'Local Farm-Saved Seed': { sw: 'Mbegu ya Kienyeji Iliyohifadhiwa Shambani', fr: 'Semences Fermières Locales', pt: 'Semente Tradicional Guardada da Época Passada' },
    'Basal Planting Fertilizer (DAP/NPK)': { sw: 'Mbolea ya Kupandia (DAP/NPK)', fr: 'Engrais de Fond (DAP/NPK)', pt: 'Adubo de Fundo / Plantação (DAP/NPK)' },
    'Top-Dressing Fertilizer (CAN/Urea)': { sw: 'Mbolea ya Kukuzia (CAN/Urea)', fr: 'Engrais de Couverture (CAN/Urée)', pt: 'Adubo de Cobertura (CAN/Ureia)' },
    'Organic Manure / Compost': { sw: 'Samadi ya Wanyama / Mboji', fr: 'Fumier Organique / Compost', pt: 'Estrume Orgânico / Composto' },
    'Crop Rotation with Legumes': { sw: 'Mzunguko wa Mazao na Mikunde', fr: 'Rotation des Cultures avec des Légumineuses', pt: 'Rotação de Culturas com Leguminosas' },
    'Nakuru County': { sw: 'Kaunti ya Nakuru', fr: 'Comté de Nakuru', pt: 'Província de Nakuru' },
    'Machakos County': { sw: 'Kaunti ya Machakos', fr: 'Comté de Machakos', pt: 'Província de Machakos' },
    'Kakamega County': { sw: 'Kaunti ya Kakamega', fr: 'Comté de Kakamega', pt: 'Província de Kakamega' },
    'Meru County': { sw: 'Kaunti ya Meru', fr: 'Comté de Meru', pt: 'Província de Meru' },
    'Uasin Gishu County': { sw: 'Kaunti ya Uasin Gishu', fr: 'Comté d’Uasin Gishu', pt: 'Província de Uasin Gishu' }
  };

  const AEI18n = {
    LANGUAGES,

    getLanguage() {
      try {
        const stored = localStorage.getItem('ae_language');
        if (stored && (stored === 'en' || stored === 'sw' || stored === 'fr' || stored === 'pt')) {
          return stored;
        }
      } catch (e) {}
      return 'en';
    },

    setLanguage(langCode) {
      const code = (langCode || 'en').toLowerCase();
      const valid = code === 'sw' || code === 'fr' || code === 'pt' ? code : 'en';
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
     * Maps localized choice / dropdown / checkbox / matrix answers back to canonical English.
     * Open text responses are left untouched for automated translation in Google Apps Script.
     */
    getCanonicalEnglishAnswer(survey, questionId, val, sourceLang) {
      if (val === undefined || val === null || val === '') return val;
      if (!sourceLang || sourceLang === 'en') return val;
      if (!survey) return val;

      const rawQuestions = (window.aeStore && typeof window.aeStore.getQuestionsForSurvey === 'function')
        ? window.aeStore.getQuestionsForSurvey(survey)
        : [];
      const q = rawQuestions.find((item) => item.id === questionId);
      if (!q) return val;

      // 1. Radio / Dropdown / Single Choice
      if (typeof val === 'string' && Array.isArray(q.options)) {
        if (q.options.includes(val)) return val;
        const localizedSurvey = this.localizeSurvey(survey, sourceLang);
        const locQ = (window.aeStore ? window.aeStore.getQuestionsForSurvey(localizedSurvey) : []).find((item) => item.id === questionId);
        if (locQ && Array.isArray(locQ.options)) {
          const idx = locQ.options.findIndex((opt) => String(opt).trim().toLowerCase() === String(val).trim().toLowerCase());
          if (idx !== -1 && q.options[idx]) {
            return q.options[idx];
          }
        }
        // Reverse lookup in COMMON_DICTIONARY
        for (const [enKey, translations] of Object.entries(COMMON_DICTIONARY)) {
          if (translations[sourceLang] && translations[sourceLang].trim().toLowerCase() === val.trim().toLowerCase()) {
            return enKey;
          }
        }
      }

      // 2. Checkboxes / Multi-select
      if (Array.isArray(val) && Array.isArray(q.options)) {
        return val.map((item) => this.getCanonicalEnglishAnswer(survey, questionId, item, sourceLang));
      }

      // 3. Matrix Questions: { [rowLabel]: colLabel }
      if (typeof val === 'object' && val !== null && !Array.isArray(val) && q.type === 'matrix') {
        const canonicalMatrix = {};
        const localizedSurvey = this.localizeSurvey(survey, sourceLang);
        const locQ = (window.aeStore ? window.aeStore.getQuestionsForSurvey(localizedSurvey) : []).find((item) => item.id === questionId);

        Object.entries(val).forEach(([rKey, cVal]) => {
          let englishRow = rKey;
          if (locQ && Array.isArray(locQ.rows) && Array.isArray(q.rows)) {
            const rIdx = locQ.rows.findIndex((r) => String(r).trim().toLowerCase() === String(rKey).trim().toLowerCase());
            if (rIdx !== -1 && q.rows[rIdx]) englishRow = q.rows[rIdx];
          }
          let englishCol = cVal;
          if (locQ && Array.isArray(locQ.columns) && Array.isArray(q.columns)) {
            const cIdx = locQ.columns.findIndex((c) => String(c).trim().toLowerCase() === String(cVal).trim().toLowerCase());
            if (cIdx !== -1 && q.columns[cIdx]) englishCol = q.columns[cIdx];
          }
          canonicalMatrix[englishRow] = englishCol;
        });
        return canonicalMatrix;
      }

      return val;
    },

    /**
     * Renders a clean segmented language picker (EN · SW · PT · FR) for headers or toolbars.
     * @param {string} currentLang - Active language code ('en' | 'sw' | 'pt' | 'fr')
     * @param {string} onSelectCallbackExpr - JavaScript expression to invoke, e.g. "AEFieldApp.setLanguage"
     * @param {string} theme - 'dark' (for canopy headers) | 'light' (for white surfaces)
     * @param {Array<string>|null} allowedLanguages - Optional array of allowed language codes (e.g. ['en', 'pt'])
     */
    renderLanguageSwitch(currentLang, onSelectCallbackExpr = 'AEFieldApp.setLanguage', theme = 'dark', allowedLanguages = null) {
      const isDark = theme === 'dark';
      const containerClass = isDark
        ? 'h-8 p-0.5 rounded-[6px] bg-white/10 flex items-center text-xs font-semibold'
        : 'h-8 p-0.5 rounded-[6px] bg-[#F8F9F8] border border-[#CFD5D0] flex items-center text-xs font-semibold';

      const allowedSet = (Array.isArray(allowedLanguages) && allowedLanguages.length > 0)
        ? new Set(allowedLanguages.map((l) => String(l).toLowerCase()).concat(['en']))
        : null;

      const displayLangs = allowedSet ? LANGUAGES.filter((l) => allowedSet.has(l.code)) : LANGUAGES;

      return `
        <div class="${containerClass}" role="group" aria-label="Language Selector">
          ${displayLangs.map((l) => {
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

  AEI18n.UI_STRINGS = UI_STRINGS;
  root.AEI18n = AEI18n;
})(typeof window !== 'undefined' ? window : this);

