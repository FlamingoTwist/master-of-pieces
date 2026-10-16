# GEMINI.md - The Master of Pieces

Comprehensive project manual, architecture guide, tech stack reference, credentials, and development workflows for **The Master of Pieces**.

---

## 1. Project Overview

* **Game Title**: The Master of Pieces
* **Genre**: Retro 16-bit Arcade Reseller Simulator & Action-Roguelite
* **Setting**: UK High Streets, Car Boot Sales, and Cardiff Card Show
* **Developer / Publisher**: FlamingoTwist (`neilamos212@gmail.com`)
* **Live Itch.io Game**: [https://flamingotwist.itch.io/the-master-of-pieces](https://flamingotwist.itch.io/the-master-of-pieces)
* **GitHub Repository**: [https://github.com/FlamingoTwist/master-of-pieces](https://github.com/FlamingoTwist/master-of-pieces)
* **Android Package ID**: `com.flamingotwist.masterofpieces`

### Core Gameplay Loop
1. **Scout & Smash**: Explore 3 distinct levels (L1: High Street Charity Shops, L2: Sunday Car Boot Sale, L3: Cardiff Card Show Bullet Hell).
2. **Collect & Flip**: Smash boxes, bins, and crates to haul vintage games, Pokemon cards, trainers, and retro toys into your backpack (Max capacity: 12).
3. **Beware Knock-offs**: Stinky blue IKEA decoy bags spawn bootlegs and defects that trigger heavy cash refunds upon listing!
4. **Influencer Zones**: Film YouTube shorts in glowing broadcast zones for quick subscriber cash bonuses (~£1,000).
5. **PC Listing Stations**: Dash to eBay/Vinted bulk listing desks to bank profit.
6. **Hall of Fame**: Submit 3-letter initials to the global cloud leaderboard powered by Supabase.

---

## 2. Tech Stack & Architecture

| Layer | Technology | Details |
|---|---|---|
| **Game Engine** | Vanilla HTML5 / JavaScript | Self-contained single-file game in `index.html`. No heavy game engines or bundlers required. |
| **Graphics** | HTML5 Canvas 2D | Dynamic procedural 16-bit pixel sprites, shadows, floating damage text, particle systems, and Game Boy Color Grape console bezel. Native resolution: 360x640 portrait. |
| **Audio** | Web Audio API Synthesizer | Procedural chip-tune retro audio generated via oscillators (`sine`, `sawtooth`, `square`), white noise burst generators, and gain envelopes. No external MP3/WAV assets needed. |
| **Mobile Wrapper** | Capacitor 7/8 Android | Wraps `www/index.html` into a native Android APK using Android Studio / Gradle 8.13 and Android SDK 35 (Java 21). |
| **Backend / DB** | Supabase REST API (PostgreSQL) | Cloud leaderboard storage, initial submission, top-10 descending query, and rank calculation. |
| **CI / CD** | GitHub Actions | Automated build pipeline (`.github/workflows/deploy.yml`) for HTML5 zip packaging and native Android APK assembly. |
| **Distribution** | Itch.io Butler CLI | Instant differential deployment to Itch channels (`html5` and `android`). |

---

## 3. Configuration & Credentials

> [!CAUTION]
> **API Key Safety**: Never commit the Supabase **Secret Key** (`sb_secret_...`) to `index.html` or any client-facing file. Only use the **Publishable / Anon Key** (`sb_publishable_...`) on client devices.

### A. Supabase Cloud (Online Leaderboard)
* **Project URL**: `https://sklanvjgzfrhndlazhcb.supabase.co`
* **Publishable / Anon Key** *(Used in client code)*:
  ```
  sb_publishable_3lAGqD5TwO64zI0OyVSA9Q_kNzoQerE
  ```
* **Secret / Service Role Key** *(Admin / server dashboard only - DO NOT COMMIT)*:
  * Managed securely in Supabase Dashboard -> Project Settings -> API.
  * *Note: Never commit secret service keys to Git repositories.*
* **Leaderboard Table Schema**:
  ```sql
  create table public.scores (
    id uuid default gen_random_uuid() primary key,
    initials text not null check (char_length(initials) = 3),
    score integer not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
  );

  alter table public.scores enable row level security;

  create policy "Allow anonymous read"
    on public.scores for select
    to anon
    using (true);

  create policy "Allow anonymous insert"
    on public.scores for insert
    to anon
    with check (true);
  ```

### B. Itch.io & Butler CLI
* **Game Page**: `https://flamingotwist.itch.io/the-master-of-pieces`
* **Channels**:
  * `FlamingoTwist/the-master-of-pieces:html5` (Web version)
  * `FlamingoTwist/the-master-of-pieces:android` (Android APK)
* **Local Butler Executable**: `$env:LOCALAPPDATA\Programs\butler\butler.exe`
* **Local Butler API Key**: `tNSvzykazjmUhT46XeDgFnUVDQDNB1hbtOBtc8Un`
* **GitHub Actions Secrets**: Configured under repo secret `ITCH_API_KEY` (or `BUTLER_API_KEY`).

---

## 4. Project Structure & Key Files

```
Master Of Pieces/
├── index.html                   # PRIMARY GAME FILE (Canvas engine, graphics, audio, logic, UI)
├── The Master Of Pieces.zip     # Packaged zip for Itch.io HTML5 channel (contains root index.html)
├── GEMINI.md                    # This developer & agent handbook
├── capacitor.config.json        # Capacitor native app configuration
├── package.json                 # Node dependencies (@capacitor/cli, @capacitor/android, etc.)
├── .gitignore                   # Ignores build artifacts, node_modules, and temp files
├── .github/
│   └── workflows/
│       └── deploy.yml           # CI/CD: Builds HTML5 zip + Android APK & pushes to Itch.io
├── www/
│   └── index.html               # Synced copy of index.html for Capacitor Android bundling
└── android/                     # Native Android project directory (Gradle, Java, Manifest, Resources)
    └── app/
        ├── build.gradle         # Android app build configuration
        └── src/main/res/values/
            └── strings.xml      # App label: "The Master Of Pieces"
```

---

## 5. Development Workflow & Standard Operating Procedures

Whenever making changes to the game, always follow this battle-tested procedure:

### Step 1: Edit `index.html`
* Keep all code self-contained inside `index.html`.
* Ensure touch buttons and keyboard shortcuts are synchronized.
* Validate JavaScript syntax using Node:
  ```powershell
  node -e "const fs = require('fs'); const html = fs.readFileSync('index.html', 'utf8'); const script = html.match(/<script>([\s\S]*?)<\/script>/)[1]; new Function(script); console.log('Syntax OK!');"
  ```

### Step 2: Synchronize `www/` and Package ZIP
The root `index.html` must be copied to `www/index.html` for Android, and compressed to `The Master Of Pieces.zip` with `index.html` located at the root of the archive:
```powershell
Copy-Item -Path "index.html" -Destination "www\index.html" -Force
Compress-Archive -Path "index.html" -DestinationPath "The Master Of Pieces.zip" -Force
```

### Step 3: Deploy to Itch.io HTML5 (Immediate)
Push directly to Itch.io using the Butler CLI:
```powershell
$env:BUTLER_API_KEY = "tNSvzykazjmUhT46XeDgFnUVDQDNB1hbtOBtc8Un"
& "$env:LOCALAPPDATA\Programs\butler\butler.exe" push "The Master Of Pieces.zip" FlamingoTwist/the-master-of-pieces:html5
```

### Step 4: Commit & Push to GitHub (Automated Android Build)
Pushing to `main` triggers GitHub Actions to build the Android APK, rename it to `The Master Of Pieces.apk`, publish the artifact, and push it to Itch's `:android` channel:
```powershell
git commit -am "Description of change"
git push origin main
```

To monitor the GitHub Actions build progress from the terminal:
```powershell
gh run list --limit 3
gh run watch <run-id>
```

---

## 6. Controls & Game Reference

* **Player Movement**:
  * PC: `WASD` / Arrow Keys
  * Mobile: Touch on-screen virtual joystick
* **Smash Weapon**:
  * PC: `Z` or `J`
  * Mobile: Large green smash button
* **Throw Card (-£1)**:
  * PC: `X` or `K`
  * Mobile: Blue card throw button
* **Raid Shop / Enter Desk**:
  * PC: `C` or `Space`
  * Mobile: Yellow action button
* **Leaderboard Screen**:
  * Main Menu: Tap `🏆 VIEW LEADERBOARD` or press `L` / `Tab`
  * Initials Entry: Cycle letters with Arrow Keys, `A-Z`, confirm with `Enter` / `Space`, or skip with `Esc`
  * Return to Title: `Esc`, `Backspace`, `L`, or tap `← BACK TO TITLE`
