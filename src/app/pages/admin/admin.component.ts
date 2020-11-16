import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  public sidebarOpened: boolean = true;

  constructor() { }

  ngOnInit(): void {
  }

  public sidebarToggle($event: any): void {
    this.sidebarOpened = !this.sidebarOpened;
  }

}
