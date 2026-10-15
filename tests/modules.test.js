import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MODULES, switchModule, visibleSections } from '#modules';

const ALL = ['month', 'agenda', 'plan', 'settings'];

test('MODULES is agenda', () => {
  assert.deepEqual(MODULES, ['agenda']);
});

test('visibleSections with no module off is the full navigation', () => {
  assert.deepEqual(visibleSections([]), ALL);
});

test('visibleSections without agenda keeps the other sections', () => {
  assert.deepEqual(visibleSections(['agenda']), ['month', 'plan', 'settings']);
});

test('an unknown module hides nothing', () => {
  assert.deepEqual(visibleSections(['shops']), ALL);
});

test('switchModule turns a module off and on', () => {
  assert.deepEqual(switchModule([], 'agenda', false), ['agenda']);
  assert.deepEqual(switchModule(['agenda'], 'agenda', true), []);
  assert.deepEqual(switchModule([], 'agenda', true), []);
});

test('switchModule keeps the known modules only and does not change its input', () => {
  const off = ['agenda'];
  assert.deepEqual(switchModule(off, 'shops', false), ['agenda']);
  assert.deepEqual(off, ['agenda']);
});
