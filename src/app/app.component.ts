import { Component, HostListener, importProvidersFrom } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { GlobeComponent } from './components/globe/globe.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    GlobeComponent,
    SidebarComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'monitor-the-situation';
  
  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 900;
  }

  isMobile = window.innerWidth < 900;
  sidebarActive = false;

  toggleSidebar() {
    this.sidebarActive = !this.sidebarActive;
  }
}