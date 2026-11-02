/// <reference types="node" />
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
const sql = readFileSync(
  resolve("supabase/migrations/202611020011_secure_chat.sql"),
  "utf8",
);
describe("secure chat migration", () => {
  it("removes broad message updates and exposes a read-only receipt RPC", () => {
    expect(sql).toContain("drop policy if exists messages_parties_update");
    expect(sql).toContain("sender_id <> auth.uid()");
    expect(sql).toContain("set read_at = now()");
  });
  it("rejects empty database messages", () => {
    expect(sql).toContain("message_content_present");
    expect(sql).toContain("attachment_path is not null");
  });
  it("keeps private attachments limited to lead parties", () => {
    expect(sql).toContain("chat_attachments_parties_read");
    expect(sql).toContain("chat_attachments_parties_insert");
    expect(sql).toContain("chat_attachments_parties_delete");
  });
});
