import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharRomViewerComponent } from './char-rom-viewer.component';

describe('CharRomViewerComponent', () => {
  let component: CharRomViewerComponent;
  let fixture: ComponentFixture<CharRomViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CharRomViewerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CharRomViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
