import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CATALOGS } from '#i18n';
import { PAGES } from '#onboarding';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const body = html.slice(html.indexOf('<body'), html.indexOf('<script type="importmap">'));

const textKeys = [...body.matchAll(/data-i18n="([^"]+)"/g)].map(([, key]) => key);
const attrKeys = [...body.matchAll(/data-i18n-attr="([^"]+)"/g)].flatMap(([, pairs]) =>
  pairs.split(',').map((pair) => pair.split(':')[1]));

test('the page has translated text and translated attributes', () => {
  assert.ok(textKeys.length > 0);
  assert.ok(attrKeys.length > 0);
});

test('each key of the page is in the Spanish catalog', () => {
  for (const key of [...textKeys, ...attrKeys]) assert.ok(Object.hasOwn(CATALOGS.es, key), key);
});

test('an element with a text key is empty in the markup', () => {
  for (const [, key, text] of body.matchAll(/data-i18n="([^"]+)"[^>]*>([^<]*)</g)) assert.equal(text.trim(), '', key);
});

test('the markup has no text of its own', () => {
  const visible = body
    .replace(/<svg[\s\S]*?<\/svg>/g, '')
    .replace(/<span class="chevron"[^>]*>[^<]*<\/span>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[+\s]/g, '');
  assert.equal(visible, '');
  assert.doesNotMatch(body, /\s(aria-label|placeholder|title)="/);
});

// Each sheet: its layer, the veil that closes it and the form of the dialog.
const sheetOf = (name) => body.match(new RegExp(`<div id="${name}-sheet" class="sheet-layer"[\\s\\S]*?<\\/form>\\s*<\\/div>`))?.[0] ?? '';

test('each sheet has a veil and a dialog form', () => {
  for (const name of ['type', 'cycle']) {
    const layer = sheetOf(name);
    assert.match(layer, new RegExp(`<div id="${name}-veil" class="sheet-veil">`), name);
    assert.match(layer, new RegExp(`<form id="${name}-form" class="sheet" role="dialog"`), name);
  }
});

test('each sheet has a head with its title and Close, and a body (DAY-3, PLN-5)', () => {
  for (const name of ['day', 'type', 'cycle']) {
    const layer = sheetOf(name);
    assert.match(layer, new RegExp(`<header class="sheet-head"><h2 id="${name}-sheet-title" class="sheet-title main( wrap)?"></h2><button id="${name}-close" class="button icon" type="button"`), name);
    assert.match(layer, /<div (id="[\w-]+" )?class="sheet-body">/, name);
  }
});

test('the type and the cycle sheet end with a foot of Delete and Save (PLN-5)', () => {
  for (const name of ['type', 'cycle']) {
    assert.match(sheetOf(name), new RegExp(`<footer class="sheet-foot">\\s*<button id="${name}-delete" class="button outline danger"[\\s\\S]*<button class="button primary" type="submit"`), name);
  }
});

test('the empty list of shift types offers Add shift type (PLN-1)', () => {
  assert.match(body, /<div id="types-empty" class="empty-state">\s*<p data-i18n="plan.noTypes"><\/p>\s*<button id="types-add" class="button primary" type="button" data-i18n="plan.addType">/);
});

test('the type sheet limits the name and the code to the lengths of the doc (SHF-3)', () => {
  const layer = sheetOf('type');
  assert.match(layer, /<input id="type-name"[^>]*maxlength="30"/);
  assert.match(layer, /<input id="type-code"[^>]*maxlength="3"/);
});

test('the walkthrough has one drawing for each page, in the order of the pages', () => {
  const [layer = ''] = body.match(/<div id="onboarding"[\s\S]*?<input id="import-file"/) ?? [];
  const drawings = [...layer.matchAll(/<svg data-page="([^"]+)"/g)].map(([, page]) => page);
  assert.deepEqual(drawings, PAGES);
});

test('the walkthrough shows the app icon first, out of the page that changes, with no text', () => {
  const [, layer = ''] = body.match(/<div id="onboarding"[^>]*>\s*([\s\S]*?)<div id="onboarding-page"/) ?? [];
  assert.match(layer, /^<img class="onboarding-logo" src="\.\/icons\/logo\.png" alt="">\s*$/);
});

test('the walkthrough has Saltar and the next button in one bar at the bottom, Saltar first', () => {
  const [bar = ''] = body.match(/<div class="onboarding-actions">[\s\S]*?<\/div>/) ?? [];
  const buttons = [...bar.matchAll(/<button id="([^"]+)"/g)].map(([, id]) => id);
  assert.deepEqual(buttons, ['onboarding-skip', 'onboarding-next']);
  assert.doesNotMatch(body, /onboarding-top/);
});

test('the What\'s new sheet has a veil, a dialog with its title and Close, and a body (VER-22)', () => {
  const [layer = ''] = body.match(/<div id="whatsnew-sheet" class="sheet-layer"[\s\S]*?<\/section>\s*<\/div>/) ?? [];
  assert.match(layer, /<div id="whatsnew-veil" class="sheet-veil">/);
  assert.match(layer, /<section id="whatsnew" class="sheet" role="dialog" aria-modal="true" aria-labelledby="whatsnew-title">/);
  assert.match(layer, /<h2 id="whatsnew-title" class="sheet-title main" data-i18n="whatsNew.title"><\/h2><button id="whatsnew-close" class="button tonal" type="button" data-i18n="whatsNew.close"><\/button>/);
  assert.match(layer, /<div id="whatsnew-body" class="sheet-body whatsnew-body"><\/div>/);
});

test('Help in Settings has the What\'s new row after the introduction, hidden until there are notes (VER-23)', () => {
  assert.match(body, /<button id="show-onboarding"[^\n]*<\/button>\s*<button id="show-whatsnew" class="settings-row" type="button" hidden><span class="settings-row-label" data-i18n="settings.whatsNew"><\/span><span class="chevron" aria-hidden="true">›<\/span><\/button>/);
});

test('the account screens cover the app: Sign in with Google or offline, and Waiting for approval (ACC-2)', () => {
  const [layer = ''] = body.match(/<section id="auth" class="account" role="dialog" aria-modal="true"[\s\S]*?<\/section>/) ?? [];
  assert.match(layer, /<div id="login" class="account-page">/);
  assert.match(layer, /<h2 id="login-title" class="account-title" tabindex="-1" data-i18n="account.login.title">/);
  assert.match(layer, /<button id="login-google" class="button tonal wide" type="button"><svg class="icon small" aria-hidden="true"><use href="icons.svg#google"\/><\/svg>/);
  assert.match(layer, /<p id="login-error" class="input-help danger" role="alert" hidden><\/p>\s*<button id="login-offline" class="button accent" type="button" data-i18n="account.offline"><\/button>/);
  assert.match(layer, /<div id="waiting" class="account-page" hidden>/);
  assert.match(layer, /<h2 id="waiting-title" class="account-title" tabindex="-1" data-i18n="account.waiting.title">/);
  const buttons = [...layer.matchAll(/<button id="(waiting-[^"]+)"/g)].map(([, id]) => id);
  assert.deepEqual(buttons, ['waiting-check', 'waiting-logout']);
});

test('Settings has the Account group: the email and Log out, or Sign in with Google (ACC-8)', () => {
  const [group = ''] = body.match(/<div id="account-group" hidden>[\s\S]*?<\/div>\s*<\/div>/) ?? [];
  assert.match(group, /data-i18n="settings.account"/);
  assert.match(group, /<span id="account-email" class="settings-row-label"><\/span>/);
  assert.match(group, /<div id="account-row" class="settings-row"><span id="account-email" class="settings-row-label"><\/span><\/div>/);
  assert.match(group, /<button id="logout" class="settings-row" type="button">/);
  assert.match(group, /<button id="account-login" class="settings-row" type="button"><span class="settings-row-label" data-i18n="account.signIn"><\/span>/);
});

test('Backup ends with Delete all data, a danger row with no chevron (SET-2)', () => {
  assert.match(body, /<button id="import" class="settings-row" type="button">.*?<\/button>\s*<button id="reset" class="settings-row danger" type="button"><span class="settings-row-label" data-i18n="settings.reset"><\/span><\/button>\s*<\/div>/);
});
