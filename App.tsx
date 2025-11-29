import React, { useState } from 'react';
import './App.css';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [showApiForm, setShowApiForm] = useState(true);

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      setShowApiForm(false);
      localStorage.setItem('gemini_api_key', apiKey);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !apiKey) return;

    setLoading(true);
    setResult('');

    try {
      const text = await file.text();
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analiza el siguiente texto de un PDF:\n\n${text}\n\nProporciona:\n1. Resumen ejecutivo\n2. Puntos clave\n3. Recomendaciones`
            }]
          }]
        })
      });

      const data = await response.json();
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        setResult(data.candidates[0].content.parts[0].text);
      } else {
        setResult('Error: No se pudo procesar el archivo');
      }
    } catch (error) {
      setResult('Error al procesar: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangeApiKey = () => {
    setShowApiForm(true);
    setFile(null);
    setResult('');
  };

  return (
    <div className="app">
      <div className="container">
        <h1>📄 Analizador de Reportes PDF con IA</h1>
        <p className="subtitle">Analiza documentos con Google Gemini</p>

        {showApiForm ? (
          <form onSubmit={handleApiKeySubmit} className="api-key-form">
            <div className="form-group">
              <label htmlFor="apiKey">
                🔑 Ingresa tu API Key de Google Gemini
              </label>
              <input
                id="apiKey"
                type="password"
                placeholder="Pega tu API Key aquí"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
              <small>
                Obtén tu API Key gratis en:{' '}
                <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                  Google AI Studio
                </a>
              </small>
            </div>
            <button type="submit" className="btn-primary">
              Conectar API Key
            </button>
          </form>
        ) : (
          <div className="analysis-form">
            <div className="api-status">
              ✅ API Key conectada
              <button className="btn-small" onClick={handleChangeApiKey}>
                Cambiar API Key
              </button>
            </div>

            <form onSubmit={handleAnalyze} className="form">
              <div className="form-group">
                <label htmlFor="file">
                  📤 Sube tu PDF aquí
                </label>
                <input
                  id="file"
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileUpload}
                  required
                />
                {file && <p className="file-name">📋 {file.name}</p>}
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={!file || loading}
              >
                {loading ? '⏳ Analizando...' : '🚀 Analizar Documento'}
              </button>
            </form>

            {result && (
              <div className="result">
                <h2>📊 Análisis Completo</h2>
                <div className="result-content">
                  {result}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
