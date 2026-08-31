# Country Flag Ranking — Live YouTube Board

A mobile-friendly web app that turns your YouTube live chat into a "comment your country" leaderboard, just like the reference screenshots (`horizontal.png` / `Vertical.png` / `3.png`).

It runs as a small local server (`server.js`) on one machine (e.g. your laptop). That server holds your API key and does all the YouTube polling **once**, so every device that opens the same URL — your laptop's own browser, your phone, a second phone, etc. — sees the exact same live board automatically, without ever entering the API key on more than one device.

## How scoring works

| Action | Points | How it's detected |
|---|---|---|
| Someone comments a country name | **+1** to that country | Chat text is matched against a country name/alias list |
| Someone comments a subscribe keyword (default: `subscribed`, `sub`) | **+100** to a country | Applied to the country mentioned in the same message, or that person's last-used country |
| The video's public like count goes up | **+10 per like**, added to a global **Bonus** counter | YouTube has no per-user "like" event, so this is tracked as an overall bonus, not per-country |

> YouTube's public API does not expose "user subscribed to channel" or "user liked this video" events for individual viewers — that data simply isn't available to anyone outside YouTube. The subscribe/like handling above is the closest practical equivalent, as agreed.

## 1. Get a YouTube Data API key (one-time setup)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (top-left project picker → **New Project**).
3. Go to **APIs & Services → Library**, search **YouTube Data API v3**, and click **Enable**.
4. Go to **APIs & Services → Credentials → Create Credentials → API key**.
5. Click **Restrict key**:
   - Under **API restrictions**, choose **Restrict key** and select **YouTube Data API v3**.
   - Under **Application restrictions**, you can leave it as "None" if this app only runs on your own phone and you never share the page/link with anyone else. If you'll host it somewhere reachable by others, restrict it (e.g. HTTP referrers) so your key can't be copied and used elsewhere.
6. Copy the key — you'll paste it into the app's setup screen.

**Quota note:** the free tier gives 10,000 units/day, which is plenty for a normal stream at the default polling rate. If you ever see a "quota exceeded" error, wait until the daily reset or request a quota increase in the Cloud Console.

## 2. Find your live video ID

Start your YouTube live stream, then copy its URL, e.g. `https://www.youtube.com/watch?v=XXXXXXXXXXX` or `https://youtube.com/live/XXXXXXXXXXX`. You can paste the whole URL into the app — it extracts the ID automatically.

## 3. Run the server (once, on any one machine — e.g. your laptop)

This needs [Node.js](https://nodejs.org) installed (v18+; no `npm install` or dependencies needed — it's built entirely on Node's standard library).

From this folder, run:
```powershell
node server.js
```
You'll see:
```
Country Flag Ranking server running at http://localhost:8090
```
Find this machine's LAN IP so your phone can reach it:
```powershell
ipconfig | Select-String "IPv4"
```
Use the one that looks like your home Wi-Fi (usually `192.168.x.x`). **Avoid port 8080** if something else on your machine already uses it — change the `PORT` at the bottom of `server.js` (or set the `PORT` environment variable) if 8090 is also taken.

Keep this terminal window open for as long as you want the board running — closing it stops the shared session for everyone.

## 4. Open it on any device

On your laptop, phone, or any other device on the same Wi-Fi, open:
```
http://<laptop's-LAN-IP>:8090
```
- **First device to configure it:** enter your **API key**, the **live video URL/ID**, optional subscribe keywords, and a starting point value per country (defaults to 1000) — then tap **Start Live Board** (or **Try Demo Mode** to preview without an API key/stream).
- **Every other device:** just open the same URL — it automatically detects the session is already running and jumps straight to the live board. No API key, no setup, nothing to type.
- Tap **⚙️** anytime to stop the session for everyone and go back to setup (scores are saved and resume automatically for the same video ID, even across server restarts).

## 5. Streaming it from your phone

Since you're screen-mirroring/recording the phone directly, just make sure Chrome is in fullscreen-ish mode (address bar scrolls away automatically) and your streaming app is capturing the whole screen. The layout is responsive and works in both portrait and landscape.

## Notes & limitations

- Country matching is name/alias based (e.g. "usa", "america", "united states" all map to the US). It can't be 100% ambiguity-proof (e.g. "Georgia" the country vs. the US state) — this mirrors the limitation of any text-based matching system.
- Subscribe/like handling is a practical approximation due to YouTube API limitations described above — it is **not** verified against real subscriptions or likes by that specific viewer.
- The API key and score history live only in `server/config.json` and `server/data/` on the machine running `node server.js` (both are git-ignored) — no client device ever receives the key, and nothing is sent anywhere except directly to Google's YouTube API from that one server.
- Every device polls the local server every ~1.5s for the latest state — they all share one YouTube API quota instead of each device using its own.
