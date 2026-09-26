// The settler decision from kaspanet/vprogs zk/backend/risc0/settler/src/worker.rs
// at 3a61c0ba608b, written out so it can run without the RISC Zero crate.

export function reconcile(cov, artifact, latest) {
  const chains = (c) =>
    c.state === artifact.prevState && c.laneTip === artifact.prevLaneTip;
  if (chains(cov)) return { settle: true, cov: { ...cov } };
  const next = { ...cov };
  if (
    latest &&
    (latest.newState !== cov.state || latest.newLaneTip !== cov.laneTip) &&
    latest.daa >= cov.daa
  ) {
    next.state = latest.newState;
    next.laneTip = latest.newLaneTip;
    next.daa = latest.daa;
  }
  return { settle: chains(next), cov: next };
}

// The guard that belongs in handle_reorg. The sink has no base() method.
// A parent still in the live window has metadata. Genesis (0) is the legal empty case.
// Anything else with no metadata is under the floor and must not be rolled to.
export function reorgTarget(forkChildKnown, parentId, parentMetadata) {
  if (!forkChildKnown) return { error: "ReorgBelowRoot" };
  if (parentId !== 0 && !parentMetadata) return { error: "ReorgBelowRoot" };
  return { rollsTo: parentId };
}
