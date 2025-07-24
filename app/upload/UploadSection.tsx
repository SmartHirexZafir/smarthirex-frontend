
'use client';

import { useState, useRef } from 'react';

export default function UploadSection({ onFileUpload, uploadedFiles }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [processingFiles, setProcessingFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const processFiles = (files) => {
    const newProcessingFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'processing'
    }));

    setProcessingFiles(newProcessingFiles);

    // Simulate file processing
    newProcessingFiles.forEach((file, index) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          // Simulate parsed data
          const parsedData = {
            ...file,
            progress: 100,
            status: 'completed',
            parsedData: {
              name: `Candidate ${index + 1}`,
              email: `candidate${index + 1}@email.com`,
              phone: `+1 (555) 123-456${index}`,
              skills: ['JavaScript', 'React', 'Node.js', 'Python'][Math.floor(Math.random() * 4)],
              experience: `${Math.floor(Math.random() * 8) + 1} years`,
              location: ['New York', 'San Francisco', 'Austin', 'Seattle'][Math.floor(Math.random() * 4)]
            }
          };
          
          setProcessingFiles(prev => 
            prev.map(f => f.id === file.id ? parsedData : f)
          );
        } else {
          setProcessingFiles(prev => 
            prev.map(f => f.id === file.id ? { ...f, progress } : f)
          );
        }
      }, 100);
    });

    onFileUpload(newProcessingFiles);
  };

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 p-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
      
      <div className="relative z-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Resume Files</h2>
          <p className="text-gray-600">Drag & drop your resume files or click to browse</p>
        </div>

        {/* Upload Zone */}
        <div 
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
            isDragOver 
              ? 'border-blue-500 bg-blue-50/50 transform scale-105' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="relative z-10">
            <div className={`w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center transform transition-all duration-300 shadow-lg ${
              isDragOver ? 'scale-110 rotate-12' : 'hover:scale-105'
            }`}>
              <i className="ri-upload-cloud-2-line text-4xl text-white"></i>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              {isDragOver ? 'Drop files here' : 'Drop files or click to upload'}
            </h3>
            <p className="text-gray-600 mb-6">
              Transform your hiring process with AI-powered resume screening
            </p>
            <button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200 shadow-md">
              <i className="ri-folder-open-line mr-2"></i>
              Choose Files
            </button>
            <p className="text-sm text-gray-500 mt-4">
              <i className="ri-information-line mr-1"></i>
              Only PDF and DOCX files up to 10MB are supported
            </p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Processing Files */}
        {processingFiles.length > 0 && (
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Files</h3>
            {processingFiles.map((file) => (
              <div key={file.id} className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/50 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <i className="ri-file-text-line text-blue-600 text-xl"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {file.status === 'processing' && (
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {file.status === 'completed' && (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <i className="ri-check-line text-white text-sm"></i>
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-900 min-w-[40px]">{Math.round(file.progress)}%</span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${file.progress}%` }}
                  ></div>
                </div>

                {/* Parsed Data */}
                {file.status === 'completed' && file.parsedData && (
                  <div className="bg-white/80 rounded-xl p-4 border border-gray-200/50">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <i className="ri-check-circle-line text-green-500 mr-2"></i>
                      Extracted Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <span className="ml-2 font-medium">{file.parsedData.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <span className="ml-2 font-medium">{file.parsedData.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Experience:</span>
                        <span className="ml-2 font-medium">{file.parsedData.experience}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Location:</span>
                        <span className="ml-2 font-medium">{file.parsedData.location}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
