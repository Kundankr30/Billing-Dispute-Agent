import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import { settings } from "../config";
import { encryptToken } from "../services/cryptoService";
import { db } from "../firestoreClient";

const router = Router();

const SCOPES = [
  "openid", "email", "profile",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/spreadsheets",
];

function oauthClient() {
  return new OAuth2Client(
    settings.GOOGLE_CLIENT_ID,
    settings.GOOGLE_CLIENT_SECRET,
    `${settings.BACKEND_URL}/auth/callback`
  );
}

router.get("/login", (_req, res) => {
  const client = oauthClient();
  const url = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
  res.redirect(url);
});

router.get("/callback", async (req, res) => {
  try {
    const client = oauthClient();
    const code = req.query.code as string;

    if (!code) {
      console.error("OAuth callback: missing code param");
      return res.redirect(`${settings.FRONTEND_URL}/?error=missing_code`);
    }

    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Fetch basic profile info
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: settings.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub) {
      console.error("OAuth callback: failed to verify Google identity");
      return res.redirect(`${settings.FRONTEND_URL}/?error=identity_failed`);
    }

    const userId = payload.sub; // Google's stable user id — used as the Firestore doc id
    const email = payload.email ?? "";
    const name = payload.name ?? "";

    if (!tokens.refresh_token) {
      // Google only returns a refresh_token on first consent. If missing here,
      // it means the user already granted consent before without prompt=consent,
      // or this is a repeat login — handle by keeping the existing stored token.
      console.warn("No refresh_token returned — user may need to re-consent");
    }

    const userRef = db.collection("users").doc(userId);
    const existing = await userRef.get();
    const updateData: Record<string, any> = {
      email,
      name,
    };

    if (tokens.refresh_token) {
      updateData.google_refresh_token_encrypted = encryptToken(tokens.refresh_token);
    }

    if (!existing.exists) {
      // First-time user — set defaults
      await userRef.set({
        email,
        name,
        google_refresh_token_encrypted: tokens.refresh_token
          ? encryptToken(tokens.refresh_token)
          : "",
        spreadsheet_id: null,
        last_sheet_sync_row: 0,
        notification_email: email,
        slack_webhook_url: null,
        approval_mode: "manual",
        created_at: new Date(),
      });
    } else {
      await userRef.set(updateData, { merge: true });
    }

    req.session.userId = userId;
    res.redirect(`${settings.FRONTEND_URL}/dashboard`);
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.redirect(`${settings.FRONTEND_URL}/?error=auth_failed`);
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ status: "logged_out" });
  });
});

router.get("/me", async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).end();

  const doc = await db.collection("users").doc(userId).get();
  if (!doc.exists) return res.status(401).end();

  const { google_refresh_token_encrypted, ...safeData } = doc.data()!;
  res.json({ id: userId, ...safeData });
});

export default router;
