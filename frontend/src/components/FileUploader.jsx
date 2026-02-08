import { useState, useRef } from 'react';
import { Upload, File, X, Loader2, FileText, Image, Video } from 'lucide-react';

export default function FileUploader({ onFileProcessed, onError, acceptedTypes = "all" }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const getAcceptString = () => {
    switch (acceptedTypes) {
      case "documents":
        return ".pdf,.docx,.txt";
      case "images":
        return "image/*";
      case "videos":
        return "video/*";
      case "audio":
        return "audio/*";
      default:
        return ".pdf,.docx,.txt,image/*,video/*,audio/*";
    }
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
      return <Image className="w-5 h-5" />;
    } else if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) {
      return <Video className="w-5 h-5" />;
    } else if (['pdf', 'docx', 'txt'].includes(ext)) {
      return <FileText className="w-5 h-5" />;
    }
    return <File className="w-5 h-5" />;
  };

  const handleFileSelect = (file) => {
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const uploadFile = async (task = "summarization") => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('task', task);

      const response = await fetch('http://localhost:8000/api/v1/ai/upload-file', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      if (onFileProcessed) {
        onFileProcessed(data);
      }

      // Clear selection after successful upload
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      if (onError) {
        onError('Failed to upload file. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      {/* Drag and Drop Zone */}
      <div
        className={`relative rounded-2xl p-6 text-center transition-colors border ${
          dragActive 
            ? 'border-primary/40 bg-primary/10' 
            : 'border-input bg-card hover:bg-card/80'
        } backdrop-blur`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={getAcceptString()}
          onChange={handleChange}
          disabled={isUploading}
        />

        {!selectedFile ? (
          <div className="space-y-2">
            <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-primary hover:text-primary/80 font-medium"
                disabled={isUploading}
              >
                Choose a file
              </button>
              <span className="text-muted-foreground"> or drag and drop</span>
            </div>
            <p className="text-xs text-muted-foreground">
              PDF, DOCX, TXT, Images, Videos (max 50MB)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 bg-card border border-input backdrop-blur rounded-xl p-3 text-foreground">
              <div className="text-primary">
                {getFileIcon(selectedFile.name)}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {!isUploading && (
                <button
                  onClick={removeFile}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {!isUploading ? (
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => uploadFile('summarization')}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm border border-input"
                >
                  Summarize
                </button>
                <button
                  onClick={() => uploadFile('topic_extraction')}
                  className="px-4 py-2 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 text-sm border border-input"
                >
                  Extract Topics
                </button>
                <button
                  onClick={() => uploadFile('keyword_extraction')}
                  className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 text-sm border border-input"
                >
                  Extract Keywords
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-foreground dark:text-white/80">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Processing...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
