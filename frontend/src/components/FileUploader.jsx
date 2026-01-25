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
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
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
            <Upload className="w-12 h-12 mx-auto text-gray-400" />
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-700 font-medium"
                disabled={isUploading}
              >
                Choose a file
              </button>
              <span className="text-gray-500"> or drag and drop</span>
            </div>
            <p className="text-xs text-gray-500">
              PDF, DOCX, TXT, Images, Videos (max 50MB)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 bg-gray-50 rounded-lg p-3">
              <div className="text-blue-600">
                {getFileIcon(selectedFile.name)}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {!isUploading && (
                <button
                  onClick={removeFile}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {!isUploading ? (
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => uploadFile('summarization')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Summarize
                </button>
                <button
                  onClick={() => uploadFile('topic_extraction')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                >
                  Extract Topics
                </button>
                <button
                  onClick={() => uploadFile('keyword_extraction')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Extract Keywords
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-blue-600">
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
