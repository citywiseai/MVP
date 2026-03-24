import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type AuditAction =
  | 'project_created'
  | 'scope_added'
  | 'scope_removed'
  | 'field_updated';

export interface AuditLogData {
  projectId: string;
  action: AuditAction;
  scopeItem?: string;
  details?: Record<string, any>;
  requirementsAffected?: number;
  tasksAffected?: number;
  previousValue?: string;
  newValue?: string;
  createdBy?: string;
}

/**
 * Create an audit log entry for a project change
 */
export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.projectAuditLog.create({
      data: {
        projectId: data.projectId,
        action: data.action,
        scopeItem: data.scopeItem,
        details: data.details ? JSON.parse(JSON.stringify(data.details)) : null,
        requirementsAffected: data.requirementsAffected || 0,
        tasksAffected: data.tasksAffected || 0,
        previousValue: data.previousValue,
        newValue: data.newValue,
        createdBy: data.createdBy,
      },
    });
    console.log('✅ Audit log created:', data.action, data.scopeItem || '');
  } catch (error) {
    // Don't throw - audit logging should not break the main flow
    console.error('⚠️ Failed to create audit log:', error);
  }
}

/**
 * Log project creation
 */
export async function logProjectCreation(
  projectId: string,
  details: { source: 'scout' | 'manual'; initialScope?: string[] },
  createdBy?: string
) {
  await createAuditLog({
    projectId,
    action: 'project_created',
    details,
    createdBy,
  });
}

/**
 * Log scope item removal
 */
export async function logScopeRemoval(
  projectId: string,
  scopeItem: string,
  impact: { requirementsAffected: number; tasksAffected: number },
  createdBy?: string
) {
  await createAuditLog({
    projectId,
    action: 'scope_removed',
    scopeItem,
    requirementsAffected: impact.requirementsAffected,
    tasksAffected: impact.tasksAffected,
    createdBy,
  });
}

/**
 * Log scope item addition
 */
export async function logScopeAddition(
  projectId: string,
  scopeItem: string,
  impact: { requirementsAffected?: number; tasksAffected?: number },
  createdBy?: string
) {
  await createAuditLog({
    projectId,
    action: 'scope_added',
    scopeItem,
    requirementsAffected: impact.requirementsAffected || 0,
    tasksAffected: impact.tasksAffected || 0,
    createdBy,
  });
}

/**
 * Log field update
 */
export async function logFieldUpdate(
  projectId: string,
  field: string,
  previousValue: string,
  newValue: string,
  createdBy?: string
) {
  await createAuditLog({
    projectId,
    action: 'field_updated',
    details: { field },
    previousValue,
    newValue,
    createdBy,
  });
}

/**
 * Format a scope item name for display
 */
export function formatScopeItem(scopeItem: string): string {
  const labels: Record<string, string> = {
    'adu': 'ADU',
    'addition': 'Addition',
    'remodel': 'Remodel',
    'new_build': 'New Build',
    'pool': 'Pool',
    'garage': 'Garage',
    'kitchen': 'Kitchen',
    'bathroom': 'Bathroom',
    'outdoor_kitchen': 'Outdoor Kitchen',
    'structural': 'Structural Changes'
  };
  return labels[scopeItem.toLowerCase()] || scopeItem;
}

/**
 * Format a field name for display
 */
export function formatFieldName(field: string): string {
  const fieldNames: Record<string, string> = {
    'name': 'Project Name',
    'propertyType': 'Property Type',
    'buildingFootprintSqFt': 'Building Footprint',
    'totalSfModified': 'Total Modified Area',
    'hillsideGrade': 'Hillside Property',
    'onSeptic': 'On Septic System'
  };
  return fieldNames[field] || field;
}
