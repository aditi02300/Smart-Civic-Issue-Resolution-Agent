# Smart Civic Issue Resolution Agent

AI-powered platform that lets citizens report civic issues (potholes, garbage, streetlight outages, drainage problems, etc.), automatically classifies and routes them to the correct department using AI, and tracks resolution status with automatic escalation for unresolved complaints.

## Problem Statement
DSSA Hackathon 2026 — PS01, Agentic AI domain: Smart Civic Issue Resolution Agent

## Tech Stack
- React + TypeScript + Vite
- Supabase (PostgreSQL database, authentication, edge functions)
- Google Gemini AI (complaint classification and severity analysis)
- Tailwind CSS

## Features
- Citizen sign-up/login with role-based access (Citizen / Admin)
- AI-powered complaint analysis — automatically identifies category, department, and severity from the complaint description
- Complaint submission with unique tracking ID generation
- Public complaint tracking with a visual status timeline (Submitted → Assigned → In Progress → Resolved)
- Admin dashboard with live statistics and a full complaint management table
- Automatic escalation system — flags complaints that remain unresolved past severity-based time thresholds

## Architecture
1. Citizen submits a complaint via the Report page
2. Complaint description is sent to a Supabase Edge Function, which calls Google Gemini to classify the issue
3. Classified complaint (category, department, severity) is stored in Supabase
4. A unique tracking ID is generated and shown to the citizen
5. Admins view all complaints on a live dashboard, with automatic escalation alerts for overdue complaints

Built for DSSA Hackathon 2026.
