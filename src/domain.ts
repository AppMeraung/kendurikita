export type BudgetItem = {
  id: string;
  name: string;
  category: string;
  planned: number;
  paid: number;
  payer?: "bride" | "groom" | "shared";
  vendor?: string;
  paymentType?: "deposit" | "balance" | "full";
  paymentMethod?: "cash" | "bank" | "duitnow" | "card";
  paidAt?: string;
  dueAt?: string;
  note?: string;
  receiptUri?: string;
  paymentReminderId?: string;
};
export type ChecklistItem = {
  id: string;
  title: string;
  due: string;
  done: boolean;
  priority: "Tinggi" | "Sederhana" | "Rendah";
  assignedTo?: string;
  reminderAt?: string;
  reminderId?: string;
};
export type Guest = {
  id: string;
  name: string;
  group: string;
  pax: number;
  rsvp: "Hadir" | "Menunggu" | "Tidak hadir";
  phone?: string;
  dietary?: string;
  tableId?: string;
};
export type TimelineItem = {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  pic?: string;
  note?: string;
};
export type TeamMember = {
  id: string;
  name: string;
  role: "partner" | "family" | "pic" | "viewer" | "parent";
  phone?: string;
  status: "invited" | "joined" | "local";
};
export type SeatingTable = {
  id: string;
  name: string;
  shape: "round" | "long";
  capacity: number;
  x: number;
  y: number;
};
export type InvitationSettings = {
  template: "malay" | "chinese" | "indian" | "indonesian" | "modern";
  language: "ms" | "en" | "zh" | "ta" | "id";
  message: string;
  photoUri?: string;
  musicUrl?: string;
  giftLink?: string;
  duitNowQrUri?: string;
  wishlist?: string;
};
export type InventoryItem = {
  id: string;
  name: string;
  category: "goodie_bag" | "door_gift" | "hantaran" | "other";
  target: number;
  completed: number;
  status: "needed" | "ordered" | "ready" | "distributed";
  note?: string;
};
export type EventDocument = {
  id: string;
  name: string;
  folder: "contracts" | "receipts" | "identity" | "other";
  localUri?: string;
  storagePath?: string;
  mimeType?: string;
  size?: number;
};

export function inventoryProgress(items: InventoryItem[]) {
  const target = items.reduce((sum, item) => sum + item.target, 0);
  const completed = items.reduce(
    (sum, item) => sum + Math.min(item.completed, item.target),
    0,
  );
  return {
    target,
    completed,
    percent: target ? Math.round((completed / target) * 100) : 0,
  };
}

export const money = (value: number, country: "MY" | "ID" = "MY") =>
  new Intl.NumberFormat(country === "ID" ? "id-ID" : "en-MY", {
    style: "currency",
    currency: country === "ID" ? "IDR" : "MYR",
    maximumFractionDigits: 0,
  }).format(Math.max(0, value));

export function budgetSummary(items: BudgetItem[], totalBudget = 0) {
  const planned = items.reduce((sum, item) => sum + item.planned, 0);
  const paid = items.reduce((sum, item) => sum + item.paid, 0);
  return {
    planned,
    paid,
    remaining: totalBudget - paid,
    owed: planned - paid,
    percent: totalBudget ? Math.round((paid / totalBudget) * 100) : 0,
    overBudget: planned > totalBudget && totalBudget > 0,
  };
}

export function validAmount(value: string | number) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0;
}

export function checklistProgress(items: ChecklistItem[]) {
  if (!items.length) return 0;
  return Math.round(
    (items.filter((item) => item.done).length / items.length) * 100,
  );
}

export function guestSummary(guests: Guest[]) {
  return guests.reduce(
    (summary, guest) => {
      summary.total += guest.pax;
      if (guest.rsvp === "Hadir") summary.confirmed += guest.pax;
      if (guest.rsvp === "Menunggu") summary.pending += guest.pax;
      if (guest.rsvp === "Tidak hadir") summary.declined += guest.pax;
      return summary;
    },
    { total: 0, confirmed: 0, pending: 0, declined: 0 },
  );
}
