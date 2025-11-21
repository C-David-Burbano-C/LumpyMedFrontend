import { Component, Input, Output, EventEmitter, OnInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-mobile-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mobile-sidebar.component.html',
  styleUrl: './mobile-sidebar.component.css'
})
export class MobileSidebarComponent implements OnInit {
  @Input() isOpen = false;
  @Input() isAdmin = false;
  @Output() closeSidebar = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
  @Output() hoverChange = new EventEmitter<boolean>();

  menuItems: any[] = [];
  isHovered = false;
  isExpanded = false;
  isMobileOpen = false; 

  constructor(private elementRef: ElementRef) {}

  // Removed HostListener for document clicks to prevent unwanted collapsing

  private allMenuItems = [
    {
      label: 'Calculadora',
      icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      route: '/calculator',
      show: true
    },
    {
      label: 'Calendario',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      route: '/calendar',
      show: true
    },
    {
      label: 'Medicamentos',
      icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
      route: '/medicines',
      adminOnly: true
    },
    {
      label: 'Historial',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      route: '/history',
      show: true
    }
  ];

  ngOnInit() {
    this.updateMenuItems();
  }

  ngOnChanges() {
    this.updateMenuItems();
  }

  private updateMenuItems() {
    this.menuItems = this.allMenuItems.filter(item => {
      if (item.adminOnly) {
        return this.isAdmin;
      }
      return item.show !== false;
    });
  }

  onClose() {
    this.closeSidebar.emit();
  }

  onNavigate() {
    // Cerrar sidebar después de navegar
    this.closeSidebar.emit();
  }

  onLogout() {
    this.logout.emit();
  }

  onMouseEnter() {
    this.isHovered = true;
    if (!this.isExpanded) {
      this.expandSidebar();
    }
  }

    onToggleMobile() {
    this.isMobileOpen = !this.isMobileOpen;
  }

  onNavigateMobile() {
    this.isMobileOpen = false;
  }

  onMouseLeave() {
    this.isHovered = false;
    this.collapseSidebar();
  }

  private expandSidebar() {
    this.isExpanded = true;
    this.hoverChange.emit(true);
  }

  private collapseSidebar() {
    this.isExpanded = false;
    this.hoverChange.emit(false);
  }
}
