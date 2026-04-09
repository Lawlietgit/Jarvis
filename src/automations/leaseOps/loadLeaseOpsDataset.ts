import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { loadYamlFile } from '../../platform/yaml.js';
import type {
  ApprovedLeaseDocument,
  DocusignEnvelope,
  EmailEvent,
  LeaseOpsDataset,
  PropertyRecord
} from './types.js';

interface WrappedProperties {
  properties: PropertyRecord[];
}

interface WrappedEmails {
  emails: EmailEvent[];
}

interface WrappedEnvelopes {
  envelopes: DocusignEnvelope[];
}

interface WrappedApprovedDocuments {
  approved_documents: ApprovedLeaseDocument[];
}

function ensureArray<T>(value: T[] | undefined, field: string, path: string): T[] {
  if (!Array.isArray(value)) {
    throw new Error(`Expected array field "${field}" in ${path}`);
  }

  return value;
}

function normalizeDateish(value: string | Date | undefined): string | undefined {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

export async function loadLeaseOpsDataset(datasetDir: string): Promise<LeaseOpsDataset> {
  const propertiesPath = join(datasetDir, 'properties.yaml');
  const emailsPath = join(datasetDir, 'emails.yaml');
  const docusignPath = join(datasetDir, 'docusign.yaml');
  const approvedDocumentsPath = join(datasetDir, 'folder-files.yaml');

  const propertiesDoc = await loadYamlFile<WrappedProperties>(propertiesPath);
  const emailsDoc = await loadYamlFile<WrappedEmails>(emailsPath);
  const docusignDoc = await loadYamlFile<WrappedEnvelopes>(docusignPath);
  const approvedDocumentsDoc = await loadOptionalYamlFile<WrappedApprovedDocuments>(approvedDocumentsPath);

  return {
    properties: ensureArray(propertiesDoc.properties, 'properties', propertiesPath).map((property) => ({
      ...property,
      current_lease_end: normalizeDateish(property.current_lease_end)
    })),
    emails: ensureArray(emailsDoc.emails, 'emails', emailsPath).map((email) => ({
      ...email,
      received_at: normalizeDateish(email.received_at) ?? '',
      extracted_lease: email.extracted_lease
        ? {
            ...email.extracted_lease,
            lease_end: normalizeDateish(email.extracted_lease.lease_end),
            signed_at: normalizeDateish(email.extracted_lease.signed_at)
          }
        : undefined
    })),
    envelopes: ensureArray(docusignDoc.envelopes, 'envelopes', docusignPath).map((envelope) => ({
      ...envelope,
      updated_at: normalizeDateish(envelope.updated_at) ?? '',
      completed_at: normalizeDateish(envelope.completed_at),
      lease_end: normalizeDateish(envelope.lease_end)
    })),
    approved_documents: ensureArray(
      approvedDocumentsDoc?.approved_documents ?? [],
      'approved_documents',
      approvedDocumentsPath
    ).map((document) => ({
      ...document,
      imported_at: normalizeDateish(document.imported_at) ?? '',
      lease_end: normalizeDateish(document.lease_end)
    }))
  };
}

async function loadOptionalYamlFile<T>(path: string): Promise<T | undefined> {
  try {
    await access(path);
  } catch {
    return undefined;
  }

  return loadYamlFile<T>(path);
}
