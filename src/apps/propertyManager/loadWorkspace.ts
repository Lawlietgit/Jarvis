import { loadYamlFile } from '../../platform/yaml.js';
import type { PropertyManagerWorkspace } from './types.js';

function normalizeDateish(value: string | Date | undefined): string | undefined {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

export async function loadPropertyManagerWorkspace(path: string): Promise<PropertyManagerWorkspace> {
  const workspace = await loadYamlFile<PropertyManagerWorkspace>(path);

  return {
    ...workspace,
    generatedAt: normalizeDateish(workspace.generatedAt) ?? new Date().toISOString(),
    properties: workspace.properties.map((property) => ({
      ...property,
      currentLease: {
        ...property.currentLease,
        uploadedAt: normalizeDateish(property.currentLease.uploadedAt) ?? '',
        analyzedAt: normalizeDateish(property.currentLease.analyzedAt) ?? '',
        leaseStart: normalizeDateish(property.currentLease.leaseStart) ?? '',
        leaseEnd: normalizeDateish(property.currentLease.leaseEnd) ?? ''
      },
      rentLedger: {
        ...property.rentLedger,
        lastPaymentAt: normalizeDateish(property.rentLedger.lastPaymentAt)
      }
    })),
    documentInbox: workspace.documentInbox.map((document) => ({
      ...document,
      uploadedAt: normalizeDateish(document.uploadedAt) ?? ''
    }))
  };
}
