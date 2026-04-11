import { useRef, useState } from "react";
import { File, FileText, Image, Loader2, Upload, Video, X } from "lucide-react";

import api from "../services/api";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { cn } from "../lib/utils";

const DEFAULT_TASKS = [
  { value: "summarization", label: "Summarize" },
  { value: "topic_extraction", label: "Extract Topics" },
  { value: "keyword_extraction", label: "Extract Keywords" },
];

export default function FileUploader({
  onFileProcessed,
  onError,
  acceptedTypes = "all",
  endpointPath = "/ai/upload-file",
  tasks = DEFAULT_TASKS,
}) {
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
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext)) return Image;
    if (["mp4", "avi", "mov", "mkv", "webm"].includes(ext)) return Video;
    if (["pdf", "docx", "txt"].includes(ext)) return FileText;
    return File;
  };

  const handleFileSelect = (file) => {
    if (file) setSelectedFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  const uploadFile = async (task = "summarization") => {
    if (!selectedFile) return;
    setIsUploading(true);

    try {
      const resolvedEndpointPath = typeof endpointPath === "function" ? endpointPath(selectedFile) : endpointPath;
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("task", task);

      const response = await api.post(resolvedEndpointPath, formData);
      onFileProcessed?.(response.data);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      const detail = error?.response?.data?.detail || error?.response?.data?.message || error?.message;
      onError?.(detail ? String(detail) : "Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const FileIcon = selectedFile ? getFileIcon(selectedFile.name) : Upload;

  return (
    <Card
      className={cn(
        "border-dashed p-6 transition-colors",
        dragActive ? "border-primary bg-primary/5" : "border-border"
      )}
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
        onChange={(e) => handleFileSelect(e.target.files?.[0])}
        disabled={isUploading}
      />

      {!selectedFile ? (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              Choose file
            </Button>
            <p className="text-sm text-muted-foreground">or drag and drop your document, image, audio, or video file</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
            <div className="rounded-md bg-muted p-2">
              <FileIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            {!isUploading && (
              <Button size="icon" variant="ghost" onClick={removeFile} aria-label="Remove file">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {!isUploading ? (
            <div className="flex flex-wrap gap-2">
              {(tasks || DEFAULT_TASKS).map((task) => (
                <Button key={task.value} type="button" variant="secondary" onClick={() => uploadFile(task.value)}>
                  {task.label}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing file...
              <Badge variant="outline">AI</Badge>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
