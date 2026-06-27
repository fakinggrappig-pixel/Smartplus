(() => {
  'use strict';

  if (window.__smartPlusInjected) return;
  window.__smartPlusInjected = true;

  const VERSION = '2.7.0';
  const STORAGE_KEY = 'smartplus.state.v2';
  const OLD_KEYS = ['studydock.clear.state.v1', 'studydock.pro.state.v1', 'studydock.state.v2'];
  const isTopFrame = window.top === window.self;
  const MAX = { grades: 1200, reminders: 120, log: 60, text: 16000, backgroundImage: 1800000 };

  const DEFAULT_STATE = {
    version: VERSION,
    open: false,
    active: 'home',
    panelWidth: 500,
    theme: 'smartschool-classic',
    custom: { accent: '#ff5a1f', accent2: '#ff985c', bg: '', card: '', text: '', backgroundImage: '' },
    themeOptions: { applyToSmartschool: true, animations: true, glass: false, subjectThemesText: '', previewTheme: '', timeTheme: false },
    focus: {
      focusMode: false,
      reader: false,
      ruler: false,
      largeText: false,
      hideNotifications: false,
      night: false,
      contrast: false,
      dyslexia: false,
      lineSpace: false,
      calm: false,
      tableBoost: false,
      wide: false,
      spotlight: false,
      pomodoro: false,
      breakMinutes: 5,
      sound: true,
      autoNight: false,
      profile: 'custom',
      nightStart: '20:00',
      nightEnd: '07:00',
      testMode: false,
      cleanPrint: false
    },
    timer: { minutes: 20, remaining: 1200, running: false, startedAt: 0, sessionType: 'focus', focusSecondsAtStart: 1200 },
    focusStats: { date: '', todaySeconds: 0, weekKey: '', weekSeconds: 0, sessions: [] },
    notifications: {
      enabled: true,
      newGrades: true,
      reminders: true,
      timerDone: true,
      quietHours: true,
      quietStart: '22:00',
      quietEnd: '07:00'
    },
    reminders: [],
    newReminder: { title: '', note: '', at: '' },
    mail: { draft: '', output: '', subject: '', score: 0, template: 'teacher-question', shortOutput: '', longOutput: '' },
    grades: [],
    gradeGoals: {},
    trendNotified: {},
    gradeScan: { lastAt: '', status: 'Nog niet gescand', found: 0, pages: 0, errors: 0, log: [], auto: true, deep: true, periodFilter: 'all', errorHint: '', lastNew: 0 },
    calculator: { newScore: '14', newMax: '20', target: '70', remainingTests: '1' },
    themeImport: '',
    settings: { autoMailCoach: true, autoScanGrades: true, showDebug: false, compactGrades: false }
  };

  const TEMPLATES = [
    ['teacher-question','Vraag aan leerkracht','Vraag over {vak}','Beste {naam},\n\nIk heb een vraag over {vak}. Kunt u mij laten weten wat ik precies moet kennen of maken?\n\nAlvast bedankt.\n\nMet vriendelijke groeten,\n{leerling}'],
    ['task-info','Wat moet ik doen?','Vraag over opdracht {vak}','Beste {naam},\n\nIk ben niet helemaal zeker wat er precies verwacht wordt voor de opdracht van {vak}. Kunt u kort uitleggen wat ik moet maken en tegen wanneer dit klaar moet zijn?\n\nAlvast bedankt.\n\nMet vriendelijke groeten,\n{leerling}'],
    ['extension','Uitstel vragen','Vraag over deadline {vak}','Beste {naam},\n\nIk heb een vraag over de deadline van {vak}. Door omstandigheden lukt het mij niet om alles op tijd volledig af te werken. Zou het mogelijk zijn om kort uitstel te krijgen?\n\nIk zal de opdracht zo snel mogelijk in orde brengen.\n\nAlvast bedankt.\n\nMet vriendelijke groeten,\n{leerling}'],
    ['absence','Ziek geweest','Afwezigheid - {vak}','Beste {naam},\n\nIk was afwezig tijdens de les van {vak}. Kunt u mij laten weten welke leerstof ik moet inhalen en of er taken of toetsen zijn aangekondigd?\n\nAlvast bedankt.\n\nMet vriendelijke groeten,\n{leerling}'],
    ['forgot-task','Taak vergeten','Taak vergeten - {vak}','Beste {naam},\n\nMijn excuses, ik heb gemerkt dat ik de taak voor {vak} nog niet correct heb ingediend. Kunt u mij laten weten of ik deze nog mag indienen?\n\nIk zal dit zo snel mogelijk in orde brengen.\n\nAlvast bedankt.\n\nMet vriendelijke groeten,\n{leerling}'],
    ['feedback','Feedback vragen','Feedback op resultaat {vak}','Beste {naam},\n\nZou u mij kort kunnen zeggen waarop ik vooral moet letten om mijn resultaat voor {vak} te verbeteren?\n\nAlvast bedankt voor uw feedback.\n\nMet vriendelijke groeten,\n{leerling}'],
    ['missed-test','Toets gemist','Gemiste toets {vak}','Beste {naam},\n\nIk heb de toets van {vak} gemist. Kunt u mij laten weten wanneer en hoe ik deze kan inhalen?\n\nAlvast bedankt.\n\nMet vriendelijke groeten,\n{leerling}'],
    ['grade-question','Vraag over punten','Vraag over resultaat {vak}','Beste {naam},\n\nIk heb een vraag over mijn resultaat voor {vak}. Kunt u mij laten weten waar ik mijn fouten vooral heb gemaakt en hoe ik dit beter kan aanpakken?\n\nAlvast bedankt.\n\nMet vriendelijke groeten,\n{leerling}'],
    ['smartschool-problem','Smartschool-probleem','Technisch probleem in Smartschool','Beste {naam},\n\nIk ondervind een technisch probleem in Smartschool. Daardoor kan ik de informatie of opdracht voor {vak} niet goed openen of indienen. Kunt u mij laten weten wat ik best doe?\n\nAlvast bedankt.\n\nMet vriendelijke groeten,\n{leerling}'],
    ['apology','Excuses aanbieden','Excuses voor {vak}','Beste {naam},\n\nMijn excuses voor de verwarring rond {vak}. Ik had dit beter moeten opvolgen. Kunt u mij laten weten wat ik nu best doe om dit correct in orde te brengen?\n\nAlvast bedankt.\n\nMet vriendelijke groeten,\n{leerling}'],
    ['thank-you','Bedanken','Bedankt','Beste {naam},\n\nBedankt voor uw uitleg en hulp. Dat heeft mij geholpen om beter te begrijpen wat ik moet doen.\n\nMet vriendelijke groeten,\n{leerling}'],
    ['director','Bericht aan directie','Vraag aan directie','Beste directie,\n\nIk heb een vraag over een schoolgerelateerde situatie. Kunt u mij laten weten bij wie ik hiervoor terecht kan of wat ik best doe?\n\nAlvast bedankt.\n\nMet vriendelijke groeten,\n{leerling}'],
    ['secretary','Bericht aan secretariaat','Vraag aan secretariaat','Beste secretariaat,\n\nIk heb een vraag over mijn schooladministratie. Kunt u mij laten weten wat ik hiervoor moet doen of welke informatie u nodig hebt?\n\nAlvast bedankt.\n\nMet vriendelijke groeten,\n{leerling}'],
    ['class-teacher','Klastitularis','Vraag aan klastitularis','Beste {naam},\n\nIk heb een vraag waarbij ik graag uw hulp als klastitularis zou krijgen. Kunt u mij laten weten wat ik best doe?\n\nAlvast bedankt.\n\nMet vriendelijke groeten,\n{leerling}'],
    ['parents','Ouderbericht','Vraag over {vak}','Beste {naam},\n\nWij hebben een vraag over {vak}. Kunt u ons laten weten wat er precies verwacht wordt en tegen wanneer dit in orde moet zijn?\n\nAlvast bedankt.\n\nMet vriendelijke groeten,\n{leerling}'],
    ['groupwork','Groepswerk','Vraag over groepswerk {vak}','Beste {naam},\n\nIk heb een vraag over het groepswerk voor {vak}. Kunt u verduidelijken wat er precies verwacht wordt en hoe de taakverdeling best wordt aangepakt?\n\nAlvast bedankt.\n\nMet vriendelijke groeten,\n{leerling}'],
    ['presentation','Presentatie','Vraag over presentatie {vak}','Beste {naam},\n\nIk heb een vraag over de presentatie voor {vak}. Kunt u mij laten weten waarop we vooral beoordeeld worden en wat zeker aanwezig moet zijn?\n\nAlvast bedankt.\n\nMet vriendelijke groeten,\n{leerling}'],
    ['book-material','Boek of cursus','Vraag over materiaal {vak}','Beste {naam},\n\nIk heb een vraag over het materiaal voor {vak}. Kunt u mij laten weten welke pagina’s of documenten we precies moeten gebruiken?\n\nAlvast bedankt.\n\nMet vriendelijke groeten,\n{leerling}'],
    ['retake','Herhalingstoets','Vraag over herhalingstoets {vak}','Beste {naam},\n\nKunt u mij laten weten of er een mogelijkheid is om mijn resultaat voor {vak} te verbeteren of een herhalingstoets te maken?\n\nAlvast bedankt.\n\nMet vriendelijke groeten,\n{leerling}'],
    ['late-arrival','Te laat','Melding te laat','Beste {naam},\n\nMijn excuses, ik was te laat. Ik zal ervoor zorgen dat dit niet opnieuw gebeurt. Kunt u mij laten weten of ik nog iets moet inhalen?\n\nMet vriendelijke groeten,\n{leerling}'],
    ['material-lost','Materiaal kwijt','Vraag over materiaal {vak}','Beste {naam},\n\nIk ben mijn materiaal voor {vak} kwijt of kan het niet terugvinden. Kunt u mij laten weten waar ik dit opnieuw kan vinden of wat ik best doe?\n\nAlvast bedankt.\n\nMet vriendelijke groeten,\n{leerling}'],
    ['group-absence','Afwezig bij groepswerk','Afwezigheid groepswerk {vak}','Beste {naam},\n\nIk was afwezig tijdens een moment van het groepswerk voor {vak}. Kunt u mij laten weten hoe ik mijn deel nog correct kan opnemen?\n\nAlvast bedankt.\n\nMet vriendelijke groeten,\n{leerling}'],
    ['unclear-test','Wat kennen voor toets?','Vraag over toets {vak}','Beste {naam},\n\nIk wil mij goed voorbereiden op de toets van {vak}. Kunt u mij laten weten welke leerstof ik precies moet kennen en welke oefeningen belangrijk zijn?\n\nAlvast bedankt.\n\nMet vriendelijke groeten,\n{leerling}'],
    ['wrong-file','Verkeerd bestand','Verkeerd bestand ingediend {vak}','Beste {naam},\n\nIk heb gemerkt dat ik mogelijk het verkeerde bestand heb ingediend voor {vak}. Kunt u mij laten weten of ik het correcte bestand nog opnieuw mag indienen?\n\nAlvast bedankt.\n\nMet vriendelijke groeten,\n{leerling}'],
    ['meeting','Afspraak vragen','Vraag om afspraak','Beste {naam},\n\nZou het mogelijk zijn om kort een afspraak te maken om mijn vraag over {vak} te bespreken?\n\nAlvast bedankt.\n\nMet vriendelijke groeten,\n{leerling}']
  ].map(([id,label,subject,body]) => ({ id, label, subject, body }));

  const THEMES = [
    ['smartschool-classic','Smartschool Classic','calm','#ff5a1f','#ff985c','#f6f7fb','#ffffff','#fff7f2','#172033','#667085','#e6e8ef','#fff1e8','#f6f7fb','#172033'],
    ['paper-white','Paper White','calm','#d97706','#f59e0b','#fbfaf7','#ffffff','#f7f1e7','#1f2937','#6b7280','#e7dfd1','#fff7ed','#fbfaf7','#1f2937'],
    ['ice-white','Ice White','calm','#2563eb','#60a5fa','#f7fbff','#ffffff','#eef6ff','#172033','#64748b','#dbeafe','#eff6ff','#f7fbff','#172033'],
    ['soft-blue','Soft Blue','calm','#1d4ed8','#38bdf8','#eef6ff','#ffffff','#e0f2fe','#0f172a','#64748b','#cfe8ff','#e0f2fe','#eef6ff','#0f172a'],
    ['mint','Mint','calm','#059669','#34d399','#f0fdf4','#ffffff','#dcfce7','#052e2b','#64748b','#bbf7d0','#ecfdf5','#f0fdf4','#052e2b'],
    ['forest-calm','Forest Calm','calm','#166534','#65a30d','#f3f8ed','#ffffff','#e9f5db','#132b1f','#64748b','#d9ead3','#f0fdf4','#f3f8ed','#132b1f'],
    ['lavender','Lavender','calm','#7c3aed','#a78bfa','#f6f3ff','#ffffff','#ede9fe','#241633','#6b7280','#ddd6fe','#f5f3ff','#f6f3ff','#241633'],
    ['sand','Sand','calm','#b45309','#f59e0b','#fff7ed','#ffffff','#ffedd5','#2f2118','#78716c','#fed7aa','#fff7ed','#fff7ed','#2f2118'],
    ['ocean','Ocean','calm','#0e7490','#22d3ee','#ecfeff','#ffffff','#cffafe','#0f2f3a','#64748b','#a5f3fc','#ecfeff','#ecfeff','#0f2f3a'],
    ['slate','Slate','calm','#475569','#94a3b8','#f8fafc','#ffffff','#f1f5f9','#0f172a','#64748b','#e2e8f0','#f1f5f9','#f8fafc','#0f172a'],
    ['rose','Rose','calm','#be123c','#fb7185','#fff1f2','#ffffff','#ffe4e6','#2b1720','#6b7280','#fecdd3','#fff1f2','#fff1f2','#2b1720'],
    ['coffee','Coffee','calm','#92400e','#d97706','#f7f0e8','#fffaf5','#f1e1d2','#2b1d15','#78716c','#e7d0b8','#fff7ed','#f7f0e8','#2b1d15'],
    ['sky','Sky','calm','#0284c7','#7dd3fc','#f0f9ff','#ffffff','#e0f2fe','#0c2238','#64748b','#bae6fd','#e0f2fe','#f0f9ff','#0c2238'],
    ['clean-green','Clean Green','calm','#16a34a','#86efac','#f7fee7','#ffffff','#ecfccb','#102a1b','#64748b','#d9f99d','#f0fdf4','#f7fee7','#102a1b'],
    ['beige','Beige','calm','#a16207','#eab308','#fefce8','#ffffff','#fef3c7','#2c2416','#78716c','#fde68a','#fef9c3','#fefce8','#2c2416'],
    ['neon-blue','Neon Blue','cool','#2563eb','#00e5ff','#071a3a','#0b244d','#0f2f5f','#e0f2fe','#93c5fd','#1e3a8a','#082f49','#071a3a','#e0f2fe'],
    ['purple-galaxy','Purple Galaxy','cool','#8b5cf6','#ec4899','#160b2d','#23113f','#2e1555','#f5f3ff','#c4b5fd','#4c1d95','#2e1065','#160b2d','#f5f3ff'],
    ['sunset-orange','Sunset Orange','cool','#f97316','#ef4444','#2a1008','#3a160d','#4a1f12','#fff7ed','#fdba74','#7c2d12','#431407','#2a1008','#fff7ed'],
    ['cyber-lime','Cyber Lime','cool','#84cc16','#22c55e','#0c1a0d','#102716','#17351b','#ecfccb','#bef264','#365314','#1a2e05','#0c1a0d','#ecfccb'],
    ['minecraft-ish','Minecraft-ish','cool','#16a34a','#a3e635','#152516','#21381e','#2b4a25','#f7fee7','#bbf7d0','#3f6212','#1a2e05','#152516','#f7fee7'],
    ['anime-pop','Anime Pop','cool','#ec4899','#38bdf8','#2b1024','#3b1535','#4a1d43','#fdf2f8','#f9a8d4','#831843','#500724','#2b1024','#fdf2f8'],
    ['fire-red','Fire Red','cool','#dc2626','#fb923c','#2b0b0b','#3a1010','#4a1717','#fff1f2','#fca5a5','#7f1d1d','#450a0a','#2b0b0b','#fff1f2'],
    ['arctic-glass','Arctic Glass','cool','#0ea5e9','#e0f2fe','#082f49','#0c4a6e','#075985','#f0f9ff','#bae6fd','#38bdf8','#082f49','#082f49','#f0f9ff'],
    ['midnight-orange','Midnight Orange','cool','#ff5a1f','#fbbf24','#0f172a','#111827','#1f2937','#fff7ed','#fdba74','#374151','#111827','#0f172a','#fff7ed'],
    ['candy','Candy','cool','#f472b6','#c084fc','#2a133d','#3b1b54','#4c236a','#fdf4ff','#f0abfc','#86198f','#4a044e','#2a133d','#fdf4ff'],
    ['matrix','Matrix','cool','#22c55e','#86efac','#020617','#0b1210','#102018','#dcfce7','#86efac','#166534','#052e16','#020617','#dcfce7'],
    ['volcano','Volcano','cool','#ea580c','#facc15','#1c0b05','#2a1208','#3b1b0b','#fff7ed','#fdba74','#7c2d12','#431407','#1c0b05','#fff7ed'],
    ['bubblegum','Bubblegum','cool','#db2777','#f9a8d4','#fff1f8','#ffffff','#fce7f3','#2b1020','#9d174d','#fbcfe8','#fdf2f8','#fff1f8','#2b1020'],
    ['electric-violet','Electric Violet','cool','#7c3aed','#22d3ee','#120824','#21113d','#2e1858','#f5f3ff','#a78bfa','#4c1d95','#2e1065','#120824','#f5f3ff'],
    ['deep-space','Deep Space','cool','#6366f1','#14b8a6','#050816','#0b1024','#111936','#e0e7ff','#94a3b8','#312e81','#0f172a','#050816','#e0e7ff'],
    ['midnight-purple','Midnight Purple','cool','#a855f7','#22d3ee','#0f0820','#1a102d','#251640','#faf5ff','#c4b5fd','#4c1d95','#1e1b4b','#0f0820','#faf5ff'],
    ['neon-red','Neon Red','cool','#ef4444','#f97316','#150406','#25080b','#370d10','#fff1f2','#fca5a5','#7f1d1d','#450a0a','#150406','#fff1f2'],
    ['deep-teal','Deep Teal','cool','#14b8a6','#67e8f9','#061c1b','#0c2e2b','#13423d','#ecfeff','#99f6e4','#0f766e','#042f2e','#061c1b','#ecfeff'],
    ['soft-graphite','Soft Graphite','calm','#374151','#9ca3af','#f3f4f6','#ffffff','#e5e7eb','#111827','#6b7280','#d1d5db','#f9fafb','#f3f4f6','#111827'],
    ['cream-orange','Cream Orange','calm','#f97316','#facc15','#fffbeb','#ffffff','#fef3c7','#2b1d0e','#78716c','#fde68a','#fff7ed','#fffbeb','#2b1d0e'],
    ['calm-pink','Calm Pink','calm','#db2777','#f9a8d4','#fdf2f8','#ffffff','#fce7f3','#2b1020','#9d174d','#fbcfe8','#fff1f2','#fdf2f8','#2b1020'],
    ['clean-violet','Clean Violet','calm','#6d28d9','#c4b5fd','#f5f3ff','#ffffff','#ede9fe','#1f1633','#6b7280','#ddd6fe','#f5f3ff','#f5f3ff','#1f1633'],
    ['school-dark','School Dark','cool','#ff5a1f','#60a5fa','#0b1020','#111827','#1f2937','#f8fafc','#94a3b8','#374151','#111827','#0b1020','#f8fafc']
  ].map(([id,name,category,accent,accent2,bg,card,card2,text,muted,border,soft,pageBg,pageText]) => ({ id,name,category,accent,accent2,bg,card,card2,text,muted,border,soft,pageBg,pageText }));

  const REPLACEMENTS = [
    [/\bhey\b|\bhoi\b|\byo\b|\bheey\b/gi, 'Beste'],
    [/\bkan je\b|\bkun je\b|\bkunde\b|\bkunt ge\b/gi, 'kunt u'],
    [/\bge\b|\bgij\b/gi, 'u'],
    [/\bik wil\b/gi, 'ik zou graag'],
    [/\bmoet je\b|\bmoet ge\b/gi, 'kunt u'],
    [/\baub\b|\bsvp\b/gi, 'alstublieft'],
    [/\bff\b/gi, 'even'],
    [/\bthx\b|\bthanks\b|\bmerci\b/gi, 'bedankt'],
    [/\bpls\b|\bplease\b/gi, 'alstublieft'],
    [/\bzeggen wat\b/gi, 'laten weten wat'],
    [/\bdas\b/gi, 'dat is'],
    [/\bnie\b/gi, 'niet'],
    [/\bmn\b/gi, 'mijn'],
    [/\bkvind\b/gi, 'ik vind'],
    [/\bidk\b/gi, 'ik weet het niet'],
    [/\bwtf\b|\bfuck\b|\bshit\b/gi, 'dit probleem'],
    [/\bdom\b/gi, 'moeilijk'],
    [/\bsaai\b/gi, 'niet helemaal duidelijk']
  ];

  let state = clone(DEFAULT_STATE);
  let root = null;
  let saveTimer = null;
  let lastSavedSnapshot = '';
  let timerHandle = null;
  let activeEditor = null;
  let coach = null;
  let bubble = null;
  let selectedText = '';
  let autoScanInProgress = false;
  let rulerMouseListenerBound = false;
  let lastTimerSaveAt = 0;
  let lastThemePreviewId = '';


  init();

  async function init() {
    state = await loadState();
    migrateAndCleanState();
    applyTheme();
    applyFocusModes();
    bindEditorCoach();
    bindSelectionBubble();
    bindRuntimeMessages();
    if (isTopFrame) {
      injectRoot();
      bindShortcuts();
      bindStorageSync();
      render();
      if (state.timer.running) startTimer(true);
      scheduleAllReminders();
      if (state.settings.autoScanGrades) setTimeout(() => scanGrades({ deep: true, silent: true }), 1300);
    } else if (state.settings?.autoScanGrades !== false) {
      setTimeout(scanFrameGrades, 1600);
    }
    debouncedSave();
  }

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function escapeHtml(value = '') { return String(value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])); }
  function escapeAttr(value = '') { return escapeHtml(value); }
  function cssAttr(value = '') { return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"'); }
  function safeText(value = '', max = MAX.text) { return String(value || '').slice(0, max); }
  function uid(prefix='sp') { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`; }
  function fmtDate(value) { if (!value) return 'nog niet'; try { return new Date(value).toLocaleString('nl-BE', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }); } catch (_) { return 'onbekend'; } }
  function clamp(number, min, max) {
    const n = Number(String(number ?? '').replace(',', '.'));
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, n));
  }
  function toBoundedNumber(value, { min = 0, max = 100, fallback = min, integer = false } = {}) {
    const raw = String(value ?? '').replace(',', '.').trim();
    if (!raw || raw === '-' || raw === '.' || raw === ',') return fallback;
    const n = Number(raw);
    if (!Number.isFinite(n)) return fallback;
    const bounded = Math.min(max, Math.max(min, n));
    return integer ? Math.round(bounded) : bounded;
  }
  function getBreakMinutes() { return toBoundedNumber(state.focus?.breakMinutes, { min: 1, max: 60, fallback: 5, integer: true }); }
  function getTimerMinutes() { return toBoundedNumber(state.timer?.minutes, { min: 1, max: 180, fallback: 20, integer: true }); }
  function getTheme() { return state.theme === 'custom' ? customTheme() : (THEMES.find(t => t.id === state.theme) || THEMES[0]); }
  function activeFocusToolCount() {
    const keys = ['focusMode','reader','ruler','largeText','hideNotifications','night','contrast','dyslexia','lineSpace','calm','tableBoost','wide','spotlight','testMode'];
    return keys.filter(key => state.focus?.[key] === true).length;
  }

  async function loadState() {
    try {
      const keys = [STORAGE_KEY, ...OLD_KEYS];
      const result = await chrome.storage.local.get(keys);
      if (result[STORAGE_KEY]) return mergeDeep(DEFAULT_STATE, result[STORAGE_KEY]);
      for (const key of OLD_KEYS) if (result[key]) return mergeDeep(DEFAULT_STATE, result[key]);
    } catch (_) {}
    return clone(DEFAULT_STATE);
  }
  function mergeDeep(base, saved) {
    const out = clone(base);
    for (const [key, value] of Object.entries(saved || {})) {
      if (value && typeof value === 'object' && !Array.isArray(value) && out[key] && typeof out[key] === 'object' && !Array.isArray(out[key])) out[key] = mergeDeep(out[key], value);
      else out[key] = value;
    }
    return out;
  }
  function migrateAndCleanState() {
    state.version = VERSION;
    state.grades = Array.isArray(state.grades) ? state.grades.slice(0, MAX.grades) : [];
    state.gradeGoals = state.gradeGoals && typeof state.gradeGoals === 'object' ? state.gradeGoals : {};
    state.trendNotified = state.trendNotified && typeof state.trendNotified === 'object' ? state.trendNotified : {};
    state.focusStats = state.focusStats && typeof state.focusStats === 'object' ? state.focusStats : clone(DEFAULT_STATE.focusStats);
    state.gradeScan.log = Array.isArray(state.gradeScan.log) ? state.gradeScan.log.slice(-MAX.log) : [];
    state.reminders = Array.isArray(state.reminders) ? state.reminders.slice(0, MAX.reminders) : [];
    state.newReminder = state.newReminder && typeof state.newReminder === 'object' ? state.newReminder : clone(DEFAULT_STATE.newReminder);
    if (!Number.isFinite(Number(state.panelWidth))) state.panelWidth = 500;
    state.panelWidth = clamp(state.panelWidth, 430, 820);
    state.focus.breakMinutes = getBreakMinutes();
    state.timer.minutes = getTimerMinutes();
    if (!Number.isFinite(Number(state.timer.remaining))) state.timer.remaining = state.timer.minutes * 60;
    state.timer.sessionType = state.timer.sessionType === 'break' ? 'break' : 'focus';
    delete state.tasks; delete state.exams; delete state.cards; delete state.notes; delete state.pinnedLinks;
  }
  function debouncedSave() { clearTimeout(saveTimer); saveTimer = setTimeout(saveState, 180); }
  function snapshotState(value) { try { return JSON.stringify(value); } catch (_) { return ''; } }
  async function saveState() { try { lastSavedSnapshot = snapshotState(state); await chrome.storage.local.set({ [STORAGE_KEY]: state }); } catch (_) {} }
  function renderSave(options = {}) { if (isTopFrame) render({ preserve: options.preserve !== false }); debouncedSave(); }
  function logScan(message) {
    const entry = `${new Date().toLocaleTimeString('nl-BE', {hour:'2-digit', minute:'2-digit', second:'2-digit'})} · ${message}`;
    state.gradeScan.log = [...(state.gradeScan.log || []), entry].slice(-MAX.log);
  }

  function injectRoot() {
    root = document.createElement('div');
    root.id = 'smartplus-root';
    document.documentElement.appendChild(root);
    root.addEventListener('click', onRootClick);
    root.addEventListener('input', onRootInput);
    root.addEventListener('change', onRootChange);
    root.addEventListener('mousedown', onRootMouseDown);
    root.addEventListener('mouseover', onRootMouseOver);
    root.addEventListener('mouseout', onRootMouseOut);
  }

  function render(options = {}) {
    if (!root) return;
    const uiSnapshot = options.preserve === false ? null : capturePanelUi();
    applyTheme();
    const stats = gradeStats();
    const focusCount = activeFocusToolCount();
    const currentTheme = getTheme();
    root.style.setProperty('--sp-panel-width', `${state.panelWidth}px`);
    root.innerHTML = `
      <button class="sp-fab" data-action="toggle" title="SmartPlus openen"><span>SP</span>${state.gradeScan.found ? '<i class="sp-fab-dot"></i>' : ''}</button>
      <section class="sp-panel ${state.open ? '' : 'sp-hidden'}" aria-label="SmartPlus">
        <div class="sp-resize" data-action="resize" title="Sleep om groter of kleiner te maken"></div>
        <div class="sp-top">
          <div class="sp-head">
            <div class="sp-brand"><div class="sp-logo">SP</div><div><div class="sp-title">SmartPlus</div><div class="sp-sub">punten · focus · thema’s · berichten</div></div></div>
            <div class="sp-head-actions"><button class="sp-icon-btn" data-action="scan-grades" title="Punten opnieuw scannen">↻</button><button class="sp-icon-btn" data-action="toggle" title="Sluiten">×</button></div>
          </div>
          <div class="sp-status">
            <div class="sp-status-card"><b>${stats.averageLabel}</b><span>Punten</span></div>
            <div class="sp-status-card"><b>${focusCount}</b><span>Focus-tools actief</span></div>
            <div class="sp-status-card"><b>${escapeHtml(currentTheme.name)}</b><span>Thema</span></div>
          </div>
        </div>
        <nav class="sp-nav">
          ${tab('home','Start')}${tab('grades','Punten')}${tab('focus','Focus')}${tab('themes','Thema’s')}${tab('mail','Bericht')}${tab('reminders','Meldingen')}
        </nav>
        <div class="sp-body">${renderActive()}</div>
      </section>
      <div class="sp-toast-wrap" id="sp-toasts"></div>
    `;
    restorePanelUi(uiSnapshot);
  }

  function getPanelScroller() { return root?.querySelector('.sp-body') || root?.querySelector('.sp-panel'); }
  function capturePanelUi() {
    if (!root) return null;
    const scroller = getPanelScroller();
    const active = document.activeElement;
    const inside = !!(active && root.contains(active));
    const snapshot = { scrollTop: scroller?.scrollTop || 0, selector: '', start: null, end: null };
    if (inside && active.matches?.('input, textarea, select')) {
      if (active.dataset.field) snapshot.selector = `[data-field="${cssAttr(active.dataset.field)}"]`;
      else if (active.dataset.toggle) snapshot.selector = `[data-toggle="${cssAttr(active.dataset.toggle)}"]`;
      else if (active.dataset.gradeGoal) snapshot.selector = `[data-grade-goal="${cssAttr(active.dataset.gradeGoal)}"]`;
      else if (active.id) snapshot.selector = `#${cssAttr(active.id)}`;
      if ('selectionStart' in active) { snapshot.start = active.selectionStart; snapshot.end = active.selectionEnd; }
    }
    return snapshot;
  }
  function restorePanelUi(snapshot) {
    if (!snapshot || !root) return;
    const restore = () => {
      const scroller = getPanelScroller();
      if (scroller) scroller.scrollTop = snapshot.scrollTop || 0;
      if (!snapshot.selector) return;
      const el = root.querySelector(snapshot.selector);
      if (!el) return;
      try { el.focus({ preventScroll: true }); } catch (_) { try { el.focus(); } catch (_) {} }
      if (snapshot.start !== null && 'setSelectionRange' in el) {
        try { el.setSelectionRange(snapshot.start, snapshot.end ?? snapshot.start); } catch (_) {}
      }
      if (scroller) scroller.scrollTop = snapshot.scrollTop || 0;
    };
    restore();
    requestAnimationFrame(restore);
  }
  function tab(id, label) { return `<button class="sp-tab ${state.active === id ? 'sp-active' : ''}" data-action="tab" data-tab="${id}">${label}</button>`; }
  function renderActive() {
    if (state.active === 'grades') return renderGrades();
    if (state.active === 'focus') return renderFocus();
    if (state.active === 'themes') return renderThemes();
    if (state.active === 'mail') return renderMail();
    if (state.active === 'reminders') return renderReminders();
    return renderHome();
  }
  function renderHome() {
    const stats = gradeStats();
    const pending = upcomingReminders().length;
    return `<div class="sp-section">
      <div class="sp-hero">
        <button class="sp-btn sp-btn-primary" data-action="goto" data-tab="grades"><b>Punten automatisch zoeken</b><span>Scant Smartschool en toont trends, periodes en nieuwe punten.</span></button>
        <button class="sp-btn" data-action="goto" data-tab="focus"><b>Focus rustig maken</b><span>Profielen, leeslineaal, timer, nachtmodus en brede leesmodus.</span></button>
        <button class="sp-btn" data-action="goto" data-tab="themes"><b>Thema’s kiezen</b><span>Donker, neon, rustig, eigen kleuren en community-thema’s.</span></button>
        <button class="sp-btn" data-action="goto" data-tab="mail"><b>Bericht verbeteren</b><span>Netter, vriendelijker, professioneler of directer schrijven.</span></button>
        <button class="sp-btn" data-action="goto" data-tab="reminders"><b>Meldingen instellen</b><span>Herinneringen, nieuwe punten en timer klaar — volledig lokaal.</span></button>
      </div>
      <div class="sp-card">
        <h3>Nieuw in SmartPlus 2.7</h3>
        <div class="sp-pill-row"><span class="sp-pill">Geen scroll-jumps</span><span class="sp-pill">Betere timer</span><span class="sp-pill">Rustiger punten</span><span class="sp-pill">Mooier thema kiezen</span><span class="sp-pill">Stabieler</span></div>
        <p>Deze update maakt SmartPlus stabieler: inputs blijven op hun plaats, de timer is betrouwbaarder en punten/thema’s zijn rustiger en duidelijker.</p>
      </div>
      <div class="sp-card">
        <h3>Snelle status</h3>
        <p><strong>${escapeHtml(stats.averageLabel)}</strong> · ${escapeHtml(state.gradeScan.status || 'Nog niet gescand')} · ${fmtDate(state.gradeScan.lastAt)}</p>
        <p>${pending ? `${pending} komende herinnering(en).` : 'Geen komende herinneringen ingesteld.'}</p>
        <div class="sp-grid-2"><button class="sp-btn sp-btn-soft" data-action="scan-grades">Punten scannen</button><button class="sp-btn" data-action="goto" data-tab="reminders">Meldingen openen</button></div>
      </div>
    </div>`;
  }

  function renderReminders() {
    const items = [...(state.reminders || [])].sort((a,b) => String(a.at || '').localeCompare(String(b.at || '')));
    const upcoming = items.filter(item => !item.done && new Date(item.at).getTime() >= Date.now());
    const past = items.filter(item => item.done || new Date(item.at).getTime() < Date.now()).slice(-8);
    const rows = (list) => list.length ? `<table class="sp-table"><tbody>${list.map(item => `<tr><td><strong>${escapeHtml(item.title || 'Herinnering')}</strong><br><span style="color:var(--sp-muted)">${escapeHtml(item.note || '')}</span></td><td>${fmtDate(item.at)}</td><td><button class="sp-mini-btn" data-action="reminder-done" data-id="${escapeHtml(item.id)}">Klaar</button><button class="sp-mini-btn" data-action="reminder-remove" data-id="${escapeHtml(item.id)}">Weg</button></td></tr>`).join('')}</tbody></table>` : `<div class="sp-empty">Nog niets gepland.</div>`;
    return `<div class="sp-section">
      <div class="sp-card">
        <h3>Meldingen & herinneringen</h3>
        <p>SmartPlus kan lokale Chrome-meldingen tonen voor nieuwe punten, je focus-timer en eigen herinneringen. Er gaat niets naar een server.</p>
        ${notifToggle('enabled','Meldingen aan','Hoofdschakelaar voor SmartPlus-meldingen.')}
        ${notifToggle('newGrades','Nieuwe punten','Melding wanneer een scan nieuwe punten vindt.')}
        ${notifToggle('timerDone','Timer klaar','Melding wanneer je focus-timer klaar is.')}
        ${notifToggle('reminders','Herinneringen','Melding op het tijdstip dat jij instelt.')}
        ${notifToggle('quietHours','Stille uren','Geen meldingen tussen deze uren.')}
        <div class="sp-grid-2" style="margin-top:8px"><div><label class="sp-label">Stil vanaf</label><input class="sp-input" data-field="notifications.quietStart" value="${escapeHtml(state.notifications.quietStart || '22:00')}"></div><div><label class="sp-label">Stil tot</label><input class="sp-input" data-field="notifications.quietEnd" value="${escapeHtml(state.notifications.quietEnd || '07:00')}"></div></div>
        <div class="sp-grid-2" style="margin-top:10px"><button class="sp-btn" data-action="test-notification">Testmelding</button><button class="sp-btn" data-action="schedule-reminders">Herinneringen opnieuw plannen</button></div>
      </div>
      <div class="sp-card">
        <h3>Nieuwe herinnering</h3>
        <div class="sp-grid-2"><div><label class="sp-label">Titel</label><input class="sp-input" data-field="newReminder.title" value="${escapeHtml(state.newReminder.title || '')}" placeholder="bv. Wiskunde taak indienen"></div><div><label class="sp-label">Tijdstip</label><input class="sp-input" type="datetime-local" data-field="newReminder.at" value="${escapeHtml(state.newReminder.at || '')}"></div></div>
        <label class="sp-label" style="margin-top:9px">Notitie</label><textarea class="sp-textarea" data-field="newReminder.note" placeholder="Korte uitleg...">${escapeHtml(state.newReminder.note || '')}</textarea>
        <button class="sp-btn sp-btn-primary" data-action="add-reminder" style="margin-top:10px">Herinnering toevoegen</button>
      </div>
      <div class="sp-card"><h3>Komende herinneringen</h3>${rows(upcoming)}</div>
      <div class="sp-card"><h3>Recente afgewerkte/verlopen herinneringen</h3>${rows(past)}</div>
    </div>`;
  }
  function notifToggle(key, title, desc) { return `<div class="sp-toggle"><div><b>${title}</b><span>${desc}</span></div><input class="sp-switch" type="checkbox" data-toggle="notifications.${key}" ${state.notifications[key] ? 'checked' : ''}></div>`; }


  function renderGrades() {
    const allGrades = state.grades || [];
    const periods = gradePeriods(allGrades);
    const activePeriod = state.gradeScan.periodFilter || 'all';
    const visibleGrades = filterGradesByPeriod(allGrades, activePeriod);
    const stats = gradeStats(visibleGrades);
    const groups = Object.entries(stats.bySubject).sort((a,b) => b[1].average - a[1].average);
    const latest = [...visibleGrades].sort((a,b) => ((b.firstSeenAt || b.scannedAt || '')).localeCompare(a.firstSeenAt || a.scannedAt || '')).slice(0, 10);
    const periodOptions = [['all','Alle periodes'], ...periods].map(([value,label]) => `<option value="${escapeHtml(value)}" ${activePeriod === value ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('');
    return `<div class="sp-section">
      <div class="sp-card sp-feature-card">
        <h3>Punten automatisch scannen</h3>
        <p>SmartPlus zoekt je punten via je ingelogde Smartschool-pagina en toont ze rustiger per vak, periode en trend. Alles blijft lokaal in Chrome.</p>
        <div class="sp-grid-2">
          <button class="sp-btn sp-btn-primary" data-action="scan-grades">Scan nu</button>
          <button class="sp-btn" data-action="clear-grades">Punten wissen</button>
        </div>
        <div class="sp-pill-row" style="margin-top:10px"><span class="sp-pill">${escapeHtml(state.gradeScan.status)}</span><span class="sp-pill">${state.gradeScan.found || 0} lokaal</span><span class="sp-pill">${state.gradeScan.lastNew || 0} nieuw</span><span class="sp-pill">${state.gradeScan.pages || 0} bronnen</span></div>
        ${state.gradeScan.errorHint ? `<div class="sp-alert warn" style="margin-top:10px">${escapeHtml(state.gradeScan.errorHint)}</div>` : ''}
      </div>
      ${allGrades.length ? `
      <div class="sp-card">
        <div class="sp-grid-2">
          <div><h3>Rapportkaart</h3><p style="margin-top:-4px">Filter op periode, zet doelen per vak en bekijk trends.</p></div>
          <div><label class="sp-label">Periode</label><select class="sp-select" data-field="gradeScan.periodFilter">${periodOptions}</select></div>
        </div>
        <div class="sp-grid-3">
          <div class="sp-status-card ${gradeClass(stats.average)}"><b>${stats.averageLabel}</b><span>Gemiddelde</span></div>
          <div class="sp-status-card ok"><b>${escapeHtml(stats.best || '-')}</b><span>Sterkst</span></div>
          <div class="sp-status-card ${stats.weakAverage < 60 ? 'bad' : 'warn'}"><b>${escapeHtml(stats.weak || '-')}</b><span>Aandacht</span></div>
        </div>
      </div>
      <div class="sp-card">
        <h3>Visuele trend</h3>
        <p>De lijn toont je laatste punten in deze periode. Groen is sterk, oranje is opletten, rood vraagt extra oefening.</p>
        ${renderGradeSvgChart(visibleGrades)}
      </div>
      <div class="sp-card">
        <h3>Per vak + doel</h3>
        <table class="sp-table sp-grade-table"><thead><tr><th>Vak</th><th>Gem.</th><th>Doel</th><th>Voortgang</th><th>Trend</th></tr></thead><tbody>${groups.map(([subject, g]) => renderSubjectGoalRow(subject, g, visibleGrades)).join('')}</tbody></table>
      </div>
      <div class="sp-card">
        <h3>Periodevergelijking</h3>
        ${renderPeriodComparison(allGrades)}
      </div>
      <div class="sp-card">
        <h3>Laatste gevonden punten</h3>
        <table class="sp-table"><tbody>${latest.map(g => `<tr class="${g.isNew ? 'sp-new-row' : ''}"><td><strong>${escapeHtml(g.subject)}</strong> ${g.isNew ? '<span class="sp-new-badge">Nieuw</span>' : ''}<br><span style="color:var(--sp-muted)">${escapeHtml([g.period, g.title || g.sourceLabel || ''].filter(Boolean).join(' · '))}</span></td><td class="sp-grade ${gradeClass(g.percent)}">${formatGrade(g)}</td></tr>`).join('')}</tbody></table>
        <div class="sp-grid-2" style="margin-top:10px"><button class="sp-btn" data-action="export-grades">Export CSV</button><button class="sp-btn" data-action="mark-grades-seen">Nieuwe punten markeren als gezien</button></div>
      </div>
      <div class="sp-card">
        <h3>Wat-als calculator</h3>
        <p>Bereken wat je ongeveer nodig hebt op de resterende toetsen om je doel te halen.</p>
        <div class="sp-grid-4"><div><label class="sp-label">Nieuwe score</label><input class="sp-input" type="number" min="0" max="100" step="0.5" inputmode="decimal" data-field="calculator.newScore" value="${escapeAttr(state.calculator.newScore)}"></div><div><label class="sp-label">Op hoeveel</label><input class="sp-input" type="number" min="1" max="100" step="0.5" inputmode="decimal" data-field="calculator.newMax" value="${escapeAttr(state.calculator.newMax)}"></div><div><label class="sp-label">Doel %</label><input class="sp-input" type="number" min="0" max="100" step="1" inputmode="numeric" data-field="calculator.target" value="${escapeAttr(state.calculator.target)}"></div><div><label class="sp-label">Resterende toetsen</label><input class="sp-input" type="number" min="1" max="20" step="1" inputmode="numeric" data-field="calculator.remainingTests" value="${escapeAttr(state.calculator.remainingTests || '1')}"></div></div>
        <div class="sp-alert info" style="margin-top:10px">${renderWhatIf(stats, visibleGrades)}</div>
      </div>` : `
      <div class="sp-card"><div class="sp-empty"><strong>Nog geen punten gevonden.</strong><br>Druk op “Scan nu”. Als Smartschool geen toegang geeft, toont SmartPlus hier duidelijk waarom.</div></div>`}
      <div class="sp-card">
        <h3>Scan-status</h3>
        <div class="sp-toggle"><div><b>Automatisch scannen</b><span>Start vanzelf wanneer je Smartschool opent.</span></div><input class="sp-switch" type="checkbox" data-toggle="settings.autoScanGrades" ${state.settings.autoScanGrades ? 'checked' : ''}></div>
        <div class="sp-toggle"><div><b>Debug tonen</b><span>Toont extra details als punten niet gevonden worden.</span></div><input class="sp-switch" type="checkbox" data-toggle="settings.showDebug" ${state.settings.showDebug ? 'checked' : ''}></div>
        ${state.settings.showDebug ? `<div class="sp-debug">${escapeHtml((state.gradeScan.log || []).join('\n') || 'Nog geen debug-info.')}</div>` : ''}
      </div>
    </div>`;
  }

  function renderFocus() {
    const stats = focusStatsForDisplay();
    return `<div class="sp-section">
      <div class="sp-card">
        <h3>Focus-profielen</h3>
        <p>Kies één profiel en SmartPlus zet direct de juiste focus-tools aan.</p>
        <div class="sp-grid-2">
          <button class="sp-btn sp-btn-soft" data-action="focus-profile" data-profile="studeren">Studeren</button>
          <button class="sp-btn sp-btn-soft" data-action="focus-profile" data-profile="lezen">Lezen</button>
          <button class="sp-btn sp-btn-soft" data-action="focus-profile" data-profile="toets">Toets</button>
          <button class="sp-btn sp-btn-soft" data-action="focus-profile" data-profile="avond">Avond</button>
        </div>
        <div class="sp-alert info" style="margin-top:10px">Sneltoets: <b>Alt + F</b> zet Focusmodus aan/uit. <b>Alt + R</b> zet de leeslineaal aan/uit.</div>
      </div>
      <div class="sp-card">
        <h3>Focus tools</h3>
        <p>Rustige tools die direct op Smartschool werken.</p>
        ${focusToggle('focusMode','Focusmodus','Maakt menu’s en meldingen rustiger.')}
        ${focusToggle('ruler','Leeslineaal','Zet een lijn over de tekst zodat lezen makkelijker wordt.')}
        ${focusToggle('reader','Leesmodus','Grotere regelafstand en rustigere tekst.')}
        ${focusToggle('wide','Extra brede leesmodus','Maakt de hoofdinhoud breder en rustiger om te lezen.')}
        ${focusToggle('spotlight','Spotlight','Dimt de randen van het scherm zodat de middenzone meer opvalt.')}
        ${focusToggle('largeText','Grotere tekst','Maakt Smartschool beter leesbaar.')}
        ${focusToggle('hideNotifications','Meldingen verbergen','Zet meldingen en popups op de achtergrond.')}
        ${focusToggle('night','Nachtmodus','Donkere rustige kleuren voor ’s avonds.')}
        ${focusToggle('autoNight','Automatische nachtmodus','Zet nachtmodus automatisch aan op het uur hieronder.')}
        <div class="sp-grid-2" style="margin-top:8px"><div><label class="sp-label">Nacht start</label><input class="sp-input" data-field="focus.nightStart" value="${escapeHtml(state.focus.nightStart || '20:00')}"></div><div><label class="sp-label">Nacht einde</label><input class="sp-input" data-field="focus.nightEnd" value="${escapeHtml(state.focus.nightEnd || '07:00')}"></div></div>
        ${focusToggle('contrast','Meer contrast','Maakt tekst en tabellen scherper.')}
        ${focusToggle('dyslexia','Dyslexie-vriendelijk lettertype','Gebruikt simpele letters met extra spacing.')}
        ${focusToggle('lineSpace','Extra tekstafstand','Meer ademruimte tussen regels.')}
        ${focusToggle('calm','Rustige animaties','Zet drukke animaties bijna uit.')}
        ${focusToggle('tableBoost','Tabellen duidelijker','Maakt punten- en tabelweergaves leesbaarder.')}
      </div>
      <div class="sp-card">
        <h3>Toetsmodus</h3>
        <p>Zet ineens een rustige combinatie aan: focus, grotere tekst, meldingen weg, leeslineaal, tabelboost en timer.</p>
        <div class="sp-grid-2"><button class="sp-btn sp-btn-primary" data-action="test-mode">Toetsmodus aan/uit</button><button class="sp-btn" data-action="clean-print">Clean print</button></div>
      </div>
      <div class="sp-card">
        <h3>Focus timer</h3>
        <p>Timer met optionele Pomodoro-pauzes, zonder gamification.</p>
        <div class="sp-grid-3"><button class="sp-btn" data-action="timer-set" data-min="10">10 min</button><button class="sp-btn" data-action="timer-set" data-min="20">20 min</button><button class="sp-btn" data-action="timer-set" data-min="30">30 min</button></div>
        <div class="sp-grid-2" style="margin-top:10px"><div class="sp-toggle"><div><b>Pomodoro</b><span>Start automatisch een korte pauze na een focusblok.</span></div><input class="sp-switch" type="checkbox" data-toggle="focus.pomodoro" ${state.focus.pomodoro ? 'checked' : ''}></div><div class="sp-toggle"><div><b>Geluid</b><span>Kort lokaal geluid bij einde sessie.</span></div><input class="sp-switch" type="checkbox" data-toggle="focus.sound" ${state.focus.sound ? 'checked' : ''}></div></div>
        <div class="sp-grid-2" style="margin-top:8px"><div><label class="sp-label">Pauze minuten</label><input class="sp-input" type="number" min="1" max="60" step="1" inputmode="numeric" data-field="focus.breakMinutes" value="${escapeAttr(state.focus.breakMinutes || 5)}" aria-label="Pauzeduur in minuten"></div><div><label class="sp-label">Sessie</label><div id="sp-session-badge" class="sp-session-badge ${state.timer.sessionType === 'break' ? 'is-break' : 'is-focus'}">${state.timer.sessionType === 'break' ? 'Pauze' : 'Focus'}</div></div></div>
        <div id="sp-timer-display" class="sp-timer-display" aria-live="polite">${timerLabel()}</div>
        <div class="sp-grid-2"><button class="sp-btn sp-btn-primary" data-action="timer-start">Start / pauze</button><button class="sp-btn" data-action="timer-reset">Reset</button></div>
      </div>
      <div class="sp-card">
        <h3>Focus-statistieken</h3>
        <div class="sp-grid-3"><div class="sp-status-card"><b>${stats.today}</b><span>Vandaag</span></div><div class="sp-status-card"><b>${stats.week}</b><span>Deze week</span></div><div class="sp-status-card"><b>${stats.sessions}</b><span>Sessies</span></div></div>
      </div>
    </div>`;
  }

  function focusToggle(key, title, desc) { return `<div class="sp-toggle"><div><b>${title}</b><span>${desc}</span></div><input class="sp-switch" type="checkbox" data-toggle="focus.${key}" ${state.focus[key] ? 'checked' : ''}></div>`; }

  function renderThemes() {
    const calm = THEMES.filter(t => t.category === 'calm');
    const cool = THEMES.filter(t => t.category === 'cool');
    return `<div class="sp-section">
      <div class="sp-card">
        <h3>Thema’s</h3>
        <p>${THEMES.length} thema’s: rustige schoolthema’s, donkere thema’s en neon-thema’s. Beweeg over een thema voor live preview; klik om toe te passen.</p>
        <div class="sp-toggle"><div><b>Ook Smartschool kleuren</b><span>Past achtergrond, tekst en links licht aan.</span></div><input class="sp-switch" type="checkbox" data-toggle="themeOptions.applyToSmartschool" ${state.themeOptions.applyToSmartschool ? 'checked' : ''}></div>
        <div class="sp-toggle"><div><b>Zachte animaties + live preview</b><span>Hover-effecten, thema-overgangen en tijdelijke preview.</span></div><input class="sp-switch" type="checkbox" data-toggle="themeOptions.animations" ${state.themeOptions.animations ? 'checked' : ''}></div>
        <div class="sp-grid-2" style="margin-top:10px"><button class="sp-btn sp-btn-soft" data-action="suggest-theme">Suggestie voor nu</button><button class="sp-btn" data-action="preview-theme" data-theme="${escapeHtml(suggestedTheme().id)}">Preview seizoenthema</button></div>
        ${state.themeOptions.previewTheme ? `<div class="sp-alert info" style="margin-top:10px">Live preview: ${escapeHtml((THEMES.find(t => t.id === state.themeOptions.previewTheme) || {}).name || '')}</div>` : ''}
      </div>
      <div class="sp-card"><h3>Rustige clean thema’s</h3><div class="sp-theme-grid">${calm.map(renderThemeTile).join('')}</div></div>
      <div class="sp-card"><h3>Coole thema’s</h3><div class="sp-theme-grid">${cool.map(renderThemeTile).join('')}</div></div>
      <div class="sp-card">
        <h3>Eigen thema</h3>
        <div class="sp-grid-2"><div><label class="sp-label">Accentkleur</label><input class="sp-input" type="color" data-field="custom.accent" value="${escapeHtml(state.custom.accent)}"></div><div><label class="sp-label">Tweede kleur</label><input class="sp-input" type="color" data-field="custom.accent2" value="${escapeHtml(state.custom.accent2)}"></div></div>
        <div class="sp-grid-2" style="margin-top:10px"><div><label class="sp-label">Achtergrond</label><input class="sp-input" type="color" data-field="custom.bg" value="${escapeHtml(state.custom.bg || '#f6f7fb')}"></div><div><label class="sp-label">Tekst</label><input class="sp-input" type="color" data-field="custom.text" value="${escapeHtml(state.custom.text || '#172033')}"></div></div>
        <div style="margin-top:10px"><label class="sp-label">Eigen achtergrondafbeelding</label><input class="sp-input" type="file" id="sp-bg-file" accept="image/*"></div>
        <div class="sp-grid-2" style="margin-top:10px"><button class="sp-btn sp-btn-soft" data-action="use-custom-theme">Gebruik eigen kleuren</button><button class="sp-btn" data-action="clear-bg">Achtergrond wissen</button></div>
      </div>
      <div class="sp-card">
        <h3>Community thema’s</h3>
        <p>Exporteer je thema of plak een JSON-thema uit Discord.</p>
        <textarea class="sp-textarea" data-field="themeImport" placeholder='Plak hier een SmartPlus thema JSON...'>${escapeHtml(state.themeImport || '')}</textarea>
        <div class="sp-grid-2" style="margin-top:10px"><button class="sp-btn" data-action="export-theme">Thema exporteren</button><button class="sp-btn sp-btn-primary" data-action="import-theme">Thema importeren</button></div>
      </div>
      <div class="sp-card">
        <h3>Thema per vak</h3>
        <p>Optioneel: zet regels zoals <b>wiskunde=neon-blue</b>. Als SmartPlus dat vak op de pagina ziet, past hij dat thema toe.</p>
        <textarea class="sp-textarea" data-field="themeOptions.subjectThemesText" placeholder="wiskunde=neon-blue\nfrans=lavender">${escapeHtml(state.themeOptions.subjectThemesText || '')}</textarea>
      </div>
    </div>`;
  }
  function renderThemeTile(theme) {
    return `<button class="sp-theme-tile ${state.theme === theme.id ? 'sp-selected' : ''} ${state.themeOptions.previewTheme === theme.id ? 'sp-previewing' : ''}" data-action="theme" data-theme="${theme.id}"><div class="sp-swatch"><i style="background:${theme.accent}"></i><i style="background:${theme.accent2}"></i><i style="background:${theme.bg}"></i></div><div class="sp-theme-name">${escapeHtml(theme.name)}</div><small>${theme.category === 'cool' ? 'cool' : 'rustig'}</small></button>`;
  }

  function renderMail() {
    const score = scoreMail(state.mail.output || state.mail.draft);
    const warning = toneWarning(state.mail.output || state.mail.draft);
    const shortVersion = state.mail.shortOutput || shortenMail(state.mail.output || state.mail.draft || '');
    const longVersion = state.mail.longOutput || expandMail(state.mail.output || state.mail.draft || '');
    return `<div class="sp-section">
      <div class="sp-card">
        <h3>Bericht beter maken</h3>
        <p>SmartPlus gebruikt lokale regels en templates om je bericht duidelijker, beleefder of korter te maken. Geen AI en geen server.</p>
        <textarea class="sp-textarea" data-field="mail.draft" placeholder="Typ hier je ruwe bericht...">${escapeHtml(state.mail.draft)}</textarea>
        <div class="sp-grid-2" style="margin-top:9px"><button class="sp-btn sp-btn-primary" data-action="mail-polish">Netter maken</button><button class="sp-btn" data-action="mail-formal">Formeler</button><button class="sp-btn" data-action="mail-short">Korter</button><button class="sp-btn" data-action="mail-child">Minder kinderachtig</button><button class="sp-btn" data-action="mail-question">Duidelijke vraag</button><button class="sp-btn" data-action="mail-apology">Excuses</button><button class="sp-btn" data-action="mail-friendly">Vriendelijker</button><button class="sp-btn" data-action="mail-professional">Professioneler</button><button class="sp-btn" data-action="mail-direct">Directer</button></div>
      </div>
      <div class="sp-card">
        <h3>Templates</h3>
        <select class="sp-select" data-field="mail.template">${TEMPLATES.map(t => `<option value="${t.id}" ${state.mail.template === t.id ? 'selected' : ''}>${escapeHtml(t.label)}</option>`).join('')}</select>
        <div class="sp-grid-2" style="margin-top:9px"><button class="sp-btn sp-btn-soft" data-action="mail-template">Template gebruiken</button><button class="sp-btn" data-action="mail-subject">Onderwerp maken</button></div>
      </div>
      <div class="sp-card">
        <h3>Resultaat</h3>
        <div class="sp-scorebar" title="Berichtscore"><span style="width:${score.score}%"></span></div>
        <p><strong>Score ${score.score}/100</strong> · ${escapeHtml(score.message)}</p>
        ${warning ? `<div class="sp-alert warn">${escapeHtml(warning)} Lees nog even na voor je verzendt.</div>` : '<div class="sp-alert ok">Toon klinkt goed genoeg om te gebruiken.</div>'}
        <input class="sp-input" data-field="mail.subject" value="${escapeHtml(state.mail.subject)}" placeholder="Onderwerp">
        <textarea class="sp-textarea" data-field="mail.output" style="margin-top:9px">${escapeHtml(state.mail.output)}</textarea>
        <div class="sp-grid-2" style="margin-top:9px"><button class="sp-btn sp-btn-primary" data-action="mail-insert">Plaats in Smartschool</button><button class="sp-btn" data-action="mail-copy">Kopieer</button></div>
      </div>
      <div class="sp-card">
        <h3>Korte of uitgebreide versie</h3>
        <p>Kies zelf wat het best past: kort en duidelijk, of iets vollediger met extra context.</p>
        <div class="sp-variant"><b>Kort</b><p>${escapeHtml(shortVersion || 'Maak eerst een bericht.')}</p><button class="sp-mini-btn" data-action="mail-use-short">Gebruik kort</button></div>
        <div class="sp-variant"><b>Uitgebreid</b><p>${escapeHtml(longVersion || 'Maak eerst een bericht.')}</p><button class="sp-mini-btn" data-action="mail-use-long">Gebruik uitgebreid</button></div>
      </div>
    </div>`;
  }

  function onRootClick(event) {
    const el = event.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    if (action === 'toggle') { state.open = !state.open; renderSave(); return; }
    if (action === 'tab' || action === 'goto') { state.active = el.dataset.tab || 'home'; state.open = true; renderSave({ preserve: false }); return; }
    if (action === 'scan-grades') { scanGrades({ deep: true, silent: false }); return; }
    if (action === 'clear-grades') { state.grades = []; state.gradeScan.status = 'Punten gewist'; state.gradeScan.found = 0; logScan('Punten lokaal gewist.'); renderSave(); return; }
    if (action === 'export-grades') { exportGrades(); return; }
    if (action === 'mark-grades-seen') { state.grades = (state.grades || []).map(g => ({ ...g, isNew: false })); state.gradeScan.lastNew = 0; renderSave(); toast('Nieuwe punten gemarkeerd als gezien'); return; }
    if (action === 'add-reminder') { addReminder(); return; }
    if (action === 'reminder-remove') { removeReminder(el.dataset.id); return; }
    if (action === 'reminder-done') { markReminderDone(el.dataset.id); return; }
    if (action === 'schedule-reminders') { scheduleAllReminders(); toast('Herinneringen opnieuw gepland'); return; }
    if (action === 'test-notification') { notifySmartPlus('SmartPlus testmelding', 'Meldingen werken. Je gegevens blijven lokaal.', 'general'); return; }
    if (action === 'theme') { state.theme = el.dataset.theme; state.themeOptions.previewTheme = ''; applyTheme(); renderSave(); toast('Thema toegepast'); return; }
    if (action === 'suggest-theme') { const t = suggestedTheme(); state.theme = t.id; state.themeOptions.previewTheme = ''; applyTheme(); renderSave(); toast(`Suggestie toegepast: ${t.name}`); return; }
    if (action === 'preview-theme') { state.themeOptions.previewTheme = el.dataset.theme || ''; applyTheme(); renderSave(); toast('Voorbeeld actief'); return; }
    if (action === 'use-custom-theme') { state.theme = 'custom'; applyTheme(); renderSave(); toast('Eigen thema toegepast'); return; }
    if (action === 'clear-bg') { state.custom.backgroundImage = ''; applyTheme(); renderSave(); return; }
    if (action === 'export-theme') { exportTheme(); return; }
    if (action === 'import-theme') { importTheme(); return; }
    if (action === 'focus-profile') { applyFocusProfile(el.dataset.profile || 'studeren'); return; }
    if (action === 'test-mode') { toggleTestMode(); return; }
    if (action === 'clean-print') { document.body.classList.add('sp-clean-print'); window.print(); setTimeout(() => document.body.classList.remove('sp-clean-print'), 1200); return; }
    if (action === 'timer-set') { setTimer(Number(el.dataset.min || 20)); return; }
    if (action === 'timer-start') { startTimer(false); return; }
    if (action === 'timer-reset') { resetTimer(); return; }
    if (action.startsWith('mail-')) { handleMailAction(action); return; }
  }

  function onRootInput(event) {
    const goalSubject = event.target.dataset.gradeGoal;
    if (goalSubject) {
      state.gradeGoals ||= {};
      state.gradeGoals[goalSubject] = event.target.value;
      updateGoalRow(event.target, goalSubject);
      debouncedSave();
      return;
    }
    const field = event.target.dataset.field;
    if (!field) return;
    setPath(state, field, event.target.value);
    if (field.startsWith('custom.')) { if (state.theme === 'custom') applyTheme(); }
    if (field.startsWith('focus.') && field !== 'focus.breakMinutes') applyFocusModes();
    if (field.startsWith('themeOptions.')) applyTheme();
    if (field.startsWith('mail.')) {
      if (field === 'mail.draft' && !state.mail.output) state.mail.output = state.mail.draft;
      updateMailVariants();
      state.mail.score = scoreMail(state.mail.output || state.mail.draft).score;
    }
    debouncedSave();
  }
  function onRootChange(event) {
    const toggle = event.target.dataset.toggle;
    if (toggle) {
      setPath(state, toggle, !!event.target.checked);
      if (toggle.startsWith('focus.')) applyFocusModes();
      if (toggle.startsWith('themeOptions.') || toggle.startsWith('custom.')) applyTheme();
      renderSave();
      return;
    }
    const goalSubject = event.target.dataset.gradeGoal;
    if (goalSubject) {
      state.gradeGoals ||= {};
      const value = toBoundedNumber(event.target.value, { min: 0, max: 100, fallback: 70, integer: true });
      state.gradeGoals[goalSubject] = value;
      event.target.value = String(value);
      renderSave();
      return;
    }
    const field = event.target.dataset.field;
    if (field) {
      const value = normalizeFieldValue(field, event.target.value);
      setPath(state, field, value);
      if (String(event.target.value) !== String(value) && event.target.type !== 'color') event.target.value = value;
      if (field.startsWith('focus.')) applyFocusModes();
      if (field.startsWith('themeOptions.') || field.startsWith('custom.')) applyTheme();
      if (field === 'gradeScan.periodFilter' || field.startsWith('calculator.') || field.startsWith('notifications.')) renderSave();
      else debouncedSave();
      return;
    }
    if (event.target.id === 'sp-bg-file') handleBackgroundUpload(event.target.files?.[0]);
  }
  function normalizeFieldValue(field, value) {
    const specs = {
      'focus.breakMinutes': { min: 1, max: 60, fallback: 5, integer: true },
      'calculator.newScore': { min: 0, max: 100, fallback: 0, integer: false },
      'calculator.newMax': { min: 1, max: 100, fallback: 20, integer: false },
      'calculator.target': { min: 0, max: 100, fallback: 70, integer: true },
      'calculator.remainingTests': { min: 1, max: 20, fallback: 1, integer: true }
    };
    const spec = specs[field];
    if (!spec) return value;
    return String(toBoundedNumber(value, spec));
  }
  function updateGoalRow(input, subject) {
    const row = input.closest('tr');
    if (!row) return;
    const avgText = row.querySelector('.sp-grade')?.textContent || '';
    const average = Number((avgText.match(/-?\d+(?:[,.]\d+)?/) || [''])[0].replace(',', '.'));
    const goal = toBoundedNumber(input.value, { min: 0, max: 100, fallback: 70, integer: true });
    const cells = row.querySelectorAll('td');
    if (Number.isFinite(average) && cells[3]) cells[3].innerHTML = renderGoalProgress(average, goal);
  }
  function onRootMouseDown(event) {
    if (!event.target.closest('.sp-resize')) return;
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = Number(state.panelWidth || 500);
    const move = (e) => {
      const delta = startX - e.clientX;
      state.panelWidth = clamp(startWidth + delta, 430, Math.min(820, window.innerWidth - 44));
      root?.style.setProperty('--sp-panel-width', `${state.panelWidth}px`);
    };
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); debouncedSave(); };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }
  function onRootMouseOver(event) {
    const tile = event.target.closest?.('.sp-theme-tile[data-theme]');
    if (!tile || !state.themeOptions.animations) return;
    const id = tile.dataset.theme || '';
    if (lastThemePreviewId === id) return;
    lastThemePreviewId = id;
    state.themeOptions.previewTheme = id;
    applyTheme();
  }
  function onRootMouseOut(event) {
    const tile = event.target.closest?.('.sp-theme-tile[data-theme]');
    if (!tile || !state.themeOptions.animations) return;
    lastThemePreviewId = '';
    state.themeOptions.previewTheme = '';
    applyTheme();
  }
  function setPath(obj, path, value) {
    const parts = String(path || '').split('.').filter(Boolean);
    if (!parts.length || !obj || typeof obj !== 'object') return;
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      if (!current[key] || typeof current[key] !== 'object' || Array.isArray(current[key])) current[key] = {};
      current = current[key];
    }
    current[parts[parts.length - 1]] = value;
  }

  function bindShortcuts() {
    document.addEventListener('keydown', event => {
      if (event.key === ':' && !isEditable(document.activeElement)) { event.preventDefault(); state.open = true; state.active = 'home'; renderSave(); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !isEditable(document.activeElement)) { event.preventDefault(); state.open = true; state.active = 'home'; renderSave(); }
      if (event.altKey && event.key.toLowerCase() === 'f') { event.preventDefault(); state.focus.focusMode = !state.focus.focusMode; applyFocusModes(); renderSave(); toast(state.focus.focusMode ? 'Focusmodus aan' : 'Focusmodus uit'); }
      if (event.altKey && event.key.toLowerCase() === 'r') { event.preventDefault(); state.focus.ruler = !state.focus.ruler; applyFocusModes(); renderSave(); toast(state.focus.ruler ? 'Leeslineaal aan' : 'Leeslineaal uit'); }
    });
  }
  function bindStorageSync() {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !changes[STORAGE_KEY]) return;
      const incoming = changes[STORAGE_KEY].newValue;
      if (!incoming) return;
      const incomingSnapshot = snapshotState(incoming);
      if (incomingSnapshot && (incomingSnapshot === lastSavedSnapshot || incomingSnapshot === snapshotState(state))) return;
      const wasOpen = state.open;
      state = mergeDeep(DEFAULT_STATE, incoming);
      state.open = wasOpen;
      migrateAndCleanState();
      applyTheme(); applyFocusModes(); render();
    });
  }
  function bindRuntimeMessages() {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (!message?.type) return false;
      if (message.type === 'sp-mail-polish') applyContextMail('polish', message.text);
      if (message.type === 'sp-mail-formal') applyContextMail('formal', message.text);
      if (message.type === 'sp-mail-short') applyContextMail('short', message.text);
      if (message.type === 'sp-mail-friendly') applyContextMail('friendly', message.text);
      if (message.type === 'sp-mail-professional') applyContextMail('professional', message.text);
      if (message.type === 'sp-mail-direct') applyContextMail('direct', message.text);
      if (message.type === 'sp-mail-subject') {
        const subject = makeSubject(message.text || getEditorText(activeEditor) || state.mail.output || state.mail.draft);
        copyText(subject); toast('Onderwerp gekopieerd');
      }
      sendResponse?.({ ok: true });
      return false;
    });
  }

  function bindEditorCoach() {
    document.addEventListener('focusin', event => {
      if (!state.settings?.autoMailCoach && isTopFrame) return;
      const editor = findEditor(event.target);
      if (!editor) return;
      activeEditor = editor;
      showCoach(editor);
    }, true);
    document.addEventListener('input', event => {
      const editor = findEditor(event.target);
      if (editor && coach) updateCoachScore(editor);
    }, true);
    document.addEventListener('click', event => {
      const actionEl = event.target.closest?.('[data-sp-coach]');
      if (!actionEl) return;
      event.preventDefault();
      handleCoachAction(actionEl.dataset.spCoach);
    }, true);
  }
  function findEditor(target) {
    const el = target?.closest?.('textarea,input,[contenteditable="true"],[contenteditable="plaintext-only"]');
    if (!el) return null;
    if (!isEditable(el)) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width < 180 || rect.height < 25) return null;
    const hint = `${el.name || ''} ${el.id || ''} ${el.getAttribute('aria-label') || ''} ${el.placeholder || ''} ${el.className || ''}`.toLowerCase();
    if (el.tagName === 'INPUT' && !/(bericht|message|body|inhoud|content|antwoord|reply)/.test(hint)) return null;
    return el;
  }
  function isEditable(el) {
    if (!el) return false;
    if (el.isContentEditable) return true;
    const tag = el.tagName;
    if (tag === 'TEXTAREA') return true;
    if (tag === 'INPUT') {
      const type = (el.type || 'text').toLowerCase();
      return ['text','search','email','url'].includes(type);
    }
    return false;
  }
  function showCoach(editor) {
    if (!state.settings.autoMailCoach) return;
    if (!coach) {
      coach = document.createElement('div');
      coach.className = 'sp-mailcoach';
      document.documentElement.appendChild(coach);
    }
    const rect = editor.getBoundingClientRect();
    const left = Math.max(8, Math.min(window.innerWidth - 330, rect.right + window.scrollX - 310));
    const top = rect.bottom + window.scrollY + 8;
    coach.style.left = `${left}px`;
    coach.style.top = `${top}px`;
    coach.innerHTML = `<div class="sp-mailcoach-box"><div class="sp-mailcoach-head"><b>SmartPlus Berichtcoach</b><button data-sp-coach="close">×</button></div><div class="sp-mailcoach-body"><div class="sp-mailcoach-score"><span>Score</span><strong>${scoreMail(getEditorText(editor)).score}/100</strong></div><div class="sp-mailcoach-grid"><button data-sp-coach="polish">Netter</button><button data-sp-coach="formal">Formeler</button><button data-sp-coach="short">Korter</button><button data-sp-coach="child">Minder kinderachtig</button><button data-sp-coach="question">Duidelijke vraag</button><button data-sp-coach="apology">Excuses</button><button data-sp-coach="thanks">Dankjewel</button><button data-sp-coach="friendly">Vriendelijker</button><button data-sp-coach="professional">Professioneler</button><button data-sp-coach="direct">Directer</button><button data-sp-coach="subject">Onderwerp</button></div></div></div>`;
  }
  function updateCoachScore(editor) {
    const score = coach?.querySelector('.sp-mailcoach-score strong');
    if (score) score.textContent = `${scoreMail(getEditorText(editor)).score}/100`;
  }
  function handleCoachAction(action) {
    if (action === 'close') { coach?.remove(); coach = null; return; }
    if (!activeEditor) return;
    let text = getEditorText(activeEditor);
    if (!text.trim() && state.mail.output) text = state.mail.output;
    let result = text;
    if (action === 'polish') result = polishMail(text, 'polish');
    if (action === 'formal') result = polishMail(text, 'formal');
    if (action === 'short') result = shortenMail(polishMail(text, 'polish'));
    if (action === 'child') result = polishMail(text, 'mature');
    if (action === 'question') result = ensureQuestion(polishMail(text, 'polish'));
    if (action === 'apology') result = addApology(polishMail(text, 'polish'));
    if (action === 'thanks') result = addThanks(polishMail(text, 'polish'));
    if (action === 'friendly') result = polishMail(text, 'friendly');
    if (action === 'professional') result = polishMail(text, 'professional');
    if (action === 'direct') result = makeDirect(polishMail(text, 'polish'));
    if (action === 'subject') { fillSubject(makeSubject(text)); toast('Onderwerp gemaakt'); return; }
    setEditorText(activeEditor, result);
    state.mail.output = result;
    state.mail.score = scoreMail(result).score;
    updateCoachScore(activeEditor);
    debouncedSave();
    toast('Bericht verbeterd');
  }
  function applyContextMail(mode, text) {
    const editor = activeEditor || findEditor(document.activeElement);
    const base = text || getEditorText(editor) || state.mail.draft;
    let out = base;
    if (mode === 'polish') out = polishMail(base, 'polish');
    if (mode === 'formal') out = polishMail(base, 'formal');
    if (mode === 'short') out = shortenMail(polishMail(base, 'polish'));
    if (mode === 'friendly') out = polishMail(base, 'friendly');
    if (mode === 'professional') out = polishMail(base, 'professional');
    if (mode === 'direct') out = makeDirect(polishMail(base, 'polish'));
    if (editor) setEditorText(editor, out); else copyText(out);
    toast('Bericht aangepast');
  }
  function getEditorText(editor) {
    if (!editor) return '';
    if (editor.isContentEditable) return editor.innerText || editor.textContent || '';
    return editor.value || '';
  }
  function setEditorText(editor, text) {
    if (!editor) return;
    if (editor.isContentEditable) {
      editor.focus(); editor.innerText = text; editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
    } else {
      editor.focus(); editor.value = text; editor.dispatchEvent(new Event('input', { bubbles: true })); editor.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function handleMailAction(action) {
    const draft = state.mail.draft || state.mail.output || getEditorText(activeEditor) || '';
    if (action === 'mail-polish') state.mail.output = polishMail(draft, 'polish');
    if (action === 'mail-formal') state.mail.output = polishMail(draft, 'formal');
    if (action === 'mail-short') state.mail.output = shortenMail(polishMail(draft, 'polish'));
    if (action === 'mail-child') state.mail.output = polishMail(draft, 'mature');
    if (action === 'mail-question') state.mail.output = ensureQuestion(polishMail(draft, 'polish'));
    if (action === 'mail-apology') state.mail.output = addApology(polishMail(draft, 'polish'));
    if (action === 'mail-friendly') state.mail.output = polishMail(draft, 'friendly');
    if (action === 'mail-professional') state.mail.output = polishMail(draft, 'professional');
    if (action === 'mail-direct') state.mail.output = makeDirect(polishMail(draft, 'polish'));
    if (action === 'mail-template') {
      const tpl = TEMPLATES.find(t => t.id === state.mail.template) || TEMPLATES[0];
      state.mail.output = tpl.body.replaceAll('{naam}', 'meneer/mevrouw').replaceAll('{vak}', detectLikelySubject() || 'het vak').replaceAll('{leerling}', '').trim();
      state.mail.subject = tpl.subject.replaceAll('{vak}', detectLikelySubject() || 'het vak');
    }
    if (action === 'mail-subject') state.mail.subject = makeSubject(state.mail.output || draft);
    if (action === 'mail-use-short') state.mail.output = state.mail.shortOutput || shortenMail(state.mail.output || draft);
    if (action === 'mail-use-long') state.mail.output = state.mail.longOutput || expandMail(state.mail.output || draft);
    if (action === 'mail-insert') {
      const text = state.mail.output || draft;
      if (toneWarning(text) && !confirm('SmartPlus ziet dat dit bericht mogelijk nog wat bot of onduidelijk klinkt. Toch plaatsen?')) return;
      if (activeEditor) setEditorText(activeEditor, text); else copyText(text);
      if (state.mail.subject) fillSubject(state.mail.subject);
      toast(activeEditor ? 'In Smartschool geplaatst' : 'Gekopieerd');
    }
    if (action === 'mail-copy') { copyText(`${state.mail.subject ? `Onderwerp: ${state.mail.subject}\n\n` : ''}${state.mail.output || draft}`); toast('Gekopieerd'); }
    updateMailVariants();
    state.mail.score = scoreMail(state.mail.output || state.mail.draft).score;
    renderSave();
  }

  function polishMail(input, mode = 'polish') {
    let text = removeEmoji(safeText(input)).trim();
    for (const [pattern, replacement] of REPLACEMENTS) text = text.replace(pattern, replacement);
    text = normalizeSentences(text);
    if (!/^\s*(beste|geachte|dag|hallo)\b/i.test(text)) text = `Beste meneer/mevrouw,\n\n${text}`;
    if (mode === 'formal' || mode === 'professional') text = text.replace(/\bje\b/gi, 'u').replace(/\bjouw\b/gi, 'uw').replace(/\bgraag\b/gi, 'graag');
    if (mode === 'friendly') text = text.replace(/Beste meneer\/mevrouw,/, 'Hallo,').replace(/Met vriendelijke groeten,/, 'Vriendelijke groeten,');
    if (mode === 'professional') text = text.replace(/Hallo,/, 'Geachte meneer/mevrouw,').replace(/Beste meneer\/mevrouw,/, 'Geachte meneer/mevrouw,');
    if (mode === 'mature') text = text.replace(/\bmega\b|\bsuper\b|\becht\b|\bheel hard\b/gi, '').replace(/!+/g, '.');
    if (!/(alvast bedankt|bedankt|dank u|dankjewel)/i.test(text)) text += '\n\nAlvast bedankt.';
    if (!/(met vriendelijke groeten|vriendelijke groeten|groeten)/i.test(text)) text += '\n\nMet vriendelijke groeten,';
    return cleanupMail(text);
  }
  function normalizeSentences(text) {
    text = text.replace(/\s+/g, ' ').replace(/\s+([,.!?])/g, '$1').trim();
    if (text && !/[.!?]$/.test(text)) text += '.';
    return text.replace(/([.!?])\s+/g, '$1\n');
  }
  function cleanupMail(text) {
    return text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').replace(/\s+\n/g, '\n').trim();
  }
  function removeEmoji(text) {
    return text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '');
  }
  function shortenMail(text) {
    const lines = cleanupMail(text).split('\n').map(x => x.trim()).filter(Boolean);
    const keep = [];
    for (const line of lines) {
      if (/^(beste|geachte|dag|hallo|alvast bedankt|met vriendelijke groeten)/i.test(line) || /\?/.test(line) || /(kunt u|zou u|graag|vraag|deadline|opdracht|toets|taak)/i.test(line)) keep.push(line);
    }
    return cleanupMail((keep.length ? keep : lines.slice(0, 5)).join('\n\n'));
  }
  function makeDirect(text) {
    let value = cleanupMail(text || '');
    value = value
      .replace(/Ik zou graag willen vragen of u eventueel/gi, 'Kunt u')
      .replace(/Ik zou graag willen vragen of u/gi, 'Kunt u')
      .replace(/Zou het mogelijk zijn om/gi, 'Kunt u')
      .replace(/Indien mogelijk,? zou ik graag/gi, 'Graag')
      .replace(/Ik vroeg mij af of/gi, 'Kunt u')
      .replace(/misschien|eventueel|eigenlijk|een beetje|als het kan/gi, '')
      .replace(/\s{2,}/g, ' ');
    const parts = value.split(/\n{2,}/).map(x => x.trim()).filter(Boolean);
    const greeting = parts.find(x => /^(beste|geachte|dag|hallo)/i.test(x)) || 'Beste meneer/mevrouw,';
    const thanks = parts.find(x => /(alvast bedankt|bedankt|dank u)/i.test(x)) || 'Alvast bedankt.';
    const closing = parts.find(x => /(met vriendelijke groeten|vriendelijke groeten|groeten)/i.test(x)) || 'Met vriendelijke groeten,';
    const body = parts.filter(x => ![greeting, thanks, closing].includes(x) && !/(alvast bedankt|bedankt|dank u|met vriendelijke groeten|vriendelijke groeten|groeten)/i.test(x)).join(' ');
    const sentences = body.split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(Boolean);
    const important = sentences.filter(x => /\?|kunt u|deadline|opdracht|toets|taak|punt|resultaat|vraag|uitleg|indienen/i.test(x));
    const compactBody = (important.length ? important : sentences.slice(0, 2)).join(' ');
    return cleanupMail([greeting, compactBody || body || 'Kunt u mij hiermee helpen?', thanks, closing].join('\n\n'));
  }
  function expandMail(text) {
    const base = polishMail(text, 'polish');
    let out = base;
    if (!/wat er precies verwacht wordt|wat ik best doe|welke volgende stap/i.test(out)) {
      out = out.replace(/(Alvast bedankt\.)/i, 'Kunt u mij laten weten wat er precies verwacht wordt en wat ik best als volgende stap doe?\n\n$1');
    }
    return cleanupMail(out);
  }
  function toneWarning(text) {
    const value = String(text || '').toLowerCase();
    const hits = [];
    if (/\b(wtf|fuck|shit|dom|belachelijk|saai|stom)\b/i.test(value)) hits.push('ruwe woorden');
    if (/\bnu\b|\bsnel\b|\bmoet\b/i.test(value) && !/(alstublieft|kunt u|zou u|graag)/i.test(value)) hits.push('klinkt nogal dwingend');
    if (String(text || '').length < 30) hits.push('erg kort');
    if (!/^(beste|geachte|dag|hallo)/i.test(String(text || '').trim())) hits.push('geen begroeting');
    return hits.length ? `Let op: ${hits.slice(0, 2).join(', ')}.` : '';
  }
  function updateMailVariants() {
    const base = state.mail.output || state.mail.draft || '';
    state.mail.shortOutput = shortenMail(base);
    state.mail.longOutput = expandMail(base);
  }
  function ensureQuestion(text) {
    if (/\?/.test(text)) return text;
    return cleanupMail(text.replace(/(Alvast bedankt\.)/i, 'Kunt u mij laten weten wat ik precies moet doen?\n\n$1'));
  }
  function addApology(text) {
    if (/excuses|sorry/i.test(text)) return text;
    return cleanupMail(text.replace(/\n\n/, '\n\nMijn excuses voor de verwarring. '));
  }
  function addThanks(text) {
    if (/alvast bedankt|bedankt/i.test(text)) return text;
    return cleanupMail(`${text}\n\nAlvast bedankt voor uw hulp.`);
  }
  function scoreMail(text) {
    const value = String(text || '').trim();
    let score = 30;
    const tips = [];
    if (/^(beste|geachte|dag|hallo)/i.test(value)) score += 15; else tips.push('begroeting ontbreekt');
    if (/(kunt u|zou u|graag|vraag|laten weten|alstublieft)/i.test(value)) score += 20; else tips.push('vraag mag duidelijker');
    if (/(alvast bedankt|bedankt|dank u)/i.test(value)) score += 15; else tips.push('bedanking ontbreekt');
    if (/(met vriendelijke groeten|vriendelijke groeten|groeten)/i.test(value)) score += 15; else tips.push('afsluiting ontbreekt');
    if (value.length > 60 && value.length < 1600) score += 5;
    if (/[\u{1F300}-\u{1FAFF}]|\bwtf\b|\bfuck\b|\bshit\b/iu.test(value)) score -= 15;
    score = clamp(score, 0, 100);
    return { score, message: tips.length ? tips.slice(0, 2).join(', ') : 'klaar om te sturen' };
  }
  function makeSubject(text) {
    const value = String(text || '').toLowerCase();
    if (/toets|test/.test(value)) return 'Vraag over toets';
    if (/taak|opdracht/.test(value)) return 'Vraag over opdracht';
    if (/deadline|uitstel/.test(value)) return 'Vraag over deadline';
    if (/punt|resultaat|feedback/.test(value)) return 'Vraag over resultaat';
    if (/afwezig|ziek/.test(value)) return 'Afwezigheid';
    if (/smartschool|technisch|probleem/.test(value)) return 'Technisch probleem in Smartschool';
    if (/presentatie/.test(value)) return 'Vraag over presentatie';
    if (/groepswerk|groep/.test(value)) return 'Vraag over groepswerk';
    if (/boek|cursus|pagina/.test(value)) return 'Vraag over leerstof';
    const subject = value.match(/(frans|nederlands|wiskunde|engels|geschiedenis|aardrijkskunde|biologie|chemie|fysica|economie|informatica)/i);
    return subject ? `Vraag over ${subject[0]}` : 'Vraag';
  }
  function detectLikelySubject() {
    const text = `${state.mail.draft || ''} ${state.mail.output || ''} ${document.body?.innerText || ''}`.toLowerCase().slice(0, 12000);
    const match = text.match(/\b(frans|nederlands|wiskunde|engels|geschiedenis|aardrijkskunde|biologie|chemie|fysica|economie|informatica|godsdienst|techniek)\b/i);
    return match ? match[1] : '';
  }
  function fillSubject(subject) {
    state.mail.subject = subject;
    const input = findSubjectInput();
    if (input) {
      input.value = subject;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    } else copyText(subject);
    debouncedSave();
  }
  function findSubjectInput() {
    const candidates = [...document.querySelectorAll('input[type="text"],input:not([type]),textarea')];
    return candidates.find(el => /(onderwerp|subject|titel|title)/i.test(`${el.name || ''} ${el.id || ''} ${el.placeholder || ''} ${el.getAttribute('aria-label') || ''}`));
  }

  function bindSelectionBubble() {
    document.addEventListener('selectionchange', () => {
      const text = String(document.getSelection?.() || '').trim();
      selectedText = text.length > 3 ? text.slice(0, 2000) : '';
      if (!selectedText) { bubble?.remove(); bubble = null; return; }
      setTimeout(showSelectionBubble, 120);
    });
    document.addEventListener('click', event => {
      const action = event.target.closest?.('[data-sp-select]')?.dataset.spSelect;
      if (!action) return;
      event.preventDefault();
      if (action === 'mail') {
        const out = polishMail(selectedText, 'polish');
        copyText(out);
        toast('Verbeterde tekst gekopieerd');
      }
      if (action === 'focus') {
        state.focus.ruler = true; state.focus.reader = true; applyFocusModes(); debouncedSave(); toast('Leesfocus aan');
      }
      bubble?.remove(); bubble = null;
    }, true);
  }
  function showSelectionBubble() {
    if (!selectedText || !isTopFrame) return;
    const selection = document.getSelection();
    if (!selection.rangeCount) return;
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    if (!rect || !rect.width) return;
    if (!bubble) { bubble = document.createElement('div'); bubble.className = 'sp-selectbubble'; document.documentElement.appendChild(bubble); }
    bubble.style.left = `${Math.min(window.innerWidth - 230, rect.left + window.scrollX)}px`;
    bubble.style.top = `${Math.max(8, rect.top + window.scrollY - 48)}px`;
    bubble.innerHTML = `<button data-sp-select="mail">Netter</button><button data-sp-select="focus">Leesfocus</button>`;
  }

  async function scanFrameGrades() {
    const found = collectGradesFromDocument(document, location.href, 'frame');
    if (!found.length) return;
    const current = await loadState();
    current.grades = mergeGrades(current.grades || [], found);
    current.gradeScan = current.gradeScan || clone(DEFAULT_STATE.gradeScan);
    current.gradeScan.lastAt = new Date().toISOString();
    current.gradeScan.status = `Frame-scan vond ${found.length} punten`;
    current.gradeScan.found = current.grades.length;
    await chrome.storage.local.set({ [STORAGE_KEY]: current });
  }

  async function scanGrades({ deep = true, silent = false } = {}) {
    if (autoScanInProgress) return;
    autoScanInProgress = true;
    try {
      state.gradeScan.status = 'Aan het scannen...';
      state.gradeScan.pages = 0; state.gradeScan.errors = 0; state.gradeScan.errorHint = ''; state.gradeScan.lastNew = 0;
      logScan('Start scan op huidige Smartschool-pagina.');
      if (!silent) render();

      let found = collectGradesFromDocument(document, location.href, 'zichtbare pagina');
      logScan(`Zichtbare pagina: ${found.length} mogelijke punten.`);

      if (deep) {
        const apiCandidates = discoverGradeApiLinks(document, location.href);
        const pageCandidates = discoverGradeLinks(document, location.href);
        logScan(`Smartschool Resultaten-API kandidaten: ${apiCandidates.length}.`);
        logScan(`Kandidaat-resultaatpagina’s: ${pageCandidates.length}.`);

        const response = await chrome.runtime.sendMessage({
          type: 'sp-fetch-grade-sources',
          apiUrls: apiCandidates,
          urls: pageCandidates
        });

        const apiResponses = response?.api || [];
        const pages = response?.pages || [];
        state.gradeScan.pages = apiResponses.length + pages.length;

        for (const api of apiResponses) {
          if (!api.ok || !api.body) {
            state.gradeScan.errors++;
            logScan(`${api.status || 0} ${shortUrl(api.url)}: Resultaten-API niet toegankelijk.`);
            continue;
          }

          const json = parseJsonSafe(api.body);
          if (!json.ok) {
            state.gradeScan.errors++;
            logScan(`${shortUrl(api.url)}: geen JSON van Smartschool Resultaten-API.`);
            continue;
          }

          const apiGrades = collectGradesFromSmartschoolApi(json.value, api.url, 'Smartschool Resultaten-API');
          found = found.concat(apiGrades);
          logScan(`${shortUrl(api.url)}: ${apiGrades.length} punten via Resultaten-API.`);
        }

        for (const page of pages) {
          if (!page.ok || !page.html) {
            state.gradeScan.errors++;
            logScan(`${page.status || 0} ${shortUrl(page.url)}: ${page.error || 'niet toegankelijk'}`);
            continue;
          }
          const doc = new DOMParser().parseFromString(page.html, 'text/html');
          const pageGrades = collectGradesFromDocument(doc, page.url, 'achtergrondpagina');
          found = found.concat(pageGrades);
          logScan(`${shortUrl(page.url)}: ${pageGrades.length} punten.`);
        }
      }

      const existingKeys = new Set((state.grades || []).map(gradeKey));
      const now = new Date().toISOString();
      found = dedupeGrades(found).map(g => {
        const isNew = !existingKeys.has(gradeKey(g));
        return { ...g, isNew, firstSeenAt: isNew ? now : (g.firstSeenAt || now), scannedAt: now, period: g.period || deriveGradeMeta(g.title || '', g.date || '').period };
      });
      state.grades = mergeGrades(state.grades, found).slice(-MAX.grades);
      notifyTrendWarnings(state.grades);
      const added = found.filter(g => g.isNew).length;
      state.gradeScan.lastAt = now;
      state.gradeScan.found = state.grades.length;
      state.gradeScan.lastNew = added;
      if (found.length) {
        state.gradeScan.status = `Scan klaar: ${found.length} gevonden, ${added} nieuw`;
        state.gradeScan.errorHint = added ? `${added} nieuwe punten gevonden en gemarkeerd.` : 'Geen nieuwe punten; je lokale overzicht is bijgewerkt.';
        logScan(`Scan klaar: ${found.length} gevonden, ${added} nieuw.`);
        if (added > 0) notifySmartPlus('Nieuwe punten gevonden', `${added} nieuw(e) punt(en) toegevoegd aan SmartPlus.`, 'newGrades');
        toast(`Punten gevonden: ${found.length}`);
      } else {
        state.gradeScan.status = 'Geen punten gevonden';
        state.gradeScan.errorHint = 'SmartPlus kon geen resultaten lezen. Mogelijk gebruikt deze school een andere Smartschool-module, zijn er geen punten zichtbaar, of blokkeert de Resultaten-API toegang vanuit extensies. Open Resultaten één keer en scan opnieuw.';
        logScan(state.gradeScan.errorHint);
        if (!silent) toast('Geen punten gevonden');
      }
    } catch (error) {
      state.gradeScan.status = 'Scan mislukt';
      state.gradeScan.errors++;
      logScan(`Fout: ${error?.message || error}`);
      if (!silent) toast('Scan mislukt');
    } finally {
      autoScanInProgress = false;
      renderSave();
    }
  }
  function collectGradesFromDocument(doc, sourceUrl, sourceLabel) {
    const results = [];
    const rows = [...doc.querySelectorAll('tr, [role="row"], .row')].slice(0, 1800);
    for (const row of rows) {
      const text = cleanLine(row.innerText || row.textContent || '');
      if (!text || text.length < 3) continue;
      const matches = scoreMatches(text);
      if (!matches.length) continue;
      const cells = [...row.querySelectorAll('td,th,[role="cell"],div,span')].map(c => cleanLine(c.innerText || c.textContent || '')).filter(Boolean);
      const subject = detectSubject(row, cells, doc);
      const title = detectTitle(cells, text, subject);
      for (const m of matches) results.push(makeGrade(m, subject, title, sourceUrl, sourceLabel));
    }
    const bodyText = (doc.body?.innerText || doc.body?.textContent || '').split(/\n+/).map(cleanLine).filter(x => x.length > 4 && x.length < 240).slice(0, 3000);
    for (const line of bodyText) {
      if (!looksLikeGradeLine(line)) continue;
      const matches = scoreMatches(line);
      for (const m of matches) results.push(makeGrade(m, detectSubjectFromLine(line), line.slice(0, 90), sourceUrl, sourceLabel));
    }
    return dedupeGrades(results).filter(g => g.percent >= 0 && g.percent <= 100);
  }
  function parseJsonSafe(text) {
    try { return { ok: true, value: JSON.parse(text) }; }
    catch (error) { return { ok: false, error }; }
  }

  function collectGradesFromSmartschoolApi(payload, sourceUrl, sourceLabel) {
    const records = extractApiGradeRecords(payload);
    const results = [];

    for (const record of records) {
      const subject = apiSubject(record);
      const title = apiTitle(record);
      const period = apiFirstString(record, ['period.name', 'period.title', 'periodName', 'periode', 'trimester', 'reportPeriod.name', 'rapportperiode', 'evaluation.period.name']);
      const date = apiFirstString(record, ['date', 'evaluationDate', 'createdAt', 'updatedAt', 'datum', 'evaluation.date', 'publishedAt', 'timestamp']);
      const scoreText = apiScoreText(record);
      let matches = scoreMatches(scoreText);

      if (!matches.length) {
        const numeric = apiNumericScore(record);
        if (numeric) matches = [numeric];
      }

      for (const match of matches) {
        const cleanTitle = [title, period, date].filter(Boolean).join(' · ');
        results.push(makeGrade(match, subject, cleanTitle, sourceUrl, sourceLabel, period, date));
      }
    }

    return dedupeGrades(results).filter(g => g.percent >= 0 && g.percent <= 100);
  }

  function extractApiGradeRecords(payload) {
    const out = [];
    const seen = new WeakSet();

    const visit = (value, depth = 0) => {
      if (!value || depth > 9) return;
      if (Array.isArray(value)) {
        for (const item of value.slice(0, 2500)) visit(item, depth + 1);
        return;
      }
      if (typeof value !== 'object') return;
      if (seen.has(value)) return;
      seen.add(value);

      if (looksLikeApiGradeRecord(value) && scoreMatches(apiScoreText(value)).length) {
        out.push(value);
      } else {
        const numeric = apiNumericScore(value);
        if (looksLikeApiGradeRecord(value) && numeric) out.push(value);
      }

      for (const child of Object.values(value)) {
        if (child && typeof child === 'object') visit(child, depth + 1);
      }
    };

    visit(payload, 0);
    return out.slice(0, 2000);
  }

  function looksLikeApiGradeRecord(obj) {
    const keys = Object.keys(obj || {}).join(' ').toLowerCase();
    if (!keys) return false;
    if (/^(type description color value icon)$/.test(keys.replace(/\s+/g, ' '))) return false;
    const hasEvaluationContext = /(courses?|course|vak|subject|period|date|datum|name|title|evaluation|evaluatie|eval|result|score|punten|points?)/i.test(keys);
    const hasOnlyGraphicShape = Object.keys(obj || {}).every(k => /^(type|description|color|value|icon|class|style)$/i.test(k));
    return hasEvaluationContext && !hasOnlyGraphicShape;
  }

  function apiScoreText(record) {
    const preferred = [
      apiGet(record, 'graphic.description'),
      apiGet(record, 'result.graphic.description'),
      apiGet(record, 'score.description'),
      apiGet(record, 'points.description'),
      apiGet(record, 'evaluationResult'),
      apiGet(record, 'result'),
      apiGet(record, 'score'),
      apiGet(record, 'points'),
      apiGet(record, 'punt'),
      apiGet(record, 'value'),
      apiGet(record, 'percentage')
    ].filter(v => typeof v === 'string' || typeof v === 'number').map(String);

    const all = collectPrimitiveScoreTexts(record, 0, 120);
    return [...preferred, ...all].join(' | ');
  }

  function collectPrimitiveScoreTexts(value, depth = 0, limit = 120, out = []) {
    if (out.length >= limit || depth > 5 || value == null) return out;
    if (typeof value === 'string') {
      const text = cleanLine(value);
      if (text && text.length <= 180) out.push(text);
      return out;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      out.push(String(value));
      return out;
    }
    if (Array.isArray(value)) {
      for (const item of value.slice(0, 80)) collectPrimitiveScoreTexts(item, depth + 1, limit, out);
      return out;
    }
    if (typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) {
        if (/id|uuid|token|hash|avatar|url|href|link/i.test(key)) continue;
        collectPrimitiveScoreTexts(item, depth + 1, limit, out);
        if (out.length >= limit) break;
      }
    }
    return out;
  }

  function apiNumericScore(record) {
    const pairs = flattenNumbers(record);
    const score = pickNumber(pairs, /(score|punt|points?|result|behaald|obtained|numerator|waarde|value)$/i);
    const max = pickNumber(pairs, /(max|maximum|totaal|total|denominator|op|outof|weight)$/i);
    if (!score || !max) return null;
    if (score.value < 0 || max.value <= 0 || score.value > max.value || max.value > 100) return null;
    return { score: score.value, max: max.value, percent: Math.round((score.value / max.value) * 1000) / 10, raw: `${score.value}/${max.value}` };
  }

  function flattenNumbers(value, path = '', out = [], depth = 0) {
    if (out.length > 300 || depth > 6 || value == null) return out;
    if (typeof value === 'number' && Number.isFinite(value)) {
      out.push({ path, value });
      return out;
    }
    if (typeof value === 'string') {
      const normalized = value.replace(',', '.').trim();
      if (/^\d{1,3}(?:\.\d{1,2})?$/.test(normalized)) out.push({ path, value: Number(normalized) });
      return out;
    }
    if (Array.isArray(value)) {
      value.slice(0, 80).forEach((item, index) => flattenNumbers(item, `${path}.${index}`, out, depth + 1));
      return out;
    }
    if (typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) {
        if (/id|uuid|token|hash|avatar|url|href|link/i.test(key)) continue;
        flattenNumbers(item, path ? `${path}.${key}` : key, out, depth + 1);
      }
    }
    return out;
  }

  function pickNumber(items, regex) {
    return items.find(item => regex.test(item.path || '') && item.value >= 0 && item.value <= 100) || null;
  }

  function apiSubject(record) {
    const subjects = [];
    const courses = apiGet(record, 'courses');
    if (Array.isArray(courses)) {
      for (const course of courses) {
        const name = apiFirstString(course, ['name', 'title', 'label', 'courseName', 'vak']);
        if (name) subjects.push(name);
      }
    }

    for (const path of ['course.name', 'course.title', 'courseName', 'subject.name', 'subject', 'vak', 'vakNaam', 'class.name']) {
      const value = apiGet(record, path);
      if (typeof value === 'string' && value.trim()) subjects.push(value.trim());
    }

    const unique = [...new Set(subjects.map(cleanLine).filter(x => x && x.length < 80))];
    return unique.join(' / ') || 'Onbekend vak';
  }

  function apiTitle(record) {
    return apiFirstString(record, ['name', 'title', 'description', 'evaluation.name', 'evaluation.title', 'label', 'omschrijving']) || 'Resultaat';
  }

  function apiFirstString(record, paths) {
    for (const path of paths) {
      const value = apiGet(record, path);
      if (typeof value === 'string' && cleanLine(value)) return cleanLine(value).slice(0, 120);
      if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    }
    return '';
  }

  function apiGet(obj, path) {
    return String(path).split('.').reduce((current, key) => current && current[key] !== undefined ? current[key] : undefined, obj);
  }

  function looksLikeGradeLine(line) {
    const text = cleanLine(line);
    if (!text || /https?:\/\/|\bpx\b|rgb\(|rgba\(|rem\b|em\b/i.test(text)) return false;
    if (detectSubjectFromLine(text) !== 'Onbekend vak') return true;
    return /(punt|punten|score|resultaat|resultaten|toets|taak|evaluatie|rapport|periode|trimester|vak|gemiddelde|\/\s*(5|10|20|25|30|40|50|100)\b)/i.test(text);
  }

  function scoreMatches(text) {
    const out = [];
    const allowedMax = new Set([5,10,20,25,30,40,50,100]);
    const fraction = /(^|[^\d])([0-9]{1,3}(?:[,.][0-9]{1,2})?)\s*\/\s*([0-9]{1,3}(?:[,.][0-9]{1,2})?)(?=$|[^\d])/g;
    let match;
    while ((match = fraction.exec(text))) {
      const score = parseNum(match[2]); const max = parseNum(match[3]);
      if (!Number.isFinite(score) || !Number.isFinite(max) || max <= 0 || score > max || score < 0) continue;
      if (max > 100 || (!allowedMax.has(Math.round(max)) && max < 5)) continue;
      if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(text.slice(Math.max(0, match.index - 4), match.index + match[0].length + 6))) continue;
      out.push({ score, max, percent: Math.round((score / max) * 1000) / 10, raw: match[0].trim() });
    }
    const pct = /(^|[^\d])([0-9]{1,3}(?:[,.][0-9]{1,2})?)\s*%/g;
    while ((match = pct.exec(text))) {
      const percent = parseNum(match[2]);
      if (percent >= 0 && percent <= 100) out.push({ score: percent, max: 100, percent, raw: `${percent}%` });
    }
    return out;
  }
  function makeGrade(m, subject, title, sourceUrl, sourceLabel, period = '', date = '') {
    const meta = deriveGradeMeta(title || '', date || '');
    return { id: uid('grade'), score: m.score, max: m.max, percent: m.percent, raw: m.raw, subject: normalizeSubject(subject || 'Onbekend vak'), title: title || '', period: period || meta.period, date: date || meta.date, sourceUrl, sourceLabel, scannedAt: new Date().toISOString(), firstSeenAt: new Date().toISOString(), isNew: false };
  }
  function parseNum(value) { return Number(String(value).replace(',', '.')); }
  function cleanLine(value) { return String(value || '').replace(/\s+/g, ' ').trim(); }
  function detectSubject(row, cells, doc) {
    const useful = cells.filter(x => !scoreMatches(x).length && !/^\d{1,2}[/-]\d{1,2}/.test(x) && x.length >= 3 && x.length < 60);
    const coursey = useful.find(x => /(frans|nederlands|wiskunde|engels|geschiedenis|aardrijkskunde|biologie|chemie|fysica|economie|godsdienst|lo|lichamelijke|techniek|informatica|muziek|beeld|esthetica)/i.test(x));
    if (coursey) return coursey;
    const heading = closestHeading(row) || [...doc.querySelectorAll('h1,h2,h3,h4')].map(h => cleanLine(h.textContent)).find(x => x && x.length < 60);
    return coursey || useful[0] || heading || 'Onbekend vak';
  }
  function detectSubjectFromLine(line) {
    const hit = line.match(/(frans|nederlands|wiskunde|engels|geschiedenis|aardrijkskunde|biologie|chemie|fysica|economie|godsdienst|lichamelijke opvoeding|informatica)/i);
    return hit ? hit[0] : 'Onbekend vak';
  }
  function detectTitle(cells, text, subject) {
    return cells.find(x => x !== subject && !scoreMatches(x).length && x.length > 5 && x.length < 90) || text.slice(0, 90);
  }
  function closestHeading(el) {
    let current = el;
    for (let i = 0; current && i < 6; i++, current = current.parentElement) {
      const previous = current.previousElementSibling;
      if (previous && /^H[1-4]$/.test(previous.tagName)) return cleanLine(previous.textContent);
    }
    return '';
  }
  function discoverGradeApiLinks(doc, currentUrl) {
    const base = new URL(currentUrl);
    const urls = new Set([
      new URL('/results/api/v1/evaluations?itemsOnPage=500', base.origin).toString(),
      new URL('/results/api/v1/evaluations?itemsOnPage=1000', base.origin).toString(),
      new URL('/results/api/v1/evaluations?itemsOnPage=500&page=1', base.origin).toString(),
      new URL('/results/api/v1/evaluations?itemsOnPage=500&sort=-date', base.origin).toString()
    ]);

    const html = `${doc.documentElement?.innerHTML || ''}`.slice(0, 900000);
    const apiPattern = /(?:https:\/\/[^"'<>\s]+smartschool\.be)?\/results\/api\/v1\/evaluations[^"'<>\s]*/gi;
    for (const match of html.matchAll(apiPattern)) {
      try { urls.add(new URL(match[0].replace(/&amp;/g, '&'), base).toString()); } catch (_) {}
    }

    return [...urls].filter(u => {
      try {
        const url = new URL(u);
        return url.hostname.endsWith('.smartschool.be') && /\/results\/api\/v1\/evaluations/i.test(url.pathname);
      } catch (_) { return false; }
    }).slice(0, 8);
  }

  function discoverGradeLinks(doc, currentUrl) {
    const keywords = /(result|resultaten|punten|rapport|cijfers|evaluatie|evaluaties|grades|gradebook|quotering|toetsen)/i;
    const base = new URL(currentUrl);
    const urls = new Set([currentUrl]);
    for (const a of [...doc.querySelectorAll('a[href]')]) {
      const text = `${a.textContent || ''} ${a.getAttribute('title') || ''} ${a.href || ''}`;
      if (!keywords.test(text)) continue;
      try { urls.add(new URL(a.getAttribute('href'), base).toString()); } catch (_) {}
    }
    const scriptsAndHtml = `${doc.documentElement?.innerHTML || ''}`.slice(0, 900000);
    for (const match of scriptsAndHtml.matchAll(/https:\/\/[^"'<>\s]+smartschool\.be[^"'<>\s]*/gi)) {
      if (keywords.test(match[0]) && !/\/skore(?:\/|$)/i.test(match[0])) urls.add(match[0].replace(/&amp;/g, '&'));
    }
    for (const rel of ['/results', '/results/main/results', '/results/main/results/', '/resultaten', '/rapport', '/grades', '/Grades', '/?module=Results']) urls.add(new URL(rel, base.origin).toString());
    return [...urls].filter(u => {
      try {
        const url = new URL(u);
        return url.hostname.endsWith('.smartschool.be') && !/\/skore(?:\/|$)/i.test(url.pathname);
      } catch (_) { return false; }
    }).slice(0, 12);
  }
  function gradeKey(g) {
    return [normalize(g.subject), Math.round(Number(g.score || 0) * 100) / 100, Math.round(Number(g.max || 0) * 100) / 100, normalize(g.title).slice(0, 70), normalize(g.period)].join('|');
  }
  function mergeGrades(existing, found) {
    const map = new Map();
    for (const g of existing || []) map.set(gradeKey(g), { ...g, isNew: !!g.isNew });
    for (const g of found || []) {
      const key = gradeKey(g);
      if (!map.has(key)) map.set(key, g);
      else {
        const old = map.get(key);
        map.set(key, { ...old, scannedAt: g.scannedAt || old.scannedAt, sourceLabel: old.sourceLabel || g.sourceLabel, sourceUrl: old.sourceUrl || g.sourceUrl });
      }
    }
    return [...map.values()].sort((a,b) => (a.firstSeenAt || a.scannedAt || '').localeCompare(b.firstSeenAt || b.scannedAt || ''));
  }
  function dedupeGrades(items) { return mergeGrades([], items); }
  function normalize(value) { return String(value || '').toLowerCase().replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim(); }
  function normalizeSubject(value) {
    let s = cleanLine(value).replace(/^\d+\s*/, '').replace(/\s+-\s+.*$/, '').trim();
    const aliases = [
      [/\bndl\b|nederlands/i, 'Nederlands'], [/\bwis\b|wiskunde/i, 'Wiskunde'], [/\beng\b|engels/i, 'Engels'], [/\bfra\b|frans/i, 'Frans'],
      [/geschiedenis/i, 'Geschiedenis'], [/aardrijkskunde/i, 'Aardrijkskunde'], [/biologie/i, 'Biologie'], [/chemie/i, 'Chemie'], [/fysica|natuurkunde/i, 'Fysica'],
      [/economie/i, 'Economie'], [/informatica/i, 'Informatica'], [/godsdienst/i, 'Godsdienst'], [/lichamelijke|\blo\b/i, 'Lichamelijke opvoeding'], [/techniek/i, 'Techniek']
    ];
    for (const [regex, label] of aliases) if (regex.test(s)) return label;
    return s && s.length < 70 ? s : 'Onbekend vak';
  }
  function shortUrl(value) { try { const u = new URL(value); return `${u.pathname}${u.search}`.slice(0, 80) || u.hostname; } catch (_) { return String(value).slice(0, 80); } }
  function deriveGradeMeta(text, dateValue = '') {
    const value = cleanLine(`${text} ${dateValue}`);
    let date = parseGradeDate(dateValue) || parseGradeDate(value) || '';
    const periodMatch = value.match(/(trimester\s*\d|periode\s*\d|rapport\s*\d|semester\s*\d)/i);
    let period = periodMatch ? periodMatch[1].replace(/\s+/g, ' ') : '';
    if (!period && date) period = new Date(date).toLocaleDateString('nl-BE', { month: 'long', year: 'numeric' });
    return { period: period || 'Onbekende periode', date };
  }
  function parseGradeDate(value) {
    const text = String(value || '');
    let m = text.match(/(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (m) return `${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`;
    m = text.match(/(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2}|\d{2})/);
    if (m) { const y = m[3].length === 2 ? `20${m[3]}` : m[3]; return `${y}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`; }
    return '';
  }
  function gradePeriods(grades) {
    const set = new Map();
    for (const g of grades || []) {
      const p = g.period || deriveGradeMeta(g.title || '', g.date || '').period || 'Onbekende periode';
      set.set(p, p);
    }
    return [...set.entries()].sort((a,b) => a[1].localeCompare(b[1], 'nl'));
  }
  function filterGradesByPeriod(grades, period) {
    if (!period || period === 'all') return grades || [];
    return (grades || []).filter(g => (g.period || 'Onbekende periode') === period);
  }
  function gradeStats(items) {
    const grades = items || state.grades || [];
    const sumScore = grades.reduce((s,g) => s + Number(g.score || 0), 0);
    const sumMax = grades.reduce((s,g) => s + Number(g.max || 0), 0);
    const average = sumMax ? (sumScore / sumMax) * 100 : 0;
    const bySubject = {};
    for (const g of grades) {
      const key = normalizeSubject(g.subject || 'Onbekend vak');
      bySubject[key] ||= { score: 0, max: 0, count: 0, average: 0 };
      bySubject[key].score += Number(g.score || 0); bySubject[key].max += Number(g.max || 0); bySubject[key].count++;
      bySubject[key].average = bySubject[key].max ? (bySubject[key].score / bySubject[key].max) * 100 : 0;
    }
    const subjects = Object.entries(bySubject);
    subjects.sort((a,b) => b[1].average - a[1].average);
    const weakEntry = subjects.at(-1);
    return { average, averageLabel: grades.length ? `${Math.round(average)}%` : '-', bySubject, best: subjects[0]?.[0] || '-', weak: weakEntry?.[0] || '-', weakAverage: weakEntry?.[1]?.average || 0 };
  }
  function gradeClass(percent) { percent = Number(percent || 0); return percent >= 75 ? 'ok' : percent >= 55 ? 'warn' : 'bad'; }
  function renderSubjectGoalRow(subject, g, grades) {
    const safeSubject = escapeHtml(subject);
    const goal = Number(state.gradeGoals?.[subject] || 70);
    const trend = subjectTrend(subject, grades);
    return `<tr><td>${safeSubject}</td><td class="sp-grade ${gradeClass(g.average)}">${Math.round(g.average)}%</td><td><input class="sp-goal-input" type="number" min="0" max="100" step="1" inputmode="numeric" data-grade-goal="${safeSubject}" value="${escapeAttr(goal)}" title="Doel voor ${safeSubject}" aria-label="Doel voor ${safeSubject}">%</td><td>${renderGoalProgress(g.average, goal)}</td><td>${trendLabel(trend)} ${renderTrendMini(subject, grades)}</td></tr>`;
  }
  function renderGoalProgress(average, goal) {
    const pct = clamp(goal ? (Number(average || 0) / Number(goal)) * 100 : 0, 0, 130);
    const cls = Number(average || 0) >= Number(goal || 70) ? 'ok' : Number(average || 0) >= Math.max(0, Number(goal || 70) - 10) ? 'warn' : 'bad';
    return `<div class="sp-goalbar ${cls}"><span style="width:${Math.min(100, Math.round(pct))}%"></span><b>${Math.round(pct)}%</b></div>`;
  }
  function subjectTrend(subject, grades = state.grades) {
    const list = (grades || []).filter(g => normalizeSubject(g.subject) === normalizeSubject(subject)).slice(-6);
    if (list.length < 3) return { direction: 'stabiel', delta: 0, latest: list.at(-1)?.percent || 0 };
    const first = list.slice(0, Math.ceil(list.length / 2)).reduce((s,g) => s + Number(g.percent || 0), 0) / Math.ceil(list.length / 2);
    const second = list.slice(Math.floor(list.length / 2)).reduce((s,g) => s + Number(g.percent || 0), 0) / (list.length - Math.floor(list.length / 2));
    const delta = Math.round(second - first);
    const direction = delta >= 6 ? 'stijgend' : delta <= -6 ? 'dalend' : 'stabiel';
    return { direction, delta, latest: list.at(-1)?.percent || 0 };
  }
  function trendLabel(trend) {
    const cls = trend.direction === 'stijgend' ? 'ok' : trend.direction === 'dalend' ? 'bad' : 'warn';
    const icon = trend.direction === 'stijgend' ? '↗' : trend.direction === 'dalend' ? '↘' : '→';
    return `<span class="sp-trend-label ${cls}" title="${escapeHtml(String(trend.delta))}% verschil">${icon} ${escapeHtml(trend.direction)}</span>`;
  }
  function renderGradeSvgChart(grades = state.grades) {
    const list = [...(grades || [])].slice(-12);
    if (list.length < 2) return '<div class="sp-empty">Nog te weinig punten voor een grafiek.</div>';
    const w = 460, h = 160, pad = 20;
    const pts = list.map((g, i) => {
      const x = pad + (i * (w - pad * 2) / Math.max(1, list.length - 1));
      const y = h - pad - (clamp(g.percent, 0, 100) * (h - pad * 2) / 100);
      return { x, y, g };
    });
    const poly = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const dots = pts.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5" class="${gradeClass(p.g.percent)}"><title>${escapeHtml(p.g.subject)} · ${escapeHtml(formatGrade(p.g))}</title></circle>`).join('');
    return `<svg class="sp-grade-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Puntentrend"><line x1="${pad}" y1="${pad}" x2="${pad}" y2="${h-pad}"/><line x1="${pad}" y1="${h-pad}" x2="${w-pad}" y2="${h-pad}"/><path d="M ${poly}"/>${dots}<text x="${pad}" y="18">100%</text><text x="${pad}" y="${h-pad-4}">0%</text></svg>`;
  }
  function renderPeriodComparison(grades = state.grades) {
    const periods = gradePeriods(grades);
    if (periods.length < 2) return '<div class="sp-empty">Nog geen twee periodes om te vergelijken.</div>';
    const lastTwo = periods.slice(-2).map(([id]) => id);
    const a = gradeStats(filterGradesByPeriod(grades, lastTwo[0]));
    const b = gradeStats(filterGradesByPeriod(grades, lastTwo[1]));
    const delta = Math.round(b.average - a.average);
    const cls = delta >= 3 ? 'ok' : delta <= -3 ? 'bad' : 'warn';
    return `<div class="sp-grid-3"><div class="sp-status-card"><b>${escapeHtml(lastTwo[0])}</b><span>${a.averageLabel}</span></div><div class="sp-status-card"><b>${escapeHtml(lastTwo[1])}</b><span>${b.averageLabel}</span></div><div class="sp-status-card ${cls}"><b>${delta > 0 ? '+' : ''}${delta}%</b><span>Verschil</span></div></div>`;
  }
  function notifyTrendWarnings(grades = state.grades) {
    const stats = gradeStats(grades);
    const now = Date.now();
    state.trendNotified ||= {};
    for (const subject of Object.keys(stats.bySubject || {})) {
      const trend = subjectTrend(subject, grades);
      const key = normalizeSubject(subject);
      const last = Number(state.trendNotified[key] || 0);
      if (trend.direction === 'dalend' && now - last > 1000 * 60 * 60 * 24 * 5) {
        state.trendNotified[key] = now;
        notifySmartPlus('Dalende puntentrend', `${subject} lijkt te dalen. Misschien even extra oefenen.`, 'newGrades');
      }
    }
  }

  function formatGrade(g) { return g.max === 100 && String(g.raw).includes('%') ? `${Math.round(g.percent)}%` : `${g.score}/${g.max}`; }
  function renderTrendMini(subject, grades) {
    const list = (grades || []).filter(g => normalizeSubject(g.subject) === normalizeSubject(subject)).slice(-6);
    if (!list.length) return '<span style="color:var(--sp-muted)">-</span>';
    const bars = list.map(g => `<i class="${gradeClass(g.percent)}" style="height:${Math.max(10, Math.round(g.percent))}%" title="${escapeHtml(formatGrade(g))}"></i>`).join('');
    return `<span class="sp-mini-trend">${bars}</span>`;
  }
  function renderWhatIf(stats, grades = state.grades) {
    const score = parseNum(state.calculator.newScore); const max = parseNum(state.calculator.newMax); const target = parseNum(state.calculator.target);
    const remaining = clamp(state.calculator.remainingTests || 1, 1, 20);
    const currentScore = (grades || []).reduce((s,g) => s + Number(g.score || 0), 0);
    const currentMax = (grades || []).reduce((s,g) => s + Number(g.max || 0), 0);
    if (!(grades || []).length || !max) return 'Scan eerst punten om dit te berekenen.';
    const next = ((currentScore + score) / (currentMax + max)) * 100;
    const neededTotal = ((target / 100) * (currentMax + (max * remaining))) - currentScore;
    const neededPerTest = Math.max(0, Math.ceil((neededTotal / remaining) * 10) / 10);
    const neededPct = Math.round((neededPerTest / max) * 100);
    return `Met ${score}/${max} wordt je gemiddelde ongeveer ${Math.round(next)}%. Voor ${target}% totaal heb je op ${remaining} resterende toets(en) gemiddeld ongeveer ${neededPerTest}/${max} nodig (${neededPct}%).`;
  }
  function exportGrades() {
    const rows = [['Vak','Score','Max','Percentage','Doel','Trend','Periode','Datum','Titel','Bron','Eerst gezien','Laatst gescand'], ...(state.grades || []).map(g => {
      const subject = normalizeSubject(g.subject);
      const goal = state.gradeGoals?.[subject] || '';
      const trend = subjectTrend(subject, state.grades).direction;
      return [subject,g.score,g.max,Math.round(g.percent),goal,trend,g.period || '',g.date || '',g.title,g.sourceLabel,g.firstSeenAt || '',g.scannedAt || ''];
    })];
    const csv = '\ufeff' + rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'smartplus-punten.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function applyFocusModes() {
    const f = state.focus || DEFAULT_STATE.focus;
    if (f.autoNight) f.night = isAutoNightActive(f.nightStart || '20:00', f.nightEnd || '07:00');
    document.body.classList.toggle('sp-focus-mode', !!f.focusMode);
    document.body.classList.toggle('sp-reader-mode', !!f.reader);
    document.body.classList.toggle('sp-ruler-mode', !!f.ruler);
    document.body.classList.toggle('sp-large-text', !!f.largeText);
    document.body.classList.toggle('sp-hide-notifications', !!f.hideNotifications);
    document.body.classList.toggle('sp-night-mode', !!f.night);
    document.body.classList.toggle('sp-contrast-mode', !!f.contrast);
    document.body.classList.toggle('sp-dyslexia', !!f.dyslexia);
    document.body.classList.toggle('sp-line-space', !!f.lineSpace);
    document.body.classList.toggle('sp-calm-mode', !!f.calm);
    document.body.classList.toggle('sp-table-boost', !!f.tableBoost);
    document.body.classList.toggle('sp-wide-reader', !!f.wide);
    document.body.classList.toggle('sp-spotlight-mode', !!f.spotlight);
    document.body.classList.toggle('sp-test-mode', !!f.testMode);
    if (f.ruler && !rulerMouseListenerBound) {
      document.addEventListener('mousemove', moveRuler, { passive: true });
      rulerMouseListenerBound = true;
    } else if (!f.ruler && rulerMouseListenerBound) {
      document.removeEventListener('mousemove', moveRuler);
      rulerMouseListenerBound = false;
      document.documentElement.style.removeProperty('--sp-ruler-y');
    }
  }
  function isAutoNightActive(start = '20:00', end = '07:00') {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const parse = value => { const m = String(value || '').match(/(\d{1,2})[:.](\d{2})/); return m ? Math.min(1439, Math.max(0, Number(m[1])*60 + Number(m[2]))) : 0; };
    const s = parse(start), e = parse(end);
    return s > e ? (minutes >= s || minutes <= e) : (minutes >= s && minutes <= e);
  }
  function applyFocusProfile(profile) {
    state.focus.profile = profile;
    const base = { focusMode:false, reader:false, ruler:false, largeText:false, hideNotifications:false, night:false, contrast:false, dyslexia:false, lineSpace:false, calm:false, tableBoost:false, wide:false, spotlight:false, testMode:false };
    if (profile === 'studeren') Object.assign(base, { focusMode:true, ruler:true, reader:true, hideNotifications:true, tableBoost:true, calm:true });
    if (profile === 'lezen') Object.assign(base, { reader:true, ruler:true, largeText:true, lineSpace:true, wide:true, spotlight:true, calm:true });
    if (profile === 'toets') Object.assign(base, { focusMode:true, largeText:true, hideNotifications:true, ruler:true, tableBoost:true, spotlight:true, calm:true, testMode:true });
    if (profile === 'avond') Object.assign(base, { reader:true, night:true, contrast:true, lineSpace:true, spotlight:true, calm:true });
    Object.assign(state.focus, base);
    applyFocusModes(); renderSave(); toast(`Profiel ${profile} toegepast`);
  }
  function moveRuler(event) { if (state.focus?.ruler) document.documentElement.style.setProperty('--sp-ruler-y', `${event.clientY}px`); }
  function toggleTestMode() {
    const on = !state.focus.testMode;
    Object.assign(state.focus, { testMode: on, focusMode: on, largeText: on, hideNotifications: on, ruler: on, tableBoost: on, spotlight: on, calm: on });
    applyFocusModes(); renderSave(); toast(on ? 'Toetsmodus aan' : 'Toetsmodus uit');
  }
  function upcomingReminders() {
    const now = Date.now();
    return (state.reminders || []).filter(item => !item.done && new Date(item.at).getTime() >= now).sort((a,b) => String(a.at || '').localeCompare(String(b.at || '')));
  }
  async function addReminder() {
    const title = cleanLine(state.newReminder?.title || 'SmartPlus herinnering');
    const at = state.newReminder?.at || '';
    if (!title || !at) { toast('Vul titel en tijdstip in'); return; }
    const when = new Date(at).getTime();
    if (!Number.isFinite(when) || when <= Date.now()) { toast('Kies een tijdstip in de toekomst'); return; }
    const reminder = { id: uid('reminder'), title, note: cleanLine(state.newReminder.note || ''), at, enabled: true, done: false, createdAt: new Date().toISOString() };
    state.reminders = [reminder, ...(state.reminders || [])].slice(0, MAX.reminders);
    state.newReminder = clone(DEFAULT_STATE.newReminder);
    await saveState();
    scheduleReminder(reminder);
    render();
    toast('Herinnering toegevoegd');
  }
  function removeReminder(id) {
    if (!id) return;
    state.reminders = (state.reminders || []).filter(item => item.id !== id);
    chrome.runtime.sendMessage({ type:'sp-cancel-reminder', id }).catch(() => {});
    renderSave();
    toast('Herinnering verwijderd');
  }
  function markReminderDone(id) {
    state.reminders = (state.reminders || []).map(item => item.id === id ? { ...item, done: true, doneAt: new Date().toISOString() } : item);
    chrome.runtime.sendMessage({ type:'sp-cancel-reminder', id }).catch(() => {});
    renderSave();
  }
  function scheduleReminder(reminder) {
    chrome.runtime.sendMessage({ type:'sp-schedule-reminder', reminder }).catch(() => {});
  }
  function scheduleAllReminders() {
    chrome.runtime.sendMessage({ type:'sp-refresh-reminders' }).catch(() => {});
  }
  function notifySmartPlus(title, message, kind = 'general') {
    if (!state.notifications?.enabled) return;
    if (kind === 'newGrades' && state.notifications.newGrades === false) return;
    if (kind === 'timerDone' && state.notifications.timerDone === false) return;
    if (kind === 'reminders' && state.notifications.reminders === false) return;
    if (state.notifications.quietHours && isWithinQuietHoursNow()) return;
    chrome.runtime.sendMessage({ type:'sp-notify', title, message, kind }).catch(() => {});
  }
  function isWithinQuietHoursNow() {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const start = parseTimeToMinutes(state.notifications?.quietStart || '22:00');
    const end = parseTimeToMinutes(state.notifications?.quietEnd || '07:00');
    return start > end ? (minutes >= start || minutes <= end) : (minutes >= start && minutes <= end);
  }
  function parseTimeToMinutes(value) {
    const match = String(value || '').match(/(\d{1,2})[:.](\d{2})/);
    return match ? clamp(Number(match[1]) * 60 + Number(match[2]), 0, 1439) : 0;
  }
  function setTimer(minutes) {
    const safeMinutes = toBoundedNumber(minutes, { min: 1, max: 180, fallback: 20, integer: true });
    state.timer.minutes = safeMinutes;
    state.timer.sessionType = 'focus';
    state.timer.remaining = safeMinutes * 60;
    state.timer.focusSecondsAtStart = safeMinutes * 60;
    state.timer.running = false;
    clearInterval(timerHandle);
    timerHandle = null;
    renderSave();
  }
  function startTimer(resume) {
    if (!resume) state.timer.running = !state.timer.running;
    if (state.timer.running && !timerHandle) {
      state.timer.startedAt = state.timer.startedAt || Date.now();
      timerHandle = setInterval(() => {
        state.timer.remaining = Math.max(0, Number(state.timer.remaining || 0) - 1);
        if (state.timer.remaining <= 0) {
          completeTimerSession();
          renderSave();
          return;
        }
        updateTimerUi();
        if (Date.now() - lastTimerSaveAt > 10000) { lastTimerSaveAt = Date.now(); debouncedSave(); }
      }, 1000);
    } else if (!state.timer.running) {
      clearInterval(timerHandle);
      timerHandle = null;
    }
    updateTimerUi();
    renderSave();
  }
  function completeTimerSession() {
    const wasBreak = state.timer.sessionType === 'break';
    clearInterval(timerHandle);
    timerHandle = null;
    state.timer.running = false;
    if (state.focus.sound !== false) playFocusBeep();
    if (!wasBreak) {
      const seconds = Number(state.timer.focusSecondsAtStart || state.timer.minutes * 60 || 0);
      recordFocusSession(seconds);
      toast('Focusblok klaar');
      notifySmartPlus('Focusblok klaar', state.focus.pomodoro ? 'Tijd voor een korte pauze.' : 'Je SmartPlus focusblok is afgelopen.', 'timerDone');
      if (state.focus.pomodoro) {
        state.timer.sessionType = 'break';
        state.timer.remaining = getBreakMinutes() * 60;
        state.timer.running = true;
        startTimer(true);
        return;
      }
    } else {
      toast('Pauze klaar');
      notifySmartPlus('Pauze klaar', 'Je pauze is afgelopen. Klaar voor het volgende focusblok.', 'timerDone');
      state.timer.sessionType = 'focus';
    }
    state.timer.remaining = getTimerMinutes() * 60;
    state.timer.focusSecondsAtStart = state.timer.remaining;
    updateTimerUi();
  }
  function updateTimerUi() {
    const display = root?.querySelector('#sp-timer-display');
    if (display) display.textContent = timerLabel();
    const badge = root?.querySelector('#sp-session-badge');
    if (badge) {
      const isBreak = state.timer.sessionType === 'break';
      badge.textContent = isBreak ? 'Pauze' : 'Focus';
      badge.classList.toggle('is-break', isBreak);
      badge.classList.toggle('is-focus', !isBreak);
    }
  }
  function resetTimer() {
    state.timer.sessionType = 'focus';
    state.timer.remaining = getTimerMinutes() * 60;
    state.timer.focusSecondsAtStart = state.timer.remaining;
    state.timer.running = false;
    clearInterval(timerHandle);
    timerHandle = null;
    renderSave();
  }
  function recordFocusSession(seconds) {
    const today = new Date().toISOString().slice(0, 10);
    const weekKey = getWeekKey(new Date());
    state.focusStats ||= clone(DEFAULT_STATE.focusStats);
    if (state.focusStats.date !== today) { state.focusStats.date = today; state.focusStats.todaySeconds = 0; }
    if (state.focusStats.weekKey !== weekKey) { state.focusStats.weekKey = weekKey; state.focusStats.weekSeconds = 0; }
    state.focusStats.todaySeconds = Number(state.focusStats.todaySeconds || 0) + seconds;
    state.focusStats.weekSeconds = Number(state.focusStats.weekSeconds || 0) + seconds;
    state.focusStats.sessions = [{ at: new Date().toISOString(), seconds }, ...(state.focusStats.sessions || [])].slice(0, 30);
    if ((state.focusStats.sessions || []).length % 4 === 0) notifySmartPlus('Sterke focus', 'Je hebt meerdere focusblokken afgerond. Goed bezig.', 'timerDone');
  }
  function focusStatsForDisplay() {
    const fs = state.focusStats || DEFAULT_STATE.focusStats;
    return { today: formatDuration(fs.todaySeconds || 0), week: formatDuration(fs.weekSeconds || 0), sessions: String((fs.sessions || []).length) };
  }
  function formatDuration(seconds) {
    const min = Math.round(Number(seconds || 0) / 60);
    if (min < 60) return `${min} min`;
    return `${Math.floor(min/60)}u ${min%60}m`;
  }
  function getWeekKey(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  }
  function playFocusBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = 740;
      gain.gain.value = 0.08;
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => { osc.stop(); ctx.close?.(); }, 220);
    } catch (_) {}
  }
  function timerLabel() { const r = Number(state.timer.remaining || 0); return `${String(Math.floor(r/60)).padStart(2,'0')}:${String(r%60).padStart(2,'0')}`; }

  function applyTheme() {
    const theme = getThemeForPage();
    if (root) {
      root.style.setProperty('--sp-accent', theme.accent);
      root.style.setProperty('--sp-accent-2', theme.accent2);
      root.style.setProperty('--sp-bg', theme.bg);
      root.style.setProperty('--sp-card', theme.card);
      root.style.setProperty('--sp-card-2', theme.card2);
      root.style.setProperty('--sp-text', theme.text);
      root.style.setProperty('--sp-muted', theme.muted);
      root.style.setProperty('--sp-border', theme.border);
      root.style.setProperty('--sp-soft', theme.soft);
    }
    document.documentElement.style.setProperty('--sp-page-accent', theme.accent);
    document.documentElement.style.setProperty('--sp-page-bg', theme.pageBg || theme.bg);
    document.documentElement.style.setProperty('--sp-page-text', theme.pageText || theme.text);
    document.body.classList.toggle('sp-page-theme', !!state.themeOptions.applyToSmartschool);
    if (state.themeOptions.applyToSmartschool && state.custom.backgroundImage) {
      document.body.style.backgroundImage = `linear-gradient(rgba(255,255,255,.78), rgba(255,255,255,.78)), url(${state.custom.backgroundImage})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundAttachment = 'fixed';
    } else {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundAttachment = '';
    }
    document.body.classList.toggle('sp-calm-mode', !state.themeOptions.animations || !!state.focus.calm);
  }
  function customTheme() {
    return { id:'custom', name:'Eigen thema', category:'custom', accent: state.custom.accent || '#ff5a1f', accent2: state.custom.accent2 || '#ff985c', bg: state.custom.bg || '#f6f7fb', card: state.custom.card || '#ffffff', card2: '#fff7f2', text: state.custom.text || '#172033', muted:'#667085', border:'#e6e8ef', soft:'#fff1e8', pageBg: state.custom.bg || '#f6f7fb', pageText: state.custom.text || '#172033' };
  }
  function safeHexColor(value, fallback) {
    const text = String(value || '').trim();
    return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(text) ? text : fallback;
  }
  function sanitizeCustomTheme(custom = {}) {
    const base = DEFAULT_STATE.custom;
    const backgroundImage = String(custom.backgroundImage || '');
    return {
      accent: safeHexColor(custom.accent, base.accent),
      accent2: safeHexColor(custom.accent2, base.accent2),
      bg: safeHexColor(custom.bg, base.bg),
      card: safeHexColor(custom.card, base.card),
      text: safeHexColor(custom.text, base.text),
      backgroundImage: backgroundImage.startsWith('data:image/') && backgroundImage.length <= MAX.backgroundImage ? backgroundImage : ''
    };
  }
  function sanitizeThemeOptions(options = {}) {
    return {
      ...DEFAULT_STATE.themeOptions,
      ...state.themeOptions,
      applyToSmartschool: !!options.applyToSmartschool,
      animations: options.animations !== false,
      glass: !!options.glass,
      subjectThemesText: safeText(options.subjectThemesText || '', 4000),
      previewTheme: THEMES.some(t => t.id === options.previewTheme) ? options.previewTheme : '',
      timeTheme: !!options.timeTheme
    };
  }
  function getThemeForPage() {
    if (state.themeOptions?.previewTheme) {
      const preview = THEMES.find(t => t.id === state.themeOptions.previewTheme);
      if (preview) return preview;
    }
    const subjectTheme = pickSubjectTheme();
    if (subjectTheme) return subjectTheme;
    return state.theme === 'custom' ? customTheme() : getTheme();
  }
  function suggestedTheme() {
    const h = new Date().getHours();
    if (h >= 20 || h < 7) return THEMES.find(t => t.id === 'midnight-orange') || THEMES[0];
    const month = new Date().getMonth() + 1;
    if ([12,1,2].includes(month)) return THEMES.find(t => t.id === 'ice-white') || THEMES[0];
    if ([3,4,5].includes(month)) return THEMES.find(t => t.id === 'mint') || THEMES[0];
    if ([6,7,8].includes(month)) return THEMES.find(t => t.id === 'sunset-orange') || THEMES[0];
    return THEMES.find(t => t.id === 'forest-calm') || THEMES[0];
  }
  function pickSubjectTheme() {
    if (!state.themeOptions?.subjectThemesText) return null;
    const text = (document.body?.innerText || '').slice(0, 8000).toLowerCase();
    for (const line of String(state.themeOptions.subjectThemesText || '').split(/\n+/)) {
      const [subject, themeId] = line.split('=').map(x => x && x.trim());
      if (!subject || !themeId) continue;
      if (text.includes(subject.toLowerCase())) {
        const theme = THEMES.find(t => t.id === themeId);
        if (theme) return theme;
      }
    }
    return null;
  }
  function exportTheme() {
    const theme = state.theme === 'custom' ? customTheme() : getTheme();
    const payload = { smartplusTheme: 1, theme: state.theme, custom: state.custom, options: state.themeOptions, exportedAt: new Date().toISOString(), name: theme.name };
    const text = JSON.stringify(payload, null, 2);
    state.themeImport = text;
    copyText(text);
    renderSave();
    toast('Thema JSON gekopieerd');
  }
  function importTheme() {
    try {
      const payload = JSON.parse(state.themeImport || '{}');
      if (!payload || payload.smartplusTheme !== 1) throw new Error('Geen SmartPlus thema JSON');
      if (payload.custom) state.custom = sanitizeCustomTheme({ ...state.custom, ...payload.custom });
      if (payload.options) state.themeOptions = sanitizeThemeOptions({ ...state.themeOptions, ...payload.options });
      state.theme = payload.theme === 'custom' || THEMES.some(t => t.id === payload.theme) ? payload.theme : 'custom';
      applyTheme(); renderSave(); toast('Thema geïmporteerd');
    } catch (error) { toast('Thema import mislukt'); }
  }
  function handleBackgroundUpload(file) {
    if (!file) return;
    if (file.size > MAX.backgroundImage) { toast('Afbeelding is te groot'); return; }
    const reader = new FileReader();
    reader.onload = () => { state.custom.backgroundImage = String(reader.result || ''); applyTheme(); renderSave(); toast('Achtergrond ingesteld'); };
    reader.readAsDataURL(file);
  }

  function copyText(text) { navigator.clipboard?.writeText(text).catch(() => {}); }
  function toast(message) {
    if (!isTopFrame || !root) return;
    const wrap = root.querySelector('#sp-toasts');
    if (!wrap) return;
    const el = document.createElement('div'); el.className = 'sp-toast'; el.textContent = message; wrap.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }
})();
