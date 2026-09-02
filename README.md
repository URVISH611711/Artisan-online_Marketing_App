# Artisan-AI

Artisan-AI is a full-stack platform empowering artisans with AI-driven product cataloging, pricing insights, and marketplace management. 

Our **AI Product Studio** leverages a powerful **Hybrid Architecture** combining optimized local open-source models (Stable Diffusion, RMBG-1.4) for completely private, offline image generation and background removal, alongside specialized Cloud APIs (NVIDIA NIM, Sarvam AI) for lightning-fast product analysis and Indic language voice transcription.

---

## 🏗️ Project Structure
- `/mobile` - React Native (Expo) frontend for both Artisans and Buyers.
- `/backend` - FastAPI + PostgreSQL backend hosting the **Local AI Pipeline**.

---

## 🛠️ Prerequisites
Before starting, ensure you have the following installed on your machine:
- **Python 3.10+** (Tested on 3.12)
- **Node.js 18+** & **npm**
- **Git**
- A **PostgreSQL** database (or a Supabase connection string)

---

## 🚀 Setup & Installation Guide (For New Machines)

To run the entire application, you will need to set up both the backend and mobile environments. 

### 1. Backend Setup (FastAPI & Local AI)
Open a terminal and run the following commands to install the backend dependencies.

```powershell
# 1. Clone the repository and navigate to the backend folder
git clone https://github.com/URVISH611711/Artisan-online_Marketing_App.git
cd Artisan-online_Marketing_App/backend

# 2. Create a virtual environment (Windows)
python -m venv venv
.\venv\Scripts\activate
# (On Mac/Linux: python3 -m venv venv && source venv/bin/activate)

# 3. Install all dependencies (Includes PyTorch, Diffusers, and Transformers)
pip install -r requirements.txt

# 4. Set up your environment variables
# Copy .env.example to .env and fill in your DATABASE_URL (Supabase or Local Postgres)
cp .env.example .env

# 5. (Optional) Seed the database with mock users and products
python seed.py
```

### 2. Mobile App Setup (React Native / Expo)
Open a **second terminal window** and run the following:

```powershell
# 1. Navigate to the mobile folder
cd Artisan-online_Marketing_App/mobile

# 2. Install dependencies
npm install
```

---

## 🌐 Multi-Device Architecture (LocalTunnel)

```
Multiple Physical Phones (iOS / Android / APK)
              ↓
     Artisan AI Expo App
              ↓
   LocalTunnel HTTPS Tunnel
              ↓
  FastAPI Backend (0.0.0.0:8000)
              ↓
   Supabase PostgreSQL DB & AI Models
```

---

## 🏃‍♂️ How to Run the App

For multi-device access across physical phones and emulators, use 3 terminal windows:

### Terminal 1: Start FastAPI Backend
```powershell
cd u:\a1\Artisan\backend
venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
*The API runs at `http://0.0.0.0:8000`. Docs are at `http://localhost:8000/docs` and `/health`.*

### Terminal 2: Expose via LocalTunnel
```powershell
cd u:\a1\Artisan
npx localtunnel --port 8000
```
*Copy the generated HTTPS URL (e.g. `https://fancy-cat-42.loca.lt`).*

### Terminal 3: Start Mobile App
Add your LocalTunnel URL to `mobile/.env`:
```env
EXPO_PUBLIC_API_URL=https://fancy-cat-42.loca.lt
```
Then launch Expo:
```powershell
cd u:\a1\Artisan\mobile
npx expo start -c
```
*Multiple physical phones running Expo Go or compiled Android APK can now access the app simultaneously via the single LocalTunnel URL.*

---

## 🧠 Hybrid AI Architecture (Local + Cloud)
Artisan-AI employs a hybrid AI strategy to balance performance, cost, and device constraints:

### 1. Local AI Models (Runs on your machine)
- **briaai/RMBG-1.4**: For highly accurate background removal.
- **runwayml/stable-diffusion-inpainting**: Local image generation for professional studio backgrounds, optimized for 4GB VRAM.
- **faster-whisper (Tiny)**: Local offline fallback for voice-to-text transcription.

*IMPORTANT: The very first time you use the local AI features, Python will automatically download these models from HuggingFace to your local cache (`~/.cache/huggingface`). This is a one-time download of roughly ~5 GB.*

### 2. Cloud AI Services
- **NVIDIA NIM API**: Uses optimized LLaMA 3.2 Vision (`meta/llama-3.2-11b-vision-instruct`) and Kimi-K3 (`moonshotai/kimi-k3`) for lightning-fast product analysis and auto-cataloging from images.
- **Sarvam AI**: Specialized API for translating and transcribing Indian languages directly from artisan voice notes.

*Ensure you have configured `NVIDIA_API_KEY` and `SARVAM_API` in your `.env` for the cloud services to function.*
