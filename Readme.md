# Building a CTF Platform

A Capture-The-Flag platform I am building to learn the Laravel and Vue stack. Work in progress.

## What this is

A build-to-learn project. The goal is a working CTF platform in the spirit of Hack The Box: register, browse security challenges, submit flags, score points, climb a leaderboard. I build it across six milestones, from an empty folder to a deployable MVP.

The point is to learn a production web stack by building something real with it, one concept at a time.

## Roadmap

- [ ] **M1 (Plumbing):** a Laravel API and a Vue frontend running locally and exchanging data
- [ ] **M2 (Users):** registration, login, auth tokens
- [ ] **M3 (Challenges):** challenges stored in a database and served through the API
- [ ] **M4 (Solve loop):** submit a flag, validate it server-side, award points
- [ ] **M5 (Platform):** leaderboard, a set of static challenges, polish (the shippable MVP)
- [ ] **M6 (Real hacking):** Docker-based vulnerable apps as live challenges

Currently on M1. `builder/` is just getting started.

## Repo layout

- **`study/`** is the curriculum I work through, one concept per page. It is an AI-generated study companion: a static site, opened in a browser at `study/index.html`. This is my learning material, not the product.
- **`builder/`** is the platform itself. Every line of code here is mine, written by hand at each milestone's checkpoint.

## Stack

- **Backend:** Laravel (PHP), as a REST API
- **Frontend:** Vue.js
- **Database:** PostgreSQL or MySQL
- **Containers:** Docker, for the live-challenge milestone
