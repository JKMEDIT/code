import JSZip from 'jszip';
import type { GeneratedWebsiteCode, NotepadDocument } from '../types/document';

export function slugifyFilename(input: string): string {
  const cleaned = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'foliodraft-website';
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 150);
}

export function downloadTextFile(content: string, filename: string, mimeType = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mimeType });
  triggerBlobDownload(blob, filename);
}

export async function downloadWebsiteZip(
  doc: NotepadDocument,
  generated: GeneratedWebsiteCode
): Promise<void> {
  const zip = new JSZip();
  let zipHtml = generated.zipIndexHtml;

  // Bundle any local /assets/... or /src/assets/... image references into assets/ inside the ZIP
  const localAssetMatches = Array.from(
    zipHtml.matchAll(/src="(\/(?:src\/)?assets\/[^"]+)"/gi)
  );
  const assetsFolder =
    generated.assets.length > 0 || localAssetMatches.length > 0
      ? zip.folder('assets')
      : null;

  if (assetsFolder) {
    for (const asset of generated.assets) {
      assetsFolder.file(asset.filename, asset.base64Data, { base64: true });
    }

    for (const match of localAssetMatches) {
      const srcPath = match[1];
      const fileName = srcPath.split('/').pop() || 'image.jpg';
      try {
        const res = await fetch(srcPath);
        if (res.ok) {
          const buf = await res.arrayBuffer();
          assetsFolder.file(fileName, buf);
          zipHtml = zipHtml.split(`src="${srcPath}"`).join(`src="assets/${fileName}"`);
        }
      } catch {
        // Keep original path if fetch fails
      }
    }
  }

  zip.file('index.html', zipHtml);
  zip.file('style.css', generated.css);
  if (generated.js.trim()) {
    zip.file('script.js', generated.js);
  }
  zip.file('README.md', generated.readmeMd);

  const blob = await zip.generateAsync({ type: 'blob' });
  const baseName = slugifyFilename(doc.title);
  triggerBlobDownload(blob, `${baseName}-website.zip`);
}
