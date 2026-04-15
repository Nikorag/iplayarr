# Integration Test Specification — iPlayarr

## Scope

This spec governs integration tests that verify iPlayarr's real HTTP contracts with its downstream
services. All integration tests use **real HTTP** against live service instances; no mocks are
permitted within this test suite.

---

## 1. Discovery (Example Mapping)

### Story
As an operator deploying iPlayarr, I need confidence that iPlayarr can connect to, configure, and
exchange data with Sonarr, Radarr, SABnzbd, and its own newznab API so that automated download
workflows function end-to-end.

### Rules and Examples

#### Rule 1 — SABnzbd connectivity
iPlayarr's `SabNZBDService.testConnection()` must return `true` when called with a valid URL and
API key.

| # | URL | API Key | Expected |
|---|-----|---------|----------|
| 1 | http://192.168.107.40:8092 | valid | `true` |
| 2 | http://192.168.107.40:8092 | invalid | error string |
| 3 | http://0.0.0.0:1 | valid | error string (connection refused) |

#### Rule 2 — SABnzbd NZB submission
`SabNZBDService.addFile()` must POST a well-formed NZB file and receive a 200 response from
SABnzbd. SABnzbd must queue the item.

| # | NZB | Expected |
|---|-----|----------|
| 1 | valid minimal NZB | HTTP 200, SABnzbd queues it |
| 2 | empty file buffer | HTTP 200 (SABnzbd accepts but may error internally) |

#### Rule 3 — Sonarr connectivity
`V3ArrService.testConnection()` must return `true` for a live Sonarr instance with valid API key.

| # | URL | API Key | Expected |
|---|-----|---------|----------|
| 1 | http://192.168.107.92:8093 | valid | `true` |
| 2 | http://192.168.107.92:8093 | invalid | error string |

#### Rule 4 — Radarr connectivity
Same as Rule 3 but for Radarr.

| # | URL | API Key | Expected |
|---|-----|---------|----------|
| 1 | http://192.168.107.83:7878 | valid | `true` |
| 2 | http://192.168.107.83:7878 | invalid | error string |

#### Rule 5 — Sonarr/Radarr tag management
`V3ArrService.getTags()` must return a non-null array from a live Sonarr or Radarr instance.
`V3ArrService.createTag()` must create a new tag and return it with an id.

| # | Action | Expected |
|---|--------|----------|
| 1 | getTags(sonarr) | Array (may be empty) |
| 2 | getTags(radarr) | Array (may be empty) |
| 3 | createTag(sonarr, 'iplayarr-test') | `{ id: number, label: 'iplayarr-test' }` |

#### Rule 6 — Sonarr/Radarr download client lifecycle
`upsertDownloadClient` must create a SABnzbd-compatible download client in Sonarr/Radarr and
return its id. `getDownloadClient` must retrieve it by id. Cleanup: delete after test.

| # | Action | Expected |
|---|--------|----------|
| 1 | upsertDownloadClient(sonarr, form) | Returns numeric id > 0 |
| 2 | getDownloadClient(sonarr, {id}) | Returns object with host, api_key, port |
| 3 | upsertDownloadClient(sonarr, form) — same name | Returns same id (update) |

#### Rule 7 — Sonarr/Radarr indexer lifecycle
`upsertIndexer` must register iPlayarr as a newznab indexer in Sonarr/Radarr and return its id.
`getIndexer` must retrieve it by id. Cleanup: delete after test.

| # | Action | Expected |
|---|--------|----------|
| 1 | upsertIndexer(sonarr, form) | Returns numeric id > 0 |
| 2 | getIndexer(sonarr, {id}) | Returns object with url, api_key |
| 3 | upsertIndexer — allowCreate=false, missing id | Throws 'Existing Download Client not found' |

#### Rule 8 — Sonarr series search / Radarr movie search
`V3ArrService.search()` must return an array of results with at least a `title` field when called
without a search term (library browse).

| # | App | Term | Expected |
|---|-----|------|----------|
| 1 | sonarr | undefined | Array (may be empty if library is empty) |
| 2 | radarr | undefined | Array (may be empty) |

#### Rule 9 — iPlayarr newznab API: caps
`GET /api?t=caps&apikey=<key>` must return valid XML with `<caps>` root element and
`<categories>` containing at least TV and Movie categories.

| # | Request | Expected |
|---|---------|----------|
| 1 | t=caps, valid apikey | 200 XML with `<caps>` |
| 2 | t=caps, no apikey | 401 JSON `{"error":"Not Authorised"}` |
| 3 | t=caps, wrong apikey | 401 JSON |

#### Rule 10 — iPlayarr newznab API: search
`GET /api?t=search&q=doctor+who&apikey=<key>` must return newznab-compatible XML with `<rss>`
root and `<channel>` containing `<item>` elements or empty feed.

| # | Request | Expected |
|---|---------|----------|
| 1 | t=search, q=doctor who, valid apikey | 200 XML newznab feed |
| 2 | t=tvsearch, valid apikey | 200 XML newznab feed |

---

## 2. Uncertainty Matrix

