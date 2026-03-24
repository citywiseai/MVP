'use client';

import { useState, useEffect } from 'react';
import { Image as ImageIcon, Download, Trash2, Check, Eye, X } from 'lucide-react';

interface FloorPlan {
  id: string;
  name: string;
  imageUrl: string;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;
  stories?: number;
  style?: string;
  status: string;
  createdAt: string;
}

interface FloorPlanGalleryProps {
  projectId: string;
  refreshTrigger?: number;
}

export default function FloorPlanGallery({ projectId, refreshTrigger }: FloorPlanGalleryProps) {
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<FloorPlan | null>(null);

  useEffect(() => {
    fetchFloorPlans();
  }, [projectId, refreshTrigger]);

  const fetchFloorPlans = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/floorplans`);
      if (response.ok) {
        const data = await response.json();
        setFloorPlans(data);
      }
    } catch (error) {
      console.error('Error fetching floor plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('Delete this floor plan?')) return;

    try {
      const response = await fetch(`/api/floorplans/${planId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFloorPlans(prev => prev.filter(p => p.id !== planId));
      }
    } catch (error) {
      console.error('Error deleting floor plan:', error);
    }
  };

  const handleApprove = async (planId: string) => {
    try {
      const response = await fetch(`/api/floorplans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (response.ok) {
        setFloorPlans(prev => prev.map(p =>
          p.id === planId ? { ...p, status: 'approved' } : p
        ));
      }
    } catch (error) {
      console.error('Error approving floor plan:', error);
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading floor plans...</div>;
  }

  if (floorPlans.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h3 className="font-medium text-gray-900 mb-3">Saved Floor Plans ({floorPlans.length})</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {floorPlans.map(plan => (
          <div
            key={plan.id}
            className="border rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
          >
            <div
              className="aspect-square bg-gray-100 cursor-pointer relative group"
              onClick={() => setSelectedPlan(plan)}
            >
              <img
                src={plan.imageUrl}
                alt={plan.name || 'Floor plan'}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Eye className="w-8 h-8 text-white" />
              </div>
              {plan.status === 'approved' && (
                <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </div>

            <div className="p-2">
              <div className="text-sm font-medium text-gray-900 truncate">{plan.name}</div>
              <div className="text-xs text-gray-500">
                {plan.squareFootage?.toLocaleString()} sqft • {plan.bedrooms}bd/{plan.bathrooms}ba
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs px-2 py-0.5 rounded ${
                  plan.status === 'approved'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {plan.status}
                </span>
                <div className="flex gap-1">
                  {plan.status !== 'approved' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleApprove(plan.id); }}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                      title="Approve"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  )}
                  <a
                    href={plan.imageUrl}
                    download
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    title="Download"
                  >
                    <Download className="w-3 h-3" />
                  </a>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(plan.id); }}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedPlan && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPlan(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setSelectedPlan(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <img
              src={selectedPlan.imageUrl}
              alt={selectedPlan.name || 'Floor plan'}
              className="w-full h-auto rounded-lg"
            />
            <div className="mt-4 text-white text-center">
              <h3 className="font-medium">{selectedPlan.name}</h3>
              <p className="text-sm text-gray-300">
                {selectedPlan.squareFootage?.toLocaleString()} sqft •
                {selectedPlan.bedrooms} bed • {selectedPlan.bathrooms} bath •
                {selectedPlan.stories} story • {selectedPlan.style}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
