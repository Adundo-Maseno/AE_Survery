/**
 * ============================================================================
 * AE SURVEY — Qualitative & Verbatim Intelligence Engine (window.AETeXtEngine)
 * Zero-Dependency, 100% Offline-First, Domain-Agnostic Multilingual NLP Module
 *
 * Capabilities:
 *  1. Multi-Question Extraction (short_text, long_text, audio_note transcripts)
 *     with clean piped-title sanitization and backward-compatible API.
 *  2. Domain-Agnostic & Multilingual (EN / SW / FR / PT) Negation-Aware
 *     Sentiment Scoring (-1.0 to +1.0) with 3-word lookbehind negation window
 *     and clause resets.
 *  3. Actionability & Urgency Risk Detection (recommendations vs. critical alerts).
 *  4. Dynamic 3-Layer Theme Engine (Zero Hardcoded Domain Taxonomy):
 *     - Layer 1: Survey-Specific Custom Codebook persisted in localStorage
 *                (`ae_custom_themes_<surveyId>`).
 *     - Layer 2: Unsupervised Dynamic Topic Discovery (TF-IDF unigrams &
 *                bigrams clustered by co-occurrence into 8-10 clean Title-Cased
 *                themes directly from the survey's actual verbatims).
 *     - Layer 3: Per-Question Verbatim Breakdown (`byQuestion`) for side-by-side
 *                comparison across every open-ended question in the survey.
 *  5. Dynamic Segment Discovery (`getSegmentOptions`) driven strictly by the
 *     survey's actual questions, GPS/location data (if present), and enumerators.
 *  6. Extractive Executive Briefing Generator + Pinned Quotes Persistence +
 *     Hybrid Cloud GAS Helpers (BATCH_TRANSLATE & ANALYZE_VERBATIMS_AI).
 * ============================================================================
 */

