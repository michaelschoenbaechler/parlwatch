import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deflateRawSync } from 'node:zlib';
import {
  compensation,
  paidInterestsAffectedBy,
  parseTsv,
  topicsOfGroup,
  unzip
} from './lobbywatch.mjs';

/** Builds a zip archive with one deflated entry, as the export uses. */
function zipOf(name, content) {
  const data = deflateRawSync(Buffer.from(content));
  const nameBuffer = Buffer.from(name);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(8, 8);
  local.writeUInt32LE(data.length, 18);
  local.writeUInt16LE(nameBuffer.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(8, 10);
  central.writeUInt32LE(data.length, 20);
  central.writeUInt16LE(nameBuffer.length, 28);
  central.writeUInt32LE(0, 42);
  const centralOffset = local.length + nameBuffer.length + data.length;
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(central.length + nameBuffer.length, 12);
  end.writeUInt32LE(centralOffset, 16);
  return Buffer.concat([local, nameBuffer, data, central, nameBuffer, end]);
}

test('unzip inflates deflated entries', () => {
  const files = unzip(zipOf('flat_branche.csv', 'id\tname\n1\tGesundheit\n'));
  assert.equal(
    files.get('flat_branche.csv').toString(),
    'id\tname\n1\tGesundheit\n'
  );
});

test('parseTsv handles quoted fields, escaped quotes, tabs and empty values', () => {
  const rows = parseTsv(
    'id\tname\tort\n1\t"Verein ""A""\tund B"\t\n2\t"Zeile\nzwei"\tBern\n'
  );
  assert.deepEqual(rows, [
    { id: '1', name: 'Verein "A"\tund B', ort: '' },
    { id: '2', name: 'Zeile\nzwei', ort: 'Bern' }
  ]);
});

test('compensation decodes Lobbywatch codes', () => {
  assert.equal(compensation('-1').paid, false);
  assert.equal(compensation('0').label, 'ehrenamtlich');
  assert.deepEqual(compensation('1'), {
    paid: true,
    label: 'bezahlt, Betrag unbekannt'
  });
  assert.equal(compensation('54000').chf, 54000);
  assert.equal(compensation(undefined).paid, null);
});

test('topicsOfGroup narrows broad branches to their interest groups', () => {
  assert.deepEqual(topicsOfGroup('Banken', 'Wirtschaft'), ['Finanzwesen']);
  assert.deepEqual(topicsOfGroup('IT', 'Wirtschaft'), ['Wirtschaft']);
  assert.deepEqual(topicsOfGroup('Pharma', 'Gesundheit'), ['Gesundheit']);
  assert.deepEqual(
    topicsOfGroup('Parteien', 'Staatspolitik/Staatswirtschaft'),
    []
  );
});

test('paidInterestsAffectedBy keeps paid interests on one of the topics', () => {
  const bank = { compensation: { paid: true }, topics: ['Finanzwesen'] };
  const unpaidBank = { compensation: { paid: false }, topics: ['Finanzwesen'] };
  const it = { compensation: { paid: true }, topics: ['Wirtschaft'] };
  assert.deepEqual(
    paidInterestsAffectedBy([bank, unpaidBank, it], 'Finanzwesen|Steuer'),
    [bank]
  );
  assert.deepEqual(paidInterestsAffectedBy([bank], null), []);
});
