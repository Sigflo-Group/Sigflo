# Sigflo — Security & Trust Architecture

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  USER BROWSER (Netlify CDN)                                     │
│                                                                  │
│  ┌──────────────────────┐  ┌────────────────────────────────┐   │
│  │  Auth Layer           │  │  Security UI Layer              │   │
│  │  Supabase PKCE OAuth  │  │  ExchangeConnectionWizard       │   │
│  │  Magic Link / OTP     │  │  SecurityCenter                 │   │
│  │  Session hydration    │  │  RiskDisclosureGate             │   │
│  └──────────┬───────────┘  │  KeyRotationFlow                 │   │
│             │               │  DeleteCredentialsFlow           │   │
│             │ JWT            │  SessionManager                 │   │
│             ▼               │  AuditLogViewer                 │   │
│  ┌──────────────────────┐  └────────────────────────────────┘   │
│  │  API Client (http.ts) │                                       │
│  │  Attaches Bearer token│                                       │
│  │  15s timeout + retry  │                                       │
│  └──────────┬───────────┘                                       │
└─────────────┼───────────────────────────────────────────────────┘
              │ HTTPS
              ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND (Express / Railway)                                     │
│                                                                  │
│  requireAuth → verifySupabaseJWT → upsertUser                   │
│                                                                  │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────────┐  │
│  │ exchangeRouter│  │ securityRouter │  │ sessionRouter        │  │
│  │ /link         │  │ /summary       │  │ /step-up             │  │
│  │ /switch       │  │ /audit-perms   │  │ /revoke              │  │
│  │ /revalidate   │  │ /rotate-key    │  │                      │  │
│  │ /delete       │  │ /ack-risk      │  │                      │  │
│  └──────┬───────┘  └───────┬───────┘  └──────────┬──────────┘  │
│         │                  │                       │             │
│         ▼                  ▼                       ▼             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Services Layer                                           │   │
│  │  crypto.ts (AES-256-GCM) · permissionValidator.service   │   │
│  │  exchangeKey.service · keyRotation.service                │   │
│  │  auditLog.service · sessionSecurity.service               │   │
│  └──────────────────────────┬───────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  SUPABASE (Database + Vault)                                     │
│                                                                  │
│  auth.users (Supabase managed)                                   │
│  public.profiles                                                 │
│  public.broker_accounts (api_key_vault_id, api_secret_vault_id) │
│  vault.secrets (AES-256 encrypted by Supabase)                  │
│  public.user_sessions                                            │
│  public.audit_logs (append-only via service role)               │
│  public.permission_snapshots                                     │
│  public.key_rotation_log                                         │
│  public.device_trust                                             │
│  public.risk_acknowledgements                                    │
│                                                                  │
│  RLS: Every table enforces user_id = auth.uid()                  │
│  Sensitive writes: backend service role only                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Recommended Desktop Stack

### Current: Browser App (Netlify)
Works well for the current phase. Secure enough with PKCE auth, server-side credential storage, and proper CSP headers.

### Next Phase: Tauri (Recommended over Electron)

**Choose Tauri when:**
- Shipping a proper desktop app is a product priority
- You want native OS keychain integration (no vault round-trips)
- Security-first: Rust backend has no Node.js supply chain exposure
- Binary size matters (~8MB vs ~120MB Electron)

**Tauri security advantages:**
```
┌──────────────────────────────────────────────────────────┐
│  TAURI SECURITY MODEL                                     │
│                                                          │
│  Rust core (no Node.js CVE surface)                      │
│  OS Keychain via keyring crate (macOS Keychain,          │
│    Windows Credential Store, Linux Secret Service)       │
│  CSP enforced at the WebView level                       │
│  IPC: allowlist-only — JS can only call registered cmds  │
│  No remote code execution by design                      │
│  Code signing: macOS notarization + Windows Authenticode │
└──────────────────────────────────────────────────────────┘
```

**Tauri key storage pattern for Sigflo:**
```rust
// In Tauri Rust core — never exposed to the WebView JS layer
use keyring::Entry;

pub fn store_api_key(user_id: &str, exchange: &str, key: &str) -> Result<()> {
    let entry = Entry::new("sigflo", &format!("{}-{}", user_id, exchange))?;
    entry.set_password(key)?;
    Ok(())
}
```

