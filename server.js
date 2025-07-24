const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const client_id = "f40cf392b7f34912840014a4ecd75299";
const client_secret = "ffb1dee56c3843f68a67a31abd93b09c";
const redirect_uri = "https://renmoce.github.io/RenMoceMusic_Callback/callback.html";

let tokens = {}; // Tu budeme na zaèiatok uklada tokeny do pamäte

// Endpoint na výmenu autorizaèného kódu za tokeny
app.post("/spotify/token", async (req, res) => {
  const code = req.body.code;
  if (!code) return res.status(400).json({ error: "No code provided" });

  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", redirect_uri);
  params.append("client_id", client_id);
  params.append("client_secret", client_secret);

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await response.json();

    if (data.error) return res.status(400).json(data);

    tokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: Date.now() + data.expires_in * 1000, // èas expirácie
    };

    res.json(tokens);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch token" });
  }
});

// Endpoint na obnovu access tokenu pomocou refresh tokenu
app.post("/spotify/refresh", async (req, res) => {
  const refresh_token = tokens.refresh_token;
  if (!refresh_token) return res.status(400).json({ error: "No refresh token stored" });

  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", refresh_token);
  params.append("client_id", client_id);
  params.append("client_secret", client_secret);

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await response.json();

    if (data.error) return res.status(400).json(data);

    tokens.access_token = data.access_token;
    tokens.expires_in = Date.now() + data.expires_in * 1000;

    res.json(tokens);
  } catch (err) {
    res.status(500).json({ error: "Failed to refresh token" });
  }
});

// Endpoint na získanie aktuálneho access tokenu (volite¾né)
app.get("/spotify/token", (req, res) => {
  if (!tokens.access_token) return res.status(404).json({ error: "No access token stored" });

  // Ak token skoro vyprší, môžeš tu rovno vola refresh endpoint (prípadne to rieš na klientskej strane)
  res.json(tokens);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Spotify backend beží na porte ${PORT}`));
