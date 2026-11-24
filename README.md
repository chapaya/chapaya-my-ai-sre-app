# Shift Start

A morning checklist and quick-links page for SRE on-call shifts.

- A checklist that resets every day, styled like a pilot's pre-flight list
- Add extra checks for today only
- Quick links to your monitoring, security, cloud and CI/CD tools
- Handover notes shared with the whole team (sign in with email and password)
- Light and dark mode follow your system setting

Checklist ticks are saved in your own browser (localStorage).
Handover notes are stored in [Supabase](https://supabase.com), so everyone on
the team sees the same notes. Only people you add can sign in and read them.

## Tech

| Part      | Technology                         |
|-----------|------------------------------------|
| Framework | Next.js (App Router) + TypeScript  |
| Styling   | Tailwind CSS v4                    |
| Hosting   | Vercel (or any Node.js host)       |
| Android   | Capacitor (wraps the page in an APK) |
| Notes and login | Supabase (database + email/password auth) |

## Run it locally

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Make it yours

Edit **`src/config.ts`**:

- `CHECKS`: your daily checks. `response` is the word shown when it's ticked.
- `LINK_GROUPS`: your tools. Links with an empty `url` show a reminder to fill them in.

## Project layout

```
src/
  config.ts                 your checks and links
  app/
    layout.tsx              page shell, font, title
    page.tsx                puts the page together (Server Component)
    globals.css             Tailwind setup and color tokens (light + dark)
  components/
    ShiftStart.tsx          checklist state; the headline and list share it
    Masthead.tsx            date, headline, progress bar
    Checklist.tsx           the checklist and the "add a check" form
    QuickLinks.tsx          link groups (Server Component, no JavaScript sent)
    HandoverNotes.tsx       shared notes: load, save as you type, live updates
    SignInForm.tsx          email + password sign-in
  lib/
    browser-store.ts        saving to localStorage without hydration errors
    supabase.ts             the Supabase connection
    use-session.ts          who is signed in
    notes-sync.ts           rules for saving and live updates (tested in notes-sync.test.ts)
supabase/handover_notes.sql the notes table and its access rules (run once in Supabase)
classic/                    the original plain HTML/CSS/JS version, for comparison
prepare-upload.sh           builds the to_upload/ folder (see "Copy to GitHub")
shift-start.apk             the built Android app (made by npm run build:android)

Kept on your machine only (not copied to GitHub):
android/                    the Android app project (made by Capacitor)
assets/icon.svg             the app icon; source for all Android icon sizes
scripts/android-icons.mjs   renders assets/icon.svg into Android icons and splash
capacitor.config.ts         Android app name and ID
```

## Copy to GitHub

### The easy way: `prepare-upload.sh`

```bash
./prepare-upload.sh
```

This creates a fresh `to_upload/` folder holding only the files your
repository needs: the website code, the Supabase SQL and the built Android app
(`shift-start.apk`). The Android source code stays on your machine. Copy the
folder's contents (including the hidden `.gitignore`) into your repository.
The tables below show what it includes and leaves out.

Run `npm run build:android` before `./prepare-upload.sh` so the APK is up to
date; the script warns you if the APK is older than your code.

### What to copy

Copy these into your repository:

| Copy                  | What it is                                  |
|-----------------------|---------------------------------------------|
| `src/`                | all the app code                            |
| `classic/`            | the plain HTML version (optional)           |
| `package.json`        | dependencies and scripts                    |
| `package-lock.json`   | exact dependency versions, so builds match  |
| `next.config.ts`      | Next.js settings                            |
| `tsconfig.json`       | TypeScript settings                         |
| `eslint.config.mjs`   | lint rules                                  |
| `vercel.json`         | tells Vercel this is a Next.js app          |
| `.gitignore`          | tells git what to leave out (hidden file)   |
| `README.md`           | this file                                   |
| `AGENTS.md`           | notes for AI coding assistants (optional)   |
| `shift-start.apk`     | the Android app, ready to install (run `npm run build:android` first) |
| `supabase/`           | the database setup SQL                      |
| `vitest.config.ts`    | test settings (`npm test`)                  |

Don't copy these. They are generated, and `.gitignore` already leaves them out:

| Don't copy            | Why                                                    |
|-----------------------|--------------------------------------------------------|
| `node_modules/`       | installed packages; `npm install` recreates it         |
| `.next/`              | build output; recreated on every build                 |
| `next-env.d.ts`       | generated by Next.js                                   |
| `tsconfig.tsbuildinfo`| TypeScript cache                                       |
| `.git/`               | this folder's own git history; it would clash with your repo's |
| `out/`                | static copy of the site, made by `npm run build:android` |
| `android/`, `capacitor.config.ts`, `assets/`, `scripts/` | the Android project and icon source; kept on your machine, GitHub only gets the APK |
| `to_upload/`          | made by `prepare-upload.sh`                            |
| `.env.local`          | your Supabase settings; set them in Vercel instead     |

### Copy with one command

After running `./prepare-upload.sh`, copy the folder into your repository
(change the destination path to yours):

```bash
rsync -av to_upload/ ~/path/to/your-repo/
```

### Commit and push

```bash
cd ~/path/to/your-repo
npm install          # check it installs
npm run build        # check it builds
git add .
git commit -m "Add Shift Start page"
git push
```

Before committing, run `git status` and make sure `node_modules/` and
`.next/` are not listed. If they are, `.gitignore` wasn't copied.

## Deploy to Vercel

### First deploy

1. Sign in at [vercel.com](https://vercel.com) with your GitHub account.
2. Click **Add New → Project**.
3. Find your repository in the list and click **Import**.
   If it isn't listed, click **Adjust GitHub App Permissions** and give
   Vercel access to that repository.
4. Check the settings Vercel detected:
   - **Framework Preset:** Next.js (`vercel.json` sets this too, so a wrong
     guess here won't break the deploy)
   - **Root Directory:** `./` (or the subfolder, if the app isn't at the repo root)
   - **Build Command**, **Output Directory**, **Install Command:** leave as default
   - **Environment Variables:** add `NEXT_PUBLIC_SUPABASE_URL` and
     `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (see "Supabase setup", step 4)
5. Click **Deploy**. After a minute or two you get a URL like
   `https://your-project.vercel.app`.

### After that

- Every push to `main` deploys to your live URL automatically.
- Every push to another branch, or a pull request, gets its own preview URL,
  so you can check a change before merging it.
- To use your own domain: **Project → Settings → Domains**.

### If the build fails

- **"Failed to fetch Atkinson Hyperlegible Next from Google Fonts"**: the build
  couldn't reach Google Fonts. This doesn't happen on Vercel, but can on a
  locked-down work network. Build on another network, or switch to a
  self-hosted font with `next/font/local`.
- **"No Output Directory named "public" found after the Build completed"**:
  the build itself worked, but Vercel treated the project as a plain static
  site instead of Next.js. This repo's `vercel.json` prevents that:

  ```json
  {
    "$schema": "https://openapi.vercel.sh/vercel.json",
    "framework": "nextjs"
  }
  ```

  Make sure `vercel.json` was copied to the repository root and pushed. If the
  error still appears, open **Project → Settings → Build and Deployment**, set
  **Framework Preset** to **Next.js**, turn off any override on
  **Output Directory**, and redeploy.
- **"Failed to find font override values for font `Atkinson Hyperlegible Next`"**:
  a warning, not an error. Next.js skips generating a fallback font; the page
  still uses the real font.
- **Anything else**: run `npm run build` on your machine first. If it fails
  there, it will fail on Vercel too, and the error message is the same.

### Deploy from the terminal (optional)

```bash
npm i -g vercel
vercel          # preview deploy; the first run links the project
vercel --prod   # deploy to the live URL
```

### Good to know

Checklist ticks are saved in each visitor's own browser, so everyone gets
their own checklist. Handover notes are shared: every signed-in teammate sees
the same notes, on the website and in the Android app.

## Supabase setup

The handover notes live in Supabase. Do this once.

### 1. Create the notes table

In the Supabase dashboard open **SQL Editor**, paste the contents of
`supabase/handover_notes.sql`, and click **Run**. It creates one shared note
and the rules: signed-in users can read and edit it; nobody else can see it.
It's safe to run again.

### 2. Turn off public sign-up

**Authentication → Sign In / Providers**: turn off
**Allow new users to sign up**. Otherwise anyone who finds the page could
create an account and read the notes.

### 3. Add your teammates

**Authentication → Users → Add user → Create new user**: enter their email
and a password, and tick **Auto Confirm User**. Send them the password; to
change it later, use the same screen (there is no "forgot password" email).

### 4. Connect the app

Find the values under **Project Settings → API**: the **Project URL** and the
**publishable key** (`sb_publishable_…`, or the older "anon" key). They are
safe to put in the app; the table rules are what keep the notes private.

On your machine, create `.env.local` in the project folder:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

On Vercel: **Project → Settings → Environments → Production → Environment
Variables**, add the same two (tick **Preview** as well if you use preview
links), then redeploy (**Deployments → ⋯ → Redeploy**). Values are baked in at
build time, so changing them always needs a new build.

If you connected Supabase through Vercel's Supabase integration, these
variables are already there (marked with the Supabase icon). Click the eye
icon on `NEXT_PUBLIC_SUPABASE_URL` and check it's the same project as in your
`.env.local`; otherwise the website and the APK use different databases.

`.env.local` is git-ignored and `prepare-upload.sh` leaves it out, so your
settings don't end up in the repository. The APK build reads it from your
machine.

### How the notes behave

- Notes save about a second after you stop typing.
- When a teammate saves, your page updates live. If you are typing at that
  moment, your text is kept and you'll see who saved; your next save wins.
- Offline, you see the last copy loaded on that device, read-only.

## Android app (APK)

The page is packaged inside the app, so the checklist and links work offline.
Ticks are saved on the phone; handover notes come from Supabase (sign in once
in the app).

The Android project (`android/`, `capacitor.config.ts`, `assets/`, `scripts/`)
lives only on your machine. GitHub gets just the built `shift-start.apk`, so
you can download it from the repository onto a phone.

### One-time setup (macOS)

```bash
brew install openjdk@21
brew install --cask android-commandlinetools
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
yes | sdkmanager --sdk_root=$ANDROID_HOME --licenses
sdkmanager --sdk_root=$ANDROID_HOME "platform-tools" "platforms;android-36" "build-tools;36.0.0"
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
```

Add this line to `~/.zshrc` so every build finds Java, then open a new terminal:

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
```

### Build

```bash
npm run build:android
```

This builds a static copy of the site into `out/`, copies it into the Android
project, and writes **`shift-start.apk`** in the project folder. The first
build takes a few minutes while Gradle downloads.

### Install on your phone

1. Copy `shift-start.apk` to the phone (Google Drive, email, USB) and tap it.
2. Allow installs from that source (Files, Chrome…) when Android asks.
3. If Play Protect warns about an unknown app, tap **Install anyway**.

Installing a newer APK replaces the old one and keeps your ticks and sign-in.

### Change the icon

Edit `assets/icon.svg`, then run `npm run icons:android` before
`npm run build:android`.

### Good to know

- The APK is a debug build: fine to install yourself, but the Play Store needs
  a release build signed with your own key.
- The APK has its own copy of the page. It doesn't update when you push to
  Vercel; rebuild and reinstall it (see "Making changes").

## Making changes

Every change has to be published twice: once for the website (GitHub, then
Vercel) and once for the APK. The APK travels to GitHub with the code.

### 1. Make the change and check it

Edit what you need (checks and links are in `src/config.ts`), then:

```bash
npm test               # notes save/sync rules
npm run dev
```

Open <http://localhost:3000>, check it looks right, then stop the server
with Ctrl+C.

### 2. Build and prepare the upload

```bash
npm run build          # make sure the website builds
npm run build:android  # rebuild shift-start.apk
./prepare-upload.sh    # refresh to_upload/ (code + APK, no Android source)
```

### 3. Copy to GitHub

Copy the contents of `to_upload/` into your repository and push (or use
**Add file → Upload files** on github.com). Vercel deploys the website
automatically.

If you deleted a file from the project, delete it in the repository too.
Copying the folder over adds and replaces files, but never removes any.
If an older upload put `android/`, `assets/`, `scripts/` or
`capacitor.config.ts` in the repository, delete them there.

### 4. Update the phone

Install the new `shift-start.apk` on your phone. It replaces the old version
and keeps your ticks and sign-in.

### Quick reference

| You changed…                 | Run                                                                   |
|------------------------------|-----------------------------------------------------------------------|
| Checks, links, text, styles  | `npm run build:android`, `./prepare-upload.sh`, then copy and push    |
| The icon (`assets/icon.svg`) | `npm run icons:android` first, then the same as above                 |
| Only want to see it locally  | `npm run dev`                                                         |
