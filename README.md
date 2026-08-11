# Cloud Unblockedgames Link Bypasser
A powerful, dual-method toolkit designed to automatically bypass the multi-step, ad-monetized link protector chains on cloud.unblockedgames.world (often used by UHDMovies and similar directories).
This repository contains both a **Python script** (ideal for terminal environments like Termux) and a **Userscript** (for desktop and mobile browsers). Both scripts instantly smash through the fake countdown timers, hidden form POST requests, and JavaScript cookie traps to extract the final destination URL (usually a Google Drive link) in fractions of a second.
## 🚀 Features
 * **Zero-Second Delays:** Completely ignores the frontend 10-second countdown timers by communicating directly with the backend.
 * **Dynamic Chain Breaking:** Automatically loops through however many fake blog posts the server throws at it.
 * **Cookie Trap Disarmament:** Uses Regex to extract and inject the hidden s_343 cryptographic cookie payloads required to access the final step.
 * **Smart Redirect Parsing:** Parses the final response for invisible HTML <meta> refresh tags and JavaScript window.location.href redirects when standard HTTP 302 redirects aren't used.
 * **Background Fetching (Userscript):** Intercepts the page load instantly and processes the entire chain in the background using the fetch API, preventing heavy ads and trackers from ever rendering.
## 📂 The Toolkit
### 1. Python CLI (bypass.py)
Perfect for headless execution or mobile terminal setups like Termux. It utilizes a continuous requests.Session() to maintain cookies naturally and BeautifulSoup4 to parse the DOM.
**Prerequisites:**
```bash
pip install requests beautifulsoup4

```
**Usage:**
```bash
python bypass.py

```
*The script will prompt you to paste the starting URL (e.g., [https://cloud.unblockedgames.world/?sid=](https://cloud.unblockedgames.world/?sid=)...).*
### 2. Browser Userscript (bypass.user.js)
The ultimate seamless experience. When installed, clicking a protected link will instantly halt the ad-heavy page from loading, spawn a clean terminal-style UI in your browser, and teleport you to the final link within 1-2 seconds.
**Installation:**
 1. Install a userscript manager extension like **Tampermonkey** or **Violentmonkey**.
 2. Create a new script and paste the contents of bypass.user.js.
 3. Save and enable the script. It will automatically trigger whenever you visit a cloud.unblockedgames.world link.
## 🧠 How It Works (The Technical Breakdown)
Link shorteners use a specific architecture to stall users and force ad impressions:
 1. **Hidden Forms:** The initial page hides a cryptographic token (like _wp_http2) inside a form that only appears after a JavaScript timer. The scripts scrape this token and submit the POST request instantly.
 2. **The Redirect Loop:** The server returns 1 to 3 more pages with the exact same trap. The scripts dynamically loop through these until the forms stop appearing.
 3. **The JavaScript Trap:** The final page omits the href on the download button. Instead, it runs an obfuscated JS function (s_343()) that sets a highly specific session cookie and injects the ?go= link. Both scripts intercept this logic, extract the cookie data via Regex, manually set the cookie, and hit the endpoint.
 4. **The Final Hop:** The ?go= endpoint responds with a tiny HTML page containing a JavaScript or Meta redirect to the actual file. The scripts parse this final code to output the pure URL.
## ⚠️ Disclaimer
This project is for educational purposes only. It demonstrates web scraping, session management, and DOM manipulation techniques. Use responsibly.
