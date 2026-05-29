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
