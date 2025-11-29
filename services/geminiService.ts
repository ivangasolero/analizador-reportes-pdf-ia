

import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult, ReportFeedback, ConsolidatedAnalysis, ReportRole, ChatMessage } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        detectedRole: {
            type: Type.STRING,
            description: 'Clasifica el tipo de reporte en una de las siguientes categorías: Marketing, Administración, Soporte y Herramientas (atención al cliente, IT, herramientas internas), Análisis (equipos de trading, desempeño de operadores, señales de mercado), o General.',
            enum: ['Marketing', 'Administración', 'Soporte y Herramientas', 'Análisis', 'General']
        },
        summary: {
            type: Type.STRING,
            description: 'Un resumen ejecutivo conciso y profesional del informe, destacando los puntos más importantes.',
        },
        keyMetrics: {
            type: Type.ARRAY,
            description: 'Una lista de métricas clave extraídas del informe. Identificar las más relevantes.',
            items: {
                type: Type.OBJECT,
                properties: {
                    metric: {
                        type: Type.STRING,
                        description: 'El nombre de la métrica (por ejemplo, "Tasa de Conversión", "Estabilidad del Desempeño").',
                    },
                    value: {
                        type: Type.STRING,
                        description: 'El valor de la métrica (por ejemplo, "15.2%", "Sólida", "8.5/10").',
                    },
                    context: {
                        type: Type.STRING,
                        description: 'Breve contexto o cambio si está disponible (por ejemplo, "+5% MoM", "vs. Q2", "En progreso positivo").',
                    },
                },
                required: ['metric', 'value'],
            },
        },
        recommendations: {
            type: Type.ARRAY,
            description: 'Una lista de 3 a 5 recomendaciones específicas y accionables basadas en los datos y el análisis del informe para mejorar los resultados futuros.',
            items: {
                type: Type.STRING,
            },
        },
        achievements: {
            type: Type.ARRAY,
            description: 'Una lista de 2 a 4 logros positivos, éxitos o puntos a destacar que merecen felicitaciones, extraídos del informe.',
            items: {
                type: Type.STRING,
            },
        },
    },
    required: ['detectedRole', 'summary', 'keyMetrics', 'recommendations', 'achievements'],
};

