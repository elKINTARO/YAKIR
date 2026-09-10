import { describe, expect, it } from 'vitest';

import { clamp, ratioFromValue, valueFromRatio } from '@/ui/slider-math';

describe('clamp', () => {
  it.each([
    [-1, 0],
    [5, 5],
    [11, 10],
  ])('brings %i into range as %i', (input, expected) => {
    expect(clamp(input, 0, 10)).toBe(expected);
  });
});

describe('valueFromRatio', () => {
  it('maps the ends of the track to the ends of the scale', () => {
    expect(valueFromRatio(0, 0, 10, 1)).toBe(0);
    expect(valueFromRatio(1, 0, 10, 1)).toBe(10);
  });

  it('rounds to the nearest notch', () => {
    expect(valueFromRatio(0.44, 0, 10, 1)).toBe(4);
    expect(valueFromRatio(0.46, 0, 10, 1)).toBe(5);
  });

  it('honours a step larger than one', () => {
    expect(valueFromRatio(0.42, 0, 100, 5)).toBe(40);
    expect(valueFromRatio(0.43, 0, 100, 5)).toBe(45);
  });

  it('never leaves the scale when the finger goes past the track', () => {
    expect(valueFromRatio(-0.5, 0, 10, 1)).toBe(0);
    expect(valueFromRatio(1.5, 0, 10, 1)).toBe(10);
  });
});

describe('ratioFromValue', () => {
  it('places a value along the track', () => {
    expect(ratioFromValue(0, 0, 10)).toBe(0);
    expect(ratioFromValue(5, 0, 10)).toBe(0.5);
    expect(ratioFromValue(10, 0, 10)).toBe(1);
  });

  it('clamps a value from outside the scale', () => {
    expect(ratioFromValue(-3, 0, 10)).toBe(0);
    expect(ratioFromValue(30, 0, 10)).toBe(1);
  });

  it('returns the low end for an empty scale', () => {
    expect(ratioFromValue(5, 5, 5)).toBe(0);
  });
});
