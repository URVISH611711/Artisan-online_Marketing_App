# Artisan-AI

Artisan-AI is a full-stack platform empowering artisans with AI-driven product cataloging, pricing insights, and marketplace management. 

Our **AI Product Studio** runs **100% locally** on your machine—no cloud APIs, no API keys, and no subscriptions required. We leverage optimized local open-source models (Stable Diffusion, RMBG-1.4, Qwen, and faster-whisper) that are aggressive on VRAM and maintain complete data privacy.

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

## 🏃‍♂️ How to Run the App

Whenever you want to start the app, you will need **two separate terminal windows**.

### 1. Start the Backend Server
```powershell
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0
```
*The backend will run at `http://localhost:8000`. You can view the API documentation at `http://localhost:8000/docs`.*

### 2. Start the Mobile App
Open a new terminal window:
```powershell
cd mobile
npx expo start -c
```
*Press `a` to open on an Android Emulator, `i` for an iOS simulator, or scan the QR code using the Expo Go app on your physical phone.*

---

## 🧠 Note on the Local AI Studio
The AI Product Studio uses the following local models:
- **briaai/RMBG-1.4**: For highly accurate background removal.
- **Qwen2.5-0.5B-Instruct**: Local LLM for analyzing product details and generating Stable Diffusion prompts.
- **runwayml/stable-diffusion-inpainting**: Local image generation for professional studio backgrounds, optimized for 4GB VRAM.
- **faster-whisper (Tiny)**: Local voice-to-text transcription.

**IMPORTANT:** The very first time you use the AI features (Image Enhancement or Voice Transcription), Python will automatically download these models from HuggingFace to your local cache (`~/.cache/huggingface`). This is a one-time download of roughly ~5 GB. All subsequent runs will be entirely instant and offline.
