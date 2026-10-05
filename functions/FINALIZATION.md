# Sunday Match Finalization

`finalizeSundayMatch` runs every Sunday at 10:00 in `Asia/Seoul`. No browser
connection is required. Scheduled delivery and retries can take a little time;
the browser waits for the server's completion flag, not just the local clock.

## Deployment Order

Use Node.js 22 and run these commands from the repository root:

```powershell
npm --prefix functions ci
npx firebase deploy --only "functions:finalizeSundayMatch,functions:syncRoundCorrections,functions:syncStatCorrections,functions:syncManualOverrides"
```

Deploy and verify these functions **before publishing the updated frontend**.
The previous browser-driven automatic finalization has been removed. Existing
`createVoteData` is unchanged and does not need to be redeployed for this change.
This repository change does not deploy anything or bulk-backfill old matches.
An explicit post-match edit can lazily create an archive for that historical date.

With Firebase CLI 14 or newer, enable deployment-artifact cleanup:

```powershell
npx firebase functions:artifacts:setpolicy --days 1 --location us-central1
```

The repository's current Firebase CLI is 13; upgrade it before using that command.

## Data

- RTDB: `YYYY/MMDD_rounds` remains the live match source.
- Firestore: `weeklyTeam/YYMMDD` supplies the exact match roster.
- Firestore: `members/members` supplies canonical names and nicknames.
- Firestore: `YYYY/MMDD` receives the final attendance, goals, assists, points and games.
- Firestore: `daily_mvp/YYMMDD` receives the final MVP winners in the same commit;
  the MVP popup is now read-only and uses the archive's `bestPlayers` array.
- Firestore: `matchArchives/YYYYMMDD` contains the versioned display bundle,
  including `baseStats` (RTDB-derived) and `stats` (after manual overrides).
- Firestore: `matchFinalizations/YYYYMMDD` contains `status`, `revision`,
  `finalizedAt` and `updatedAt`.
- Firestore: `matchCorrections/YYYYMMDD` contains absolute field-level
  `overrides`, kept separately from the RTDB-derived values.
- Firestore: `recordCacheVersions/years` contains a `revisions` map by year.
  Returning visits read this and the match completion document (two small reads)
  so edits to earlier dates/years invalidate stats, round and MVP caches too.

Stats, archive and the `finalized` flag are committed in one Firestore transaction.
The preceding RTDB transaction and Firestore transaction cannot be atomic across
both databases. Failed runs keep the match unfinalized and are safe to retry.
An active lease prevents concurrent finalizers. Identical retries do not add
points or create a new archive version.

Finished winners are preserved. An unfinished scoreless round starting before
09:55 is a draw; one starting at or after 09:55 is deleted. Fever goals still count
toward personal goals/assists but do not change an already finished winner.
Missing RTDB data never replaces saved activity with attendance-only zeros.

## Security Rules

`matchFinalizations`, `matchArchives` and `recordCacheVersions` need client read
access under the app's existing read policy. Clients must **not** be allowed to
write these collections or `matchCorrections`; only the Admin SDK and authorized
administrators in Firebase Console should write them. Clients do not need to
read `matchCorrections`.
Audit broad wildcard rules as Firebase allow rules are additive: a narrower
`allow write: if false` cannot override a wider `allow write: if true`.

For strict cutoff enforcement, restrict client writes to the matching
`YYYY/MMDD_rounds` and daily Firestore stats by **server time** to Sunday before
10:00. UI time checks alone cannot stop a stale/offline client or a direct SDK
write. No production security rules are replaced by this change because the
current rules are not present in this repository. Keep vote/typing/weekly-team
rules independent of the match-record cutoff.

## Cache Behavior

During Sunday recording, live round/year/roster listeners remain active. Once
the server archive has loaded successfully, they are detached and their data
is persisted in IndexedDB. A returning client first reads the completion
document and year versions, then reuses caches with those revisions. A first visit or cleared
browser storage still needs to fetch the data once.

