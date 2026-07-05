# DECISION LOG — P2P Collaborative IDE

---

## 2026-04-17 — CRDT transport channel naming

**Decision:** Changed `transport.send('sync', ...)` and `transport.send('awareness', ...)` in `crdt.js` to use `'yjs:update'` and `'yjs:awareness'` as the channel names, and updated the `onMessage` handler to match on `msg.channel` instead of `msg.type`.

**Reason:** `transport.send(channelName, data)` wraps the payload as `{ channel: channelName, data }`. The outgoing channel name is metadata carried inside the payload, while the socket event name is always `'yjs:update'` (transport doesn't expose per-channel socket events). The `onMessage` callbacks receive the full `{ channel, data }` object, so matching on `msg.channel` is the correct field. Using `'sync'`/`'awareness'` as channel names while checking `msg.type === 'sync'`/`'awareness'` was a double mismatch — wrong field and wrong value — meaning no Yjs updates were ever applied on receiving peers.

**Alternatives considered:** Changing the transport API to route by socket event name (one socket event per channel type). Rejected — would violate the "Transport API is sacred" architecture rule and break the WebRTC data channel path.

---

## 2026-04-17 — Yjs doc/provider exposed as React state (not refs)

**Decision:** In `useCollaboration`, changed `provider: providerRef.current` and `doc: docRef.current` return values to come from `useState` (`yjsState`). Internal effects still use refs for synchronous access.

**Reason:** React refs do not trigger re-renders. `AppShell` was calling `useCursors(colab.provider, editorRef)` where `colab.provider` was always the initial ref value (`null`) because the Yjs initialization `useEffect` runs after the first render. `useCursors` would see `null`, skip setup, and never retry. Exposing provider+doc as state means consumers automatically re-render when the Yjs doc is ready.

**Alternatives considered:** Passing `providerRef` directly to `useCursors` and polling inside the hook. Rejected — polling is fragile. Using a React context. Rejected — unnecessary for a single-component consumer. Using a state toggle flag (`isReady`). Considered — equivalent but slightly less explicit than a real state object.

---

## 2026-04-17 — Cursor protocol: Yjs Awareness API (not custom socket events)

**Decision:** `useCursors` reads directly from `provider.awareness.getStates()` and subscribes to the `'change'` event. No additional socket events or data structures were introduced.

**Reason:** The `CustomYjsProvider` already propagates awareness state through the transport layer (both WebRTC and relay paths). `y-monaco`'s `MonacoBinding` automatically writes the local cursor position into awareness as `state.cursor = { anchor, head }`. Introducing a separate cursor socket event would duplicate the infrastructure, add an ordering race between socket connect and awareness init, and break the WebRTC P2P path (which has no separate socket channel for cursor data).

**Alternatives considered:** Emitting `cursor:update` Socket.io events on every Monaco `onDidChangeCursorPosition`. Rejected — doubles the wire traffic, requires a separate server handler, and doesn't work over the WebRTC data channel without additional plumbing.

---

## 2026-04-17 — useVersionHistory restoreSnapshot via Yjs transaction

**Decision:** `restoreSnapshot(id, doc, activeFileId)` now writes the snapshot content directly into the Yjs `Y.Text` type (`doc.getText('file:<id>')`) wrapped in `doc.transact()`, replacing the previous `editorRef.current.setValue()` approach.

**Reason:** `editor.setValue()` is a local Monaco API call — it updates only the local editor instance and is not observed by the Yjs binding or broadcast to collaborators. Writing into the `Y.Text` type goes through the full Yjs sync pipeline: the update is encoded, passed to `CustomYjsProvider`, and sent to all peers via transport. All collaborators converge to the restored state atomically.

**Alternatives considered:** Emitting a custom socket event `history:restore` that tells all peers to call `editor.setValue()`. Rejected — this creates a second un-CRDT'd sync channel; concurrent edits during restore would cause split-brain. Using `Y.applyUpdate` with a full document snapshot stored in Redis. Considered for future improvement — requires storing binary Yjs state vectors instead of plain text snapshots.

---

## 2026-04-17 — AppShell double hook call fix via bindFileId state

**Decision:** Removed the two illegal duplicate `useCollaboration` + `useFileSystem` calls in `AppShell`. Added a `bindFileId` local state variable and a `useEffect` to sync `fs.activeFileId → bindFileId`. `useCollaboration` is now called once with `bindFileId`.

**Reason:** The original code had a circular dependency: `useCollaboration` needed `activeFileId` (from `useFileSystem`) but `useFileSystem` needed `doc` (from `useCollaboration`). The "fix" was to call both hooks twice, which created two separate Yjs documents in the same session — meaning updates generated by one instance were never seen by the other. Adding `bindFileId` as component-level state breaks the cycle: on the first render `bindFileId=null` so `useCollaboration` initialises the doc; `useFileSystem` then runs its effect, calls `setActiveFileId`, which propagates to `setBindFileId` via the effect, triggering a re-render where `useCollaboration` gets the correct file id.

**Alternatives considered:** Lifting `activeFileId` into `useCollaboration` internally by observing the Yjs file map. Rejected — would tightly couple collaboration to file system logic. Merging both hooks into a single `useWorkspace` hook. Considered as a future refactor but out of scope for this targeted fix.

---

## 2026-04-17 — WebRTC initiator detection fix

**Decision:** Changed `activeUsers[1].id === socket.data?.user?.id` to `activeUsers[1]?.id === user?.id` in `useWebRTC`, and added `user` as a hook parameter.

**Reason:** `socket.data` is a Socket.io server-side concept — on the client, `socket.data` is always `undefined`. The initiator check was therefore always `false`, so the second user to join a room never sent the WebRTC offer, and P2P mode was never established automatically (it could still be triggered by an incoming offer from the server side, but that path was also broken). Using the `user` object from `useRoom` (already available in `AppShell`) gives the correct client identity.

**Alternatives considered:** Reading the user id from `socket.auth`. Would require setting `socket.auth` during `io()` initialization. Storing the user id in `localStorage` and reading it in `useWebRTC`. Unnecessarily complex when the user object is already in scope.
