"use client";

import React from 'react';
import { X, Download } from 'lucide-react';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfBlobUrl: string | null;
  fileName: string;
  onDownload: () => void;
}

export default function PDFPreviewModal({
  isOpen,
  onClose,
  pdfBlobUrl,
  fileName,
  onDownload,
}: PDFPreviewModalProps) {
  if (!isOpen || !pdfBlobUrl) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {/* Modal Container */}
      <div className="relative w-[95vw] h-[95vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">PDF Preview</h2>
            <p className="text-sm text-gray-600 mt-1">{fileName}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onDownload}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200"
            >
              <X className="h-4 w-4" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* PDF Preview */}
        <div className="flex-1 overflow-auto bg-gray-100 p-6">
          <iframe
            src={pdfBlobUrl}
            className="w-full h-full bg-white shadow-lg rounded-lg"
            title="PDF Preview"
            style={{ minHeight: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}
