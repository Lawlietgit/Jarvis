export interface RuntimeConfig {
  operatorEmail?: string;
  openai: {
    apiKey?: string;
    triageModel: string;
    extractionModel: string;
  };
  leaseOps: {
    syncFolder: string;
  };
}

export function loadRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  return {
    operatorEmail: env.JARVIS_OPERATOR_EMAIL,
    openai: {
      apiKey: env.OPENAI_API_KEY,
      triageModel: env.OPENAI_MODEL_TRIAGE ?? 'gpt-5.4-nano',
      extractionModel: env.OPENAI_MODEL_EXTRACTION ?? 'gpt-5.4-mini'
    },
    leaseOps: {
      syncFolder: env.LEASEOPS_SYNC_FOLDER ?? 'sync/lease-docs'
    }
  };
}
