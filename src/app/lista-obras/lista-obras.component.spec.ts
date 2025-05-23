import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaObrasComponent } from './lista-obras.component';

describe('ListaObrasComponent', () => {
  let component: ListaObrasComponent;
  let fixture: ComponentFixture<ListaObrasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaObrasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaObrasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
