import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerHourEarningsComponent } from './per-hour-earnings.component';

describe('PerHourEarningsComponent', () => {
  let component: PerHourEarningsComponent;
  let fixture: ComponentFixture<PerHourEarningsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerHourEarningsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PerHourEarningsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
