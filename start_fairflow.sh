#!/bin/bash

# ==========================================
# 🚀 FairFlow Instant Startup (Local + Ngrok)
# ==========================================

# 1. Kill any existing instances first
echo "🧹 Cleaning up old processes..."
pkill -f 'uvicorn app.main:app' || true
pkill -f 'next-server' || true
pkill -f 'ngrok http' || true
sleep 1

# 2. Start the Backend (FastAPI / 8000)
echo "🔥 Starting Backend..."
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# 3. Start the Frontend (Next.js / 3000)
echo "💻 Starting Frontend..."
cd Frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# 4. Start ngrok tunnel for Frontend (Port 3000)
echo "🌐 Launching ngrok tunnel (Port 3000)..."
ngrok http 3000 > /dev/null 2>&1 &
NGROK_PID=$!

echo ""
echo "=================================================="
echo "    App is starting! Waiting 8 seconds..."
echo "=================================================="
sleep 8

# 5. Extract fresh ngrok URL automatically
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[a-zA-Z0-9.-]*\.ngrok-free\.app' | head -n 1)
# Catch fallback domain format if old ngrok version
if [ -z "$NGROK_URL" ]; then
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[a-zA-Z0-9.-]*\.ngrok-free\.dev' | head -n 1)
fi
if [ -z "$NGROK_URL" ]; then
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[a-zA-Z0-9.-]*\.ngrok\.io' | head -n 1)
fi

echo ""
echo "🟢 Backend Running (Local: http://localhost:8000)"
echo "🟢 Frontend Running (Local: http://localhost:3000)"
echo "🟢 Ngrok Tunnel Active!"
echo ""
echo "🚀 ============================================= 🚀"
echo "    SHARE THIS URL WITH YOUR FRIEND FOR ACCESS:    "
echo "    👉 $NGROK_URL                                  "
echo "🚀 ============================================= 🚀"
echo ""
echo "Press Ctrl+C to shut everything down cleanly."

# Trap Ctrl+C (SIGINT) and kill all background processes gracefully
trap "echo -e '\n🛑 Shutting down server...'; kill $BACKEND_PID $FRONTEND_PID $NGROK_PID; exit" INT

# Wait indefinitely for background processes 
wait
