export const checklistCategories = ["planning", "venue", "guests", "food", "decor", "attire", "ceremony", "media", "transport", "safety", "after", "other"] as const;
export type ChecklistCategory = (typeof checklistCategories)[number];

// Master checklist sections A–R by item number (templates/checklist/master.json).
const masterRanges: readonly (readonly [number, ChecklistCategory])[] = [
  [14, "planning"], [30, "venue"], [43, "guests"], [71, "food"], [85, "decor"], [97, "attire"], [108, "ceremony"],
  [132, "media"], [142, "venue"], [152, "planning"], [161, "transport"], [173, "safety"], [181, "planning"],
  [188, "guests"], [195, "safety"], [200, "after"],
];

// First match wins, so the more specific groups come before the broad ones.
const keywords: readonly (readonly [ChecklistCategory, RegExp])[] = [
  ["after", /selepas majlis|after the event|terima kasih|thank|penghargaan|pulangkan|return rented|album|bulan madu|honeymoon|status perkahwinan|kwsp|lhdn/],
  ["ceremony", /nikah|akad|merisik|tunang|engage|hantaran|seserahan|mas kahwin|mahar|dowry|cincin|\bring|saksi|witness|\badat\b|\bdoa\b|prayer|kursus|priest|penghulu|\bkua\b|tea ceremony|guo da li|mehndi|sangeet|aqiqah|korban|bersanding|tepung tawar|bertandang|raptai|rehearsal|latihan majlis/],
  ["attire", /baju|busana|pakaian|attire|outfit|\bdress|makeup|mekap|andam|rias|\bhair|rambut|henna|inai|aksesori|accessor|jahit|tailor|facial|grooming|songket|tanjak|rawatan kulit|skin|kesihatan/],
  ["food", /katering|catering|makan|food|menu|\bkek\b|cake|kuih|dessert|minuman|drink|nasi|beriani|biryani|kambing|bbq|buffet|hidang|aiskrim|ice cream|coffee|kopi|buah|fruit|tukang masak|rewang/],
  ["decor", /dekor|decor|pelamin|dais|bunga|flower|florist|backdrop|belon|balloon|lampu|\blight|gerbang|\barch\b|tema|theme|photo corner/],
  ["media", /foto|photo|video|drone|jurugambar|photographer|live stream|\bdj\b|emcee|pengacara|band|kompang|hiburan|entertain|muzik|music|persembahan|perform|sistem pa|pa system|mikrofon|microphone|\bled\b|projektor|projector|sound/],
  ["transport", /kereta|car\b|bas\b|bus\b|van\b|lori|lorry|pengangkutan|transport|parkir|parking|trafik|traffic|hotel|penginapan|accommodation|lodging/],
  ["guests", /tetamu|guest|jemputan|invit|\bkad\b|card|rsvp|tempat duduk|seating|meja|\btable|vip|kanak|kids|children|warga emas|elderly|doorgift|door gift|cenderamata|souvenir/],
  ["safety", /keselamatan|safety|security|permit|insurans|insurance|cuaca|weather|hujan|rain|kecemasan|emergency|pertolongan cemas|first aid|paramedik|pemadam api|\bfire|generator|elektrik|power/],
  ["venue", /dewan|hall|venue|lokasi|location|tempat majlis|rumah|\bhome\b|khemah|tent|kanopi|canopy|kerusi|chair|sewa|\brent|tandas|toilet|homestay|ballroom|resort|banquet|bilik pengantin|bridal room/],
  ["planning", /tarikh|\bdate|bajet|budget|bayar|\bpay|deposit|invois|invoice|jadual|schedule|atur cara|programme|agenda|planner|perancang|jawatankuasa|committee|tugas|vendor|senarai|list|duit salam|duitnow|wang/],
];

/** Groups a checklist task: master items by their section number, everything else by keywords in the title. */
export function checklistCategory(item: { id: string; title: string }): ChecklistCategory {
  const master = /^master-(\d+)$/.exec(item.id);
  if (master) {
    const n = Number(master[1]);
    const match = masterRanges.find(([last]) => n <= last);
    if (match) return match[1];
  }
  const title = item.title.toLowerCase();
  return keywords.find(([, pattern]) => pattern.test(title))?.[0] ?? "other";
}
