import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { SupabaseService } from '../../../services/supabase.service';
import { FilterSelection } from '../component/dropdown-selector/dropdown-selector';
import { Voter } from '../component/voter-table/voter-table';

@Component({
  selector: 'app-voter-list',
  templateUrl: './voter-list.html',
  styleUrl: './voter-list.scss',
  standalone: false,
})
export class VoterList implements OnInit {
  voters: Voter[] = [];
  loading = false;
  error: string | null = null;
  totalCount = 0;

  constructor(
    private supabaseService: SupabaseService,
    private cdr: ChangeDetectorRef
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
}
