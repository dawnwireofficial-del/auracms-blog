if (Test-Path 'check_supabase.mjs') {
  $c = Get-Content 'check_supabase.mjs' -Raw
  $c = $c -replace "'sbp_[a-f0-9_]+'", 'process.env.SUPABASE_ACCESS_TOKEN'
  Set-Content -NoNewline 'check_supabase.mjs' -Value $c
}
if (Test-Path 'migrate_rest.mjs') {
  $c = Get-Content 'migrate_rest.mjs' -Raw
  $c = $c -replace "'sbp_[a-f0-9_]+'", 'process.env.SUPABASE_ACCESS_TOKEN'
  Set-Content -NoNewline 'migrate_rest.mjs' -Value $c
}
