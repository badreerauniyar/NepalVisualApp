import { Injectable } from '@angular/core';

/**
 * Service to analyze names and extract caste and religion information
 * Based on common Nepali naming patterns
 */
@Injectable({
  providedIn: 'root'
})
export class NameAnalysisService {
  
  // Religion indicators
  private religionPatterns: { [key: string]: string[] } = {
    'Hindu': ['शर्मा', 'sharma', 'पाण्डे', 'pandey', 'चेत्री', 'chhetri', 'थापा', 'thapa', 'राणा', 'rana', 'श्रेष्ठ', 'shrestha', 'यादव', 'yadav', 'राई', 'rai', 'गुरुङ', 'gurung', 'मगर', 'magar', 'तामाङ', 'tamang', 'लिम्बू', 'limbu', 'शेर्पा', 'sherpa', 'थारू', 'tharu'],
    'Muslim': ['मोहमद', 'mohammad', 'mohamed', 'mohammed', 'खान', 'khan', 'शेख', 'sheikh', 'मियाँ', 'miyan', 'मियां', 'miyan', 'अली', 'ali', 'हुसैन', 'hussain', 'हसन', 'hasan', 'अहमद', 'ahmad', 'रहमान', 'rahman', 'रशीद', 'rashid', 'इब्राहिम', 'ibrahim', 'युसुफ', 'yusuf', 'अकबर', 'akbar'],
    'Buddhist': ['लामा', 'lama', 'तामाङ', 'tamang', 'शेर्पा', 'sherpa', 'गुरुङ', 'gurung', 'बुद्ध', 'buddha', 'साक्य', 'shakya'],
    'Christian': ['पीटर', 'peter', 'पॉल', 'paul', 'जॉन', 'john', 'मारिया', 'maria', 'मैरी', 'mary'],
    'Other': []
  };

  /**
   * Extract caste from name - uses the last name (surname) as caste
   */
  extractCaste(name: string): string | null {
    if (!name) return null;
    
    // Split name by spaces and get the last word (surname)
    const nameParts = name.trim().split(/\s+/);
    
    if (nameParts.length === 0) {
      return null;
    }
    
    // Get the last part (surname)
    const surname = nameParts[nameParts.length - 1].trim();
    
    // Return null if surname is empty or too short (less than 2 characters)
    if (!surname || surname.length < 2) {
      return null;
    }
    
    return surname;
  }

  /**
   * Extract religion from name
   */
  extractReligion(name: string): string {
    if (!name) return 'Unknown';
    
    const nameLower = name.toLowerCase();
    
    // Check Muslim patterns first (most distinct)
    for (const pattern of this.religionPatterns['Muslim']) {
      if (nameLower.includes(pattern.toLowerCase())) {
        return 'Muslim';
      }
    }
    
    // Check Buddhist patterns
    for (const pattern of this.religionPatterns['Buddhist']) {
      if (nameLower.includes(pattern.toLowerCase())) {
        return 'Buddhist';
      }
    }
    
    // Check Christian patterns
    for (const pattern of this.religionPatterns['Christian']) {
      if (nameLower.includes(pattern.toLowerCase())) {
        return 'Christian';
      }
    }
    
    // Check Hindu patterns (most common in Nepal)
    for (const pattern of this.religionPatterns['Hindu']) {
      if (nameLower.includes(pattern.toLowerCase())) {
        return 'Hindu';
      }
    }
    
    return 'Unknown';
  }

  /**
   * Analyze voter and return caste and religion
   */
  analyzeVoter(voter: { full_name?: string; full_name_english?: string; father_mother_name?: string }): { caste: string | null; religion: string } {
    // Try full name first
    const name = voter.full_name || voter.full_name_english || '';
    const fatherName = voter.father_mother_name || '';
    
    // For caste, use the last name from the voter's own name (not father's name)
    const caste = this.extractCaste(name);
    
    // For religion, combine names for better analysis
    const combinedName = `${name} ${fatherName}`.trim();
    const religion = this.extractReligion(combinedName);
    
    return { caste, religion };
  }
}

