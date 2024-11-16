import {Component, inject, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AlertController} from '@ionic/angular';
import {AuthService} from '../../shared/services/auth.service';
import {BleClient, ScanResult} from '@capacitor-community/bluetooth-le';
import {LocalNotifications} from "@capacitor/local-notifications";
import {
  MAT_DIALOG_DATA, MatDialog,
  MatDialogActions, MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from "@angular/material/dialog";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {FormsModule} from "@angular/forms";
import {MatButtonModule} from "@angular/material/button";
import {MatDatepicker, MatDatepickerInput, MatDatepickerToggle} from "@angular/material/datepicker";
import {NgxMatTimepickerComponent, NgxMatTimepickerDirective} from "ngx-mat-timepicker";
import {MatIcon} from "@angular/material/icon";
import {ScheduleOn} from "@capacitor/local-notifications/dist/esm/definitions";
import {User} from "../../shared/models/User";

export interface MeasurementResult {
  spo2: number | null;
  pulse: number | null;
  pi: number | null;
}

export interface Timer {
  time: string;
  notificationId: number | null;
}

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})

export class WelcomeComponent implements OnInit {

  loading = false;
  timer: Timer = JSON.parse(localStorage.getItem('timer') || '{}');
  user: User = JSON.parse(localStorage.getItem('user') || '{}');
  readonly dialog = inject(MatDialog);
  bluetoothConnectedDevice: ScanResult = JSON.parse(localStorage.getItem('bluetoothConnectedDevice') || '{}');
  averageMeasurementResult: MeasurementResult = JSON.parse(localStorage.getItem('averageMeasurementResult') || '{}');

  constructor(private router: Router, private authService: AuthService, private alertController: AlertController) {
  }

  ngOnInit(): void {
  }

  async presentAlert(text: string, subtext: string) {
    const alert = await this.alertController.create({
      header: 'Figyelem!',
      subHeader: text,
      message: subtext,
      buttons: ['OK']
    });

    await alert.present();
  }

  logout() {
    this.authService.logout();
    this.presentAlert(
      '',
      `Sikeresen kijelentkezett fiókjából`
    );
    this.user = null;
  }

  async disconnectFromBluetoothDevice(scanResult: ScanResult) {
    this.bluetoothConnectedDevice = undefined;
    localStorage.removeItem('bluetoothConnectedDevice');

    try {
      await BleClient.disconnect(scanResult.device.deviceId);
      this.bluetoothConnectedDevice = undefined;
      localStorage.removeItem('bluetoothConnectedDevice')
    } catch (error) {
      this.bluetoothConnectedDevice = undefined;
      console.error('disconnectFromDevice', error);
    }
  }

  async scheduleNotification(timer: null | Timer) {
    if (!timer || !timer.time) {
      return;
    }

    await this.clearAllNotifications(timer.notificationId);

    const permStatus = await LocalNotifications.requestPermissions();
    const now = new Date();
    const today = new Date();
    const [hours, minutes] = timer.time.split(':').map(Number);
    today.setHours(hours, minutes, 0, 0);

    // If the specified time has already passed today, schedule it for tomorrow
    if (today <= now) {
      today.setDate(today.getDate() + 1);
    }

    if (permStatus.display === 'granted') {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Mérésemlékeztető',
            body: 'Ideje elvégezni a napi oxigénszint mérését',
            id: timer.notificationId,
            schedule: {
              repeats: true,
              every: 'day',
              at: today,
              on: {
                hour: today.getHours(),
                minute: today.getMinutes(),
              },
            },
            sound: 'default',
            attachments: null,
            actionTypeId: '',
            extra: null,
          },
        ],
      });
    } else {
      console.warn('User denied permissions for local notifications');
    }
  }

  async clearAllNotifications(id: null | number) {
    await LocalNotifications.removeAllDeliveredNotifications();
    await LocalNotifications.cancel({notifications: [{id: id}]});
    console.log('All notifications have been cancelled.');
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(AppSetTimerModalPage, {
      data: this.timer.time,
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      console.log(result);
      if (result !== undefined) {
        this.timer.time = result;
        this.timer.notificationId = (new Date).getTime();
        this.scheduleNotification(this.timer).then(r => console.log('timer set'))
        localStorage.setItem('timer', JSON.stringify(this.timer));
      }
    });
  }

  removeTimer(): void {
    this.clearAllNotifications(this.timer.notificationId).then(r => console.log('removed_timer'));
    localStorage.removeItem('timer');
    this.timer = JSON.parse('{}');

  }
}

@Component({
  selector: 'app-set-timer-modal',
  templateUrl: 'set-timer-modal.html',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatDatepickerToggle,
    MatDatepicker,
    MatDatepickerInput,
    NgxMatTimepickerComponent,
    NgxMatTimepickerDirective,
    MatIcon,
  ],
})

export class AppSetTimerModalPage {
  readonly dialogRef = inject(MatDialogRef<AppSetTimerModalPage>);
  readonly data = inject<string>(MAT_DIALOG_DATA);
  time: string = this.data ?? '16:00';

  onClose(): void {
    this.dialogRef.close();
  }

  onSubmit() {
    if (!this.time) {
      return;
    }

    this.dialogRef.close(this.time);
  }
}
