import { Business, Preconsultation, Resolution } from 'swissparl';
import { odataList, odataTimestamp } from '../../shared/models/odata.model';

export type TimelineStepKind =
  'submission' | 'preconsultation' | 'resolution' | 'status';

/** One stop on a business's path through parliament. */
export interface TimelineStep {
  /** Stable identity for `@for` tracking. */
  key: string;
  /** OData date string the step is dated with. */
  date: string;
  /** Chamber or committee the step happened in, empty when unknown. */
  council: string;
  /**
   * What happened, as the API words it. Empty for steps the app labels itself,
   * which the template resolves from `kind`.
   */
  text: string;
  kind: TimelineStepKind;
}

/**
 * Build a business's chamber-by-chamber path, oldest step first.
 *
 * The API scatters the story over three collections: the submission sits on
 * the business, committee referrals on `Preconsultations`, and the decisions
 * each chamber took on the `Resolutions` of its bills. Merging them by date is
 * what turns a lone status label into a sequence.
 * @param business The business as the detail endpoint returned it
 * @returns The steps in chronological order, current status last
 */
export function toBusinessTimeline(business: Business | null): TimelineStep[] {
  if (!business) return [];

  const steps: TimelineStep[] = [
    ...submissionStep(business),
    ...preconsultationSteps(business),
    ...resolutionSteps(business)
  ].sort((a, b) => odataTimestamp(a.date) - odataTimestamp(b.date));

  // The current status closes the sequence: it is where the business stands
  // now, which is not always the same as its last recorded decision.
  const status = statusStep(business, steps);

  return [...withoutRedundantSubmission(steps, status), ...status];
}

/**
 * Drop the submission step when the closing status already covers it.
 *
 * A freshly handed-in business is dated the same day as its "Eingereicht"
 * status, so both steps describe the same moment. The status is kept over the
 * submission because it carries the API's own wording, which stays correct
 * when a business reaches a different status on the day it was submitted.
 * @param steps The dated steps, submission included
 * @param status The closing status step, if there is one
 * @returns The steps without a submission the status repeats
 */
function withoutRedundantSubmission(
  steps: TimelineStep[],
  status: TimelineStep[]
): TimelineStep[] {
  const statusDate = status[0]?.date;
  if (!statusDate) return steps;

  return steps.filter(
    (step) => step.kind !== 'submission' || !isSameDay(step.date, statusDate)
  );
}

/**
 * Whether two OData dates fall on the same day.
 * @param a First OData date string
 * @param b Second OData date string
 * @returns True when both land on the same UTC day
 */
function isSameDay(a: string, b: string): boolean {
  const dayMs = 24 * 60 * 60 * 1000;
  return (
    Math.floor(odataTimestamp(a) / dayMs) ===
    Math.floor(odataTimestamp(b) / dayMs)
  );
}

/**
 * The step for the day the business was handed in.
 * @param business The business
 * @returns One step, or none when the API gives no submission date
 */
function submissionStep(business: Business): TimelineStep[] {
  if (!business.SubmissionDate) return [];

  return [
    {
      key: 'submission',
      date: business.SubmissionDate,
      council: business.SubmissionCouncilName?.trim() ?? '',
      text: '',
      kind: 'submission'
    }
  ];
}

/**
 * The committees the business was referred to.
 *
 * The API repeats a referral once per treatment category, so the same
 * committee shows up several times on the same day; those are collapsed.
 * @param business The business
 * @returns One step per committee and date
 */
function preconsultationSteps(business: Business): TimelineStep[] {
  const rows = odataList<Preconsultation>(business.Preconsultations);
  const seen = new Set<string>();
  const steps: TimelineStep[] = [];

  for (const row of rows) {
    const committee = row.CommitteeName?.trim();
    if (!committee || !row.PreconsultationDate) continue;

    const key = `preconsultation-${committee}-${row.PreconsultationDate}`;
    if (seen.has(key)) continue;
    seen.add(key);

    steps.push({
      key,
      date: row.PreconsultationDate,
      council: committee,
      text: '',
      kind: 'preconsultation'
    });
  }

  return steps;
}

/**
 * What each chamber decided, across every bill of the business.
 *
 * A business can carry several bills, and a chamber records its decision once
 * per bill, so one sitting yields several identical rows. Decisions that match
 * on date, chamber and wording are collapsed into a single step; a sitting
 * that decided differently on different bills still shows each decision.
 * @param business The business
 * @returns One step per distinct recorded decision
 */
function resolutionSteps(business: Business): TimelineStep[] {
  const steps: TimelineStep[] = [];
  const seen = new Set<string>();

  for (const bill of odataList(business.Bills)) {
    for (const resolution of odataList<Resolution>(bill.Resolutions)) {
      const text = resolution.ResolutionText?.trim();
      if (!text || !resolution.ResolutionDate) continue;

      const council = resolution.CouncilName?.trim() ?? '';
      const key = `resolution-${resolution.ResolutionDate}-${council}-${text}`;
      if (seen.has(key)) continue;
      seen.add(key);

      steps.push({
        key,
        date: resolution.ResolutionDate,
        council,
        text,
        kind: 'resolution'
      });
    }
  }

  return steps;
}

/**
 * Where the business stands now, unless the last step already says it.
 * @param business The business
 * @param steps The steps built so far
 * @returns One closing step, or none when it would only repeat the last one
 */
function statusStep(business: Business, steps: TimelineStep[]): TimelineStep[] {
  const text = business.BusinessStatusText?.trim();
  if (!text || !business.BusinessStatusDate) return [];

  const last = steps[steps.length - 1];
  if (last?.text === text) return [];

  return [
    {
      key: 'status',
      date: business.BusinessStatusDate,
      council: '',
      text,
      kind: 'status'
    }
  ];
}
