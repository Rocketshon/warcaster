# Disaster Recovery Procedures

## Data Backup
### Supabase Database
1. Export via Supabase Dashboard → Settings → Database → Download Backup
2. Or use pg_dump: `pg_dump -h db.<PROJECT_REF>.supabase.co -U postgres -d postgres > backup.sql`
3. Schedule weekly backups via cron or GitHub Actions

### localStorage Data
- Users can export their data from Settings → Export Data (JSON download)
- Data includes: campaign, player, units, battles, all_players

## Recovery Procedures

### Supabase Down
1. App continues working in offline mode (localStorage)
2. Mutations queue in offlineQueue
3. When Supabase recovers, queue flushes automatically
4. No user action needed

### localStorage Cleared
1. User signs in again
2. pullCampaignFromCloud restores all cloud data
3. Any data not yet synced to cloud is lost

### Full Reset
1. Clear localStorage (Settings → Clear Data & Reload)
2. Sign in → data pulls from Supabase
3. If Supabase data is also corrupted, restore from backup

## Rollback Procedures
- Git: `git revert HEAD` for last commit rollback
- GitHub Pages: Previous deploy available in Actions → Re-run deployment
- Database: Restore from Supabase backup via Dashboard

## Monitoring
- Check errorTracking.ts logs in Settings → Developer Tools → Error Log
- Check telemetry stats for unusual patterns
