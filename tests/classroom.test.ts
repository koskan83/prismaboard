import { describe, expect, it } from 'vitest';
import { LIMITS, limitForVoice, pieFraction, pieSector, pieTicks, rmsToLevel, smooth, zoneOf } from '../src/classroom';

describe('Εργαλεία τάξης', () => {
  it('RMS σε στάθμη 0..100', () => {
    expect(rmsToLevel(0)).toBe(0);
    expect(rmsToLevel(0.0005)).toBe(0);
    expect(rmsToLevel(1)).toBe(100);
    expect(rmsToLevel(0.0316)).toBeCloseTo(60, 0);
  });
  it('η εξομάλυνση ανεβαίνει πιο γρήγορα απ\' όσο πέφτει', () => {
    expect(smooth(0, 100)).toBeGreaterThan(100 - smooth(100, 0));
  });
  it('όρια ανά επίπεδο φωνής', () => {
    expect(LIMITS[0]! < LIMITS[1]! && LIMITS[1]! < LIMITS[2]!).toBe(true);
    expect(limitForVoice(0)).toBe(LIMITS[0]);
    expect(limitForVoice(null)).toBe(55);
  });
  it('ζώνες μετρητή', () => {
    expect([zoneOf(10, 50), zoneOf(40, 50), zoneOf(50, 50)]).toEqual([0, 1, 2]);
  });
  it('κλάσμα και τομέας της πίτας', () => {
    expect(pieFraction(150_000, 300_000)).toBe(0.5);
    expect(pieFraction(-5, 300_000)).toBe(0);
    expect(pieFraction(5, 0)).toBe(0);
    expect(pieSector(0, 100, 100, 80)).toBe('');
    expect(pieSector(0.25, 100, 100, 80)).toBe('M100 100L100 20A80 80 0 0 1 180 100Z');
    expect(pieSector(0.75, 100, 100, 80)).toContain('0 1 1 20 100');
    expect(pieSector(1, 100, 100, 80)).toContain('A80 80 0 1 1');
  });
  it('χαραγές ανά λεπτό ή 12', () => {
    expect(pieTicks(5 * 60_000)).toBe(5);
    expect(pieTicks(90 * 60_000)).toBe(12);
    expect(pieTicks(20_000)).toBe(12);
  });
});
