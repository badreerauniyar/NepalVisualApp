import { Injectable } from '@angular/core';

/**
 * Service to analyze names and extract caste and religion information
 * Based on common Nepali naming patterns
 */
@Injectable({
  providedIn: 'root'
})
export class NameAnalysisService {
  
  // Common caste indicators in Nepali names
  private castePatterns: { [key: string]: string[] } = {
    'Brahmin': ['शर्मा', 'sharma', 'पाण्डे', 'pandey', 'पाण्डेय', 'pandey', 'पन्त', 'pant', 'भट्ट', 'bhatt', 'भट्टराई', 'bhattarai', 'दाहाल', 'dahal', 'ढकाल', 'dhakal', 'गौतम', 'gautam', 'जोशी', 'joshi', 'खनाल', 'khanal', 'लामिछाने', 'lamichhane', 'पौडेल', 'paudel', 'रिजाल', 'rijal', 'सापकोटा', 'sapkota', 'सुवेदी', 'subedi', 'तिवारी', 'tiwari', 'उप्रेती', 'upreti'],
    'Chhetri': ['चेत्री', 'chhetri', 'कुँवर', 'kunwar', 'राणा', 'rana', 'थापा', 'thapa', 'बिष्ट', 'bist', 'बिष्टा', 'bista', 'बुढाथोकी', 'budhathoki', 'घर्ती', 'gharti', 'कटुवाल', 'katwal', 'खड्का', 'khadka', 'खड्का', 'khadka', 'मगर', 'magar', 'पुन', 'pun', 'रावत', 'rawat', 'शाही', 'shahi'],
    'Newar': ['श्रेष्ठ', 'shrestha', 'महर्जन', 'maharjan', 'तुलाधर', 'tuladhar', 'बज्राचार्य', 'bajracharya', 'राजभंडारी', 'rajbhandari', 'शाक्य', 'shakya', 'ताम्राकार', 'tamrakar', 'मानन्धर', 'manandhar', 'कर्माचार्य', 'karmacharya', 'जोशी', 'joshi', 'वज्राचार्य', 'vajracharya'],
    'Magar': ['मगर', 'magar', 'पुन', 'pun', 'राना', 'rana', 'बुढा', 'budha', 'घले', 'ghale', 'थापा', 'thapa'],
    'Tamang': ['तामाङ', 'tamang', 'योन्जन', 'yonjan', 'मोक्तान', 'moktan', 'घिसिङ', 'ghising', 'लामा', 'lama'],
    'Rai': ['राई', 'rai', 'लिम्बू', 'limbu', 'सुब्बा', 'subba', 'याक्खा', 'yakha', 'खुलुङ', 'khulung'],
    'Gurung': ['गुरुङ', 'gurung', 'घले', 'ghale', 'लामा', 'lama'],
    'Limbu': ['लिम्बू', 'limbu', 'सुब्बा', 'subba', 'याक्खा', 'yakha'],
    'Sherpa': ['शेर्पा', 'sherpa', 'लामा', 'lama'],
    'Thakuri': ['ठकुरी', 'thakuri', 'शाह', 'shah', 'सिंह', 'singh'],
    'Yadav': ['यादव', 'yadav', 'मण्डल', 'mandal'],
    'Kami': ['कामी', 'kami', 'बिष्ट', 'bist'],
    'Damai': ['दमाई', 'damai', 'श्रेष्ठ', 'shrestha'],
    'Sarki': ['सार्की', 'sarki', 'सार्की', 'sarki'],
    'Tharu': ['थारू', 'tharu', 'चौधरी', 'chaudhary', 'राना', 'rana'],
    'Musahar': ['मुसहर', 'musahar', 'मुसहर', 'musahar'],
    'Dhobi': ['धोबी', 'dhobi'],
    'Kumal': ['कुमाल', 'kumal'],
    'Sunuwar': ['सुनुवार', 'sunuwar', 'मुखिया', 'mukhiya'],
    'Other': []
  };

  // Religion indicators
  private religionPatterns: { [key: string]: string[] } = {
    'Hindu': ['शर्मा', 'sharma', 'पाण्डे', 'pandey', 'चेत्री', 'chhetri', 'थापा', 'thapa', 'राणा', 'rana', 'श्रेष्ठ', 'shrestha', 'यादव', 'yadav', 'राई', 'rai', 'गुरुङ', 'gurung', 'मगर', 'magar', 'तामाङ', 'tamang', 'लिम्बू', 'limbu', 'शेर्पा', 'sherpa', 'थारू', 'tharu'],
    'Muslim': ['मोहमद', 'mohammad', 'mohamed', 'mohammed', 'खान', 'khan', 'शेख', 'sheikh', 'मियाँ', 'miyan', 'मियां', 'miyan', 'अली', 'ali', 'हुसैन', 'hussain', 'हसन', 'hasan', 'अहमद', 'ahmad', 'रहमान', 'rahman', 'रशीद', 'rashid', 'इब्राहिम', 'ibrahim', 'युसुफ', 'yusuf', 'अकबर', 'akbar'],
    'Buddhist': ['लामा', 'lama', 'तामाङ', 'tamang', 'शेर्पा', 'sherpa', 'गुरुङ', 'gurung', 'बुद्ध', 'buddha', 'साक्य', 'shakya'],
    'Christian': ['पीटर', 'peter', 'पॉल', 'paul', 'जॉन', 'john', 'मारिया', 'maria', 'मैरी', 'mary'],
    'Other': []
  };

  /**
   * Extract caste from name
   */
  extractCaste(name: string): string {
    if (!name) return 'Unknown';
    
    const nameLower = name.toLowerCase();
    
    // Check each caste pattern
    for (const [caste, patterns] of Object.entries(this.castePatterns)) {
      for (const pattern of patterns) {
        if (nameLower.includes(pattern.toLowerCase())) {
          return caste;
        }
      }
    }
    
    return 'Unknown';
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
  analyzeVoter(voter: { full_name?: string; full_name_english?: string; father_mother_name?: string }): { caste: string; religion: string } {
    // Try full name first
    const name = voter.full_name || voter.full_name_english || '';
    const fatherName = voter.father_mother_name || '';
    
    // Combine names for better analysis
    const combinedName = `${name} ${fatherName}`.trim();
    
    const caste = this.extractCaste(combinedName);
    const religion = this.extractReligion(combinedName);
    
    return { caste, religion };
  }
}

