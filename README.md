# Pan de Vida

A modern, fast, and lightweight song presentation and projection desktop application for churches. Built on top of Electron, Vite, React, TypeScript, and Tailwind CSS v4.

## 🚀 Features

* **Live Projection Stage:** Seamless full-screen slide transitions optimized for secondary displays.
* **Smart Chorus Linking:** Automatically detects identical slide repetitions to group choruses instantly.
* **Bilingual Support:** Real-time English translation overlay toggle during live presentations.
* **Local Database:** Powered by a robust native SQLite3 integration to manage songs, categories, and types.
* **Distraction-Free Environment:** Fast startup and native system frame controls.

## 🛠️ Tech Stack

* **Core:** Electron, Node.js (v24)
* **Frontend:** React 19, TypeScript, Vite
* **Styling:** Tailwind CSS v4
* **Database:** SQLite3, JSDom, Mammoth
* **Bundler:** Electron-Vite & Electron-Builder

## 💻 Recommended IDE Setup

* [VS Code](https://code.visualstudio.com/)
* [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
* [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

---

## 📦 Project Setup

### 1. Install Dependencies

Ensure you are using **Node.js 24** before installing. Since the project uses native C++ modules (sqlite3), compiling system binaries is required during this step.

    npm install

### 2. Development

Launch the application in development mode with hot-reloading enabled for the renderer process.

    npm run dev

### 3. Production Build & Packaging

Compile the application assets and package them into production-ready installers via electron-builder. All generated installers will be located in the dist/ directory.

    # Target Windows (.exe)
    npm run build:win

    # Target macOS (.dmg, .zip)
    npm run build:mac

    # Target Linux (.deb)
    npm run build:linux

---

## 🍏 Note for macOS Users (App "Damaged" Fix)

Because this is a custom application built for internal church use, it is distributed without an official Apple Developer paid signature. When downloading the app from the web, macOS Gatekeeper security will flag it as **"damaged and can't be opened"** as a false positive.

To bypass this restriction and run the application normally, please follow these steps:

1. Drag **Pan de Vida** from the `.dmg` into your local **Applications** folder.
2. Open your Mac's **Terminal** app (Press `Cmd + Space` and search for "Terminal").
3. Copy, paste, and run the following command to remove the web quarantine attribute:

    xattr -cr "/Applications/Pan de Vida.app"

4. Close the terminal. You can now launch the app normally with a standard double-click.

---

## 🤖 CI/CD Deployment

This repository includes automated multi-platform builds using **GitHub Actions**. Upon pushing to the main branch, the respective platform workflows compile and export production artifacts for Linux and macOS.
