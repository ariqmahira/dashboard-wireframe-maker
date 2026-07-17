import type { Project } from '../store/types';

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function slug(name: string) {
  return (name || 'wireframe').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'wireframe';
}

/** Save the project as a downloadable .json file. */
export function exportJson(project: Project) {
  download(`${slug(project.meta.name)}.json`, JSON.stringify(project, null, 2), 'application/json');
}

/** Trigger a downloadable .html file. */
export function downloadHtml(project: Project, html: string) {
  download(`${slug(project.meta.name)}.html`, html, 'text/html');
}

/** Read + validate a project JSON file. Resolves the parsed Project or rejects with a message. */
export function importJson(file: File): Promise<Project> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as Project;
        if (!data || data.meta?.version !== 1 || !Array.isArray(data.sections)) {
          reject(new Error('Not a valid wireframe file (missing version/sections).'));
          return;
        }
        resolve(data);
      } catch {
        reject(new Error('Could not parse JSON file.'));
      }
    };
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsText(file);
  });
}
