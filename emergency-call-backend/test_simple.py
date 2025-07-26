from fastapi import FastAPI
from datetime import datetime

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Simple backend is working!"}

@app.get("/test-backend")
def test_backend():
    return {"status": "Backend is working!", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)