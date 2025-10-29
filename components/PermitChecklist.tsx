'use client'

import { useState } from 'react'

interface PermitChecklistProps {
  projectType: string
  squareFootage: number
  stories: number
}

export function PermitChecklist({ projectType, squareFootage, stories }: PermitChecklistProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const getDeliverables = () => {
    const deliverables = {
      'Permit Submission': [
        'Building permit application (completed)',
        'Site plan with setbacks and dimensions',
        'Zoning compliance verification',
        'Fee calculation and payment',
        'Plan review submission'
      ],
      'Structural Set': [
        'Foundation plan and details',
        'Framing plans (floor, roof, etc.)',
        'Structural details and connections',
        'Load calculations and analysis',
        'Professional Engineer (PE) seal and signature'
      ],
      'Civil': [
        'Site grading and drainage plan',
        'Utility connection plans',
        'Erosion control measures',
        'Parking and access design',
        'Landscape and hardscape plans'
      ],
      'MEP': [
        'Electrical plan with load calculations',
        'Mechanical HVAC design and sizing',
        'Plumbing plans and fixture schedules',
        'Fire safety and sprinkler systems (if required)',
        'Energy compliance calculations'
      ],
      'Architect of Record': [
        'Architectural floor plans',
        'Building elevations (all sides)',
        'Building sections and details',
        'Door and window schedules',
        'Professional architect seal and coordination'
      ],
      'Architectural Package (80% Complete)': [
        'Floor plans with dimensions and room labels',
        'Exterior elevations with materials',
        'Building sections and wall details',
        'Interior elevations for key areas',
        'Code analysis and compliance matrix'
      ],
      'Local Requirements': [
        'Site plan details per local standards',
        'Local code compliance review',
        'Historic district approvals (if applicable)',
        'HOA or design review approvals',
        'Special use permits or variances'
      ]
    }

    return deliverables
  }

  const deliverables = getDeliverables()

  const getStatusColor = (section: string) => {
    if (section === 'Architectural Package (80% Complete)') return 'bg-blue-100 text-blue-800'
    if (section === 'Local Requirements') return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (section: string) => {
    if (section === 'Architectural Package (80% Complete)') return 'In Progress'
    if (section === 'Local Requirements') return 'Needs Review'
    return 'Pending'
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Complete Permit Package Checklist</h3>
      <p className="text-sm text-gray-600 mb-6">
        Comprehensive deliverables for {projectType.replace(/_/g, ' ')} project 
        ({squareFootage.toLocaleString()} sq ft, {stories} {stories === 1 ? 'story' : 'stories'})
      </p>

      <div className="space-y-4">
        {Object.entries(deliverables).map(([section, items]) => (
          <div key={section} className="border rounded-lg">
            <button
              onClick={() => setExpandedSection(expandedSection === section ? null : section)}
              className="w-full p-4 text-left hover:bg-gray-50 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium">{section}</span>
                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(section)}`}>
                  {getStatusText(section)}
                </span>
              </div>
              <span className="text-gray-400">
                {expandedSection === section ? '−' : '+'}
              </span>
            </button>
            
            {expandedSection === section && (
              <div className="border-t p-4 bg-gray-50">
                <ul className="space-y-2">
                  {items.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-gray-400 mt-1">•</span>
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                
                {section === 'Architect of Record' && (
                  <div className="mt-3 p-3 bg-blue-50 rounded text-sm">
                    <strong>Note:</strong> For smaller projects, the structural engineer can often serve as the Architect of Record, streamlining the process and reducing costs.
                  </div>
                )}
                
                {section === 'Architectural Package (80% Complete)' && (
                  <div className="mt-3 p-3 bg-green-50 rounded text-sm">
                    <strong>We can handle:</strong> Most of the architectural package is ready. You'll primarily need help with site plan details and local code nuances.
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold mb-2">Next Steps</h4>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Generate engineering requirements for your project</li>
          <li>Coordinate with local professionals for site-specific details</li>
          <li>Review local codes and requirements with jurisdiction</li>
          <li>Submit complete package for permit review</li>
        </ol>
      </div>
    </div>
  )
}