**Hold on Electron because:**
- Chromium CVE surface is large
- Node.js in renderer = XSS → code exec
- Supply chain exposure (npm)
- Heavier runtime

---

## 3. Security Architecture

### Credential Flow
```
User input → HTTPS → Express → AES-256-GCM encrypt → Supabase Vault
                                                              ↓
API call ← decrypt in-process ← Vault.decrypted_secrets ←────┘
```

Keys are **never**:
- Logged in plaintext
- Returned to the frontend
- Stored in localStorage or cookies
- Transmitted over HTTP

### Permission Validation
Every connected key is audited on:
1. `readOnly` flag from exchange API
2. `withdrawalsEnabled` flag — critical risk if true
3. `canReadBalances` and `canReadPositions` — determines feature availability

Permission snapshots are stored immutably and surface in the Security Center.

### Audit Log
All security-relevant actions write to `public.audit_logs`:
- `exchange.link / switch / disconnect / revalidate / activate`
- `exchange.key_rotation`
- `risk.acknowledge`
- `session.revoke`
- `trade.intent / execute`

Audit logs are **append-only from the backend** (authenticated role has no INSERT/UPDATE).

### Session Management
- Sessions tracked via `public.user_sessions`
- Step-up verification: 10-minute TTL on sensitive actions
- Sessions listed in Security Center → user can revoke any
- Current session identified heuristically (first active)

### Step-Up Auth
Required for:
- `POST /exchange/revalidate`
- `POST /security/rotate-key`

Pattern: user re-authenticates (Supabase OTP or password) → backend marks `step_up_verified_at` → 10-minute window for protected actions.

---

## 4. UX Flow Maps

### Exchange Connection Wizard
```
Choose Exchange → Risk Disclosure (must accept) → Create Key Guide
  → Enter Credentials → Validate (async) → Success
```

Key UX decisions:
- Risk disclosure requires scrolling to bottom + checkbox — no skip
- Create Key guide uses numbered steps with direct link to exchange
- Withdrawal permission warning appears in amber at step 4
- Success screen explains what Sigflo can/cannot do

### Security Center Navigation
```
Overview
  ├── Exchange cards (expandable)
  │     ├── Permission check (live)
  │     ├── Rotate key →
  │     └── Disconnect →
  ├── Sessions →
  └── Activity log →
```

### Key Rotation Flow
```
Intro (create new key first) → Enter new credentials → Validate
  → Success + "revoke old key on exchange" reminder
```

### Delete Credentials Flow
```
Confirm (checkbox required) → Delete (async) → Success
  + reminder to revoke on exchange
```

---

## 5. UI Copy Principles

### What we say instead of:
| Avoid | Use |
|-------|-----|
| "API credentials stored securely" | "Your keys are encrypted before leaving your session" |
| "Connection successful" | "Exchange connected — Sigflo can now read your positions" |
| "Error: 403 Forbidden" | "Your API key may have expired or lost permission. Check your exchange settings." |
| "Permission: READ_ONLY=true" | "Read-only key — Sigflo can see your account but can't trade" |
| "Authentication failed" | "Sign in required. Your session may have expired." |
| "Withdrawal enabled" | "This key has withdrawal access — Sigflo never needs this" |

### Tone rules:
- Calm over alarming. Use facts, not fear.
- Explain what Sigflo does, not just what it doesn't.
- When something goes wrong, say what to do next — not just what failed.
- Never show raw technical errors (HTTP codes, stack traces) to users.

---

## 6. Security Center Design

Three-zone layout:
```
┌────────────────────────────────────────────────┐
│ HEADER: "Security" + back navigation           │
├────────────────────────────────────────────────┤
│ RISK BANNER (conditional — withdrawal risk)    │
├────────────────────────────────────────────────┤
│ CONNECTED EXCHANGES                            │
│   [Bybit · Active]  [check permissions] [▼]   │
│   ↳ Permission status card                     │
│   ↳ [Rotate key] [Disconnect]                  │
├────────────────────────────────────────────────┤
│ [Sessions]          [Activity log]             │
│  2 active           47 events                  │
├────────────────────────────────────────────────┤
│ RECENT KEY ROTATIONS (if any)                  │
└────────────────────────────────────────────────┘
```

---

## 7. Exchange Connection Architecture

