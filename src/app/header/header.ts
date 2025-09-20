import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [CommonModule, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  @Output() mobileMenuToggle = new EventEmitter<void>();
  @Output() searchQuery = new EventEmitter<string>();

  searchValue = '';

  constructor(private router: Router) {}

  navigateToHome() {
    this.router.navigate(['/']);
  }

  clearSearch() {
    this.searchValue = '';
    this.searchQuery.emit('');
  }

  onSearchChange() {
    this.searchQuery.emit(this.searchValue);
  }

  toggleMobileMenu() {
    this.mobileMenuToggle.emit();
  }
}
