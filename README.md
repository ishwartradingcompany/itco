# ITCO Trade Management

Web app for **Ishwar Trading Company** – business management for vegetables and fruits trading (purchases, sales, inventory, brokerage, deductions, P&amp;L, ledger, reports).

## Tech stack

- **Frontend:** HTML5, CSS3, JavaScript (vanilla)
- **Styling:** Tailwind CSS (CDN), custom CSS
- **Backend / data:** Firebase (Authentication, Firestore, Storage)
- **Hosting:** Firebase Hosting

## Project structure

```
├── public/                 # Web app (Firebase hosting root)
│   ├── index.html          # Main app (dashboard, after login)
│   ├── login.html          # Login & forgot password
│   ├── css/
│   │   ├── main.css        # App layout, sidebar, tables, responsive
│   │   └── login.css       # Login page styles
│   └── js/
│       ├── config.js       # Tailwind theme config
│       ├── firebase-config.js  # Firebase init (app, auth, db)
│       ├── ui.js           # UI helpers (date/time, sidebar, page titles)
│       ├── app.js          # Main app logic (data, CRUD, pages)
│       ├── auth.js         # Auth state, logout, user display
│       └── login.js        # Login & forgot password logic
├── firebase.json           # Firebase config (hosting, Firestore)
├── firestore.rules         # Firestore security rules
├── firestore.indexes.json  # Firestore indexes
└── README.md
```

## Setup

1. **Clone the repo**
   ```bash
   git clone <your-repo-url>
   cd "fire base project 2 of ITCO"
   ```

2. **Firebase**
   - Create a project in [Firebase Console](https://console.firebase.google.com) (or use existing).
   - Enable **Authentication** (Email/Password) and **Firestore**.
   - Install CLI: `npm install -g firebase-tools`
   - Login: `firebase login`
   - Use existing project: `firebase use <project-id>`  
     Or link: `firebase init` and choose Hosting + Firestore.

3. **Config**
   - Firebase config (API key, project ID, etc.) is in `public/js/firebase-config.js`.  
   - For a new project, replace with your own config from Firebase Console → Project settings.

4. **Run locally**
   - Serve `public/` with any static server, e.g.:
     ```bash
     npx serve public
     ```
   - Or use Firebase: `firebase serve` (serves from `public` per `firebase.json`).

5. **Deploy**
   ```bash
   firebase deploy
   ```

## Pages (after login)

- **Dashboard** – overview
- **Purchase** – purchase entries
- **Sales** – sales entries
- **Inventory** – stock
- **Broker** – brokerage
- **Deductions** – deductions
- **Opening Balance**
- **Profit & Loss**
- **Ledger**
- **Reports**
- **Master Data**

## License

Private / internal use unless stated otherwise.
