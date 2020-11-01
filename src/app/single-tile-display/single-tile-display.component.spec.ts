import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleTileDisplayComponent } from './single-tile-display.component';

describe('SingleTileDisplayComponent', () => {
  let component: SingleTileDisplayComponent;
  let fixture: ComponentFixture<SingleTileDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SingleTileDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SingleTileDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
