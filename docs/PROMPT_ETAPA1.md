# PROMPT ETAPA 1 - Auth Supabase + Roles + Protected Routes

Contexto: rama feat/multiusuario del repo ivangasolero/analizador-reportes-pdf-ia.
Lee primero docs/ARCHITECTURE.md, docs/IA_LEGACY_MAP.md, docs/SETUP.md y docs/PROMPT_LOVABLE.md.
No romper la logica IA existente en services/geminiService.ts.

## Objetivo
Dejar funcionando login con Supabase, perfiles con rol y departamento, rutas protegidas y seed del admin principal ivangasolero@gmail.com.

## Tareas
1. Instalar @supabase/supabase-js. Crear lib/supabaseClient.ts leyendo VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.
2. Aplicar supabase/migrations/0001_init.sql en el proyecto Supabase (tablas: profiles, departments, reports, ai_responses, alerts, audit_log, exports, monthly_history) con RLS habilitado.
3. Crear seed supabase/seed.sql que inserte departamentos por defecto (Direccion Operativa, Marketing, Administracion, Soporte de Herramientas) y marque a ivangasolero@gmail.com como role='admin' via trigger on auth.users insert.
4. Crear funcion SQL public.is_admin() y politicas RLS: usuario ve solo sus reports/ai_responses; admin ve todo.
5. Frontend: crear contexts/AuthContext.tsx, paginas /login, /forgot-password, /update-password. Sin signup publico.
6. Crear components/ProtectedRoute.tsx y RoleRoute.tsx. Envolver App.tsx con AuthProvider y router.
7. Header con email, rol, departamento y boton Cerrar sesion.
8. Si user.role='admin' redirigir a /admin, si no a /dashboard (placeholders por ahora).
9. No tocar geminiService.ts en esta etapa.

## Variables de entorno
VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (frontend).
SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY, ADMIN_EMAIL=ivangasolero@gmail.com (solo Vercel server).

## Entregable
PR feat/multiusuario con: codigo, docs/QA_ETAPA1.md (checklist manual), captura de login OK y de redireccion admin/usuario.

## Criterios de aceptacion
- Login con magic link y con password funciona.
- ivangasolero@gmail.com entra como admin.
- Usuario sin rol no puede acceder a /admin.
- RLS bloquea lectura cruzada entre usuarios.
- npm run build sin errores.
