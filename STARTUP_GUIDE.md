# 🚀 FairFlow Startup & Sharing Guide

Since you want to share this project with your friend over the internet, we have fully automated the `ngrok` process! You do not need to hunt for the URL anymore, nor do you need to open multiple terminals.

## 🎯 How to Start the App (One-Click)
Open a terminal in the root project folder and run this single command:

```bash
cd /home/mahesh/Desktop/Augenblick/Governance-Accountability-Platform
./start_fairflow.sh
```

**What this automatically does:**
1. Kills any background ghost processes from previous runs.
2. Starts the Python Backend on port 8000.
3. Starts the React Frontend on port 3000.
4. Starts an Ngrok secure tunnel connected to port 3000.
5. Grabs the fresh URL and prints it on your screen!

You will see output that looks like this:
```
🟢 Backend Running (Local: http://localhost:8000)
🟢 Frontend Running (Local: http://localhost:3000)
🟢 Ngrok Tunnel Active!

🚀 ============================================= 🚀
    SHARE THIS URL WITH YOUR FRIEND FOR ACCESS:    
    👉 https://random-words.ngrok-free.app         
🚀 ============================================= 🚀
```

## 🌐 How does it work "Permanently"?
Normally, if the ngrok URL changes, you would have to manually update `api.ts` in the frontend code. 
**We eliminated that problem forever by using Next.js Proxying.**

Now, when your friend visits `https://random-words.ngrok.app`, their browser sends API requests relatively (e.g., `/api/promises`). The Next.js frontend catches these and automatically reroutes them secretly to your laptop's `127.0.0.1:8000` backend connection. 

This means **you never have to copy-paste an ngrok URL into the code again.** Just run `./start_fairflow.sh`, copy the link to your friend, and start coding!

---
## 🛑 How to Stop the Servers
When you and your friend are done working for the day, simply go to the terminal running the script and press:
`Ctrl + C`

This will cleanly shut down the backend, frontend, and ngrok tunnel all at once!
