# Running the New React + FastAPI App

## Start Backend (FastAPI)
```
cd "c:\Users\SG126591\Pictures\Demo Goal\new-app"
& "c:\Users\SG126591\Pictures\Demo Goal\venv\Scripts\uvicorn" api:app --reload --port 8000```

## Start Frontend (React/Vite)
```
cd "c:\Users\SG126591\Pictures\Demo Goal\new-app\react-frontend"
npm run dev
```

Then open: http://localhost:5173

---

## Stop the App (PowerShell)
```powershell
powershell -Command "Get-Process -Name node,python,python3 -ErrorAction SilentlyContinue | Stop-Process -Force"
```
> **Note:** Use PowerShell to stop — `taskkill` from git bash fails silently.

---

## Notes
- The venv is located at `c:\Users\SG126591\Pictures\Demo Goal\venv`
- Backend runs on http://localhost:8000
- Frontend runs on http://localhost:5173

---

## Running the OLD Streamlit App (unchanged)
```
cd "c:\Users\SG126591\Pictures\Demo Goal"
venv\Scripts\streamlit run frontend.py
```
