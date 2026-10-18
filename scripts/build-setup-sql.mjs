// Concatenates the admin-content migrations into one file the site owner can paste
// into the Supabase SQL Editor and run once. Every migration included is re-runnable.
// Usage: node scripts/build-setup-sql.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const migrations = [
  '008_reels_video_storage_and_publishing.sql',
  '009_portfolio_sync_integrity.sql',
  '010_admin_managed_portfolio.sql',
];

const header = `-- ==============================================================================
-- Apoorv Patel Photography — ONE-TIME ADMIN SETUP (generated file, do not edit)
--
-- Run this whole file once in Supabase → SQL Editor → New query → Run.
-- It is safe to run again: nothing is deleted and existing work is preserved.
-- Contains migrations: ${migrations.join(', ')}
-- Regenerate with: node scripts/build-setup-sql.mjs
-- ==============================================================================
`;

const body = migrations
  .map(name => `\n\n-- >>>>>>>>>>>>>>>>>>>> ${name} >>>>>>>>>>>>>>>>>>>>\n\n${readFileSync(`supabase/migrations/${name}`, 'utf8').trim()}\n`)
  .join('');

writeFileSync('supabase/setup/run_once_admin_setup.sql', header + body);
console.log('Wrote supabase/setup/run_once_admin_setup.sql');
