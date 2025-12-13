import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { jsPDF } from 'jspdf';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PdfFontService {
  private fontRegistered = false;
  private fontName = 'NotoSansDevanagari';
  private fontFileName = 'NotoSansDevanagari-Regular.ttf';
  
  constructor(private http: HttpClient) {}

  /**
   * Loads the font file as Base64 string using Angular HttpClient
   */
  private async loadFontAsBase64(fontPath: string): Promise<string> {
    try {
      // Use HttpClient to load the font file as blob
      const blob = await firstValueFrom(
        this.http.get(fontPath, { responseType: 'blob' })
      );
      
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Remove data URL prefix (data:application/octet-stream;base64, or data:font/ttf;base64,)
          const base64 = base64String.split(',')[1];
          if (!base64) {
            reject(new Error('Failed to extract base64 from font file'));
            return;
          }
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to read font file'));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error loading font file:', error);
      throw error;
    }
  }

  /**
   * Registers the Noto Sans Devanagari font with jsPDF
   * This method is idempotent - it will only register once per PDF instance
   */
  async registerFont(pdf: jsPDF): Promise<void> {
    // Note: fontRegistered flag is per service instance, but we need to register per PDF
    // So we'll check if font is already in VFS instead
    
    try {
      // Load font as Base64
      const fontPath = 'assets/fonts/NotoSansDevanagari-Regular.ttf';
      const fontBase64 = await this.loadFontAsBase64(fontPath);

      // Check if font is already registered in this PDF instance
      const vfs = (pdf as any).internal?.vfs;
      if (vfs && vfs[this.fontFileName]) {
        console.log('Font already registered in this PDF instance');
        return;
      }

      // Register font with jsPDF
      // addFileToVFS adds the font file to the virtual file system
      pdf.addFileToVFS(this.fontFileName, fontBase64);
      
      // addFont registers the font with a name and style
      // In jsPDF v3, the font name (second param) should match what we'll use in setFont()
      // The third parameter is the style: 'normal', 'bold', 'italic', 'bolditalic'
      pdf.addFont(this.fontFileName, this.fontName, 'normal');
      
      // Also try registering with the file name as the font name (some versions require this)
      // This is a fallback in case the above doesn't work
      try {
        pdf.addFont(this.fontFileName, this.fontFileName.replace('.ttf', ''), 'normal');
      } catch (e) {
        // Ignore if this fails, the main registration should work
      }

      // Verify font was registered by checking the font list
      const fontList = pdf.getFontList();
      console.log('Available fonts after registration:', Object.keys(fontList));
      
      // Check if our font is in the list
      if (fontList[this.fontName]) {
        console.log(`Font ${this.fontName} registered successfully`);
        this.fontRegistered = true;
      } else {
        console.warn(`Font ${this.fontName} not found in font list after registration`);
        console.warn('This may cause font lookup errors. Available fonts:', Object.keys(fontList));
        // Don't throw error, let it try to use the font anyway
        this.fontRegistered = true;
      }
    } catch (error) {
      console.error('Failed to register font:', error);
      console.error('Font path attempted:', 'assets/fonts/NotoSansDevanagari-Regular.ttf');
      throw new Error('Failed to register Unicode font. Nepali text may not render correctly.');
    }
  }

  /**
   * Gets the font name for use in setFont() calls
   */
  getFontName(): string {
    return this.fontName;
  }

  /**
   * Resets the font registration flag (useful for testing)
   */
  reset(): void {
    this.fontRegistered = false;
  }
}

