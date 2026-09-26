import test from "node:test";
import assert from "node:assert/strict";
import { reconcile, reorgTarget } from "./rules.mjs";

const STATE = "state-a";
const OTHER = "state-b";

test("a state-neutral duplicate with a stale lane tip is skipped", () => {
  const cov = { state: STATE, laneTip: 2, daa: 10 };
  const duplicate = { prevState: STATE, prevLaneTip: 1 };
  const watch = { newState: STATE, newLaneTip: 2, daa: 10 };
  const skipped = reconcile(cov, duplicate, null);
  assert.equal(skipped.settle, false);
  const held = reconcile(cov, duplicate, watch);
  assert.equal(held.settle, false);
  assert.equal(held.cov.laneTip, 2);
});

test("a state-neutral external advance is adopted", () => {
  const cov = { state: STATE, laneTip: 1, daa: 10 };
  const next = { prevState: STATE, prevLaneTip: 2 };
  const watch = { newState: STATE, newLaneTip: 2, daa: 11 };
  const adopted = reconcile(cov, next, watch);
  assert.equal(adopted.settle, true);
  assert.equal(adopted.cov.laneTip, 2);
  assert.equal(adopted.cov.state, STATE);
});

test("a bundle that already chains settles without the watch", () => {
  const cov = { state: STATE, laneTip: 1, daa: 10 };
  const art = { prevState: STATE, prevLaneTip: 1 };
  const settled = reconcile(cov, art, null);
  assert.equal(settled.settle, true);
  assert.equal(settled.cov.laneTip, 1);
});

test("a competitor that already moved the state stays skipped", () => {
  const cov = { state: OTHER, laneTip: 3, daa: 20 };
  const stale = { prevState: STATE, prevLaneTip: 1 };
  const watch = { newState: OTHER, newLaneTip: 3, daa: 20 };
  const skipped = reconcile(cov, stale, watch);
  assert.equal(skipped.settle, false);
  assert.equal(skipped.cov.state, OTHER);
  assert.equal(skipped.cov.laneTip, 3);
});

test("a reorg whose child is unknown stops", () => {
  assert.deepEqual(reorgTarget(false, 0, false), { error: "ReorgBelowRoot" });
});

test("a parent with no metadata and a non-zero id is refused", () => {
  assert.deepEqual(reorgTarget(true, 4, false), { error: "ReorgBelowRoot" });
});

test("genesis stays a legal rollback", () => {
  assert.deepEqual(reorgTarget(true, 0, false), { rollsTo: 0 });
});

test("a parent that still has metadata is rolled to", () => {
  assert.deepEqual(reorgTarget(true, 8, true), { rollsTo: 8 });
});
