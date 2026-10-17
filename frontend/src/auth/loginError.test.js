import assert from "node:assert/strict";
import test from "node:test";
import { api, ApiError } from "../api/client.js";
import { getLoginErrorMessage } from "./loginError.js";

test("login 403 reports the login endpoint response instead of a page permission error", async (context) => {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: () => null }
  });
  context.mock.method(globalThis, "fetch", async () => new Response(
    JSON.stringify({ success: false, message: "You do not have permission" }),
    { status: 403, headers: { "Content-Type": "application/json" } }
  ));

  await assert.rejects(
    api("/api/auth/login", "POST", { username: "user", password: "pass" }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 403);
      assert.equal(error.path, "/api/auth/login");
      assert.equal(error.responseMessage, "You do not have permission");
      assert.equal(
        getLoginErrorMessage(error),
        "Sign-in was rejected (HTTP 403): You do not have permission. Check the POST /api/auth/login response in Network."
      );
      return true;
    }
  );
});

test("403 responses from other endpoints retain their normal permission message", async (context) => {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: () => null }
  });
  context.mock.method(globalThis, "fetch", async () => new Response("", { status: 403 }));

  await assert.rejects(
    api("/api/dashboard/summary"),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 403);
      assert.equal(getLoginErrorMessage(error), error.message);
      assert.match(error.message, /Access denied/);
      return true;
    }
  );
});
