/**
 * ============================================================================
 * AE SURVEY — Qualitative & Verbatim Intelligence Engine (window.AETeXtEngine)
 * Zero-Dependency, 100% Offline-First Multilingual NLP Module
 *
 * Capabilities:
 *  1. Multi-Question Extraction (short_text, long_text, audio_note transcripts)
 *     with clean piped-title sanitization and backward-compatible API.
 *  2. Multi-Domain (Agronomic/Smallholder + Corporate/Team/Training/Operations)
 *     & Multilingual (EN / SW / FR / PT) Negation-Aware Sentiment Scoring
 *     (-1.0 to +1.0) with 3-word lookbehind negation window & clause resets.
 *  3. Actionability & Urgency Risk Detection (recommendations vs. critical alerts).
 *  4. 12-Theme Auto Thematic Coding + Theme x Sentiment + Theme x Segment
 *     cross-tabulation + TF-IDF weighted unigram/bigram keyphrase extraction.
 *  5. Extractive Executive Briefing Generator (report-ready + plain-text copy).
 *  6. LocalStorage Pinned Quotes Persistence + Hybrid Cloud GAS Helpers
 *     (BATCH_TRANSLATE & ANALYZE_VERBATIMS_AI with graceful offline fallback).
 * ============================================================================
 */

