# Taskocalypse · Folder Rescue

**A little play. A lot less clutter.** A local-first rescue game that turns file organization into short, deliberate missions. Gameplay actions perform actual file operations; the sample workspace is explicitly labeled as a demo.

## Vertical and persona

Digital file organization for a student or busy professional overwhelmed by a Downloads folder. No separate list of challenge verticals was supplied; this is the project's declared vertical.

## Run locally

Prerequisites: Node.js 22 or later and Git. No dependencies, API keys, accounts, or installation step are required.

```sh
npm run dev
```

Open http://localhost:3000. Use an HTTP server rather than opening index.html directly: JavaScript modules and folder access require a suitable origin.

```sh
npm test
npm run check
npm run build
```

## Deploy on Vercel

1. Push this directory as the root of a public GitHub repository, keeping only the `main` branch.
2. Import that repository in Vercel. If importing a larger repository, set Root Directory to this directory.
3. Framework preset: **Other**. Build command: `npm run build`. Output directory: `dist`. No environment variables or backend configuration.
4. Deploy. Vercel serves HTTPS, which is required for real folder permissions. Test the production URL before submission.

The supplied `vercel.json` declares these settings and security headers. The app uses relative asset paths and standard browser modules. There is no server runtime in the deployed app. `server.mjs` is for local development only. No claim of a verified Vercel deployment is made until one is actually deployed.

## How it works

1. Start by choosing a real folder, or explicitly choose the sample mission. The folder picker is a browser permission boundary; unsupported browsers explain the limitation and still offer the sample.
2. Eligible files become collectibles in a side-scrolling platform world. Move with A/D or arrows and jump with Space/W/up. There are no unrelated coin objectives. Assist mode keeps files on the ground; Pick up next file provides a motor-free alternative.
3. Automatic sorting is the default. Touching a file classifies it and executes the verified move in the background without opening a question. The pre-game notice explains this behavior before folder selection. A visible mode badge identifies the active mode.
4. Settings → Sorting mode → **Manual** enables an in-game destination review after pickup. Accept with Organize / E, or override with category buttons / keys 1–6. Later defers the file. The mode preference persists in localStorage; changing it does not automatically approve a file already awaiting review. Failed automatic moves open the review panel and preserve recovery access.
5. Real operations write an IndexedDB recovery record, copy into `Rescued/<category>`, verify SHA-256, recheck the source, then remove the source. A failed operation stays unresolved in the game, with recovery available in Rescue log.
6. Once every eligible file is organized, gameplay ends automatically with a completion summary. Live operations remain undoable from Rescue log across reloads on the same origin. Sample operations are explicitly labeled and never touch disk.

## Architecture

| File | Responsibility |
| --- | --- |
| `dist/core.js`, `dist/ai.js` | Extension rules, local learned filename classifier, mission planning, sample fixtures |
| `dist/storage.js` | Scoped filesystem operations, verification, durable recovery journal |
| `dist/app.js` | Game state, accessible interactions, permission flow, recovery UI |
| `dist/platformer-core.js` | Pure jumping physics, bounded procedural geometry, file collectible placement |
| `dist/platformer.js` | Original pixel world, file pickup lifecycle, automatic end-of-mission |
| `dist/styles.css`, `dist/adventure.css` | Responsive interface, in-game sorting prompt, reduced motion |
| `tests/` | Core unit tests and in-memory filesystem integration tests |

## Local AI classifier

Recognized extensions use a reliable explicit type map. Unrecognized filenames are tokenized and evaluated by a small multinomial Naive Bayes model trained on the curated category examples embedded in `dist/ai.js`. Training happens locally once when the module loads. Unknown words are ignored; predictions below the confidence threshold use Other. Confidence is a model score, not a calibrated accuracy guarantee. No file contents or filenames are uploaded, and no external AI API is configured. This lightweight model cannot understand arbitrary document contents; Manual mode and undo remain available.

## Security and data handling

