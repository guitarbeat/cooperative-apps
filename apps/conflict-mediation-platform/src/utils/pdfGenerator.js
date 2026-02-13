import jsPDF from 'jspdf';
import { createPDFError, logError, ERROR_TYPES } from './errorMessages';

export const generateEnhancedPDF = (formData) => {
  try {
    // Validate input data
    if (!formData || typeof formData !== 'object') {
      throw createPDFError('INSUFFICIENT_DATA', { 
        details: 'No form data provided for PDF generation' 
      });
    }

    // Check if we have minimum required data
    const hasMinimumData = formData.partyAName || formData.partyBName || formData.conflictDescription;
    if (!hasMinimumData) {
      throw createPDFError('INSUFFICIENT_DATA', { 
        details: 'Insufficient data to generate meaningful PDF' 
      });
    }

    // Check browser support
    if (typeof window === 'undefined' || !window.Blob) {
      throw createPDFError('BROWSER_NOT_SUPPORTED', { 
        details: 'PDF generation not supported in this environment' 
      });
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

  // Colors
  const primaryColor = [59, 152, 26]; // #3B981A
  const secondaryColor = [129, 182, 34]; // #81B622
  const textColor = [61, 85, 12]; // #3D550C

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace = 20) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to add a section header
  const addSectionHeader = (title, icon = '') => {
    checkNewPage(30);
    
    // Background rectangle for header
    pdf.setFillColor(...secondaryColor);
    pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 15, 'F');
    
    // Header text
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${icon} ${title}`, margin + 5, yPosition + 5);
    
    yPosition += 20;
    pdf.setTextColor(...textColor);
  };

  // Helper function to add a subsection
  const addSubsection = (title) => {
    checkNewPage(15);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...primaryColor);
    pdf.text(title, margin, yPosition);
    yPosition += 8;
    pdf.setTextColor(...textColor);
  };

  // Helper function to add regular text
  const addText = (text, indent = 0) => {
    if (!text || text.trim() === '') {
      text = 'Not provided';
      pdf.setTextColor(150, 150, 150);
    } else {
      pdf.setTextColor(...textColor);
    }
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const maxWidth = pageWidth - 2 * margin - indent;
    const lines = pdf.splitTextToSize(text, maxWidth);
    
    for (let i = 0; i < lines.length; i++) {
      checkNewPage();
      pdf.text(lines[i], margin + indent, yPosition);
      yPosition += 5;
    }
    yPosition += 3;
    pdf.setTextColor(...textColor);
  };

  // Helper function to add a data field
  const addField = (label, value, indent = 5) => {
    checkNewPage();
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...primaryColor);
    pdf.text(`${label}:`, margin + indent, yPosition);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...textColor);
    const labelWidth = pdf.getTextWidth(`${label}: `);
    
    if (!value || value.trim() === '') {
      value = 'Not provided';
      pdf.setTextColor(150, 150, 150);
    }
    
    const maxWidth = pageWidth - 2 * margin - indent - labelWidth;
    const lines = pdf.splitTextToSize(value, maxWidth);
    
    pdf.text(lines[0], margin + indent + labelWidth, yPosition);
    yPosition += 5;
    
    for (let i = 1; i < lines.length; i++) {
      checkNewPage();
      pdf.text(lines[i], margin + indent + labelWidth, yPosition);
      yPosition += 5;
    }
    yPosition += 2;
    pdf.setTextColor(...textColor);
  };

  // Helper function to add emotion data
  const addEmotionData = (label, emotionWords, chartPosition, indent = 5) => {
    addSubsection(label);
    
    if (chartPosition) {
      addField('Chart Position', `${chartPosition.label} (${chartPosition.emoji})`, indent);
      addField('Valence', chartPosition.valence > 0 ? `+${chartPosition.valence} (Pleasant)` : `${chartPosition.valence} (Unpleasant)`, indent);
      addField('Arousal', chartPosition.arousal > 0 ? `+${chartPosition.arousal} (High Energy)` : `${chartPosition.arousal} (Low Energy)`, indent);
    }
    
    if (emotionWords && emotionWords.length > 0) {
      addField('Selected Emotion Words', emotionWords.join(', '), indent);
    }
    
    if ((!chartPosition) && (!emotionWords || emotionWords.length === 0)) {
      addText('No emotion data provided', indent);
    }
    
    yPosition += 5;
  };

  // Title Page
  pdf.setFillColor(...primaryColor);
  pdf.rect(0, 0, pageWidth, 60, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Conflict Resolution', pageWidth / 2, 25, { align: 'center' });
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Session Summary Report', pageWidth / 2, 35, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 50, { align: 'center' });
  
  yPosition = 80;
  pdf.setTextColor(...textColor);

  // Setup Information
  addSectionHeader('Setup Information', '📋');
  addField('Party A Name', formData.partyAName);
  addField('Party B Name', formData.partyBName);
  addField('Date of Incident', formData.dateOfIncident);
  addField('Date of Mediation', formData.dateOfMediation);
  addField('Location of Conflict', formData.locationOfConflict);
  addField('Conflict Description', formData.conflictDescription);
  yPosition += 10;

  // Individual Reflections
  addSectionHeader('Individual Reflections', '🤔');
  
  // Party A Reflection
  addSubsection(`${formData.partyAName || 'Party A'} - Individual Reflection`);
  addField('Thoughts', formData.partyAThoughts, 10);
  addEmotionData('Emotions', formData.partyASelectedEmotionWords, formData.partyAEmotionChartPosition, 10);
  addField('Aggressive Approach', formData.partyAAggressiveApproach, 10);
  addField('Passive Approach', formData.partyAPassiveApproach, 10);
  addField('Assertive Approach', formData.partyAAssertiveApproach, 10);
  addField('Why/Because', formData.partyAWhyBecause, 10);
  yPosition += 10;

  // Party B Reflection
  addSubsection(`${formData.partyBName || 'Party B'} - Individual Reflection`);
  addField('Thoughts', formData.partyBThoughts, 10);
  addEmotionData('Emotions', formData.partyBSelectedEmotionWords, formData.partyBEmotionChartPosition, 10);
  addField('Aggressive Approach', formData.partyBAggressiveApproach, 10);
  addField('Passive Approach', formData.partyBPassiveApproach, 10);
  addField('Assertive Approach', formData.partyBAssertiveApproach, 10);
  addField('Why/Because', formData.partyBWhyBecause, 10);
  yPosition += 10;

  // ABCDE Model
  addSectionHeader('Shared Discussion (ABCDE Model)', '💬');
  addField('A - Activating Event', formData.activatingEvent);
  addField(`B - ${formData.partyAName || 'Party A'} Beliefs`, formData.partyABeliefs);
  addField(`B - ${formData.partyBName || 'Party B'} Beliefs`, formData.partyBBeliefs);
  addField(`C - ${formData.partyAName || 'Party A'} Consequences`, formData.partyAConsequences);
  addField(`C - ${formData.partyBName || 'Party B'} Consequences`, formData.partyBConsequences);
  addField(`D - ${formData.partyAName || 'Party A'} Disputations`, formData.partyADisputations);
  addField(`D - ${formData.partyBName || 'Party B'} Disputations`, formData.partyBDisputations);
  addField('E - Effects & Reflections', formData.effectsReflections);
  yPosition += 10;

  // Solution Development
  addSectionHeader('Solution Development', '💡');
  addField(`${formData.partyAName || 'Party A'} - Miracle Question`, formData.partyAMiracle);
  addField(`${formData.partyBName || 'Party B'} - Miracle Question`, formData.partyBMiracle);
  addField(`${formData.partyAName || 'Party A'} - Top 3 Solutions`, formData.partyATop3Solutions);
  addField(`${formData.partyBName || 'Party B'} - Top 3 Solutions`, formData.partyBTop3Solutions);
  addField(`${formData.partyAName || 'Party A'} - Perspective`, formData.partyAPerspective);
  addField(`${formData.partyBName || 'Party B'} - Perspective`, formData.partyBPerspective);
  addField('Compromise Solutions', formData.compromiseSolutions);
  yPosition += 10;

  // Agreement & Action Steps
  addSectionHeader('Agreement & Action Steps', '✅');
  addField(`${formData.partyAName || 'Party A'} - Unmet Needs`, formData.partyAUnmetNeeds);
  addField(`${formData.partyBName || 'Party B'} - Unmet Needs`, formData.partyBUnmetNeeds);
  addField(`${formData.partyAName || 'Party A'} - Needs in Practice`, formData.partyANeedsInPractice);
  addField(`${formData.partyBName || 'Party B'} - Needs in Practice`, formData.partyBNeedsInPractice);
  addField('Action Steps', formData.actionSteps);
  addField('Follow-up Date', formData.followUpDate);
  addField('Additional Support Needed', formData.additionalSupport);

  // Footer on each page
  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Conflict Resolution Platform - Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

    // Save the PDF
    const fileName = `conflict-mediation-${formData.partyAName || 'PartyA'}-${formData.partyBName || 'PartyB'}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    try {
      pdf.save(fileName);
    } catch (saveError) {
      throw createPDFError('GENERATION_FAILED', { 
        details: 'Failed to save PDF file',
        originalError: saveError.message 
      });
    }

  } catch (error) {
    // Log the error for debugging
    logError(error, { 
      formData: {
        partyAName: formData?.partyAName,
        partyBName: formData?.partyBName,
        hasConflictDescription: !!formData?.conflictDescription
      }
    });

    // Re-throw the error so it can be handled by the calling component
    throw error;
  }
};

// Enhanced PDF generation with retry mechanism
export const generateEnhancedPDFWithRetry = async (formData, maxRetries = 2) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return generateEnhancedPDF(formData);
    } catch (error) {
      lastError = error;
      
      // Don't retry for certain types of errors
      if (error.type === ERROR_TYPES.PDF_GENERATION && 
          (error.key === 'BROWSER_NOT_SUPPORTED' || error.key === 'INSUFFICIENT_DATA')) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

