from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import upload, validate, clean, split, download, analytics
#from routes import upload, validate, clean, split, download, analytics
import uvicorn
import os

app = FastAPI(
    title="Global Transaction Validator AI",
    description="Enterprise-grade dataset cleaning and validation engine",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify front-end origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Include Routers
app.include_router(upload.router, tags=["Upload"])
app.include_router(validate.router, tags=["Validation"])
app.include_router(clean.router, tags=["Cleaning"])
app.include_router(split.router, tags=["Chunking"])
app.include_router(download.router, tags=["Downloads"])
app.include_router(analytics.router, tags=["Analytics"])

@app.get("/")
async def root():
    return {
        "status": "healthy",
        "app": "Global Transaction Validator AI API",
        "supported_formats": ["CSV", "XLSX", "XLS"],
        "max_upload_size": "50MB"
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
