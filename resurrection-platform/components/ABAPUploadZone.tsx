'use client';

import { useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { halloweenToast } from '@/lib/toast';

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  file: File;
  valid: boolean;
  error?: string;
}

interface ABAPUploadZoneProps {
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

export function ABAPUploadZone({ 
  onFilesChange, 
  maxFiles = 10,
  maxSizeMB = 10 
}: ABAPUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [validationInProgress, setValidationInProgress] = useState(false);

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Check file extension
    const validExtensions = ['.abap', '.txt'];
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(extension)) {
      return {
        valid: false,
        error: `Invalid format: must be .abap or .txt`
      };
    }

    // Check file size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return {
        valid: false,
        error: `File too large: exceeds ${maxSizeMB}MB`
      };
    }

    // Check if file is empty
    if (file.size === 0) {
      return {
        valid: false,
        error: 'File is empty'
      };
    }

    return { valid: true };
  }, [maxSizeMB]);

  const handleFiles = useCallback(async (fileList: FileList) => {
    setValidationInProgress(true);

    const newFiles: UploadedFile[] = [];
    let hasErrors = false;

    // Check max files limit
    if (files.length + fileList.length > maxFiles) {
      halloweenToast.error(
        '🦇 Too Many Files',
        `Maximum ${maxFiles} files allowed. You tried to add ${fileList.length} more.`
      );
      setValidationInProgress(false);
      return;
    }

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const validation = validateFile(file);

      newFiles.push({
        name: file.name,
        size: file.size,
        type: file.type || 'text/plain',
        file: file,
        valid: validation.valid,
        error: validation.error,
      });

      if (!validation.valid) {
        hasErrors = true;
      }
    }

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);

    if (hasErrors) {
      halloweenToast.warning(
        '⚠️ Some Files Invalid',
        'Check the file list for validation errors'
      );
    } else {
      halloweenToast.success(
        '✨ Files Added',
        `${newFiles.length} file${newFiles.length !== 1 ? 's' : ''} ready for resurrection`
      );
    }

    setValidationInProgress(false);
  }, [files, maxFiles, validateFile, onFilesChange]);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  const removeFile = useCallback((index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
    
    halloweenToast.info('🗑️ File Removed', 'File banished from the ritual');
  }, [files, onFilesChange]);

  const clearAll = useCallback(() => {
    setFiles([]);
    onFilesChange([]);
    halloweenToast.info('🧹 All Files Cleared', 'Starting fresh');
  }, [onFilesChange]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const validFiles = files.filter(f => f.valid);
  const invalidFiles = files.filter(f => !f.valid);

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card className="border-2 border-[#5b21b6] bg-[#2e1065]/30">
        <CardHeader>
          <CardTitle className="text-2xl text-[#FF6B35] flex items-center gap-2">
            <span>📜</span>
            Upload ABAP Files
          </CardTitle>
          <CardDescription className="text-[#a78bfa]">
            Drag and drop your .abap or .txt files, or click to browse (max {maxFiles} files, {maxSizeMB}MB each)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              relative border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300
              ${
                isDragging
                  ? 'border-[#FF6B35] bg-[#2e1065]/50 shadow-[0_0_30px_rgba(255,107,53,0.4)] scale-[1.02]'
                  : 'border-[#5b21b6] hover:border-[#8b5cf6] hover:bg-[#2e1065]/20'
              }
              ${validationInProgress ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            {/* Floating Ghost Animation */}
            <div className="absolute top-4 right-4">
              <span className="text-4xl animate-ghost-float">👻</span>
            </div>
            
            {/* Additional spooky decorations */}
            <div className="absolute top-4 left-4">
              <span className="text-2xl animate-float" style={{ animationDelay: '0.5s' }}>🦇</span>
            </div>
            <div className="absolute bottom-4 right-4">
              <span className="text-2xl animate-float" style={{ animationDelay: '1s' }}>🕷️</span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-center">
                <div className={`w-20 h-20 rounded-full bg-[#2e1065] border-2 border-[#5b21b6] flex items-center justify-center transition-all duration-300 ${
                  isDragging ? 'animate-eerie-glow scale-110' : 'animate-pulse-glow'
                }`}>
                  <span className="text-4xl">{isDragging ? '📥' : '📤'}</span>
                </div>
              </div>

              <div>
                <p className="text-lg text-[#F7F7FF] mb-2">
                  {isDragging 
                    ? '👻 Release to summon files...' 
                    : validationInProgress
                    ? '🔮 Validating files...'
                    : 'Drop your ABAP files here'}
                </p>
                <p className="text-sm text-[#a78bfa]">or</p>
              </div>

              <div>
                <input
                  type="file"
                  id="file-input"
                  multiple
                  accept=".abap,.txt"
                  onChange={handleFileInput}
                  className="hidden"
                  disabled={validationInProgress}
                />
                <label htmlFor="file-input">
                  <Button
                    type="button"
                    disabled={validationInProgress}
                    className="bg-[#FF6B35] hover:bg-[#E85A2A] text-[#F7F7FF] shadow-[0_0_20px_rgba(255,107,53,0.3)] disabled:opacity-50"
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    <span className="mr-2">🔮</span>
                    {validationInProgress ? 'Validating...' : 'Browse Files'}
                  </Button>
                </label>
              </div>

              <p className="text-xs text-[#6b7280]">
                Supported formats: .abap, .txt • Max {maxSizeMB}MB per file • Max {maxFiles} files
              </p>
            </div>
          </div>

          {/* Real-time Validation Progress */}
          {validationInProgress && (
            <div className="mt-4">
              <Progress value={100} className="h-2 animate-pulse" />
              <p className="text-sm text-[#a78bfa] text-center mt-2">
                🔍 Validating files...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <Card className="border-2 border-[#5b21b6] bg-[#2e1065]/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-[#FF6B35] flex items-center gap-2">
                <span>⚰️</span>
                Summoned Files ({files.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-[#10B981] text-[#10B981]">
                  ✓ {validFiles.length} valid
                </Badge>
                {invalidFiles.length > 0 && (
                  <Badge variant="outline" className="border-[#DC2626] text-[#DC2626]">
                    ✗ {invalidFiles.length} invalid
                  </Badge>
                )}
                <Badge variant="outline" className="border-[#8b5cf6] text-[#a78bfa]">
                  Total: {formatSize(totalSize)}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                  className="border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626]/10"
                >
                  Clear All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {files.map((file, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                    file.valid
                      ? 'bg-[#1a0f2e] border border-[#5b21b6] hover:border-[#8b5cf6]'
                      : 'bg-[#DC2626]/10 border border-[#DC2626]'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">
                      {file.valid ? '📄' : '⚠️'}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${file.valid ? 'text-[#F7F7FF]' : 'text-[#DC2626]'}`}>
                          {file.name}
                        </p>
                        {file.valid && (
                          <Badge variant="outline" className="border-[#10B981] text-[#10B981] text-xs">
                            ✓ Valid
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-[#a78bfa]">{formatSize(file.size)}</p>
                        {file.error && (
                          <p className="text-sm text-[#DC2626]">• {file.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626]/10"
                  >
                    <span>🗑️</span>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Summary */}
      {invalidFiles.length > 0 && (
        <Card className="border-2 border-[#DC2626] bg-[#DC2626]/10">
          <CardContent className="pt-6">
            <h4 className="text-[#DC2626] font-semibold mb-3 flex items-center gap-2">
              <span>⚠️</span>
              Validation Errors ({invalidFiles.length})
            </h4>
            <ul className="space-y-2">
              {invalidFiles.map((file, index) => (
                <li key={index} className="text-sm text-[#DC2626] flex items-start gap-2">
                  <span>•</span>
                  <span><strong>{file.name}:</strong> {file.error}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-[#a78bfa] mt-3">
              Fix these errors before proceeding with the resurrection ritual.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
