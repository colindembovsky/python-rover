# Demo script: Mars Rover Mission Control (45 minutes)

**Central question:** *If AI can write the code, what is the engineer's job?*

This script covers the full 45-minute session. For a short version, skip to [the 5-minute quick demo](#5-minute-quick-demo) at the end.

Before you start, work through [presenter-checklist.md](presenter-checklist.md). Copy/paste prompts are in [prompts.md](prompts.md).

**Ground rules for the presenter**

- **Use the 90-second rule.** If the agent hasn't produced a working result within about 90 seconds of waiting, say *"Real engineers have a plan B too"*, switch to the next checkpoint, restart the server and carry on.
- **If time slips, cut the extension first** (Demo 3's battery build). You can still show the prepared bug from `checkpoint/4-bug`.
- **Restart the server after every `git switch`** with Ctrl+C, then `python3 -m rover`.

---

## 0–3 min: Show the app and set the challenge

**Checked out:** `checkpoint/1-manual` (so you can drive), or `checkpoint/0-starter` if you're going straight into Demo 1. **On screen:** the `tiny` maze.

> "You've been learning how to tell a computer what to do using Python. Today we're going to try a different approach: describe a goal, let an AI help build the solution, and then decide whether we trust what it made. You're mission control."

- Point out the white rover (seen from above, mast at the front), the white target crosshair, the boulders and the row/column numbers. Each grid square is one move.
- Say: *"Our job today is to get this rover to the target. First by hand, then by teaching it to plan its own route."*

## 3–8 min: From machine-learning lessons to LLMs and agents

**On screen:** slides or a whiteboard, with the app in the background.

- **"The bat…" context activity:** ask the class to finish *"The bat…"*. Is it the animal or the cricket bat? Add context: *"The bat flew out of the cave…"* versus *"The bat hit the ball…"*. **Talk track:** *"A language model predicts what comes next from the context it's given. The more useful context we give it, the better its guess."*
- Draw the agent loop:

  ```
  Goal ──► model proposes an action ──► a tool runs it ──► the result comes back ──► next action ...
  ```

- **Talk track:** *"An agent is that loop: the model suggests a step, real tools do the step, and the results become new context. Today the tools are our code editor, the terminal and the tests."*

## 8–12 min: Demo 1. The AI writes `is_inside_grid`

**Checked out:** `checkpoint/0-starter`, then run `python3 -m rover`.

1. Drive the rover once. The status bar says **"Bounds check not implemented"**. Say: *"The map draws, but the rover doesn't know where the map ends."*
2. Open `rover/grid.py` and show the stub: `is_inside_grid(row, col, rows, cols)`.
3. **Before running the prompt, ask the class to predict:** *"On a 10-row grid, is row 0 inside? Row −1? Row 10?"* (Answers: yes, no, **no**, because the rows are numbered 0 to 9.) Write their predictions on the board.
4. Paste the **Demo 1 prompt** from [prompts.md](prompts.md).
5. While it runs, say: *"I gave it a goal and the rules, not the code."*
6. Check the result against the class's predictions: does the test for row 10 exist? Run `python3 -m unittest`.
7. Restart the server, drive on `tiny` and bump into a rock and an edge. The status shows **"Blocked by a rock"** or **"That's the edge of the map"**.

*Fallback:* `git switch checkpoint/1-manual`.

## 12–24 min: Demo 2. Delegate the Solve feature

**Checked out:** `checkpoint/1-manual` (or your Demo 1 result).

1. **Talk track:** *"Now a bigger job. Instead of one function, we'll delegate a whole feature, but with a bounded prompt: clear requirements, clear limits, and tests."*
2. Paste the **Demo 2 prompt** from [prompts.md](prompts.md). Read the requirements out loud as you paste, and point to *"Use a straightforward algorithm, not a machine-learning model"* and *"Do not add dependencies"*.
3. While the agent works (time-box it to 90 seconds of waiting), ask: *"How would YOU find the shortest route on `tiny`?"* Let the class count. **Answer: 6 moves.**
4. Review what it made:
   - `rover/planner.py` is separate from the drawing code. Scroll through it: *"No model, no internet. It's a loop and a queue."*
   - Run `python3 -m unittest`.
5. Restart the server and click **Solve** on `tiny`. The status shows **"Route: 6 moves"**, and the numbered steps end at 6.
6. Switch the maze to `walled-in` and click **Solve**. The status shows **"No route exists"**, and nothing crashes.
7. **Key reveal:**
   > "The rover isn't asking an LLM where to move. The model helped create a conventional program. Once built, that program can run without the model."

   To prove it, turn off Wi-Fi and click Solve again.

*Fallback:* `git switch checkpoint/2-solver`.

## 24–33 min: Demo 3. A new requirement from the class (battery budget)

**Checked out:** `checkpoint/2-solver` (or your Demo 2 result).

1. **Talk track:** *"Mission control has a new constraint: the rover has a battery, and one move uses one unit."*
2. **Ask the class:** *"The route is 6 moves and the battery is 6. Is that enough?"* Take a vote. Agree that **exactly enough is enough**, and write that down as the acceptance criterion.
3. Paste the **Demo 3 prompt** from [prompts.md](prompts.md), and fill in the blank live with the class's answer.
   - *If time is short, skip the build:* `git switch checkpoint/3-battery`.
4. Restart the server. On `tiny`, try battery **6**, which shows **"reachable ✔"**, then battery **5**, which shows **"NOT reachable ✘"**.
5. **Challenge it. Students call out the cases:**
   - Block the destination: on `walled-in`, the status shows "No route exists".
   - Battery one too low: try 5 on `tiny`.
   - Start at the goal: on `already-there`, the status shows "Route: 0 moves", and battery 0 is reachable.
6. **The prepared bug.** Run `git switch checkpoint/4-bug`, restart the server, then on `tiny` click Solve with battery 6.
   - The status says **"Route: 7 moves. Battery 6: NOT reachable ✘"**.
   - Ask: *"Count the numbered steps."* The steps end at **6**.
   - Run `python3 -m unittest`. **Every test passes.**
   - Reveal: in `rover/planner.py`, `moves=len(cells)` counts **positions**, not **moves**, because 7 squares means 6 moves.
   - **Tests talk track:**
     > "Tests are examples of what we expect, not magic proof that everything is correct. If the AI writes both the code and the tests, it can repeat the same misunderstanding in both."
   - Fix it live with the **bug-fix prompt**, or edit it yourself to `moves=len(cells) - 1`. Then add the missing test (`S..G` gives 4 squares and 3 moves).

## 33–38 min: Real-world perspective

- **Talk track:** *"Engineers are delegating work without delegating responsibility. The AI wrote most of today's code. We set the goal, the limits and the acceptance criteria, we checked the edge cases, and we caught the bug. That's the engineer's job."*
- Discuss where this matters: real rovers, medical devices and self-driving cars. Who signs off on the code?

## 38–45 min: Q&A and close

**Closing question** (leave it on screen):

> "Where was the deep learning today: in the rover, in the coding assistant, or both? And what evidence would you need before trusting this software to control a real robot?"

The answer to the first part is that the deep learning was in the coding assistant only. The rover runs plain BFS.

---

## 5-minute quick demo

1. **Drive by hand (1 min).** Run `git switch checkpoint/1-manual && python3 -m rover`. Drive on `tiny` and bump into a rock. *"The rover follows rules we wrote."*
2. **Delegate a feature (1.5 min).** Run the Demo 2 prompt, or switch to the prepared result: Ctrl+C, then `git switch checkpoint/2-solver && python3 -m rover`. Click **Solve** to show "Route: 6 moves", then switch to `walled-in` to show "No route exists". Give the key reveal line.
3. **Find the bug (2 min).** Run `git switch checkpoint/4-bug && python3 -m rover`, then click **Solve** on `tiny`. The status says 7 moves. Let the room count the numbered steps (there are 6). Show that all tests pass, then fix `moves=len(cells) - 1` and add the missing test. Give the tests talk-track line.
4. **Close (30 s).** Ask the closing question above.
