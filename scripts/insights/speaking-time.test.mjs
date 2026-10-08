import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  disclosureSnippet,
  odataDate,
  plainText,
  speechRole
} from './speaking-time.mjs';

test('speechRole separates members from the chair, rapporteurs and the government', () => {
  assert.equal(speechRole('Mit-F'), 'member');
  assert.equal(speechRole('*'), 'rapporteur');
  assert.equal(speechRole('P-M'), 'chair');
  assert.equal(speechRole('2VP-F'), 'chair');
  assert.equal(speechRole('BR-F'), 'federal-council');
  assert.equal(speechRole('BPR-M'), 'federal-council');
  assert.equal(speechRole('VPBR-M'), 'federal-council');
  assert.equal(speechRole(null), 'other');
});

test('disclosureSnippet finds disclosures in German and French', () => {
  assert.equal(
    disclosureSnippet(
      'Der Markteingriff ist markant. Ich lege meine Interessenbindung offen: Ich bin Verwaltungsrat der Axpo. Weiter.'
    ),
    'Ich lege meine Interessenbindung offen: Ich bin Verwaltungsrat der Axpo.'
  );
  assert.match(
    disclosureSnippet(
      "Je déclare mes intérêts : je préside l'Association suisse des AOP-IGP."
    ),
    /^Je déclare mes intérêts/
  );
});

test('disclosureSnippet ignores ordinary mentions of interests', () => {
  assert.equal(disclosureSnippet('Das ist von nationalem Interesse.'), null);
  assert.equal(disclosureSnippet('Die Idee ist interessant.'), null);
});

test('plainText strips markup and transcript markers', () => {
  assert.equal(
    plainText('<p><b>Name</b> (S, BE):[GZ] Text</p>'),
    'Name (S, BE): Text'
  );
});

test('odataDate reads the OData date literal', () => {
  assert.equal(odataDate('/Date(1789396423234)/'), 1789396423234);
  assert.equal(odataDate(null), null);
});
