# Mapeo de la logica IA existente (services/geminiService.ts)

> Este archivo documenta la implementacion ACTUAL para que Etapa 2 (refactor a serverless)
> no la rompa. Si esto cambia, actualizar aqui PRIMERO.

## Dependencia y env var
- Paquete: `@google/genai`.
- Env var leida hoy: `process.env.API_KEY` (NO `GEMINI_API_KEY`).
- En la migracion serverless mantendremos `API_KEY` como nombre canonico server-side para
  poder reutilizar el modulo tal cual. El `.env.example` y la doc se actualizaran en Etapa 2.

## Modelos
- `gemini-2.5-flash`: analyzeReport, getReportFeedback.
- `gemini-2.5-pro`: getConsolidatedAnalysis, askConsolidatedQuestion.

## Funciones exportadas
1. `analyzeReport(text) -> AnalysisResult`
   - Schema: `detectedRole`, `summary`, `keyMetrics[]{metric,value,context?}`,
     `recommendations[]`, `achievements[]`.
   - `detectedRole` enum: Marketing | Administracion | Soporte y Herramientas | Analisis | General.
   - temperature: 0.2.
2. `getReportFeedback(text) -> ReportFeedback`
   - Schema: `detailedAnalysis`, `areasForImprovement[]{point,explanation}`,
     `qualityEvaluation{score(1-10),summary}`, `optimizationSuggestions[]`.
   - temperature: 0.3.
3. `getConsolidatedAnalysis(reports: {role,text}[]) -> ConsolidatedAnalysis`
   - Schema: `strategicSummary`, `crossDepartmentInsights[]`, `businessRecommendations[]`.
   - Es la base del "resumen ejecutivo global" del panel admin.
   - temperature: 0.5.
4. `askConsolidatedQuestion(context, question, history) -> string`
   - Chat estrategico ANCLADO al contexto (no inventa).

## Mapeo a tablas Supabase

| Campo IA original                 | Columna en ai_responses     |
|-----------------------------------|------------------------------|
| summary                           | summary (text)               |
| keyMetrics                        | insights (jsonb)             |
| recommendations                   | recommendations (jsonb)      |
| achievements                      | actions (jsonb) *o nueva col*|
| detectedRole                      | raw.detectedRole + log       |
| qualityEvaluation.score (feedback)| severity derivada            |
| optimizationSuggestions (feedback)| priorities (jsonb)           |

> Etapa 2 puede sumar columnas extra (`achievements jsonb`, `quality_score int`,
> `detected_role text`) via migracion `0002_*.sql`. La migracion 0001 ya es suficiente
> para arrancar guardando todo en `raw` (jsonb).

## Mapeo de departamentos

El `detectedRole` que devuelve Gemini ya NO determina el departamento del usuario
(eso lo decide el admin). El `detectedRole` se guarda como metadato para auditar si
la clasificacion automatica coincide con el departamento real del que subio el reporte.

| ReportRole legacy        | departments.slug          |
|--------------------------|---------------------------|
| Marketing                | marketing                 |
| Administracion           | administracion            |
| Soporte y Herramientas   | soporte_herramientas      |
| Analisis                 | direccion_operativa       |
| General                  | (sin mapeo; admin)        |

## Plan de refactor en Etapa 2 (NO ejecutar aun)
1. Crear `services/aiAnalysis.ts` que re-exporta las funciones de `geminiService.ts` SIN
   modificarlas (wrapper).
2. `/api/analyze` importa de `services/aiAnalysis` y usa pdf-parse para extraer texto del
   PDF descargado de Storage. La funcion `analyzeReport(text)` se invoca tal cual.
3. Persistir: `ai_responses.summary`, `.recommendations`, `.raw` (objeto completo), y
   derivar `severity`:
   - si feedback.qualityEvaluation.score <= 4 -> 'high'
   - si keyMetrics contiene valores 'Bajo'/'Critico' o si areasForImprovement.length>=4 -> 'medium'
   - default 'low'
4. Generar `alerts` cuando `severity in ('high','critical')`.
5. Solo el panel ADMIN llama a `/api/admin/consolidated` (usa getConsolidatedAnalysis).
