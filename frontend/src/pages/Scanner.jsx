import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, FileText, ScanLine, Sparkles } from "lucide-react";

import FileUploader from "../components/FileUploader";
import MarkdownRenderer from "../components/MarkdownRenderer";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

const reveal = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

export default function Scanner() {
  const [error, setError] = useState(null);
  const [ocrText, setOcrText] = useState("");
  const [summary, setSummary] = useState("");
  const [keyPoints, setKeyPoints] = useState([]);

  const tasks = useMemo(() => [{ value: "summarization", label: "Analyze file" }], []);

  const onFileProcessed = (data) => {
    setError(null);

    if (!data?.success) {
      setSummary("");
      setKeyPoints([]);
      setOcrText("");
      setError(data?.message || "No text detected. Please upload a clearer file.");
      return;
    }

    if (data?.ocr) {
      const extracted = data?.ocr?.text || "";
      setOcrText(extracted);
      const ai = data?.ai_analysis || {};
      setSummary(ai?.summary || "");
      setKeyPoints(Array.isArray(ai?.key_points) ? ai.key_points : []);
      return;
    }

    const processedText = data?.processed_data?.text || data?.processed_data?.ocr?.text || "";
    setOcrText(processedText);
    const ai = data?.ai_analysis || {};
    setSummary(ai?.summary || "");
    setKeyPoints(Array.isArray(ai?.key_points) ? ai.key_points : []);
  };

  const hasResults = summary || keyPoints.length > 0 || ocrText;

  return (
    <div className="premium-shell space-y-4">
      <motion.div variants={reveal} initial="hidden" animate="show">
        <Card className="glass-panel overflow-hidden">
          <CardHeader className="relative">
            <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-cyan-500/20 blur-2xl" />
            <CardTitle className="flex items-center gap-2 text-xl">
              <ScanLine className="h-5 w-5 text-cyan-300" />
              Smart Scanner
            </CardTitle>
            <CardDescription>Upload any study asset and convert it into structured, high-signal insights.</CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader
              acceptedTypes="all"
              endpointPath="/ai/upload-file"
              tasks={tasks}
              onFileProcessed={onFileProcessed}
              onError={setError}
            />
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      </motion.div>

      {hasResults && (
        <motion.div variants={reveal} initial="hidden" animate="show" transition={{ delay: 0.05 }} className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-4 w-4 text-violet-300" />
                AI Summary
              </CardTitle>
              <CardDescription>Concise summary and extraction points generated from the uploaded source.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {summary ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <MarkdownRenderer content={summary} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No summary generated yet.</p>
              )}

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Key points</p>
                {keyPoints.length > 0 ? (
                  <ul className="space-y-2">
                    {keyPoints.map((point, index) => (
                      <li key={index} className="rounded-xl border border-white/15 bg-background/50 p-2 text-sm dark:border-white/10">
                        {point}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No key points identified.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-cyan-300" />
                Extracted OCR Text
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Badge variant="outline">OCR</Badge>
                <Badge className="bg-violet-500/80 text-white">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Enriched
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ocrText ? (
                <pre className="custom-scrollbar max-h-[520px] overflow-y-auto whitespace-pre-wrap rounded-xl border border-white/15 bg-background/55 p-3 text-xs leading-5 text-muted-foreground dark:border-white/10">
                  {ocrText}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">OCR output appears here once analysis is complete.</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
