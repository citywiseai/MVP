export function generateEngineeringRequirements(params: {
  projectType: string
  propertyType?: string
  squareFootage: number
  stories: number
  lotSize?: number
}) {
  const requirements = []

  // ADU projects have simpler requirements
  if (params.projectType === 'adu') {
    requirements.push({
      discipline: 'Architect of Record',
      required: true,
      notes: 'Licensed architect required for ADU design and permit stamping.'
    })
    
    requirements.push({
      discipline: 'Structural Engineer',
      required: true,
      notes: 'Structural calculations and foundation design for the ADU structure.'
    })
    
    requirements.push({
      discipline: 'MEP Engineer',
      required: true,
      notes: 'Electrical, plumbing, and HVAC plans for ADU utilities.'
    })
    
    if (params.squareFootage > 800) {
      requirements.push({
        discipline: 'Title 24 Energy Compliance',
        required: true,
        notes: 'Energy efficiency calculations required for larger ADUs.'
      })
    }
    
    return requirements
  }

  // Simple renovation projects (under 500 sqft)
  if (params.projectType === 'renovation' && params.squareFootage < 500) {
    requirements.push({
      discipline: 'Permit Plans',
      required: true,
      notes: 'Basic permit drawings showing proposed changes. May require structural review for wall modifications.'
    })
    
    // Only add MEP if significant changes
    if (params.squareFootage > 200) {
      requirements.push({
        discipline: 'MEP Review',
        required: true,
        notes: 'Electrical and plumbing review for permit compliance. Full MEP plans if relocating utilities.'
      })
    }
    
    return requirements
  }

  // Architect of Record - required for most substantial projects
  if (params.projectType === 'new_construction' || 
      params.projectType === 'addition' || 
      params.squareFootage > 1000) {
    requirements.push({
      discipline: 'Architect of Record',
      required: true,
      notes: 'Licensed architect required for design and permit stamping. Can be fulfilled by structural engineer for smaller projects.'
    })
  }

  // Structural - required for substantial work
  if (params.projectType === 'new_construction' || 
      params.projectType === 'addition' || 
      params.squareFootage > 500) {
    requirements.push({
      discipline: 'Structural Engineer',
      required: true,
      notes: 'Structural calculations, foundation design, and PE stamp required. Can serve as Architect of Record for smaller projects.'
    })
  }

  // Civil - only for new construction and large additions
  if (params.projectType === 'new_construction' || 
      (params.projectType === 'addition' && params.squareFootage > 1500)) {
    requirements.push({
      discipline: 'Civil Engineer',
      required: true,
      notes: 'Site plan, grading plan, drainage design, and utility connections required'
    })
  }

  // MEP - based on scope and complexity
  if (params.squareFootage > 500 || params.projectType === 'new_construction') {
    requirements.push({
      discipline: 'MEP Engineer',
      required: true,
      notes: 'Mechanical, Electrical, and Plumbing plans with load calculations and equipment schedules'
    })
  }

  // Soils report - only for new construction
  if (params.projectType === 'new_construction') {
    requirements.push({
      discipline: 'Geotechnical Engineer',
      required: true,
      notes: 'Soils investigation required for foundation design and bearing capacity determination'
    })
  }

  // Survey - new construction and significant additions
  if (params.projectType === 'new_construction' || 
      (params.projectType === 'addition' && params.squareFootage > 1000)) {
    requirements.push({
      discipline: 'Land Surveyor',
      required: true,
      notes: 'Boundary and topographic survey with existing conditions and setback verification'
    })
  }

  // Commercial property specific requirements
  if (params.propertyType === 'commercial') {
    requirements.push({
      discipline: 'Fire Protection Engineer',
      required: true,
      notes: 'Fire sprinkler system design and fire alarm system plans required for commercial properties'
    })
    
    requirements.push({
      discipline: 'ADA Compliance Specialist',
      required: true,
      notes: 'Accessibility compliance review and design for commercial properties per ADA requirements'
    })
  }

  // Large lot considerations
  if (params.lotSize && params.lotSize > 20000) {
    const civil = requirements.find(r => r.discipline === 'Civil Engineer')
    if (civil) {
      civil.notes += '. Large lot may require additional drainage studies and environmental impact considerations.'
    }
  }

  // Multi-story considerations
  if (params.stories > 1) {
    const structural = requirements.find(r => r.discipline === 'Structural Engineer')
    if (structural) {
      structural.notes = 'Multi-story structural analysis required, including lateral load design and seismic/wind calculations'
    }
    
    const mep = requirements.find(r => r.discipline === 'MEP Engineer')
    if (mep) {
      mep.notes = 'MEP plans with multi-story considerations, fire safety systems, and vertical distribution requirements'
    }
  }

  // Large project considerations
  if (params.squareFootage > 2000) {
    const architect = requirements.find(r => r.discipline === 'Architect of Record')
    if (architect) {
      architect.notes = 'Licensed architect required for large projects. Must coordinate all disciplines and provide sealed drawings.'
    }
  }

  return requirements
}