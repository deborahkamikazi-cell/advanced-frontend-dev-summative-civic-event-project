import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { setCurrentUser } from "../js/utils/storage.js";
import {
  isNotificationRead, markAllNotificationsReadLocal, markNotificationReadLocal,
  normalizeNotification, NOTIFICATIONS_READ_EVENT
} from "../js/utils/notification-state.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value))
  };
}

test.beforeEach(() => {
  globalThis.sessionStorage = memoryStorage();
  globalThis.localStorage = memoryStorage();
  globalThis.window = new EventTarget();
});

test("frontend scripts parse as browser modules, including top-level await", () => {
  const root = fileURLToPath(new URL("../js/", import.meta.url));
  for (const file of readdirSync(root, { recursive: true }).filter((name) => name.endsWith(".js"))) {
    execFileSync(process.execPath, ["--input-type=module", "--check"], {
      input: readFileSync(`${root}/${file}`),
      stdio: ["pipe", "pipe", "pipe"]
    });
  }
});

test("backend notification types match category tabs and generate content links", () => {
  for (const [type, label, page] of [
    ["event", "Event", "event-details"],
    ["announcement", "Announcement", "announcement-details"],
    ["promo", "Promo", "promo-details"]
  ]) {
    const item = normalizeNotification({ id: "notice", type, metadata: { [`${type}_id`]: "content-id" } });
    assert.equal(item.type, label);
    assert.equal(item.related_url, `/pages/user/${page}.html?id=content-id#id=content-id`);
  }
});

test("read state is isolated per account and changes notify the badge and drawer", () => {
  const item = { id: "broadcast", read: false };
  let updates = 0;
  window.addEventListener(NOTIFICATIONS_READ_EVENT, () => { updates += 1; });
  setCurrentUser({ id: "first-user" });
  markNotificationReadLocal(item.id);
  assert.equal(isNotificationRead(item), true);
  assert.equal(updates, 1);
  setCurrentUser({ id: "second-user" });
  assert.equal(isNotificationRead(item), false);
  markAllNotificationsReadLocal(["another-notice"]);
  assert.equal(isNotificationRead(item), false);
  assert.equal(isNotificationRead({ id: "another-notice" }), true);
  assert.equal(updates, 2);
  setCurrentUser({ id: "first-user" });
  assert.equal(isNotificationRead(item), true);
  assert.equal(isNotificationRead({ id: "another-notice" }), false);
});
