import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFirestore } from "@angular/fire/compat/firestore";
import * as XLSX from 'xlsx';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';
import { HeaderTitleService } from "../shared/services/headerTitle.service";

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {

  data: any[] = [];
  loading: boolean = false;
  displayedColumns: string[] = ['date', 'pulse', 'spo2', 'pi'];

  constructor(
    private firestore: AngularFirestore,
    private headerTitleService: HeaderTitleService
  ) {
    this.headerTitleService.changeTitle('Előzmények');
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    const user = this.getUserFromLocalStorage();

    if (user?.email) {
      this.firestore.collection('Data', ref => ref
        .where('email', '==', user.email)
        .orderBy('date', 'desc')
      ).valueChanges().subscribe(data => {
        this.data = data;
      });
    } else {
      console.warn('User email not found');
    }
  }

  private getUserFromLocalStorage(): any {
    const userString = localStorage.getItem('user');
    return userString ? JSON.parse(userString) : {};
  }

  async export(): Promise<void> {
    this.loading = true;
    const headers = ['date', 'pi', 'spo2', 'pulse'];
    const formattedData = this.formatDataForExport(headers);

    const worksheet = XLSX.utils.json_to_sheet(formattedData, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    const excelBuffer = XLSX.writeXLSX(workbook, { bookType: 'xlsx', type: 'base64' });
    const fileName = `data_${new Date().getTime()}.xlsx`;

    await this.saveFileToDevice(excelBuffer, fileName);
    this.loading = false;
  }

  private formatDataForExport(headers: string[]): any[] {
    return this.data.map(row => {
      const formattedRow: any = {};

      headers.forEach(header => {
        let value = row[header];
        if (header === 'date') {
          value = this.formatDate(value);
        }
        formattedRow[header] = value;
      });

      return formattedRow;
    });
  }

  private formatDate(value: any): string {
    const date = new Date(parseInt(value));
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private async saveFileToDevice(data: any, fileName: string): Promise<void> {
    await Filesystem.writeFile({
      data,
      path: fileName,
      directory: Directory.Documents
    });

    const fileUri = (await Filesystem.getUri({
      directory: Directory.Documents,
      path: fileName,
    })).uri;

    await FileOpener.openFile({
      path: fileUri
    });
  }
}
