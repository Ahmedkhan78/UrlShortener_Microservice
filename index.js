require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dns = require("dns");

const app = express();
const port = process.env.PORT || 3000;

// In-memory URL store
let urlDatabase = {};
let idCounter = 1;

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use("/public", express.static(`${process.cwd()}/public`));

// Homepage
app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// ✅ POST endpoint to shorten a URL
app.post("/api/shorturl", function (req, res) {
  const originalUrl = req.body.url;
  let hostname;

  // ✅ Use modern URL parser
  try {
    const parsedUrl = new URL(originalUrl);
    hostname = parsedUrl.hostname;
  } catch (err) {
    return res.json({ error: "invalid url" });
  }

  // ✅ DNS lookup to validate domain
  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: "invalid url" });
    }

    // ✅ Check if already exists
    const existing = Object.entries(urlDatabase).find(
      ([key, value]) => value === originalUrl
    );
    if (existing) {
      return res.json({
        original_url: originalUrl,
        short_url: Number(existing[0]),
      });
    }

    // ✅ Save new short URL
    const shortUrl = idCounter++;
    urlDatabase[shortUrl] = originalUrl;

    res.json({ original_url: originalUrl, short_url: shortUrl });
  });
});

// ✅ Redirect endpoint
app.get("/api/shorturl/:short_url", function (req, res) {
  const shortUrl = Number(req.params.short_url);
  const originalUrl = urlDatabase[shortUrl];

  if (originalUrl) {
    res.redirect(301, originalUrl);
  } else {
    res.status(404).json({ error: "No short URL found for the given input" });
  }
});

// Start server
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