(function (globalScope) {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. Pure Grammatical Stop Words (EN, SW, FR, PT) — Zero Domain Nouns
  // --------------------------------------------------------------------------
  const STOP_WORDS = new Set([
    // English function words
    'the', 'and', 'to', 'of', 'a', 'an', 'in', 'for', 'is', 'on', 'that', 'by', 'this', 'with',
    'i', 'you', 'it', 'or', 'be', 'are', 'from', 'at', 'as', 'your', 'all', 'have', 'has', 'had',
    'was', 'were', 'we', 'our', 'us', 'they', 'them', 'their', 'he', 'she', 'his', 'her', 'its',
    'will', 'would', 'can', 'could', 'may', 'might', 'shall', 'do', 'does', 'did', 'done', 'my',
    'me', 'so', 'if', 'but', 'about', 'into', 'out', 'up', 'down', 'over', 'under', 'just', 'also',
    'very', 'really', 'quite', 'too', 'much', 'many', 'some', 'any', 'more', 'most', 'other',
    'than', 'then', 'there', 'here', 'when', 'where', 'what', 'which', 'who', 'whom', 'whose',
    'how', 'why', 'been', 'being', 'get', 'got', 'make', 'made', 'like', 'one', 'two', 'well',
    'even', 'still', 'only', 'such', 'each', 'both', 'few', 'own', 'same', 'through', 'during',
    'before', 'after', 'between', 'while', 'because', 'since', 'until', 'though', 'although',
    'however', 'therefore', 'these', 'those', 'yes', 'ok', 'okay', 'etc', 'able', 'lot', 'lots',
    'bit', 'way', 'things', 'thing', 'per', 'via', 'not', 'no', 'nor', 'too', 'very',
    // Swahili function words
    'na', 'ya', 'wa', 'kwa', 'ni', 'katika', 'la', 'za', 'cha', 'vya', 'ili', 'kama', 'hadi',
    'yake', 'sana', 'yangu', 'hawa', 'hiyo', 'hii', 'wale', 'wote', 'pia', 'lakini', 'ingawa',
    'ndani', 'kwenye', 'kutoka', 'baada', 'kabla', 'kuhusu', 'kila', 'zaidi', 'tu', 'hata',
    'sasa', 'tena', 'bado', 'kuwa', 'alikuwa', 'walikuwa', 'ilikuwa', 'yeye', 'mimi', 'sisi',
    'wao', 'ninyi', 'wewe', 'hapa', 'pale', 'kule', 'huko', 'kwamba', 'au', 'ama', 'ila',
    // French function words
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'en', 'au', 'aux', 'pour', 'par',
    'sur', 'dans', 'avec', 'est', 'sont', 'était', 'être', 'avoir', 'nous', 'vous', 'ils',
    'elles', 'que', 'qui', 'quoi', 'ce', 'cette', 'ces', 'mais', 'ou', 'donc', 'car', 'très',
    'plus', 'moins', 'tout', 'tous', 'bien', 'aussi', 'comme', 'leur', 'leurs', 'notre', 'votre',
    // Portuguese function words
    'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'do', 'da', 'dos', 'das', 'em', 'no',
    'na', 'nos', 'nas', 'por', 'para', 'com', 'que', 'e', 'é', 'são', 'foi', 'ser', 'estar',
    'ter', 'nós', 'você', 'vocês', 'eles', 'elas', 'mas', 'ou', 'como', 'muito', 'mais', 'menos',
    'todo', 'todos', 'também', 'isso', 'este', 'esta', 'esse', 'essa', 'seu', 'sua', 'nosso'
  ]);

  // Generic adjectives/action verbs excluded ONLY from anchoring unsupervised topic names
  // (never removed from topTerms or sentiment scoring)
  const TOPIC_ANCHOR_NOISE = new Set([
    'good', 'great', 'best', 'better', 'bad', 'worse', 'worst', 'nice', 'fine', 'poor',
    'excellent', 'awesome', 'amazing', 'wonderful', 'fantastic', 'outstanding', 'superb',
    'terrible', 'horrible', 'awful', 'happy', 'pleased', 'satisfied', 'disappointed',
    'disappointing', 'frustrated', 'frustrating', 'please', 'thank', 'thanks', 'thankful',
    'grateful', 'appreciate', 'appreciated', 'recommend', 'recommended', 'suggest', 'suggested',
    'suggestion', 'suggestions', 'improve', 'improved', 'improvement', 'consider', 'should',
    'need', 'needs', 'needed', 'want', 'wanted', 'think', 'thought', 'feel', 'felt', 'know',
    'give', 'gave', 'take', 'took', 'keep', 'kept', 'come', 'came', 'went', 'going', 'used',
    'using', 'use', 'try', 'tried', 'overall', 'general', 'always', 'never', 'often', 'sometimes',
    'next', 'last', 'first', 'second', 'third', 'really', 'actually', 'basically', 'definitely',
    'especially', 'particularly', 'extremely', 'highly', 'completely', 'totally', 'absolutely',
    'enough', 'sufficient', 'insufficient', 'adequate', 'inadequate', 'little', 'small', 'large',
    'big', 'high', 'low', 'long', 'short', 'new', 'old', 'different', 'important', 'helpful',
    'useful', 'valuable', 'positive', 'negative', 'neutral',
    // Swahili generic sentiment/request modifiers
    'mzuri', 'nzuri', 'vizuri', 'mbaya', 'vibaya', 'bora', 'safi', 'poa', 'asante', 'hongera',
    'shukrani', 'tafadhali', 'napendekeza', 'pendekeza', 'kabisa', 'mno', 'kubwa', 'ndogo',
    'nyingi', 'chache', 'inafaa', 'tunahitaji', 'boresha', 'kuboresha',
    // French / Portuguese generic modifiers
    'bon', 'bonne', 'bons', 'bonnes', 'mauvais', 'mauvaise', 'merci', 'bravo', 'devrait',
    'bom', 'boa', 'ruim', 'otimo', 'ótimo', 'obrigado', 'deveria', 'precisamos', 'melhorar'
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
    // General / Corporate / Team / Education / Retail / Healthcare / Field (EN)
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
    'caring', 'compassionate', 'empathetic', 'gentle', 'courteous', 'polite', 'kind',
    'thorough', 'reassuring', 'hygienic', 'sanitary', 'spotless', 'accurate', 'fast', 'quick',
    'reliable', 'quality', 'affordable', 'fair', 'timely', 'available', 'clean', 'fresh',
    'robust', 'resilient', 'profitable', 'profit', 'healthy', 'thriving', 'abundant',
    'uniform', 'germinated', 'germination', 'vigor', 'vigorous', 'tolerant', 'drought-tolerant',
    'heavy', 'sweet', 'high-yielding', 'yielding', 'bumper', 'certified', 'pure', 'resistant',
    'fertile',
    // Swahili
    'mzuri', 'nzuri', 'vizuri', 'bora', 'faida', 'kuvuna', 'haraka', 'kinga', 'stahimili',
    'halisi', 'nafuu', 'mapema', 'asante', 'hongera', 'safi', 'poa', 'kubwa', 'nyingi',
    'furaha', 'kuridhika', 'manufaa', 'mafanikio', 'ushirikiano', 'uwazi', 'ubora', 'imara',
    'rahisi', 'salama', 'inapendeza', 'pendeza', 'shukrani',
    // French
    'bon', 'bonne', 'bons', 'bonnes', 'excellent', 'excellente', 'super', 'génial', 'genial',
    'utile', 'clair', 'claire', 'organisé', 'organise', 'interactif', 'collaboratif',
    'satisfait', 'satisfaite', 'efficace', 'fiable', 'rapide', 'abordable', 'qualité',
    'qualite', 'merci', 'bravo', 'positif', 'positive', 'productif', 'pertinent', 'suffisant',
    'propre', 'aimable', 'attentif', 'attentive',
    // Portuguese
    'bom', 'boa', 'ótimo', 'otimo', 'ótima', 'otima', 'excelente', 'maravilhoso', 'útil',
    'util', 'claro', 'clara', 'organizado', 'interativo', 'colaborativo', 'satisfeito',
    'satisfeita', 'eficaz', 'confiável', 'confiavel', 'rápido', 'rapido', 'acessível',
    'acessivel', 'qualidade', 'produtivo', 'produtiva', 'saudável', 'saudavel', 'obrigado',
    'positivo', 'positiva', 'relevante', 'suficiente', 'inspirador', 'limpo', 'atencioso'
  ]);

  const NEGATIVE_WORDS = new Set([
    // General / Corporate / Healthcare / Service / Retail / Education / Field (EN)
    'bad', 'worse', 'worst', 'terrible', 'horrible', 'awful', 'disappointed', 'disappointing',
    'frustrating', 'frustrated', 'frustration', 'rushed', 'rushing', 'disorganized', 'chaotic',
    'chaos', 'confusing', 'confused', 'confusion', 'unclear', 'vague', 'boring', 'tedious',
    'repetitive', 'insufficient', 'missing', 'excluded', 'exclusion', 'ignored', 'sidelined',
    'dominated', 'unfair', 'biased', 'rude', 'unprofessional', 'unprepared', 'noisy', 'crowded',
    'overcrowded', 'understaffed', 'uncomfortable', 'slow', 'tiring', 'exhausting', 'waste',
    'wasted', 'pointless', 'irrelevant', 'disconnected', 'siloed', 'tension', 'conflict',
    'stressful', 'overwhelming', 'overwhelmed', 'limited', 'inadequate', 'mediocre', 'subpar',
    'underwhelming', 'awkward', 'unstructured', 'unfocused', 'distracted', 'defensive',
    'hesitant', 'uncertain', 'difficult', 'hard', 'struggle', 'struggled', 'struggling',
    'negative', 'unhelpful', 'unresponsive', 'shortcoming', 'shortcomings', 'gap', 'gaps',
    'bottleneck', 'bottlenecks', 'concern', 'concerns', 'risk', 'risks', 'error', 'errors',
    'bug', 'bugs', 'crash', 'crashed', 'scam', 'fraud', 'corrupt', 'unsafe', 'hazard', 'toxic',
    'hostile', 'unacceptable', 'dirty', 'unclean', 'unsanitary', 'unhygienic', 'neglect',
    'neglected', 'negligent', 'negligence', 'dismissive', 'overcharged', 'misdiagnosed',
    'painful', 'incompetent', 'fake', 'counterfeit', 'adulterated', 'expired', 'stockout',
    'stockouts', 'shortage', 'shortages', 'unavailable', 'late', 'delayed', 'delay', 'delays',
    'rot', 'rotting', 'rotten', 'pest', 'pests', 'armyworm', 'borer', 'striga', 'blight',
    'disease', 'diseases', 'drought', 'dry', 'wilting', 'yellowing', 'stunted', 'poor', 'weak',
    'loss', 'losses', 'failed', 'failure', 'fail', 'expensive', 'costly', 'overpriced',
    'unaffordable', 'complaint', 'complaints', 'problem', 'problems', 'issue', 'issues',
    'broken', 'damaged', 'damage', 'contaminated', 'spoiled', 'scarce', 'scarcity',
    'defective', 'substandard',
    // Swahili
    'gumu', 'ngumu', 'hasara', 'ghali', 'wadudu', 'ugonjwa', 'magonjwa', 'ukame', 'kuchelewa',
    'chelewa', 'mbaya', 'vibaya', 'mbovu', 'bandia', 'feki', 'uhaba', 'tatizo', 'matatizo',
    'malalamiko', 'kufa', 'kauka', 'oza', 'haribika', 'shida', 'upungufu', 'duni', 'fujo',
    'changamoto', 'machungu', 'kutengwa', 'udanganyifu', 'chafu',
    // French
    'mauvais', 'mauvaise', 'cher', 'chère', 'chere', 'retard', 'faux', 'fausse', 'contrefait',
    'perte', 'pertes', 'ravageurs', 'maladie', 'sécheresse', 'secheresse', 'problème',
    'probleme', 'problèmes', 'problemes', 'confus', 'désorganisé', 'desorganise', 'insuffisant',
    'lent', 'ennuyeux', 'déçu', 'decu', 'frustrant', 'exclu', 'manque', 'rupture', 'faible',
    'sale', 'impoli',
    // Portuguese
    'ruim', 'péssimo', 'pessimo', 'caro', 'cara', 'atraso', 'atrasado', 'atrasada', 'falso',
    'falsa', 'falsificado', 'praga', 'pragas', 'doença', 'doenca', 'seca', 'perda', 'perdas',
    'problema', 'problemas', 'fraco', 'fraca', 'confuso', 'desorganizado', 'insuficiente',
    'lento', 'chato', 'frustrante', 'excluído', 'excluido', 'falta', 'falha', 'quebrado',
    'reclamação', 'reclamacao', 'sujo', 'grosseiro'
  ]);

  // --------------------------------------------------------------------------
  // 4. Actionability & Urgency Detectors (Domain-Agnostic, Multilingual)
  // --------------------------------------------------------------------------
  const ACTIONABLE_REGEX = new RegExp(
    '(?:\\b(?:' +
      // English
      'should|recommend|recommended|recommendation|recommendations|suggest|suggested|suggestion|suggestions|' +
      'improve|improved|improvement|improvements|consider|propose|proposed|proposal|encourage|' +
      'please|wish|hope|prioritize|strengthen|expand|increase|reduce|provide|ensure|allocate|include|' +
      'follow-up|actionable|better|hire|add|upgrade|fix|resolve|train|streamline|' +
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
      'negligence|malpractice|unsanitary|misdiagnosed|infection|contamination|contaminated|' +
      'bandia|feki|hasara|kufa|dharura|udanganyifu|kutengwa|' +
      'contrefait|fraude|urgence|dangereux|falsificado|urgente|emergência|emergencia' +
    ')\\b|(?:\\b(?:total loss|zero germination|did not germinate|never arrived|no germination|not working|wrong medication|wrong bill)\\b)',
    'i'
  );

  const MEDIUM_URGENCY_REGEX = new RegExp(
    '\\b(?:' +
      'stockout|stockouts|shortage|shortages|delayed|delay|delays|late|rushed|disorganized|confusing|unclear|' +
      'overpriced|expensive|costly|overcharged|complaint|complaints|problem|problems|issue|issues|' +
      'understaffed|overcrowded|dirty|unclean|rude|dismissive|frustrating|disappointed|inadequate|insufficient|' +
      'armyworm|pest|pests|drought|disease|blight|wilting|stunted|' +
      'ghali|kuchelewa|wadudu|ukame|ugonjwa|uhaba|tatizo|matatizo|malalamiko|chafu|' +
      'retard|cher|ravageurs|problème|probleme|atraso|caro|praga|seca' +
    ')\\b',
    'i'
  );

  // --------------------------------------------------------------------------
  // 5. Dynamic Theme Palette & Fallback Constant (Zero Static Domain Themes)
  // --------------------------------------------------------------------------
  const DYNAMIC_THEME_PALETTE = [
    '#247B50', '#2563EB', '#D97706', '#7C3AED', '#0D9488',
    '#DB2777', '#0284C7', '#EA580C', '#4F46E5', '#059669'
  ];

  const GENERAL_THEME = {
    id: 'general_feedback',
    name: 'General Feedback',
    color: '#6B7280',
    isCustom: false,
    isFallback: true
  };

  // In-memory fallbacks when localStorage is unavailable (e.g. headless Node tests)
  const _memPinStore = new Map();
  const _memCustomThemeStore = new Map();

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
    const ansObj = answers && typeof answers === 'object' ? answers : {};
    return raw
      .replace(/\{\{\s*([^}]+?)\s*\}\}/g, function (_m, refId) {
        const key = String(refId || '').trim();
        if (ansObj[key] !== undefined && ansObj[key] !== null && String(ansObj[key]).trim() !== '') {
          const val = ansObj[key];
          return Array.isArray(val) ? val.join(', ') : String(val).trim();
        }
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
    if (prefixMatch) {
      return prefixMatch[1].replace(/^q/i, 'Q').replace(/([A-Z])$/, (c) => c.toLowerCase());
    }
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
    if (/(comment|note|feedback|reason|why|explain|suggest|takeaway|describe|verbatim|remark|improve|thought|experience|opinion|challenge|lesson|highlight|recommend|elaborate|share|tell us|what did|how can)/i.test(combined)) {
      return false;
    }
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

  function _toTitleCase(phrase) {
    return String(phrase || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => {
        if (w.length <= 3 && /^[a-z0-9]+$/i.test(w) && ['hr', 'it', 'qa', 'ui', 'ux', 'er', 'icu', 'gps', 'nps', 'kpi', 'okr', 'dap', 'npk', 'can'].includes(w.toLowerCase())) {
          return w.toUpperCase();
        }
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(' ');
  }

  function _slugify(str) {
    return String(str || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 48) || 'theme';
  }

  function _simpleStem(word) {
    const w = String(word || '').toLowerCase();
    if (w.length <= 4) return w;
    if (w.endsWith('ies') && w.length > 5) return w.slice(0, -3) + 'y';
    if (w.endsWith('ing') && w.length > 6) return w.slice(0, -3);
    if (w.endsWith('ed') && w.length > 5) return w.slice(0, -2);
    if (w.endsWith('es') && w.length > 5) return w.slice(0, -2);
    if (w.endsWith('s') && !w.endsWith('ss') && w.length > 4) return w.slice(0, -1);
    return w;
  }

  function _tokenizeForSentiment(text) {
    const normalized = String(text || '')
      .toLowerCase()
      .replace(/['’](?=[a-z])/g, '')
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
        if (negated) posWeight += weight * 0.85;
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
      const raw = (net / (total + 0.75)) * 1.25;
      sentimentScore = Math.max(-1, Math.min(1, Number(raw.toFixed(2))));
    }

    let sentiment = 'neutral';
    if (sentimentScore >= 0.15) sentiment = 'positive';
    else if (sentimentScore <= -0.15) sentiment = 'negative';

    const isActionable = ACTIONABLE_REGEX.test(text);

    let urgency = 'normal';
    if (HIGH_URGENCY_REGEX.test(text) && (sentiment === 'negative' || !POSITIVE_WORDS.has(text.trim().toLowerCase()))) {
      const hasNegatedUrgency = /\b(no|not|never|without|hakuna|si|sio|pas|não|nao)\s+(fake|counterfeit|broken|failed|loss|hasara|bandia|feki|urgent|unsafe|negligence)\b/i.test(text);
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

  // --------------------------------------------------------------------------
  // 7. Dynamic Location & Segment Resolution (Zero Hardcoded 'Kenya'/q_county)
  // --------------------------------------------------------------------------
  function _findSurveyLocationQuestion(survey) {
    const questions = _getSurveyQuestions(survey);
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q || !q.id) continue;
      const type = String(q.type || '').toLowerCase();
      if (['cascading_select', 'cascading_location', 'location', 'gps'].includes(type)) {
        return q;
      }
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q || !q.id) continue;
      const type = String(q.type || '').toLowerCase();
      if (!['single_choice', 'radio', 'dropdown', 'select', 'short_text', 'text'].includes(type)) continue;
      const combined = `${q.id || ''} ${q.title || ''}`.toLowerCase();
      if (/(^|[\s_-])(county|region|district|province|location|ward|sub[\s_-]?county|city|branch|site|clinic|facility)([\s_-]|$)/i.test(combined)) {
        return q;
      }
    }
    return null;
  }

  function _extractLocationValue(r, survey, locationQ) {
    if (!r || typeof r !== 'object') return '';
    if (locationQ && r.answers && r.answers[locationQ.id] !== undefined) {
      const v = _formatSegmentValue(r.answers[locationQ.id]);
      if (v) return v;
    }
    const gpsLabel = _formatSegmentValue(r.gps && r.gps.label);
    if (gpsLabel) return gpsLabel;
    return '';
  }

  function _getDynamicSegmentOptions(survey, responses) {
    const safeResponses = Array.isArray(responses) ? responses : [];
    const questions = _getSurveyQuestions(survey);
    const allowedTypes = new Set([
      'rating', 'star_rating', 'emoji_rating', 'likert', 'nps', 'scale',
      'single_choice', 'radio', 'dropdown', 'select',
      'cascading_select', 'cascading_location'
    ]);

    const options = [
      { id: 'auto', value: 'auto', label: 'Auto (Best Segment)', type: 'auto' }
    ];

    const locationQ = _findSurveyLocationQuestion(survey);
    let locationQIncluded = false;

    questions.forEach((q, idx) => {
      if (!q || !q.id) return;
      const qType = String(q.type || '').toLowerCase();
      if (!allowedTypes.has(qType)) return;
      const code = _extractQuestionCode(q, idx);
      const cleanTitle = _cleanQuestionTitle(q, {}, survey);
      const hasCodePrefix = new RegExp(`^${code}\\b`, 'i').test(cleanTitle);
      const label = hasCodePrefix ? cleanTitle : `${code}: ${cleanTitle}`;

      const distinct = new Set();
      for (let j = 0; j < safeResponses.length; j++) {
        const val = _formatSegmentValue(safeResponses[j]?.answers?.[q.id]);
        if (val) distinct.add(val);
      }

      if (locationQ && locationQ.id === q.id) {
        locationQIncluded = true;
      }

      options.push({
        id: q.id,
        value: q.id,
        code,
        title: cleanTitle,
        label,
        type: qType,
        distinctCount: distinct.size
      });
    });

    // Include Location ONLY if responses have non-empty GPS labels or an unincluded location question
    const distinctGpsLabels = new Set();
    const distinctLocations = new Set();
    for (let i = 0; i < safeResponses.length; i++) {
      const g = _formatSegmentValue(safeResponses[i]?.gps?.label);
      if (g) distinctGpsLabels.add(g);
      const loc = _extractLocationValue(safeResponses[i], survey, locationQ);
      if (loc) distinctLocations.add(loc);
    }

    if (distinctGpsLabels.size > 0 || (!locationQIncluded && distinctLocations.size > 0)) {
      const locLabel = (locationQ && !locationQIncluded)
        ? _cleanQuestionTitle(locationQ, {}, survey)
        : 'Location';
      options.push({
        id: 'location',
        value: 'location',
        label: locLabel || 'Location',
        type: 'location',
        distinctCount: distinctLocations.size
      });
    }

    // Include Enumerator ONLY if >1 unique non-empty enumerator exists
    const distinctEnumerators = new Set();
    for (let i = 0; i < safeResponses.length; i++) {
      const en = _formatSegmentValue(safeResponses[i]?.enumerator || safeResponses[i]?.enumeratorId);
      if (en && en.toLowerCase() !== 'anonymous' && en.toLowerCase() !== 'unspecified') {
        distinctEnumerators.add(en);
      }
    }
    if (distinctEnumerators.size > 1) {
      options.push({
        id: 'enumerator',
        value: 'enumerator',
        label: 'Enumerator',
        type: 'enumerator',
        distinctCount: distinctEnumerators.size
      });
    }

    return options;
  }

  function _resolveSegmentConfig(responses, survey, requestedSegQId) {
    const req = requestedSegQId || 'auto';
    const locationQ = _findSurveyLocationQuestion(survey);

    if (req === 'location' || req === 'county') {
      const locLabel = locationQ ? _cleanQuestionTitle(locationQ, {}, survey) : 'Location';
      return {
        segmentQId: 'location',
        segmentLabel: locLabel || 'Location',
        extract: (r) => _extractLocationValue(r, survey, locationQ) || 'Unspecified'
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

    // Auto-select best segmenter from survey's actual categorical/rating/cascading questions
    const preferredTypes = [
      'rating', 'star_rating', 'emoji_rating', 'likert', 'nps', 'scale',
      'single_choice', 'radio', 'dropdown', 'select',
      'cascading_select', 'cascading_location'
    ];
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

    // Next: Location if >= 2 distinct real locations exist
    const locations = new Set();
    for (let i = 0; i < responses.length; i++) {
      const loc = _extractLocationValue(responses[i], survey, locationQ);
      if (loc) locations.add(loc);
    }
    if (locations.size >= 2) {
      return {
        segmentQId: 'location',
        segmentLabel: locationQ ? _cleanQuestionTitle(locationQ, {}, survey) : 'Location',
        extract: (r) => _extractLocationValue(r, survey, locationQ) || 'Unspecified'
      };
    }

    // Next: Enumerator if >= 2 distinct enumerators exist
    const enums = new Set();
    for (let i = 0; i < responses.length; i++) {
      const en = _formatSegmentValue(responses[i]?.enumerator || responses[i]?.enumeratorId);
      if (en && en.toLowerCase() !== 'anonymous') enums.add(en);
    }
    if (enums.size >= 2) {
      return {
        segmentQId: 'enumerator',
        segmentLabel: 'Enumerator',
        extract: (r) => _formatSegmentValue(r.enumerator || r.enumeratorId) || 'Unspecified'
      };
    }

    // Fallback: first candidate question even with 1 distinct value, or All Responses
    if (candidates.length > 0) {
      const q = candidates[0];
      return {
        segmentQId: q.id,
        segmentLabel: _cleanQuestionTitle(q, {}, survey),
        extract: (r) => _formatSegmentValue(r.answers?.[q.id]) || 'Unspecified'
      };
    }

    return {
      segmentQId: 'all',
      segmentLabel: 'All Responses',
      extract: () => 'All Responses'
    };
  }

  // --------------------------------------------------------------------------
  // 8. Dynamic 3-Layer Theme Engine (Custom Codebook + Unsupervised Discovery)
  // --------------------------------------------------------------------------
  function _customThemesStorageKey(surveyId) {
    return `ae_custom_themes_${String(surveyId || 'global').replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
  }

  function _normalizeKeywords(rawKeywords) {
    const arr = Array.isArray(rawKeywords)
      ? rawKeywords
      : typeof rawKeywords === 'string'
        ? rawKeywords.split(/[,;\n]+/)
        : [];
    const seen = new Set();
    const out = [];
    for (let i = 0; i < arr.length; i++) {
      const kw = String(arr[i] || '').trim().toLowerCase().replace(/\s+/g, ' ');
      if (kw && !seen.has(kw)) {
        seen.add(kw);
        out.push(kw);
      }
    }
    return out;
  }

  function _buildTopTermsFromCounts(termFreq, docFreq, bigramSet, totalDocs, maxCount) {
    const limit = maxCount > 0 ? maxCount : 30;
    return Object.keys(termFreq)
      .map((term) => {
        const tf = termFreq[term];
        const df = docFreq[term] || 1;
        const idf = 1 + Math.log((totalDocs + 1) / (df + 1));
        const isBigram = bigramSet.has(term);
        const score = Number((tf * idf * (isBigram ? 1.25 : 1.0)).toFixed(3));
        return { term, count: tf, df, score, isBigram };
      })
      .filter((item) => item.count >= 1 && (!item.isBigram || item.count >= 2 || totalDocs <= 6))
      .sort((a, b) => (b.score - a.score) || (b.count - a.count))
      .slice(0, limit);
  }

  function _isEligibleTopicAnchor(term, isBigram) {
    if (!term) return false;
    if (!isBigram) {
      return !TOPIC_ANCHOR_NOISE.has(term) && !STOP_WORDS.has(term) && term.length >= 3;
    }
    const parts = term.split(' ');
    if (parts.length !== 2) return false;
    const [w1, w2] = parts;
    if (STOP_WORDS.has(w1) || STOP_WORDS.has(w2)) return false;
    // Reject if both words are generic noise/sentiment words
    if (TOPIC_ANCHOR_NOISE.has(w1) && TOPIC_ANCHOR_NOISE.has(w2)) return false;
    // Reject pure recommendation verb bigrams like "recommend adding" or "please improve"
    const verbBlock = new Set(['please', 'should', 'recommend', 'suggest', 'need', 'needs', 'want', 'think', 'feel', 'make', 'give', 'take', 'keep', 'really', 'very', 'much', 'more', 'most', 'less', 'also', 'just']);
    if (verbBlock.has(w1) || verbBlock.has(w2)) return false;
    return true;
  }

  function _discoverDynamicThemes(docTokenList, customThemes, maxThemes) {
    const N = docTokenList.length;
    if (N === 0) return [];
    const targetMax = maxThemes > 0 ? maxThemes : 9;

    const termFreq = Object.create(null);
    const docFreq = Object.create(null);
    const termDocs = Object.create(null);
    const bigramSet = new Set();

    for (let docIdx = 0; docIdx < N; docIdx++) {
      const tokens = docTokenList[docIdx] || [];
      const seenInDoc = new Set();
      for (let i = 0; i < tokens.length; i++) {
        const w = tokens[i];
        termFreq[w] = (termFreq[w] || 0) + 1;
        seenInDoc.add(w);
        if (i < tokens.length - 1) {
          const w2 = tokens[i + 1];
          if (w !== w2) {
            const bg = `${w} ${w2}`;
            termFreq[bg] = (termFreq[bg] || 0) + 1;
            seenInDoc.add(bg);
            bigramSet.add(bg);
          }
        }
      }
      seenInDoc.forEach((t) => {
        docFreq[t] = (docFreq[t] || 0) + 1;
        if (!termDocs[t]) termDocs[t] = new Set();
        termDocs[t].add(docIdx);
      });
    }

    // Score candidate topic anchors (high-signal TF-IDF unigrams & bigrams)
    const minDfUnigram = N >= 6 ? 2 : 1;
    const minDfBigram = N >= 5 ? 2 : 1;
    const candidates = [];

    Object.keys(termFreq).forEach((term) => {
      const isBigram = bigramSet.has(term);
      if (!_isEligibleTopicAnchor(term, isBigram)) return;
      const tf = termFreq[term];
      const df = docFreq[term] || 1;
      if (isBigram && df < minDfBigram) return;
      if (!isBigram && df < minDfUnigram) return;

      // Downweight overly ubiquitous single words when corpus is larger
      const ubiquityPenalty = (!isBigram && N >= 8 && df / N > 0.78) ? 0.45 : 1.0;
      const idf = 1 + Math.log((N + 1) / (df + 1));
      const phraseBoost = isBigram ? 1.65 : 1.0;
      const score = tf * idf * phraseBoost * ubiquityPenalty;

      candidates.push({
        term,
        isBigram,
        tf,
        df,
        score,
        docs: termDocs[term],
        stems: term.split(' ').map(_simpleStem)
      });
    });

    candidates.sort((a, b) => (b.score - a.score) || (b.df - a.df) || a.term.localeCompare(b.term));
    const pool = candidates.slice(0, 48);

    // Greedy co-occurrence + lexical stem clustering
    const clusters = [];

    for (let i = 0; i < pool.length; i++) {
      const cand = pool[i];
      let bestCluster = null;
      let bestSim = 0;

      for (let c = 0; c < clusters.length; c++) {
        const cl = clusters[c];

        // 1. Lexical stem overlap (e.g., "breakout" <-> "breakout groups", "delay" <-> "delayed")
        let lexicalMatch = false;
        for (let s = 0; s < cand.stems.length; s++) {
          if (cl.stemSet.has(cand.stems[s])) {
            lexicalMatch = true;
            break;
          }
        }

        // 2. Document co-occurrence Jaccard similarity (prevents broad terms from swallowing distinct topics)
        let inter = 0;
        cand.docs.forEach((d) => {
          if (cl.docSet.has(d)) inter++;
        });
        const union = cand.docs.size + cl.docSet.size - inter;
        const jaccard = union > 0 ? inter / union : 0;

        let sim = 0;
        if (lexicalMatch) {
          sim = 0.85 + jaccard * 0.15;
        } else if (jaccard >= 0.55 && inter >= (N >= 4 ? 2 : 1)) {
          sim = jaccard;
        }

        if (sim > bestSim) {
          bestSim = sim;
          bestCluster = cl;
        }
      }

      if (bestCluster && bestSim >= 0.55) {
        bestCluster.keywords.add(cand.term);
        cand.stems.forEach((st) => bestCluster.stemSet.add(st));
        cand.docs.forEach((d) => bestCluster.docSet.add(d));
        // If current anchor is a unigram and merged candidate is a strong bigram containing it, promote bigram name
        if (!bestCluster.anchorIsBigram && cand.isBigram && cand.df >= Math.ceil(bestCluster.anchorDf * 0.5)) {
          const anchorStem = _simpleStem(bestCluster.anchor);
          if (cand.stems.includes(anchorStem)) {
            bestCluster.anchor = cand.term;
            bestCluster.anchorIsBigram = true;
            bestCluster.anchorDf = cand.df;
          }
        }
      } else if (clusters.length < targetMax) {
        const kwSet = new Set([cand.term]);
        // For bigrams, only add constituent words to keywords if they are non-noise and strongly specific
        if (cand.isBigram) {
          cand.term.split(' ').forEach((part) => {
            if (!TOPIC_ANCHOR_NOISE.has(part) && !STOP_WORDS.has(part) && part.length >= 4) {
              // Avoid adding ultra-generic words like "time" alone if bigram is "waiting time"
              const partDf = docFreq[part] || 0;
              if (partDf <= cand.df * 2.2) {
                kwSet.add(part);
              }
            }
          });
        }
        clusters.push({
          anchor: cand.term,
          anchorIsBigram: cand.isBigram,
          anchorDf: cand.df,
          score: cand.score,
          keywords: kwSet,
          stemSet: new Set(cand.stems),
          docSet: new Set(cand.docs)
        });
      }
    }

    // Reserve colors already used by custom themes
    const usedColors = new Set((customThemes || []).map((t) => String(t.color || '').toUpperCase()));
    let paletteIdx = 0;
    const nextColor = () => {
      for (let tries = 0; tries < DYNAMIC_THEME_PALETTE.length; tries++) {
        const c = DYNAMIC_THEME_PALETTE[(paletteIdx + tries) % DYNAMIC_THEME_PALETTE.length];
        if (!usedColors.has(c.toUpperCase())) {
          usedColors.add(c.toUpperCase());
          paletteIdx = (paletteIdx + tries + 1) % DYNAMIC_THEME_PALETTE.length;
          return c;
        }
      }
      const c = DYNAMIC_THEME_PALETTE[paletteIdx % DYNAMIC_THEME_PALETTE.length];
      paletteIdx++;
      return c;
    };

    const usedIds = new Set((customThemes || []).map((t) => t.id));
    return clusters.map((cl) => {
      let id = `topic_${_slugify(cl.anchor)}`;
      let suffix = 2;
      while (usedIds.has(id)) {
        id = `topic_${_slugify(cl.anchor)}_${suffix++}`;
      }
      usedIds.add(id);

      const keywords = Array.from(cl.keywords);
      return {
        id,
        name: _toTitleCase(cl.anchor),
        color: nextColor(),
        keywords,
        stemSet: cl.stemSet,
        isCustom: false,
        isDiscovered: true
      };
    });
  }

  function _matchThemeKeywords(lowerText, tokenSet, stemSet, theme) {
    const keywords = Array.isArray(theme.keywords) ? theme.keywords : [];
    let hits = 0;
    for (let i = 0; i < keywords.length; i++) {
      const kw = keywords[i];
      if (!kw) continue;
      if (kw.includes(' ')) {
        // Multi-word phrase check
        if (lowerText.includes(kw)) {
          hits += 2.5;
        }
      } else {
        if (tokenSet.has(kw)) {
          hits += 1.5;
        } else if (kw.length >= 4 && stemSet.has(_simpleStem(kw))) {
          hits += 1.0;
        }
      }
    }
    return hits;
  }

  function _assignDynamicThemes(analysisText, customThemes, discoveredThemes) {
    const lowerText = String(analysisText || '')
      .toLowerCase()
      .replace(/['’](?=[a-z])/g, '')
      .replace(/[^a-z0-9àáâãäåèéêëìíîïòóôõöùúûüñçýÿ\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const tokens = lowerText.split(' ').filter(Boolean);
    const tokenSet = new Set(tokens);
    const stemSet = new Set(tokens.map(_simpleStem));

    const customMatches = [];
    for (let i = 0; i < customThemes.length; i++) {
      const th = customThemes[i];
      const hits = _matchThemeKeywords(lowerText, tokenSet, stemSet, th);
      if (hits > 0) {
        customMatches.push({ theme: th, hits });
      }
    }
    customMatches.sort((a, b) => b.hits - a.hits);

    const discoveredMatches = [];
    for (let i = 0; i < discoveredThemes.length; i++) {
      const th = discoveredThemes[i];
      const hits = _matchThemeKeywords(lowerText, tokenSet, stemSet, th);
      if (hits > 0) {
        discoveredMatches.push({ theme: th, hits });
      }
    }
    discoveredMatches.sort((a, b) => b.hits - a.hits);

    // Prioritize Layer 1 custom themes, then fill up to 3 total with Layer 2 discovered themes
    const combined = [];
    const seenIds = new Set();
    const pushTheme = (th) => {
      if (combined.length >= 3 || seenIds.has(th.id)) return;
      seenIds.add(th.id);
      combined.push({
        id: th.id,
        name: th.name,
        color: th.color,
        isCustom: Boolean(th.isCustom)
      });
    };

    customMatches.forEach((m) => pushTheme(m.theme));
    discoveredMatches.forEach((m) => pushTheme(m.theme));

    if (combined.length === 0) {
      return [{
        id: GENERAL_THEME.id,
        name: GENERAL_THEME.name,
        color: GENERAL_THEME.color,
        isCustom: false,
        isFallback: true
      }];
    }
    return combined;
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
  // 8B. Theme-to-Score Impact Analysis Helpers (Metric Extraction + Welch's t)
  // --------------------------------------------------------------------------
  const ORDINAL_POSITIVE_ANCHORS = [
    'excellent', 'outstanding', 'superb', 'exceptional', 'very good', 'strongly agree',
    'very satisfied', 'extremely satisfied', 'always', 'very high', 'high', 'great',
    'bora sana', 'bora', 'nzuri sana', 'nakubali sana', 'très bon', 'tres bon', 'excelente', 'ótimo', 'otimo'
  ];

  const ORDINAL_NEGATIVE_ANCHORS = [
    'poor', 'very poor', 'terrible', 'awful', 'bad', 'unsatisfactory', 'needs improvement',
    'strongly disagree', 'disagree', 'very dissatisfied', 'dissatisfied', 'never', 'very low', 'low',
    'mbaya', 'mbaya sana', 'duni', 'sikubali', 'mauvais', 'ruim', 'péssimo', 'pessimo'
  ];

  const ORDINAL_MIDDLE_ANCHORS = [
    'good', 'average', 'fair', 'moderate', 'neutral', 'neither', 'okay', 'ok', 'satisfactory',
    'agree', 'satisfied', 'sometimes', 'often', 'rarely', 'medium', 'wastani', 'mzuri', 'nzuri',
    'moyen', 'bien', 'bon', 'bom', 'regular'
  ];

  function _normalizeOrdinalLabel(str) {
    return String(str || '')
      .toLowerCase()
      .replace(/^\d+\s*[-–—:.]\s*/, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function _detectOrdinalOptionMap(q) {
    const rawOpts = Array.isArray(q && q.options) ? q.options : [];
    const labels = rawOpts
      .map((opt) => (typeof opt === 'string' ? opt : String((opt && (opt.label || opt.value || opt.text)) || '')))
      .map((s) => s.trim())
      .filter(Boolean);

    if (labels.length < 2 || labels.length > 7) return null;

    // Case 1: Explicit numeric prefix on all options (e.g., "5 - Excellent", "1 - Poor")
    const numericPrefixes = labels.map((lbl) => {
      const m = lbl.match(/^\s*(-?\d+(?:\.\d+)?)\s*(?:[-–—:.]|$)/);
      return m ? Number(m[1]) : NaN;
    });
    if (numericPrefixes.every((n) => !Number.isNaN(n))) {
      const map = new Map();
      labels.forEach((lbl, idx) => {
        map.set(lbl.toLowerCase(), numericPrefixes[idx]);
        map.set(_normalizeOrdinalLabel(lbl), numericPrefixes[idx]);
      });
      const minVal = Math.min(...numericPrefixes);
      const maxVal = Math.max(...numericPrefixes);
      return {
        map,
        min: minVal,
        max: maxVal,
        scaleLabel: `${minVal}–${maxVal}`
      };
    }

    // Case 2: Recognizable ordinal quality / satisfaction / agreement scale
    const normLabels = labels.map(_normalizeOrdinalLabel);
    let recognizedCount = 0;
    let firstPolarity = 0;
    let lastPolarity = 0;

    normLabels.forEach((nl, idx) => {
      const isPos = ORDINAL_POSITIVE_ANCHORS.some((a) => nl === a || nl.includes(a));
      const isNeg = ORDINAL_NEGATIVE_ANCHORS.some((a) => nl === a || nl.includes(a));
      const isMid = ORDINAL_MIDDLE_ANCHORS.some((a) => nl === a || nl.includes(a));
      if (isPos || isNeg || isMid) recognizedCount++;
      if (idx === 0) firstPolarity = isPos ? 1 : (isNeg ? -1 : 0);
      if (idx === normLabels.length - 1) lastPolarity = isPos ? 1 : (isNeg ? -1 : 0);
    });

    if (recognizedCount < Math.max(2, Math.ceil(labels.length * 0.5))) return null;

    // Default descending (Excellent=N .. Poor=1) unless first is negative and last is positive
    const ascending = firstPolarity === -1 && lastPolarity === 1;
    const N = labels.length;
    const map = new Map();
    labels.forEach((lbl, idx) => {
      const score = ascending ? idx + 1 : N - idx;
      map.set(lbl.toLowerCase(), score);
      map.set(normLabels[idx], score);
    });

    return {
      map,
      min: 1,
      max: N,
      scaleLabel: `1–${N}`
    };
  }

  function _extractMetricCandidates(survey, responses) {
    const questions = _getSurveyQuestions(survey);
    const safeResponses = Array.isArray(responses) ? responses : [];
    const candidates = [];

    questions.forEach((q, idx) => {
      if (!q || !q.id) return;
      const qType = String(q.type || '').toLowerCase();
      const code = _extractQuestionCode(q, idx);
      const cleanTitle = _cleanQuestionTitle(q, {}, survey);
      const hasCodePrefix = new RegExp(`^${code}\\b`, 'i').test(cleanTitle);
      const label = hasCodePrefix ? cleanTitle : `${code}: ${cleanTitle}`;

      let priority = 99;
      let scaleLabel = '';
      let minVal = null;
      let maxVal = null;
      let extractor = null;

      if (['star_rating', 'rating', 'emoji_rating', 'likert', 'scale'].includes(qType)) {
        priority = 1;
        const ordinalMap = _detectOrdinalOptionMap(q);
        minVal = q.min !== undefined ? Number(q.min) : (ordinalMap ? ordinalMap.min : 1);
        maxVal = q.max !== undefined ? Number(q.max) : (ordinalMap ? ordinalMap.max : 5);
        scaleLabel = `${minVal}–${maxVal}`;
        extractor = (raw) => {
          if (raw === null || raw === undefined || raw === '') return NaN;
          if (typeof raw === 'number') return Number.isFinite(raw) ? raw : NaN;
          const str = String(raw).trim();
          const num = Number(str);
          if (!Number.isNaN(num) && str !== '') return num;
          if (ordinalMap) {
            const mapped = ordinalMap.map.get(str.toLowerCase()) ?? ordinalMap.map.get(_normalizeOrdinalLabel(str));
            if (mapped !== undefined) return mapped;
          }
          return NaN;
        };
      } else if (qType === 'nps') {
        priority = 2;
        minVal = 0;
        maxVal = 10;
        scaleLabel = '0–10 (NPS)';
        extractor = (raw) => {
          if (raw === null || raw === undefined || raw === '') return NaN;
          const num = Number(raw);
          return Number.isFinite(num) ? num : NaN;
        };
      } else if (['multiple_choice', 'single_choice', 'radio', 'dropdown', 'select'].includes(qType)) {
        const ordinalMap = _detectOrdinalOptionMap(q);
        if (!ordinalMap) return;
        priority = 3;
        minVal = ordinalMap.min;
        maxVal = ordinalMap.max;
        scaleLabel = `${ordinalMap.scaleLabel} (Ordinal)`;
        extractor = (raw) => {
          if (raw === null || raw === undefined || raw === '') return NaN;
          if (typeof raw === 'number') return Number.isFinite(raw) ? raw : NaN;
          const str = String(raw).trim();
          const mapped = ordinalMap.map.get(str.toLowerCase()) ?? ordinalMap.map.get(_normalizeOrdinalLabel(str));
          if (mapped !== undefined) return mapped;
          const num = Number(str);
          return !Number.isNaN(num) && str !== '' ? num : NaN;
        };
      } else if (['number_yield', 'number', 'numeric'].includes(qType)) {
        priority = 4;
        scaleLabel = q.unit ? String(q.unit).trim() : 'numeric';
        extractor = (raw) => {
          if (raw === null || raw === undefined || raw === '') return NaN;
          const num = Number(raw);
          return Number.isFinite(num) ? num : NaN;
        };
      } else {
        return;
      }

      let validCount = 0;
      let obsMin = Infinity;
      let obsMax = -Infinity;
      for (let i = 0; i < safeResponses.length; i++) {
        const v = extractor(safeResponses[i]?.answers?.[q.id]);
        if (Number.isFinite(v)) {
          validCount++;
          if (v < obsMin) obsMin = v;
          if (v > obsMax) obsMax = v;
        }
      }

      candidates.push({
        id: q.id,
        code,
        title: cleanTitle,
        label,
        type: qType,
        unit: q.unit ? String(q.unit).trim() : '',
        scale: scaleLabel,
        min: minVal !== null ? minVal : (Number.isFinite(obsMin) ? obsMin : 0),
        max: maxVal !== null ? maxVal : (Number.isFinite(obsMax) ? obsMax : 5),
        priority,
        validCount,
        extractor
      });
    });

    candidates.sort((a, b) => {
      const aHas = a.validCount >= 2 ? 0 : 1;
      const bHas = b.validCount >= 2 ? 0 : 1;
      if (aHas !== bHas) return aHas - bHas;
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.validCount - a.validCount;
    });

    return candidates;
  }

  function _logGamma(z) {
    const p = [
      676.5203681218851, -1259.1392167224028, 771.32342877765313,
      -176.61502916214059, 12.507343278686905, -0.13857109585720572,
      9.9843695780195716e-6, 1.5056327351493116e-7
    ];
    if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - _logGamma(1 - z);
    z -= 1;
    let x = 0.99999999999980993;
    for (let i = 0; i < p.length; i++) x += p[i] / (z + i + 1);
    const t = z + p.length - 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }

  function _betaInc(a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    if (x > (a + 1) / (a + b + 2)) return 1 - _betaInc(b, a, 1 - x);
    const lbeta = _logGamma(a) + _logGamma(b) - _logGamma(a + b);
    const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta) / a;
    const FPMIN = 1e-30;
    let c = 1.0;
    let d = 1.0 - ((a + b) * x) / (a + 1.0);
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1.0 / d;
    let h = d;
    for (let m = 1; m <= 200; m++) {
      let num = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
      d = 1.0 + num * d;
      if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1.0 + num / c;
      if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1.0 / d;
      h *= d * c;

      num = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
      d = 1.0 + num * d;
      if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1.0 + num / c;
      if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1.0 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1.0) < 1e-12) break;
    }
    return Math.max(0, Math.min(1, front * h));
  }

  function _welchTTestLocal(group1, group2) {
    const n1 = group1.length;
    const n2 = group2.length;
    if (n1 < 2 || n2 < 2) return { tStat: 0, df: 1, pValue: null, isSignificant: false };

    const m1 = group1.reduce((a, b) => a + b, 0) / n1;
    const m2 = group2.reduce((a, b) => a + b, 0) / n2;
    const v1 = group1.reduce((acc, v) => acc + Math.pow(v - m1, 2), 0) / (n1 - 1);
    const v2 = group2.reduce((acc, v) => acc + Math.pow(v - m2, 2), 0) / (n2 - 1);

    const se2 = v1 / n1 + v2 / n2;
    if (se2 <= 0) {
      const same = Math.abs(m1 - m2) < 1e-12;
      return { tStat: same ? 0 : (m1 > m2 ? 99 : -99), df: n1 + n2 - 2, pValue: same ? 1.0 : 0.0001, isSignificant: !same };
    }
    if (typeof globalScope !== 'undefined' && globalScope.AEStats && typeof globalScope.AEStats.welchTTest === 'function') {
      return globalScope.AEStats.welchTTest(group1, group2);
    }
    const tStat = (m1 - m2) / Math.sqrt(se2);
    const numDf = se2 * se2;
    const denDf = Math.pow(v1 / n1, 2) / (n1 - 1) + Math.pow(v2 / n2, 2) / (n2 - 1);
    const df = denDf > 0 ? numDf / denDf : 1;
    const x = df / (df + tStat * tStat);
    const pVal = Math.max(0, Math.min(1, _betaInc(df / 2.0, 0.5, x)));

    return {
      tStat: Number(tStat.toFixed(2)),
      df: Math.round(df),
      pValue: Number(pVal.toFixed(4)),
      isSignificant: pVal < 0.05
    };
  }

  // --------------------------------------------------------------------------
  // 9. Public Engine Object: window.AETeXtEngine
  // --------------------------------------------------------------------------
  const AETeXtEngine = {
    version: '3.0.0',
    stopWords: STOP_WORDS,
    negationWords: NEGATION_WORDS,
    lexicon: {
      positive: Array.from(POSITIVE_WORDS),
      negative: Array.from(NEGATIVE_WORDS)
    },
    themesCatalog: [],

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
     * Returns categorical/rating/cascading questions suitable for Theme x Segment breakdown.
     */
    getSegmentQuestions(survey) {
      const allQs = _getSurveyQuestions(survey);
      const allowed = new Set([
        'rating', 'star_rating', 'emoji_rating', 'likert', 'nps', 'scale',
        'single_choice', 'radio', 'dropdown', 'select',
        'cascading_select', 'cascading_location'
      ]);
      return allQs
        .filter((q) => q && q.id && allowed.has(String(q.type || '').toLowerCase()))
        .map((q, idx) => ({
          ...q,
          code: _extractQuestionCode(q, idx),
          cleanTitle: _cleanQuestionTitle(q, {}, survey)
        }));
    },

    /**
     * Dynamically discovers valid segment options for a survey & response set.
     * Never hardcodes County/Location when the survey has no location data.
     */
    getSegmentOptions(survey, responses) {
      return _getDynamicSegmentOptions(survey, responses);
    },

    // ------------------------------------------------------------------------
    // Layer 1: Survey-Specific Custom Codebook Persistence
    // ------------------------------------------------------------------------
    getCustomThemes(surveyId) {
      const storageKey = _customThemesStorageKey(surveyId);
      let rawList = null;
      try {
        if (typeof globalScope !== 'undefined' && globalScope.localStorage) {
          const raw = globalScope.localStorage.getItem(storageKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) rawList = parsed;
          } else {
            rawList = [];
          }
        }
      } catch (e) {}

      if (rawList === null) {
        rawList = _memCustomThemeStore.get(storageKey) || [];
      }

      return rawList
        .filter((t) => t && typeof t === 'object' && String(t.name || '').trim())
        .map((t, idx) => ({
          id: String(t.id || `custom_${_slugify(t.name)}_${idx + 1}`),
          name: String(t.name).trim(),
          keywords: _normalizeKeywords(t.keywords),
          color: String(t.color || DYNAMIC_THEME_PALETTE[idx % DYNAMIC_THEME_PALETTE.length]),
          isCustom: true
        }));
    },

    saveCustomTheme(surveyId, themeInput) {
      if (!themeInput || typeof themeInput !== 'object') return null;
      const name = String(themeInput.name || '').trim();
      if (!name) return null;

      const storageKey = _customThemesStorageKey(surveyId);
      const existing = this.getCustomThemes(surveyId);
      const keywords = _normalizeKeywords(themeInput.keywords);
      const id = String(themeInput.id || '').trim() || `custom_${_slugify(name)}_${Date.now().toString(36).slice(-4)}`;
      const color = String(themeInput.color || '').trim() || DYNAMIC_THEME_PALETTE[existing.length % DYNAMIC_THEME_PALETTE.length];

      const saved = {
        id,
        name,
        keywords: keywords.length > 0 ? keywords : [name.toLowerCase()],
        color,
        isCustom: true
      };

      const idx = existing.findIndex((t) => t.id === id);
      const nextList = existing.slice();
      if (idx >= 0) {
        nextList[idx] = saved;
      } else {
        nextList.push(saved);
      }

      try {
        if (typeof globalScope !== 'undefined' && globalScope.localStorage) {
          globalScope.localStorage.setItem(storageKey, JSON.stringify(nextList));
        } else {
          _memCustomThemeStore.set(storageKey, nextList);
        }
      } catch (e) {
        _memCustomThemeStore.set(storageKey, nextList);
      }

      return saved;
    },

    deleteCustomTheme(surveyId, themeId) {
      const targetId = String(themeId || '').trim();
      const storageKey = _customThemesStorageKey(surveyId);
      const existing = this.getCustomThemes(surveyId);
      const nextList = existing.filter((t) => t.id !== targetId);
      const deleted = nextList.length !== existing.length;

      try {
        if (typeof globalScope !== 'undefined' && globalScope.localStorage) {
          globalScope.localStorage.setItem(storageKey, JSON.stringify(nextList));
        } else {
          _memCustomThemeStore.set(storageKey, nextList);
        }
      } catch (e) {
        _memCustomThemeStore.set(storageKey, nextList);
      }

      return { deleted, themes: nextList };
    },

    /**
     * Primary Verbatim Intelligence Analyzer (Dynamic 3-Layer Theme Engine).
     * Supports BOTH:
     *  - Legacy signature: analyzeVerbatims(responses, 'q_comments')
     *  - Full signature:   analyzeVerbatims(responses, survey, {
     *                        questionId: 'all' | qId,
     *                        segmentQId: 'auto' | 'location' | 'enumerator' | qId,
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
      const requestedQId = opts.questionId || (isSurveyObject ? 'all' : (legacyQId || 'all'));

      const textQuestions = survey ? this.getTextQuestions(survey) : [];
      const targetQuestions = survey
        ? (requestedQId === 'all'
          ? textQuestions
          : textQuestions.filter((q) => q.id === requestedQId))
        : [];

      const locationQ = _findSurveyLocationQuestion(survey);
      const segConfig = _resolveSegmentConfig(safeResponses, survey, opts.segmentQId || 'auto');
      const surveyId = opts.surveyId || (survey && survey.id) || 'global';
      const pinnedSet = new Set(this.getPinnedQuotes(surveyId));
      const customThemes = this.getCustomThemes(surveyId);

      // PASS 1: Extract all verbatim entries, tokenize, score sentiment & signals
      const rawEntries = [];
      const docTokenList = [];
      const termFreq = Object.create(null);
      const docFreq = Object.create(null);
      const bigramSet = new Set();

      const collectEntry = (r, qMeta, rawText) => {
        const respId = String(r.clientResponseId || r.id || `resp_${rawEntries.length + 1}`);
        const qId = qMeta.id || 'open_text';
        const recordKey = `${respId}::${qId}`;
        const translatedText = translationsMap[recordKey] || translationsMap[rawText] || '';
        const primaryText = translatedText || rawText;
        const analysisText = translatedText ? `${translatedText} ${rawText}` : rawText;

        const signals = _scoreSentimentAndSignals(primaryText);
        const cleanTokens = _tokenizeForTerms(primaryText);
        docTokenList.push(cleanTokens);

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

        rawEntries.push({
          r,
          qMeta,
          qId,
          respId,
          recordKey,
          rawText,
          translatedText,
          analysisText,
          signals,
          cleanTokens,
          segmentVal: segConfig.extract(r) || 'Unspecified',
          locationVal: _extractLocationValue(r, survey, locationQ),
          enumerator: _formatSegmentValue(r.enumerator || r.enumeratorId) || 'Anonymous'
        });
      };

      safeResponses.forEach((r) => {
        if (!r || !r.answers || typeof r.answers !== 'object') return;

        if (survey && targetQuestions.length > 0) {
          targetQuestions.forEach((q) => {
            const text = _extractTextValue(r.answers[q.id]);
            if (text) {
              collectEntry(r, q, text);
            }
          });
        } else {
          // Schema-less fallback: scan specified key or all open-ended string/transcript answers
          if (requestedQId && requestedQId !== 'all') {
            const extracted = _extractTextValue(r.answers[requestedQId]);
            if (extracted) {
              collectEntry(r, { id: requestedQId, code: 'Q', title: requestedQId }, extracted);
            }
          } else {
            let foundAny = false;
            const entries = Object.entries(r.answers);
            for (let i = 0; i < entries.length; i++) {
              const [k, v] = entries[i];
              const isTranscriptObj = v && typeof v === 'object' && !Array.isArray(v) && (v.transcript || v.transcription);
              if (isTranscriptObj) {
                const extracted = _extractTextValue(v);
                if (extracted) {
                  collectEntry(r, { id: k, code: _extractQuestionCode({ id: k }, i), title: k }, extracted);
                  foundAny = true;
                }
              } else if (typeof v === 'string' && v.trim().length >= 15 && !/^\d{4}-\d{2}-\d{2}/.test(v.trim()) && !v.startsWith('data:')) {
                collectEntry(r, { id: k, code: _extractQuestionCode({ id: k }, i), title: k }, v.trim());
                foundAny = true;
              }
            }
            if (!foundAny) {
              for (let i = 0; i < entries.length; i++) {
                const [k, v] = entries[i];
                const extracted = _extractTextValue(v);
                if (extracted && extracted.includes(' ')) {
                  collectEntry(r, { id: k, code: _extractQuestionCode({ id: k }, i), title: k }, extracted);
                  break;
                }
              }
            }
          }
        }
      });

      const totalAnalyzed = rawEntries.length;

      // PASS 2: Layer 2 Unsupervised Dynamic Topic Discovery from corpus
      const discoveredThemes = _discoverDynamicThemes(docTokenList, customThemes, 9);

      // PASS 3: Assign Layer 1 + Layer 2 themes, aggregate Theme x Sentiment, Theme x Segment, and Layer 3 byQuestion
      const records = [];
      let totalPos = 0;
      let totalNeg = 0;
      let totalNeu = 0;
      let totalActionable = 0;
      let totalUrgentHigh = 0;
      let totalUrgentMedium = 0;
      let sentimentScoreSum = 0;

      const themeAgg = Object.create(null);
      const segmentCounts = Object.create(null);
      const byQuestionAgg = Object.create(null);
      const byQuestionOrder = [];

      for (let idx = 0; idx < rawEntries.length; idx++) {
        const entry = rawEntries[idx];
        const { r, qMeta, qId, respId, recordKey, rawText, translatedText, analysisText, signals, cleanTokens, segmentVal, locationVal, enumerator } = entry;

        const assignedThemes = _assignDynamicThemes(analysisText, customThemes, discoveredThemes);

        if (signals.sentiment === 'positive') totalPos++;
        else if (signals.sentiment === 'negative') totalNeg++;
        else totalNeu++;

        if (signals.isActionable) totalActionable++;
        if (signals.urgency === 'high') totalUrgentHigh++;
        else if (signals.urgency === 'medium') totalUrgentMedium++;
        sentimentScoreSum += signals.sentimentScore;

        segmentCounts[segmentVal] = (segmentCounts[segmentVal] || 0) + 1;

        const cleanQTitle = _cleanQuestionTitle(qMeta.title || qMeta.cleanTitle || qId, r.answers || {}, survey);
        const genericQTitle = _cleanQuestionTitle(qMeta.title || qMeta.cleanTitle || qId, {}, survey);

        const record = {
          key: recordKey,
          id: respId,
          questionId: qId,
          questionCode: qMeta.code || 'Q',
          questionTitle: cleanQTitle,
          enumerator,
          submittedAt: r.submittedAt || r.createdAt || '',
          location: locationVal,
          county: locationVal, // backward-compatible alias (empty string if none; never 'Kenya')
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

        const quoteQuality = Math.min(rawText.length, 180) / 180 + Math.abs(signals.sentimentScore) * 0.6 + (signals.isActionable ? 0.35 : 0);

        // Theme x Sentiment & Theme x Segment accumulators
        assignedThemes.forEach((th) => {
          if (!themeAgg[th.id]) {
            themeAgg[th.id] = {
              id: th.id,
              name: th.name,
              color: th.color,
              isCustom: Boolean(th.isCustom),
              isFallback: Boolean(th.isFallback),
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

          if (quoteQuality > bucket.topQuoteScore) {
            bucket.topQuoteScore = quoteQuality;
            bucket.topQuote = rawText.length > 220 ? `${rawText.slice(0, 217)}...` : rawText;
            bucket.topQuoteRecord = record;
          }
        });

        // Layer 3: Per-Question accumulator
        if (!byQuestionAgg[qId]) {
          byQuestionOrder.push(qId);
          byQuestionAgg[qId] = {
            qId,
            code: qMeta.code || 'Q',
            title: genericQTitle || cleanQTitle || qId,
            count: 0,
            positive: 0,
            neutral: 0,
            negative: 0,
            scoreSum: 0,
            actionableCount: 0,
            highUrgencyCount: 0,
            termFreq: Object.create(null),
            docFreq: Object.create(null),
            bigramSet: new Set(),
            topQuote: '',
            topQuoteScore: -1
          };
        }
        const qBucket = byQuestionAgg[qId];
        qBucket.count++;
        qBucket[signals.sentiment]++;
        qBucket.scoreSum += signals.sentimentScore;
        if (signals.isActionable) qBucket.actionableCount++;
        if (signals.urgency === 'high') qBucket.highUrgencyCount++;

        const qDocTerms = new Set();
        for (let t = 0; t < cleanTokens.length; t++) {
          const w = cleanTokens[t];
          qBucket.termFreq[w] = (qBucket.termFreq[w] || 0) + 1;
          qDocTerms.add(w);
          if (t < cleanTokens.length - 1) {
            const bg = `${w} ${cleanTokens[t + 1]}`;
            qBucket.termFreq[bg] = (qBucket.termFreq[bg] || 0) + 1;
            qDocTerms.add(bg);
            qBucket.bigramSet.add(bg);
          }
        }
        qDocTerms.forEach((term) => {
          qBucket.docFreq[term] = (qBucket.docFreq[term] || 0) + 1;
        });

        if (quoteQuality > qBucket.topQuoteScore) {
          qBucket.topQuoteScore = quoteQuality;
          qBucket.topQuote = rawText.length > 220 ? `${rawText.slice(0, 217)}...` : rawText;
        }
      }

      // Build overall TF-IDF topTerms (max 30)
      const topTerms = _buildTopTermsFromCounts(termFreq, docFreq, bigramSet, totalAnalyzed, 30);

      // Build sorted themes array (custom + discovered, General Feedback last)
      const themes = Object.values(themeAgg)
        .filter((t) => t.count >= 1)
        .sort((a, b) => {
          if (a.id === GENERAL_THEME.id && b.id !== GENERAL_THEME.id) return 1;
          if (b.id === GENERAL_THEME.id && a.id !== GENERAL_THEME.id) return -1;
          return b.count - a.count;
        })
        .map((t) => ({
          id: t.id,
          name: t.name,
          color: t.color,
          isCustom: t.isCustom,
          isFallback: t.isFallback,
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
          isCustom: t.isCustom,
          countsBySegment,
          total: t.count
        };
      });

      // Build Layer 3: Per-Question Verbatim Breakdown in survey question order
      const surveyOrderIds = targetQuestions.map((q) => q.id);
      const orderedQIds = surveyOrderIds.length > 0
        ? [
            ...surveyOrderIds.filter((id) => Boolean(byQuestionAgg[id])),
            ...byQuestionOrder.filter((id) => !surveyOrderIds.includes(id))
          ]
        : byQuestionOrder;

      const byQuestion = orderedQIds.map((qId) => {
        const qb = byQuestionAgg[qId];
        return {
          qId: qb.qId,
          code: qb.code,
          title: qb.title,
          count: qb.count,
          positive: qb.positive,
          neutral: qb.neutral,
          negative: qb.negative,
          netSentiment: qb.count > 0 ? Math.round(((qb.positive - qb.negative) / qb.count) * 100) : 0,
          avgSentimentScore: qb.count > 0 ? Number((qb.scoreSum / qb.count).toFixed(2)) : 0,
          actionableCount: qb.actionableCount,
          highUrgencyCount: qb.highUrgencyCount,
          topTerms: _buildTopTermsFromCounts(qb.termFreq, qb.docFreq, qb.bigramSet, qb.count, 8),
          topQuote: qb.topQuote
        };
      });

      return {
        totalAnalyzed,
        questionId: requestedQId,
        textQuestions,
        byQuestion,
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
        customThemes,
        discoveredThemes: discoveredThemes.map((t) => ({
          id: t.id,
          name: t.name,
          color: t.color,
          keywords: t.keywords
        })),
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
     * Theme-to-Score Impact Analysis ("Why Did Scores Drop or Rise?")
     * Correlates discovered/custom verbatim themes against a quantitative or ordinal rating question.
     * Auto-selects the survey's primary quantitative/rating question unless metricQId specifies one.
     */
    computeThemeScoreImpact(analysis, responses, survey, metricQId = 'auto') {
      const safeResponses = Array.isArray(responses) ? responses : [];
      const safeAnalysis = (analysis && typeof analysis === 'object') ? analysis : { themes: [], records: [] };
      const candidates = _extractMetricCandidates(survey, safeResponses);
      const availableMetrics = candidates.map((c) => ({
        id: c.id,
        code: c.code,
        title: c.title,
        label: c.label,
        type: c.type,
        unit: c.unit,
        scale: c.scale,
        min: c.min,
        max: c.max,
        validCount: c.validCount
      }));

      if (candidates.length === 0) {
        return {
          hasMetric: false,
          metricQId: null,
          metricLabel: '',
          metricTitle: '',
          metricType: '',
          metricScale: '',
          metricUnit: '',
          metricMin: 0,
          metricMax: 5,
          overallMean: null,
          totalScored: 0,
          availableMetrics,
          impacts: []
        };
      }

      const reqId = String(metricQId || 'auto').trim();
      const selected = (reqId !== 'auto' ? candidates.find((c) => c.id === reqId) : null) || candidates[0];

      // Map each respondent (by canonical response id) to their numeric metric score
      const respondentScores = new Map();
      const allScores = [];
      for (let i = 0; i < safeResponses.length; i++) {
        const r = safeResponses[i];
        if (!r || !r.answers || typeof r.answers !== 'object') continue;
        const val = selected.extractor(r.answers[selected.id]);
        if (!Number.isFinite(val)) continue;
        const canonId = String(r.clientResponseId || r.id || `resp_${i + 1}`);
        if (!respondentScores.has(canonId)) {
          respondentScores.set(canonId, val);
          allScores.push(val);
        }
        if (r.id && String(r.id) !== canonId && !respondentScores.has(String(r.id))) {
          respondentScores.set(String(r.id), val);
        }
      }

      const totalScored = allScores.length;
      if (totalScored === 0) {
        return {
          hasMetric: true,
          metricQId: selected.id,
          metricLabel: selected.label,
          metricTitle: selected.title,
          metricType: selected.type,
          metricScale: selected.scale,
          metricUnit: selected.unit,
          metricMin: selected.min,
          metricMax: selected.max,
          overallMean: null,
          totalScored: 0,
          availableMetrics,
          impacts: []
        };
      }

      const overallMeanRaw = allScores.reduce((a, b) => a + b, 0) / totalScored;
      const overallMean = Number(overallMeanRaw.toFixed(2));

      // Build theme -> set of unique respondent canonical IDs mentioning that theme
      const themeRespondents = new Map();
      const records = Array.isArray(safeAnalysis.records) ? safeAnalysis.records : [];
      records.forEach((rec) => {
        if (!rec) return;
        const rid = String(rec.id || '');
        if (!rid || !respondentScores.has(rid)) return;
        const recThemes = Array.isArray(rec.themes) ? rec.themes : [];
        recThemes.forEach((th) => {
          const tid = typeof th === 'string' ? th : (th && th.id);
          if (!tid) return;
          if (!themeRespondents.has(tid)) themeRespondents.set(tid, new Set());
          themeRespondents.get(tid).add(rid);
        });
      });

      // Deduplicated respondent list for computing meanWithout accurately
      const uniqueScoredRespondents = [];
      const seenCanon = new Set();
      for (let i = 0; i < safeResponses.length; i++) {
        const r = safeResponses[i];
        if (!r || !r.answers || typeof r.answers !== 'object') continue;
        const val = selected.extractor(r.answers[selected.id]);
        if (!Number.isFinite(val)) continue;
        const canonId = String(r.clientResponseId || r.id || `resp_${i + 1}`);
        if (seenCanon.has(canonId)) continue;
        seenCanon.add(canonId);
        uniqueScoredRespondents.push({ id: canonId, altId: r.id ? String(r.id) : null, score: val });
      }

      const themes = Array.isArray(safeAnalysis.themes) ? safeAnalysis.themes : [];
      const impacts = [];

      themes.forEach((th) => {
        if (!th || !th.id || (th.count || 0) < 1) return;
        const withSet = themeRespondents.get(th.id);
        if (!withSet || withSet.size < 1) return;

        const scoresWith = [];
        const scoresWithout = [];
        for (let i = 0; i < uniqueScoredRespondents.length; i++) {
          const item = uniqueScoredRespondents[i];
          if (withSet.has(item.id) || (item.altId && withSet.has(item.altId))) {
            scoresWith.push(item.score);
          } else {
            scoresWithout.push(item.score);
          }
        }

        const nWith = scoresWith.length;
        const nWithout = scoresWithout.length;
        if (nWith < 1) return;

        const meanWithRaw = scoresWith.reduce((a, b) => a + b, 0) / nWith;
        const meanWithoutRaw = nWithout > 0
          ? scoresWithout.reduce((a, b) => a + b, 0) / nWithout
          : overallMeanRaw;
        const deltaRaw = nWithout > 0 ? (meanWithRaw - meanWithoutRaw) : 0;

        let tStat = 0;
        let pValue = null;
        let isSignificant = false;
        if (nWith >= 2 && nWithout >= 2) {
          const welch = _welchTTestLocal(scoresWith, scoresWithout);
          tStat = welch.tStat;
          pValue = welch.pValue;
          isSignificant = Boolean(welch.pValue !== null && welch.pValue < 0.05);
        }

        const delta = Number(deltaRaw.toFixed(2));
        impacts.push({
          themeId: th.id,
          id: th.id,
          name: th.name,
          theme: th.name,
          color: th.color || '#247B50',
          isCustom: Boolean(th.isCustom),
          isFallback: Boolean(th.isFallback),
          mentionCount: th.count || nWith,
          netSentiment: th.netSentiment ?? 0,
          meanWith: Number(meanWithRaw.toFixed(2)),
          meanWithout: Number(meanWithoutRaw.toFixed(2)),
          delta,
          nWith,
          nWithout,
          tStat,
          pValue,
          isSignificant,
          direction: delta > 0 ? 'positive' : (delta < 0 ? 'negative' : 'neutral')
        });
      });

      impacts.sort((a, b) => (Math.abs(b.delta) - Math.abs(a.delta)) || (b.nWith - a.nWith));

      return {
        hasMetric: true,
        metricQId: selected.id,
        metricLabel: selected.label,
        metricTitle: selected.title,
        metricType: selected.type,
        metricScale: selected.scale,
        metricUnit: selected.unit,
        metricMin: selected.min,
        metricMax: selected.max,
        overallMean,
        totalScored,
        availableMetrics,
        impacts
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
    // 9B. Question-Level Substantive Insight Synthesis (Offline Narrative)
    //     Puts all open-ended responses together into cohesive takeaways,
    //     theme insights, strengths, challenges, and concrete requests —
    //     rather than just listing sentiment percentages.
    // ------------------------------------------------------------------------
    synthesizeQuestionInsights(analysis, survey, question) {
      const safeAnalysis = analysis || { totalAnalyzed: 0, records: [], themes: [], topTerms: [], sentimentSummary: {} };
      const records = Array.isArray(safeAnalysis.records) ? safeAnalysis.records : [];
      const total = records.length || safeAnalysis.totalAnalyzed || 0;

      if (total === 0) {
        return {
          narrative: 'No open-ended responses have been recorded for this question yet.',
          keyTakeaways: [],
          themeInsights: [],
          recommendations: [],
          representativeVoices: []
        };
      }

      const cleanExcerpt = (raw, maxLen = 145) => {
        const s = String(raw || '').replace(/\s+/g, ' ').trim();
        if (!s) return '';
        if (s.length <= maxLen) return s;
        const cut = s.slice(0, maxLen - 1);
        const lastSpace = cut.lastIndexOf(' ');
        return (lastSpace > maxLen * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:\-]+$/, '') + '…';
      };

      const tokenizeLocal = (text) => {
        return String(text || '')
          .toLowerCase()
          .replace(/[^a-z0-9\u00c0-\u024f\s'-]/g, ' ')
          .split(/\s+/)
          .filter((w) => w.length >= 3 && !STOP_WORDS.has(w) && !TOPIC_ANCHOR_NOISE.has(w));
      };

      // Build corpus TF-IDF map for extractive centrality (LexRank-style representative picking)
      const docTokens = records.map((r) => tokenizeLocal(r.translatedText || r.text || ''));
      const dfMap = Object.create(null);
      docTokens.forEach((toks) => {
        new Set(toks).forEach((w) => {
          dfMap[w] = (dfMap[w] || 0) + 1;
        });
      });

      const scoreRecordInformativeness = (rec, idx) => {
        const txt = String(rec.translatedText || rec.text || '').trim();
        const toks = docTokens[idx] || [];
        if (!txt || toks.length === 0) return 0;
        let tfidfSum = 0;
        const seen = new Set();
        toks.forEach((w) => {
          if (seen.has(w)) return;
          seen.add(w);
          const df = dfMap[w] || 1;
          const idf = 1 + Math.log((total + 1) / (df + 1));
          // Favor terms shared by multiple respondents (consensus) over one-off typos
          const consensusBoost = df >= 2 ? 1.35 : 0.85;
          tfidfSum += idf * consensusBoost;
        });
        const lenScore = Math.min(txt.length, 180) / 90;
        const actionableBoost = rec.isActionable ? 0.6 : 0;
        return tfidfSum / Math.sqrt(Math.max(1, seen.size)) + lenScore + actionableBoost;
      };

      const jaccardSimilarity = (tokA, tokB) => {
        const setA = new Set(tokA);
        const setB = new Set(tokB);
        if (setA.size === 0 || setB.size === 0) return 0;
        let inter = 0;
        setA.forEach((w) => {
          if (setB.has(w)) inter++;
        });
        const union = setA.size + setB.size - inter;
        return union > 0 ? inter / union : 0;
      };

      const pickDiverseRepresentative = (subsetWithIdx, limit = 3) => {
        const scored = subsetWithIdx
          .map(({ rec, idx }) => ({
            rec,
            idx,
            toks: docTokens[idx] || [],
            score: scoreRecordInformativeness(rec, idx),
            norm: String(rec.translatedText || rec.text || '').toLowerCase().replace(/\s+/g, ' ').trim()
          }))
          .filter((x) => x.norm.length >= 4)
          .sort((a, b) => b.score - a.score);

        const picked = [];
        for (let i = 0; i < scored.length && picked.length < limit; i++) {
          const cand = scored[i];
          const tooSimilar = picked.some((p) => p.norm === cand.norm || jaccardSimilarity(p.toks, cand.toks) >= 0.55);
          if (!tooSimilar) picked.push(cand);
        }
        return picked.map((p) => p.rec);
      };

      const extractSubPhrases = (subsetWithIdx, excludeWords = new Set(), maxPhrases = 3) => {
        const counts = Object.create(null);
        subsetWithIdx.forEach(({ idx }) => {
          const toks = docTokens[idx] || [];
          const seen = new Set();
          for (let i = 0; i < toks.length; i++) {
            const w1 = toks[i];
            if (!excludeWords.has(w1) && !seen.has(w1)) {
              counts[w1] = (counts[w1] || 0) + 1;
              seen.add(w1);
            }
            if (i < toks.length - 1) {
              const w2 = toks[i + 1];
              if (w1 !== w2 && !(excludeWords.has(w1) && excludeWords.has(w2))) {
                const bg = `${w1} ${w2}`;
                if (!seen.has(bg)) {
                  counts[bg] = (counts[bg] || 0) + 1.4;
                  seen.add(bg);
                }
              }
            }
          }
        });
        return Object.entries(counts)
          .filter(([, c]) => c >= (subsetWithIdx.length >= 4 ? 2 : 1))
          .sort((a, b) => b[1] - a[1])
          .slice(0, maxPhrases)
          .map(([term]) => term);
      };

      const indexedRecords = records.map((rec, idx) => ({ rec, idx }));
      const rawThemes = (safeAnalysis.themes || []).filter((t) => (t.count || 0) > 0).slice(0, 5);

      // 1. Build substantive theme insights (what respondents actually said per theme)
      const themeInsights = rawThemes.map((t) => {
        const tRecs = indexedRecords.filter(({ rec }) =>
          (Array.isArray(rec.themeIds) && rec.themeIds.includes(t.id)) ||
          (Array.isArray(rec.themeNames) && rec.themeNames.includes(t.name))
        );
        const themeExclude = new Set(String(t.name || '').toLowerCase().split(/\s+/));
        const subPhrases = extractSubPhrases(tRecs, themeExclude, 3);
        const bestRep = pickDiverseRepresentative(tRecs, 1)[0];
        const sampleQuote = cleanExcerpt(bestRep ? (bestRep.translatedText || bestRep.text) : (t.topQuote || ''), 135);

        let stance = 'discussed across responses';
        if (t.positive > t.negative && t.netSentiment >= 20) stance = 'highlighted mostly as a strength';
        else if (t.negative > t.positive && t.netSentiment <= -20) stance = 'raised primarily as a challenge';
        else if (t.positive > 0 && t.negative > 0) stance = 'drew mixed feedback';

        const focusText = subPhrases.length > 0 ? ` — centering on ${subPhrases.slice(0, 2).join(' and ')}` : '';
        const insight = `Raised in ${t.count} of ${total} responses (${t.pct}%), ${stance}${focusText}.`;

        return {
          id: t.id,
          name: t.name,
          count: t.count,
          pct: t.pct,
          netSentiment: t.netSentiment,
          insight,
          sampleQuote
        };
      });

      // 2. Partition by substance: strengths, challenges, actionable requests, and overall representative voices
      const positiveRecs = indexedRecords.filter(({ rec }) => rec.sentiment === 'positive');
      const negativeRecs = indexedRecords.filter(({ rec }) => rec.sentiment === 'negative');
      const actionableRecs = indexedRecords.filter(({ rec }) => rec.isActionable);

      const topPosReps = pickDiverseRepresentative(positiveRecs, 2);
      const topNegReps = pickDiverseRepresentative(negativeRecs, 2);
      const topActReps = pickDiverseRepresentative(actionableRecs, 3);
      const representativeVoices = pickDiverseRepresentative(indexedRecords, 4).map((r) => ({
        text: cleanExcerpt(r.translatedText || r.text, 160),
        sentiment: r.sentiment || 'neutral',
        themes: r.themeNames || []
      }));

      // 3. Build cohesive overall narrative paragraph (substance-first, NOT sentiment-only)
      const narrativeParts = [];
      if (themeInsights.length >= 2) {
        narrativeParts.push(
          `Across ${total} responses, respondents most frequently focused on ${themeInsights[0].name} (${themeInsights[0].pct}%) and ${themeInsights[1].name} (${themeInsights[1].pct}%)${themeInsights[2] ? `, alongside ${themeInsights[2].name} (${themeInsights[2].pct}%)` : ''}.`
        );
      } else if (themeInsights.length === 1) {
        narrativeParts.push(
          `Across ${total} responses, feedback centered primarily on ${themeInsights[0].name} (${themeInsights[0].pct}% of answers).`
        );
      } else {
        const topTerms = (safeAnalysis.topTerms || [])
          .slice(0, 4)
          .map((x) => (typeof x === 'string' ? x : (x.term || x.word || '')))
          .filter(Boolean);
        narrativeParts.push(
          topTerms.length > 0
            ? `Across ${total} responses, respondents shared varied perspectives touching on ${topTerms.slice(0, 3).join(', ')}.`
            : `Across ${total} responses, respondents provided distinct, individual viewpoints with no single dominant keyword cluster.`
        );
      }

      if (topPosReps.length > 0 && topNegReps.length > 0) {
        narrativeParts.push(
          `Feedback highlights both strengths (such as "${cleanExcerpt(topPosReps[0].translatedText || topPosReps[0].text, 95)}") and areas of friction (such as "${cleanExcerpt(topNegReps[0].translatedText || topNegReps[0].text, 95)}").`
        );
      } else if (topNegReps.length > 0) {
        narrativeParts.push(
          `Key concerns raised include "${cleanExcerpt(topNegReps[0].translatedText || topNegReps[0].text, 110)}".`
        );
      } else if (topPosReps.length > 0) {
        narrativeParts.push(
          `Respondents consistently noted positive experiences, including "${cleanExcerpt(topPosReps[0].translatedText || topPosReps[0].text, 110)}".`
        );
      } else if (representativeVoices.length > 0) {
        narrativeParts.push(
          `Representative points include "${cleanExcerpt(representativeVoices[0].text, 105)}"${representativeVoices[1] ? ` and "${cleanExcerpt(representativeVoices[1].text, 105)}"` : ''}.`
        );
      }

      if (actionableRecs.length > 0 && topActReps.length > 0) {
        narrativeParts.push(
          `${actionableRecs.length} ${actionableRecs.length === 1 ? 'response offers' : 'responses offer'} concrete suggestions, notably "${cleanExcerpt(topActReps[0].translatedText || topActReps[0].text, 100)}".`
        );
      }

      const narrative = narrativeParts.join(' ');

      // 4. Structured Key Takeaways (3–5 crisp substance bullets)
      const keyTakeaways = [];

      if (themeInsights.length > 0) {
        const lead = themeInsights[0];
        keyTakeaways.push({
          label: 'Main Pattern',
          tone: 'neutral',
          text: `${lead.name} is the leading topic (${lead.count} of ${total} responses, ${lead.pct}%).${lead.sampleQuote ? ` Typical response: "${lead.sampleQuote}"` : ''}`
        });
      }

      if (topPosReps.length > 0) {
        const posPhrases = extractSubPhrases(positiveRecs, new Set(), 3);
        const posIntro = posPhrases.length > 0 ? `Respondents praised ${posPhrases.slice(0, 2).join(' and ')}` : 'Respondents highlighted positive experiences';
        keyTakeaways.push({
          label: 'What’s Working',
          tone: 'positive',
          text: `${posIntro} (${positiveRecs.length} responses) — e.g., "${cleanExcerpt(topPosReps[0].translatedText || topPosReps[0].text, 120)}"`
        });
      }

      if (topNegReps.length > 0) {
        const negPhrases = extractSubPhrases(negativeRecs, new Set(), 3);
        const negIntro = negPhrases.length > 0 ? `Main pain points center on ${negPhrases.slice(0, 2).join(' and ')}` : 'Respondents flagged specific challenges';
        keyTakeaways.push({
          label: 'Key Challenges',
          tone: 'negative',
          text: `${negIntro} (${negativeRecs.length} responses) — e.g., "${cleanExcerpt(topNegReps[0].translatedText || topNegReps[0].text, 120)}"`
        });
      }

      if (topActReps.length > 0) {
        keyTakeaways.push({
          label: 'What Respondents Ask For',
          tone: 'action',
          text: `${actionableRecs.length} actionable ${actionableRecs.length === 1 ? 'suggestion' : 'suggestions'} — including "${cleanExcerpt(topActReps[0].translatedText || topActReps[0].text, 120)}"${topActReps[1] ? ` and "${cleanExcerpt(topActReps[1].translatedText || topActReps[1].text, 100)}"` : ''}.`
        });
      }

      // If responses were predominantly neutral/informational (few takeaways so far), surface the most informative distinct voices directly
      if (keyTakeaways.length < 3 && representativeVoices.length > 0) {
        const usedQuotes = new Set(keyTakeaways.map((k) => k.text));
        representativeVoices.forEach((v) => {
          if (keyTakeaways.length >= 4) return;
          const alreadyMentioned = Array.from(usedQuotes).some((u) => u.includes(v.text.slice(0, 45)));
          if (!alreadyMentioned) {
            keyTakeaways.push({
              label: 'Key Response',
              tone: 'neutral',
              text: `"${v.text}"`
            });
            usedQuotes.add(v.text);
          }
        });
      }

      const recommendations = topActReps.map((r) => cleanExcerpt(r.translatedText || r.text, 160));

      return {
        narrative,
        keyTakeaways: keyTakeaways.slice(0, 5),
        themeInsights,
        recommendations,
        representativeVoices
      };
    },

    // ------------------------------------------------------------------------
    // 10. Pinned Quotes Persistence (localStorage with in-memory fallback)
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
    // 11. Hybrid Cloud GAS Helpers (BATCH_TRANSLATE & ANALYZE_VERBATIMS_AI)
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
        question: r.questionCode || 'Q',
        questionTitle: r.questionTitle || r.questionCode || 'Q',
        text: String(r.translatedText || r.text || '').slice(0, 350),
        sentiment: r.sentiment,
        themes: r.themeNames || [],
        segment: r.segment || '',
        location: r.location || ''
      }));

      try {
        const payload = {
          action: 'ANALYZE_VERBATIMS_AI',
          syncToken: cfg.syncToken,
          deviceId: cfg.deviceId,
          surveyId: (survey && survey.id) || '',
          surveyTitle: (survey && survey.title) || 'Survey',
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
