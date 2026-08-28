# Artisan-AI

Artisan-AI is a full-stack platform empowering artisans with AI-driven product cataloging, pricing insights, and marketplace management.

## 🏗️ Project Structure
- `/mobile` - React Native (Expo) frontend for both Artisans and Buyers.
- `/backend` - FastAPI + PostgreSQL backend powered by Google Gemini AI.

---

## 🚀 How to Run the App

To run the entire application, you will need **two separate terminal windows**—one for the Backend and one for the Mobile App.

### 1. Start the Backend (FastAPI)
Open your first terminal and run the following commands to start the backend server:

```powershell
# 1. Navigate to the backend folder
cd u:\a1\Artisan\backend

# 2. Activate the virtual environment
.\venv\Scripts\activate

# 3. Start the FastAPI server
uvicorn app.main:app --reload
```
*The backend will now be running at `http://localhost:8000`. You can view the interactive API documentation at `http://localhost:8000/docs`.*

---

### 2. Start the Mobile App (React Native / Expo)
Open a **second terminal window** (do not close the backend terminal) and run:

```powershell
# 1. Navigate to the mobile folder
cd u:\a1\Artisan\mobile

# 2. Start the Expo development server
npx expo start
```
*This will open the Expo Metro Bundler in your terminal. You can press `a` to open the app on an Android Emulator, `i` for an iOS simulator, or scan the QR code with the Expo Go app on your physical phone.*

---

## 🛠️ Database Setup (Already Completed)
If you ever need to reset your database to its original state with the mock users and products:
```powershell
cd u:\a1\Artisan\backend
.\venv\Scripts\activate
python seed.py
```
