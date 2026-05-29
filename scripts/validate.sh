#!/usr/bin/env bash
set -euo pipefail
echo 'Validating project structure...'

FILES=(
  "api/analyze.ts"
  "services/aiAnalysis.ts"
  "services/auditService.ts"
  "components/Dashboard.tsx"
  "components/ReportUpload.tsx"
  "components/ReportHistory.tsx"
  "components/ReportDetail.tsx"
  "components/InstallBanner.tsx"
  "components/admin/AdminDashboard.tsx"
  "components/admin/AdminUserList.tsx"
  "components/admin/AdminAuditLog.tsx"
  "components/admin/AdminAlerts.tsx"
  "utils/exportPdf.ts"
  "supabase/client.ts"
  "public/manifest.json"
  "public/sw.js"
  "vercel.json"
)

MISSING=0
for f in "${FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "MISSING: $f"
    MISSING=$((MISSING+1))
  fi
done

if [ $MISSING -eq 0 ]; then
  echo 'All files present. Ready for build.'
else
  echo "$MISSING file(s) missing. Run etapa scripts first."
  exit 1
fi
