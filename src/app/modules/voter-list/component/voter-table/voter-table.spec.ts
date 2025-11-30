import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoterTable } from './voter-table';

describe('VoterTable', () => {
  let component: VoterTable;
  let fixture: ComponentFixture<VoterTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VoterTable ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VoterTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

