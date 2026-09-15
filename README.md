# Tenant Ledger — Rent & Utilities PWA

A Progressive Web App (PWA) for managing tenant ledgers, rental payments, electricity sub-meter calculations, miscellaneous expenses, and annual financial summaries.

## 🚀 Live Public Deployment via GitHub Pages

This repository is pre-configured with **GitHub Actions** (`.github/workflows/deploy.yml`) to automatically build and publish a live public website on GitHub Pages.

### How to Publish to GitHub in 3 Easy Steps:

1. **Push to your GitHub account**:
   - In Google AI Studio, click the **three dots menu (⋮)** or **Settings** icon at the top right and choose **"Push to GitHub"** (or export as ZIP and push with `git`).
   - If using Git command line:
     ```bash
     git init
     git add .
     git commit -m "Initial commit of Tenant Ledger"
     git branch -M main
     git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
     git push -u origin main
     ```

2. **Enable GitHub Pages in your Repository Settings**:
   - Go to your repository on GitHub (`https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>`).
   - Click **Settings** (tab at the top) → **Pages** (in the left sidebar).
   - Under **Build and deployment** > **Source**, select **GitHub Actions**.

3. **Get Your Free Live URL**:
   - GitHub Actions will automatically run the build workflow.
   - Within 1–2 minutes, your live URL will appear at:
     **`https://<YOUR-USERNAME>.github.io/<YOUR-REPO-NAME>/`**
   - Share this URL with any user. Anyone can open it in their browser and install it on their phone!

---

## 📱 Mobile Installation (PWA)

- **Android (Chrome / Edge / Samsung Internet)**:
  - Visit the URL on your phone.
  - Tap **"Install App"** at the top or tap browser menu **⋮ → Install app** (or *Add to Home screen*).
- **iPhone / iPad (Safari)**:
  - Visit the URL in Safari.
  - Tap the **Share** button (box with upward arrow) → **"Add to Home Screen"**.

Once installed, the app functions offline and persists all ledger data locally on the device.

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build
```
