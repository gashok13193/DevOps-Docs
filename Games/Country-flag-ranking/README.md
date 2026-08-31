# Country Flag Ranking — Live YouTube Board

A mobile-friendly, no-build web app that turns your YouTube live chat into a "comment your country" leaderboard, just like the reference screenshots (`horizontal.png` / `Vertical.png`).

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

## 3. Run the app on your phone

No build step or server code is required — it's plain HTML/CSS/JS.

**Option A — Open directly:**
Copy this whole folder to your phone (or sync via cloud storage) and open `index.html` in Chrome.

**Option B — Serve it locally (more reliable on Android Chrome):**
On your PC, from this folder run a simple static server, e.g.:
```powershell
npx serve .
```
Then on your phone (same Wi-Fi network), open `http://<your-pc-ip>:3000` in Chrome.

## 4. Using the app

1. On the setup screen, enter your **API key**, the **live video URL/ID**, optional subscribe keywords, and a starting point value per country (defaults to 1000, matching the reference screenshots).
2. Tap **Start Live Board**. It connects to your live chat and starts scoring in real time.
3. Tap **⚙️** anytime to go back to setup (your scores are saved automatically and reload if you restart with the same video ID).
4. Use **Try Demo Mode** to preview the board with simulated activity, without an API key or a live stream.

## 5. Streaming it from your phone

Since you're screen-mirroring/recording the phone directly, just make sure Chrome is in fullscreen-ish mode (address bar scrolls away automatically) and your streaming app is capturing the whole screen. The layout is responsive and works in both portrait and landscape.

## Notes & limitations

- Country matching is name/alias based (e.g. "usa", "america", "united states" all map to the US). It can't be 100% ambiguity-proof (e.g. "Georgia" the country vs. the US state) — this mirrors the limitation of any text-based matching system.
- Subscribe/like handling is a practical approximation due to YouTube API limitations described above — it is **not** verified against real subscriptions or likes by that specific viewer.
- All data (scores, API key, settings) is stored only in your phone's browser (`localStorage`) — nothing is sent anywhere except directly to Google's YouTube API.
