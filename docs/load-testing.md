# Load Testing

## Tools
- k6 (https://k6.io) for Supabase API load testing
- Lighthouse CI for frontend performance

## Supabase Limits (Free Tier)
- 500 MB database
- 2 GB bandwidth/month
- 50,000 monthly active users
- 500,000 Edge Function invocations
- Realtime: 200 concurrent connections

## Test Scenarios

### Scenario 1: Concurrent Campaign Joins
- 50 users simultaneously joining a campaign via join code
- Expected: All succeed within 2 seconds
- Bottleneck: cc_campaigns SELECT + cc_campaign_players INSERT

### Scenario 2: Battle Logging Burst
- 20 users logging battles within 30 seconds
- Expected: All battles recorded, realtime events delivered
- Bottleneck: Realtime subscription fan-out

### Scenario 3: Combat Tracker Session
- 4 players in a live combat session
- 100 engagements logged over 30 minutes
- Expected: All engagements synced across devices within 1 second

## Running Load Tests
```bash
# Install k6
# brew install k6  (macOS)
# choco install k6  (Windows)

# Run basic test
k6 run scripts/load-test.js
```
