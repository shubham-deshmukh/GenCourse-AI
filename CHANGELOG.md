# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v2.1.0-save-progress] - 2026-07-04

### Added
- **Lesson Completion & Progress Saving**: Implemented persistent tracking for course completion. Users can now mark individual lessons as completed or incomplete, and progress is saved directly to MongoDB.
- **Progress Synchronization**: Backend automatically calculates progress percentages and total lessons per course, exposing them directly to the Course Library and Student Portal.

### Fixed
- **Lesson Content Map Serialization**: Resolved a bug where multi-language lesson translations in Mongoose Maps serialized as empty objects `{}` on course-library load or catch-up SSE stream.
- **Mongoose Deprecations**: Fixed deprecation warning for `findOneAndUpdate` by replacing the deprecated `{ new: true }` option with `{ returnDocument: 'after' }`.

## [v2.0.0-multi-llm-video-pdf] - 2026-07-04

### Added
- **Multi-LLM Pipeline**: Migrated the core generation architecture from a single LLM pipeline to a robust multi-LLM processing pipeline for improved outline, lesson, and quiz output quality.
- **Video Generation System**: Added a native video generation/rendering service to compile educational video content dynamically for courses.
- **Gotenberg PDF Exporter**: Integrated a centralized Gotenberg PDF exporter provider for robust multi-page booklet rendering.
- **PDF Generation Scheduler**: Implemented a queue-based scheduler to process PDF compiles sequentially, preventing CPU/RAM spikes.
- **Real-Time Progress notifications**: Created a Server-Sent Events (SSE) progress update pipeline to push active PDF compile status directly to the frontend client.
- **Native Multi-Platform Builds**: Enabled automatic `linux/amd64` and `linux/arm64` cross-compilation builds in the GitHub Actions workflow using QEMU and Buildx.
- **Gotenberg Healthcheck**: Added a container health check dependency block in `docker-compose.yml` to synchronize services on boot.
- **Safeguard DX Check**: Added warning logs in the backend resolver if local Puppeteer is instantiated in a container without Chromium.

### Changed
- **Node.js Upgrade**: Upgraded backend container base image to **`node:22-slim`** (Active LTS).
- **Compose Modernization**: Upgraded `docker-compose.yml` configuration to Compose Specification V2+ syntax.
- **Resource Limits Tuning**: Scaled container limits for the new **3GB RAM server footprint** (MongoDB: 512M with 256M cache, Gotenberg: 1G, Node backend: 300M).
- **Build Footprint Optimization**: Removed Puppeteer local browser binary downloads and system packages from the Dockerfile, shrinking the backend container image by **300MB–500MB**.

## [v1.0.0-baseline-single-llm] - Previous Release
- Baseline version of GenCourse AI with single LLM pipeline.
