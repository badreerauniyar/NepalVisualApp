import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { SupabaseService } from '../../../services/supabase.service';

interface User {
  id: string;
  email: string;
  full_name: string;
  role_name: string;
  assigned_provinces: string[];
  is_active: boolean;
  created_at: string;
}

interface Role {
  id: string;
  role_name: string;
  role_description: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss'
})
export class UserManagement implements OnInit {
  users = signal<User[]>([]);
  roles = signal<Role[]>([]);
  provinces = signal<any[]>([]);
  
  // Form state
  showCreateForm = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Create user form
  newUserEmail = signal('');
  newUserFullName = signal('');
  newUserRoleId = signal('');
  newUserProvinces = signal<string[]>([]);

  // Edit state
  editingUserId = signal<string | null>(null);
  editUserRoleId = signal('');
  editUserProvinces = signal<string[]>([]);

  constructor(
    private authService: AuthService,
    private supabaseService: SupabaseService
  ) {}

  async ngOnInit() {
    if (!this.authService.isSuperAdmin()) {
      this.errorMessage.set('Access denied. Superadmin privileges required.');
      return;
    }

    await this.loadData();
    await this.loadProvinces();
  }

  async loadData() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const [usersData, rolesData] = await Promise.all([
        this.authService.getAllUsers(),
        this.authService.getRoles()
      ]);

      this.users.set(usersData || []);
      this.roles.set(rolesData || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      this.errorMessage.set(error.message || 'Failed to load data');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadProvinces() {
    try {
      const provincesData = await this.supabaseService.getProvinces();
      this.provinces.set(provincesData || []);
    } catch (error) {
      console.error('Error loading provinces:', error);
    }
  }

  toggleCreateForm() {
    this.showCreateForm.update(val => !val);
    if (!this.showCreateForm()) {
      this.resetCreateForm();
    }
  }

  resetCreateForm() {
    this.newUserEmail.set('');
    this.newUserFullName.set('');
    this.newUserRoleId.set('');
    this.newUserProvinces.set([]);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  toggleProvince(provinceCode: string) {
    const current = this.newUserProvinces();
    if (current.includes(provinceCode)) {
      this.newUserProvinces.set(current.filter(p => p !== provinceCode));
    } else {
      this.newUserProvinces.set([...current, provinceCode]);
    }
  }

  toggleEditProvince(provinceCode: string) {
    const current = this.editUserProvinces();
    if (current.includes(provinceCode)) {
      this.editUserProvinces.set(current.filter(p => p !== provinceCode));
    } else {
      this.editUserProvinces.set([...current, provinceCode]);
    }
  }

  async createUser() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const email = this.newUserEmail().trim();
      const fullName = this.newUserFullName().trim();
      const roleId = this.newUserRoleId();

      if (!email || !fullName || !roleId) {
        this.errorMessage.set('Please fill in all required fields');
        this.isLoading.set(false);
        return;
      }

      // Create user via Edge Function
      const result = await this.authService.createUser(
        email,
        fullName,
        roleId,
        this.newUserProvinces()
      );

      this.successMessage.set(result.message || 'User created successfully!');
      await this.loadData();
      this.resetCreateForm();
      this.showCreateForm.set(false);

      setTimeout(() => {
        this.successMessage.set('');
      }, 5000);

    } catch (error: any) {
      console.error('Error creating user:', error);
      this.errorMessage.set(error.message || 'Failed to create user');
    } finally {
      this.isLoading.set(false);
    }
  }

  startEdit(user: User) {
    this.editingUserId.set(user.id);
    this.editUserRoleId.set(
      this.roles().find(r => r.role_name === user.role_name)?.id || ''
    );
    this.editUserProvinces.set([...user.assigned_provinces]);
  }

  cancelEdit() {
    this.editingUserId.set(null);
    this.editUserRoleId.set('');
    this.editUserProvinces.set([]);
  }

  async saveUser(userId: string) {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const roleId = this.editUserRoleId();
      const provinces = this.editUserProvinces();

      if (!roleId) {
        this.errorMessage.set('Please select a role');
        this.isLoading.set(false);
        return;
      }

      await this.authService.assignRoleToUser(userId, roleId, provinces);
      
      this.successMessage.set('User updated successfully!');
      await this.loadData();
      this.cancelEdit();

      setTimeout(() => {
        this.successMessage.set('');
      }, 3000);
    } catch (error: any) {
      console.error('Error updating user:', error);
      this.errorMessage.set(error.message || 'Failed to update user');
    } finally {
      this.isLoading.set(false);
    }
  }

  getRoleName(roleId: string): string {
    return this.roles().find(r => r.id === roleId)?.role_name || 'Unknown';
  }

  getProvinceName(provinceCode: string): string {
    const province = this.provinces().find(p => 
      p.province_code === provinceCode || 
      p.english_name === provinceCode ||
      p.nepali_name === provinceCode
    );
    return province ? (province.english_name || province.nepali_name) : provinceCode;
  }

  // Helper methods for template conditions
  isNewUserRoleNotSuperadmin(): boolean {
    const roleId = this.newUserRoleId();
    if (!roleId) return false;
    const role = this.roles().find(r => r.id === roleId);
    return role ? role.role_name !== 'superadmin' : false;
  }

  isEditUserRoleNotSuperadmin(): boolean {
    const roleId = this.editUserRoleId();
    if (!roleId) return false;
    const role = this.roles().find(r => r.id === roleId);
    return role ? role.role_name !== 'superadmin' : false;
  }

  async deleteUser(user: User) {
    // Prevent deleting yourself
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && user.id === currentUser.id) {
      this.errorMessage.set('You cannot delete your own account');
      return;
    }

    // Confirmation dialog
    const confirmed = confirm(
      `Are you sure you want to delete user "${user.email}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      await this.authService.deleteUser(user.id);
      
      this.successMessage.set(`User "${user.email}" deleted successfully!`);
      await this.loadData();

      setTimeout(() => {
        this.successMessage.set('');
      }, 3000);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      this.errorMessage.set(error.message || 'Failed to delete user');
    } finally {
      this.isLoading.set(false);
    }
  }
}

