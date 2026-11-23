import { describe, it, expect } from 'vitest';
import { aggregate, pct, cloudSize, quizPoints, toCSV, responsesToRows, formatAnswer, errorText, defaultSlide } from '../src/lib/results.js';

const r = (slide_id, participant_id, value, extra = {}) => ({ id: Math.random(), slide_id, participant_id, value, created_at: '2026-01-01T10:00:00Z', ...extra });

describe('aggregate', () => {
  it('poll: ko\'p tanlovni sanaydi va noto\'g\'ri indekslarni e\'tiborsiz qoldiradi', () => {
    const s = { id: 's', type: 'poll', options: ['A', 'B', 'C'] };
    const a = aggregate(s, [r('s', 'u1', { choices: [0, 2] }), r('s', 'u2', { choices: [2, 9] }), r('x', 'u3', { choices: [1] })]);
    expect(a).toEqual({ kind: 'bars', counts: [1, 0, 2], total: 2 });
  });
  it('quiz: choice bo\'yicha', () => {
    const s = { id: 's', type: 'quiz', options: ['A', 'B'] };
    expect(aggregate(s, [r('s', 'a', { choice: 1 }), r('s', 'b', { choice: 1 })]).counts).toEqual([0, 2]);
  });
  it('scale: o\'rtacha', () => {
    const s = { id: 's', type: 'scale', options: ['X', 'Y'] };
    const a = aggregate(s, [r('s', 'a', { ratings: [2, 5] }), r('s', 'b', { ratings: [4, 3] })]);
    expect(a.averages).toEqual([3, 4]);
    expect(aggregate(s, []).averages).toEqual([null, null]);
  });
  it('wordcloud: registrsiz chastota, tartiblangan', () => {
    const s = { id: 's', type: 'wordcloud' };
    const a = aggregate(s, [r('s', 'a', { words: ['Zo\'r', 'yangi'] }), r('s', 'b', { words: ['zo\'r '] })]);
    expect(a.words).toEqual([{ text: 'zo\'r', count: 2 }, { text: 'yangi', count: 1 }]);
  });
  it('open: eng yangisi birinchi', () => {
    const s = { id: 's', type: 'open' };
    const a = aggregate(s, [r('s', 'a', { text: 'eski' }, { id: 1, created_at: '2026-01-01' }), r('s', 'b', { text: 'yangi' }, { id: 2, created_at: '2026-01-02' })]);
    expect(a.items.map((i) => i.text)).toEqual(['yangi', 'eski']);
  });
});

describe('yordamchilar', () => {
  it('pct', () => { expect(pct(1, 3)).toBe(33); expect(pct(5, 0)).toBe(0); });
  it('cloudSize chegaralar', () => { expect(cloudSize(1, 1)).toBe(2); expect(cloudSize(1, 10)).toBe(1); expect(cloudSize(10, 10)).toBe(4.2); });
  it('quizPoints', () => {
    expect(quizPoints(false, 1, 20)).toBe(0);
    expect(quizPoints(true, 0, 20)).toBe(1000);
    expect(quizPoints(true, 10, 20)).toBe(750);
    expect(quizPoints(true, 99, 20)).toBe(500);
  });
  it('defaultSlide har tur uchun', () => {
    for (const t of ['poll', 'quiz', 'scale', 'wordcloud', 'open', 'qa']) expect(defaultSlide(t).type).toBe(t);
    expect(defaultSlide('quiz').settings.correct).toBe(0);
  });
  it('errorText kodlarni tarjima qiladi', () => {
    expect(errorText(new Error('ALREADY_ANSWERED'))).toMatch(/allaqachon/);
    expect(errorText({ message: 'Invalid login credentials' })).toMatch(/parol/);
    expect(errorText('???')).toMatch(/Xatolik/);
  });
});

describe('CSV', () => {
  it('qochirish va formula injection himoyasi', () => {
    const csv = toCSV([['a', 'b,c', 'd"e', '=SUM(A1)']]);
    expect(csv).toBe('﻿a,"b,c","d""e",\'=SUM(A1)');
  });
  it('responsesToRows', () => {
    const slides = [{ id: 's1', type: 'poll', question: 'Q?', options: ['Ha', "Yo'q"] }];
    const rows = responsesToRows(slides, [r('s1', 'u1', { choices: [1] }), r('gone', 'u1', {})], [{ id: 'u1', name: 'Ali' }]);
    expect(rows).toHaveLength(2);
    expect(rows[1].slice(0, 6)).toEqual([1, "So'rovnoma", 'Q?', 'Ali', "Yo'q", 0]);
  });
  it('formatAnswer', () => {
    expect(formatAnswer({ type: 'scale', options: ['A'] }, { ratings: [4] })).toBe('A: 4');
    expect(formatAnswer({ type: 'wordcloud' }, { words: ['x', 'y'] })).toBe('x; y');
  });
});
