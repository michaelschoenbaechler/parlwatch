import { Transcript } from 'swissparl';
import { odataTimestamp } from './odata.model';

/** One speech as the speech list renders it. */
export interface SpeechVm {
  id: number;
  /** Agenda item the speech belongs to, used to look its title up. */
  subjectId: number;
  /** Chamber the speech was given in. */
  council: string;
  /** The speaker's role in the debate, e.g. `Mit-M` for a committee member. */
  speakerFunction: string;
  /**
   * Language the speech was actually delivered in. Debates are not translated,
   * so this is often not the language the rest of the app is showing.
   */
  language: string;
  /** OData date the speech started, the only reliable date on the record. */
  start: string;
  /** Title of the business debated, filled in from a separate lookup. */
  title: string;
  /** Short number of that business, e.g. `26.033`. */
  businessShortNumber: string;
  /** Who spoke. Redundant on a member's own page, essential in a debate. */
  speaker: string;
  /** The speaker's faction, shown alongside their name in a debate. */
  parlGroup: string;
  /** Position within its agenda item, which is the order of the debate. */
  sortOrder: number;
}

/**
 * The transcript types the API uses. Only `speech` carries a member speaking;
 * type 2 announces vote results and type 3 covers ceremonial items such as
 * elections and the opening music, neither of which names a speaker.
 */
export const TRANSCRIPT_TYPE_SPEECH = 1;

/**
 * Typesetting markers carried over from the printed Amtliches Bulletin. They
 * appear inside ordinary speeches, not just procedural entries, and mean
 * nothing to a reader on a phone.
 */
const TYPESETTING_CODE = /\[(?:GZ|VS|NB|NAM)\]/g;

/**
 * Turn the raw transcript body into something displayable.
 *
 * The body is wrapped in a `<pd_text>` element and holds nothing but `<p>`
 * tags, both of which `SafeHtmlPipe` already handles — it keeps the paragraphs
 * and unwraps the tag it does not know. Only the typesetting codes have to go.
 * @param text The `Text` field as the API returns it
 * @returns Markup ready for the sanitising pipe
 */
