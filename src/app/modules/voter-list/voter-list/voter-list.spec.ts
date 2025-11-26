import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoterList } from './voter-list';

describe('VoterList', () => {
  let component: VoterList;
  let fixture: ComponentFixture<VoterList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoterList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VoterList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
