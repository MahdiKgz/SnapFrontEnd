# Healing progress reconciliation

The map and background notification manager now use `watchHealingJob`:

- SSE continues to provide immediate stage/progress updates and resumes from the last event ID.
- An authenticated status request runs immediately and every 5 seconds after the previous request finishes. A request times out after 10 seconds; requests do not overlap within one watcher.
- Returning to the tab or reconnecting the network triggers a fresh status check.
- A completed/failed/cancelled snapshot stops the stream, polling, reconnect timers and browser listeners. Completion loads the map output exactly once and invalidates dashboard file/summary caches.
- Late nonterminal responses cannot regress terminal state or create duplicate notifications. An explicit retry can restart a failed/cancelled job.
- Updating the map completion callback no longer recreates the SSE connection. Background connections are cleaned up on logout/token change/unmount, rather than on every render.
- The SSE reader handles CRLF split between network chunks and a final lifecycle event at EOF.

The percentage remains the real engine progress; no simulated increments are added.
This is a frontend reliability change using the existing GET /heal/:jobId endpoint.

Regression tests cover an open but silent SSE stream after server completion,
late snapshots, reconnect failure, tab focus, cancellation/cleanup, automatic output
application, stable subscriptions across renders and split SSE frames. Full frontend
suite: 108 passing tests; production build passes.