### Modular adapter pattern
```typescript
interface ExchangeAdapter {
  readonly id: ExchangeId;
  validateReadOnly(input: ConnectInput): Promise<ValidationResult>;
  fetchBalances(input: ConnectInput): Promise<BalanceItem[]>;
  fetchAccountBreakdown?(input: ConnectInput): Promise<ExchangeAccountBreakdown | null>;
  fetchPositions(input: ConnectInput): Promise<PositionItem[]>;
  fetchClosedTrades(input: ConnectInput): Promise<ClosedTradeItem[]>;
}
```

Adding a new exchange:
1. Implement `ExchangeAdapter` in `backend/src/exchanges/<name>.ts`
2. Register in `backend/src/core/exchange-registry.ts`
3. Add to `ExchangeId` union type
4. Add to `EXCHANGE_META` in `ExchangeConnectionWizard.tsx`
5. Add migration for any exchange-specific schema needs

### Single active exchange constraint
Migration `013_single_active_exchange.sql` enforces exactly one active exchange per user via a partial unique index. The `setActiveExchange` function atomically deactivates all then activates one.

---

## 8. Database & Vault Structure

### Credential storage (vault-first)
```sql
broker_accounts
  id uuid
  user_id → auth.users
  broker text
  api_key_vault_id uuid → vault.secrets(id)    -- preferred
  api_secret_vault_id uuid → vault.secrets(id)  -- preferred
  api_key_encrypted text   -- legacy AES-256-GCM fallback
  api_secret_encrypted text
  permissions jsonb         -- {withdrawalsEnabled: false}
  status text               -- 'connected' | 'invalid'
  is_active boolean
```

### Vault.secrets (Supabase managed)
- Supabase Vault uses `pgsodium` (XChaCha20-Poly1305)
- One encryption key per project in KMS
- `vault.decrypted_secrets` view decrypts on-the-fly for authorized queries
- Never readable via frontend (no anon/authenticated grants)

### Audit trail
```sql
audit_logs          -- all security events (backend-write only)
key_rotation_log    -- key rotation history
permission_snapshots -- point-in-time permission checks
risk_acknowledgements -- user risk acceptance
device_trust        -- recognized devices
```

### RLS policy summary
```
Table                    | anon | authenticated | service_role
-------------------------|------|---------------|-------------
broker_accounts          |  ✗   | SELECT own    | ALL
vault.secrets            |  ✗   | ✗             | ALL
audit_logs               |  ✗   | SELECT own    | ALL
key_rotation_log         |  ✗   | SELECT own    | ALL
permission_snapshots     |  ✗   | SELECT own    | ALL
risk_acknowledgements    |  ✗   | SELECT own    | ALL
user_sessions            |  ✗   | SELECT+UPDATE | ALL
device_trust             |  ✗   | SELECT+UPDATE | ALL
```

---

## 9. Logging & Audit Architecture

### Audit log event taxonomy
```
exchange.*          -- credential and connection events
trade.*             -- intent and execution events
session.*           -- session lifecycle events
risk.*              -- disclosure acceptance
security.*          -- permission audits
```

### What's logged per event
- `user_id` — always
- `action` — namespaced string
- `outcome` — 'success' | 'failure'
- `object_type` / `object_id` — what was affected
- `ip_address` / `user_agent` — from `auditContext` middleware
- `payload_hash` — SHA-256 of payload (never plaintext)
- `metadata` — structured context (reason, exchange name, etc.)
- `request_id` — for correlation

### Retention
- Audit logs: 90 days minimum (add a pg_partman partition + retention policy)
- Key rotation log: permanent (compliance record)
- Permission snapshots: keep last 10 per account

---

## 10. Update & Recovery Systems

### Auto-update (Tauri)
```
Tauri updater → check GitHub Releases or S3 manifest
→ download + verify signature (ed25519)
→ prompt user → install on next launch
```

Signing keys stored in CI secrets, never in source.

### Safe fallback for exchange failures
```
Exchange API call → timeout (15s) → ExchangeError
  → surfaced as human-readable message (not raw error)
  → signal engine continues with last known data
  → status indicator shows "Connection issue" not stack trace
```

### Crash recovery
- `SecureErrorBoundary` wraps all sensitive panels
- Generates opaque error ID (not stack trace) for user to report
- Retry button re-mounts the subtree
- No crash report sent without user consent

