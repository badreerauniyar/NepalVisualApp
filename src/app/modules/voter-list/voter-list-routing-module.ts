import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VoterList } from './voter-list/voter-list';

const routes: Routes = [
  {
    path: '',
    component:VoterList
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VoterListRoutingModule { }