Record-request subscriptions and the request button are disabled. The completed
Sunday roster is frozen for display. Future-week editing is still supported:
the weekly-team tab opens its own listener only on non-Sundays, and closes it
when leaving the tab. Members, voting and maintenance checks are independent;
this is not a promise of zero Firebase traffic across the entire app.

Old matches without finalization metadata are read-only legacy data and retain
the previous weekly cache policy. They are not marked server-finalized merely
because it is after 10:00.

The analysis tab also detaches its annual RTDB and MVP listeners after completion.
Already-open completed tabs do not watch for corrections: reload after the
correction function has finished to pick up the new versions.

## Post-Match Corrections

Three event functions handle console edits after the date's Korean-time 10:00
cutoff. Events originating before the cutoff are ignored even if delivered late.

- `syncRoundCorrections` watches `/{year}/{match=*_rounds}` in
  `flfc-d38b0-default-rtdb` (`us-central1`), excluding typing/vote/backup data.
  It reads the latest rounds, rebuilds personal base stats and applies overrides.
- `syncStatCorrections` watches top-level Firestore documents and filters valid
  `YYYY/MMDD` paths. Because collection names are years, the wildcard also fires
  for other top-level documents; those events return without database reads.
  Changed daily-stat fields become absolute overrides automatically.
- `syncManualOverrides` applies console edits/deletions of `matchCorrections`.

The functions can be invoked by in-match writes but immediately skip their sync
work. This is event-driven, not polling, but it is not zero function invocations
during a match. Unchanged server-generated results do not create overrides or
additional writes. Latest data is read inside transactions to protect manual
edits racing a rebuild; duplicate/out-of-order events are safe to repeat.

Example: edit a player's goal count in Firestore `2026/1004` to `3`.
The generated `matchCorrections/20261004` contains:

```json
{ "overrides": { "김근홍": { "골": 3 } } }
```

That goal count stays **3**, not RTDB's count plus 3. Other fields still follow
RTDB. To return goals to the RTDB-derived value, remove only that field from the
override document. Deleting the whole correction document resets all overrides
for that date. A `null` player override means that player was manually removed
from daily stats; deleting that override restores their calculated stats.

Use nonnegative integer numbers, not strings. Attendance is `0` or `1`.
Invalid edits are logged and not retried indefinitely; fix the value and save
again. Other transient failures are retried. Functions are not instantaneous:
wait for the successful sync log, then reload the browser.

Finished round winners are intentionally preserved to avoid changing wins due
to fever goals. A winner correction must keep `winnerTeam.number`,
`winnerTeam.member`, `teamList` and `participant` consistent. Editing a scorer
does not automatically change the winner. No correction function rewrites RTDB.
Deleting an individual goal/round updates the remaining aggregate; deleting an
entire RTDB date clears its archived rounds but preserves saved personal stats
to avoid accidental mass erasure.

Scheduled re-finalization uses the same override-aware publishing transaction,
so it no longer wipes Firestore manual corrections.

## Verification

These tests use in-memory stores, never production Firebase:

```powershell
node --experimental-vm-modules --test functions/test/finalizeMatch.test.mjs functions/test/syncMatchCorrection.test.mjs tests/matchSubscription.test.mjs tests/recordCacheIntegration.test.mjs
npm run build
```

After deploying, check the job's timezone/retry configuration in Cloud Scheduler
and the function logs. Use a Firebase emulator or a separate test project for
end-to-end verification before the next live match. Manually running the job in
the production project can change the latest Sunday's actual records.

## References

- [Scheduled functions](https://firebase.google.com/docs/functions/schedule-functions)
- [RTDB change triggers](https://firebase.google.com/docs/functions/database-events)
- [Firestore change triggers](https://firebase.google.com/docs/functions/firestore-events)
- [Deployment-artifact cleanup](https://firebase.google.com/docs/functions/manage-functions#clean_up_deployment_artifacts)
- [Firestore rule matching](https://firebase.google.com/docs/firestore/security/rules-structure)
