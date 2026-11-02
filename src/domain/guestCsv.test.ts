import { describe, expect, it } from 'vitest';
import { parseGuestCsv } from './guestCsv';

describe('guest CSV import', () => {
  it('imports Malay and English headers with quoted commas', () => {
    expect(parseGuestCsv('nama,pax,kumpulan,status\n"Ali, Siti",2,Keluarga,Hadir')).toEqual([{ name: 'Ali, Siti', pax: 2, group: 'Keluarga', rsvp: 'Hadir' }]);
  });
  it('normalises invalid pax and RSVP safely', () => {
    expect(parseGuestCsv('name,pax,rsvp\nMuthu,-2,unknown')[0]).toMatchObject({ name: 'Muthu', pax: 1, rsvp: 'Menunggu' });
  });
  it('requires a name column', () => {
    expect(() => parseGuestCsv('phone,pax\n012,1')).toThrow(/name/);
  });
});
