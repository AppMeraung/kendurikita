import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BudgetItem,
  ChecklistItem,
  EventDocument,
  Guest,
  InvitationSettings,
  InventoryItem,
  SeatingTable,
  TeamMember,
  TimelineItem,
} from "../domain";
import i18n from "../i18n";
import { BudgetCategory, normalizeBudgetCategories, suggestedBudgetCategories } from "../domain/budgetCategories";
import { createChecklistForEvent } from "../templates/checklist";
import { listenForQueuedSync, queueEventSync } from "../services/offlineSync";
import type { PlaceLocation } from "../services/places";

export type ModuleRecord = {
  id: string;
  title: string;
  detail: string;
  done?: boolean;
};
export type EventData = {
  id: string;
  cloudId?: string;
  type: string;
  name: string;
  date: string | null;
  additionalDates?: string[];
  venue: string;
  venueLocation?: PlaceLocation;
  country: "MY" | "ID";
  totalBudget: number;
  estimatedGuests: number;
  checklist: ChecklistItem[];
  budget: BudgetItem[];
  budgetCategories: BudgetCategory[];
  guests: Guest[];
  timeline: TimelineItem[];
  team: TeamMember[];
  seating: SeatingTable[];
  invitation: InvitationSettings;
  inventory: InventoryItem[];
  documents: EventDocument[];
  thankYouMessage: string;
  gettingStartedDismissed?: boolean;
  dayVendors?: { id: string; name: string; phone: string }[];
  records: Record<string, ModuleRecord[]>;
};
type State = {
  ready: boolean;
  toured: boolean;
  event: EventData | null;
  demoCleanupPending: boolean;
  acknowledgeDemo: () => void;
  setToured: () => void;
  createEvent: (
    event: Omit<
      EventData,
      | "id"
      | "checklist"
      | "budget"
      | "budgetCategories"
      | "guests"
      | "timeline"
      | "team"
      | "seating"
      | "invitation"
      | "inventory"
      | "documents"
      | "thankYouMessage"
      | "records"
    >,
  ) => void;
  replaceEvent: (event: EventData) => void;
  updateEvent: (changes: Partial<EventData>) => void;
  toggleChecklist: (id: string) => void;
  addChecklist: (item: Omit<ChecklistItem, "id" | "done">) => void;
  updateChecklist: (id: string, changes: Partial<ChecklistItem>) => void;
  deleteChecklist: (id: string) => void;
  addBudget: (item: Omit<BudgetItem, "id">) => void;
  restoreBudget: (item: BudgetItem) => void;
  updateBudget: (id: string, changes: Partial<BudgetItem>) => void;
  deleteBudget: (id: string) => void;
  addGuest: (guest: Omit<Guest, "id">) => void;
  updateGuest: (id: string, changes: Partial<Guest>) => void;
  addGuests: (guests: Omit<Guest, "id">[]) => void;
  deleteGuest: (id: string) => void;
  addTimeline: (item: Omit<TimelineItem, "id">) => void;
  updateTimeline: (id: string, changes: Partial<TimelineItem>) => void;
  deleteTimeline: (id: string) => void;
  addTeamMember: (member: Omit<TeamMember, "id">) => void;
  updateTeamMember: (id: string, changes: Partial<TeamMember>) => void;
  deleteTeamMember: (id: string) => void;
  addTable: (table: Omit<SeatingTable, "id">) => void;
  updateTable: (id: string, changes: Partial<SeatingTable>) => void;
  deleteTable: (id: string) => void;
  assignGuestTable: (guestId: string, tableId?: string) => void;
  addInventory: (item: Omit<InventoryItem, "id">) => void;
  updateInventory: (id: string, changes: Partial<InventoryItem>) => void;
  deleteInventory: (id: string) => void;
  addDocument: (document: Omit<EventDocument, "id">) => void;
  deleteDocument: (id: string) => void;
  addRecord: (module: string, record: Omit<ModuleRecord, "id">) => void;
  deleteRecord: (module: string, id: string) => void;
  reset: () => void;
};
const AppStateContext = createContext<State | null>(null);
const STORAGE_KEY = "kendurikita_v2";
const fresh = {
  toured: false,
  event: null as EventData | null,
  demoCleanupPending: false,
};
const LEGACY_KEY = "kenduri-kita-v2";
const defaultInvitation: InvitationSettings = {
  template: "malay",
  language: "ms",
  message: "",
};

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [value, setValue] = useState(fresh);
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(LEGACY_KEY),
    ])
      .then(([saved, legacy]) => {
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.event && !parsed.event.records) parsed.event.records = {};
          if (parsed.event && !parsed.event.timeline)
            parsed.event.timeline = [];
          if (parsed.event && !parsed.event.team) parsed.event.team = [];
          if (parsed.event && !parsed.event.seating) parsed.event.seating = [];
          if (parsed.event && !parsed.event.invitation)
            parsed.event.invitation = defaultInvitation;
          if (parsed.event && !parsed.event.inventory)
            parsed.event.inventory = [];
          if (parsed.event && !parsed.event.documents)
            parsed.event.documents = [];
          if (parsed.event)
            parsed.event.budgetCategories = normalizeBudgetCategories(
              parsed.event.budgetCategories,
              (parsed.event.budget || []).map((item: BudgetItem) => item.category),
            );
          if (parsed.event && typeof parsed.event.thankYouMessage !== "string")
            parsed.event.thankYouMessage = "";
          return setValue({ ...fresh, ...parsed });
        }
        if (!legacy) return;
        const old = JSON.parse(legacy);
        const unchangedDemo =
          old.budget?.length === 6 &&
          old.guests?.length === 6 &&
          old.checklist?.length === 6 &&
          old.guests?.[0]?.name === "Encik Rahman & keluarga";
        if (unchangedDemo)
          setValue({
            toured: !!old.onboarded,
            event: null,
            demoCleanupPending: true,
          });
        else
          setValue({
            toured: true,
            demoCleanupPending: false,
            event: {
              id: `${Date.now()}`,
              type: "Kenduri Kahwin Melayu",
              name: "Majlis Saya",
              date: null,
              venue: "",
              country: "MY",
              totalBudget:
                old.budget?.reduce(
                  (sum: number, x: { planned?: number }) =>
                    sum + (x.planned || 0),
                  0,
                ) || 0,
              estimatedGuests:
                old.guests?.reduce((sum: number, x: Guest) => sum + x.pax, 0) ||
                0,
              checklist: old.checklist || [],
              budget: (old.budget || []).map(
                (x: {
                  id: string;
                  category: string;
                  planned: number;
                  spent: number;
                }) => ({
                  id: x.id,
                  name: x.category,
                  category: x.category,
                  planned: x.planned,
                  paid: x.spent,
                  payer: "shared",
                }),
              ),
              budgetCategories: normalizeBudgetCategories(
                undefined,
                (old.budget || []).map((item: { category: string }) => item.category),
              ),
              guests: old.guests || [],
              timeline: [],
              team: [],
              seating: [],
              invitation: defaultInvitation,
              inventory: [],
              documents: [],
              thankYouMessage: "",
              records: {},
            },
          });
      })
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  }, [ready, value]);
  useEffect(() => listenForQueuedSync(), []);
  useEffect(() => {
    if (!ready || !value.event?.cloudId) return;
    const timer = setTimeout(() => void queueEventSync(value.event!), 750);
    return () => clearTimeout(timer);
  }, [ready, value.event]);
  const api = useMemo<State>(
    () => ({
      ready,
      toured: value.toured,
      event: value.event,
      demoCleanupPending: value.demoCleanupPending,
      acknowledgeDemo: () =>
        setValue((v) => ({ ...v, demoCleanupPending: false })),
      setToured: () => setValue((v) => ({ ...v, toured: true })),
      createEvent: (event) =>
        setValue((v) => ({
          ...v,
          event: {
            ...event,
            id: `${Date.now()}`,
            checklist: createChecklistForEvent(event.type, event.date, (key) =>
              i18n.t(key),
            ),
            budget: [],
            budgetCategories: suggestedBudgetCategories(),
            guests: [],
            timeline: [],
            team: [],
            seating: [],
            invitation: defaultInvitation,
            inventory: [],
            documents: [],
            thankYouMessage: "",
            records: {},
          },
        })),
      replaceEvent: (event) => setValue((v) => ({ ...v, event })),
      updateEvent: (changes) =>
        setValue((v) => ({
          ...v,
          event: v.event ? { ...v.event, ...changes } : null,
        })),
      toggleChecklist: (id) =>
        setValue((v) => ({
          ...v,
          event: v.event
            ? {
                ...v.event,
                checklist: v.event.checklist.map((x) =>
                  x.id === id ? { ...x, done: !x.done } : x,
                ),
              }
            : null,
        })),
      addChecklist: (item) =>
        setValue((v) => ({
          ...v,
          event: v.event
            ? {
                ...v.event,
                checklist: [
                  ...v.event.checklist,
                  { ...item, id: `${Date.now()}`, done: false },
                ],
              }
            : null,
        })),
      updateChecklist: (id, changes) =>
        setValue((v) => ({
          ...v,
          event: v.event
            ? {
                ...v.event,
                checklist: v.event.checklist.map((item) =>
                  item.id === id ? { ...item, ...changes } : item,
                ),
              }
            : null,
        })),
      deleteChecklist: (id) =>
        setValue((v) => ({
          ...v,
          event: v.event
            ? {
                ...v.event,
                checklist: v.event.checklist.filter((x) => x.id !== id),
              }
            : null,
        })),
      addBudget: (item) =>
        setValue((v) => ({
          ...v,
          event: v.event
            ? {
                ...v.event,
                budget: [...v.event.budget, { ...item, id: `${Date.now()}` }],
              }
            : null,
        })),
      restoreBudget: (item) =>
        setValue((v) => ({
          ...v,
          event: v.event
            ? { ...v.event, budget: [...v.event.budget, item] }
            : null,
        })),
      updateBudget: (id, changes) =>
        setValue((v) => ({
          ...v,
          event: v.event
            ? {
                ...v.event,
                budget: v.event.budget.map((x) =>
                  x.id === id ? { ...x, ...changes } : x,
                ),
              }
            : null,
        })),
      deleteBudget: (id) =>
        setValue((v) => ({
          ...v,
          event: v.event
            ? { ...v.event, budget: v.event.budget.filter((x) => x.id !== id) }
            : null,
        })),
      addGuest: (guest) =>
        setValue((v) => ({
          ...v,
          event: v.event
            ? {
                ...v.event,
                guests: [...v.event.guests, { ...guest, id: `${Date.now()}` }],
              }
            : null,
        })),
      updateGuest: (id, changes) =>
        setValue((v) => ({
          ...v,
          event: v.event
            ? {
                ...v.event,
                guests: v.event.guests.map((guest) =>
                  guest.id === id ? { ...guest, ...changes } : guest,
                ),
              }
            : null,
        })),
      addGuests: (guests) =>
        setValue((v) => ({
          ...v,
          event: v.event
            ? {
                ...v.event,
                guests: [
                  ...v.event.guests,
                  ...guests.map((guest, index) => ({
                    ...guest,
                    id: `${Date.now()}-${index}`,
                  })),
                ],
              }
            : null,
        })),
      deleteGuest: (id) =>
        setValue((v) => ({
          ...v,
          event: v.event
            ? { ...v.event, guests: v.event.guests.filter((x) => x.id !== id) }
            : null,
        })),
      addTimeline: (item) =>
        setValue((v) => ({
          ...v,
          event: v.event
            ? {
                ...v.event,
                timeline: [
                  ...v.event.timeline,
                  { ...item, id: `${Date.now()}` },
                ],
              }
            : null,
        })),
      updateTimeline: (id, changes) =>
        setValue((v) => ({
          ...v,
          event: v.event
            ? {
                ...v.event,
                timeline: v.event.timeline.map((item) =>
                  item.id === id ? { ...item, ...changes } : item,
                ),
              }
            : null,
        })),
      deleteTimeline: (id) =>
        setValue((v) => ({
          ...v,
          event: v.event
            ? {
                ...v.event,
                timeline: v.event.timeline.filter((item) => item.id !== id),
              }
            : null,
        })),
      addTeamMember: (member) =>
        setValue((v) => ({
          ...v,
          event: v.event
            ? {
                ...v.event,
                team: [...v.event.team, { ...member, id: `${Date.now()}` }],
              }
            : null,
        })),
      updateTeamMember: (id, changes) =>
        setValue((v) => ({
          ...v,
          event: v.event
            ? {
                ...v.event,
                team: v.event.team.map((member) =>
                  member.id === id ? { ...member, ...changes } : member,
                ),
              }
            : null,
        })),
      deleteTeamMember: (id) =>
        setValue((v) => ({
          ...v,
          event: v.event
            ? {
                ...v.event,
                team: v.event.team.filter((member) => member.id !== id),
              }
            : null,
        })),
      addTable: (table) =>
        setValue((v) => ({
          ...v,
          event: v.event
            ? {
                ...v.event,
                seating: [
                  ...v.event.seating,
                  { ...table, id: `${Date.now()}` },
                ],
              }
            : null,
        })),
      updateTable: (id, changes) =>
        setValue((v) => ({
          ...v,
          event: v.event
            ? {
                ...v.event,
                seating: v.event.seating.map((table) =>
                  table.id === id ? { ...table, ...changes } : table,
                ),
              }
            : null,
        })),
      deleteTable: (id) =>
        setValue((v) => ({
          ...v,
          event: v.event
            ? {
                ...v.event,
                seating: v.event.seating.filter((table) => table.id !== id),
                guests: v.event.guests.map((guest) =>
                  guest.tableId === id
                    ? { ...guest, tableId: undefined }
                    : guest,
                ),
              }
            : null,
        })),
      assignGuestTable: (guestId, tableId) =>
        setValue((v) => ({
          ...v,
          event: v.event
            ? {
                ...v.event,
                guests: v.event.guests.map((guest) =>
                  guest.id === guestId ? { ...guest, tableId } : guest,
                ),
              }
            : null,
        })),
      addInventory: (item) =>
        setValue((v) => ({
          ...v,
          event: v.event
            ? {
                ...v.event,
                inventory: [
                  ...v.event.inventory,
                  { ...item, id: `${Date.now()}` },
                ],
              }
            : null,
        })),
      updateInventory: (id, changes) =>
        setValue((v) => ({
          ...v,
          event: v.event
            ? {
                ...v.event,
                inventory: v.event.inventory.map((item) =>
                  item.id === id ? { ...item, ...changes } : item,
                ),
              }
            : null,
        })),
      deleteInventory: (id) =>
        setValue((v) => ({
          ...v,
          event: v.event
            ? {
                ...v.event,
                inventory: v.event.inventory.filter((item) => item.id !== id),
              }
            : null,
        })),
      addDocument: (document) =>
        setValue((v) => ({
          ...v,
          event: v.event
            ? {
                ...v.event,
                documents: [
                  ...v.event.documents,
                  { ...document, id: `${Date.now()}` },
                ],
              }
            : null,
        })),
      deleteDocument: (id) =>
        setValue((v) => ({
          ...v,
          event: v.event
            ? {
                ...v.event,
                documents: v.event.documents.filter((item) => item.id !== id),
              }
            : null,
        })),
      addRecord: (module, record) =>
        setValue((v) => ({
          ...v,
          event: v.event
            ? {
                ...v.event,
                records: {
                  ...v.event.records,
                  [module]: [
                    ...(v.event.records[module] || []),
                    { ...record, id: `${Date.now()}` },
                  ],
                },
              }
            : null,
        })),
      deleteRecord: (module, id) =>
        setValue((v) => ({
          ...v,
          event: v.event
            ? {
                ...v.event,
                records: {
                  ...v.event.records,
                  [module]: (v.event.records[module] || []).filter(
                    (x) => x.id !== id,
                  ),
                },
              }
            : null,
        })),
      reset: () =>
        setValue({ toured: true, event: null, demoCleanupPending: false }),
    }),
    [ready, value],
  );
  return (
    <AppStateContext.Provider value={api}>{children}</AppStateContext.Provider>
  );
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) throw new Error("AppStateProvider missing");
  return value;
}
