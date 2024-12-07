import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import * as XLSX from 'xlsx';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';
import { FhirObservation } from '../shared/models/FhirObservation';
import {HeaderTitleService} from "../shared/services/headerTitle.service";
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
})
export class HistoryComponent implements OnInit {
  data: any[] = [];
  loading: boolean = false;
  displayedColumns: string[] = ['date', 'pi', 'spo2', 'pulse'];

  constructor(
    private firestore: AngularFirestore,
    private headerTitleService: HeaderTitleService,
    private translateService: TranslateService,
  ) {
    this.headerTitleService.changeTitle(this.translateService.instant('histories'));
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    const user = this.getUserFromLocalStorage();

    if (user?.uid) {
      this.firestore
        .collection('Users')
        .doc(user.uid)
        .collection('Observations', (ref) =>
          ref.orderBy('effectiveDateTime', 'desc')
        )
        .valueChanges()
        .subscribe((data) => {
          const groupedData = this.groupObservationsByDate(data as FhirObservation[]);
          this.data = this.formatDataForDisplay(groupedData);
        });
    } else {
      console.warn('User ID not found');
    }
  }

  private getUserFromLocalStorage(): any {
    const userString = localStorage.getItem('user');
    return userString ? JSON.parse(userString) : {};
  }

  private groupObservationsByDate(observations: FhirObservation[]): any[] {
    const grouped: { [key: string]: any } = {};

    observations.forEach((obs) => {
      const date = obs.effectiveDateTime;
      if (!grouped[date]) {
        grouped[date] = { date };
      }

      if (obs.code.text === 'Heart rate') {
        grouped[date].pulse = obs.valueQuantity.value;
      } else if (obs.code.text === 'Oxygen saturation') {
        grouped[date].spo2 = obs.valueQuantity.value;
      } else if (obs.code.text === 'Perfusion index') {
        grouped[date].pi = obs.valueQuantity.value;
      }
    });

    return Object.values(grouped);
  }

  private formatDataForDisplay(groupedData: any[]): any[] {
    return groupedData.map((row) => ({
      date: row.date,
      pulse: row.pulse ?? 'N/A',
      spo2: row.spo2 ?? 'N/A',
      pi: row.pi ?? 'N/A',
    }));
  }

  private formatDate(value: string): string {
    const date = new Date(value);

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hour}:${minute}`;
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
    return this.data.map((row) => {
      const formattedRow: any = {};

      headers.forEach((header) => {
        let value = row[header];
        if (header === 'date') {
          value = this.formatDate(row.date);
        } else if (header === 'pulse') {
          value = row.pulse;
        } else if (header === 'spo2') {
          value = row.spo2;
        } else if (header === 'pi') {
          value = row.pi;
        }
        formattedRow[header] = value;
      });

      return formattedRow;
    });
  }

  private async saveFileToDevice(data: any, fileName: string): Promise<void> {
    await Filesystem.writeFile({
      data,
      path: fileName,
      directory: Directory.Documents,
    });

    const fileUri = (await Filesystem.getUri({
      directory: Directory.Documents,
      path: fileName,
    })).uri;

    await FileOpener.openFile({
      path: fileUri,
    });
  }
}
