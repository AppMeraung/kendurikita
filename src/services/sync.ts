import type { EventData } from "../state/AppState";
import { normalizeBudgetCategories } from "../domain/budgetCategories";
import { cloudConfigured, supabase } from "./supabase";
import { uploadEventDocument } from "./documents";
const localParts = (value: string | null) => {
  if (!value) return { date: "", time: "" };
  const date = new Date(value);
  const part = (number: number) => String(number).padStart(2, "0");
  return {
    date: `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}`,
    time: `${part(date.getHours())}:${part(date.getMinutes())}`,
  };
};
type EventChildTable =
  | "checklist_items"
  | "budget_items"
  | "guests"
  | "timeline_items"
  | "day_notes"
  | "team_contacts"
  | "tables_seating";

async function replaceEventRows(
  table: EventChildTable,
  eventId: string,
  rows: Record<string, unknown>[],
) {
  if (rows.length) {
    const upsert = await supabase.from(table).upsert(rows, { onConflict: "event_id,local_key" });
    if (upsert.error) throw upsert.error;
    const localKeys = rows.map((row) => `"${String(row.local_key).replaceAll('"', '')}"`).join(",");
    const cleanup = await supabase.from(table).delete().eq("event_id", eventId).not("local_key", "in", `(${localKeys})`);
    if (cleanup.error) throw cleanup.error;
  } else {
    const cleanup = await supabase.from(table).delete().eq("event_id", eventId);
    if (cleanup.error) throw cleanup.error;
  }
}
export async function syncEvent(event: EventData) {
  if (!cloudConfigured) throw new Error("Supabase belum dikonfigurasi.");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Log masuk diperlukan untuk sync.");
  let cloudId = event.cloudId;
  if (cloudId) {
    const { error } = await supabase
      .from("events")
      .update({
        name: event.name,
        event_type: event.type,
        event_dates: [event.date, ...(event.additionalDates || [])].filter(Boolean),
        venue: event.venueLocation ? { name: event.venue, place_id: event.venueLocation.placeId, latitude: event.venueLocation.latitude, longitude: event.venueLocation.longitude } : { name: event.venue },
        country: event.country,
        total_budget: event.totalBudget,
        budget_categories: event.budgetCategories,
        estimated_guests: event.estimatedGuests,
        post_event: { thank_you_message: event.thankYouMessage, getting_started_dismissed: !!event.gettingStartedDismissed },
        updated_at: new Date().toISOString(),
      })
      .eq("id", cloudId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from("events")
      .insert({
        owner_id: user.id,
        name: event.name,
        event_type: event.type,
        event_dates: [event.date, ...(event.additionalDates || [])].filter(Boolean),
        venue: event.venueLocation ? { name: event.venue, place_id: event.venueLocation.placeId, latitude: event.venueLocation.latitude, longitude: event.venueLocation.longitude } : { name: event.venue },
        country: event.country,
        total_budget: event.totalBudget,
        budget_categories: event.budgetCategories,
        estimated_guests: event.estimatedGuests,
        post_event: { thank_you_message: event.thankYouMessage, getting_started_dismissed: !!event.gettingStartedDismissed },
      })
      .select("id")
      .single();
    if (error) throw error;
    cloudId = data.id;
  }
  const eventId = cloudId as string;
  const checklist = event.checklist.map((x, index) => ({
    event_id: eventId,
    local_key: x.id,
    title: x.title,
    due_at: /^\d{4}-\d{2}-\d{2}$/.test(x.due) ? `${x.due}T12:00:00Z` : null,
    priority: x.priority.toLowerCase(),
    assigned_name: x.assignedTo || null,
    reminder_at: x.reminderAt || null,
    done: x.done,
    sort_order: index,
  }));
  const budget = event.budget.map((x) => ({
    event_id: eventId,
    local_key: x.id,
    name: x.name,
    category: x.category,
    planned: x.planned,
    paid: x.paid,
    payer: x.payer,
    vendor_id: null,
    vendor_name: x.vendor,
    payment_type: x.paymentType,
    payment_method: x.paymentMethod,
    paid_at: x.paidAt || null,
    due_at: x.dueAt || null,
    note: x.note,
    receipt_path: x.receiptUri,
  }));
  const guests = event.guests.map((x) => ({
    event_id: eventId,
    local_key: x.id,
    name: x.name,
    guest_group: x.group,
    pax: x.pax,
    phone: x.phone || null,
    dietary: x.dietary || null,
    table_local_key: x.tableId || null,
    rsvp_status: x.rsvp,
  }));
  const timeline = event.timeline.map((item, index) => ({
    event_id: eventId,
    local_key: item.id,
    title: item.title,
    starts_at: new Date(`${item.date}T${item.start}:00`).toISOString(),
    ends_at: new Date(`${item.date}T${item.end}:00`).toISOString(),
    pic_name: item.pic || null,
    note: item.note || null,
    sort_order: index,
  }));
  const dayNotes = (event.records.day_notes || []).map((item) => ({
    event_id: eventId,
    local_key: item.id,
    title: item.title,
    detail: item.detail,
  }));
  const team = event.team.map((member) => ({
    event_id: eventId,
    local_key: member.id,
    name: member.name,
    role: member.role,
    phone: member.phone || null,
    status: member.status,
  }));
  const seating = event.seating.map((table) => ({
    event_id: eventId,
    local_key: table.id,
    name: table.name,
    shape: table.shape,
    capacity: table.capacity,
    position: { x: table.x, y: table.y },
  }));
  const inventory = event.inventory.map((item) => ({
    event_id: eventId,
    local_key: item.id,
    name: item.name,
    category: item.category,
    quantity: item.target,
    completed: item.completed,
    status: item.status,
    note: item.note || null,
  }));
  const documents = await Promise.all(
    event.documents.map(async (document) => ({
      event_id: eventId,
      local_key: document.id,
      name: document.name,
      folder: document.folder,
      storage_path: await uploadEventDocument(eventId, document),
      mime_type: document.mimeType || null,
      size_bytes: document.size || null,
    })),
  );
  await replaceEventRows("checklist_items", eventId, checklist);
  await replaceEventRows("budget_items", eventId, budget);
  await replaceEventRows("guests", eventId, guests);
  await replaceEventRows("timeline_items", eventId, timeline);
  await replaceEventRows("day_notes", eventId, dayNotes);
  await replaceEventRows("team_contacts", eventId, team);
  await replaceEventRows("tables_seating", eventId, seating);
  if (inventory.length) {
    const cleanup = await supabase
      .from("inventory_items")
      .delete()
      .eq("event_id", eventId)
      .not(
        "local_key",
        "in",
        `(${inventory.map((item) => `"${item.local_key}"`).join(",")})`,
      );
    if (cleanup.error) throw cleanup.error;
    const { error } = await supabase
      .from("inventory_items")
      .upsert(inventory, { onConflict: "event_id,local_key" });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("inventory_items")
      .delete()
      .eq("event_id", eventId);
    if (error) throw error;
  }
  if (documents.length) {
    const cleanup = await supabase
      .from("documents")
      .delete()
      .eq("event_id", eventId)
      .not(
        "local_key",
        "in",
        `(${documents.map((item) => `"${item.local_key}"`).join(",")})`,
      );
    if (cleanup.error) throw cleanup.error;
    const { error } = await supabase.from("documents").upsert(documents, {
      onConflict: "event_id,local_key",
    });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("event_id", eventId);
    if (error) throw error;
  }
  return eventId;
}
export function subscribeEvent(eventId: string, onChange: () => void) {
  return supabase
    .channel(`event:${eventId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "kendurikita",
        table: "checklist_items",
        filter: `event_id=eq.${eventId}`,
      },
      onChange,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "kendurikita",
        table: "budget_items",
        filter: `event_id=eq.${eventId}`,
      },
      onChange,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "kendurikita",
        table: "guests",
        filter: `event_id=eq.${eventId}`,
      },
      onChange,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "kendurikita",
        table: "timeline_items",
        filter: `event_id=eq.${eventId}`,
      },
      onChange,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "kendurikita",
        table: "day_notes",
        filter: `event_id=eq.${eventId}`,
      },
      onChange,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "kendurikita",
        table: "team_contacts",
        filter: `event_id=eq.${eventId}`,
      },
      onChange,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "kendurikita",
        table: "tables_seating",
        filter: `event_id=eq.${eventId}`,
      },
      onChange,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "kendurikita",
        table: "inventory_items",
        filter: `event_id=eq.${eventId}`,
      },
      onChange,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "kendurikita",
        table: "documents",
        filter: `event_id=eq.${eventId}`,
      },
      onChange,
    )
    .subscribe();
}
export async function loadCloudEvent(id: string): Promise<EventData> {
  const [
    eventResult,
    checklistResult,
    budgetResult,
    guestResult,
    timelineResult,
    dayNotesResult,
    teamResult,
    seatingResult,
    invitationResult,
    inventoryResult,
    documentResult,
  ] = await Promise.all([
    supabase.from("events").select("*").eq("id", id).single(),
    supabase
      .from("checklist_items")
      .select("*")
      .eq("event_id", id)
      .order("sort_order"),
    supabase.from("budget_items").select("*").eq("event_id", id),
    supabase.from("guests").select("*").eq("event_id", id),
    supabase
      .from("timeline_items")
      .select("*")
      .eq("event_id", id)
      .order("sort_order"),
    supabase.from("day_notes").select("*").eq("event_id", id).order("created_at"),
    supabase.from("team_contacts").select("*").eq("event_id", id),
    supabase.from("tables_seating").select("*").eq("event_id", id),
    supabase.from("invitations").select("*").eq("event_id", id).limit(1),
    supabase.from("inventory_items").select("*").eq("event_id", id),
    supabase.from("documents").select("*").eq("event_id", id),
  ]);
  for (const result of [
    eventResult,
    checklistResult,
    budgetResult,
    guestResult,
    timelineResult,
    dayNotesResult,
    teamResult,
    seatingResult,
    invitationResult,
    inventoryResult,
    documentResult,
  ])
    if (result.error) throw result.error;
  const source = eventResult.data;
  return {
    id: `cloud-${id}`,
    cloudId: id,
    type: source.event_type,
    name: source.name,
    date: source.event_dates?.[0] || null,
    additionalDates: source.event_dates?.slice(1) || [],
    venue: source.venue?.name || "",
    venueLocation:
      source.venue?.place_id && Number.isFinite(source.venue?.latitude) && Number.isFinite(source.venue?.longitude)
        ? { placeId: source.venue.place_id, name: source.venue.name || "", latitude: source.venue.latitude, longitude: source.venue.longitude }
        : undefined,
    country: source.country,
    totalBudget: Number(source.total_budget),
    budgetCategories: normalizeBudgetCategories(
      source.budget_categories,
      (budgetResult.data || []).map((item) => item.category),
    ),
    estimatedGuests: source.estimated_guests,
    thankYouMessage: source.post_event?.thank_you_message || "",
    gettingStartedDismissed: !!source.post_event?.getting_started_dismissed,
    checklist: (checklistResult.data || []).map((x) => ({
      id: x.local_key,
      title: x.title,
      due: x.due_at?.slice(0, 10) || "",
      done: x.done,
      priority:
        x.priority === "tinggi"
          ? "Tinggi"
          : x.priority === "rendah"
            ? "Rendah"
            : "Sederhana",
      assignedTo: x.assigned_name || undefined,
      reminderAt: x.reminder_at || undefined,
    })),
    budget: (budgetResult.data || []).map((x) => ({
      id: x.local_key,
      name: x.name,
      category: x.category,
      vendor: x.vendor_name || undefined,
      planned: Number(x.planned),
      paid: Number(x.paid),
      payer: x.payer || "shared",
      paymentType: x.payment_type || undefined,
      paymentMethod: x.payment_method || undefined,
      paidAt: x.paid_at || undefined,
      dueAt: x.due_at || undefined,
      note: x.note || undefined,
      receiptUri: x.receipt_path || undefined,
    })),
    guests: (guestResult.data || []).map((x) => ({
      id: x.local_key,
      name: x.name,
      group: x.guest_group || "",
      pax: x.pax,
      phone: x.phone || undefined,
      dietary: x.dietary || undefined,
      tableId: x.table_local_key || undefined,
      rsvp:
        x.rsvp_status === "attending"
          ? "Hadir"
          : x.rsvp_status === "declined"
            ? "Tidak hadir"
            : "Menunggu",
    })),
    timeline: (timelineResult.data || []).map((item) => {
      const start = localParts(item.starts_at);
      const end = localParts(item.ends_at);
      return {
        id: item.local_key,
        title: item.title,
        date: start.date,
        start: start.time,
        end: end.time,
        pic: item.pic_name || undefined,
        note: item.note || undefined,
      };
    }),
    team: (teamResult.data || []).map((member) => ({
      id: member.local_key,
      name: member.name,
      role: member.role,
      phone: member.phone || undefined,
      status: member.status,
    })),
    seating: (seatingResult.data || []).map((table) => ({
      id: table.local_key,
      name: table.name,
      shape: table.shape,
      capacity: table.capacity,
      x: Number(table.position?.x || 0),
      y: Number(table.position?.y || 0),
    })),
    invitation: invitationResult.data?.[0]
      ? {
          template: invitationResult.data[0].template_id,
          language: invitationResult.data[0].language,
          message: invitationResult.data[0].content?.message || "",
          photoUri: invitationResult.data[0].content?.photo_url || undefined,
          musicUrl: invitationResult.data[0].content?.music_url || undefined,
          giftLink: invitationResult.data[0].content?.gift_link || undefined,
          duitNowQrUri: invitationResult.data[0].content?.duitnow_qr_url || undefined,
          wishlist: invitationResult.data[0].content?.wishlist || undefined,
        }
      : { template: "malay", language: "ms", message: "" },
    inventory: (inventoryResult.data || []).map((item) => ({
      id: item.local_key,
      name: item.name,
      category: item.category,
      target: item.quantity,
      completed: item.completed,
      status: item.status,
      note: item.note || undefined,
    })),
    documents: (documentResult.data || []).map((document) => ({
      id: document.local_key,
      name: document.name,
      folder: document.folder,
      storagePath: document.storage_path,
      mimeType: document.mime_type || undefined,
      size: document.size_bytes || undefined,
    })),
    records: {
      day_notes: (dayNotesResult.data || []).map((item) => ({
        id: item.local_key,
        title: item.title,
        detail: item.detail,
      })),
    },
  };
}
