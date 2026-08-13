# Stage 1: Build the React frontend
FROM node:20-alpine as frontend-build
WORKDIR /app/frontend

# Install dependencies first for caching
COPY frontend/package*.json ./
RUN npm ci

# Copy the rest of the frontend source and build
COPY frontend/ ./

ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID

ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID

ENV CI=true
ENV NO_COLOR=1
RUN npm run build > build.log 2>&1 ; exit_code=$? ; cat build.log | tr -cd '\11\12\15\40-\176' ; exit $exit_code

# Stage 2: Build the FastAPI backend and serve everything
FROM python:3.11-slim as backend

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=80
ENV PIP_PROGRESS_BAR=off
ENV PIP_NO_COLOR=1

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

# Copy sample files for the dashboard
COPY docs/sample_files/ /app/docs/sample_files/

# Copy built frontend assets into the container's static folder
# We will mount this folder using FastAPI StaticFiles in main.py
COPY --from=frontend-build /app/frontend/dist /app/static

# Expose port 80 for Azure Container Apps
EXPOSE 80

# Run Uvicorn (FastAPI) on port 80
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "80"]
