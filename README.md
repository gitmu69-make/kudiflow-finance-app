# KudiFlow Finance App

A Capacitor + Vite app with an Express backend, Firebase integration, and Gemini AI-powered analysis.

> The server loads environment variables from `.env` using `dotenv`.

## Local Development

**Prerequisites:** Node.js 18+ and npm

1. Install dependencies:
   `npm install`
2. Create a local environment file:
   `copy .env.example .env`
3. Open `.env` and set your Gemini API key:
   `GEMINI_API_KEY=YOUR_GEMINI_API_KEY`
4. Start the development server:
   `npm run dev`

The app will be served by the local Express/Vite server at `http://localhost:3000`.

## Firebase

- Firebase is configured from `firebase-applet-config.json`.
- No additional local Firebase env variables are required for the client.
- Authentication supports Google sign-in, anonymous sign-in, and email/password.

## AI Endpoint

- The backend exposes AI analysis at `POST /api/ai/analyze`.
- The endpoint returns valid JSON with keys: `totalSpending`, `topCategory`, `insight`, and `recommendation`.
- `GEMINI_API_KEY` must be present in `.env` for AI requests to work.

## Production Build

1. Build the client and server:
   `npm run build`
2. Start the built app:
   `npm start`

## Notes

- Use `.env` for local environment variables.
- `APP_URL` can be configured in `.env` for deployments or callback URLs.
- The app requires `GEMINI_API_KEY` to be set before using the AI endpoint.