export function cleanTranscriptText(text: string | undefined): string {
  return (text ?? '')
    .replace(TYPESETTING_CODE, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Map transcript rows onto the speech list's view model.
 *
 * Rows arrive without their `Text`: the body averages 8.5 KB, so a list only
 * ever loads the metadata and fetches a speech when the reader opens it.
 * @param transcripts Rows from the `Transcript` collection
 * @returns One speech per row that carries an id
 */
export function toSpeeches(transcripts: Transcript[]): SpeechVm[] {
  const speeches: SpeechVm[] = [];

  for (const transcript of transcripts) {
    if (transcript.ID === undefined || Number.isNaN(Number(transcript.ID))) {
      continue;
    }

    speeches.push({
      // Both ids are Edm.Int64, which the service serialises as JSON strings
      // however the typings describe them. Left as strings they would be sent
      // back quoted and the service rejects `Edm.Int64 eq Edm.String`.
      id: Number(transcript.ID),
      subjectId: Number(transcript.IdSubject ?? 0),
      council: transcript.CouncilName?.trim() ?? '',
      speakerFunction: transcript.SpeakerFunction?.trim() ?? '',
      language: transcript.LanguageOfText?.trim() ?? '',
      start: transcript.Start ?? '',
      title: '',
      businessShortNumber: '',
      speaker: transcript.SpeakerFullName?.trim() ?? '',
      parlGroup: transcript.ParlGroupAbbreviation?.trim() ?? '',
      sortOrder: transcript.SortOrder ?? 0
    });
  }

  return speeches;
}

/** Every speech a member gave on one business. */
export interface SpeechGroupVm {
  /** Stable identity for `@for` tracking. */
  key: string;
  /** What the group is: a business on a member page, a stage in a debate. */
  title: string;
  businessShortNumber: string;
  /**
   * OData date the group happened on. Set for a debate stage, where every
   * speech shares the day; empty for a business, whose speeches span months
   * and carry their own dates.
   */
  date: string;
  /** The group's speeches, in the order the group reads best. */
  speeches: SpeechVm[];
}

/**
 * Group a member's speeches by the business they were given on.
 *
 * Members regularly speak several times on one item — entering the debate,
 * answering, then summing up — which as a flat list reads as the same title
 * repeated four times. Groups are ordered by their most recent speech, as is
 * the flat list they replace.
 * @param speeches Speeches, newest first
 * @returns One group per business, each holding its speeches newest first
 */
export function groupSpeechesByBusiness(speeches: SpeechVm[]): SpeechGroupVm[] {
  const groups = new Map<string, SpeechGroupVm>();

  for (const speech of speeches) {
    // Speeches on an item with no business still belong together; ones with
    // neither stand alone rather than collecting in a shared bucket.
    const key =
      speech.businessShortNumber ||
      (speech.subjectId
        ? `subject-${speech.subjectId}`
        : `speech-${speech.id}`);

    const group = groups.get(key);
    if (group) {
      group.speeches.push(speech);
      continue;
    }

    groups.set(key, {
      key,
      title: speech.title,
      businessShortNumber: speech.businessShortNumber,
      date: '',
      speeches: [speech]
    });
  }

  return [...groups.values()];
}

/** What the agenda-item lookup knows about one subject. */
export interface SubjectTitle {
  title: string;
  businessShortNumber: string;
}

/**
 * Fill in the business each speech was about.
 *
 * Speeches on items with no business behind them — elections, ceremonies —
 * keep an empty title and are shown by date alone.
 * @param speeches Speeches to label
 * @param titles Titles keyed by agenda item id
 * @returns The speeches, with titles filled in where one is known
 */
export function withSubjectTitles(
  speeches: SpeechVm[],
  titles: Record<number, SubjectTitle>
): SpeechVm[] {
  return speeches.map((speech) => {
    const subject = titles[speech.subjectId];
    if (!subject) return speech;

    return {
      ...speech,
      title: subject.title,
      businessShortNumber: subject.businessShortNumber
    };
  });
}

/**
 * Arrange a business's speeches into the stages of its debate.
 *
 * Parliament splits a business over several agenda items — first chamber,
 * continuation, second chamber, then the reconciliation of differences — and
 * `SortOrder` counts from one within each of them. So stages are ordered by
 * when they happened and speeches by their position inside the stage, which
 * together replay the debate in the order it was held.
 * @param speeches Speeches across all of the business's agenda items
 * @param stageLabels Stage names keyed by agenda item id
 * @returns One group per stage, oldest first
 */
export function toDebateStages(
  speeches: SpeechVm[],
  stageLabels: Record<number, string>
): SpeechGroupVm[] {
  const stages = new Map<number, SpeechGroupVm>();

  for (const speech of speeches) {
    const stage = stages.get(speech.subjectId);
    if (stage) {
      stage.speeches.push(speech);
      continue;
    }

    stages.set(speech.subjectId, {
      key: `stage-${speech.subjectId}`,
      title: stageLabels[speech.subjectId] ?? '',
      businessShortNumber: '',
      date: speech.start,
      speeches: [speech]
    });
  }

  const ordered = [...stages.values()];

  for (const stage of ordered) {
    // Safe to sort in place: every `speeches` array is built here, not shared.
    stage.speeches.sort((a, b) => a.sortOrder - b.sortOrder);
    stage.date = stage.speeches[0]?.start ?? stage.date;
  }

  return ordered.sort(
    (a, b) => odataTimestamp(a.date) - odataTimestamp(b.date)
  );
}

/**
 * Read a stage's name out of the API's bilingual note.
 *
 * `PublishedNotes` pairs the languages on one line — `Erstrat - Premier
 * Conseil` — so the part before the dash is the name in the requested one.
 * @param publishedNotes The note as the API returns it
 * @returns The stage name, or an empty string when there is none
 */
export function toStageLabel(publishedNotes: string | undefined): string {
  const note = publishedNotes?.trim();
  if (!note) return '';

  return note.split(' - ')[0].trim();
}
