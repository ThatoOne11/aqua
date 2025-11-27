import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';

@Injectable({
  providedIn: 'root',
})
export class ChartDownloadService {
  constructor() {}

  async downloadElementAsImage(element: HTMLElement, filename: string): Promise<void> {
    if (!element) {
      console.error('Element not found for download.');
      return;
    }

    try {
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        logging: true, // Enable logging for debugging
        ignoreElements: (el) => el.classList.contains('download-ignore'),
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating image for download:', error);
    }
  }
}
