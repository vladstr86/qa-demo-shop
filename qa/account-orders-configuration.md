# Account and order integration — SQL and configuration review

These steps are prepared for user review. No live Supabase migration, Auth setting, user creation, order write, seed reset, publication, commit, or push is authorized or performed by this integration.

## Existing configuration and missing dependencies

The current repository contains the store frontend and its language-aware external analytics link. No Supabase project URL, publishable key, installed SDK, database setup SQL, or existing Auth configuration was present before this work. The supplied reference contains no project credentials either. No credentials were invented.

The reference validator imports `../database-setup.sql`, which was not supplied. The additive migration depends on existing `qa_demo.orders`, `qa_demo.order_items`, the legacy validated order RPC, and the existing aggregate analytics RPC. An isolated compatibility harness models those contracts using this checkout's fixed catalog. It cannot establish that an unknown live schema/catalog matches them. Obtain and review the real baseline before a later live migration.

## SQL review sequence

1. Inspect `database/review-preflight.sql` and run its read-only checks in an authorized database environment. Confirm prerequisite relations/function signatures, grants, RLS, variant keys, prices in cents, stock rules, shipping fees, and aggregate output.
2. Compare the preflight catalog with the current frontend. Required examples include Atlas base at 79900 cents, Atlas 32 GB / 1 TB at 95950 cents, Pulse wireless at 13995 cents, and shipping at 300/650 cents. Check every variant rather than relying on those examples alone. Record any discrepancy before applying the migration.
3. Review `database/migrations/001-account-orders.sql`. It adds owner-protected profile/address tables, authenticated order ownership and immutable contact snapshots, the authenticated order and owner-history RPCs, and the aggregate alias. Existing seed/observed orders are retained. It does not run the old installer or regenerate seed data.
4. Review canonical structured-address validation and the existing server order validator together. New account addresses are stored as validated JSON text inside the migration's address fields. The server permits exactly the five address fields, rejecting hidden extra payment/identity keys; legacy guest history remains unchanged.
5. In a disposable local/test database with the real baseline, verify two-account isolation, anonymous rejection, unavailable variants, quantity bounds, server-derived integer-cent totals, transactional failure, immutable snapshots, and same-owner/same-payload retry behavior.
6. Apply to live Supabase only after separate explicit approval of the reviewed migration and configuration. This task does not perform that step.

The old anonymous `qa_demo_place_order(uuid,jsonb,jsonb,text)` RPC is intentionally revoked for `PUBLIC`, `anon`, and `authenticated` by this migration. The authenticated wrapper invokes it internally as its owner. Guest/mock checkout does not invoke either order RPC. Do not rerun the old installer afterward: it could restore legacy anonymous execution. Inspect grants again after any separately approved installation.

Until the migration and those grants are verified in the intended environment, existing observed aggregates can include legacy anonymous submissions. The `observed`/`all` filters are not guarantees that every historical record came from an authenticated account.

Raw `qa_demo` customer/order tables remain unexposed to browser roles. Public profile/address tables require owner RLS. Authenticated RPCs derive owner and account email from trusted Auth state rather than client identity fields. Public analytics returns aggregates without contact records; the `seed` filter remains separate.

Deleting an Auth user cascades their saved profile/address and sets stored-order ownership to null while retaining immutable contact snapshots. A retention/purge policy is separate work. The reviewed upgrade adds stricter address constraints as `NOT VALID` where earlier tables already exist, preserving older rows while checking new writes; review existing address formats before validating those constraints separately.

## Supabase configuration proposal

Review this separately from SQL:

- Enable email/password Auth for the chosen project.
- Proposed confirmation policy: email confirmation enabled. Actual project settings remain unverified. A signup response with no session is shown as confirmation pending and never treated as signed in. The frontend follows the actual response if a separately reviewed project disables confirmation. See [Supabase signup documentation](https://supabase.com/docs/reference/javascript/auth-signup).
- Proposed production Site URL: `https://vlad-qa-demo-shop.pages.dev/` when this integrated frontend is separately deployed. Use the local origin for an isolated test project during review.
- Review exact redirect allowlist entries for `http://127.0.0.1:4173/`, `http://localhost:4173/`, and `https://vlad-qa-demo-shop.pages.dev/`. If the chosen `emailRedirectTo` includes a language query, approve that exact URL as well. No separate hosted feature-preview URL is configured or invented. See [Supabase redirect configuration](https://supabase.com/docs/guides/auth/redirect-urls).
- Match password policy and email-delivery/rate-limit settings to the chosen test/production environment. Live email delivery is not verified by local API mocks.
- Keep sessions in memory, matching the supplied module: `persistSession: false`, `autoRefreshToken: true`, `detectSessionInUrl: false`. Reload requires real-account sign-in again; confirmation returns to the store for ordinary sign-in. The old mock remember-me feature is explicitly separate.

## Browser configuration

The tracked `dist/account-config.example.json` contains only empty configuration placeholders and the proposed confirmation policy. For a separately reviewed local connection, copy it to the ignored file:

```bash
cp dist/account-config.example.json dist/account-config.local.json
```

Review these fields without putting actual values into documentation:

- `url`: the existing project's HTTPS Supabase URL.
- `publishableKey`: its browser-safe publishable key, or a reviewed legacy anonymous key.
- `confirmationPolicy`: the reviewed policy description; it does not change server Auth settings.
- `emailRedirectTo`: an exact approved store URL, or empty to use the project's reviewed Site URL.

Use only a publishable/anonymous key in browser configuration. Never use a secret/service-role key or database password. Browser keys do not replace RLS. See [Supabase API-key guidance](https://supabase.com/docs/guides/getting-started/api-keys).

The local configuration file is ignored by Git but, if enabled, its browser-safe contents are served to the browser. Ignoring it does not make frontend values secret. No session, password, customer profile, card number, expiry, or CVV belongs in that file.

Without valid configuration, the real account mode is unavailable with a bilingual explanation; the existing mock store remains usable. Network/database errors in configured account mode preserve the cart and details and do not become mock success.

## Checkout, snapshots, and analytics

Account checkout validates a full name, phone, and separate street, house number, city, postal code, and country fields. Saved contact/address values prefill checkout and remain editable. Email comes from Auth. Profile and address writes are separate and therefore are not presented as one atomic save.

Order requests contain variant keys, quantities, shipping choice, request UUID, and validated contact fields. Card number, expiry, CVV, client-set ownership, price, status, and source are excluded. Payment and delivery remain simulated in both modes.

An account order clears the cart only after a valid authenticated RPC response matches the request UUID and independently expected subtotal/shipping/total cents. Retries preserve the UUID and immutable request payload; changed order data requires a new UUID. Duplicate submission is disabled. Failures and mismatched totals remain visible for retry/reconciliation.

Saved new orders use `observed` and are included by existing `observed`/`all` aggregates; `live` is an alias for observed, including older observed records. The store provides aggregate refresh after saved orders and a visible refresh action. This does not modify the separately hosted analytics application's source, and no live persistence or remote dashboard refresh is claimed without independent verification.
