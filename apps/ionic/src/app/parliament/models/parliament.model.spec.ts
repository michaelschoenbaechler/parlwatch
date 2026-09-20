import {
  CANTONS,
  cantonOf,
  cantonTheme,
  coatOfArmsPath,
  FEDERAL_PARLIAMENT_KEY,
  isCantonal,
  isCantonKey,
  isParliamentKey,
  toParliamentKey
} from './parliament.model';

const CANTON_KEYS = [
  'AG',
  'AI',
  'AR',
  'BE',
  'BL',
  'BS',
  'FR',
  'GE',
  'GL',
  'GR',
  'JU',
  'LU',
  'NE',
  'NW',
  'OW',
  'SG',
  'SH',
  'SO',
  'SZ',
  'TG',
  'TI',
  'UR',
  'VD',
  'VS',
  'ZG',
  'ZH'
] as const;

const CSS_COLOUR = /^#[0-9a-f]{6}$/;

describe('parliament model', () => {
  it('knows all 26 cantons, each with two colours, a name and a website', () => {
    expect(CANTONS.map((canton) => canton.key).sort()).toEqual([
      ...CANTON_KEYS
    ]);

    for (const canton of CANTONS) {
      expect(canton.colours.length).withContext(canton.key).toBe(2);
      expect(canton.colours[0]).withContext(canton.key).toMatch(CSS_COLOUR);
      expect(canton.colours[1]).withContext(canton.key).toMatch(CSS_COLOUR);
      expect(canton.name).withContext(canton.key).not.toBe('');
      expect(canton.websiteUrl)
        .withContext(canton.key)
        .toMatch(/^https:\/\//);
    }
  });

  it('lists the cantons alphabetically by German name for the settings', () => {
    const names = CANTONS.map((canton) => canton.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'de')));
  });

  it('resolves every canton to a theme with two colours and a coat of arms', () => {
    for (const key of CANTON_KEYS) {
      const theme = cantonTheme(key);
      expect(theme).withContext(key).not.toBeNull();
      expect(theme?.colours.length).withContext(key).toBe(2);
      expect(theme?.coatOfArms)
        .withContext(key)
        .toBe(`/assets/cantons/${key.toLowerCase()}.svg`);
      expect(theme?.name).withContext(key).toBe(cantonOf(key).name);
    }
  });

  it('paints the whole accent line in the other colour when one is white', () => {
    expect(cantonTheme('ZH')?.colours).toEqual(['#0066b3', '#0066b3']);
    expect(cantonTheme('LU')?.colours).toEqual(['#0066b3', '#0066b3']);
    expect(cantonTheme('BE')?.colours).toEqual(['#e30613', '#000000']);
  });

  it('resolves the federal parliament to no cantonal theme', () => {
    expect(cantonTheme(FEDERAL_PARLIAMENT_KEY)).toBeNull();
    expect(isCantonal(FEDERAL_PARLIAMENT_KEY)).toBeFalse();
    expect(isCantonal('ZH')).toBeTrue();
  });

  it('accepts only ch and the canton abbreviations as parliament keys', () => {
    expect(isParliamentKey('ch')).toBeTrue();
    expect(isParliamentKey('ZH')).toBeTrue();
    expect(isParliamentKey('zh')).toBeFalse();
    expect(isParliamentKey('XX')).toBeFalse();
    expect(isParliamentKey(null)).toBeFalse();
    expect(isCantonKey('ch')).toBeFalse();
    expect(isCantonKey(42)).toBeFalse();
  });

  it('falls back to the federal parliament for anything unknown', () => {
    expect(toParliamentKey('BE')).toBe('BE');
    expect(toParliamentKey(undefined)).toBe('ch');
    expect(toParliamentKey('be')).toBe('ch');
    expect(toParliamentKey('')).toBe('ch');
  });

  it('points the coat of arms at the bundled asset', () => {
    expect(coatOfArmsPath('GR')).toBe('/assets/cantons/gr.svg');
  });
});
