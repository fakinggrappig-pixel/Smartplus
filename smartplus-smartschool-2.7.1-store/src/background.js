'use strict';

const STORAGE_KEY = 'smartplus.state.v2';
const REMINDER_ALARM_PREFIX = 'smartplus-reminder:';

const CONTEXT_MENUS = [
  ['sp-mail-polish', 'SmartPlus: maak bericht netter'],
  ['sp-mail-formal', 'SmartPlus: maak bericht formeler'],
  ['sp-mail-short', 'SmartPlus: maak bericht korter'],
  ['sp-mail-subject', 'SmartPlus: maak onderwerp'],
  ['sp-mail-friendly', 'SmartPlus: maak vriendelijker'],
  ['sp-mail-professional', 'SmartPlus: maak professioneler'],
  ['sp-mail-direct', 'SmartPlus: maak directer']
];

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    for (const [id, title] of CONTEXT_MENUS) {
      chrome.contextMenus.create({ id, title, contexts: ['selection', 'editable'] });
    }
  });
  refreshReminderAlarms().catch(() => {});
});

chrome.runtime.onStartup.addListener(() => {
  refreshReminderAlarms().catch(() => {});
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;
  const map = {
    'sp-mail-polish': 'sp-mail-polish',
    'sp-mail-formal': 'sp-mail-formal',
    'sp-mail-short': 'sp-mail-short',
    'sp-mail-subject': 'sp-mail-subject',
    'sp-mail-friendly': 'sp-mail-friendly',
    'sp-mail-professional': 'sp-mail-professional',
    'sp-mail-direct': 'sp-mail-direct'
  };
  chrome.tabs.sendMessage(tab.id, {
    type: map[info.menuItemId],
    text: info.selectionText || ''
  }).catch(() => {});
});

chrome.alarms.onAlarm.addListener(async alarm => {
  if (!alarm?.name?.startsWith(REMINDER_ALARM_PREFIX)) return;
  const id = alarm.name.slice(REMINDER_ALARM_PREFIX.length);
  const state = await getState();
  const reminder = (state.reminders || []).find(item => item.id === id);
  if (!reminder || reminder.done || reminder.enabled === false) return;
  if (!notificationsAllowed(state, 'reminders')) return;
  if (isQuietNow(state.notifications || {})) return;
  await createNotification({
    title: reminder.title || 'SmartPlus herinnering',
    message: reminder.note || 'Je had een SmartPlus-herinnering ingesteld.'
  });
  reminder.notifiedAt = new Date().toISOString();
  reminder.done = true;
  await chrome.storage.local.set({ [STORAGE_KEY]: state });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message) return false;

  if (message.type === 'sp-fetch-grade-pages') {
    fetchGradePages(message.urls || [])
      .then(sendResponse)
      .catch(error => sendResponse({ ok: false, pages: [], error: safeError(error) }));
    return true;
  }

  if (message.type === 'sp-fetch-grade-sources') {
    fetchGradeSources(message.apiUrls || [], message.urls || [])
      .then(sendResponse)
      .catch(error => sendResponse({ ok: false, api: [], pages: [], error: safeError(error) }));
    return true;
  }

  if (message.type === 'sp-schedule-reminder') {
    scheduleReminderAlarm(message.reminder)
      .then(() => sendResponse({ ok: true }))
      .catch(error => sendResponse({ ok: false, error: safeError(error) }));
    return true;
  }

  if (message.type === 'sp-cancel-reminder') {
    chrome.alarms.clear(`${REMINDER_ALARM_PREFIX}${message.id || ''}`, wasCleared => sendResponse({ ok: true, wasCleared }));
    return true;
  }

  if (message.type === 'sp-refresh-reminders') {
    refreshReminderAlarms()
      .then(() => sendResponse({ ok: true }))
      .catch(error => sendResponse({ ok: false, error: safeError(error) }));
    return true;
  }

  if (message.type === 'sp-notify') {
    getState().then(state => {
      if (!notificationsAllowed(state, message.kind || 'general') || isQuietNow(state.notifications || {})) return { ok: true, skipped: true };
      return createNotification({ title: message.title, message: message.message });
    }).then(result => sendResponse(result || { ok: true })).catch(error => sendResponse({ ok: false, error: safeError(error) }));
    return true;
  }

  return false;
});

