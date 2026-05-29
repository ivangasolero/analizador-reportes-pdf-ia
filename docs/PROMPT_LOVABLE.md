# Prompt maestro para Lovable / Cursor / Claude Code

Copiar y pegar TAL CUAL en el agente. Apuntar el agente al repo
`ivangasolero/analizador-reportes-pdf-ia`, rama base `feat/multiusuario`.

---

Repositorio: ivangasolero/analizador-reportes-pdf-ia
Rama base: feat/multiusuario
Lee estos 3 archivos como fuente de verdad antes de tocar codigo:
- docs/ARCHITECTURE.md
- docs/IA_LEGACY_MAP.md
- supabase/migrations/0001_init.sql

Objetivo: convertir la SPA actual (React + Vite + Gemini en services/geminiService.ts)
en TSF Control Center, plataforma empresarial multiusuario con paneles por departamento
y panel admin, SIN reescribir la logica IA.

## Reglas duras
1. NO modificar services/geminiService.ts ni services/pdfService.ts salvo para envolverlos.
   El refactor consiste en crear services/aiAnalysis.ts que re-exporta las 4 funciones
   actuales (analyzeReport, getReportFeedback, getConsolidatedAnalysis, askConsolidatedQuestion).
2. La env var de Gemini sigue siendo API_KEY (no GEMINI_API_KEY), solo en el servidor.
   Actualizar .env.example en consecuencia.
3. Toda persistencia en Supabase. Cero respuestas temporales. Toda invocacion a Gemini
   pasa por Vercel Serverless Functions (api/*). Cero llamadas a Gemini desde el browser.
4. Sin registro publico. Admin invita usuarios desde /admin/users.
5. Commits pequenos por etapa, mensajes claros con prefix feat/fix/docs/chore.
6. Branding: "TSF Control Center - Inteligencia Operativa Empresarial". Tema oscuro empresarial.
   Color base #0B1220 (ya en manifest).

## Etapas

### Etapa 1 - Auth + Supabase client
- Instalar @supabase/supabase-js.
- src/lib/supabase.ts con cliente anon. Hook useAuth + AuthProvider.
- Paginas /login (email+password) y /reset-password. SIN /register.
- ProtectedRoute. Si profile.status='suspended' -> logout + mensaje.
- Cargar profile (role, department_id) en sesion.

### Etapa 2 - Refactor IA a serverless
- Crear services/aiAnalysis.ts (wrapper sobre geminiService.ts, sin tocarlo).
- api/analyze.ts: validar JWT (jose o supabase-js admin), descargar PDF de Storage
  bucket 'reports', extraer texto con pdf-parse, llamar analyzeReport y getReportFeedback,
  persistir en ai_responses (raw guarda objeto completo), derivar severity, crear
  rows en alerts si severity in ('high','critical').
- api/admin/consolidated.ts: solo admin, usa getConsolidatedAnalysis.
- Cliente: sube PDF a Storage -> insert reports -> POST /api/analyze {report_id}.

### Etapa 3 - Panel usuario (/dashboard)
- Upload con departamento auto-asignado del profile.
- Render de AnalysisResult (resumen, keyMetrics, recommendations, achievements)
  + ReportFeedback (areasForImprovement, qualityEvaluation, optimizationSuggestions).
- /dashboard/history con filtros por fecha. Export PDF con jsPDF + html2canvas.

### Etapa 4 - Panel admin (/admin, gate role='admin')
- /admin/users: invitar (api/admin/invite con service role), asignar role/dept,
  suspender, reactivar, reset-password (auth.admin.generateLink).
- /admin/reports: tabla con filtros (dept, user, fecha, status).
- /admin (home): dashboard Recharts - vista monthly_kpis, alertas activas, tendencias
  trimestrales/anuales por dept, indicadores clave.
- /admin/audit: tabla audit_log paginada.
- Resumen ejecutivo: boton "Generar resumen del mes" -> api/admin/consolidated.
- Chat estrategico admin: usa askConsolidatedQuestion anclado al consolidado del mes.

### Etapa 5 - PWA
- Instalar vite-plugin-pwa con registerType:'autoUpdate'.
- Usar public/manifest.webmanifest existente.
- Generar icons placeholder 192/512/maskable en public/icons/.
- Componente InstallBanner que escucha beforeinstallprompt y se oculta si
  matchMedia('(display-mode: standalone)').matches.

### Etapa 6 - Deploy
- vercel.json ya existe.
- Borrar .github/workflows (deja de usarse GitHub Pages).
- Crear docs/QA.md con checklist multi-dispositivo.
- Abrir PR feat/multiusuario -> main cuando este verde.

## Stack permitido
React 18, TypeScript, Vite, @supabase/supabase-js, @vercel/node, @google/genai (ya esta),
pdf-parse, jsPDF, html2canvas, Recharts, vite-plugin-pwa. No agregar otros frameworks.

## Entregables por etapa
Al terminar cada etapa abrir PR contra feat/multiusuario con:
- resumen de cambios
- checklist de aceptacion
- screenshots si toca UI