(function (globalScope) {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. Multilingual Stop Words (EN, SW, FR, PT) — used for TF-IDF term mining
  // --------------------------------------------------------------------------
  const STOP_WORDS = new Set([
    // English
    'the', 'and', 'to', 'of', 'a', 'an', 'in', 'for', 'is', 'on', 'that', 'by', 'this', 'with',
    'i', 'you', 'it', 'or', 'be', 'are', 'from', 'at', 'as', 'your', 'all', 'have', 'has', 'had',
    'was', 'were', 'we', 'our', 'us', 'they', 'them', 'their', 'he', 'she', 'his', 'her', 'its',
    'will', 'would', 'can', 'could', 'may', 'might', 'shall', 'do', 'does', 'did', 'done', 'my',
    'me', 'so', 'if', 'but', 'about', 'into', 'out', 'up', 'down', 'over', 'under', 'just', 'also',
    'very', 'really', 'quite', 'too', 'much', 'many', 'some', 'any', 'more', 'most', 'other',
    'than', 'then', 'there', 'here', 'when', 'where', 'what', 'which', 'who', 'how', 'why',
    'been', 'being', 'get', 'got', 'make', 'made', 'like', 'one', 'two', 'well', 'even', 'still',
    'only', 'such', 'each', 'both', 'few', 'own', 'same', 'through', 'during', 'before', 'after',
    'between', 'while', 'because', 'since', 'until', 'though', 'although', 'however', 'therefore',
    'yes', 'ok', 'okay', 'etc', 'able', 'lot', 'lots', 'bit', 'way', 'things', 'thing', 'per',
    // Swahili
    'na', 'ya', 'wa', 'kwa', 'ni', 'katika', 'la', 'za', 'cha', 'vya', 'ili', 'kama', 'hadi',
    'yake', 'sana', 'yangu', 'hawa', 'hiyo', 'hii', 'wale', 'wote', 'pia', 'lakini', 'ingawa',
    'ndani', 'kwenye', 'kutoka', 'baada', 'kabla', 'kuhusu', 'kila', 'zaidi', 'tu', 'hata',
    'sasa', 'tena', 'bado', 'kuwa', 'alikuwa', 'walikuwa', 'ilikuwa', 'yeye', 'mimi', 'sisi',
    'wao', 'ninyi', 'wewe', 'hapa', 'pale', 'kule', 'huko', 'kwamba', 'au', 'ama', 'ila',
    // French
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'en', 'au', 'aux', 'pour', 'par',
    'sur', 'dans', 'avec', 'est', 'sont', 'était', 'être', 'avoir', 'nous', 'vous', 'ils',
    'elles', 'que', 'qui', 'quoi', 'ce', 'cette', 'ces', 'mais', 'ou', 'donc', 'car', 'très',
    'plus', 'moins', 'tout', 'tous', 'bien', 'aussi', 'comme', 'leur', 'leurs', 'notre', 'votre',
    // Portuguese
    'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'do', 'da', 'dos', 'das', 'em', 'no',
    'na', 'nos', 'nas', 'por', 'para', 'com', 'que', 'e', 'é', 'são', 'foi', 'ser', 'estar',
    'ter', 'nós', 'você', 'vocês', 'eles', 'elas', 'mas', 'ou', 'como', 'muito', 'mais', 'menos',
    'todo', 'todos', 'também', 'isso', 'este', 'esta', 'esse', 'essa', 'seu', 'sua', 'nosso'
  ]);

  // --------------------------------------------------------------------------
  // 2. Multilingual Negation, Clause-Boundary & Intensifier Lexicons
  // --------------------------------------------------------------------------
  const NEGATION_WORDS = new Set([
    // English
    'not', 'no', 'never', 'without', 'hardly', 'barely', 'scarcely', 'neither', 'nor',
    'nothing', 'none', 'cannot', 'cant', 'dont', 'doesnt', 'didnt', 'wont', 'wouldnt',
    'shouldnt', 'couldnt', 'isnt', 'arent', 'wasnt', 'werent', 'havent', 'hasnt', 'hadnt',
    'lack', 'lacks', 'lacked', 'lacking',
    // Swahili
    'si', 'sio', 'siyo', 'hakuna', 'hapana', 'bila', 'haikuwa', 'haikufanya', 'hawakuwa',
    'haina', 'hawana', 'hatuna', 'sijawahi', 'kamwe',
    // French
    'pas', 'ne', 'jamais', 'sans', 'aucun', 'aucune', 'rien', 'guère', 'point',
    // Portuguese
    'não', 'nao', 'nunca', 'jamais', 'sem', 'nenhum', 'nenhuma', 'nada', 'nem'
  ]);

  const CLAUSE_BREAK_WORDS = new Set([
    'but', 'however', 'although', 'though', 'yet', 'whereas', 'except',
    'lakini', 'ila', 'ingawa', 'bali',
    'mais', 'cependant', 'pourtant', 'toutefois',
    'mas', 'porém', 'porem', 'contudo', 'todavia'
  ]);

  const INTENSIFIER_WORDS = new Set([
    'very', 'extremely', 'really', 'highly', 'super', 'so', 'too', 'completely', 'totally',
    'absolutely', 'deeply', 'strongly', 'truly', 'especially', 'particularly',
    'sana', 'mno', 'kabisa', 'haswa',
    'très', 'tres', 'vraiment', 'extrêmement', 'trop', 'beaucoup',
    'muito', 'extremamente', 'realmente', 'demais', 'totalmente'
  ]);

  // --------------------------------------------------------------------------
  // 3. Multi-Domain + Multilingual Sentiment Lexicon (EN / SW / FR / PT)
  // --------------------------------------------------------------------------
  const POSITIVE_WORDS = new Set([
    // Agronomic / Smallholder (EN)
    'uniform', 'germinated', 'germination', 'vigor', 'vigorous', 'tolerant', 'drought-tolerant',
    'heavy', 'sweet', 'high-yielding', 'yielding', 'bumper', 'certified', 'pure', 'resistant',
    'healthy', 'thriving', 'fertile', 'abundant', 'reliable', 'quality', 'affordable', 'fair',
    'timely', 'available', 'clean', 'fresh', 'robust', 'resilient', 'profitable', 'profit',
    // Corporate / Team / Training / Event (EN)
    'good', 'great', 'best', 'better', 'excellent', 'awesome', 'amazing', 'fantastic',
    'wonderful', 'outstanding', 'superb', 'brilliant', 'insightful', 'engaging', 'engaged',
    'interactive', 'collaborative', 'collaboration', 'teamwork', 'inclusive', 'inclusion',
    'clear', 'clarity', 'clearer', 'organized', 'well-organized', 'structured', 'practical',
    'relevant', 'valuable', 'useful', 'helpful', 'beneficial', 'impactful', 'inspiring',
    'inspired', 'motivating', 'motivated', 'energizing', 'energized', 'enjoyed', 'enjoyable',
    'fun', 'productive', 'smooth', 'professional', 'supportive', 'welcoming', 'respectful',
    'open', 'transparent', 'aligned', 'alignment', 'focused', 'strong', 'love', 'loved',
    'appreciate', 'appreciated', 'thankful', 'grateful', 'happy', 'pleased', 'satisfied',
    'impressive', 'impressed', 'learned', 'growth', 'progress', 'success', 'successful',
    'kudos', 'participative', 'participatory', 'bonding', 'unity', 'cohesion', 'refreshed',
    'constructive', 'empowering', 'informative', 'effective', 'efficient', 'enough',
    'sufficient', 'adequate', 'comfortable', 'pleasant', 'positive', 'recommend', 'recommended',
    'worthwhile', 'memorable', 'meaningful', 'seamless', 'responsive', 'attentive', 'prompt',
    // Swahili
    'mzuri', 'nzuri', 'vizuri', 'bora', 'faida', 'kuvuna', 'haraka', 'kinga', 'stahimili',
    'halisi', 'nafuu', 'mapema', 'asante', 'hongera', 'safi', 'poa', 'kubwa', 'nyingi',
    'furaha', 'kuridhika', 'manufaa', 'mafanikio', 'ushirikiano', 'uwazi', 'ubora', 'imara',
    'rahisi', 'salama', 'inapendeza', 'pendeza', 'shukrani', 'hongera',
    // French
    'bon', 'bonne', 'bons', 'bonnes', 'excellent', 'excellente', 'super', 'génial', 'genial',
    'utile', 'clair', 'claire', 'organisé', 'organise', 'interactif', 'collaboratif',
    'satisfait', 'satisfaite', 'efficace', 'fiable', 'rapide', 'abordable', 'qualité',
    'qualite', 'merci', 'bravo', 'positif', 'positive', 'productif', 'pertinent', 'suffisant',
    // Portuguese
    'bom', 'boa', 'ótimo', 'otimo', 'ótima', 'otima', 'excelente', 'maravilhoso', 'útil',
    'util', 'claro', 'clara', 'organizado', 'interativo', 'colaborativo', 'satisfeito',
    'satisfeita', 'eficaz', 'confiável', 'confiavel', 'rápido', 'rapido', 'acessível',
    'acessivel', 'qualidade', 'produtivo', 'produtiva', 'saudável', 'saudavel', 'obrigado',
    'positivo', 'positiva', 'relevante', 'suficiente', 'inspirador'
  ]);

  const NEGATIVE_WORDS = new Set([
    // Agronomic / Smallholder (EN)
    'fake', 'counterfeit', 'adulterated', 'expired', 'stockout', 'stockouts', 'shortage',
    'shortages', 'unavailable', 'late', 'delayed', 'delay', 'delays', 'rot', 'rotting',
    'rotten', 'pest', 'pests', 'armyworm', 'borer', 'striga', 'blight', 'disease', 'diseases',
    'drought', 'dry', 'wilting', 'yellowing', 'stunted', 'poor', 'weak', 'loss', 'losses',
    'failed', 'failure', 'fail', 'expensive', 'costly', 'overpriced', 'unaffordable',
    'complaint', 'complaints', 'problem', 'problems', 'issue', 'issues', 'broken', 'damaged',
    'damage', 'contaminated', 'spoiled', 'scarce', 'scarcity', 'defective', 'substandard',
    // Corporate / Team / Training / Event (EN)
    'bad', 'worse', 'worst', 'terrible', 'horrible', 'awful', 'disappointed', 'disappointing',
    'frustrating', 'frustrated', 'frustration', 'rushed', 'rushing', 'disorganized', 'chaotic',
    'chaos', 'confusing', 'confused', 'confusion', 'unclear', 'vague', 'boring', 'tedious',
    'repetitive', 'insufficient', 'missing', 'excluded', 'exclusion', 'ignored', 'sidelined',
    'dominated', 'unfair', 'biased', 'rude', 'unprofessional', 'unprepared', 'noisy', 'crowded',
    'uncomfortable', 'slow', 'tiring', 'exhausting', 'waste', 'wasted', 'pointless',
    'irrelevant', 'disconnected', 'siloed', 'tension', 'conflict', 'stressful', 'overwhelming',
    'overwhelmed', 'limited', 'inadequate', 'mediocre', 'subpar', 'underwhelming', 'awkward',
    'unstructured', 'unfocused', 'distracted', 'defensive', 'hesitant', 'uncertain', 'difficult',
    'hard', 'struggle', 'struggled', 'struggling', 'negative', 'unhelpful', 'unresponsive',
    'shortcoming', 'shortcomings', 'gap', 'gaps', 'bottleneck', 'bottlenecks', 'concern',
    'concerns', 'risk', 'risks', 'error', 'errors', 'bug', 'bugs', 'crash', 'crashed',
    'scam', 'fraud', 'corrupt', 'unsafe', 'hazard', 'toxic', 'hostile', 'unacceptable',
    // Swahili
    'gumu', 'ngumu', 'hasara', 'ghali', 'wadudu', 'ugonjwa', 'magonjwa', 'ukame', 'kuchelewa',
    'chelewa', 'mbaya', 'vibaya', 'mbovu', 'bandia', 'feki', 'uhaba', 'tatizo', 'matatizo',
    'malalamiko', 'kufa', 'kauka', 'oza', 'haribika', 'shida', 'upungufu', 'duni', 'fujo',
    'changamoto', 'machungu', 'kutengwa', 'udanganyifu',
    // French
    'mauvais', 'mauvaise', 'cher', 'chère', 'chere', 'retard', 'faux', 'fausse', 'contrefait',
    'perte', 'pertes', 'ravageurs', 'maladie', 'sécheresse', 'secheresse', 'problème',
    'probleme', 'problèmes', 'problemes', 'confus', 'désorganisé', 'desorganise', 'insuffisant',
    'lent', 'ennuyeux', 'déçu', 'decu', 'frustrant', 'exclu', 'manque', 'rupture', 'faible',
    // Portuguese
    'ruim', 'péssimo', 'pessimo', 'caro', 'cara', 'atraso', 'atrasado', 'atrasada', 'falso',
    'falsa', 'falsificado', 'praga', 'pragas', 'doença', 'doenca', 'seca', 'perda', 'perdas',
    'problema', 'problemas', 'fraco', 'fraca', 'confuso', 'desorganizado', 'insuficiente',
    'lento', 'chato', 'frustrante', 'excluído', 'excluido', 'falta', 'falha', 'quebrado',
    'reclamação', 'reclamacao'
  ]);

  // --------------------------------------------------------------------------
  // 4. Actionability & Urgency Detectors (Multilingual)
  // --------------------------------------------------------------------------
  const ACTIONABLE_REGEX = new RegExp(
    '(?:\\b(?:' +
      // English
      'should|recommend|recommended|recommendation|recommendations|suggest|suggested|suggestion|suggestions|' +
      'improve|improved|improvement|improvements|consider|propose|proposed|proposal|encourage|' +
      'please|wish|hope|prioritize|strengthen|expand|increase|reduce|provide|ensure|allocate|include|' +
      'breakout|follow-up|actionable|better|' +
      // Swahili
      'napendekeza|pendekeza|pendekezo|mapendekezo|tafadhali|boresha|kuboresha|inafaa|tunahitaji|' +
      'ongeza|punguza|zingatia|hakikisha|' +
      // French
      'devrait|devrions|recommande|recommandation|suggère|suggere|suggestion|améliorer|ameliorer|' +
      'veuillez|prévoir|prevoir|augmenter|réduire|reduire|' +
      // Portuguese
      'deveria|deveríamos|recomendo|recomendação|sugiro|sugestão|melhorar|melhoria|precisamos|' +
      'aumentar|reduzir|incluir|garantir' +
    ')\\b)|' +
    '(?:\\b(?:' +
      'need to|needs to|we need|more time|less time|next time|going forward|in future|in the future|' +
      'would be great|would be better|would help|could be|follow up|action plan|add more|give more|' +
      'muda zaidi|wakati zaidi|siku zijazo|besoin de|plus de temps|prochaine fois|mais tempo|por favor|próxima vez' +
    ')\\b)',
    'i'
  );

  const HIGH_URGENCY_REGEX = new RegExp(
    '\\b(?:' +
      'fake|counterfeit|adulterated|expired|scam|fraud|corrupt|corruption|bribe|unsafe|hazard|danger|' +
      'broken|collapsed|failed|failure|excluded|harassment|discrimination|toxic|hostile|unacceptable|' +
      'urgent|urgently|emergency|critical|immediately|crisis|catastrophic|destroyed|' +
      'bandia|feki|hasara|kufa|dharura|udanganyifu|kutengwa|' +
      'contrefait|fraude|urgence|dangereux|falsificado|urgente|emergência|emergencia' +
    ')\\b|(?:\\b(?:total loss|zero germination|did not germinate|never arrived|no germination|not working)\\b)',
    'i'
  );

  const MEDIUM_URGENCY_REGEX = new RegExp(
    '\\b(?:' +
      'stockout|stockouts|shortage|shortages|delayed|delay|late|rushed|disorganized|confusing|unclear|' +
      'overpriced|expensive|costly|complaint|complaints|problem|problems|issue|issues|armyworm|pest|pests|' +
      'drought|disease|blight|wilting|stunted|frustrating|disappointed|inadequate|insufficient|' +
      'ghali|kuchelewa|wadudu|ukame|ugonjwa|uhaba|tatizo|matatizo|malalamiko|' +
      'retard|cher|ravageurs|problème|probleme|atraso|caro|praga|seca' +
    ')\\b',
    'i'
  );

  // --------------------------------------------------------------------------
  // 5. 12-Theme Auto Thematic Coding Taxonomy (Agronomic + Corporate/Team/Ops)
  // --------------------------------------------------------------------------
  const THEME_DEFINITIONS = [
    {
      id: 'seed_input_quality',
      name: 'Seed & Input Quality',
      color: '#247B50',
      keywords: [
        'seed', 'seeds', 'germination', 'germinated', 'germinate', 'vigor', 'vigorous', 'uniform',
        'variety', 'varieties', 'hybrid', 'certified', 'fake', 'counterfeit', 'adulterated',
        'fertilizer', 'fertiliser', 'dap', 'can', 'npk', 'urea', 'pack', 'packaging', 'yield',
        'yielding', 'harvest', 'cob', 'cobs', 'grain', 'crop', 'crops', 'maize', 'beans', 'input',
        'inputs', 'purity', 'pure', 'expired', 'stunted', 'quality', 'mbegu', 'mavuno', 'ubora',
        'bandia', 'feki', 'mbolea', 'mahindi', 'shamba', 'semence', 'semences', 'rendement',
        'engrais', 'semente', 'sementes', 'colheita', 'adubo'
      ]
    },
    {
      id: 'pricing_affordability',
      name: 'Pricing & Affordability',
      color: '#D97706',
      keywords: [
        'price', 'prices', 'pricing', 'cost', 'costs', 'costly', 'expensive', 'overpriced',
        'cheap', 'cheaper', 'affordable', 'unaffordable', 'subsidy', 'subsidies', 'credit',
        'loan', 'loans', 'payment', 'budget', 'money', 'margin', 'profit', 'profitable',
        'discount', 'discounts', 'fee', 'fees', 'bei', 'ghali', 'nafuu', 'pesa', 'mkopo',
        'faida', 'garama', 'gharama', 'prix', 'cher', 'chère', 'coût', 'abordable', 'preço',
        'preco', 'caro', 'custo', 'acessível', 'desconto'
      ]
    },
    {
      id: 'supply_timeliness',
      name: 'Supply & Timeliness',
      color: '#2563EB',
      keywords: [
        'stock', 'stockout', 'stockouts', 'shortage', 'shortages', 'availability', 'available',
        'unavailable', 'supply', 'supplies', 'delivery', 'deliver', 'delivered', 'late',
        'delayed', 'delay', 'delays', 'timely', 'early', 'agro-dealer', 'agrodealer', 'dealer',
        'shop', 'store', 'distributor', 'distribution', 'warehouse', 'access', 'accessible',
        'distance', 'restock', 'uhaba', 'kuchelewa', 'chelewa', 'mapema', 'duka', 'maduka',
        'usambazaji', 'upatikanaji', 'retard', 'livraison', 'rupture', 'disponible', 'estoque',
        'atraso', 'atrasado', 'entrega', 'distribuição'
      ]
    },
    {
      id: 'pests_disease_climate',
      name: 'Pests, Disease & Climate',
      color: '#DC2626',
      keywords: [
        'pest', 'pests', 'armyworm', 'borer', 'striga', 'weed', 'weeds', 'disease', 'diseases',
        'blight', 'rot', 'rotting', 'virus', 'fungus', 'drought', 'rain', 'rains', 'rainfall',
        'dry', 'flood', 'floods', 'weather', 'climate', 'heat', 'frost', 'soil', 'pesticide',
        'herbicide', 'chemical', 'spray', 'wilting', 'yellowing', 'tolerant', 'resistant',
        'wadudu', 'ugonjwa', 'magonjwa', 'ukame', 'mvua', 'dawa', 'udongo', 'kauka', 'oza',
        'ravageurs', 'maladie', 'sécheresse', 'secheresse', 'pluie', 'praga', 'pragas', 'doença',
        'doenca', 'seca', 'chuva', 'solo'
      ]
    },
    {
      id: 'extension_training',
      name: 'Extension & Training',
      color: '#0D9488',
      keywords: [
        'training', 'train', 'trained', 'trainer', 'extension', 'agronomist', 'demo',
        'demonstration', 'workshop', 'workshops', 'learn', 'learning', 'learned', 'knowledge',
        'skill', 'skills', 'coaching', 'coach', 'mentor', 'mentorship', 'guide', 'guidance',
        'advice', 'advisory', 'manual', 'curriculum', 'teach', 'teaching', 'module', 'modules',
        'mafunzo', 'elimu', 'mtaalamu', 'wataalamu', 'ushauri', 'formation', 'apprentissage',
        'treinamento', 'capacitação', 'conhecimento', 'ensino'
      ]
    },
    {
      id: 'facilitation_leadership',
      name: 'Facilitation & Leadership',
      color: '#7C3AED',
      keywords: [
        'facilitation', 'facilitator', 'facilitators', 'facilitated', 'moderator', 'host',
        'leadership', 'leader', 'leaders', 'management', 'manager', 'managers', 'executive',
        'director', 'steering', 'speaker', 'speakers', 'presenter', 'presenters', 'presentation',
        'energy', 'engaging', 'guided', 'uongozi', 'kiongozi', 'mwezeshaji', 'animateur',
        'animation', 'direction', 'liderança', 'lideranca', 'facilitador', 'gestão', 'gestao'
      ]
    },
    {
      id: 'participation_inclusion',
      name: 'Participation & Inclusion',
      color: '#DB2777',
      keywords: [
        'participation', 'participate', 'participatory', 'participative', 'interactive',
        'engagement', 'engage', 'teamwork', 'team', 'teams', 'collaboration', 'collaborative',
        'collaborate', 'bonding', 'inclusive', 'inclusion', 'everyone', 'voice', 'voices',
        'heard', 'excluded', 'exclusion', 'breakout', 'breakouts', 'group', 'groups',
        'discussion', 'discussions', 'brainstorming', 'peer', 'peers', 'cross-team',
        'colleagues', 'unity', 'cohesion', 'ushirikiano', 'timu', 'kikundi', 'vikundi',
        'kutengwa', 'majadiliano', 'équipe', 'equipe', 'participation', 'participação',
        'participacao', 'equipa', 'colaboração', 'inclusão'
      ]
    },
    {
      id: 'communication_clarity',
      name: 'Communication & Clarity',
      color: '#0284C7',
      keywords: [
        'communication', 'communicate', 'communicated', 'clarity', 'clear', 'clearer', 'unclear',
        'confusing', 'confused', 'confusion', 'transparent', 'transparency', 'alignment',
        'aligned', 'feedback', 'listen', 'listening', 'expectations', 'instructions', 'objectives',
        'message', 'messaging', 'open', 'honest', 'vague', 'explain', 'explanation',
        'mawasiliano', 'uwazi', 'ufafanuzi', 'maelezo', 'communication', 'clarté', 'clarte',
        'comunicação', 'comunicacao', 'clareza', 'transparência'
      ]
    },
    {
      id: 'time_agenda_management',
      name: 'Time & Agenda Management',
      color: '#EA580C',
      keywords: [
        'time', 'timing', 'schedule', 'scheduled', 'agenda', 'rushed', 'rushing', 'pace',
        'pacing', 'duration', 'long', 'longer', 'short', 'shorter', 'break', 'breaks',
        'punctual', 'punctuality', 'overtime', 'session', 'sessions', 'minutes', 'hours',
        'days', 'muda', 'wakati', 'ratiba', 'temps', 'horaire', 'durée', 'tempo', 'horário',
        'horario', 'duração', 'pausa'
      ]
    },
    {
      id: 'strategy_action_planning',
      name: 'Strategy & Action Planning',
      color: '#4F46E5',
      keywords: [
        'strategy', 'strategic', 'plan', 'plans', 'planning', 'action', 'actions', 'roadmap',
        'goal', 'goals', 'target', 'targets', 'kpi', 'kpis', 'okr', 'priority', 'priorities',
        'follow-up', 'followup', 'execution', 'execute', 'implement', 'implementation',
        'accountability', 'ownership', 'vision', 'mission', 'next', 'steps', 'commitments',
        'mkakati', 'mpango', 'mipango', 'malengo', 'utekelezaji', 'stratégie', 'strategie',
        'objectifs', 'estratégia', 'estrategia', 'metas', 'planejamento'
      ]
    },
    {
      id: 'logistics_support',
      name: 'Logistics & Support',
      color: '#64748B',
      keywords: [
        'venue', 'room', 'rooms', 'hall', 'food', 'catering', 'lunch', 'meals', 'breakfast',
        'refreshments', 'transport', 'travel', 'accommodation', 'hotel', 'audio', 'mic',
        'microphone', 'sound', 'projector', 'slides', 'wifi', 'internet', 'network', 'materials',
        'handouts', 'seating', 'chairs', 'comfort', 'comfortable', 'support', 'admin',
        'logistics', 'organization', 'organized', 'disorganized', 'ukumbi', 'chakula', 'usafiri',
        'vifaa', 'malazi', 'logistique', 'salle', 'repas', 'logística', 'logistica', 'local',
        'transporte', 'alimentação'
      ]
    },
    {
      id: 'impact_satisfaction',
      name: 'Impact & Satisfaction',
      color: '#059669',
      keywords: [
        'impact', 'impactful', 'value', 'valuable', 'takeaway', 'takeaways', 'insightful',
        'inspiring', 'motivating', 'useful', 'helpful', 'overall', 'experience', 'satisfied',
        'satisfaction', 'enjoy', 'enjoyed', 'enjoyable', 'worthwhile', 'productive', 'outcome',
        'outcomes', 'benefit', 'benefits', 'beneficial', 'great', 'excellent', 'awesome',
        'fantastic', 'appreciate', 'appreciated', 'grateful', 'matokeo', 'manufaa', 'furaha',
        'kuridhika', 'asante', 'hongera', 'satisfaction', 'expérience', 'satisfação', 'satisfacao',
        'experiência', 'impacto'
      ]
    }
  ];

  const OTHER_THEME = {
    id: 'other_general',
    name: 'Other / General',
    color: '#6B7280'
  };

  // Pre-build Set lookup per theme for O(1) keyword matching
  const THEME_LOOKUP = THEME_DEFINITIONS.map((t) => ({
    ...t,
    keywordSet: new Set(t.keywords)
  }));

  // In-memory fallback for pinned quotes when localStorage is unavailable (e.g. Node tests)
  const _memPinStore = new Map();

  // --------------------------------------------------------------------------
  // 6. Internal Utility Helpers
  // --------------------------------------------------------------------------
  function _getSurveyQuestions(survey) {
    if (!survey || typeof survey !== 'object') return [];
    if (typeof globalScope !== 'undefined' && globalScope.aeStore && typeof globalScope.aeStore.getQuestionsForSurvey === 'function') {
      try {
        const qs = globalScope.aeStore.getQuestionsForSurvey(survey);
        if (Array.isArray(qs)) return qs;
      } catch (e) {}
    }
    if (Array.isArray(survey.pages)) {
      const out = [];
      for (let i = 0; i < survey.pages.length; i++) {
        const p = survey.pages[i];
        if (p && Array.isArray(p.questions)) {
          for (let j = 0; j < p.questions.length; j++) {
            if (p.questions[j]) out.push(p.questions[j]);
          }
        }
      }
      return out;
    }
    if (Array.isArray(survey.questions)) return survey.questions;
    return [];
  }

  function _cleanQuestionTitle(qOrTitle, answers, survey) {
    const raw = typeof qOrTitle === 'string'
      ? qOrTitle
      : String((qOrTitle && (qOrTitle.title || qOrTitle.label || qOrTitle.id)) || '');
    if (!raw) return '';
    // Delegate to AEAnalytics.cleanQuestionTitle if available and safe
    const ansObj = answers && typeof answers === 'object' ? answers : {};
    return raw
      .replace(/\{\{\s*([^}]+?)\s*\}\}/g, function (_m, refId) {
        const key = String(refId || '').trim();
        if (ansObj[key] !== undefined && ansObj[key] !== null && String(ansObj[key]).trim() !== '') {
          const val = ansObj[key];
          return Array.isArray(val) ? val.join(', ') : String(val).trim();
        }
        // Look up referenced question title in survey for a clean fallback phrase
        if (survey) {
          const refQ = _getSurveyQuestions(survey).find((item) => item && item.id === key);
          if (refQ && refQ.title) {
            const shortRef = String(refQ.title).replace(/\{\{[^}]+\}\}/g, '').trim().replace(/[?:.]+$/, '');
            if (shortRef && shortRef.length <= 36) return `"${shortRef}"`;
          }
        }
        return 'your rating';
      })
      .replace(/\s+/g, ' ')
      .trim();
  }

  function _extractQuestionCode(q, idx) {
    if (!q) return `Q${(idx || 0) + 1}`;
    if (q.code && String(q.code).trim()) return String(q.code).trim();
    const title = String(q.title || '').trim();
    const prefixMatch = title.match(/^(Q\d+[a-z]?)\b/i);
    if (prefixMatch) return prefixMatch[1].toUpperCase().replace(/^Q(\d+)([A-Z])$/, 'Q$1$2'.toLowerCase().replace(/^q/, 'Q'));
    // Check ID like q2b, q3b, q_2b, q4_takeaway
    const idStr = String(q.id || '');
    const idMatch = idStr.match(/^q[_-]?(\d+[a-z]?)(?:_|$)/i);
    if (idMatch) {
      const numPart = idMatch[1];
      return 'Q' + numPart.replace(/([A-Z])$/, (c) => c.toLowerCase());
    }
    return `Q${(idx || 0) + 1}`;
  }

  function _isObviousNonVerbatimShortText(q) {
    if (!q) return true;
    const type = String(q.type || '').toLowerCase();
    if (type === 'long_text' || type === 'textarea' || type === 'audio_note') return false;
    if (type !== 'short_text' && type !== 'text') return true;

    const inputType = String(q.inputType || q.subType || '').toLowerCase();
    if (['number', 'numeric', 'integer', 'decimal', 'date', 'datetime', 'time', 'tel', 'phone', 'email', 'url'].includes(inputType)) {
      return true;
    }
    if (q.validation && ['number', 'numeric', 'integer', 'decimal', 'date', 'phone', 'email'].includes(String(q.validation.type || '').toLowerCase())) {
      return true;
    }

    const combined = `${q.id || ''} ${q.title || ''}`.toLowerCase();
    // Always keep explicit open-ended / feedback / follow-up prompts
    if (/(comment|note|feedback|reason|why|explain|suggest|takeaway|describe|verbatim|remark|improve|thought|experience|opinion|challenge|lesson|highlight|recommend|elaborate|share|tell us|what did|how can)/i.test(combined)) {
      return false;
    }
    // Exclude obvious ID / phone / email / date / GPS / numeric metadata fields
    if (/(^|[\s_-])(phone|telephone|mobile|email|e-mail|national[\s_-]?id|id[\s_-]?number|passport|kra[\s_-]?pin|pin[\s_-]?code|date[\s_-]?of[\s_-]?birth|dob|latitude|longitude|gps|serial[\s_-]?no|receipt[\s_-]?no|invoice[\s_-]?no|postal[\s_-]?code|zip[\s_-]?code)([\s_-]|$)/i.test(combined)) {
      return true;
    }
    return false;
  }

  function _extractTextValue(val) {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (!trimmed || trimmed.length < 3) return '';
      if (trimmed.startsWith('data:')) return '';
      if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?/.test(trimmed)) return '';
      if (/^[+-]?\d+([.,]\d+)?$/.test(trimmed)) return '';
      return trimmed;
    }
    if (typeof val === 'object' && !Array.isArray(val)) {
      const candidate = val.transcript || val.transcription || val.text || val.notes || val.caption || '';
      if (typeof candidate === 'string') return _extractTextValue(candidate);
    }
    return '';
  }

  function _formatSegmentValue(val) {
    if (val === null || val === undefined) return '';
    if (Array.isArray(val)) {
      const first = val.find((v) => v !== null && v !== undefined && String(v).trim() !== '');
      return first !== undefined ? String(first).trim() : '';
    }
    if (typeof val === 'object') {
      return String(val.label || val.level1 || val.name || val.value || '').trim();
    }
    return String(val).trim();
  }

  function _tokenizeForSentiment(text) {
    // Preserve clause boundaries as special '__BRK__' sentinel tokens
    const normalized = String(text || '')
      .toLowerCase()
      .replace(/['’](?=[a-z])/g, '') // collapse contractions: don't -> dont, isn't -> isnt
      .replace(/[.,;!?()\n\r]+/g, ' __BRK__ ')
      .replace(/[^a-z0-9àáâãäåèéêëìíîïòóôõöùúûüñçýÿ\s_-]/g, ' ');
    return normalized
      .split(/\s+/)
      .filter((t) => t && (t === '__BRK__' || t.length >= 2));
  }

  function _tokenizeForTerms(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/['’](?=[a-z])/g, '')
      .replace(/[^a-z0-9àáâãäåèéêëìíîïòóôõöùúûüñçýÿ\s-]/g, ' ')
      .split(/\s+/)
      .map((w) => w.replace(/^-+|-+$/g, ''))
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));
  }

  function _scoreSentimentAndSignals(text) {
    const tokens = _tokenizeForSentiment(text);
    let posWeight = 0;
    let negWeight = 0;
    const matchedKeywords = [];
    const seenMatched = new Set();

    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      if (tok === '__BRK__' || CLAUSE_BREAK_WORDS.has(tok)) continue;

      const isPos = POSITIVE_WORDS.has(tok);
      const isNeg = NEGATIVE_WORDS.has(tok);
      if (!isPos && !isNeg) continue;

      // 3-word lookbehind negation window (stops at clause boundaries)
      let negated = false;
      let intensified = false;
      for (let back = 1; back <= 3 && i - back >= 0; back++) {
        const prev = tokens[i - back];
        if (prev === '__BRK__' || CLAUSE_BREAK_WORDS.has(prev)) break;
        if (NEGATION_WORDS.has(prev)) {
          negated = !negated;
        } else if (back <= 2 && INTENSIFIER_WORDS.has(prev)) {
          intensified = true;
        }
      }

      const weight = intensified ? 1.35 : 1.0;
      if (isPos) {
        if (negated) negWeight += weight;
        else posWeight += weight;
      } else if (isNeg) {
        if (negated) posWeight += weight * 0.85; // e.g. "no complaints" -> positive
        else negWeight += weight;
      }

      if (!seenMatched.has(tok)) {
        seenMatched.add(tok);
        matchedKeywords.push(tok);
      }
    }

    const net = posWeight - negWeight;
    const total = posWeight + negWeight;
    let sentimentScore = 0;
    if (total > 0) {
      // Smoothly scaled to [-1.0, +1.0]
      const raw = (net / (total + 0.75)) * 1.25;
      sentimentScore = Math.max(-1, Math.min(1, Number(raw.toFixed(2))));
    }

    let sentiment = 'neutral';
    if (sentimentScore >= 0.15) sentiment = 'positive';
    else if (sentimentScore <= -0.15) sentiment = 'negative';

    const isActionable = ACTIONABLE_REGEX.test(text);

    let urgency = 'normal';
    if (HIGH_URGENCY_REGEX.test(text) && (sentiment === 'negative' || !POSITIVE_WORDS.has(text.trim().toLowerCase()))) {
      // Ensure "no fake seed" or "not broken" doesn't trigger high urgency falsely
      const hasNegatedUrgency = /\b(no|not|never|without|hakuna|si|sio|pas|não|nao)\s+(fake|counterfeit|broken|failed|loss|hasara|bandia|feki|urgent)\b/i.test(text);
      if (!hasNegatedUrgency) {
        urgency = 'high';
      }
    }
    if (urgency === 'normal' && sentiment === 'negative' && sentimentScore <= -0.65) {
      urgency = 'high';
    } else if (urgency === 'normal' && (MEDIUM_URGENCY_REGEX.test(text) && sentiment === 'negative')) {
      urgency = 'medium';
    } else if (urgency === 'normal' && sentiment === 'negative' && isActionable) {
      urgency = 'medium';
    }

    return {
      sentiment,
      sentimentScore,
      isActionable,
      urgency,
      matchedKeywords
    };
  }

  function _assignThemes(text) {
    const rawTokens = String(text || '')
      .toLowerCase()
      .replace(/['’](?=[a-z])/g, '')
      .replace(/[^a-z0-9àáâãäåèéêëìíîïòóôõöùúûüñçýÿ\s-]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

    const tokenSet = new Set(rawTokens);
    const lowerText = String(text || '').toLowerCase();
    const scored = [];

    for (let i = 0; i < THEME_LOOKUP.length; i++) {
      const theme = THEME_LOOKUP[i];
      let hits = 0;
      for (const tok of tokenSet) {
        if (theme.keywordSet.has(tok)) hits++;
      }
      // Also check multi-word phrases inside keywords if any
      if (theme.id === 'time_agenda_management' && /\b(more time|enough time|short time|muda zaidi|wakati zaidi)\b/i.test(lowerText)) {
        hits += 2;
      }
      if (theme.id === 'participation_inclusion' && /\b(breakout groups?|small groups?|team building|cross[- ]?functional)\b/i.test(lowerText)) {
        hits += 2;
      }
      if (theme.id === 'strategy_action_planning' && /\b(action plan|next steps|follow[- ]?up)\b/i.test(lowerText)) {
        hits += 2;
      }
      if (theme.id === 'pests_disease_climate' && /\b(fall armyworm|late rains?|dry spell)\b/i.test(lowerText)) {
        hits += 2;
      }
      if (hits > 0) {
        scored.push({ theme, hits });
      }
    }

    if (scored.length === 0) {
      return [OTHER_THEME];
    }

    scored.sort((a, b) => b.hits - a.hits);
    return scored.slice(0, 3).map((s) => ({
      id: s.theme.id,
      name: s.theme.name,
      color: s.theme.color
    }));
  }

  function _resolveSegmentConfig(responses, survey, requestedSegQId) {
    const req = requestedSegQId || 'auto';
    if (req === 'county') {
      return {
        segmentQId: 'county',
        segmentLabel: 'County / Location',
        extract: (r) => _formatSegmentValue(r.answers?.q_county || r.answers?.cascading_county?.level1 || r.gps?.label) || 'Unspecified'
      };
    }
    if (req === 'enumerator') {
      return {
        segmentQId: 'enumerator',
        segmentLabel: 'Enumerator',
        extract: (r) => _formatSegmentValue(r.enumerator || r.enumeratorId) || 'Unspecified'
      };
    }

    const questions = _getSurveyQuestions(survey);
    if (req !== 'auto') {
      const matchedQ = questions.find((q) => q && q.id === req);
      if (matchedQ) {
        return {
          segmentQId: matchedQ.id,
          segmentLabel: _cleanQuestionTitle(matchedQ, {}, survey),
          extract: (r) => _formatSegmentValue(r.answers?.[matchedQ.id]) || 'Unspecified'
        };
      }
    }

    // Auto-select best segmenter: prefer rating/likert/nps/single_choice/dropdown with >= 2 distinct values
    const preferredTypes = ['rating', 'star_rating', 'emoji_rating', 'likert', 'nps', 'scale', 'single_choice', 'radio', 'dropdown', 'select'];
    const candidates = questions
      .filter((q) => q && preferredTypes.includes(String(q.type || '').toLowerCase()))
      .sort((a, b) => {
        const ai = preferredTypes.indexOf(String(a.type || '').toLowerCase());
        const bi = preferredTypes.indexOf(String(b.type || '').toLowerCase());
        return ai - bi;
      });

    for (let i = 0; i < candidates.length; i++) {
      const q = candidates[i];
      const distinct = new Set();
      for (let j = 0; j < responses.length; j++) {
        const val = _formatSegmentValue(responses[j]?.answers?.[q.id]);
        if (val) distinct.add(val);
      }
      if (distinct.size >= 2 && distinct.size <= 12) {
        return {
          segmentQId: q.id,
          segmentLabel: _cleanQuestionTitle(q, {}, survey),
          extract: (r) => _formatSegmentValue(r.answers?.[q.id]) || 'Unspecified'
        };
      }
    }

    // Fallback to county if >= 2 distinct counties exist
    const counties = new Set();
    for (let i = 0; i < responses.length; i++) {
      const c = _formatSegmentValue(responses[i]?.answers?.q_county || responses[i]?.answers?.cascading_county?.level1 || responses[i]?.gps?.label);
      if (c) counties.add(c);
    }
    if (counties.size >= 2) {
      return {
        segmentQId: 'county',
        segmentLabel: 'County / Location',
        extract: (r) => _formatSegmentValue(r.answers?.q_county || r.answers?.cascading_county?.level1 || r.gps?.label) || 'Unspecified'
      };
    }

    return {
      segmentQId: 'enumerator',
      segmentLabel: 'Enumerator',
      extract: (r) => _formatSegmentValue(r.enumerator || r.enumeratorId) || 'Unspecified'
    };
  }

  function _getGasConfig() {
    const store = typeof globalScope !== 'undefined' ? globalScope.aeStore : null;
    const settings = (store && store.settings) || {};
    const gasUrl = String(settings.gasWebAppUrl || '').trim();
    const syncToken = String(settings.syncToken || '').trim();
    const deviceId = String(settings.deviceId || 'ae-web-client').trim();
    const isValidUrl = store && typeof store.isValidGasUrl === 'function'
      ? store.isValidGasUrl(gasUrl)
      : /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec/i.test(gasUrl);
    const isOnline = store && typeof store.isEffectivelyOnline === 'function'
      ? store.isEffectivelyOnline()
      : (typeof navigator !== 'undefined' ? navigator.onLine !== false : true);
    return { gasUrl, syncToken, deviceId, isValidUrl, isOnline };
  }

  function _pinStorageKey(surveyId) {
    return `ae_verbatim_pins_v1_${String(surveyId || 'global').replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  }

  // --------------------------------------------------------------------------
  // 7. Public Engine Object: window.AETeXtEngine
  // --------------------------------------------------------------------------
  const AETeXtEngine = {
    version: '2.0.0',
    stopWords: STOP_WORDS,
    negationWords: NEGATION_WORDS,
    lexicon: {
      positive: Array.from(POSITIVE_WORDS),
      negative: Array.from(NEGATIVE_WORDS)
    },
    themesCatalog: THEME_DEFINITIONS.map((t) => ({ id: t.id, name: t.name, color: t.color })),

    /**
     * Sanitizes piped {{q_id}} placeholders in question titles.
     */
    cleanQuestionTitle(qOrTitle, answers, survey) {
      return _cleanQuestionTitle(qOrTitle, answers, survey);
    },

    /**
     * Returns all open-ended text questions in a survey
     * (short_text, long_text, audio_note transcripts; excludes obvious ID/date/numeric fields).
     */
    getTextQuestions(survey) {
      const allQs = _getSurveyQuestions(survey);
      const results = [];
      allQs.forEach((q, idx) => {
        if (!q || !q.id) return;
        const type = String(q.type || '').toLowerCase();
        if (!['short_text', 'long_text', 'audio_note', 'text', 'textarea'].includes(type)) return;
        if (_isObviousNonVerbatimShortText(q)) return;
        results.push({
          ...q,
          code: _extractQuestionCode(q, idx),
          cleanTitle: _cleanQuestionTitle(q, {}, survey)
        });
      });
      return results;
    },

    /**
     * Returns categorical/rating questions suitable for Theme x Segment breakdown.
     */
    getSegmentQuestions(survey) {
      const allQs = _getSurveyQuestions(survey);
      const allowed = new Set(['rating', 'star_rating', 'emoji_rating', 'likert', 'nps', 'scale', 'single_choice', 'radio', 'dropdown', 'select']);
      return allQs
        .filter((q) => q && q.id && allowed.has(String(q.type || '').toLowerCase()))
        .map((q, idx) => ({
          ...q,
          code: _extractQuestionCode(q, idx),
          cleanTitle: _cleanQuestionTitle(q, {}, survey)
        }));
    },

    /**
     * Primary Verbatim Intelligence Analyzer.
     * Supports BOTH:
     *  - Legacy signature: analyzeVerbatims(responses, 'q_field_notes')
     *  - Full signature:   analyzeVerbatims(responses, survey, {
     *                        questionId: 'all' | qId,
     *                        segmentQId: 'auto' | 'county' | 'enumerator' | qId,
     *                        translationsMap: {}
     *                      })
     */
    analyzeVerbatims(responses, surveyOrQId, options) {
      const safeResponses = Array.isArray(responses) ? responses : [];
      const opts = (options && typeof options === 'object') ? options : {};
      const translationsMap = (opts.translationsMap && typeof opts.translationsMap === 'object') ? opts.translationsMap : {};

      const isSurveyObject = Boolean(surveyOrQId && typeof surveyOrQId === 'object' && !Array.isArray(surveyOrQId));
      const survey = isSurveyObject ? surveyOrQId : null;
      const legacyQId = typeof surveyOrQId === 'string' ? surveyOrQId : (opts.questionId && opts.questionId !== 'all' ? opts.questionId : null);
      const requestedQId = opts.questionId || (isSurveyObject ? 'all' : (legacyQId || 'q_field_notes'));

      const textQuestions = survey ? this.getTextQuestions(survey) : [];
      const targetQuestions = survey
        ? (requestedQId === 'all'
          ? textQuestions
          : textQuestions.filter((q) => q.id === requestedQId))
        : [];

      const segConfig = _resolveSegmentConfig(safeResponses, survey, opts.segmentQId || 'auto');
      const surveyId = opts.surveyId || (survey && survey.id) || 'global';
      const pinnedSet = new Set(this.getPinnedQuotes(surveyId));

      const records = [];
      const termFreq = Object.create(null);
      const docFreq = Object.create(null);
      const bigramSet = new Set();

      let totalPos = 0;
      let totalNeg = 0;
      let totalNeu = 0;
      let totalActionable = 0;
      let totalUrgentHigh = 0;
      let totalUrgentMedium = 0;
      let sentimentScoreSum = 0;

      const themeAgg = Object.create(null);
      const segmentCounts = Object.create(null);

      const processEntry = (r, qMeta, rawText) => {
        const respId = String(r.clientResponseId || r.id || `resp_${records.length + 1}`);
        const qId = qMeta.id || 'q_field_notes';
        const recordKey = `${respId}::${qId}`;
        const translatedText = translationsMap[recordKey] || translationsMap[rawText] || '';
        const analysisText = translatedText ? `${translatedText} ${rawText}` : rawText;

        const signals = _scoreSentimentAndSignals(translatedText || rawText);
        const assignedThemes = _assignThemes(analysisText);
        const segmentVal = segConfig.extract(r) || 'Unspecified';
        const county = _formatSegmentValue(r.answers?.q_county || r.answers?.cascading_county?.level1 || r.gps?.label) || 'Kenya';
        const enumerator = _formatSegmentValue(r.enumerator || r.enumeratorId) || 'Anonymous';

        // TF-IDF unigrams + bigrams
        const cleanTokens = _tokenizeForTerms(translatedText || rawText);
        const docTerms = new Set();
        for (let i = 0; i < cleanTokens.length; i++) {
          const w = cleanTokens[i];
          termFreq[w] = (termFreq[w] || 0) + 1;
          docTerms.add(w);
          if (i < cleanTokens.length - 1) {
            const bg = `${w} ${cleanTokens[i + 1]}`;
            termFreq[bg] = (termFreq[bg] || 0) + 1;
            docTerms.add(bg);
            bigramSet.add(bg);
          }
        }
        docTerms.forEach((t) => {
          docFreq[t] = (docFreq[t] || 0) + 1;
        });

        if (signals.sentiment === 'positive') totalPos++;
        else if (signals.sentiment === 'negative') totalNeg++;
        else totalNeu++;

        if (signals.isActionable) totalActionable++;
        if (signals.urgency === 'high') totalUrgentHigh++;
        else if (signals.urgency === 'medium') totalUrgentMedium++;
        sentimentScoreSum += signals.sentimentScore;

        segmentCounts[segmentVal] = (segmentCounts[segmentVal] || 0) + 1;

        const record = {
          key: recordKey,
          id: respId,
          questionId: qId,
          questionCode: qMeta.code || 'Q',
          questionTitle: _cleanQuestionTitle(qMeta.title || qMeta.cleanTitle || qId, r.answers || {}, survey),
          enumerator,
          submittedAt: r.submittedAt || r.createdAt || '',
          county,
          segment: segmentVal,
          text: rawText,
          translatedText: translatedText || null,
          sentiment: signals.sentiment,
          sentimentScore: signals.sentimentScore,
          isActionable: signals.isActionable,
          urgency: signals.urgency,
          themes: assignedThemes,
          themeIds: assignedThemes.map((t) => t.id),
          themeNames: assignedThemes.map((t) => t.name),
          matchedKeywords: signals.matchedKeywords,
          isPinned: pinnedSet.has(recordKey)
        };

        records.push(record);

        // Update Theme x Sentiment and Theme x Segment accumulators
        assignedThemes.forEach((th) => {
          if (!themeAgg[th.id]) {
            themeAgg[th.id] = {
              id: th.id,
              name: th.name,
              color: th.color,
              count: 0,
              positive: 0,
              neutral: 0,
              negative: 0,
              scoreSum: 0,
              countsBySegment: Object.create(null),
              topQuote: '',
              topQuoteScore: -1,
              topQuoteRecord: null
            };
          }
          const bucket = themeAgg[th.id];
          bucket.count++;
          bucket[signals.sentiment]++;
          bucket.scoreSum += signals.sentimentScore;
          bucket.countsBySegment[segmentVal] = (bucket.countsBySegment[segmentVal] || 0) + 1;

          // Representative quote heuristic: informative length + clear valence/actionability
          const quoteQuality = Math.min(rawText.length, 180) / 180 + Math.abs(signals.sentimentScore) * 0.6 + (signals.isActionable ? 0.35 : 0);
          if (quoteQuality > bucket.topQuoteScore) {
            bucket.topQuoteScore = quoteQuality;
            bucket.topQuote = rawText.length > 220 ? `${rawText.slice(0, 217)}...` : rawText;
            bucket.topQuoteRecord = record;
          }
        });
      };

      // Extract verbatims across all responses
      safeResponses.forEach((r) => {
        if (!r || !r.answers || typeof r.answers !== 'object') return;

        if (survey && targetQuestions.length > 0) {
          targetQuestions.forEach((q) => {
            const text = _extractTextValue(r.answers[q.id]);
            if (text) {
              processEntry(r, q, text);
            }
          });
        } else {
          // Legacy single-question or heuristic extraction
          const fallbackKeys = [
            requestedQId && requestedQId !== 'all' ? requestedQId : null,
            'q_field_notes', 'q_verbatim', 'qe_takeaway', 'qd_notes'
          ].filter(Boolean);

          let matchedKey = null;
          let text = '';
          for (let i = 0; i < fallbackKeys.length; i++) {
            const k = fallbackKeys[i];
            const extracted = _extractTextValue(r.answers[k]);
            if (extracted) {
              matchedKey = k;
              text = extracted;
              break;
            }
          }

          if (!text) {
            for (const [k, v] of Object.entries(r.answers)) {
              if (typeof v === 'string' && v.trim().length >= 15 && !/^\d{4}-\d{2}-\d{2}/.test(v.trim()) && !v.startsWith('data:')) {
                matchedKey = k;
                text = v.trim();
                break;
              }
            }
          }

          if (text) {
            processEntry(r, { id: matchedKey || 'q_field_notes', code: 'Note', title: 'Field Note' }, text);
          }
        }
      });

      const totalAnalyzed = records.length;

      // Build TF-IDF topTerms (max 30)
      const topTerms = Object.keys(termFreq)
        .map((term) => {
          const tf = termFreq[term];
          const df = docFreq[term] || 1;
          const idf = 1 + Math.log((totalAnalyzed + 1) / (df + 1));
          const isBigram = bigramSet.has(term);
          const score = Number((tf * idf * (isBigram ? 1.25 : 1.0)).toFixed(3));
          return { term, count: tf, df, score, isBigram };
        })
        .filter((item) => item.count >= 1 && (!item.isBigram || item.count >= 2 || totalAnalyzed <= 6))
        .sort((a, b) => (b.score - a.score) || (b.count - a.count))
        .slice(0, 30);

      // Build sorted themes array (auto-pruned to >= 1 hit)
      const themes = Object.values(themeAgg)
        .filter((t) => t.count >= 1)
        .sort((a, b) => {
          if (a.id === OTHER_THEME.id && b.id !== OTHER_THEME.id) return 1;
          if (b.id === OTHER_THEME.id && a.id !== OTHER_THEME.id) return -1;
          return b.count - a.count;
        })
        .map((t) => ({
          id: t.id,
          name: t.name,
          color: t.color,
          count: t.count,
          pct: totalAnalyzed > 0 ? Number(((t.count / totalAnalyzed) * 100).toFixed(1)) : 0,
          positive: t.positive,
          neutral: t.neutral,
          negative: t.negative,
          netSentiment: t.count > 0 ? Math.round(((t.positive - t.negative) / t.count) * 100) : 0,
          avgSentimentScore: t.count > 0 ? Number((t.scoreSum / t.count).toFixed(2)) : 0,
          topQuote: t.topQuote,
          topQuoteRecord: t.topQuoteRecord
        }));

      // Build Theme x Segment matrix (top 8 segments by frequency)
      const segments = Object.entries(segmentCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([seg]) => seg);

      const themeBySegmentRows = themes.map((t) => {
        const rawBucket = themeAgg[t.id];
        const countsBySegment = {};
        segments.forEach((seg) => {
          countsBySegment[seg] = (rawBucket && rawBucket.countsBySegment[seg]) || 0;
        });
        return {
          themeId: t.id,
          theme: t.name,
          color: t.color,
          countsBySegment,
          total: t.count
        };
      });

      return {
        totalAnalyzed,
        questionId: requestedQId,
        textQuestions,
        sentimentSummary: {
          positive: totalPos,
          negative: totalNeg,
          neutral: totalNeu,
          avgScore: totalAnalyzed > 0 ? Number((sentimentScoreSum / totalAnalyzed).toFixed(2)) : 0,
          actionableCount: totalActionable,
          urgentHighCount: totalUrgentHigh,
          urgentMediumCount: totalUrgentMedium
        },
        themes,
        themeBySegment: {
          segmentQId: segConfig.segmentQId,
          segmentLabel: segConfig.segmentLabel,
          segments,
          rows: themeBySegmentRows
        },
        topTerms,
        records
      };
    },

    /**
     * Extractive Executive Briefing Generator (100% offline, instant, report-ready).
     */
    generateExecutiveBriefing(analysis, survey) {
      const safeAnalysis = analysis || { totalAnalyzed: 0, sentimentSummary: { positive: 0, neutral: 0, negative: 0, avgScore: 0 }, themes: [], records: [], themeBySegment: { segments: [], rows: [] } };
      const total = safeAnalysis.totalAnalyzed || 0;
      const surveyTitle = (survey && survey.title) ? String(survey.title).trim() : 'Survey Verbatim Analysis';

      if (total === 0) {
        const emptyHeadline = 'No open-ended verbatim responses available in the current filter view.';
        return {
          provider: 'offline_extractive',
          headline: emptyHeadline,
          summaryBullets: ['Collect or broaden filters to generate thematic insights and actionable recommendations.'],
          topThemesSummary: [],
          actionableRecommendations: [],
          urgentAlerts: [],
          plainTextReport: `${surveyTitle}\nExecutive Qualitative Briefing\n\n${emptyHeadline}`
        };
      }

      const ss = safeAnalysis.sentimentSummary || { positive: 0, neutral: 0, negative: 0, avgScore: 0 };
      const posPct = Math.round((ss.positive / total) * 100);
      const negPct = Math.round((ss.negative / total) * 100);
      const neuPct = Math.max(0, 100 - posPct - negPct);

      let toneLabel = 'balanced';
      if (posPct >= negPct + 15) toneLabel = 'predominantly positive';
      else if (negPct >= posPct + 15) toneLabel = 'predominantly critical';
      else if (posPct > negPct) toneLabel = 'moderately positive';
      else if (negPct > posPct) toneLabel = 'cautiously mixed';

      const topThemesSummary = (safeAnalysis.themes || []).slice(0, 5).map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
        count: t.count,
        pct: t.pct,
        positive: t.positive,
        neutral: t.neutral,
        negative: t.negative,
        netSentiment: t.netSentiment,
        valenceLabel: t.netSentiment >= 20 ? 'Positive' : (t.netSentiment <= -20 ? 'Negative' : 'Mixed'),
        topQuote: t.topQuote
      }));

      const leadThemesText = topThemesSummary.slice(0, 2)
        .map((t) => `${t.name} (${t.pct}%)`)
        .join(' and ');

      const headline = leadThemesText
        ? `Across ${total} verbatim response${total === 1 ? '' : 's'}, sentiment is ${toneLabel} (${posPct}% positive, ${negPct}% negative), led by ${leadThemesText}.`
        : `Across ${total} verbatim response${total === 1 ? '' : 's'}, sentiment is ${toneLabel} (${posPct}% positive, ${negPct}% negative).`;

      // Rank top 5 actionable recommendations (diverse across themes)
      const actionablePool = (safeAnalysis.records || [])
        .filter((r) => r.isActionable)
        .map((r) => ({
          record: r,
          rankScore: (r.urgency === 'high' ? 3 : r.urgency === 'medium' ? 2 : 1) +
            Math.min((r.text || '').length, 200) / 100 +
            (r.isPinned ? 1.5 : 0)
        }))
        .sort((a, b) => b.rankScore - a.rankScore);

      const actionableRecommendations = [];
      const seenActionTexts = new Set();
      for (let i = 0; i < actionablePool.length && actionableRecommendations.length < 5; i++) {
        const r = actionablePool[i].record;
        const norm = (r.text || '').toLowerCase().trim();
        if (seenActionTexts.has(norm)) continue;
        seenActionTexts.add(norm);
        actionableRecommendations.push({
          key: r.key,
          id: r.id,
          text: r.text,
          translatedText: r.translatedText || null,
          questionCode: r.questionCode,
          questionTitle: r.questionTitle,
          themes: r.themeNames || [],
          sentiment: r.sentiment,
          sentimentScore: r.sentimentScore,
          urgency: r.urgency,
          segment: r.segment,
          enumerator: r.enumerator
        });
      }

      // Rank top 5 urgent alerts (high first, then medium negative)
      const urgentPool = (safeAnalysis.records || [])
        .filter((r) => r.urgency === 'high' || (r.urgency === 'medium' && r.sentiment === 'negative'))
        .sort((a, b) => {
          const uRank = (u) => (u === 'high' ? 2 : u === 'medium' ? 1 : 0);
          const diff = uRank(b.urgency) - uRank(a.urgency);
          if (diff !== 0) return diff;
          return (a.sentimentScore || 0) - (b.sentimentScore || 0);
        });

      const urgentAlerts = [];
      const seenUrgentTexts = new Set();
      for (let i = 0; i < urgentPool.length && urgentAlerts.length < 5; i++) {
        const r = urgentPool[i];
        const norm = (r.text || '').toLowerCase().trim();
        if (seenUrgentTexts.has(norm)) continue;
        seenUrgentTexts.add(norm);
        urgentAlerts.push({
          key: r.key,
          id: r.id,
          text: r.text,
          translatedText: r.translatedText || null,
          questionCode: r.questionCode,
          questionTitle: r.questionTitle,
          themes: r.themeNames || [],
          sentiment: r.sentiment,
          sentimentScore: r.sentimentScore,
          urgency: r.urgency,
          segment: r.segment,
          enumerator: r.enumerator
        });
      }

      const summaryBullets = [
        `Sentiment mix: ${ss.positive} Positive (${posPct}%), ${ss.neutral} Neutral (${neuPct}%), and ${ss.negative} Negative (${negPct}%) — mean score ${(ss.avgScore || 0) >= 0 ? '+' : ''}${(ss.avgScore || 0).toFixed(2)}.`
      ];

      if (topThemesSummary.length > 0) {
        const top = topThemesSummary[0];
        summaryBullets.push(
          `Most discussed theme: ${top.name} (${top.count} mentions, ${top.pct}% of verbatims; net sentiment ${top.netSentiment >= 0 ? '+' : ''}${top.netSentiment}%).`
        );
      }

      const mostNegativeTheme = topThemesSummary
        .filter((t) => t.negative > 0)
        .sort((a, b) => a.netSentiment - b.netSentiment)[0];
      if (mostNegativeTheme && mostNegativeTheme.netSentiment < 0) {
        summaryBullets.push(
          `Primary pain point: ${mostNegativeTheme.name} carries the lowest net sentiment (${mostNegativeTheme.netSentiment}%, ${mostNegativeTheme.negative} negative mentions).`
        );
      }

      summaryBullets.push(
        `Actionability & risk: ${ss.actionableCount || actionableRecommendations.length} actionable suggestions identified and ${ss.urgentHighCount || 0} high-urgency alert${(ss.urgentHighCount || 0) === 1 ? '' : 's'} flagged.`
      );

      // Compose clean copy-pasteable plainTextReport
      const lines = [
        `EXECUTIVE VERBATIM BRIEFING — ${surveyTitle}`,
        `Generated: ${new Date().toISOString().slice(0, 10)} | Sample: ${total} verbatims`,
        '',
        `HEADLINE`,
        headline,
        '',
        `KEY FINDINGS`,
        ...summaryBullets.map((b) => `- ${b}`)
      ];

      if (topThemesSummary.length > 0) {
        lines.push('', 'TOP THEMES');
        topThemesSummary.forEach((t, idx) => {
          lines.push(`${idx + 1}. ${t.name}: ${t.count} (${t.pct}%) | +${t.positive} / ~${t.neutral} / -${t.negative} | Net ${t.netSentiment >= 0 ? '+' : ''}${t.netSentiment}%`);
        });
      }

      if (actionableRecommendations.length > 0) {
        lines.push('', 'TOP ACTIONABLE RECOMMENDATIONS');
        actionableRecommendations.forEach((rec, idx) => {
          const display = rec.translatedText ? `${rec.translatedText} [Orig: ${rec.text}]` : rec.text;
          lines.push(`${idx + 1}. [${rec.questionCode}] "${display}" (${rec.segment})`);
        });
      }

      if (urgentAlerts.length > 0) {
        lines.push('', 'URGENT RISK ALERTS');
        urgentAlerts.forEach((al, idx) => {
          const display = al.translatedText ? `${al.translatedText} [Orig: ${al.text}]` : al.text;
          lines.push(`${idx + 1}. [${String(al.urgency || 'high').toUpperCase()} | ${al.questionCode}] "${display}" (${al.segment})`);
        });
      }

      return {
        provider: 'offline_extractive',
        headline,
        summaryBullets,
        topThemesSummary,
        actionableRecommendations,
        urgentAlerts,
        plainTextReport: lines.join('\n')
      };
    },

    // ------------------------------------------------------------------------
    // 8. Pinned Quotes Persistence (localStorage with in-memory fallback)
    // ------------------------------------------------------------------------
    getPinnedQuotes(surveyId) {
      const storageKey = _pinStorageKey(surveyId);
      try {
        if (typeof globalScope !== 'undefined' && globalScope.localStorage) {
          const raw = globalScope.localStorage.getItem(storageKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed.map(String);
          }
          return [];
        }
      } catch (e) {}
      return Array.from(_memPinStore.get(storageKey) || []);
    },

    isQuotePinned(surveyId, recordKey) {
      if (!recordKey) return false;
      return this.getPinnedQuotes(surveyId).includes(String(recordKey));
    },

    togglePinQuote(surveyId, recordKey) {
      if (!recordKey) return { pinned: false, pins: this.getPinnedQuotes(surveyId) };
      const storageKey = _pinStorageKey(surveyId);
      const keyStr = String(recordKey);
      const current = new Set(this.getPinnedQuotes(surveyId));
      let pinned = false;
      if (current.has(keyStr)) {
        current.delete(keyStr);
        pinned = false;
      } else {
        current.add(keyStr);
        pinned = true;
      }
      const nextArr = Array.from(current);
      try {
        if (typeof globalScope !== 'undefined' && globalScope.localStorage) {
          globalScope.localStorage.setItem(storageKey, JSON.stringify(nextArr));
        } else {
          _memPinStore.set(storageKey, nextArr);
        }
      } catch (e) {
        _memPinStore.set(storageKey, nextArr);
      }
      return { pinned, pins: nextArr };
    },

    // ------------------------------------------------------------------------
    // 9. Hybrid Cloud GAS Helpers (BATCH_TRANSLATE & ANALYZE_VERBATIMS_AI)
    // ------------------------------------------------------------------------
    async translateVerbatimsViaGAS(records, targetLang = 'en', options = {}) {
      const safeRecords = Array.isArray(records) ? records : [];
      const cfg = _getGasConfig();
      if (!cfg.isOnline || !cfg.gasUrl || !cfg.isValidUrl) {
        return {
          ok: false,
          offline: true,
          translations: {},
          translatedCount: 0,
          error: 'Device is offline or Google Apps Script Web App URL is not configured.'
        };
      }

      if (typeof fetch !== 'function') {
        return {
          ok: false,
          offline: true,
          translations: {},
          translatedCount: 0,
          error: 'Fetch API unavailable in current runtime.'
        };
      }

      // Deduplicate non-empty verbatim strings (capped at 150 per GAS batch)
      const items = [];
      const uniqueTexts = [];
      const textIndexMap = new Map();

      safeRecords.forEach((rec) => {
        const rawText = typeof rec === 'string' ? rec.trim() : String((rec && rec.text) || '').trim();
        const key = typeof rec === 'object' && rec ? (rec.key || rec.id || rawText) : rawText;
        if (!rawText) return;
        items.push({ key, rawText });
        if (!textIndexMap.has(rawText)) {
          textIndexMap.set(rawText, uniqueTexts.length);
          uniqueTexts.push(rawText);
        }
      });

      if (uniqueTexts.length === 0) {
        return { ok: true, translations: {}, translatedCount: 0, targetLang };
      }

      const translations = {};
      let translatedCount = 0;
      const batchSize = 150;

      try {
        for (let offset = 0; offset < uniqueTexts.length; offset += batchSize) {
          const chunk = uniqueTexts.slice(offset, offset + batchSize);
          const payload = {
            action: 'BATCH_TRANSLATE',
            syncToken: cfg.syncToken,
            deviceId: cfg.deviceId,
            sourceLang: options.sourceLang !== undefined ? String(options.sourceLang) : '',
            targetLang: String(targetLang || 'en').trim().toLowerCase(),
            texts: chunk
          };

          const res = await fetch(cfg.gasUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload),
            redirect: 'follow'
          });

          if (!res || !res.ok) {
            return {
              ok: false,
              translations,
              translatedCount,
              error: `Translation request failed (HTTP ${res ? res.status : 'network'}).`
            };
          }

          const data = await res.json();
          if (!data || !data.ok || !Array.isArray(data.translations)) {
            return {
              ok: false,
              translations,
              translatedCount,
              error: (data && data.error) || 'Invalid translation response from GAS backend.'
            };
          }

          for (let i = 0; i < chunk.length; i++) {
            const orig = chunk[i];
            const tr = String(data.translations[i] || orig).trim();
            translations[orig] = tr;
            if (tr && tr.toLowerCase() !== orig.toLowerCase()) {
              translatedCount++;
            }
          }
        }

        // Also map by recordKey for direct lookup in analyzeVerbatims()
        items.forEach(({ key, rawText }) => {
          if (translations[rawText]) {
            translations[key] = translations[rawText];
          }
        });

        return {
          ok: true,
          translations,
          translatedCount,
          targetLang: String(targetLang || 'en').trim().toLowerCase()
        };
      } catch (err) {
        return {
          ok: false,
          offline: true,
          translations,
          translatedCount,
          error: (err && err.message) || 'Network error during cloud translation.'
        };
      }
    },

    async synthesizeVerbatimsViaGAS(analysis, survey) {
      const offlineBriefing = this.generateExecutiveBriefing(analysis, survey);
      const cfg = _getGasConfig();

      if (!cfg.isOnline || !cfg.gasUrl || !cfg.isValidUrl || typeof fetch !== 'function') {
        return {
          ok: true,
          provider: 'offline_fallback',
          configured: false,
          briefing: offlineBriefing,
          message: 'Offline or GAS Web App URL not configured; using local offline NLP briefing.'
        };
      }

      const records = (analysis && Array.isArray(analysis.records)) ? analysis.records : [];
      if (records.length === 0) {
        return {
          ok: true,
          provider: 'offline_fallback',
          configured: true,
          briefing: offlineBriefing,
          message: 'No verbatims to synthesize.'
        };
      }

      const sample = records.slice(0, 80).map((r) => ({
        id: r.id,
        question: r.questionCode || r.questionTitle || 'Q',
        text: String(r.translatedText || r.text || '').slice(0, 350),
        sentiment: r.sentiment,
        themes: r.themeNames || [],
        segment: r.segment || ''
      }));

      try {
        const payload = {
          action: 'ANALYZE_VERBATIMS_AI',
          syncToken: cfg.syncToken,
          deviceId: cfg.deviceId,
          surveyId: (survey && survey.id) || '',
          surveyTitle: (survey && survey.title) || 'AE Survey',
          verbatims: sample,
          summaryStats: {
            total: analysis.totalAnalyzed,
            sentimentSummary: analysis.sentimentSummary,
            topThemes: (analysis.themes || []).slice(0, 6).map((t) => ({
              name: t.name,
              count: t.count,
              pct: t.pct,
              netSentiment: t.netSentiment
            }))
          }
        };

        const res = await fetch(cfg.gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
          redirect: 'follow'
        });

        if (!res || !res.ok) {
          return {
            ok: true,
            provider: 'offline_fallback',
            configured: false,
            briefing: offlineBriefing,
            message: `GAS AI endpoint returned HTTP ${res ? res.status : 'error'}; using offline NLP briefing.`
          };
        }

        const data = await res.json();
        if (data && data.ok && data.provider === 'gemini' && data.briefing) {
          const ai = data.briefing;
          const mergedBriefing = {
            ...offlineBriefing,
            provider: 'gemini',
            model: data.model || 'gemini-2.5-flash',
            headline: ai.headline || offlineBriefing.headline,
            summaryBullets: Array.isArray(ai.summaryBullets) && ai.summaryBullets.length > 0 ? ai.summaryBullets : offlineBriefing.summaryBullets,
            aiTopThemes: Array.isArray(ai.topThemes) ? ai.topThemes : [],
            aiRecommendations: Array.isArray(ai.recommendations) ? ai.recommendations : [],
            aiUrgentRisks: Array.isArray(ai.urgentRisks) ? ai.urgentRisks : []
          };
          return {
            ok: true,
            provider: 'gemini',
            configured: true,
            model: data.model || 'gemini-2.5-flash',
            briefing: mergedBriefing,
            serverTime: data.serverTime || new Date().toISOString()
          };
        }

        return {
          ok: true,
          provider: 'offline_fallback',
          configured: Boolean(data && data.configured),
          briefing: offlineBriefing,
          message: (data && (data.message || data.error)) || 'AI synthesis unavailable; using local offline NLP briefing.'
        };
      } catch (err) {
        return {
          ok: true,
          provider: 'offline_fallback',
          configured: false,
          briefing: offlineBriefing,
          message: (err && err.message) || 'Network error; using local offline NLP briefing.'
        };
      }
    }
  };

  if (typeof globalScope !== 'undefined') {
    globalScope.AETeXtEngine = AETeXtEngine;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AETeXtEngine;
  }
})(typeof window !== 'undefined' ? window : globalThis);
