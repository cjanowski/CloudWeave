# CRITICAL DEVELOPMENT RULES

## 🚨 DO NOT START UP SEPARATELY AND BREAK EVERYTHING 🚨

**ABSOLUTELY NEVER MANUALLY START SERVICES - THIS BREAKS EVERYTHING**

- ❌ DO NOT run `go run cmd/main.go` manually
- ❌ DO NOT run `npm run dev` manually  
- ❌ DO NOT start backend/frontend separately
- ❌ DO NOT use `executeBash` to start services individually
- ❌ DO NOT BREAK THE USER'S SETUP

- ✅ ONLY use `./start.sh` to start services
- ✅ ONLY use `./stop.sh` to stop services

**THE USER IS TIRED OF ME LYING AND BREAKING THINGS**

Starting services separately:
- Creates multiple processes on different ports
- Breaks the coordinated startup sequence
- Causes port conflicts and connection issues
- Frustrates the user who has to clean up the mess

**BREAKING THIS RULE WILL RESULT IN USER NEVER USING ME AGAIN**

Remember: The user created these scripts for a reason - RESPECT THEM AND USE THEM!