# Verification — 24 October 2026

Base: GitHub `main`, `e6732389cdf42430d79f5efc56c3ae64991edae7`.
Implementation branch: `codex/staging-feedback`.

| Check                                                 | Result                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------ |
| Main backend and frontend production builds           | Passed                                                       |
| Feedback backend and frontend production builds       | Passed                                                       |
| Frontend TypeScript and ESLint                        | Passed                                                       |
| Backend ESLint                                        | Passed                                                       |
| Frontend regression suite                             | 24 files, 165 tests passed                                   |
| Backend unit suite                                    | 20 suites, 161 tests passed                                  |
| Authentication regression suite                       | 51 tests passed                                              |
| Live HTTP/PostgreSQL feedback tests                   | 5 tests passed                                               |
| Frontend/backend workspace formatting                 | Passed                                                       |
| New comparison guide formatting                       | Passed                                                       |
| Git whitespace check                                  | Passed                                                       |
| Both running frontends and their 25 entry assets each | HTTP 200, correct asset content types                        |
| Launcher restart and photo persistence                | Passed: stored URL and image SHA-256 unchanged after restart |

382 automated tests passed. The live tests use the real local API, authentication, PostgreSQL, and image processing. They verify three independent dates for one goal, concurrent same-day duplicate prevention, visibility in the handler's week, trainer/owner access, rejection of past/invalid dates and unshared access, JPEG uploads including generic phone MIME metadata, persistence on re-read, replacement/removal, and the owner's exclusive right to change a photo. Temporary fixture dogs and photos were removed.

The launcher was exercised with isolated databases and separate origins. Its process identification was corrected for both PowerShell string and DateTime JSON parsing. The final restart left both comparison builds running.

## Existing check failure

`pnpm format:check` stops at the root formatting check. Both the untouched main copy and the feedback copy report the same 21 pre-existing root/document formatting findings. Their warning lists were compared and match exactly. The changed app workspaces pass their own formatting checks. Unrelated root files were not reformatted.

## Design verification limits

The initial design review followed `DESIGN.md`, existing components, and the sitemap terminology. Component and route integration tests cover the changed flows. The linked Figma document was inaccessible, and the initial 24 October verification did not include a browser screenshot comparison.

At the user's request, a browser walkthrough on 25 October compared both builds as trainer and connected handler. It verified three additional dates for one goal after refresh, handler week visibility and the link back to the goal, direct profile-menu logout, the mobile account menu, and PNG upload/save/refresh in both builds. Screenshots and reproduction steps are in the [comparison guide](docs/staging-feedback/COMPARISON.md). The ordinary PNG issue did not reproduce on local main; the staging environment and real HEIC/HEIF files were not retested. The browser-tab title still says “Tvorba tréninku” and needs a terminology cleanup.

Full command logs are in the sibling `.comparison` runtime directory, outside Git. See `FEEDBACK-BUILD.md` for startup, credentials, and the two-role demo steps.