- No file uploads, external scripts, analytics, cookies, remote fonts, credentials, or network API calls.
- Directory access is explicitly granted through the browser picker. Writes remain within that directory.
- Filenames are displayed as text, never inserted as HTML. Category destinations use an allowlist.
- Collision checks refuse existing destination filenames. Undo checks content before modifying files.
- Local recovery records include filenames, hashes, directory handles, and status. They remain in IndexedDB; clearing site data removes recovery history. Keep it until you have reviewed your rescue operations.
- Browser APIs cannot make a multi-step cross-directory move atomic. Do not concurrently modify these folders in another app: collision checks cannot prevent an external process from racing the subsequent write. A crash can leave a copy and a recovery record. This tool is not a backup replacement.
- If recovery storage fails, the engine fails before copying. If removal fails, the original and verified copy remain. Prepared records without a complete verified copy may require manually inspecting the two locations; the app will refuse unsafe undo.
- Hashing is bounded to 50 MB per file and operations run sequentially. Metadata scanning is capped at 500 eligible files. Directory enumeration order is browser-dependent.

## Accessibility

Semantic landmarks, labeled controls, keyboard operation, visible focus outlines, skip link, live status announcements, native modal focus handling, responsive layout, system and user reduced-motion controls. All gameplay is untimed, with no speed penalties, sound requirements, or flashing effects. Progress has a text equivalent. No formal WCAG conformance or assistive-technology certification is claimed.

## Testing and validation

`npm test` runs Node's built-in runner with no third-party dependencies. Tests exercise filename classification, unsafe names, mission prioritization, formatting, a complete verified move and undo, destination collisions, interrupted deletion recovery, edited-copy protection, conflicting originals, and invalid destinations.

The filesystem/IndexedDB tests use in-memory adapters, not a real browser picker. They validate transaction logic but do not replace permission and filesystem tests on production. Syntax checks and a static asset budget check are included. Local browser QA verified folder-first entry, character movement and jumping, file collision automatically opening the in-game sorting question, keyboard E accepting the suggestion, background progression, and completion after all twelve sample files. The automatic-mode update was additionally checked for collision sorting without a prompt, manual category overrides, and mode persistence after reload. Actual browser filesystem permissions and live-file operations still require the disposable-folder checks below; engine tests use adapters.

Before submitting, manually test:

- Demo: rescue, skip, all twelve files, undo, reset, log, guide, keyboard 1–6, keyboard-only operation.
- Real test folder containing disposable copies: move, reload, undo, same-name collision, denied permission, and externally edited rescued file.
- Production HTTPS: desktop Chrome/Edge real-folder support, unsupported-browser message, mobile demo, 200% zoom, reduced motion, screen-reader announcements.
- GitHub repository is public, has exactly one branch, and remains under 10 MB.

## Assumptions and limits

Real organization requires a browser supporting `showDirectoryPicker`, directory write handles, IndexedDB handle cloning, and Web Crypto over HTTPS or localhost. The capability is detected at runtime; other browsers can play the demo with an explanatory message. Folder permissions may need renewal after a reload. Moving the site to a different domain creates a different recovery store. No cloud storage or cross-device recovery is provided.

Empty destination directories remain after undo. Filenames and timestamps are not rewritten intentionally, but copy operations may change filesystem modification metadata. File contents are preserved and verified. Demo progress is session-only; real recovery records persist locally. Public hosting does not give the host access to visitors' folders.

## Rubric alignment

| Criterion | Evidence |
| --- | --- |
| Code quality | Separated pure logic, filesystem engine, interface; zero runtime dependencies |
| Security | Explicit permissions, local processing, previews, hash checks, conflict refusal, recovery |
| Efficiency | Static hosting, bounded scan, sequential writes, capped hashing, no remote inference |
| Testing | Automated success/failure tests plus documented production acceptance checks |
| Accessibility | Untimed keyboard play, reduced motion, status announcements, responsive UI |
| Problem alignment | Game decisions execute real organization and advance file collectibles and end the game only after the actual chore is complete |

## Submission

Submit the public repository URL and verified deployment URL. See `SUBMISSION.md` for a checklist and LinkedIn draft. Maintain one branch; commit progress on `main`. No assets or dependencies need to be downloaded. Do not commit personal test files or access tokens.


