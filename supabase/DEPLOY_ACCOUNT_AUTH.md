# AUREL account-based access (pre-deployment checklist)

URL **must remain** https://thanhhochub-commits.github.io/AUREL/financial-intelligence.html.

This feature is **NOT LIVE** until the exact Supabase project and Render service are configured, the migration is applied, and end-to-end tests pass. Do not merge the draft PR based only on mocked CI results.

## Supabase project
1. Use a dedicated production Supabase project. Never place a \`service_role\` or secret key in GitHub Pages.
2. Enable email+password sign-up in Authentication. **Require email confirmation** before login.
3. Set Site URL and Redirect URL allowlist to the fixed AUREL URL above. Confirm that verification and password-reset emails redirect to that exact URL.
4. Configure trusted SMTP, anti-abuse/rate limits and appropriate CAPTCHA, plus email delivery monitoring. Do not activate open signup before these are tested.
5. Apply \`supabase/migrations/20261010_aurel_account_rls.sql\` to the verified project. Verify that neither \`anon\` nor another authenticated user can access an account's rows or private objects.

## Render
Set these **runtime environment variables**, not HTML:
- \`AUREL_SUPABASE_URL\`: the exact project URL \`https://<project-ref>.supabase.co\`
- \`AUREL_SUPABASE_PUBLISHABLE_KEY\`: the project's publishable/anon key (public key, NOT service-role)
- Keep \`AUREL_ALLOWED_ORIGINS=https://thanhhochub-commits.github.io\`.

Wait for successful Render deployment, then run live checks:
- \`/api/auth/config\` returns enabled: true with the expected project URL.
- \`/api/session\` without Authorization returns HTTP 403.
- A verified Gmail JWT is accepted, while unverified, expired or wrong-account JWT is rejected.
- Account A upload, account B same bank/year upload, compare and export: no cross-account exposure.
- Upload and OCR a PDF, log out, sign in from a second device: restore PDF and metrics only to the owner.
- Password reset, logout, refresh token expiration, rate limiting, permission errors, browser storage clearing and private/desktop/mobile navigation.
- Audit Supabase Storage RLS both for direct authenticated GET and object listing.

## Limits and data access
- Gmail+password is an **AUREL-only password**, not the user's actual Gmail password.
- This is account isolation, **not zero-knowledge encryption**. PDF/OCR and cloud AI can expose plaintext to authorized server operators and service providers while processing.
- Session tokens and temporary uncommitted AI previews reside in backend memory and disappear on restart. Committed rows and uploaded PDF originals are stored in Supabase.
- Main financial formulas, existing layout, other website routes and the fixed URL are unchanged.
- If Supabase is not configured, the new auth UI must fail closed. Do NOT merge without live validation.
