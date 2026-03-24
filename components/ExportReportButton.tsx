'use client';

import { useState } from 'react';
import { Download, Table, ChevronDown } from 'lucide-react';
import { generateCSVReport, downloadCSV } from '@/lib/reportGenerator';

interface ExportReportButtonProps {
  project: any;
  tasks: any[];
}

export default function ExportReportButton({ project, tasks }: ExportReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleExportCSV = () => {
    setGenerating(true);
    try {
      const csvContent = generateCSVReport(project, tasks);
      const filename = `${project.name.replace(/[^a-z0-9]/gi, '_')}_cost_report_${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csvContent, filename);
    } catch (error) {
      console.error('Error generating CSV:', error);
    } finally {
      setGenerating(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={generating}
        className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        {generating ? 'Generating...' : 'Export Report'}
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1 w-48 bg-white border rounded-lg shadow-lg z-20">
            <button
              onClick={handleExportCSV}
              className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 rounded-lg"
            >
              <Table className="w-4 h-4 text-green-600" />
              Export as CSV
            </button>
          </div>
        </>
      )}
    </div>
  );
}
