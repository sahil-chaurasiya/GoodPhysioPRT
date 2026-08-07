# PRT Health — Patient Management System

A full MERN + Cloudinary + Tailwind CSS **PWA** for managing field PRTs (Physiotherapy Reps), the doctors they visit, patient registration (with consent-form uploads), pre/post session vitals tracking, medicine records, and an admin back-office.

Built from the reference spec: doctor management, PRT/user management, patient registration with consent form image upload, session vitals (SPO2, HR, BP, 6MWT, EQ5D3L), medicine tracking, and dashboards.

---

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + React Router + PWA (installable, offline-caching via Workbox)
- **Backend:** Node.js + Express + MongoDB (Mongoose) + JWT auth
- **File storage:** Cloudinary (consent forms, medicine images)

---

## 1. Prerequisites

You need, on your own machine:

1. **Node.js 18+** and npm
2. **MongoDB** — either:
   - Installed locally (`mongod` running on `mongodb://127.0.0.1:27017`), **or**
   - A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (get a connection string)
3. A free **[Cloudinary](https://cloudinary.com)** account (for image uploads) — get your Cloud Name, API Key, and API Secret from the Cloudinary dashboard.

---

## 2. Setup

### Step 1 — Configure environment variables

Open `server/.env` (already created for you, copied from `server/.env.example`) and fill in:

```env
MONGO_URI=mongodb://127.0.0.1:27017/prt_health_app   # or your Atlas connection string
JWT_SECRET=some_long_random_string
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

The other values (`PORT`, `CLIENT_URL`, seed admin credentials) already have sensible defaults — change them if you like.

### Step 2 — Install everything

From the **project root**:

```bash
npm install
```

This installs the root tooling and automatically installs both `server/` and `client/` dependencies (via `postinstall`).

> If you prefer to install manually instead: `cd server && npm install`, then `cd ../client && npm install`.

### Step 3 — Run it

From the **project root**:

```bash
npm run dev
```

This starts **both** the backend (`http://localhost:5000`) and the frontend (`http://localhost:5173`) concurrently, with the frontend proxying `/api` requests to the backend.

Alternatively, run them in two separate terminals:

```bash
# terminal 1
cd server && npm run dev

# terminal 2
cd client && npm run dev
```

Open **http://localhost:5173** in your browser.

### Step 4 — Log in

On first boot, the server automatically seeds an **admin account plus a full set of sample data** — PRTs, doctors, patients (with sessions, medicines, and join links) — so the app is immediately explorable. One login is seeded for each of the four roles:

| Role | Login Email | Password | What they can do |
|---|---|---|---|
| **Admin** | `admin@cipla.com` | `Admin@123` | Full access — add/edit/delete doctors, PRTs, patients, medicines; create logins for doctors & patients |
| **PRT** | `prt1@cipla.com` (or `prt2@cipla.com`) | `Prt@123` | Can **add** patients, sessions & medicine data only — cannot edit or delete an existing patient record |
| **Doctor** | `doctor1@cipla.com` | `Doctor@123` | Read-only view of the patients assigned to them |
| **Patient** | `patient1@cipla.com` | `Patient@123` | Read-only view of their own registered profile, plus a **Sessions** tab with a **Join** button for any session their PRT added an online meeting link to |

Log in with any of these to explore that role's view. As admin, use the **Admin Portal** tab to add more doctors/PRTs/medicines, or the ⋮ menu on a doctor / patient record to issue them portal logins.

> Seeding only runs once — if a `Doctor` already exists in your database, the sample-data step is skipped automatically (the admin account is still seeded/checked every boot). To re-run it standalone on a fresh DB: `cd server && npm run seed`.

---

## 3. Roles & permissions

- **Admin** — full CRUD everywhere: doctors, PRTs, patients, medicines, sessions.
- **PRT** — can **only add**: register new patients, start sessions (pre-vitals), complete sessions (post-vitals), add medicine data. Editing or deleting an existing patient record is Admin-only.
- **Doctor** — has their own login (linked to their Doctor record by an admin). Sees a read-only **My Patients** list scoped to patients assigned to them.
- **Patient** — has their own login (issued by an admin from a patient's profile page). Sees a read-only **My Profile** tab with the details their PRT/admin registered, and a **Sessions** tab where any session with a meeting link (entered by the PRT on the session form) shows a **Join** button.

All of this is enforced server-side (not just hidden in the UI) — see `server/controllers/patientController.js` and the route-level `authorize(...)` guards in `server/routes/*.js`.

---

## 4. Project structure


```
prt-health-app/
├── package.json          ← root orchestration (npm install / npm run dev)
├── server/                ← Express + MongoDB API
│   ├── server.js
│   ├── .env               ← YOUR config goes here (Mongo, JWT, Cloudinary)
│   ├── config/             (db.js, cloudinary.js)
│   ├── models/             (User, Doctor, Patient, Session, Medicine, PatientMedicine, Visit)
│   ├── controllers/
│   ├── routes/
│   ├── middleware/         (auth.js, upload.js)
│   └── utils/               (generateId.js, seed.js)
└── client/                ← React + Vite + Tailwind PWA
    ├── vite.config.js       (PWA plugin, dev proxy to :5000)
    ├── tailwind.config.js
    ├── index.html
    ├── public/               (manifest icons, favicon)
    └── src/
        ├── App.jsx           (routes, role-based access per route)
        ├── context/           (AuthContext)
        ├── components/        (Layout w/ role-aware bottom nav, Modal, FormFields, Ui, ProtectedRoute)
        ├── utils/roleHome.js  (per-role default landing page)
        ├── api/axios.js
        └── pages/
            ├── Login.jsx
            ├── Dashboard.jsx           (Admin/PRT — stats, Update Visit, Registration Data, All Visit Data)
            ├── RegisterPatient.jsx      (Admin/PRT — multi-step: Info → Doctor/Clinical → Consent Upload → Pre-Vitals (+ meeting link) → Post-Vitals)
            ├── MyPatients.jsx / PatientDetail.jsx  (Admin/PRT/Doctor — Add Session, Add Medicine; write actions hidden for Doctor)
            ├── PatientMyProfile.jsx     (Patient — read-only registered profile)
            ├── PatientSessions.jsx      (Patient — Sessions tab with "Join" buttons)
            ├── Me.jsx                  (profile, change password, logout — all roles)
            └── admin/
                ├── AdminPortal.jsx      (hub)
                ├── AdminDoctors.jsx     (Add/View doctors, Map Doctor→PRT, Create Doctor Login)
                ├── AdminPrts.jsx / EditPrt.jsx  (Add User, view/edit PRT data)
                ├── AdminMedicines.jsx   (medicine catalog)
                └── AdminReports.jsx     (All Session / Prescription Data)
```

---

## 5. Core features implemented

- **Auth:** JWT login, bcrypt-hashed passwords, **four roles** (`admin` / `prt` / `doctor` / `patient`), auto-seeded sample account for each role on first boot.
- **Doctor management:** Add/view doctors, auto-generated Doctor IDs (`DOC-YYYY-XXXX`), map doctors to PRTs, issue a doctor a portal login.
- **PRT / user management:** Admin can create logins (`Add User`), edit PRT data (zone, manager, active/inactive toggle). PRTs themselves can only *add* records, never edit/delete.
- **Patient registration wizard:** Basic Info → Doctor & Clinical Info → Consent Form Upload (Cloudinary) → Pre-Session Vitals (+ optional meeting link) → Post-Session Vitals, with auto-generated Patient IDs (`PAT-YYYY-XXXX`).
- **Session tracking:** Pre-vitals (SPO2, HR, BP) at registration; Post-vitals (HR, BP, respiration rate, 6MWT distance, EQ5D3L score) added per session. A PRT can attach a **meeting link** to a session, which becomes the patient's **Join** button.
- **Patient & Doctor portals:** Admin issues a login tied to a specific Patient or Doctor record. Patients get a read-only profile + a Sessions/Join tab; doctors get a read-only list of their assigned patients.
- **Medicine tracking:** Global medicine catalog (Admin) + per-patient medicine entries.
- **Dashboard:** Live stats, "Registration Data" (PRT × patients × sessions), "All Visit Data" log, "Update Visit" / "Add Sales Team Visit" logging for days with no patient registered.
- **PWA:** Installable (manifest + icons), offline-caching service worker (Workbox via `vite-plugin-pwa`), mobile-first UI with role-aware bottom tab navigation and a responsive sidebar on desktop.

---

## 6. Notes & troubleshooting

- **"Failed to connect to MongoDB"** — make sure `mongod` is running locally, or that your Atlas `MONGO_URI` is correct and your IP is allow-listed on Atlas.
- **Image upload fails** — double check your three `CLOUDINARY_*` values in `server/.env`. You can find them on your Cloudinary dashboard home page.
- **Building for production:** `npm run build` (root) builds the client into `client/dist`. Deploy `server/` to any Node host (Render, Railway, etc.) and `client/dist` to any static host (Vercel, Netlify) or serve it from Express. Remember to set `VITE_API_URL` in the client's environment to point at your deployed API if they're on different domains.
- The **default admin password should be changed** after first login (Me → Change Password).
