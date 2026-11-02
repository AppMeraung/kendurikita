/// <reference types="node" />
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve("supabase/migrations/202611020008_vendor_rls_hardening.sql"),
  "utf8",
);
const jobSheetMigration = readFileSync(
  resolve("supabase/migrations/202611020032_vendor_job_sheet.sql"),
  "utf8",
);
const safetyMigration = readFileSync(
  resolve("supabase/migrations/202611020033_user_reports_and_blocks.sql"),
  "utf8",
);
const adminOperationsMigration = readFileSync(
  resolve("supabase/migrations/202611020034_admin_operations.sql"),
  "utf8",
);
const entitlementMigration = readFileSync(
  resolve("supabase/migrations/202611020035_entitlement_corrections.sql"),
  "utf8",
);
const checkInMigration = readFileSync(
  resolve("supabase/migrations/202611020028_secure_guest_checkin.sql"),
  "utf8",
);
const notificationMigration = readFileSync(
  resolve("supabase/migrations/202611020024_notification_outbox.sql"),
  "utf8",
);
const eventInviteMigration = readFileSync(
  resolve("supabase/migrations/202611020036_event_member_invites.sql"),
  "utf8",
);
const dayNotesMigration = readFileSync(
  resolve("supabase/migrations/202611020037_shared_day_notes.sql"),
  "utf8",
);

describe("vendor RLS hardening migration", () => {
  it("requires message senders to belong to the lead", () => {
    const policy = migration.slice(
      migration.indexOf("create policy messages_party_insert"),
      migration.indexOf("create policy messages_parties_update"),
    );
    expect(policy).toContain("sender_id = auth.uid()");
    expect(policy).toContain("l.id = lead_id");
    expect(policy).toContain(
      "l.sender_id = auth.uid() or v.owner_id = auth.uid()",
    );
  });
  it("defines party isolation for quotations and invoices", () => {
    expect(migration).toContain("create policy quotations_parties_read");
    expect(migration).toContain("create policy invoices_parties_read");
    expect(migration).toContain("kendurikita.owns_vendor(vendor_id)");
    expect(migration).toContain("kendurikita.is_event_member(event_id)");
  });
  it("keeps admin access behind the profiles admin role", () => {
    expect(migration).toContain("p.id = auth.uid() and p.role = 'admin'");
    expect(migration).toContain("create policy vendors_admin_manage");
    expect(migration).toContain("create policy reviews_admin_manage");
  });
});

describe("vendor job sheet boundary", () => {
  it("requires a confirmed lead owned by the signed-in vendor", () => {
    expect(jobSheetMigration).toContain("l.status = 'confirmed'");
    expect(jobSheetMigration).toContain("v.owner_id = auth.uid()");
    expect(jobSheetMigration).toContain("revoke all on function");
  });
});

describe("chat report and block boundary", () => {
  it("blocks message insertion in both directions", () => {
    expect(safetyMigration).toContain("b.blocker_id=l.sender_id and b.blocked_id=v.owner_id");
    expect(safetyMigration).toContain("b.blocker_id=v.owner_id and b.blocked_id=l.sender_id");
    expect(safetyMigration).toContain("raise exception 'not_chat_party'");
  });
  it("only accepts reports for visible targets or chat-party messages", () => {
    expect(safetyMigration).toContain("drop policy if exists reports_author_insert");
    expect(safetyMigration).toContain("m.id=target_id and (l.sender_id=auth.uid() or v.owner_id=auth.uid())");
    expect(safetyMigration).toContain("moderation_reports_open_once");
  });
});

describe("admin operation boundaries", () => {
  it("keeps portfolio and subscription changes admin-only and audited", () => {
    expect(adminOperationsMigration.match(/if not kendurikita\.is_admin\(\)/g)).toHaveLength(2);
    expect(adminOperationsMigration).toContain("'moderate_portfolio'");
    expect(adminOperationsMigration).toContain("'admin_update_subscription'");
    expect(adminOperationsMigration).toContain("moderation_status='approved'");
  });
});

describe("server entitlement boundaries", () => {
  it("requires Pro for QR check-in, parent contributions and automatic RSVP reminders", () => {
    expect(checkInMigration).toContain("kendurikita.is_event_member(target_event)");
    expect(checkInMigration).toContain("kendurikita.event_plan(target_event) = 'basic'");
    expect(entitlementMigration).toContain("new.role='parent' and plan='basic'");
    expect(entitlementMigration).toContain("kendurikita.event_plan(event_id)<>'basic'");
    expect(notificationMigration).toContain("g.rsvp_status='pending' and kendurikita.event_plan(e.id)<>'basic'");
  });
});

describe("event member invite boundary", () => {
  it("requires the owner, expires and consumes one invite under member triggers", () => {
    expect(eventInviteMigration).toContain("kendurikita.is_event_owner(target_event)");
    expect(eventInviteMigration).toContain("invite.expires_at<=now()");
    expect(eventInviteMigration).toContain("for update");
    expect(eventInviteMigration).toContain("insert into kendurikita.event_members");
    expect(eventInviteMigration).toContain("invite_already_used");
  });
});

describe("shared day notes boundary", () => {
  it("allows event members to read but requires an editor and Pro entitlement to write", () => {
    expect(dayNotesMigration).toContain("kendurikita.is_event_member(event_id)");
    expect(dayNotesMigration.match(/kendurikita\.can_edit_event\(event_id\)/g)?.length).toBeGreaterThanOrEqual(3);
    expect(dayNotesMigration.match(/kendurikita\.event_plan\(event_id\) <> 'basic'/g)?.length).toBeGreaterThanOrEqual(3);
    expect(dayNotesMigration).toContain("unique(event_id, local_key)");
    expect(dayNotesMigration).toContain("supabase_realtime add table kendurikita.day_notes");
  });
});
