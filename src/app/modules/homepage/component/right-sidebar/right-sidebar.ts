import { Component, EventEmitter, Output } from '@angular/core';

interface Category {
  value: string;
  name: string;
  icon: string;
  count: number;
}

interface FilterOption {
  value: string;
  name: string;
  count: number;
}

@Component({
  selector: 'app-right-sidebar',
  templateUrl: './right-sidebar.html',
  styleUrl: './right-sidebar.scss',
  standalone:false
})
export class RightSidebar {
  @Output() categoryChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<any>();
  @Output() mapControl = new EventEmitter<string>();
  @Output() sidebarToggle = new EventEmitter<void>();

  selectedCategory = 'schools';
  selectedSchoolTypes: string[] = [];
  selectedSchoolLevels: string[] = [];

  categories: Category[] = [
    {
      value: 'schools',
      name: 'Schools',
      icon: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/>',
      count: 2847
    },
    {
      value: 'hospitals',
      name: 'Hospitals',
      icon: '<path d="M22 8v14H2V8"/><path d="M2 8h20"/><path d="M12 2v6"/><path d="M8 4h8"/><path d="M6 12h4"/><path d="M14 12h4"/><path d="M6 16h4"/><path d="M14 16h4"/>',
      count: 0
    },
    {
      value: 'roads',
      name: 'Roads',
      icon: '<path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/><path d="M8 3v18"/><path d="M16 3v18"/>',
      count: 0
    }
  ];

  schoolTypes: FilterOption[] = [
    { value: 'public', name: 'Public', count: 2156 },
    { value: 'private', name: 'Private', count: 691 }
  ];

  schoolLevels: FilterOption[] = [
    { value: 'primary', name: 'Primary', count: 1847 },
    { value: 'secondary', name: 'Secondary', count: 1234 },
    { value: 'higher-secondary', name: 'Higher Secondary', count: 456 }
  ];

  selectCategory(categoryValue: string) {
    this.selectedCategory = categoryValue;
    this.categoryChange.emit(categoryValue);
    this.emitFilterChange();
  }

  getCategoryTitle(): string {
    const category = this.categories.find(c => c.value === this.selectedCategory);
    return category ? category.name : '';
  }

  isSchoolTypeSelected(type: string): boolean {
    return this.selectedSchoolTypes.includes(type);
  }

  isSchoolLevelSelected(level: string): boolean {
    return this.selectedSchoolLevels.includes(level);
  }

  toggleSchoolType(type: string) {
    if (this.selectedSchoolTypes.includes(type)) {
      this.selectedSchoolTypes = this.selectedSchoolTypes.filter(t => t !== type);
    } else {
      this.selectedSchoolTypes.push(type);
    }
    this.emitFilterChange();
  }

  toggleSchoolLevel(level: string) {
    if (this.selectedSchoolLevels.includes(level)) {
      this.selectedSchoolLevels = this.selectedSchoolLevels.filter(l => l !== level);
    } else {
      this.selectedSchoolLevels.push(level);
    }
    this.emitFilterChange();
  }

  resetCategoryFilters() {
    this.selectedSchoolTypes = [];
    this.selectedSchoolLevels = [];
    this.emitFilterChange();
  }

  resetMapView() {
    this.mapControl.emit('reset');
  }

  toggleFullscreen() {
    this.mapControl.emit('fullscreen');
  }

  toggleSidebar() {
    this.sidebarToggle.emit();
  }

  private emitFilterChange() {
    this.filterChange.emit({
      category: this.selectedCategory,
      schoolTypes: this.selectedSchoolTypes,
      schoolLevels: this.selectedSchoolLevels
    });
  }
}
