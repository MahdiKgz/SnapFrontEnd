# SnapGIS — SSE + Map Review Implementation Plan

Scope: finish the polling→SSE migration for the topology-healing job output, and add
a "view on map" flow from the file summary table that lets a specialist inspect the
healed result, compare it against the original, and jump into manual review from
the map.

Execute in the order below — lighter/lower-risk items first so an MVP ships sooner;
heavier reliability/control items are deliberately deferred to right before the
AutoCAD (DWG/DGN) input phase, where longer-running jobs make them matter more.

---

## 0. Prerequisite — data model

- [x] Confirm original (pre-healing) geometry and healed (post-healing) geometry are
      stored as two separate records per file/job, not overwritten in place.
      Everything in section 3 (map toggle) depends on this. If not yet true, do this
      first — it's a schema/storage change, not a UI change.

## 1. SSE — light tier (do first, ships fastest)

- [x] **Heartbeat**: write an empty SSE comment (`: heartbeat\n\n`) every 15–30s on the
      `/heal/:jobId/events` stream so reverse proxies don't silently time out
      idle connections.
- [x] **Staged progress events**: in the healing worker, call `job.updateProgress()` at
      each pipeline boundary (parsing → error detection → healing → report generation)
      instead of only at completion. The SSE endpoint forwards
      `progress` events from BullMQ QueueEvents — this step is backend-only.
- [x] **Live error counter**: extend the same progress payload with running counts per
      error type (gap/sliver/kink/spike) as they're found. No new event type needed —
      richer payload on the same `progress` event from the step above.

## 2. SSE — moderate tier (before real users hit long jobs)

- [ ] **Reconnect via `Last-Event-ID`**: assign an incrementing `id` to every emitted
      SSE event; persist a short event history per job (e.g. a Redis list) so a
      reconnecting client can request replay from its last seen id instead of losing
      state after a dropped connection.
- [ ] **Cross-page sync**: move from a per-job SSE subscription to a per-user channel
      (or maintain multiple subscriptions) so a completed/failed job can trigger a
      global toast and a live row update in the file summary table even when the user
      has navigated away from that file's page. Requires a small global state layer
      on the frontend (not just local component state).

## 3. Map view — "view on map" from the summary table

- [ ] Add a button per row (and ideally per flagged error within a row) in the file
      summary table that deep-links to the map, centered on that file's extent or,
      for a specific error row, zoomed to that error's coordinates.
- [ ] **Default view = healed result.** This is the primary deliverable; show it by
      default, not the raw upload.
- [ ] Add a toggle (or ghost/overlay layer) to show the **original** geometry alongside
      the healed one, so a specialist can visually verify what changed. A simple on/off
      toggle is enough for v1; a swipe/compare control can come later.
- [ ] Render any features still pending **manual review** as distinct markers on the
      same map (not just in the separate review list), and make clicking one open the
      same review detail panel already built (badge + reason + coordinates +
      approve/reject/manual-edit) — reuse that pattern rather than inventing a new one.

## 4. Deferred — do once AutoCAD (DWG/DGN) phase starts

- [ ] **Cancel button**: cooperative cancellation in the worker (periodic check of a
      cancel flag) plus a cancel action in the UI. Low value for short shapefile jobs;
      becomes important once CAD files make jobs longer and more expensive to run to
      completion unnecessarily.

---

## Notes for whoever implements this
- Sections 1 and 3 can be built in parallel — they touch different parts of the stack
  (worker/SSE vs. table/map UI) and section 3 only needs the *existing* completed-job
  data, not the new staged-progress events.
- Section 2 and section 4 are explicitly lower priority — don't start them before
  sections 1 and 3 are done and shipped.
