import { Business, Transcript } from 'swissparl';
import {
  toBusinessTextSections,
  toPlainText,
  toTextSection
} from '../../../business/models/business-text';
import { odataList, odataTimestamp } from './odata.model';
import {
  cleanTranscriptText,
  groupSpeechesByBusiness,
  SpeechVm,
  toDebateStages,
  toSpeeches,
  toStageLabel,
  withSubjectTitles
} from './transcript.model';

const speech = (overrides: Partial<SpeechVm>): SpeechVm => ({
  id: 1,
  subjectId: 0,
  council: '',
  speakerFunction: '',
  language: '',
  start: '',
  title: '',
  businessShortNumber: '',
  speaker: '',
  parlGroup: '',
  sortOrder: 0,
  ...overrides
});

describe('transcript model', () => {
  it('strips typesetting codes and collapses whitespace', () => {
    expect(cleanTranscriptText('<p>Guten  Tag[GZ]\n allerseits</p>')).toBe(
      '<p>Guten Tag allerseits</p>'
    );
    expect(cleanTranscriptText(undefined)).toBe('');
  });

  it('maps transcript rows onto speeches, dropping rows without an id', () => {
    const speeches = toSpeeches([
      { ID: '12' as never, IdSubject: '7' as never, SpeakerFullName: ' A ' },
      { ID: undefined },
      { ID: 'x' as never }
    ] as Transcript[]);

    expect(speeches.length).toBe(1);
    expect(speeches[0].id).toBe(12);
    expect(speeches[0].subjectId).toBe(7);
    expect(speeches[0].speaker).toBe('A');
    expect(speeches[0].council).toBe('');
  });

  it('groups speeches by business, item or on their own', () => {
    const groups = groupSpeechesByBusiness([
      speech({ id: 1, businessShortNumber: '26.001', title: 'One' }),
      speech({ id: 2, businessShortNumber: '26.001' }),
      speech({ id: 3, subjectId: 9 }),
      speech({ id: 4 })
    ]);

    expect(groups.map((group) => group.key)).toEqual([
      '26.001',
      'subject-9',
      'speech-4'
    ]);
    expect(groups[0].speeches.length).toBe(2);
    expect(groups[0].title).toBe('One');
  });

  it('fills in titles where a subject is known', () => {
    const labelled = withSubjectTitles(
      [speech({ id: 1, subjectId: 5 }), speech({ id: 2, subjectId: 6 })],
      { 5: { title: 'Five', businessShortNumber: '26.005' } }
    );

    expect(labelled[0].title).toBe('Five');
    expect(labelled[0].businessShortNumber).toBe('26.005');
    expect(labelled[1].title).toBe('');
  });

  it('arranges a debate into stages by date and position', () => {
    const stages = toDebateStages(
      [
        speech({ id: 1, subjectId: 2, start: '/Date(5000)/', sortOrder: 2 }),
        speech({ id: 2, subjectId: 2, start: '/Date(4000)/', sortOrder: 1 }),
        speech({ id: 3, subjectId: 1, start: '/Date(1000)/', sortOrder: 1 })
      ],
      { 1: 'Erstrat', 2: 'Zweitrat' }
    );

    expect(stages.map((stage) => stage.title)).toEqual(['Erstrat', 'Zweitrat']);
    expect(stages[1].speeches.map((s) => s.id)).toEqual([2, 1]);
    expect(stages[1].date).toBe('/Date(4000)/');
    expect(toDebateStages([speech({ subjectId: 3 })], {})[0].title).toBe('');
  });

  it('reads a stage name out of the bilingual note', () => {
    expect(toStageLabel('Erstrat - Premier Conseil')).toBe('Erstrat');
    expect(toStageLabel('  ')).toBe('');
    expect(toStageLabel(undefined)).toBe('');
  });
});

describe('odata model', () => {
  it('reads a collection in any of its three shapes', () => {
    expect(odataList([1])).toEqual([1]);
    expect(odataList({ results: [2] })).toEqual([2]);
    expect(odataList({})).toEqual([]);
    expect(odataList(undefined)).toEqual([]);
  });

  it('parses OData ticks and treats garbage as zero', () => {
    expect(odataTimestamp('/Date(1234)/')).toBe(1234);
    expect(odataTimestamp('nope')).toBe(0);
    expect(odataTimestamp(undefined)).toBe(0);
  });
});

describe('business text sections', () => {
  it('strips markup to text', () => {
    expect(toPlainText('<p>Ein</p><p>Satz</p>')).toBe('Ein Satz');
    expect(toPlainText(undefined)).toBe('');
  });

  it('keeps a section only when it holds readable text, with a titled variant', () => {
    expect(toTextSection('a', '  ')).toBeNull();
    expect(toTextSection('b', '<p></p>')).toBeNull();

    const short = toTextSection('c', '<p>Kurz</p>', 'Titel');
    expect(short?.isTruncated).toBeFalse();
    expect(short?.preview).toBe('Kurz');
    expect(short?.title).toBe('Titel');

    const long = toTextSection('d', `<p>${'Wort '.repeat(100)}</p>`);
    expect(long?.isTruncated).toBeTrue();
    expect(long?.preview.endsWith('…')).toBeTrue();
    expect(long?.preview.length).toBeLessThanOrEqual(301);
    expect(long?.title).toBeUndefined();
  });

  it('collects the long-text fields of a business in display order', () => {
    const sections = toBusinessTextSections({
      Description: '<p>Beschreibung</p>',
      MotionText: '',
      ReasonText: '<p>Grund</p>'
    } as Business);

    expect(sections.map((section) => section.key)).toEqual([
      'description',
      'reasonText'
    ]);
    expect(toBusinessTextSections(null)).toEqual([]);
  });
});
