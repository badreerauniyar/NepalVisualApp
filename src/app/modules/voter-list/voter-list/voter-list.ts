import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { SupabaseService } from '../../../services/supabase.service';
import { PdfFontService } from '../../../services/pdf-font.service';
import { FilterSelection } from '../component/dropdown-selector/dropdown-selector';
import { Voter } from '../component/voter-table/voter-table';
import { VoterTable } from '../component/voter-table/voter-table';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-voter-list',
  templateUrl: './voter-list.html',
  styleUrl: './voter-list.scss',
  standalone: false,
})
export class VoterList implements OnInit {
  @ViewChild('voterTable') voterTableComponent!: VoterTable;
  @ViewChild('voterStatisticsSection') voterStatisticsSection!: ElementRef;
  @ViewChild('voterTableSection') voterTableSection!: ElementRef;

  voters: Voter[] = [];
  loading = false;
  error: string | null = null;
  totalCount = 0;
  isGeneratingPDF = false;

  constructor(
    private supabaseService: SupabaseService,
    private cdr: ChangeDetectorRef,
    private pdfFontService: PdfFontService
  ) {}

  ngOnInit() {
    // Component initialized
  }

  async onFiltersSelected(filters: FilterSelection) {
    if (!filters.pollingCenterIds || filters.pollingCenterIds.length === 0) {
      this.error = 'Please select at least one polling center';
      return;
    }

    this.loading = true;
    this.error = null;
    this.voters = [];

    try {
      // First, get the total count
      const countResult = await this.supabaseService.getVotersByPollingCenters(
        filters.pollingCenterIds,
        {
          limit: 1,
          offset: 0,
          sortBy: 'serial_number',
          sortOrder: 'asc'
        }
      );
      
      const totalCount = countResult.count || 0;
      console.log('Total voters:', totalCount);
      
      // Fetch all voters in batches if needed (Supabase default limit is usually 1000)
      let allVoters: Voter[] = [];
      const batchSize = 1000;
      let offset = 0;
      
      while (offset < totalCount) {
        const batchResult = await this.supabaseService.getVotersByPollingCenters(
          filters.pollingCenterIds,
          {
            limit: batchSize,
            offset: offset,
            sortBy: 'serial_number',
            sortOrder: 'asc'
          }
        );
        
        if (batchResult.data && batchResult.data.length > 0) {
          allVoters = [...allVoters, ...(batchResult.data as Voter[])];
          offset += batchResult.data.length;
          console.log(`Fetched ${allVoters.length} of ${totalCount} voters...`);
        } else {
          break; // No more data
        }
      }

      this.voters = allVoters;
      this.totalCount = totalCount;
      console.log('All voters loaded:', this.voters.length);
      
      // Set loading to false immediately after data is received
      this.loading = false;
      this.cdr.detectChanges();
      
      console.log('Loading state after setting false:', this.loading);
      console.log('Voters array length:', this.voters.length);
    } catch (err: any) {
      console.error('Error fetching voters:', err);
      this.error = err.message || 'Failed to fetch voters. Please try again.';
      this.voters = [];
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async downloadPDF() {
    if (this.voters.length === 0) {
      alert('No voter data to export.');
      return;
    }

    // Prompt for filename
    const defaultFilename = `voter-list-${new Date().toISOString().split('T')[0]}`;
    const filename = prompt('Enter filename for PDF:', defaultFilename);
    
    if (!filename || filename.trim() === '') {
      return; // User cancelled or entered empty name
    }

    const sanitizedFilename = filename.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    this.isGeneratingPDF = true;
    this.cdr.detectChanges();

    try {
      // Wait a bit for UI to update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create PDF with A4 dimensions (in mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Register Unicode font for Nepali text support
      await this.pdfFontService.registerFont(pdf);
      const unicodeFontName = this.pdfFontService.getFontName();
      
      // Verify font is available
      const fontList = pdf.getFontList();
      console.log('Available fonts:', Object.keys(fontList));
      if (!fontList[unicodeFontName]) {
        console.warn(`Font ${unicodeFontName} not found in font list. Available fonts:`, Object.keys(fontList));
        // Fallback to helvetica if font registration failed
        // But we should still try to use the Unicode font
      }

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      const footerHeight = 15;

      // Helper function to add footer
      const addFooter = (currentPage: number, totalPagesCount: number) => {
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont(unicodeFontName, 'normal');
        const footerY = pageHeight - 10;
        
        // Filename on left
        pdf.text(sanitizedFilename, margin, footerY);
        
        // Page number on right
        const pageText = `Page ${currentPage} of ${totalPagesCount}`;
        const pageTextWidth = pdf.getTextWidth(pageText);
        pdf.text(pageText, pageWidth - margin - pageTextWidth, footerY);
      };

      // Helper function to add cover page
      const addCoverPage = () => {
        pdf.setFontSize(24);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont(unicodeFontName, 'normal'); // Use 'normal' as we only have regular font file
        
        const title = 'Voter Statistics Report';
        const titleNepali = 'मतदाता तथ्याङ्क प्रतिवेदन';
        const titleWidth = pdf.getTextWidth(title);
        const titleX = (pageWidth - titleWidth) / 2;
        const titleY = pageHeight / 2 - 20;
        
        // Main title
        pdf.text(title, titleX, titleY);
        
        // Nepali title
        pdf.setFontSize(18);
        const nepaliTitleWidth = pdf.getTextWidth(titleNepali);
        const nepaliTitleX = (pageWidth - nepaliTitleWidth) / 2;
        pdf.text(titleNepali, nepaliTitleX, titleY + 15);
        
        // Generated date
        pdf.setFontSize(12);
        pdf.setFont(unicodeFontName, 'normal');
        pdf.setTextColor(100, 100, 100);
        const date = new Date();
        const dateStr = `Generated on: ${date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}`;
        const dateWidth = pdf.getTextWidth(dateStr);
        const dateX = (pageWidth - dateWidth) / 2;
        pdf.text(dateStr, dateX, titleY + 35);
      };

      // Add cover page
      addCoverPage();

      // Chart IDs to capture individually
      const chartIds = [
        'genderChart',
        'ageGroupChart',
        'ageGenderChart',
        'maritalStatusChart',
        'agePyramidChart',
        'religionPieChart',
        'religionBarChart',
        'castePieChart',
        'casteBarChart'
      ];

      // Capture and add each chart individually on separate pages
      for (let i = 0; i < chartIds.length; i++) {
        const chartId = chartIds[i];
        const canvasElement = document.getElementById(chartId) as HTMLCanvasElement;
        if (!canvasElement) continue;

        // Find the parent chart-card element for labels/title
        const chartCard = canvasElement.closest('.chart-card') as HTMLElement;
        if (!chartCard) continue;

        // Add small delay between captures to reduce Canvas2D readback frequency
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Try to get chart image directly from canvas first (faster, no getImageData warnings)
        let chartImgData: string;
        let chartWidth: number;
        let chartHeight: number;

        try {
          // Direct canvas to image conversion (no html2canvas needed, eliminates warnings)
          chartImgData = canvasElement.toDataURL('image/png', 1.0);
          chartWidth = canvasElement.width;
          chartHeight = canvasElement.height;
        } catch (e) {
          // Fallback to html2canvas if direct conversion fails
          console.warn(`Direct canvas conversion failed for ${chartId}, using html2canvas fallback`);
          const chartCanvas = await html2canvas(chartCard, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            removeContainer: true,
            allowTaint: false,
            imageTimeout: 15000
          });
          chartImgData = chartCanvas.toDataURL('image/png');
          chartWidth = chartCanvas.width;
          chartHeight = chartCanvas.height;
        }

        // Calculate dimensions to fit A4 page while maintaining aspect ratio
        const chartImgWidth = contentWidth;
        const chartImgHeight = (chartHeight * chartImgWidth) / chartWidth;
        const maxHeight = pageHeight - margin * 2 - footerHeight;
        
        // If chart is too tall, scale it down
        let finalWidth = chartImgWidth;
        let finalHeight = chartImgHeight;
        if (finalHeight > maxHeight) {
          finalHeight = maxHeight;
          finalWidth = (chartWidth * finalHeight) / chartHeight;
        }

        // Add new page for this chart
        pdf.addPage();

        // Center the chart on the page (accounting for margins and footer)
        const chartX = (pageWidth - finalWidth) / 2;
        const usableHeight = pageHeight - margin * 2 - footerHeight;
        const chartY = margin + (usableHeight - finalHeight) / 2;

        pdf.addImage(
          chartImgData,
          'PNG',
          chartX,
          chartY,
          finalWidth,
          finalHeight
        );
      }

      // Generate voter table using autoTable
      // Prepare table headers
      const headers = [
        'S.N.',
        'Voter ID',
        'Name / नाम',
        'Spouse Name / पति/पत्नीको नाम',
        'Parent Name / पिता/माताको नाम',
        'Gender / लिङ्ग',
        'Age / उमेर',
        'Religion / धर्म',
        'Caste / जात'
      ];

      // Prepare table body from all voters
      const tableBody = this.voters.map(voter => {
        const name = voter.full_name || '';
        const nameEnglish = voter.full_name_english ? `\n(${voter.full_name_english})` : '';
        const fullName = name + nameEnglish;

        const spouseName = voter.spouse_name || '-';
        const spouseNameEnglish = voter.spouse_name_english ? `\n(${voter.spouse_name_english})` : '';
        const fullSpouseName = spouseName + spouseNameEnglish;

        const parentName = voter.father_mother_name || '-';
        const parentNameEnglish = voter.father_mother_name_english ? `\n(${voter.father_mother_name_english})` : '';
        const fullParentName = parentName + parentNameEnglish;

        const gender = voter.gender || '-';
        const genderEnglish = voter.gender_english ? `\n(${voter.gender_english})` : '';
        const fullGender = gender + genderEnglish;

        return [
          voter.serial_number?.toString() || '',
          voter.voter_id || '',
          fullName,
          fullSpouseName,
          fullParentName,
          fullGender,
          voter.age?.toString() || '-',
          voter.religion || '-',
          voter.caste || '-'
        ];
      });

      // Add new page for table
      pdf.addPage();

      // Generate table with autoTable
      autoTable(pdf, {
        head: [headers],
        body: tableBody,
        startY: margin,
        margin: { top: margin, right: margin, bottom: margin + footerHeight, left: margin },
        styles: {
          font: unicodeFontName,
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        headStyles: {
          font: unicodeFontName,
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'normal', // Use 'normal' since we only registered normal style
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 12 }, // S.N.
          1: { cellWidth: 20 }, // Voter ID
          2: { cellWidth: 'auto' }, // Name
          3: { cellWidth: 'auto' }, // Spouse Name
          4: { cellWidth: 'auto' }, // Parent Name
          5: { cellWidth: 18 }, // Gender
          6: { cellWidth: 12 }, // Age
          7: { cellWidth: 'auto' }, // Religion
          8: { cellWidth: 'auto' }  // Caste
        },
        showHead: 'everyPage',
        pageBreak: 'auto',
        tableWidth: 'wrap'
      });

      // Add footer to all pages
      const totalPagesCount = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPagesCount; i++) {
        pdf.setPage(i);
        addFooter(i, totalPagesCount);
      }

      // Save the PDF
      pdf.save(`${sanitizedFilename}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      this.isGeneratingPDF = false;
      this.cdr.detectChanges();
    }
  }
}
