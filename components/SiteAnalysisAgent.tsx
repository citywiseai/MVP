'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Check, Loader2, AlertCircle, Search, MapPin, Building2, FileText, TrendingUp, Award } from 'lucide-react';

interface StepStatus {
  step: number;
  status: 'pending' | 'running' | 'complete' | 'error';
  message: string;
  data?: any;
}

interface FeasibilityAnalysis {
  feasibleProjects?: Array<{
    type: string;
    feasibility: string;
    maxSize: number | null;
    reasoning: string;
    estimatedCost: string | null;
    keyRequirements: string[];
  }>;
  setbackSummary?: {
    front: number;
    side: number;
    rear: number;
    notes: string;
  };
  potentialIssues?: string[];
  opportunities?: string[];
  recommendation?: {
    goNoGo: string;
    reasoning: string;
    bestOption: string;
    nextSteps: string[];
  };
  estimatedTimeline?: {
    designPhase: string;
    permitting: string;
    construction: string;
    total: string;
  };
}

interface SiteAnalysisReport {
  address: string;
  apn: string;
  propertyData: any;
  zoningRules: any;
  existingBuildings: any;
  buildableArea: any;
  feasibilityAnalysis: FeasibilityAnalysis;
  generatedAt: string;
}

const STEPS = [
  { step: 1, title: 'Property Lookup', icon: MapPin, description: 'Searching property records' },
  { step: 2, title: 'Zoning Rules', icon: FileText, description: 'Analyzing zoning regulations' },
  { step: 3, title: 'Existing Buildings', icon: Building2, description: 'Assessing current structures' },
  { step: 4, title: 'Buildable Area', icon: TrendingUp, description: 'Calculating development potential' },
  { step: 5, title: 'AI Feasibility', icon: Award, description: 'Running feasibility analysis' },
  { step: 6, title: 'Final Report', icon: FileText, description: 'Compiling results' },
];

let googleMapsLoaded = false;
let googleMapsLoading = false;

