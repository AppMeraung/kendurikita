import { describe, expect, it } from "vitest";
import {
  userCanAdd,
  userFeature,
  vendorCanAdd,
  vendorFeature,
} from "./entitlements";
import { canSendPromotion, groupRsvp, isQuietHour, notificationRoute } from "./notifications";

describe("entitlements", () => {
  it("enforces user resource limits including bulk additions", () => {
    expect(userCanAdd("basic", "guests", 100)).toBe(false);
    expect(userCanAdd("basic", "guests", 90, 11)).toBe(false);
    expect(userCanAdd("pro", "guests", 100)).toBe(true);
    expect(userCanAdd("basic", "members", 1)).toBe(false);
  });
  it("gates paid user features", () => {
    expect(userFeature("basic", "qr")).toBe(false);
    expect(userFeature("pro", "qr")).toBe(true);
    expect(userFeature("pro", "gallery")).toBe(false);
    expect(userFeature("premium", "gallery")).toBe(true);
    expect(userFeature("pro", "invitation_music")).toBe(false);
  });
  it("enforces vendor limits and paid workflows", () => {
    expect(vendorCanAdd("basic", "leads", 5)).toBe(false);
    expect(vendorCanAdd("pro", "leads", 500)).toBe(true);
    expect(vendorCanAdd("basic", "categories", 0, 2)).toBe(false);
    expect(vendorFeature("basic", "quotations")).toBe(false);
    expect(vendorFeature("pro", "quotations")).toBe(true);
    expect(vendorFeature("pro", "video")).toBe(false);
    expect(vendorFeature("premium", "video")).toBe(true);
  });
});

describe("notification deep links", () => {
  it("accepts app schemes and internal routes but rejects external URLs", () => {
    expect(notificationRoute("kendurikita://vendor/leads/1")).toBe("/vendor/leads/1");
    expect(notificationRoute("/(user)/payments")).toBe("/(user)/payments");
    expect(notificationRoute("https://evil.example")).toBeNull();
    expect(notificationRoute("//evil.example")).toBeNull();
  });
});

describe("notification rules", () => {
  it("honours overnight quiet hours", () => {
    expect(isQuietHour(23)).toBe(true);
    expect(isQuietHour(7)).toBe(true);
    expect(isQuietHour(12)).toBe(false);
  });
  it("groups RSVP counts and enforces promotion opt-in", () => {
    expect(groupRsvp([5, 7, -1])).toBe(12);
    expect(canSendPromotion(false, 0)).toBe(false);
    expect(canSendPromotion(true, 1)).toBe(false);
    expect(canSendPromotion(true, 0)).toBe(true);
  });
});
