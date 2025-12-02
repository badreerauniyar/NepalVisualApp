import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  @Output() mobileMenuToggle = new EventEmitter<void>();
  @Output() searchQuery = new EventEmitter<string>();

  searchValue = '';

  constructor(
    private router: Router,
    public authService: AuthService
  ) {}

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

  async logout() {
    await this.authService.signOut();
  }
}
