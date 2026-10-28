'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Download,
  RefreshCw,
  X,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Modal } from '@/components/admin/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/hooks/useToast';
import { importExportService } from '@/services/importExportService';
import {
  ImporterDefinition,
  ImportUploadResponse,
  PreviewMappingResponse,
  ImportRecord,
} from '@/types/importExport';
import { cn } from '@/lib/utils';

interface ImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  importer: ImporterDefinition | null;
  onComplete?: () => void;
}

export function ImportWizard({ isOpen, onClose, importer, onComplete }: ImportWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadData, setUploadData] = useState<ImportUploadResponse | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'update' | 'error'>('skip');
  const [isValidating, setIsValidating] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewMappingResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalResult, setFinalResult] = useState<ImportRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFile(null);
      setUploadData(null);
      setColumnMapping({});
      setPreviewData(null);
      setFinalResult(null);
      setDuplicateStrategy(importer?.duplicate_strategy || 'skip');
    }
  }, [isOpen, importer]);

  // Step 1: Upload File
  const handleFileUpload = async (selectedFile: File) => {
    if (!importer) return;
    setFile(selectedFile);
    setIsUploading(true);

    try {
      const res = await importExportService.uploadFile(importer.key, selectedFile);
      if (res.data) {
        setUploadData(res.data);
        setColumnMapping(res.data.suggested_mapping || {});
        setStep(2);
      }
    } catch (err: unknown) {
      toast.error('Upload Failed', (err as { message?: string })?.message || 'Could not parse spreadsheet.');
    } finally {
      setIsUploading(false);
    }
  };

  // Step 2 -> Step 3: Validate & Preview Mapping
  const handlePreview = async () => {
    if (!uploadData) return;
    setIsValidating(true);

    try {
      const res = await importExportService.previewMapping(uploadData.import.uuid, columnMapping);
      if (res.data) {
        setPreviewData(res.data);
        setStep(3);
      }
    } catch (err: unknown) {
      toast.error('Preview Error', (err as { message?: string })?.message || 'Validation preview failed.');
    } finally {
      setIsValidating(false);
    }
  };

  // Step 4 -> Step 5: Start Processing
  const handleStartImport = async () => {
    if (!uploadData) return;
    setIsProcessing(true);
    setStep(5);

    try {
      const res = await importExportService.processImport(
        uploadData.import.uuid,
        columnMapping,
        { duplicate_strategy: duplicateStrategy }
      );
      if (res.data) {
        setFinalResult(res.data);
        if (res.data.status === 'processing') {
          pollProgress(res.data.uuid);
        } else {
          setIsProcessing(false);
          if (onComplete) onComplete();
        }
      }
    } catch (err: unknown) {
      setIsProcessing(false);
      toast.error('Import Failed', (err as { message?: string })?.message || 'Processing failed.');
    }
  };

  const pollProgress = (uuid: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await importExportService.getProgress(uuid);
        if (res.data) {
          setFinalResult(res.data);
          if (['completed', 'completed_with_errors', 'failed'].includes(res.data.status)) {
            clearInterval(interval);
            setIsProcessing(false);
            if (onComplete) onComplete();
          }
        }
      } catch {
        clearInterval(interval);
        setIsProcessing(false);
      }
    }, 1500);
  };

  const fieldOptions = [
    { label: '— Ignore Column —', value: '__ignore__' },
    ...(importer?.fields.map((f) => ({
      label: `${f.label}${f.required ? ' * (Required)' : ''}`,
      value: f.name,
    })) || []),
  ];

  // Check for duplicate field mappings
  const mappedFieldCounts: Record<string, number> = {};
  Object.values(columnMapping).forEach((field) => {
    if (field && field !== '__ignore__') {
      mappedFieldCounts[field] = (mappedFieldCounts[field] || 0) + 1;
    }
  });
  const hasDuplicateMappings = Object.values(mappedFieldCounts).some((c) => c > 1);

  // Check for missing required fields
  const requiredFields = importer?.fields.filter((f) => f.required).map((f) => f.name) || [];
  const assignedFields = Object.values(columnMapping);
  const missingRequired = requiredFields.filter((rf) => !assignedFields.includes(rf));

  return (
    <Modal
      isOpen={isOpen}
      onClose={isProcessing ? () => {} : onClose}
      title={`Import ${importer?.label || 'Data'}`}
      description="Multi-step import wizard with automated column matching and validation preview."
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
          {[
            { s: 1, label: 'Upload' },
            { s: 2, label: 'Map Columns' },
            { s: 3, label: 'Preview' },
            { s: 4, label: 'Configure' },
            { s: 5, label: 'Results' },
          ].map((item, idx) => (
            <div key={item.s} className="flex items-center gap-2">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition',
                  step === item.s
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : step > item.s
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                )}
              >
                {step > item.s ? '✓' : item.s}
              </div>
              <span
                className={cn(
                  'text-xs font-medium hidden sm:inline',
                  step === item.s ? 'text-gray-900 dark:text-gray-100 font-bold' : 'text-gray-400'
                )}
              >
                {item.label}
              </span>
              {idx < 4 && <div className="w-4 h-0.5 bg-gray-100 dark:bg-gray-800 hidden sm:block" />}
            </div>
          ))}
        </div>

        {/* STEP 1: Upload */}
        {step === 1 && (
          <div className="space-y-4 py-4 text-center">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
              }}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer bg-gray-50/50 dark:bg-gray-800/20 transition group"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Click or drag spreadsheet here to upload
                </p>
                <p className="text-xs text-gray-400 mt-1">Supports CSV (.csv) and Excel (.xlsx) up to 20MB</p>
              </div>
              {isUploading && (
                <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Reading file headers and counting rows...
                </div>
              )}
            </div>

            {importer?.description && (
              <p className="text-xs text-gray-400">{importer.description}</p>
            )}
          </div>
        )}

        {/* STEP 2: Column Mapping */}
        {step === 2 && uploadData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
              <span>File: <strong>{uploadData.import.original_filename}</strong></span>
              <span>Total Rows: <strong>~{uploadData.total_rows}</strong></span>
            </div>

            {hasDuplicateMappings && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                Multiple file columns are mapped to the same target field. Please adjust.
              </div>
            )}

            {missingRequired.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/60 rounded-xl text-xs text-rose-800 dark:text-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                Missing required fields: {missingRequired.join(', ')}
              </div>
            )}

            <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
              {uploadData.headers.map((hdr) => (
                <div
                  key={hdr}
                  className="flex items-center justify-between gap-4 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{hdr}</p>
                    <p className="text-[10px] text-gray-400 truncate">
                      Sample: {uploadData.sample_rows[0]?.[hdr] || '—'}
                    </p>
                  </div>
                  <div className="w-52 shrink-0">
                    <Select
                      value={columnMapping[hdr] || '__ignore__'}
                      onChange={(e) => setColumnMapping({ ...columnMapping, [hdr]: e.target.value })}
                      options={fieldOptions}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
              <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePreview}
                disabled={hasDuplicateMappings || missingRequired.length > 0 || isValidating}
                isLoading={isValidating}
              >
                Continue to Preview <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Preview */}
        {step === 3 && previewData && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">
              Review how sample rows will be imported after field transformation and validation.
            </p>

            <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="p-2.5 font-semibold text-gray-600 dark:text-gray-300">#</th>
                    {Object.values(columnMapping)
                      .filter((f) => f && f !== '__ignore__')
                      .map((f) => (
                        <th key={f} className="p-2.5 font-semibold text-gray-600 dark:text-gray-300">
                          {f}
                        </th>
                      ))}
                    <th className="p-2.5 font-semibold text-right">Validation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {previewData.mapped_rows.map((row, idx) => {
                    const rowErrors = previewData.errors[idx];
                    return (
                      <tr key={idx} className={rowErrors ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''}>
                        <td className="p-2.5 text-gray-400">{idx + 1}</td>
                        {Object.values(columnMapping)
                          .filter((f) => f && f !== '__ignore__')
                          .map((f) => (
                            <td key={f} className="p-2.5 text-gray-800 dark:text-gray-200">
                              {String(row[f] ?? '') || '—'}
                            </td>
                          ))}
                        <td className="p-2.5 text-right">
                          {rowErrors ? (
                            <span className="text-[10px] text-rose-600 font-semibold flex items-center justify-end gap-1">
                              <AlertCircle className="w-3 h-3" /> Errors Detected
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Valid
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
              <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
              </Button>
              <Button variant="primary" size="sm" onClick={() => setStep(4)}>
                Configure Options <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Configuration & Duplicate Strategy */}
        {step === 4 && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Duplicate Handling</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'skip', label: 'Skip Duplicates', desc: 'Ignore existing records' },
                { id: 'update', label: 'Update Existing', desc: 'Overwrite matching data' },
                { id: 'error', label: 'Halt on Error', desc: 'Fail if conflict occurs' },
              ].map((strat) => (
                <button
                  key={strat.id}
                  type="button"
                  onClick={() => setDuplicateStrategy(strat.id as 'skip' | 'update' | 'error')}
                  className={cn(
                    'p-3.5 rounded-xl border text-left transition',
                    duplicateStrategy === strat.id
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                      : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
                  )}
                >
                  <p className="text-xs font-bold">{strat.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{strat.desc}</p>
                </button>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 text-xs text-gray-500 space-y-1">
              <p className="font-semibold text-gray-800 dark:text-gray-200">Execution Summary</p>
              <p>Estimated Rows: ~{uploadData?.total_rows}</p>
              <p>Processing mode: Chunked queued pipeline with automated logging.</p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
              <Button variant="outline" size="sm" onClick={() => setStep(3)}>
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
              </Button>
              <Button variant="primary" size="sm" onClick={handleStartImport}>
                Confirm & Run Import
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: Results & Progress */}
        {step === 5 && (
          <div className="space-y-6 py-4 text-center">
            {isProcessing ? (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Processing Import...</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Processed {finalResult?.processed_rows || 0} of {finalResult?.total_rows || uploadData?.total_rows || 0} rows
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div
                  className={cn(
                    'w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-white shadow-sm',
                    finalResult?.status === 'completed'
                      ? 'bg-emerald-500'
                      : finalResult?.status === 'completed_with_errors'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  )}
                >
                  {finalResult?.status === 'completed' ? (
                    <CheckCircle2 className="w-8 h-8" />
                  ) : (
                    <AlertCircle className="w-8 h-8" />
                  )}
                </div>

                <div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    {finalResult?.status === 'completed'
                      ? 'Import Completed Successfully'
                      : finalResult?.status === 'completed_with_errors'
                      ? 'Import Completed with Warnings'
                      : 'Import Failed'}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    All valid records have been saved into the database.
                  </p>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300">
                    <p className="text-lg font-bold">{finalResult?.successful_rows || 0}</p>
                    <p className="text-[10px] uppercase font-semibold">Success</p>
                  </div>
                  <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400">
                    <p className="text-lg font-bold">{finalResult?.skipped_rows || 0}</p>
                    <p className="text-[10px] uppercase font-semibold">Skipped</p>
                  </div>
                  <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300">
                    <p className="text-lg font-bold">{finalResult?.failed_rows || 0}</p>
                    <p className="text-[10px] uppercase font-semibold">Failed</p>
                  </div>
                </div>

                {/* Download error report if any */}
                {finalResult && (finalResult.failed_rows > 0 || (finalResult.errors_summary && finalResult.errors_summary.length > 0)) && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => importExportService.downloadErrorLog(finalResult.uuid)}
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" /> Download Error Report (.CSV)
                    </Button>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <Button variant="primary" size="sm" onClick={onClose}>
                    Close Wizard
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
