# QA Etapa 1 - TSF Control Center

Checklist de validacion manual tras ejecutar `bash scripts/etapa1.sh` y configurar Supabase.

## 0. Pre-requisitos
- [ ] Proyecto Supabase creado (region cercana, plan free OK para dev).
- [ ] `.env.local` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- [ ] Vars en Vercel (Preview + Production): mismas dos + `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL=ivangasolero@gmail.com`.
- [ ] Migraciones aplicadas en Supabase SQL editor en orden: `0001_init.sql`, `0002_rls_policies.sql`, `seed.sql`.

## 1. Build
- [ ] `npm install` sin errores criticos.
- [ ] `npm run build` termina con exit code 0.
- [ ] `dist/` generado.

## 2. Auth flujo basico
- [ ] `/login` renderiza form con email + password + toggle a magic link.
- [ ] Login con password de admin (`ivangasolero@gmail.com`) redirige a `/dashboard`.
- [ ] Header muestra email + rol `admin`.
- [ ] `Cerrar sesion` limpia sesion y redirige a `/login`.
- [ ] Acceso directo a `/dashboard` sin sesion -> redirige a `/login`.

## 3. Roles
- [ ] Usuario nuevo (no admin) creado desde Supabase Auth tiene `role = null` por defecto.
- [ ] Asignar manualmente `role = 'marketing'` en `profiles` -> el usuario ve `/dashboard` pero `/admin` lo rebota.
- [ ] Admin accede a `/admin` sin redirect.

## 4. RLS
- [ ] Usuario A inserta un report -> usuario B no lo ve (`select * from reports` filtra).
- [ ] Admin ve todos los reports.
- [ ] `ai_responses` siguen la misma regla (owner del report o admin).

## 5. No regresiones
- [ ] `services/geminiService.ts` sin cambios (verificar git diff vacio).
- [ ] `App.tsx` y `index.tsx` sin cambios.
- [ ] Flujo legacy de subir PDF + analizar sigue funcionando si el usuario provee API key (queda asi solo hasta Etapa 2).

## 6. Seguridad
- [ ] Ninguna clave Gemini ni Supabase service_role aparece en bundle (`grep -r service_role dist/` debe ser vacio).
- [ ] `.env.local` no esta trackeado por git.
- [ ] Headers de Supabase RLS responden 401 a peticiones sin token.

## Salida esperada
Al completar todos los checks, etiquetar `etapa1-ok` en la rama y abrir PR borrador a main (sin merge aun).
