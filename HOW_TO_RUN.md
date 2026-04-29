# How to Run

## Start Both (run in one terminal)

```bash
cd "c:\Users\SG126591\Pictures\Demo Goal\new-app" && "c:\Users\SG126591\Pictures\Demo Goal\venv\Scripts\uvicorn" api:app --reload --port 8000 > api.log 2>&1 & cd "c:\Users\SG126591\Pictures\Demo Goal\new-app\react-frontend" && npm run dev > ../frontend.log 2>&1 &
```

- Backend: http://localhost:8000
- Frontend: http://localhost:5173

---

## Stop

```bash
taskkill /F /IM python.exe /IM node.exe 2>nul
```
