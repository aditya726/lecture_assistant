import { useMemo, useState } from 'react';
import GlassCard from '../components/ui/GlassCard';
import FileUploader from '../components/FileUploader';
import MarkdownRenderer from '../components/MarkdownRenderer';

export default function HandwrittenNotes() {
  const [error, setError] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [summary, setSummary] = useState('');
  const [keyPoints, setKeyPoints] = useState([]);

  const tasks = useMemo(
    () => [
      {
        value: 'summarization',
        label: 'Summarize',
        className:
          'px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm border border-input',
      },
    ],
    []
  );

  const onFileProcessed = (data) => {
    setError(null);

    if (!data?.success) {
      setSummary('');
      setKeyPoints([]);
      setOcrText('');
      setError(data?.message || 'No text detected by OCR. Try a clearer image.');
      return;
    }

    // /ai/ocr-analyze-image response
    if (data?.ocr) {
      const extracted = data?.ocr?.text || '';
      setOcrText(extracted);
      const ai = data?.ai_analysis || {};
      setSummary(ai?.summary || '');
      setKeyPoints(Array.isArray(ai?.key_points) ? ai.key_points : []);
      return;
    }

    // /ai/upload-file response
    const processedText = data?.processed_data?.text || (data?.processed_data?.ocr?.text || '');
    setOcrText(processedText);
    const ai = data?.ai_analysis || {};
    setSummary(ai?.summary || '');
    setKeyPoints(Array.isArray(ai?.key_points) ? ai.key_points : []);
  };

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Upload your handwritten notes to summarize
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload an image or PDF. We’ll extract text (OCR if needed) and generate a summary.
        </p>
      </div>

      <GlassCard className="p-6">
        <FileUploader
          acceptedTypes="all"
          endpointPath="/ai/upload-file"
          tasks={tasks}
          onFileProcessed={onFileProcessed}
          onError={setError}
        />

        {error ? (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}
      </GlassCard>

      {(summary || (keyPoints && keyPoints.length > 0) || ocrText) && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard className="p-6">
            <h2 className="text-base font-semibold text-foreground mb-3">Summary</h2>
            {summary ? (
              <div className="text-sm text-foreground/90">
                <MarkdownRenderer content={summary} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No summary yet.</p>
            )}
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-base font-semibold text-foreground mb-3">Key points</h2>
            {keyPoints && keyPoints.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1 text-sm text-foreground/90">
                {keyPoints.map((kp, idx) => (
                  <li key={idx}>{kp}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No key points yet.</p>
            )}
          </GlassCard>

          <GlassCard className="p-6 lg:col-span-2">
            <h2 className="text-base font-semibold text-foreground mb-3">Extracted text (OCR)</h2>
            {ocrText ? (
              <pre className="whitespace-pre-wrap text-sm text-foreground/90 rounded-xl border border-input bg-card/50 p-4">
                {ocrText}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">
                OCR text will appear here after processing.
              </p>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}
