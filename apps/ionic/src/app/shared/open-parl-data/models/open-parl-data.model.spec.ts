import {
  languageQuery,
  localized,
  relationList,
  toODataDate
} from './open-parl-data.model';

describe('OpenParlData model helpers', () => {
  describe('localized', () => {
    it('prefers the app language', () => {
      expect(localized({ de: 'Bern', fr: 'Berne' }, 'de')).toBe('Bern');
      expect(localized({ de: 'Bern', fr: 'Berne' }, 'fr')).toBe('Berne');
    });

    it('falls back de → fr → it → rm → en when the language is missing', () => {
      expect(localized({ fr: 'Rapport' }, 'de')).toBe('Rapport');
      expect(localized({ it: 'Mozione', rm: 'Moziun' }, 'de')).toBe('Mozione');
      expect(localized({ en: 'Motion' }, 'de')).toBe('Motion');
    });

    it('treats blank, null and missing fields as empty', () => {
      expect(localized({ de: '  ', fr: null }, 'de')).toBe('');
      expect(localized({}, 'de')).toBe('');
      expect(localized(undefined, 'de')).toBe('');
      expect(localized(null, 'de')).toBe('');
    });
  });

  describe('languageQuery', () => {
    it('asks for the app language with the other languages as fallback', () => {
      expect(languageQuery('de')).toEqual({
        lang: 'de',
        lang_fallback: 'fr,it,rm,en'
      });
      expect(languageQuery('fr').lang_fallback).toBe('de,it,rm,en');
    });
  });

  describe('relationList', () => {
    it('reads a paged relation, a bare array and nothing at all', () => {
      expect(relationList({ data: [1, 2] })).toEqual([1, 2]);
      expect(relationList([3])).toEqual([3]);
      expect(relationList({})).toEqual([]);
      expect(relationList(null)).toEqual([]);
      expect(relationList(undefined)).toEqual([]);
    });
  });

  describe('toODataDate', () => {
    it('reads the API wall-clock time as UTC ticks', () => {
      expect(toODataDate('2026-09-14T07:42:13')).toBe(
        `/Date(${Date.UTC(2026, 8, 14, 7, 42, 13)})/`
      );
      expect(toODataDate('2023-05-08')).toBe(`/Date(${Date.UTC(2023, 4, 8)})/`);
    });

    it('keeps an explicit offset', () => {
      expect(toODataDate('2026-09-14T07:42:13+02:00')).toBe(
        `/Date(${Date.UTC(2026, 8, 14, 5, 42, 13)})/`
      );
      expect(toODataDate('2026-09-14T07:42:13Z')).toBe(
        `/Date(${Date.UTC(2026, 8, 14, 7, 42, 13)})/`
      );
    });

    it('returns an empty string for missing or unusable values', () => {
      expect(toODataDate(null)).toBe('');
      expect(toODataDate(undefined)).toBe('');
      expect(toODataDate('not a date')).toBe('');
    });
  });
});
