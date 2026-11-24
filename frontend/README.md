# CivicEvents+ Frontend (Mock Implementation)

## Overview
This frontend implements the CivicEvents+ UI using your Cloud Studio design language with:
- HTML5
- Tailwind CSS
- jQuery
- Modular JavaScript

Current mode is **mock-data only** (no backend integration yet). All interactions are simulated and persisted in browser storage.

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
    ├── services/             # reserved for backend integration later
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

## Mock Accounts (Login)
- **Admin**
  - Email: `admin@mail.rw`
  - Password: `Password123@`
- **User**
  - Email: `aline@mail.rw`
  - Password: `Password123@`

You can also create new users from signup.

## How Mock Data Works
- Persistent app data: `localStorage` key `civicevents_mock_db_v1`
- Session auth state: `sessionStorage`
- Mock datasets include users, events, announcements, promos, notifications, registrations, feedback, and dashboard stats.

This enables:
- Event registration/cancellation
- Admin CRUD-style management (events, announcements, promos, notifications)
- User enable/disable
- Notification read state
- Profile updates (full name/email)

## Authentication & Guards
- `js/auth/auth.js`: mock login/signup/logout session flow
- `js/auth/auth-guard.js`: redirects unauthenticated users to login
- `js/auth/role-guard.js`: blocks non-admins from admin routes

Frontend checks are for UX demonstration; backend authorization will enforce security later.

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

## Backend Integration (Later)
Service files in `js/services/` are kept for the later API integration stage.
