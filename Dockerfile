# Stage 1: Build the React frontend
FROM node:20-alpine as frontend-build
WORKDIR /app/frontend

# Install dependencies first for caching
COPY frontend/package*.json ./
RUN npm ci

# Copy the rest of the frontend source and build
COPY frontend/ ./
RUN npm run build

# Stage 2: Build the FastAPI backend and serve everything
FROM python:3.11-slim as backend

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=80

WORKDIR /app

# Install system dependencies (lightweight)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ /app/backend/

# Copy built frontend assets into the container's static folder
# We will mount this folder using FastAPI StaticFiles in main.py
COPY --from=frontend-build /app/frontend/dist /app/static

# Expose port 80 for Azure Container Apps
EXPOSE 80

# Run Uvicorn (FastAPI) on port 80
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "80"]
