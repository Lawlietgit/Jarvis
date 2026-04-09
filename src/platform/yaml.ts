import { readFile } from 'node:fs/promises';
import yaml from 'js-yaml';

export async function loadYamlFile<T>(path: string): Promise<T> {
  const raw = await readFile(path, 'utf8');
  const parsed = yaml.load(raw);

  if (parsed === undefined) {
    throw new Error(`YAML file was empty: ${path}`);
  }

  return parsed as T;
}
