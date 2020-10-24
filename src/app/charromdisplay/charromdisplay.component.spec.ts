import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharromdisplayComponent } from './charromdisplay.component';

describe('CharromdisplayComponent', () => {
  let component: CharromdisplayComponent;
  let fixture: ComponentFixture<CharromdisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CharromdisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CharromdisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
