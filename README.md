<h1 align="center">
  <a href="https://github.com/sahishy/pack-it">
    <img src="frontend/public/favicon.ico" alt="Pack-It" width="28" height="28" />
  </a>
  <b>Pack-It</b>
</h1>

<p align="center">
  An AI-powered travel packing assistant for planning trips, organizing luggage, and packing with confidence.
</p>

<p align="center">
  <a href="https://react.dev/">
    <img src="https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=white" alt="React 19" />
  </a>
  <a href="https://tailwindcss.com/">
    <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4.svg?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
  </a>
  <a href="https://firebase.google.com/">
    <img src="https://img.shields.io/badge/Firebase-Auth_%7C_Firestore-FFCA28.svg?logo=firebase&logoColor=white" alt="Firebase" />
  </a>
  <a href="https://workers.cloudflare.com/">
    <img src="https://img.shields.io/badge/Cloudflare-Workers-F38020.svg?logo=cloudflare&logoColor=white" alt="Cloudflare Workers" />
  </a>
</p>

## Overview

Pack-It keeps a trip’s packing list, suitcases, and AI guidance in one focused place. Create a trip, add what you are bringing, get help with item details, and generate a practical packing order for each suitcase.

## Features

- Create and manage trips and suitcases
- Build packing lists with quantities, weights, and dimensions
- Get AI-assisted item details and travel packing suggestions
- Generate a step-by-step packing plan
- Review progress after packing
- Continue as a guest, then create an account to save your trips
- Use the app on the web or as an iOS Capacitor app

## Tech stack

| Area | Tools |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, shadcn/ui |
| Backend | Cloudflare Workers, OpenAI API |
| Data and auth | Firebase Authentication, Firestore |
| Mobile | Capacitor for iOS |

## Project structure

```text
pack-it/
├── frontend/       # React, Vite, and Capacitor application
│   └── src/        # Pages, components, contexts, and services
├── backend/        # Cloudflare Worker API and AI services
├── firestore.rules # Firestore security rules
└── firebase.json   # Firebase project configuration
```

## Getting started

Install dependencies for both apps, then copy each `.env.example` file to `.env` and fill in the required Firebase and API credentials.

```bash
cd frontend
npm install
npm run dev
```

In another terminal, run the API:

```bash
cd backend
npm install
npm run dev
```