# LetsBank

A professional banking app built with React and Astra DB.

## Features

- **Login** – Sign in with email and password
- **Signup** – Create a new account
- **Dashboard** – Check balance, view transaction history, and account details

## Tech Stack

- React 18 + Vite
- React Router
- Astra DB (DataStax) for backend storage
- Express.js API server

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure Astra DB**

   Copy `.env.example` to `.env` and configure:

   - `VITE_ASTRA_DB_API_ENDPOINT` – Your Astra DB endpoint (format: `https://DATABASE_ID-REGION.apps.astra.datastax.com`)
   - `VITE_ASTRA_DB_APPLICATION_TOKEN` – Your Astra application token

   Get these from the [Astra Portal](https://astra.datastax.com) → your database → Overview → Database Details.

   **Important:**
   - Copy the **exact** Data API endpoint from Astra Portal → your database → Overview → Database Details.
   - The Data API requires a **Serverless (Vector)** database. Non-vector databases are not supported.
   - If Astra connection fails, the app falls back to an in-memory store so you can still test it.

3. **Run the app**

   ```bash
   npm run dev
   ```

   This starts both the API server (port 3001) and the React app (port 3000).

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
BANK_APP/
├── server/           # Express API + Astra DB
│   ├── db/astra.js  # Astra DB connection
│   └── routes/      # Auth & account endpoints
├── src/
│   ├── context/     # Auth context
│   ├── pages/       # Login, Signup, Dashboard
│   └── services/    # API client
└── package.json
```

## Security Note

Never commit `.env` or expose your Astra token. The token is used only on the server; the React app talks to the local API.