export default function SiteAnalysisAgent() {
  const [address, setAddress] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(
    STEPS.map((s) => ({ step: s.step, status: 'pending', message: s.description }))
  );
  const [report, setReport] = useState<SiteAnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [siteAnalysisId, setSiteAnalysisId] = useState<string | null>(null);
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (typeof google !== 'undefined' && google.maps && google.maps.places) {
        googleMapsLoaded = true;
        initAutocomplete();
        return;
      }

      if (googleMapsLoading) {
        const checkInterval = setInterval(() => {
          if (googleMapsLoaded && typeof google !== 'undefined' && google.maps && google.maps.places) {
            clearInterval(checkInterval);
            initAutocomplete();
          }
        }, 100);
        return;
      }

      googleMapsLoading = true;
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        googleMapsLoaded = true;
        googleMapsLoading = false;
        initAutocomplete();
      };
      script.onerror = () => {
        googleMapsLoading = false;
        console.error('Failed to load Google Maps');
      };
      document.head.appendChild(script);
    };

    const initAutocomplete = () => {
      if (!addressInputRef.current) return;
      if (autocompleteRef.current) return;

      try {
        autocompleteRef.current = new google.maps.places.Autocomplete(
          addressInputRef.current,
          {
            types: ['address'],
            componentRestrictions: { country: 'us' },
          }
        );

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          if (place?.formatted_address) {
            setAddress(place.formatted_address);
          }
        });
      } catch (error) {
        console.error('Error initializing autocomplete:', error);
      }
    };

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    fetchSavedAnalyses();
  }, []);

  const fetchSavedAnalyses = async () => {
    setLoadingSaved(true);
    try {
      const response = await fetch('/api/site-analysis/saved');
      if (response.ok) {
        const data = await response.json();
        setSavedAnalyses(data.analyses || []);
      }
    } catch (err) {
      console.error('Error fetching saved analyses:', err);
    } finally {
      setLoadingSaved(false);
    }
  };

  const resetAnalysis = () => {
    setStepStatuses(STEPS.map((s) => ({ step: s.step, status: 'pending', message: s.description })));
    setReport(null);
    setError(null);
    setSiteAnalysisId(null);
  };

  const resetForNewAnalysis = () => {
    setAddress('');
    resetAnalysis();
    fetchSavedAnalyses();
  };

  const runAnalysis = async () => {
    if (!address.trim()) {
      toast.error('Please enter an address');
      return;
    }

    setIsAnalyzing(true);
    resetAnalysis();

    try {
      const response = await fetch('/api/site-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        throw new Error('Failed to start analysis');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (!line.trim()) continue;

          const eventLine = line.split('\n')[0];
          const dataLine = line.split('\n')[1];

          if (!eventLine || !dataLine) continue;

          const event = eventLine.replace('event: ', '');
          const dataStr = dataLine.replace('data: ', '');

          try {
            const data = JSON.parse(dataStr);

            if (event === 'progress') {
              setStepStatuses((prev) =>
                prev.map((s) =>
                  s.step === data.step
                    ? { step: data.step, status: data.status, message: data.message, data: data.data }
                    : s
                )
              );
            } else if (event === 'complete') {
              console.log('📍 Complete event received:', {
                hasSiteAnalysisId: !!data.siteAnalysisId,
                siteAnalysisId: data.siteAnalysisId,
                hasReport: !!data.report,
              });
              setStepStatuses((prev) =>
                prev.map((s) =>
                  s.step === data.step
                    ? { step: data.step, status: 'complete', message: data.message }
                    : s
                )
              );
              setReport(data.report);
              setSiteAnalysisId(data.siteAnalysisId);
              console.log('📍 State updated - siteAnalysisId set to:', data.siteAnalysisId);
              toast.success('Site analysis complete!');
            } else if (event === 'error') {
              setError(data.error || 'Unknown error');
              setStepStatuses((prev) =>
                prev.map((s) =>
                  s.step === data.step
                    ? { step: data.step, status: 'error', message: data.error }
                    : s
                )
              );
              toast.error(data.error || 'Analysis failed');
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }
    } catch (err) {
      console.error('Error running analysis:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      toast.error('Failed to complete analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getFeasibilityColor = (feasibility: string) => {
    switch (feasibility) {
      case 'high': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'not-feasible': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getGoNoGoColor = (status: string) => {
    switch (status) {
      case 'GO': return 'text-green-700 bg-green-100 border-green-300';
      case 'PROCEED WITH CAUTION': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'NO-GO': return 'text-red-700 bg-red-100 border-red-300';
      default: return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 pt-8">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-blue-600 rounded-2xl">
              <Search className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Site Analysis Agent</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            AI-powered site feasibility analysis in seconds. Enter any Phoenix address to analyze
            development potential, zoning compliance, and buildable area.
          </p>
        </div>

        {/* Address Input */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex gap-3">
              <input
                ref={addressInputRef}
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isAnalyzing && runAnalysis()}
                placeholder="Enter address (e.g., 123 Main St, Phoenix, AZ)"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-gray-900 placeholder:text-gray-400"
                disabled={isAnalyzing}
              />
              <button
                onClick={runAnalysis}
                disabled={isAnalyzing}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Analyze
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Saved Analyses */}
        {!isAnalyzing && !report && savedAnalyses.length > 0 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Analyses</h3>
              <div className="space-y-3">
                {savedAnalyses.map((analysis) => (
                  <div key={analysis.id} className="relative">
                    <button
                      onClick={() => {
                        if (!analysis.project) {
                          setAddress(analysis.address);
                          setReport({
                            address: analysis.address,
                            apn: analysis.apn,
                            propertyData: {
                              lotSizeSqFt: analysis.lotSizeSqFt,
                              zoning: analysis.zoning,
                              latitude: analysis.latitude,
                              longitude: analysis.longitude,
                            },
                            zoningRules: analysis.zoningRules,
                            existingBuildings: {
                              footprintSqFt: analysis.existingBuildingSqFt,
                              buildingSections: analysis.assessorData?.buildingSections || [],
                            },
                            buildableArea: {
                              lotSizeSqFt: analysis.lotSizeSqFt,
                              totalBuildableAreaSqFt: analysis.maxBuildableArea,
                              currentCoverageSqFt: analysis.currentCoverage,
                              remainingBuildableAreaSqFt: analysis.remainingArea,
                            },
                            feasibilityAnalysis: analysis.feasibilityReport,
                            generatedAt: analysis.createdAt,
                          });
                          setSiteAnalysisId(analysis.id);
                          setStepStatuses(STEPS.map((s) => ({ step: s.step, status: 'complete', message: 'Loaded from saved analysis' })));
                        }
                      }}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{analysis.address}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {new Date(analysis.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              analysis.overallAssessment === 'GO'
                                ? 'bg-green-100 text-green-700 border border-green-300'
                                : analysis.overallAssessment === 'PROCEED_WITH_CAUTION' || analysis.overallAssessment === 'PROCEED WITH CAUTION'
                                ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                : analysis.overallAssessment === 'NO-GO' || analysis.overallAssessment === 'NO_GO'
                                ? 'bg-red-100 text-red-700 border border-red-300'
                                : 'bg-gray-100 text-gray-700 border border-gray-300'
                            }`}
                          >
                            {analysis.overallAssessment?.replace('_', '-') || 'N/A'}
                          </div>
                          {analysis.project && (
                            <a
                              href={`/dashboard?project=${analysis.project.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="px-3 py-1 bg-blue-100 text-blue-700 border border-blue-300 rounded-full text-xs font-semibold hover:bg-blue-200 transition-colors"
                            >
                              View Project
                            </a>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        {(isAnalyzing || report) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {STEPS.map((step) => {
              const status = stepStatuses.find((s) => s.step === step.step);
              const Icon = step.icon;

              return (
                <div
                  key={step.step}
                  className={`bg-white rounded-xl shadow-md border-2 p-4 transition-all ${
                    status?.status === 'complete'
                      ? 'border-green-500 shadow-green-100'
                      : status?.status === 'running'
                      ? 'border-blue-500 shadow-blue-100 animate-pulse'
                      : status?.status === 'error'
                      ? 'border-red-500 shadow-red-100'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        status?.status === 'complete'
                          ? 'bg-green-100'
                          : status?.status === 'running'
                          ? 'bg-blue-100'
                          : status?.status === 'error'
                          ? 'bg-red-100'
                          : 'bg-gray-100'
                      }`}
                    >
                      {status?.status === 'complete' ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : status?.status === 'running' ? (
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      ) : status?.status === 'error' ? (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <Icon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{step.title}</h3>
                      <p className="text-sm text-gray-600 truncate">{status?.message}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 text-lg">Analysis Failed</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {(() => {
          console.log('🔍 Button render check:', {
            hasReport: !!report,
            hasSiteAnalysisId: !!siteAnalysisId,
            siteAnalysisId,
            shouldRender: !!(report && siteAnalysisId)
          });
          return report && siteAnalysisId ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href={`/ai-scope?analysisId=${siteAnalysisId}`}
                  className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-lg shadow-md"
                >
                  Continue to Scout
                  <span className="text-xl">→</span>
                </a>
                <button
                  onClick={resetForNewAnalysis}
                  className="px-8 py-4 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-lg border border-gray-300"
                >
                  Analyze Another Property
                </button>
              </div>
            </div>
          ) : null;
        })()}

        {/* Results */}
        {report && (
          <div className="space-y-6">
            {/* Property Info */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-blue-600" />
                Property Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Address</div>
                  <div className="font-semibold text-gray-900">{report.address}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">APN</div>
                  <div className="font-semibold text-gray-900">{report.apn}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Lot Size</div>
                  <div className="font-semibold text-gray-900">
                    {report.propertyData.lotSizeSqFt?.toLocaleString()} sq ft
                    {report.propertyData.acres && ` (${report.propertyData.acres.toFixed(2)} acres)`}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Zoning</div>
                  <div className="font-semibold text-gray-900">{report.propertyData.zoning || 'N/A'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Year Built</div>
                  <div className="font-semibold text-gray-900">{report.propertyData.yearBuilt || 'N/A'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Property Value</div>
                  <div className="font-semibold text-gray-900">
                    {report.propertyData.totalValue
                      ? `$${report.propertyData.totalValue.toLocaleString()}`
                      : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Zoning Rules */}
            {report.zoningRules && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-600" />
                  Zoning Regulations
                </h2>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="font-semibold text-blue-900 text-lg">{report.zoningRules.districtName}</div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Front Setback</div>
                      <div className="font-semibold text-gray-900">{report.zoningRules.frontSetback} ft</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Side Setback</div>
                      <div className="font-semibold text-gray-900">{report.zoningRules.sideSetback} ft</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Rear Setback</div>
                      <div className="font-semibold text-gray-900">{report.zoningRules.rearSetback} ft</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Max Coverage</div>
                      <div className="font-semibold text-gray-900">
                        {report.zoningRules.lotCoverageMax
                          ? `${(report.zoningRules.lotCoverageMax * 100).toFixed(0)}%`
                          : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Max Height</div>
                      <div className="font-semibold text-gray-900">
                        {report.zoningRules.maxHeight ? `${report.zoningRules.maxHeight} ft` : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Max Stories</div>
                      <div className="font-semibold text-gray-900">{report.zoningRules.maxStories || 'N/A'}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">ADU Allowed</div>
                      <div className="font-semibold text-gray-900">
                        {report.zoningRules.aduAllowed ? 'Yes' : 'No'}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Parking Required</div>
                      <div className="font-semibold text-gray-900">
                        {report.zoningRules.parkingPerUnit
                          ? `${report.zoningRules.parkingPerUnit} per unit`
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Buildable Area */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                Buildable Area Analysis
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="text-sm text-green-700 mb-1">Max Buildable Area</div>
                  <div className="text-2xl font-bold text-green-900">
                    {report.buildableArea.totalBuildableAreaSqFt?.toLocaleString()} sq ft
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {report.buildableArea.maxCoveragePercent
                      ? `${(report.buildableArea.maxCoveragePercent * 100).toFixed(0)}% of lot`
                      : ''}
                  </div>
                </div>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-700 mb-1">Current Coverage</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {report.buildableArea.currentCoverageSqFt?.toLocaleString()} sq ft
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {report.buildableArea.coveragePercentUsed?.toFixed(1)}% of lot
                  </div>
                </div>
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                  <div className="text-sm text-purple-700 mb-1">Remaining Area</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {report.buildableArea.remainingBuildableAreaSqFt?.toLocaleString()} sq ft
                  </div>
                  <div className="text-xs text-purple-600 mt-1">Available for development</div>
                </div>
              </div>
            </div>

            {/* Feasibility Analysis */}
            {report.feasibilityAnalysis && (
              <div className="space-y-6">
                {/* Recommendation */}
                {report.feasibilityAnalysis.recommendation && (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Award className="w-6 h-6 text-blue-600" />
                      AI Recommendation
                    </h2>
                    <div className="space-y-4">
                      <div
                        className={`border-2 rounded-xl p-6 ${getGoNoGoColor(
                          report.feasibilityAnalysis.recommendation.goNoGo
                        )}`}
                      >
                        <div className="text-sm font-semibold uppercase tracking-wider mb-2">
                          Overall Assessment
                        </div>
                        <div className="text-3xl font-bold mb-3">
                          {report.feasibilityAnalysis.recommendation.goNoGo}
                        </div>
                        <div className="text-base leading-relaxed">
                          {report.feasibilityAnalysis.recommendation.reasoning}
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-6">
                        <div className="font-semibold text-gray-900 mb-2">Best Option:</div>
                        <div className="text-gray-700">
                          {report.feasibilityAnalysis.recommendation.bestOption}
                        </div>
                      </div>

                      {report.feasibilityAnalysis.recommendation.nextSteps && (
                        <div className="bg-gray-50 rounded-xl p-6">
                          <div className="font-semibold text-gray-900 mb-3">Next Steps:</div>
                          <ol className="space-y-2">
                            {report.feasibilityAnalysis.recommendation.nextSteps.map((step, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                                  {idx + 1}
                                </span>
                                <span className="text-gray-700 pt-0.5">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Feasible Projects */}
                {report.feasibilityAnalysis.feasibleProjects &&
                  report.feasibilityAnalysis.feasibleProjects.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Feasibility</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {report.feasibilityAnalysis.feasibleProjects.map((project, idx) => (
                          <div
                            key={idx}
                            className={`border-2 rounded-xl p-5 ${getFeasibilityColor(project.feasibility)}`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="text-xl font-bold">{project.type}</h3>
                              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase border">
                                {project.feasibility}
                              </span>
                            </div>
                            {project.maxSize && (
                              <div className="text-lg font-semibold mb-2">
                                Max Size: {project.maxSize.toLocaleString()} sq ft
                              </div>
                            )}
                            {project.estimatedCost && (
                              <div className="text-sm font-medium mb-2">Cost: {project.estimatedCost}</div>
                            )}
                            <div className="text-sm mb-3">{project.reasoning}</div>
                            {project.keyRequirements && project.keyRequirements.length > 0 && (
                              <div className="text-xs space-y-1">
                                <div className="font-semibold">Key Requirements:</div>
                                <ul className="list-disc list-inside space-y-0.5">
                                  {project.keyRequirements.map((req, ridx) => (
                                    <li key={ridx}>{req}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Issues and Opportunities */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {report.feasibilityAnalysis.potentialIssues &&
                    report.feasibilityAnalysis.potentialIssues.length > 0 && (
                      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                        <h3 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5" />
                          Potential Issues
                        </h3>
                        <ul className="space-y-2">
                          {report.feasibilityAnalysis.potentialIssues.map((issue, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-red-500 font-bold flex-shrink-0">•</span>
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {report.feasibilityAnalysis.opportunities &&
                    report.feasibilityAnalysis.opportunities.length > 0 && (
                      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                        <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                          <Check className="w-5 h-5" />
                          Opportunities
                        </h3>
                        <ul className="space-y-2">
                          {report.feasibilityAnalysis.opportunities.map((opp, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-green-500 font-bold flex-shrink-0">•</span>
                              <span>{opp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>

                {/* Timeline */}
                {report.feasibilityAnalysis.estimatedTimeline && (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Estimated Timeline</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-xs text-gray-600 mb-1">Design Phase</div>
                        <div className="font-semibold text-gray-900">
                          {report.feasibilityAnalysis.estimatedTimeline.designPhase}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-xs text-gray-600 mb-1">Permitting</div>
                        <div className="font-semibold text-gray-900">
                          {report.feasibilityAnalysis.estimatedTimeline.permitting}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-xs text-gray-600 mb-1">Construction</div>
                        <div className="font-semibold text-gray-900">
                          {report.feasibilityAnalysis.estimatedTimeline.construction}
                        </div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-xs text-blue-700 mb-1">Total Timeline</div>
                        <div className="font-bold text-blue-900">
                          {report.feasibilityAnalysis.estimatedTimeline.total}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
