# Nritya Laya – Bharatanatyam Academy

One project, one command. Public portfolio + programme catalogue, and after login a portal for admin, teachers,
students, parents and accounts (timetable, attendance marking, fees and online payment demo, reports, website editor).

## Run it
Needs [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
npm run dev
```

Open **http://localhost:3000**. The first run loads **sample data**; every sample account uses the password **`Demo@12345`**.

| Role | Name | Email |
|---|---|---|
| admin | Academy Owner | `owner@example.com` |
| teacher | Guru 1 | `guru1@example.com` |
| teacher | Guru 2 | `guru2@example.com` |
| teacher | Guru 3 | `guru3@example.com` |
| accounts | Cashier | `accounts@example.com` |
| student | Student A | `studenta@example.com` |
| student | Student B | `studentb@example.com` |
| parent | Guardian A | `guardiana@example.com` |
| parent | Guardian B | `guardianb@example.com` |

Things to try: sign in as a teacher → *Mark Attendance*; as the student → see it in *Attendance*; as a parent → *Fees* → pay;
as admin → *Website* (edit the public site), *Accounts* (permissions, set passwords), *Finance Dashboard*.

## Project layout
```
package.json        npm run dev / npm start / npm test
public/index.html   the whole website (one file – edit it and refresh)
server/             API + database (Node, Express, SQLite)
data/               created on first run: nritya.db (your database), .secret_key
test/               automated tests (npm test)
```

## Commands
* `npm run dev` – start with sample data, restarts when server files change.
* `npm start` – production mode: starts **empty** with one admin account (see below).
* `npm test` – 29 automated tests of logins, permissions, attendance, payments, website editing.

Change the port with `PORT=3001 npm run dev` (Windows PowerShell: `$env:PORT=3001; npm run dev`) or in `.env`.

## Going live
1. Copy `.env.example` to `.env`, set `ADMIN_EMAIL` and `ADMIN_PASSWORD`, then delete the `data/` folder and run `npm start`.
   You get one admin and no sample data. If you leave `ADMIN_PASSWORD` empty a random one is printed once.
2. Put it behind HTTPS (Caddy, nginx, or a host such as Render/Railway/Fly) and set `TRUST_PROXY=1`.
3. Back up `data/nritya.db` regularly (it is one file).
4. Online payment is a **demo that approves instantly**; connect a real gateway (Razorpay etc.) before taking real money.
5. There is no email/SMS/WhatsApp sending yet and no emailed password reset: the admin sets passwords in *Accounts*.
6. The login rate limit lives in memory, so run a single server process.

Photos on the public site load from Wikimedia Commons and need an internet connection.
