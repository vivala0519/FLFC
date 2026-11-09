# Sunday Match Finalization

## Deployment Order

1. Deploy the updated existing scheduler from the project root:

   ```powershell
   firebase deploy --only functions:triggerWeeklyNews
   ```

2. Confirm the function deploy succeeds, then deploy the web application using its usual deployment process.
3. Refresh any browsers that still have the old recorder open. Old bundles retain their previous write behavior.

No production data migration or manual function invocation is required. Do not test by invoking the production scheduler: it writes match records and sends the news webhook.

## Flow

- The existing `triggerWeeklyNews` schedule runs on Sunday at 10:00 Asia/Seoul.
- The original scheduled date, not the retry's execution date, selects the match.
- Read `weeklyTeam/YYMMDD`, `members/members`, and `members/info`. Skip off weeks, missing or empty rosters, and missing round data.
- Finalize the last unfinished RTDB round at `YYYY/MMDD_rounds` in a transaction. A zero-goal round starting at or after 09:55 is deleted; an earlier zero-goal round is a draw. Fever goals count toward individual records, not the match result.
- Save final stats in `YYYY/MMDD`, create `daily_mvp/YYMMDD` only if absent, and mark `_matchFinalizations/YYMMDD` as completed in one Firestore transaction.
- MVP score is regular-time goals + assists + 1.5 per goalkeeper clean-sheet round. Both `goalKeeper` and `goalkeeper` flags are supported. All positive-score ties share MVP; zero-score days have no MVP. Stored players retain `name`, `goal`, and `assist`, with `cleanSheets` and `score` added. Individual daily goals/assists still include fever time. Existing MVP documents are never recalculated.
- Only then send the existing news webhook. Failures are retried up to three times. A webhook retry does not recalculate a completed match.
- A completed marker prevents later executions from overwriting manually corrected Firestore or RTDB records. Existing attendance of `0.5` is also preserved if corrected before the first final commit.
- A failed RTDB-to-Firestore handoff can retry without re-finalizing the round or changing its already recorded winner. Incomplete round/team data fails visibly rather than silently saving partial stats.

## Browser Behavior

- Automatic daily stat writes stop at 10:00; there is no post-match write exception.
- Hidden MVP/team popups no longer mount to perform writes.
- Weekly team editing remains independent of the record time window.
- Firestore/RTDB subscriptions remain available for reading corrections and displaying news.
- These changes govern updated application code, not Firebase Security Rules. They do not prevent console edits or writes from an already open old version.

The shared pure rules live in `matchStats.mjs`, `goalkeeperStats.mjs`, and `dailyMvp.mjs` so Functions deployment includes them. Analysis imports the same goalkeeper rules; its daily clean-sheet record compares each goalkeeper's personal best day, so a record holder does not also appear as a chaser.
