# Setup paso a paso - TSF Control Center

Guia operativa para dejar el proyecto corriendo en Supabase + Vercel.

## 1. Supabase

1. https://supabase.com/dashboard -> New project.
   - Name: tsf-control-center.
   - Region: South America (Sao Paulo).
   - Password DB: generar y guardar.
2. Settings -> API:
   - Project URL -> VITE_SUPABASE_URL.
   - anon public -> VITE_SUPABASE_ANON_KEY.
   - service_role -> SUPABASE_SERVICE_ROLE_KEY (server only).
3. SQL Editor -> pegar supabase/migrations/0001_init.sql -> Run.
4. Storage -> New bucket: name=reports, public=OFF, limit=25 MB.
5. Authentication -> Providers -> Email:
   - Enable: ON.
   - Enable signups: OFF (solo invitacion).
   - Confirm email: ON.
6. Authentication -> URL Configuration: Site URL = URL de Vercel; agregar redirect localhost.
7. Authentication -> Users -> Add user: ivangasolero@gmail.com + password temporal.
   El trigger handle_new_user lo promueve a admin automaticamente.

## 2. Google AI Studio (Gemini)

1. https://aistudio.google.com/app/apikey -> Create API key.
2. Guardar como API_KEY (nombre actual del repo, ver IA_LEGACY_MAP.md).

## 3. Vercel

1. Add New -> Project -> Import ivangasolero/analizador-reportes-pdf-ia.
2. Framework: Vite. Production branch: main (se mergea al final).
3. Environment Variables:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY (Sensitive)
   - API_KEY (Sensitive) - Gemini
   - ADMIN_EMAIL=ivangasolero@gmail.com
4. Deploy. Preview URL aparece para cada push a feat/multiusuario.
5. Volver a Supabase y cargar la URL en URL Configuration.

## 4. Desactivar GitHub Pages (Etapa 6)

Borrar .github/workflows tras validar Vercel.

## 5. Checklist de validacion

- select public.is_admin() = true para ivangasolero@gmail.com.
- Usuario invitado solo ve reportes de su department_id.
- /api/analyze responde 501 en Etapa 0.
- Manifest carga sin errores en DevTools.
- Lighthouse PWA >= 90.
