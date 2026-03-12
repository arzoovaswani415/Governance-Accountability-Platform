# 🤝 FairFlow Contributor Setup Guide

Welcome to the FairFlow Governance Accountability Platform! This guide will walk you through setting up the project on your local machine after cloning the repository.

## 🏁 Prerequisites Ensure you have the following installed on your machine:
- **Python 3.10+** (For the backend)
- **Node.js 18+** & **npm** (For the frontend)
- **Git**

---

## Step 1: Clone the Repository
Open your terminal and clone the project:
```bash
git clone <repository-url>
cd Governance-Accountability-Platform
```

## Step 2: Set Up the Python Backend

The backend uses FastAPI and connects directly to a remote Supabase Postgres database.

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   # On Mac/Linux:
   python3 -m venv venv
   source venv/bin/activate
   
   # On Windows:
   python -m venv venv
   venv\Scripts\activate
   ```
3. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   *(Note: This might take a minute as it installs libraries like `scikit-learn`, `fastapi`, and `sqlalchemy`)*

4. **Add Secret Keys (.env file):**
   Create a new file named `.env` inside the `backend` folder. **Ask the project owner (your friend) for the secret credentials** and paste them exactly like this:
   ```env
   DATABASE_URL="postgresql://<username>:<password>@<supabase-host>:5432/postgres"
   GEMINI_API_KEY="your_api_key_here"
   CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
   ```
   *Do not commit this file to GitHub!*

5. Go back to the root folder:
   ```bash
   cd ..
   ```

---

## Step 3: Set Up the React Frontend

The frontend uses Next.js and TailwindCSS.

1. Navigate to the frontend folder:
   ```bash
   cd Frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Go back to the root folder:
   ```bash
   cd ..
   ```

---

## Step 4: Run the Platform! 🚀

We have created an automated startup script that launches both the backend and frontend simultaneously. 

From the root project folder (`Governance-Accountability-Platform`), simply run:

```bash
# Make the script executable (only needed once)
chmod +x start_fairflow.sh

# Run the app
./start_fairflow.sh
```

**What happens now?**
- The **Python Backend** starts running on `http://localhost:8000`
- The **Next.js Frontend** starts running on `http://localhost:3000`
- The script will also provide a live **Ngrok** URL if you need to share your active development session over the internet.

You can now open your browser and go to `http://localhost:3000` to start developing!

To stop the servers when you are done coding, press `Ctrl + C` in the terminal where the script is running.
