# CivicEvents+ Frontend

## Overview
This folder contains the frontend scaffold for the **CivicEvents+ Event Management Platform** assignment.
It is organized for implementation using:

- HTML5
- Tailwind CSS
- jQuery
- Vanilla JavaScript (modular files)

The backend API is expected at `http://localhost:4000/api` (based on backend documentation and server configuration).

---

## Frontend Technologies
- **HTML5** for semantic page structure
- **Tailwind CSS** for styling utilities
- **jQuery** for DOM/event handling and AJAX transport
- **ES Modules** for reusable JavaScript architecture

---

## Folder Structure
```text
frontend/
├── index.html
├── README.md
├── package.json
├── tailwind.config.js
├── assets/
│   ├── images/
│   ├── icons/
│   └── media/
├── components/
│   ├── navbar.html
│   ├── footer.html
│   ├── admin-sidebar.html
│   ├── notification-drawer.html
│   └── loading.html
├── css/
│   ├── input.css
│   └── output.css
├── pages/
│   ├── auth/
│   ├── user/
│   └── admin/
└── js/
    ├── config/
    ├── services/
    ├── auth/
    ├── pages/
    └── utils/
```

---

## Setup
From this `frontend/` directory:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build Tailwind CSS once:
   ```bash
   npm run build:css
   ```

3. Or run Tailwind in watch mode:
   ```bash
   npm run dev:css
   ```

4. Start a local static server:
   ```bash
   npm run start
   ```

---

## Tailwind CSS
- Source file: `css/input.css`
- Output file: `css/output.css`
- Config: `tailwind.config.js`

The current `output.css` is a placeholder until you run `npm run build:css` or `npm run dev:css`.

---

## Backend API Base URL Configuration
Centralized in:

- `js/config/config.js`

```js
API_BASE_URL: "http://localhost:4000/api"
```

Change this in one place when backend host/port changes.

---

## Authentication Flow (Frontend)
- Login and signup requests go through `js/services/auth.service.js`.
- Token and user are stored in **sessionStorage** via `js/utils/storage.js`.
- Auth guard:
  - `js/auth/auth-guard.js` enforces authenticated pages.
  - `js/auth/role-guard.js` enforces admin-only pages (`role === "admin"`).
- Logout clears session storage and redirects to login.

> Note: Frontend role checks are for UX only. Real security is enforced by backend authorization.

---

## API Communication Pattern
- Shared AJAX layer: `js/services/api.js`
- Automatically attaches `Authorization: Bearer <token>` to protected requests.
- Handles:
  - JSON payloads (`application/json`)
  - Multipart uploads using `FormData` (without manually setting multipart content-type)
- Global behavior:
  - `401`: clears session and redirects to login
  - `403`: displays access denied message
  - Network/timeouts: normalized errors for UI handling

---

## Backend Endpoint Mapping (Verified)
All routes are under `/api`.

### Auth
- `POST /auth/signup`
- `POST /auth/login`

### Users
- `GET /users` (admin)
- `GET /users/:id` (admin)
- `PATCH /users/:id/enable` (admin)
- `PATCH /users/:id/disable` (admin)
- `GET /users/profile/me`
- `PATCH /users/profile/me` (full_name/email only)

### Events
- `GET /events`
- `GET /events/:id`
- `POST /events` (admin, multipart field: `image`)
- `PUT /events/:id` (admin, multipart field: `image`)
- `DELETE /events/:id` (admin)

### Event Registrations
- `POST /event-registrations/register` (body: `event_id`)
- `POST /event-registrations/cancel` (body: `event_id`)
- `GET /event-registrations/my-registrations`
- `GET /event-registrations/event/:event_id/attendees` (admin)

### Event Feedback
- `POST /event-feedback`
- `PUT /event-feedback/:id`
- `GET /event-feedback/my-feedback`
- `GET /event-feedback/event/:event_id` (admin)

### Announcements
- `GET /announcements`
- `GET /announcements/:id`
- `POST /announcements` (admin, multipart field: `audio`)
- `PUT /announcements/:id` (admin)
- `PATCH /announcements/:id/publish` (admin)
- `PATCH /announcements/:id/unpublish` (admin)
- `DELETE /announcements/:id` (admin)

### Promos
- `GET /promos`
- `GET /promos/:id`
- `POST /promos` (admin, multipart field: `video`)
- `PUT /promos/:id` (admin, multipart field: `video`)
- `PATCH /promos/:id/publish` (admin)
- `PATCH /promos/:id/unpublish` (admin)
- `DELETE /promos/:id` (admin)

### Notifications
- `GET /notifications`
- `GET /notifications/:id`
- `DELETE /notifications/:id` (admin)

### Dashboard
- `GET /dashboard/admin` (admin)
- `GET /dashboard/me` (authenticated user)

---

## Known Backend Clarifications Needed
1. **Announcement update + audio upload**  
   Route accepts multipart audio upload, but update controller currently updates from `req.body` only.  
   If audio replacement is required, backend behavior should be clarified/updated.

2. **Published-only filtering**  
   Assignment requires browsing published content, but current list endpoints return full datasets unless backend query filtering is added.

3. **Promo captions file upload**  
   Backend stores `caption_text`; no dedicated caption file upload endpoint/field is currently implemented.

4. **Notification unread status updates**  
   Notifications table has `read` field, but no explicit endpoint for marking notifications as read was found.