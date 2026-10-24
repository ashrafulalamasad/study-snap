export async function renderPdfPages(file: File): Promise<File[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  const pdfDocument = await pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  }).promise;
  const pages: File[] = [];

  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
    const page = await pdfDocument.getPage(pageNumber);
    const initialViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(1.5, 1600 / Math.max(initialViewport.width, initialViewport.height));
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    await page.render({
      canvas,
      viewport,
    }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error(`Could not render PDF page ${pageNumber}`));
      }, "image/png");
    });

    pages.push(
      new File([blob], `${file.name}-page-${pageNumber}.png`, {
        type: "image/png",
      })
    );
  }

  return pages;
}