async function fetchGradeSources(rawApiUrls, rawPageUrls) {
  const apiUrls = normalizeUrls(rawApiUrls, { max: 8, requireSmartschool: true, preferPath: /\/results\/api\//i });
  const pageUrls = normalizeUrls(rawPageUrls, { max: 12, requireSmartschool: true });

  const api = [];
  for (const url of apiUrls) api.push(await fetchOneApi(url));

  const pages = [];
  for (const url of pageUrls) pages.push(await fetchOneHtml(url));

  return { ok: true, api, pages };
}

async function fetchGradePages(rawUrls) {
  const urls = normalizeUrls(rawUrls, { max: 14, requireSmartschool: true });
  const pages = [];
  for (const url of urls) pages.push(await fetchOneHtml(url));
  return { ok: true, pages };
}

function normalizeUrls(rawUrls, options = {}) {
  const max = options.max || 14;
  const seen = new Set();
  const urls = [];

  for (const value of rawUrls) {
    if (typeof value !== 'string') continue;
    let url;
    try { url = new URL(value); } catch (_) { continue; }
    if (url.protocol !== 'https:') continue;
    if (options.requireSmartschool && !url.hostname.endsWith('.smartschool.be') && url.hostname !== 'smartschool.be') continue;
    if (options.preferPath && !options.preferPath.test(url.pathname)) continue;
    const normalized = url.toString();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    urls.push(normalized);
    if (urls.length >= max) break;
  }

  return urls;
}

async function fetchOneApi(url) {
  const started = Date.now();
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      redirect: 'follow',
      cache: 'no-store',
      headers: {
        'Accept': 'application/json, text/javascript, */*;q=0.8',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    const contentType = response.headers.get('content-type') || '';
    let body = await response.text();
    if (body.length > 2500000) body = body.slice(0, 2500000);

    return { url, ok: response.ok, status: response.status, contentType, body, ms: Date.now() - started, kind: 'api' };
  } catch (error) {
    return { url, ok: false, status: 0, contentType: '', body: '', ms: Date.now() - started, kind: 'api', error: safeError(error) };
  }
}

async function fetchOneHtml(url) {
  const started = Date.now();
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      redirect: 'follow',
      cache: 'no-store',
      headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' }
    });
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return { url, ok: false, status: response.status, contentType, html: '', ms: Date.now() - started, error: 'Geen HTML-pagina.' };
    }
    let html = await response.text();
    if (html.length > 1500000) html = html.slice(0, 1500000);
    return { url, ok: response.ok, status: response.status, contentType, html, ms: Date.now() - started };
  } catch (error) {
    return { url, ok: false, status: 0, contentType: '', html: '', ms: Date.now() - started, error: safeError(error) };
  }
}

async function getState() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result?.[STORAGE_KEY] || {};
  } catch (_) {
    return {};
  }
}

function notificationsAllowed(state, kind) {
  const settings = state.notifications || {};
  if (settings.enabled === false) return false;
  if (kind === 'newGrades') return settings.newGrades !== false;
  if (kind === 'timerDone') return settings.timerDone !== false;
  if (kind === 'reminders') return settings.reminders !== false;
  return true;
}

function isQuietNow(settings) {
  if (!settings.quietHours) return false;
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const start = parseTime(settings.quietStart || '22:00');
  const end = parseTime(settings.quietEnd || '07:00');
  return start > end ? (minutes >= start || minutes <= end) : (minutes >= start && minutes <= end);
}

function parseTime(value) {
  const match = String(value || '').match(/(\d{1,2})[:.](\d{2})/);
  if (!match) return 0;
  return Math.max(0, Math.min(1439, Number(match[1]) * 60 + Number(match[2])));
}

async function createNotification({ title, message }) {
  if (!chrome.notifications) return { ok: false, error: 'notifications permission ontbreekt' };
  await chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: String(title || 'SmartPlus').slice(0, 80),
    message: String(message || '').slice(0, 220),
    priority: 1
  });
  return { ok: true };
}

async function scheduleReminderAlarm(reminder) {
  if (!reminder?.id || !reminder.at) return;
  const when = new Date(reminder.at).getTime();
  const alarmName = `${REMINDER_ALARM_PREFIX}${reminder.id}`;
  await chrome.alarms.clear(alarmName);
  if (!Number.isFinite(when) || when <= Date.now()) return;
  await chrome.alarms.create(alarmName, { when });
}

async function refreshReminderAlarms() {
  const state = await getState();
  const reminders = Array.isArray(state.reminders) ? state.reminders : [];
  const existing = await chrome.alarms.getAll();
  await Promise.all(existing.filter(a => a.name.startsWith(REMINDER_ALARM_PREFIX)).map(a => chrome.alarms.clear(a.name)));
  for (const reminder of reminders) {
    if (!reminder.done && reminder.enabled !== false) await scheduleReminderAlarm(reminder);
  }
}

function safeError(error) {
  return error && error.message ? String(error.message).slice(0, 300) : 'Onbekende fout';
}