| # | Category | Question | Status | Resolution |
|---|----------|----------|--------|------------|
| 1 | Network | SABnzbd not reachable from host | RESOLVED | Run via `docker exec iplayarr` using Makefile target |
| 2 | Auth | iPlayarr API key unknown | RESOLVED | User must set `IPLAYARR_API_KEY` in `.env.integration`; tests skip if absent |
| 3 | NZBHydra2 API key | Obfuscated in nzbhydra.yml | RESOLVED | NZBHydra2 test scope is iPlayarr's own newznab API compatibility, not NZBHydra2's internal API |
| 4 | Idempotency | Sonarr/Radarr tests create resources | RESOLVED | afterAll hooks delete created download clients and indexers by id |
| 5 | Prowlarr | No Prowlarr instance running | RESOLVED | Prowlarr integration tests deferred; V1ArrService covered by unit tests only |
| 6 | SABnzbd NZB submission | Submitting real NZB adds to queue | RESOLVED | Use minimal valid NZB; test verifies HTTP 200 only; SABnzbd queue cleanup is manual |

---

## 3. Brownfield Impact Analysis

| Touchpoint | Type | Risk | Existing Tests | Contract |
|------------|------|------|----------------|----------|
| `V3ArrService` | Tested (integration adds) | LOW | 4 unit tests | No breaking change; integration tests add new test file |
| `SabNZBDService` | Tested (integration adds) | LOW | 3 unit tests | No breaking change |
| `jest.config.js` | Unchanged | NONE | — | Unit test suite unchanged |
| `package.json` | New script added | LOW | — | New `test:integration` script; existing `test` script unchanged |
| `Makefile` | New target added | LOW | — | `make test integration` added; existing targets unchanged |

---

## 4. Architectural Constraints

- **No mocks** in `tests/integration/` — real HTTP only.
- **Environment-gated**: every `describe` block wraps tests in `if (!env.available) { test.skip }`.
- **Idempotent cleanup**: `afterAll` deletes all resources created by the test run.
- **Isolated naming**: all created resources use name prefix `iplayarr-integration-test-` plus a
  random suffix to avoid collision with existing production config.
- **No dotenv mock** in integration test setup — `tests/setup.ts` mocks dotenv but
  `tests/integration/setup.integration.ts` must NOT import it.
- **Timeout**: 30 000 ms per test (network latency tolerance).
- **SABnzbd special path**: tests run via `make test integration-sabnzbd` which uses
  `docker exec iplayarr` to run Jest inside the container (where SABnzbd is reachable).

---

## 5. Test List

### V3ArrService — Sonarr Integration (requires `SONARR_URL` + `SONARR_API_KEY`)
- [ ] testConnection — valid credentials → `true`
- [ ] testConnection — invalid API key → error string (not `true`)
- [ ] getTags — returns array
- [ ] createTag — creates tag, returns `{ id, label }`
- [ ] upsertDownloadClient — creates new client, returns id > 0
- [ ] getDownloadClient — retrieves client by id, returns shape `{ id, name, host, api_key, port }`
- [ ] upsertDownloadClient — update existing (PUT), returns same id
- [ ] upsertIndexer — creates new indexer, returns id > 0
- [ ] getIndexer — retrieves indexer by id
- [ ] upsertIndexer — allowCreate=false + no existing id → throws

### V3ArrService — Radarr Integration (requires `RADARR_URL` + `RADARR_API_KEY`)
- [ ] testConnection — valid credentials → `true`
- [ ] testConnection — invalid API key → error string
- [ ] getTags — returns array
- [ ] upsertDownloadClient — creates new client, returns id > 0
- [ ] upsertIndexer — creates new indexer, returns id > 0

### SabNZBDService Integration (requires `SABNZBD_URL` + `SABNZBD_API_KEY`)
- [ ] testConnection — valid credentials → `true`
- [ ] testConnection — invalid API key → `false` or error string
- [ ] testConnection — unreachable host → error string
- [ ] addFile — posts NZB, returns HTTP 200 AxiosResponse

### iPlayarr newznab API (requires `IPLAYARR_URL` + `IPLAYARR_API_KEY`)
- [ ] GET /api?t=caps — 200 XML `<caps>` root
- [ ] GET /api?t=caps — no apikey → 401 JSON
- [ ] GET /api?t=caps — wrong apikey → 401 JSON
- [ ] GET /api?t=search&q=doctor+who — 200 XML RSS feed
- [ ] GET /api?t=tvsearch&q=test — 200 XML RSS feed
- [ ] GET /ping — 200 `{ status: 'OK' }`

---

## 6. Environment Configuration

Copy `.env.integration.example` to `.env.integration` and fill in the values:

```bash
# Sonarr
SONARR_URL=http://192.168.107.92:8093
SONARR_API_KEY=<sonarr_api_key>

# Radarr
RADARR_URL=http://192.168.107.83:7878
RADARR_API_KEY=<radarr_api_key>

# SABnzbd — only reachable from vlan107; used by 'make test integration-sabnzbd'
SABNZBD_URL=http://192.168.107.40:8092
SABNZBD_API_KEY=<sabnzbd_api_key>

# iPlayarr — API key found in Settings → API Key in the iPlayarr web UI
IPLAYARR_URL=http://192.168.107.127:4404
IPLAYARR_API_KEY=<iplayarr_api_key>
```

---

## 7. Make Targets

| Target | Description |
|--------|-------------|
| `make test integration` | Run Sonarr/Radarr/newznab tests (host-reachable services) |
| `make test integration-sabnzbd` | Run SABnzbd tests via `docker exec iplayarr` |
| `make test all` | lint + prettier + unit (unchanged — does NOT run integration) |
