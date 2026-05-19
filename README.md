# SM Invoice System

Invoice system for SM Architectural Construction. It includes a Node.js/Express backend, a browser-based invoice frontend, MongoDB Atlas storage, invoice numbering, discount handling, advance payments, and print-friendly invoices with the company letterhead.

## Features

- Save invoices to MongoDB Atlas
- Automatically generate invoice numbers such as `SM/2026/1001`
- Add multiple invoice items
- Add discount as a fixed amount or percentage
- Add advance payment and show balance due
- Print invoices with the company letterhead
- Load and delete saved invoices

## Project Structure

```text
.
├── models/
│   └── Invoice.js
├── public/
│   ├── assets/
│   │   └── sm-letterhead.png
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── routes/
│   └── invoices.js
├── .env.example
├── package.json
├── package-lock.json
└── server.js
```

## Local Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file from `.env.example`:

```bash
copy .env.example .env
```

Update `.env` with your MongoDB Atlas connection string:

```env
MONGODB_URI=mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/sm_invoices?retryWrites=true&w=majority
PORT=3000
DNS_SERVERS=8.8.8.8,1.1.1.1
```

Run the app:

```bash
npm start
```

Open:

```text
http://localhost:3000
```

## Deploying

This project can be deployed as a single Node.js web service because Express serves both the API and frontend.

For Render:

- Build command: `npm install`
- Start command: `npm start`
- Add `MONGODB_URI` as an environment variable
- Add `DNS_SERVERS=8.8.8.8,1.1.1.1` if needed

Do not upload `.env` to GitHub. Use hosting environment variables instead.
