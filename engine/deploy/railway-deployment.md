# Railway Deployment Guide for Risk League Engine

## Overview
Railway simplifies deployment by handling Docker containers automatically. You'll deploy multiple services:
- 1 Cron scheduler service (for timed jobs)
- 4 Always-running services (sync props, resolve matches, resolve parlay picks, resolve parlays)

## Prerequisites
- Railway account
- Railway CLI installed: `npm install -g @railway/cli`
- Docker (for local testing)

## Step 1: Install Railway CLI and Login

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login
```

## Step 2: Create Railway Project

```bash
# Create new project
railway create risk-league-engine

# Or link existing project
railway link
```

## Step 3: Configure Environment Variables

### In Railway Dashboard:
1. Go to your project dashboard
2. Click on each service
3. Go to "Variables" tab
4. Add these environment variables:

#### Required Environment Variables:
```
DATABASE_URL=postgresql://user:password@host:port/dbname
REDIS_URL=redis://host:port
ENVIRONMENT=production
LOG_LEVEL=INFO
TZ=America/New_York
```

### Using Railway CLI:
```bash
# Set environment variables via CLI
railway variables set DATABASE_URL="postgresql://user:password@host:port/dbname"
railway variables set REDIS_URL="redis://host:port"
railway variables set ENVIRONMENT="production"
railway variables set LOG_LEVEL="INFO"
railway variables set TZ="America/New_York"
```

## Step 4: Deploy Services

### Deploy Cron Scheduler (for scheduled jobs):
```bash
# Deploy cron scheduler
railway up --service cron-scheduler --config railway/cron-scheduler.json
```

### Deploy Always-Running Services:
```bash
# Deploy sync props services
railway up --service sync-props-mlb --config railway/sync-props-mlb.json
railway up --service sync-props-nba --config railway/sync-props-nba.json

# Deploy resolve services
railway up --service resolve-matches --config railway/resolve-matches.json
railway up --service resolve-parlay-picks --config railway/resolve-parlay-picks.json
railway up --service resolve-parlays --config railway/resolve-parlays.json
```

## Step 5: Alternative - Deploy All Services from Dashboard

1. Go to Railway dashboard
2. Create new service for each configuration file
3. Connect your GitHub repository
4. Set the build command to use the respective JSON config
5. Deploy each service

## Environment Variables Configuration Methods

### Method 1: Railway Dashboard (Recommended)
1. **Navigate to Project**: Go to your Railway project dashboard
2. **Select Service**: Click on the service you want to configure
3. **Variables Tab**: Click on "Variables" in the service settings
4. **Add Variables**: Click "Add Variable" and enter key-value pairs
5. **Deploy**: Variables are automatically applied on next deployment

### Method 2: Railway CLI
```bash
# Set individual variables
railway variables set KEY=value

# Set multiple variables from file
railway variables set --file .env

# View current variables
railway variables
```

### Method 3: .env File (for local development)
Create `.env` file in your project root:
```
DATABASE_URL=postgresql://localhost:5432/riskleague
REDIS_URL=redis://localhost:6379
ENVIRONMENT=development
LOG_LEVEL=DEBUG
```

## Step 6: Monitor Services

### View Logs:
```bash
# View logs for specific service
railway logs --service cron-scheduler
railway logs --service sync-props-mlb
railway logs --service resolve-matches
```

### Check Service Status:
```bash
# List all services
railway status

# Check specific service
railway status --service cron-scheduler
```

## Step 7: Scaling and Management

### Scale Services:
```bash
# Scale specific service
railway scale --service sync-props-mlb --replicas 2
```

### Restart Services:
```bash
# Restart specific service
railway restart --service cron-scheduler
```

## Troubleshooting

### Common Issues:

1. **Service Won't Start**
   - Check logs: `railway logs --service SERVICE_NAME`
   - Verify environment variables are set correctly
   - Ensure Docker image builds successfully

2. **Scheduled Jobs Not Running**
   - Check cron-scheduler logs
   - Verify timezone settings (TZ environment variable)
   - Ensure cron-scheduler service is running

3. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check network connectivity
   - Ensure database allows connections from Railway IPs

### View Service Metrics:
```bash
# View service metrics
railway metrics --service SERVICE_NAME
```

## Cost Optimization

- Railway charges based on usage
- Monitor resource usage in dashboard
- Scale down non-critical services during low-traffic periods
- Use Railway's sleep feature for development environments

## File Structure Created:
```
railway/
├── cron-scheduler.json      # Scheduled jobs service
├── sync-props-mlb.json      # MLB sync props service
├── sync-props-nba.json      # NBA sync props service
├── resolve-matches.json     # Resolve matches service
├── resolve-parlay-picks.json # Resolve parlay picks service
├── resolve-parlays.json     # Resolve parlays service
└── cron_scheduler.py        # Python cron scheduler
```

Each service will automatically restart on failure and maintain high availability.