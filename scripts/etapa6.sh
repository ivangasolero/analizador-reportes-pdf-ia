#!/usr/bin/env bash
# Etapa 6 - QA Final + Vercel Deploy Config
# Genera: vercel.json, .env.example actualizado, QA checklist, y script de validacion.
# Uso: bash scripts/etapa6.sh && git add -A && git commit -m 'feat(etapa6): vercel config + QA checklist + final setup'
set -euo pipefail

# --- vercel.json ---
cat > vercel.json <<'EOF'
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
    },
    {
      "source": "/manifest.json",
      "headers": [{ "key": "Content-Type", "value": "application/manifest+json" }]
    }
  ]
}
EOF

# --- .env.example (updated with all required vars) ---
cat > .env.example <<'EOF'
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Gemini (SERVER-SIDE ONLY - set in Vercel env vars, NOT in frontend)
GEMINI_API_KEY=your-gemini-api-key

# Supabase Service Role (SERVER-SIDE ONLY - for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
EOF

# --- QA Checklist ---
mkdir -p docs
cat > docs/QA_FINAL.md <<'EOF'
# QA Final - TSF Control Center (Multiusuario)

## Pre-Deploy Checklist

### Build
- [ ] `npm install` sin errores
- [ ] `npm run build` sin errores de TypeScript
- [ ] Bundle size razonable (<500KB gzip)

### Auth & Seguridad
- [ ] Login funciona con email/password
- [ ] Registro cerrado (solo invitacion desde admin)
- [ ] Rutas protegidas redirigen a /login si no autenticado
- [ ] AdminDashboard solo accesible con role=administrador
- [ ] GEMINI_API_KEY NO aparece en el bundle del frontend
- [ ] Llamadas IA pasan por /api/analyze (serverless)
- [ ] RLS activo en todas las tablas (profiles, reports, analyses, audit_logs)

### Funcionalidad Usuario
- [ ] Subir reporte y obtener analisis IA
- [ ] Historial muestra solo reportes propios
- [ ] Detalle muestra analisis con prioridad
- [ ] Exportar PDF genera archivo correcto

### Funcionalidad Admin
- [ ] Listar usuarios con roles
- [ ] Invitar usuario por email
- [ ] Cambiar rol de usuario
- [ ] Suspender/activar usuario
- [ ] Ver logs de auditoria
- [ ] Ver alertas IA (prioridad alta/critica)

### PWA
- [ ] manifest.json carga correctamente
- [ ] Service Worker se registra
- [ ] Banner de instalacion aparece en mobile
- [ ] App funciona offline (paginas cacheadas)
- [ ] Iconos 192x192 y 512x512 presentes

### Deploy Vercel
- [ ] Proyecto importado desde GitHub (rama feat/multiusuario)
- [ ] Framework: Vite
- [ ] Build command: npm run build
- [ ] Output: dist
- [ ] Env vars configuradas:
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY
  - GEMINI_API_KEY
  - SUPABASE_SERVICE_ROLE_KEY
- [ ] API routes funcionan (/api/analyze)
- [ ] Custom domain configurado (opcional)

### Migraciones DB
- [ ] 0001_init.sql ejecutada
- [ ] 0002_reports_analyses.sql ejecutada (si existe en etapa2)
- [ ] 0003_audit_logs.sql ejecutada
- [ ] Super-admin ivangasolero@gmail.com con role=administrador en profiles

## Post-Deploy
- [ ] Smoke test en produccion
- [ ] Verificar headers de seguridad
- [ ] Verificar que sw.js no cachea /api/*
- [ ] Monitorizar logs de Vercel
EOF

# --- Validate script (run locally) ---
cat > scripts/validate.sh <<'EOF'
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
EOF
chmod +x scripts/validate.sh

echo ''
echo '[etapa6] Archivos creados:'
echo '  - vercel.json (deploy config con rewrites para SPA + API)'
echo '  - .env.example (todas las vars necesarias)'
echo '  - docs/QA_FINAL.md (checklist completa)'
echo '  - scripts/validate.sh (validacion de estructura)'
echo ''
echo '=== DEPLOY EN VERCEL ==='
echo '1. Importar repo en vercel.com -> New Project'
echo '2. Branch: feat/multiusuario'
echo '3. Framework: Vite'
echo '4. Configurar env vars (ver .env.example)'
echo '5. Deploy!'
echo ''
echo 'Commit: git add -A && git commit -m "feat(etapa6): vercel config + QA checklist" && git push'
