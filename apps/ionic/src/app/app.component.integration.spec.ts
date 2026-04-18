import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent (integration)', () => {
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), AppComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
  });

  it('should create the app', () => {
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render Ionic app shell with router outlet', () => {
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('ion-app')).not.toBeNull();
    expect(root.querySelector('ion-router-outlet')).not.toBeNull();
  });
});
