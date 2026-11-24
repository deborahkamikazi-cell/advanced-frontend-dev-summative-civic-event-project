# CivicEvents+ Frontend

## Overview
This frontend implements the CivicEvents+ UI using your Cloud Studio design language with:
- HTML5
- Tailwind CSS
- jQuery
- Modular JavaScript

Authentication and administrator pages use the real backend API. User pages request API data first; their existing mock fallback remains for development. Administrator actions never fall back to mock writes.

## Tech Stack
- Tailwind CSS (`css/input.css` → `css/output.css`)
- jQuery for DOM interactions
- ES modules for page logic, guards, and shared utilities

## Project Structure
```text
frontend/
├── index.html
├── pages/
│   ├── auth/...
│   ├── user/...
│   └── admin/...
├── components/
│   ├── navbar.html
│   ├── admin-sidebar.html
│   ├── admin-topbar.html
│   ├── footer.html
│   ├── notification-drawer.html
│   ├── modal.html
│   └── toasts.html
├── css/
│   ├── input.css
│   └── output.css
└── js/
    ├── auth/                 # auth + guards
    ├── mock/                 # mock datasets + state + mock client
    ├── pages/                # page-level scripts
    ├── services/             # reusable backend API requests
    ├── config/
    └── utils/
```

## Setup & Run
From `frontend/`:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build Tailwind CSS:
   ```bash
   npm run build:css
   ```
3. (Optional) Watch Tailwind while editing:
   ```bash
   npm run dev:css
   ```
4. Start local static server:
   ```bash
   npm run start
   ```

Open the exact URL printed by the server, for example `http://localhost:3000/pages/auth/login.html`. Keep the frontend terminal running.

## Backend Setup and Authentication
- Start PostgreSQL and configure your local database following [the backend README](../backend/README.md). Run the table migration once for a fresh database; do not rerun it on an existing database.
- In a separate terminal, start the existing backend with `npm run dev` from `backend/`. Local connection settings can be supplied as environment variables without changing backend files. The backend runtime reads `DB_PASS` for the database password.
- Configure the API in `js/config/config.js`: the default is `http://localhost:4000/api`, with a 20-second request timeout.
- Sign up for a real user account. Mock fixture accounts do not automatically exist in PostgreSQL. Administrator pages require an existing real account with the `admin` role.
- Token and current user information are stored in `sessionStorage`. Services use the shared jQuery AJAX client to attach Bearer tokens. Protected 401 responses clear the session and redirect to login; 403 responses display access denied.
- JSON and multipart requests share the same client. File uploads use `FormData`; the browser sets the multipart boundary.
- Do not commit credentials, tokens or local environment files.

## Administrator Integration (Stage 5)
- Dashboard: API totals, actual monthly user growth and recent events. The API does not provide monthly registration charts or a recent-activity feed, so those areas show supported data instead.
- Events: list/create/edit/delete, optional image uploads (2 MB), image preview and registrants. Dates are submitted as ISO timestamps. New events are published automatically; event publication toggles are unsupported.
- Announcements: paginated list, create with required audio (5 MB), edit title/status, publish/unpublish and delete. The backend update controller does not persist replacement audio, so that edit control is disabled. Duration and transcript storage are unsupported.
- Promos: paginated list, create with required video (8 MB), edit including optional replacement video, publish/unpublish and delete. Caption text is supported; transcript, theme and caption-file storage are not. Creation publishes first; an unchecked Published box causes a separate unpublish request. If that request fails, the form retains the created ID so retrying does not duplicate the promo.
- Users: paginated real users, enable/disable, with no role editing. The backend currently does not enforce `is_active` during authentication; changing account status alone does not guarantee login/access is blocked.
- Notifications: list broadcasts and notifications for the current account, and permanently delete. There is no manual create/broadcast route or all-recipients admin listing.
- List errors include Retry. Mutations disable their buttons while pending and show API errors instead of claiming success.
- Deleting an event with registrations may be rejected by the backend foreign key constraint, including cancelled registrations. Uploaded media cleanup is controlled by the existing backend; deleting content does not necessarily remove uploaded files.

### Testing with real data
1. Keep both servers running and sign in as a real administrator.
2. Create an event with a future start/end and optional image. Reload the admin list, edit it and view its registrants.
3. Open the user homepage/events in another session and verify the same record appears. Register as a user, then check the admin registrants list.
4. Create an announcement with a small audio file; verify playback as a user. Edit the title, toggle publication and reload to verify persistence.
5. Create a promo with a small browser-compatible MP4 and caption text. Verify playback, edit the video/title, and test publish/unpublish.
6. Enable/disable a test user, reload, and confirm the stored status. Do not expect this backend to reject disabled-user logins.
7. Check dashboard totals and generated notifications after creating content. Test deletion only on disposable records; notification deletion also affects other broadcast recipients.
8. Test a normal user's direct admin URL (redirect/access denied) and an expired session (login redirect). Stop the API temporarily to check error/retry states.

## How Mock Data Works
- Persistent app data: `localStorage` key `civicevents_mock_db_v1`
- Session auth state: `sessionStorage`
- Mock datasets include users, events, announcements, promos, notifications, registrations, feedback, and dashboard stats.

The retained development fixtures simulate:
- Event registration/cancellation
- Admin CRUD-style management (events, announcements, promos, notifications)
- User enable/disable
- Notification read state
- Profile updates (full name/email)

## Authentication & Guards
- `js/auth/auth.js`: real login/signup/logout session flow
- `js/auth/auth-guard.js`: redirects unauthenticated users to login
- `js/auth/role-guard.js`: blocks non-admins from admin routes

Frontend checks improve UX; backend authorization is the actual access control.

## UI System
- Shared shells load reusable components dynamically:
  - Public/user shell: navbar + drawer + footer
  - Admin shell: sidebar + topbar + footer
- Global modal and toast components are shared across pages.
- Tailwind theme tokens match Cloud Studio palette (navy/royal/amber) and Inter typography.

## Testing Checklist
1. Open all auth, user, and admin pages.
2. Verify navigation links, mobile nav, dropdowns, and sidebar.
3. Test login with both roles and role-based redirects.
4. Test signup validation and password strength meter.
5. Test events search/filter/pagination/register/cancel/feedback.
6. Test admin create/edit/delete/publish flows.
7. Test notifications read states and drawer behavior.
8. Test profile update (full name/email only).
9. Confirm no console errors and no missing assets.

## Remaining Validation
Run the checklist against your local API with real media and both roles. Existing user-page mock fallbacks can mask API failures; mock content is not proof of a successful backend request. Full application-wide verification is Stage 6.

### Stage 5 checks performed
- JavaScript syntax checks, editor diagnostics and the Tailwind production build passed.
- Live browser/API checks passed for event create/edit/image upload, user homepage visibility, registration and admin registrants; announcement audio upload/playback and title editing; promo video upload/replacement/playback and caption editing; publish/unpublish; user enable/disable persistence; dashboard counts; content and notification deletion.
- Tested API outage/retry and partial promo publication failure with injected 503 responses; retrying saved the existing promo without creating a duplicate.
- Tested normal-user admin rejection (API 403), invalid-token session clearing (401), date validation and image-size rejection.
- Checked all nine admin pages at 390px and 1280px widths with no page-level horizontal overflow. Tables scroll within their containers.
- Disposable QA accounts, content, registrations, notifications and generated upload files were removed after testing. No backend source files were changed.
