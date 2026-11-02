import { Guest } from '../domain';

function row(line: string) {
  const values: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') { value += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) { values.push(value.trim()); value = ''; }
    else value += character;
  }
  values.push(value.trim());
  return values;
}

export function parseGuestCsv(input: string): Omit<Guest, 'id'>[] {
  const lines = input.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = row(lines[0]).map((item) => item.toLowerCase());
  const find = (...names: string[]) => headers.findIndex((header) => names.includes(header));
  const nameIndex = find('name', 'nama');
  const paxIndex = find('pax', 'jumlah', 'guests');
  const groupIndex = find('group', 'kumpulan');
  const rsvpIndex = find('rsvp', 'status');
  if (nameIndex < 0) throw new Error('CSV mesti mempunyai lajur name atau nama.');
  return lines.slice(1).flatMap((line) => {
    const values = row(line);
    const name = values[nameIndex]?.trim();
    if (!name) return [];
    const parsedPax = Number(values[paxIndex] || 1);
    const status = values[rsvpIndex]?.trim().toLowerCase();
    const rsvp: Guest['rsvp'] = status === 'hadir' || status === 'attending' ? 'Hadir' : status === 'tidak hadir' || status === 'declined' ? 'Tidak hadir' : 'Menunggu';
    return [{ name, pax: Number.isInteger(parsedPax) && parsedPax > 0 ? parsedPax : 1, group: values[groupIndex]?.trim() || '', rsvp }];
  });
}
