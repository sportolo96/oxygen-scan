import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AngularFirestore} from "@angular/fire/compat/firestore";
import * as XLSX from 'xlsx';
import {Filesystem, Directory, Encoding} from '@capacitor/filesystem';
import {FileOpener} from '@capawesome-team/capacitor-file-opener';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  data: any = [];
  loading: boolean = false;
  displayedColumns: string[] = ['date', 'pulse', 'spo2', 'pi'];

  constructor(private router: Router, private firestore: AngularFirestore) {
  }

  ngOnInit(): void {
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : {}; // Handle null case

    // Ensure user.email is defined before making the API call
    if (user.email) {
      this.firestore.collection('Data', ref => ref
        .where('email', '==', user.email)  // Filter by email
        .orderBy('date', 'desc')      // Order by date in descending order
      ).valueChanges().subscribe(data => {
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

  async export() {
    // Adatok létrehozása az Excel fájlhoz
    this.loading = true;
    const headers = ['date', 'pi', 'spo2', 'pulse'];
    const data = this.data.map(row => {
      const formattedRow: any = {};

      headers.forEach(header => {
        let value = row[header];

        // Dátum formázása olvashatóvá
        if (header === 'date') {
          const date = new Date(parseInt(value));
          const year = date.getFullYear();
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const day = date.getDate().toString().padStart(2, '0');
          value = `${year}-${month}-${day}`;
        }

        formattedRow[header] = value;
      });

      return formattedRow;
    });

    // Excel munkafüzet és munkalap létrehozása
    const worksheet = XLSX.utils.json_to_sheet(data, {header: headers});
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    // Fájl bináris adatainak kinyerése `Uint8Array` formátumban
    const excelBuffer: any = XLSX.writeXLSX(workbook, {bookType: 'xlsx', type: 'base64'});
    const fileName = `data_${new Date().getTime()}.xlsx`;

    /* attempt to write to the device */
    await Filesystem.writeFile({
      data: excelBuffer,
      path: fileName,
      directory: Directory.Documents
    });

    // Fájl elérési útja a cache mappában
    const fileUri = (await Filesystem.getUri({
      directory: Directory.Documents,
      path: fileName,
    })).uri;

    await FileOpener.openFile({
      path: fileUri
    });
    this.loading = false;
  }
}
