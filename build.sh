#!/bin/bash

# Simple build script với manifest
# Sử dụng: ./build.sh [version]

set -e

VERSION=${1:-latest}
IMAGE_NAME="ismethanhtung/ngocminh-medical-backend"

echo "🚀 Building Ngọc Minh Medical Backend"
echo "Image: ${IMAGE_NAME}:${VERSION}"

# Build và push multi-architecture image với manifest
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --tag ${IMAGE_NAME}:${VERSION} \
    --tag ${IMAGE_NAME}:latest \
    --push \
    .

echo "✅ Build completed successfully!"
echo "📤 Image pushed to Docker Hub: ${IMAGE_NAME}:${VERSION}"
