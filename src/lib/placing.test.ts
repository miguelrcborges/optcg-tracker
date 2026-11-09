import { describe, expect, it } from 'vitest';
import {
  formatOrdinal,
  formatPlacing,
  getPlacingTone,
} from './placing';

describe('formatOrdinal', () => {
  it('uses the correct suffix', () => {
    expect(formatOrdinal(1)).toBe('1st');
    expect(formatOrdinal(2)).toBe('2nd');
    expect(formatOrdinal(3)).toBe('3rd');
    expect(formatOrdinal(4)).toBe('4th');
    expect(formatOrdinal(11)).toBe('11th');
    expect(formatOrdinal(12)).toBe('12th');
    expect(formatOrdinal(13)).toBe('13th');
    expect(formatOrdinal(21)).toBe('21st');
    expect(formatOrdinal(22)).toBe('22nd');
    expect(formatOrdinal(23)).toBe('23rd');
    expect(formatOrdinal(101)).toBe('101st');
    expect(formatOrdinal(111)).toBe('111th');
  });
});

describe('formatPlacing', () => {
  it('appends the total player count', () => {
    expect(formatPlacing(3, 24)).toBe('3rd/24');
    expect(formatPlacing(1, 8)).toBe('1st/8');
  });

  it('shows only the placing without a player count', () => {
    expect(formatPlacing(5)).toBe('5th');
  });

  it('returns null when there is no placing', () => {
    expect(formatPlacing(undefined, 24)).toBeNull();
  });
});

describe('getPlacingTone', () => {
  it('awards gold for a top 8 finish within the top 3.125%', () => {
    expect(getPlacingTone(1, 32)).toBe('gold');
    expect(getPlacingTone(3, 96)).toBe('gold');
    expect(getPlacingTone(8, 256)).toBe('gold');
  });

  it('awards silver for a top 32 finish within the top 12.5%', () => {
    expect(getPlacingTone(3, 48)).toBe('silver');
    expect(getPlacingTone(9, 100)).toBe('silver');
    expect(getPlacingTone(32, 256)).toBe('silver');
  });

  it('awards bronze for a top 64 finish within the top 25%', () => {
    expect(getPlacingTone(10, 64)).toBe('bronze');
    expect(getPlacingTone(16, 64)).toBe('bronze');
    expect(getPlacingTone(64, 256)).toBe('bronze');
  });

  it('uses a neutral tone outside the medal thresholds', () => {
    expect(getPlacingTone(10, 39)).toBe('neutral');
    expect(getPlacingTone(65, 400)).toBe('neutral');
    expect(getPlacingTone(3)).toBe('neutral');
    expect(getPlacingTone(undefined, 24)).toBe('neutral');
  });
});
