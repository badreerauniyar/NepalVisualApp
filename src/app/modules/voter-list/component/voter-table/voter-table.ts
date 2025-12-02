import { Component, OnInit, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Voter {
  id: number;
  voter_id: string;
  serial_number: number;
  full_name: string;
  full_name_english?: string;
  gender: string;
  gender_english?: string;
  age: number;
  date_of_birth?: string;
  spouse_name?: string;
  spouse_name_english?: string;
  father_mother_name?: string;
  father_mother_name_english?: string;
  citizen_number?: string;
  address?: string;
  religion?: string;
  caste?: string;
  polling_centers?: {
    id: number;
    nepali_name: string;
    english_name?: string;
    wards?: {
      id: number;
      ward_number: number;
      municipalities?: {
        id: number;
        nepali_name: string;
        districts?: {
          id: number;
          nepali_name: string;
          provinces?: {
            id: number;
            nepali_name: string;
          };
        };
      };
    };
  };
}

@Component({
  selector: 'app-voter-table',
  templateUrl: './voter-table.html',
  styleUrl: './voter-table.scss',
  standalone: false
})
export class VoterTable implements OnInit, OnChanges {
  @Input() voters: Voter[] = [];

  // Filtered and sorted data
  displayedVoters: Voter[] = [];

  // Search
  searchTerm: string = '';

  // Sorting
  sortColumn: string = 'serial_number';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Filtering
  genderFilter: string = '';
  minAgeFilter: number | null = null;
  maxAgeFilter: number | null = null;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 50;
  totalPages: number = 1;

  // Available genders for filter
  availableGenders: string[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.processVoters();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['voters']) {
      console.log('Voters input changed:', this.voters.length);
      this.processVoters();
    }
  }

  processVoters() {
    // Extract unique genders
    this.availableGenders = [...new Set(this.voters.map(v => v.gender).filter(Boolean))];
    
    // Apply filters and sorting
    this.applyFilters();
    this.cdr.detectChanges();
  }

  applyFilters() {
    let filtered = [...this.voters];

    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(v => 
        v.full_name?.toLowerCase().includes(term) ||
        v.voter_id?.toLowerCase().includes(term) ||
        v.full_name_english?.toLowerCase().includes(term)
      );
    }

    // Apply gender filter
    if (this.genderFilter) {
      filtered = filtered.filter(v => v.gender === this.genderFilter);
    }

    // Apply age filters
    if (this.minAgeFilter !== null) {
      filtered = filtered.filter(v => v.age >= this.minAgeFilter!);
    }
    if (this.maxAgeFilter !== null) {
      filtered = filtered.filter(v => v.age <= this.maxAgeFilter!);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any = a[this.sortColumn as keyof Voter];
      let bVal: any = b[this.sortColumn as keyof Voter];

      // Handle null/undefined
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // Compare
      if (typeof aVal === 'string') {
        return this.sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        return this.sortDirection === 'asc' 
          ? aVal - bVal
          : bVal - aVal;
      }
    });

    // Calculate pagination
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }

    // Apply pagination
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.displayedVoters = filtered.slice(startIndex, endIndex);
  }

  onSearchChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  onFilterChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.applyFilters();
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  clearFilters() {
    this.searchTerm = '';
    this.genderFilter = '';
    this.minAgeFilter = null;
    this.maxAgeFilter = null;
    this.currentPage = 1;
    this.applyFilters();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return '↕️';
    }
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

}

