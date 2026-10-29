# Presenter checklist

## The day before

- [ ] **Python version:** `python3 --version` should report 3.9 or newer. There's nothing to `pip install`.
- [ ] **Fetch every checkpoint:** run `git fetch origin --tags`, then `git branch -a | grep checkpoint`. You should see five checkpoints.
- [ ] **Smoke test each checkpoint.** For each one, run the commands below, check the expected result, then stop the server with Ctrl+C:

  ```bash
  git switch checkpoint/0-starter && python3 -m unittest && python3 -m rover
  ```

  | Checkpoint | `python3 -m unittest` | In the browser (`tiny` maze) |
  |---|---|---|
  | `checkpoint/0-starter` | OK (some rover tests are skipped) | The maze draws. Pressing an arrow shows "Bounds check not implemented". There's no Solve button. |
  | `checkpoint/1-manual` | OK | Arrows move the rover. Rocks show "Blocked by a rock" and edges show "That's the edge of the map". |
  | `checkpoint/2-solver` | OK | Solve shows "Route: 6 moves". `walled-in` shows "No route exists". |
  | `checkpoint/3-battery` | OK | Solve with battery 6 shows "reachable ✔". Battery 5 shows "NOT reachable ✘". |
  | `checkpoint/4-bug` | OK (that's the point) | Solve shows "Route: 7 moves". Battery 6 shows "NOT reachable ✘". |

- [ ] **Record a backup screen recording** of the full run (demos 1–3 plus the bug) in case the network or agent fails on the day.
- [ ] **Test the agent prompts once** on a scratch branch, so you know roughly how long each one takes.

## Git commands for the day

```bash
git switch checkpoint/0-starter   # Demo 1 start
git switch checkpoint/1-manual    # Demo 2 start / Demo 1 fallback
git switch checkpoint/2-solver    # Demo 3 start / Demo 2 fallback
git switch checkpoint/3-battery   # Demo 3 fallback
git switch checkpoint/4-bug       # prepared bug
```

If live edits are in the way, run `git stash -u` (or `git restore . && git clean -fd`) before switching. **Restart `python3 -m rover` after every switch.**

## Just before you go on

- [ ] Close all other apps and turn on **Do Not Disturb** so notifications are off (Slack, Teams, mail and calendar).
- [ ] Set browser zoom to **125–150%** and check that the status bar is readable from the back row.
- [ ] Set the editor/terminal font size to **20+** and use a high-contrast theme.
- [ ] Open `docs/prompts.md` in a tab, ready to copy.
- [ ] Keep the server terminal visible but small.
- [ ] Open the backup recording, ready to play.
- [ ] Charge your laptop, and confirm the projector resolution.

## Answer key: `tiny` maze

```
     0 1 2 3 4
  0  S . # . .
  1  # . # . #
  2  . . . . G
  3  . # # # .
  4  . . . . .
```

- **Shortest route:** (0,0) → (0,1) → (1,1) → (2,1) → (2,2) → (2,3) → (2,4)
- **Directions:** right, down, down, right, right, right
- **6 moves** (7 squares including the start). This is the only 6-move route.
- **Battery:** 6 is enough (exactly enough counts as enough), and 5 is not.
- **On `checkpoint/4-bug`:** the status bar shows 7 moves (it counts squares), so battery 6 wrongly shows "NOT reachable".

## Other mazes

- `crater` (10 × 10): 19 moves.
- `canyon`: 39 moves.
- `walled-in`: no route.
- `already-there`: 0 moves.
- **Bounds questions:** on a 10-row grid, row 0 is inside, row −1 is outside and row 10 is outside.
