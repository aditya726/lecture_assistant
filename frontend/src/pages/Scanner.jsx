import { useMemo, useState } from 'react';
import GlassCard from '../components/ui/GlassCard';
import FileUploader from '../components/FileUploader';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { ScanLine, FileText, CheckCircle, Sparkles, LayoutPanelLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import '../workspace.css';

export default function Scanner() {
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
          'px-4 py-2 rounded-xl bg-[#d97757] text-white hover:bg-[#bf6548] text-sm font-medium border border-[rgba(255,255,255,0.1)] transition-all',
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

    if (data?.ocr) {
      const extracted = data?.ocr?.text || '';
      setOcrText(extracted);
      const ai = data?.ai_analysis || {};
      setSummary(ai?.summary || '');
      setKeyPoints(Array.isArray(ai?.key_points) ? ai.key_points : []);
      return;
    }

    const processedText = data?.processed_data?.text || (data?.processed_data?.ocr?.text || '');
    setOcrText(processedText);
    const ai = data?.ai_analysis || {};
    setSummary(ai?.summary || '');
    setKeyPoints(Array.isArray(ai?.key_points) ? ai.key_points : []);
  };

  const hasResults = summary || (keyPoints && keyPoints.length > 0) || ocrText;

  return (
    <div className="workspace-layout overflow-y-auto w-full h-[calc(100vh-56px)] custom-scrollbar">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 pb-20">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mb-8"
        >
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
             <div className="bg-[#d97757]/12 p-2.5 rounded-xl border border-[#d97757]/28">
               <ScanLine className="w-7 h-7 text-[#f0b39e]" /> 
             </div>
             AI Smart Scanner
          </h1>
          <p className="text-muted-foreground mt-2 font-medium max-w-2xl">
            Upload images, PDFs, or handwritten notes. Our visual AI engine extracts text, structuring the chaos into clean summaries and key actionable insights.
          </p>
        </motion.div>

        {/* Upload Section */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="workspace-panel p-1 rounded-3xl mb-8"
        >
          <div className="bg-[#181b21] rounded-[22px] p-6 sm:p-8 h-full border border-white/10 relative overflow-hidden">
             
             {/* Decorative background glow inside the upload card */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-[#d97757]/10 rounded-full blur-[80px] pointer-events-none" />

             <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2">
                   <Sparkles className="w-5 h-5 text-[#f0b39e]" />
                   <h2 className="text-lg font-semibold text-[#f4f1ed]">Input Source</h2>
                </div>
                
                <FileUploader
                  acceptedTypes="all"
                  endpointPath="/ai/upload-file"
                  tasks={tasks}
                  onFileProcessed={onFileProcessed}
                  onError={setError}
                />

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-400 flex items-center gap-3 font-medium"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    {error}
                  </motion.div>
                )}
             </div>
          </div>
        </motion.div>

        {/* Results Section */}
        {hasResults && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left Column: AI Summary & Key Points */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              <div className="workspace-panel rounded-3xl p-1 relative group overflow-hidden">
                <div className="absolute inset-0 bg-[#d97757]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="bg-[#181b21]/90 backdrop-blur-xl rounded-[22px] p-6 h-full border border-white/10 relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-[#d97757]/15 p-1.5 rounded-lg">
                       <CheckCircle className="w-4 h-4 text-[#f0b39e]" />
                    </div>
                    <h2 className="text-base font-semibold text-[#f4f1ed]">AI Summary</h2>
                  </div>
                  {summary ? (
                    <div className="text-sm text-[#ece3dc]/85 leading-relaxed whitespace-pre-wrap">
                      <MarkdownRenderer content={summary} />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground/60 italic">No summary generated.</p>
                  )}
                </div>
              </div>

              <div className="workspace-panel rounded-3xl p-1 relative group overflow-hidden">
                <div className="bg-[#181b21]/90 backdrop-blur-xl rounded-[22px] p-6 h-full border border-white/10 relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-[#7ea389]/15 p-1.5 rounded-lg">
                       <LayoutPanelLeft className="w-4 h-4 text-[#b9d0be]" />
                    </div>
                    <h2 className="text-base font-semibold text-[#f4f1ed]">Key Extraction Points</h2>
                  </div>
                  {keyPoints && keyPoints.length > 0 ? (
                    <ul className="space-y-3">
                      {keyPoints.map((kp, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-[#ece3dc]/85 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/[0.05]">
                          <span className="text-[#b9d0be] mt-0.5 shrink-0">-</span>
                          {kp}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground/60 italic">No key points identified.</p>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column: OCR Raw Text */}
            <div className="lg:col-span-5">
              <div className="workspace-panel rounded-3xl p-1 h-full relative group">
                 <div className="bg-[#181b21]/90 backdrop-blur-xl rounded-[22px] p-6 h-full border border-white/10 flex flex-col">
                  <div className="flex items-center gap-2 mb-4 shrink-0">
                    <div className="bg-[#b89b67]/15 p-1.5 rounded-lg">
                      <FileText className="w-4 h-4 text-[#dfc8a1]" />
                    </div>
                    <h2 className="text-base font-semibold text-[#f4f1ed]">Raw OCR Text</h2>
                  </div>
                  {ocrText ? (
                    <div className="flex-1 min-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                       <pre className="whitespace-pre-wrap text-[13px] text-muted-foreground/70 font-mono leading-relaxed p-4 rounded-xl bg-black/20 border border-white/[0.03]">
                         {ocrText}
                       </pre>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground/60 italic mt-2">
                      OCR text will appear here after processing.
                    </p>
                  )}
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </div>
    </div>
  );
}
