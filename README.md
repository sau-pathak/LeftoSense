# LeftoSense

LeftoSense is a polished React + Vite web application focused on reducing food waste through AI-inspired freshness analysis, storage guidance, recipe ideas, and donation-oriented workflows.

## Overview

The project presents an end-to-end user experience for:

- scanning produce and estimating visible freshness
- tracking stored food items and expiration windows
- surfacing foods that should be used soon
- generating recipe guidance from available ingredients
- supporting donation and community impact flows
- showcasing the story and recognition behind the LeftoSense project

This repository has been cleaned for public GitHub use and repackaged as a standalone app scaffold without vendor-specific platform branding.

## Highlights

- Clean React architecture with reusable UI components
- Vite-based local development workflow
- Tailwind CSS styling with a modern, mobile-first layout
- Framer Motion animations for smoother interactions
- Local demo data layer for development and portfolio review
- Public-facing landing page for LeftoSense and Saumit Pathak

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Framer Motion
- Radix UI
- Lucide React

## Project Structure

```text
src/
  api/             # client-side data layer used by the demo app
  components/      # reusable UI and feature components
  hooks/           # shared React hooks
  lib/             # auth, utilities, routing helpers
  pages/           # application screens and landing page
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/sau-pathak/LeftoSense.git
cd LeftoSense
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

### 4. Create a production build

```bash
npm run build
```

### 5. Preview the production build locally

```bash
npm run preview
```

## Current Repository Notes

This GitHub-ready version is intended to be clean, readable, and easy to extend.

- The original platform-specific backend wiring has been removed.
- A lightweight local demo data layer is included so the UI remains explorable.
- Production integrations such as image analysis, authentication, cloud storage, and email delivery should be connected to your preferred backend or serverless stack before public deployment.

## Suggested Next Improvements

- connect image upload and produce analysis to a real inference API
- replace demo auth with a secure authentication provider
- store user data in a real database
- connect the contact form to a live email or form-processing service
- add automated tests and CI workflows
- add environment variable documentation for deployment

## Deployment

This app is well-suited for deployment on platforms such as:

- Vercel
- Netlify
- Cloudflare Pages

After deployment, connect your custom domain and production backend services.

## Recognition

LeftoSense was created by **Saumit Pathak**, a student innovator passionate about food sustainability, artificial intelligence, and community impact.

## License

This repository is provided for portfolio, educational, and project development use. Add a formal license file if you want to open-source it publicly under MIT or another license.
