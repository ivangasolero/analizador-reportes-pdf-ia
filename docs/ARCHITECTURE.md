# TSF Control Center — Arquitectura

## Visión
Plataforma empresarial multiusuario que reutiliza la lógica de análisis de reportes PDF con Google Gemini del repositorio original y la expone por departamento, con panel de administración global, historial, alertas, auditoría y PWA instalable.

## Stack
- Frontend: React + TypeScript + Vite (heredado).
- Backend: Vercel Serverless Functions (Node 20) en `/api/*`.
- BD + Auth + Storage: Supabase (Postgres + RLS + Auth + Storage bucket `reports`).
- IA: Google Gemini llamada SOLO desde `/api/analyze` (la API key nunca sale del servidor).
- Deploy: Vercel (se descontinúa GitHub Pages).
- PWA: `vite-plugin-pwa` + Workbox.

## Roles
`admin`, `direccion_operativa`, `marketing`, `administracion`, `soporte_herramientas`. Tabla `departments` permite agregar más sin tocar código.

## Administrador principal
`ivangasolero@gmail.com` -> rol `admin` asignado por trigger en `auth.users` insert.

## Modelo de datos (Supabase)
Ver `supabase/migrations/0001_init.sql`.
- `departments` (catálogo)
- `profiles` (1-1 con auth.users, role, department_id, status)
- `reports` (PDF subido por usuario, file_url en Storage)
- `ai_responses` (resultado Gemini: resumen, insights, recomendaciones, prioridades, acciones, severidad)
- `alerts` (derivadas de ai_responses según reglas)
- `audit_log` (toda acción relevante)
- Vista `monthly_kpis` para dashboards.

## RLS
- Usuario común: SELECT/INSERT solo sobre filas de su department_id y propias.
- Admin: acceso total (policy is_admin()).
- Sin registro público: signups deshabilitados en Supabase Auth; el admin invita desde /admin/users.

## Rutas frontend
- /login (público)
- /dashboard (usuario) — cargar PDF, ver respuesta IA, historial, exportar PDF
- /dashboard/history
- /admin (solo admin) — KPIs, alertas, filtros
- /admin/users — invitar, asignar rol/dpto, suspender, reactivar, reset password
- /admin/reports — todos los reportes
- /admin/audit

## Serverless endpoints
- POST /api/analyze — recibe report_id, descarga PDF de Storage con service role, llama Gemini, persiste en ai_responses y dispara reglas de alertas.
- POST /api/admin/invite — crea usuario en Auth (service role) + perfil.
- POST /api/admin/user-status — suspender/reactivar.
- POST /api/admin/reset-password — envía email de recovery.
- GET  /api/export/report/:id — genera PDF server-side.

## Variables de entorno (Vercel)
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (server only)
- GEMINI_API_KEY (server only)
- ADMIN_EMAIL=ivangasolero@gmail.com

## PWA
- public/manifest.webmanifest (nombre: TSF Control Center).
- Service worker generado por vite-plugin-pwa.
- Banner de instalación custom; oculto si matchMedia('(display-mode: standalone)').matches.

## Etapas
0. Base (esta rama): docs, migración SQL, serverless skeleton, manifest, envs.
1. Integrar Supabase client + Auth UI + ProtectedRoute.
2. Aislar lógica IA en services/aiAnalysis.ts y mover llamada a /api/analyze.
3. Panel usuario (upload + render respuesta + historial + export PDF).
4. Panel admin (usuarios, reportes globales, KPIs, alertas, auditoría).
5. PWA wiring + íconos + banner.
6. Deploy Vercel + QA multi-dispositivo.

## Principios
- No romper la lógica IA existente: se refactoriza, no se reescribe.
- Toda persistencia en Supabase (trazabilidad total).
- Cero secretos en el cliente.
- Commits pequeños y claros por etapa.
