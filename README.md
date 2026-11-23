# JewelManager – Static Demo

A front-end-only demo for a jewellery savings/collection management workflow.

## Requirements
- Node.js 20.19+ or 22.12+
- VS Code (recommended)

## Run locally
1. Extract this ZIP.
2. Open the `jewelmanager-demo` folder in VS Code.
3. Open Terminal → New Terminal.
4. Run:

   ```bash
   npm install
   npm run dev
   ```

5. Open the local URL printed by Vite (usually http://localhost:5173).

## Demo features
- Dashboard with sample figures
- Add and search customers
- Add areas
- Enter paper receipt collection records
- View customer statements
- Duplicate receipt number check
- CSV export can be added to the UI in the next iteration

## Important limitations
- No login or backend.
- Data is stored in this browser's localStorage only.
- Clearing browser storage removes demo changes.
- This is not suitable for real customer financial records.
- Sample customer data is fictional.
- Account balance currently means sum of recorded deposits only; it does not calculate scheme benefits or jewellery redemption terms.

## Reset demo
In the browser developer console, run:

```js
localStorage.removeItem("jm_customers");
localStorage.removeItem("jm_payments");
localStorage.removeItem("jm_areas");
location.reload();
```

## Next production steps
- Add a backend and database.
- Add authentication and role-based access.
- Add tenant/shop isolation (`shopId`) to every relevant record.
- Add server-side receipt number uniqueness and transaction audit trail.
- Add backups, access controls and financial reconciliation.
