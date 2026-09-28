import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildPatchesPath, resolvePatchColor } from '../../src/dom/patches.js';

describe('patches mode', () => {
  test('buildPatchesPath generates wedge overlays at concave corners', () => {
    // L-shaped configuration of two touching rects
    // Rect 1: [0, 0, 100, 100]
    // Rect 2: [100, 40, 60, 60]
    // Concave corner is at (100, 40)
    const rects = [
      { x: 0, y: 0, w: 100, h: 100 },
      { x: 100, y: 40, w: 60, h: 60 }
    ];

    const patchPath = buildPatchesPath(rects, { radius: 10, concaveRadius: 10 });
    assert.ok(patchPath.length > 0, 'should generate patch path');

    // Should contain M, L, L, A, Z
    const commands = patchPath.match(/[MLAZ]/g);
    assert.deepEqual(commands, ['M', 'L', 'L', 'A', 'Z']);

    // The wedge arc has sweep 1 (curving back along the bite)
    assert.ok(patchPath.includes(' 0 0 1 '));
  });

  test('buildPatchesPath returns empty string if no concave corners', () => {
    // Single rectangle has only convex corners
    const rects = [{ x: 0, y: 0, w: 100, h: 100 }];
    const patchPath = buildPatchesPath(rects, { radius: 10 });
    assert.equal(patchPath, '');
  });

  test('resolvePatchColor honors explicit color and fallbacks', () => {
    assert.equal(resolvePatchColor([], '#ff0000'), '#ff0000');
    assert.equal(resolvePatchColor([]), 'currentColor');
  });
});