export const analyzeReport = async (text: string): Promise<AnalysisResult> => {
    const prompt = `
    Tu tarea es actuar como un analista de negocios experto. Primero, clasifica el tipo de reporte en una de las siguientes categorías: Marketing, Administración (reportes sobre el estado del personal, ingresos y egresos de miembros, contabilidad general, o gestión de recursos como estudiantes o inscripciones), Soporte y Herramientas (reportes que combinan atención al cliente, tickets, satisfacción con infraestructura de TI y herramientas internas), Análisis (reportes de desempeño de equipos de trading, como el equipo 'Trading Sin Fronteras', que incluye seguimiento de operadores, su estado anímico, y análisis de señales de mercado), o General (si no encaja claramente en los otros). 
    
    Luego, analiza el siguiente texto extraído de un reporte de negocio y proporciona un análisis completo en el formato JSON especificado. Sé preciso, profesional y extrae la información más relevante. Para reportes de tipo 'Análisis' que son cualitativos, las métricas clave pueden ser abstractas (ej. 'Compromiso del Equipo', 'Estado Anímico') con valores descriptivos (ej. 'Alto', 'En recuperación'). Presta especial atención a los detalles cualitativos sobre el desempeño y estado anímico del personal.

    Texto del reporte:
    ---
    ${text}
    ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
                temperature: 0.2,
            }
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);
        return result as AnalysisResult;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("No se pudo obtener una respuesta válida del servicio de IA. Inténtalo de nuevo.");
    }
};


const feedbackSchema = {
    type: Type.OBJECT,
    properties: {
        detailedAnalysis: {
            type: Type.STRING,
            description: "Análisis detallado de la calidad del reporte, evaluando su estructura, claridad, presentación de datos y profesionalismo general."
        },
        areasForImprovement: {
            type: Type.ARRAY,
            description: "Lista de 2 a 4 áreas específicas donde el reporte puede mejorar, con explicaciones claras.",
            items: {
                type: Type.OBJECT,
                properties: {
                    point: { type: Type.STRING, description: "El aspecto a mejorar (ej. 'Visualización de Datos', 'Claridad en Conclusiones')." },
                    explanation: { type: Type.STRING, description: "Explicación de por qué es un área de mejora y cómo se podría abordar." }
                },
                required: ["point", "explanation"]
            }
        },
        qualityEvaluation: {
            type: Type.OBJECT,
            properties: {
                score: { type: Type.INTEGER, description: "Puntuación de 1 a 10 sobre la calidad general del reporte." },
                summary: { type: Type.STRING, description: "Resumen conciso que justifica la puntuación otorgada." }
            },
            required: ["score", "summary"]
        },
        optimizationSuggestions: {
            type: Type.ARRAY,
            description: "Lista de 2 a 3 sugerencias concretas y accionables para optimizar futuras versiones del reporte.",
            items: { type: Type.STRING }
        }
    },
    required: ["detailedAnalysis", "areasForImprovement", "qualityEvaluation", "optimizationSuggestions"]
};

export const getReportFeedback = async (text: string): Promise<ReportFeedback> => {
     const prompt = `
     Actúa como un consultor de comunicación y análisis de datos. Evalúa la calidad del siguiente reporte de negocio. Tu feedback debe ser constructivo, profesional y orientado a la mejora. Proporciona una evaluación completa en el formato JSON especificado. Considera la claridad, la estructura, la presentación de datos y la efectividad de las conclusiones.

     Texto del reporte:
     ---
     ${text}
     ---
     `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: feedbackSchema,
                temperature: 0.3
            }
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);
        return result as ReportFeedback;

    } catch (error) {
        console.error("Error calling Gemini API for feedback:", error);
        throw new Error("No se pudo obtener una respuesta válida del servicio de IA para el feedback.");
    }
};

const consolidatedSchema = {
    type: Type.OBJECT,
    properties: {
        strategicSummary: {
            type: Type.STRING,
            description: "Un resumen ejecutivo de alto nivel que sintetiza los hallazgos más importantes de todos los departamentos, ofreciendo una visión global del estado del negocio."
        },
        crossDepartmentInsights: {
            type: Type.ARRAY,
            description: "Una lista de 2 a 4 insights clave que surgen de la combinación de información entre diferentes departamentos (ej. 'El aumento en leads de Marketing está presionando la capacidad del equipo de Soporte').",
            items: { type: Type.STRING }
        },
        businessRecommendations: {
            type: Type.ARRAY,
            description: "Una lista de 3 a 5 recomendaciones estratégicas y accionables para el negocio en general, basadas en el análisis consolidado.",
            items: { type: Type.STRING }
        }
    },
    required: ["strategicSummary", "crossDepartmentInsights", "businessRecommendations"]
};

export const getConsolidatedAnalysis = async (reports: { role: ReportRole; text: string }[]): Promise<ConsolidatedAnalysis> => {

    const reportSummaries = reports.map(r => `--- DEPARTAMENTO: ${r.role} ---\n${r.text.substring(0, 3000)}...\n--- FIN DEPARTAMENTO: ${r.role} ---`).join('\n\n');

    const prompt = `
    Actúa como un Director de Estrategia (Chief Strategy Officer). Has recibido reportes de varios departamentos clave. Tu tarea es analizarlos en conjunto para crear un análisis consolidado que ofrezca una visión estratégica del negocio. Identifica sinergias, conflictos, tendencias emergentes y oportunidades. Proporciona tu análisis en el formato JSON especificado.

    Textos de los reportes:
    ${reportSummaries}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: consolidatedSchema,
                temperature: 0.5
            }
        });
        
        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);
        return result as ConsolidatedAnalysis;

    } catch (error) {
        console.error("Error calling Gemini API for consolidated analysis:", error);
        throw new Error("No se pudo generar el análisis consolidado desde el servicio de IA.");
    }
};


export const askConsolidatedQuestion = async (context: ConsolidatedAnalysis, question: string, history: ChatMessage[]): Promise<string> => {
    
    const contextString = `
    Resumen Estratégico: ${context.strategicSummary}
    Insights Clave: ${context.crossDepartmentInsights.join('; ')}
    Recomendaciones de Negocio: ${context.businessRecommendations.join('; ')}
    `;

    const historyString = history.map(msg => `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.text}`).join('\n');

    const prompt = `
    Eres un Asistente de Estrategia de IA. Tu propósito es responder preguntas basadas ÚNICAMENTE en el análisis consolidado y el historial de conversación que se te proporciona. Sé conciso, directo y mantente dentro del contexto de los datos. No inventes información.

    --- CONTEXTO DEL ANÁLISIS CONSOLIDADO ---
    ${contextString}
    --- FIN DEL CONTEXTO ---

    --- HISTORIAL DE LA CONVERSACIÓN ---
    ${historyString}
    --- FIN DEL HISTORIAL ---

    Pregunta del usuario: "${question}"

    Responde directamente a la pregunta del usuario.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                temperature: 0.4,
            }
        });
        
        return response.text;

    } catch (error) {
        console.error("Error calling Gemini API for chat question:", error);
        throw new Error("No se pudo obtener una respuesta del asistente de IA.");
    }
};