### State recovery on reload
- `lifecycleRef` persisted to localStorage (`__SIGFLO_LIFECYCLE_REF_V2__`)
- Auth session hydrated from Supabase storage on mount
- Exchange status re-fetched on mount (no stale credential display)

---

## 11. Priority Roadmap

### Phase 0 — Foundation (current sprint)
- [x] AES-256-GCM credential encryption
- [x] Supabase Vault integration
- [x] Step-up auth for sensitive actions
- [x] Audit log service
- [x] RLS on all tables
- [x] ExchangeConnectionWizard with risk disclosure
- [x] SecurityCenter with permission checking
- [x] KeyRotationFlow
- [x] DeleteCredentialsFlow
- [x] SessionManager
- [x] AuditLogViewer
- [x] SecureErrorBoundary
- [x] RiskDisclosureGate

### Phase 1 — Hardening (weeks 2–4)
- [ ] TOTP / FIDO2 MFA via Supabase Auth
- [ ] Device fingerprinting + "new device" alerts
- [ ] Audit log retention policy (pg_partman)
- [ ] CSP headers tightened on Netlify
- [ ] Automated permission re-check on 24h interval
- [ ] IP allowlist warning in ExchangeConnectionWizard (some exchanges support this)

### Phase 2 — Desktop (months 2–4)
- [ ] Tauri scaffold — Rust core, WebView frontend
- [ ] OS Keychain integration (keyring crate)
- [ ] Code signing — macOS notarization + Windows Authenticode
- [ ] Auto-update with ed25519 signature verification
- [ ] Offline mode — cache last known balances + positions

### Phase 3 — Compliance (months 4–8)
- [ ] SOC 2 Type I gap analysis
- [ ] Data residency controls (EU/US split)
- [ ] Breach notification workflow
- [ ] Key escrow for enterprise accounts
- [ ] Penetration test (third-party)

---

## 12. Critical Vulnerabilities to Avoid

### 1. XSS → Credential exposure
**Risk:** XSS in any component → attacker reads localStorage/sessionStorage.
**Mitigation:** API keys never touch the frontend after submission. Supabase JWT in httpOnly cookie (not accessible to JS). Strict CSP.

### 2. CORS misconfiguration
**Risk:** Malicious site makes credentialed requests to the backend.
**Mitigation:** `FRONTEND_ORIGIN` env var strictly validated. No wildcard origins.

### 3. Withdrawal-enabled API keys
**Risk:** User connects a key with withdrawal access → compromised app = drained account.
**Mitigation:** `auditPermissions()` flags this as CRITICAL. SecurityCenter surfaces it in red. Wizard warns explicitly at step 4.

### 4. Step-up bypass
**Risk:** Attacker with valid JWT rotates keys without step-up.
**Mitigation:** `requireStepUp` middleware on `/rotate-key` and `/revalidate`. 10-minute TTL strictly enforced server-side.

### 5. Audit log tampering
**Risk:** Compromised account hides its own activity trail.
**Mitigation:** `authenticated` role has no INSERT/UPDATE/DELETE on `audit_logs`. Backend only via service role.

### 6. Credential logging
**Risk:** API key appears in server logs or error messages.
**Mitigation:** Credentials never logged. `maskBrokerSecret()` for any UI display. `payload_hash` (not plaintext) in audit log.

### 7. Supabase anon key in frontend
**Risk:** Anyone can call Supabase endpoints with the anon key.
**Mitigation:** RLS on every table. Anon key has zero write access to sensitive tables. Vault never queryable by anon/authenticated roles.

### 8. SSRF via exchange API
**Risk:** Attacker sends crafted API key pointing to internal network.
**Mitigation:** Exchange adapters use fixed base URLs. No user-supplied URL parameters. Backend deployed outside VPC that has no internal network access.

### 9. Race condition on key rotation
**Risk:** Old key used in-flight while rotation is in progress.
**Mitigation:** `upsertBrokerAccount` is atomic — new credentials replace old in a single transaction. In-flight requests that fail after rotation get a 401 from the exchange (harmless).

### 10. localStorage data leakage
**Risk:** Sensitive data in `__SIGFLO_*` localStorage keys.
**Mitigation:** Only store candle timestamps, signal lifecycle state, and UI preferences — no credentials, no balances, no PII. All credential data stays server-side.
