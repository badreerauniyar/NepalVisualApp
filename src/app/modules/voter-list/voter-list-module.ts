import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VoterListRoutingModule } from './voter-list-routing-module';
import { LeftSidebar } from './component/left-sidebar/left-sidebar';
import { RightSidebar } from './component/right-sidebar/right-sidebar';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { VoterList } from './voter-list/voter-list';
import { DropdownSelector } from './component/dropdown-selector/dropdown-selector';
import { VoterTable } from './component/voter-table/voter-table';
import { VoterStatistics } from './component/voter-statistics/voter-statistics';


@NgModule({
  declarations: [
    LeftSidebar,
    RightSidebar,
    VoterList,
    DropdownSelector,
    VoterTable,
    VoterStatistics,
  ],
  imports: [
    FormsModule,
    RouterModule,
    CommonModule,
    VoterListRoutingModule
  ]
})
export class VoterListModule { }
