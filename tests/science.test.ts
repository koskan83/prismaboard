import { describe, expect, it } from 'vitest';
import { SCIENCE_KIDS, VOLTS, circuitSettle, field, lampSpots, lampVolts, stateOf } from '../src/kids/science';

const V = (v: number) => VOLTS.indexOf(v);
/** Πάτημα στο κέντρο του κουμπιού με αυτό το id (κουτί 960 × 640). */
const press = (name: string, v: number[], label: RegExp) => {
  const d = SCIENCE_KIDS[name];
  // τα κουμπιά είναι στη σειρά y = 548…616· ψάχνουμε από αριστερά με βήμα 10 το πρώτο που αλλάζει την κατάσταση όπως θέλουμε
  for (let x = 30; x < 950; x += 10) {
    const next = d.tap!(v, x, 580, 960, 640);
    if (next && label.test(JSON.stringify(next))) return next;
  }
  return null;
};

describe('κύκλωμα με λαμπάκια', () => {
  it('ανοιχτός διακόπτης: κανένα ρεύμα· κλειστός: η λάμπα παίρνει την τάση', () => {
    expect(lampVolts([V(4.5), 1, 0, 0, 0])).toEqual([0]);
    expect(lampVolts([V(4.5), 1, 0, 1, 0])).toEqual([4.5]);
  });
  it('δύο σε σειρά μοιράζονται την τάση· παράλληλα παίρνουν όλη', () => {
    expect(lampVolts([V(9), 2, 0, 1, 0])).toEqual([4.5, 4.5]);
    expect(lampVolts([V(3), 2, 1, 1, 0])).toEqual([3, 3]);
  });
  it('με μεγάλη τάση η λάμπα καίγεται· σε σειρά καίγεται μία και σβήνουν όλες, παράλληλα συνεχίζει η άλλη', () => {
    expect(circuitSettle([V(9), 1, 0, 1, 0])[4]).toBe(1);
    expect(circuitSettle([V(6), 1, 0, 1, 0])[4]).toBe(0);
    const series = circuitSettle([V(12) + 0, 2, 0, 1, 0]);
    expect(series[4]).toBe(0); // 12 V σε δύο: 6 V η καθεμία, δεν καίγονται
    const hot = circuitSettle([V(9), 2, 1, 1, 0]);
    expect(hot[4]).toBe(3);
    expect(lampVolts([V(9), 2, 1, 1, 1])).toEqual([0, 9]);
    expect(lampVolts([V(4.5), 2, 0, 1, 1])).toEqual([0, 0]);
    // με τον διακόπτη ανοιχτό τίποτα δεν καίγεται
    expect(circuitSettle([V(12), 1, 0, 0, 0])[4]).toBe(0);
  });
  it('χαλάς μία λάμπα: σε σειρά σβήνουν όλες, παράλληλα οι άλλες συνεχίζουν', () => {
    const d = SCIENCE_KIDS['lab-circuit'];
    for (const par of [0, 1]) {
      const v = [V(4.5), 3, par, 1, 0];
      const [x, y] = lampSpots(3, par)[1];
      // πάτημα πάνω στη 2η λάμπα
      const broken = d.tap!(v, x, y - 45, 960, 640)!;
      expect(broken[4]).toBe(2);
      expect(lampVolts(broken)).toEqual(par ? [4.5, 0, 4.5] : [0, 0, 0]);
      // ξανά πάτημα: φτιάχνεται
      expect(d.tap!(broken, x, y - 45, 960, 640)![4]).toBe(0);
    }
  });
  it('ως 3 λάμπες: σε σειρά μοιράζονται την τάση, παράλληλα την παίρνει όλη η καθεμία', () => {
    expect(lampVolts([V(9), 3, 0, 1, 0])).toEqual([3, 3, 3]);
    expect(lampVolts([V(4.5), 3, 1, 1, 0])).toEqual([4.5, 4.5, 4.5]);
    // 9 V παράλληλα: καίγονται και οι τρεις· σε σειρά (3 V η καθεμία) καμία
    expect(circuitSettle([V(9), 3, 1, 1, 0])[4]).toBe(7);
    expect(circuitSettle([V(9), 3, 0, 1, 0])[4]).toBe(0);
    // το κουμπί των λαμπών: 1 → 2 → 3 → 1
    const d = SCIENCE_KIDS['lab-circuit'];
    const cycle = (v: number[]) => press('lab-circuit', v, new RegExp(`^\\[2,${(v[1] % 3) + 1},`))!;
    expect(cycle([2, 1, 0, 0, 0])[1]).toBe(2);
    expect(cycle([2, 3, 0, 0, 0])[1]).toBe(1);
    expect(d.tap!([2, 3, 0, 0, 0], 900, 100, 960, 640)).toBeNull();
  });
  it('τα κουμπιά: τάση πάνω, διακόπτης, και ήχος όταν καίγεται', () => {
    const d = SCIENCE_KIDS['lab-circuit'];
    const up = press('lab-circuit', [V(4.5), 1, 0, 1, 0], /^\[3,/)!;
    expect(up).toEqual([V(6), 1, 0, 1, 0]);
    expect(d.fx!([V(6), 1, 0, 1, 0], [V(9), 1, 0, 1, 1])).toBe('bad');
    // πάτημα πάνω στον διακόπτη
    expect(d.tap!([2, 1, 0, 0, 0], 185, 280, 960, 640)).toEqual([2, 1, 0, 1, 0]);
  });
});

describe('ήχος, θερμότητα, μαγνήτης', () => {
  it('κάθε αλλαγή στον ήχο ακούγεται στο ύψος και την ένταση που διαλέχτηκαν', () => {
    expect(SCIENCE_KIDS['lab-sound'].fx!([2, 1, 0], [3, 1, 1])).toBe('tone|587|1');
  });
  it('πάγος κάτω από 0 °C, νερό ως τους 100 °C, ατμός μετά', () => {
    expect([-10, 0, 50, 99, 100, 110].map(stateOf)).toEqual([0, 1, 1, 1, 2, 2]);
    const d = SCIENCE_KIDS['lab-heat'];
    expect(d.fx!([-10, 1], [0, 1])).toBe('pop');
    expect(d.fx!([40, 1], [50, 1])).toBe('click');
  });
  it('οι πυξίδες: δίπλα στον βόρειο πόλο το πεδίο φεύγει από τον μαγνήτη, μακριά δείχνει τον βορρά', () => {
    // μαγνήτης στη μέση (x = 480, y = 260), οριζόντιος, ο βόρειος πόλος δεξιά
    const v = [50, 50, 0, 0, 0, 1];
    expect(field(v, 650, 260)[0]).toBeGreaterThan(0);
    expect(field(v, 310, 260)[0]).toBeGreaterThan(0);
    // ηλεκτρομαγνήτης χωρίς ρεύμα: μόνο ο βορράς (προς τα πάνω)
    expect(field([50, 50, 0, 0, 1, 0], 650, 260)).toEqual([0, -1.2]);
  });
  it('το σύρσιμο: ο φακός και ο μαγνήτης πιάνονται μόνο από πάνω τους', () => {
    const light = SCIENCE_KIDS['lab-light'], mag = SCIENCE_KIDS['lab-magnet'];
    expect(light.paint!([30, 0, 1], 900, 100, 960, 640, {}, true)).toBeNull();
    expect(light.paint!([30, 0, 1], 196, 270, 960, 640, {}, true)).toEqual([30, 0, 1]);
    expect(mag.paint!([50, 50, 0, 0, 0, 1], 480, 260, 960, 640, {}, true)).toEqual([50, 50, 0, 0, 0, 1]);
    expect(mag.paint!([50, 50, 0, 0, 0, 1], 40, 40, 960, 640, {}, true)).toBeNull();
  });
});
