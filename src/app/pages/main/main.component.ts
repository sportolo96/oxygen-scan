import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../shared/services/data.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  data: any = [];
  displayedColumns: string[] = ['date', 'pulse', 'spo2', 'pi'];

  constructor(private router: Router, private dataService: DataService) { }

  ngOnInit(): void {
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : {}; // Handle null case

    // Ensure user.email is defined before making the API call
    if (user.email) {
      this.dataService.getByEmail(user.email).subscribe(data => {
        console.log(data);
        this.data = data;
      });
    } else {
      console.warn('User email not found');
    }
  }

  goToPage(pageName: string) {
    this.router.navigate([`${pageName}`]);
  }
}