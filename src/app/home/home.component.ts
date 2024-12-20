import {Component, Inject, inject, OnDestroy, OnInit,} from '@angular/core';
import {AlertController} from '@ionic/angular';
import {AuthService} from '../shared/services/auth.service';
import {BleClient, ScanResult} from '@capacitor-community/bluetooth-le';
import {LocalNotifications} from '@capacitor/local-notifications';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle
} from '@angular/material/datepicker';
import {NgxMatTimepickerComponent, NgxMatTimepickerDirective} from 'ngx-mat-timepicker';
import {MatIcon} from '@angular/material/icon';
import {User} from '../shared/models/User';
import {HeaderTitleService} from '../shared/services/headerTitle.service';
import {ImageCroppedEvent, ImageCropperComponent} from 'ngx-image-cropper';
import {Subscription} from 'rxjs';
import {ImageService} from '../shared/services/image.service';
import {UserService} from '../shared/services/user.service';
import {Timer} from '../shared/models/Timer';
import {MeasurementResult} from '../shared/models/MeasurementResult';
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {NetworkStatusService} from "../shared/services/network-status.service";

const DEFAULT_IMAGE = '../assets/img/default.png';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent implements OnInit, OnDestroy {
  loading = false;
  image?: string;
  readonly dialog = inject(MatDialog);
  bluetoothConnectedDevice: ScanResult;
  averageMeasurementResult: MeasurementResult;
  userSubscription?: Subscription;
  imageSubscriptions: Subscription[] = [];
  timer: Timer;
  user: User;
  isOnline: boolean = false;

  constructor(
    private authService: AuthService,
    private alertController: AlertController,
    private headerTitleService: HeaderTitleService,
    private imageService: ImageService,
    private userService: UserService,
    private translateService: TranslateService,
    private networkStatusService: NetworkStatusService,
  ) {
    this.headerTitleService.changeTitle(this.translateService.instant('profile'));
    this.networkStatusService.isOnline.subscribe((status) => {
      this.isOnline = status;
      this.image = localStorage.getItem('profilePicture') &&  this.isOnline ? localStorage.getItem('profilePicture') : DEFAULT_IMAGE;
    });
  }

  ngOnInit(): void {
    this.timer = JSON.parse(localStorage.getItem('timer') || '{}');
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.averageMeasurementResult = JSON.parse(localStorage.getItem('averageMeasurementResult') || '{}');
    this.bluetoothConnectedDevice = JSON.parse(localStorage.getItem('bluetoothConnectedDevice') || '{}');
    this.image = DEFAULT_IMAGE;

    if (this.user?.uid) {
      this.loading = true;
      this.userSubscription = this.userService
        .getById(this.user.uid)
        .subscribe((user) => {
          const imageName = user?.hasProfilePicture ? user.uid : 'default';
          this.fetchImage(`${imageName}.png`, false);
        });
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();

    this.imageSubscriptions.forEach((imageSubscription) => {
      imageSubscription.unsubscribe();
    });
  }

  async presentAlert(text: string, subtext: string) {
    const alert = await this.alertController.create({
      header: text,
      message: subtext,
      buttons: ['OK']
    });

    await alert.present();
  }

  logout() {
    this.authService.logout();
    this.presentAlert('', this.translateService.instant('successfully_logged_out'));
    this.user = null;
    this.image = DEFAULT_IMAGE;
    location.reload();
  }

  async disconnectFromBluetoothDevice(scanResult: ScanResult) {
    this.bluetoothConnectedDevice = undefined;
    localStorage.removeItem('bluetoothConnectedDevice');

    try {
      await BleClient.disconnect(scanResult.device.deviceId);
      this.bluetoothConnectedDevice = undefined;
      localStorage.removeItem('bluetoothConnectedDevice');
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
            title: this.translateService.instant('measurement_notification'),
            body: this.translateService.instant('measurement_notification_text'),
            id: timer.notificationId,
            schedule: {
              repeats: true,
              every: 'day',
              at: today,
              on: {
                hour: today.getHours(),
                minute: today.getMinutes()
              }
            },
            sound: 'default',
            attachments: null,
            actionTypeId: '',
            extra: null
          }
        ]
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
      data: this.timer.time
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      console.log(result);
      if (result !== undefined) {
        this.timer.time = result;
        this.timer.notificationId = (new Date).getTime();
        this.scheduleNotification(this.timer).then(r => console.log('timer set'));
        localStorage.setItem('timer', JSON.stringify(this.timer));
      }
    });
  }

  openDeleteProfileApproveDialog(): void {
    if (!this.isOnline) {
      this.presentAlert('', this.translateService.instant('need_internet_connection'));
      return;
    }

    const deleteDialogRef = this.dialog.open(AppDeleteApprovedModalPage);

    deleteDialogRef.afterClosed().subscribe(async result => {
      console.log('The dialog was closed');
      if (result !== undefined && this.user) {
        this.loading = true;
        const correct = await this.authService.checkPassword(result);

        if (!correct) {
          await this.presentAlert(this.translateService.instant('incorrect_password'), this.translateService.instant('error_while_deleting'));
          this.loading = false;
          return;
        }

        if (this.user.hasProfilePicture) {
          this.imageService.deleteImage(`profile/${this.user.uid}.png`);
        }

        this.userService.delete(this.user.uid).then(() => {
          this.authService.delete().then(() => {
            localStorage.removeItem('user');
            localStorage.removeItem('averageMeasurementResult');
            localStorage.removeItem('profilePicture');
            this.user = null;
            this.image = DEFAULT_IMAGE;
            this.presentAlert(this.translateService.instant('success_profile_delete'), '');
            location.reload();
            return;
          });
        });

        this.loading = false;
        return;
      }
    });
  }

  removeTimer(): void {
    this.clearAllNotifications(this.timer.notificationId).then(() => console.log('removed_timer'));
    localStorage.removeItem('timer');
    this.timer = JSON.parse('{}');
  }

  fetchImage(imageName: string, uploaded: boolean): void {
    const image = localStorage.getItem('profilePicture');

    if (image && !uploaded) {
      this.image = image;
      return;
    }

    const imageSubscription = this.imageService
      .getImage(`/profile/${imageName}`)
      .subscribe((image) => {
        this.image = image;
        localStorage.setItem('profilePicture', image);
      });

    this.imageSubscriptions.push(imageSubscription);
  }

  changePicture(event: Event): void {
    const target = event.target as HTMLInputElement;

    if (!target.files || !target.files[0].type.includes('image/')) {
      this.presentAlert('', this.translateService.instant('error_during_image_upload'));
      return;
    }

    if (!this.isOnline) {
      this.presentAlert('', this.translateService.instant('need_internet_connection'));
      return;
    }

    const dialogRef = this.dialog.open(AppImageUploadModalPage, {
      data: event
    });

    dialogRef.afterClosed().subscribe(image => {
      if (!image) {
        return;
      }

      if (!this.user) {
        return;
      }

      this.loading = true;
      const imageName = `${this.user.uid}.png`;

      this.imageService
        .uploadImage(`/profile/${imageName}`, image)
        .then(() => {
          this.fetchImage(imageName, true);
          this.loading = false;

          if (this.user && !this.user.hasProfilePicture) {
            this.user.hasProfilePicture = true;
            this.userService.update(this.user).then(() => console.log('Successfully updated profile'));
          }
        });
    });
  }
}

// Modal Pages
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
    TranslatePipe
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

@Component({
  selector: 'app-delete-approved-modal',
  templateUrl: 'delete-approved-modal.html',
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
    ReactiveFormsModule,
    TranslatePipe
  ],
})

export class AppDeleteApprovedModalPage {
  deleteForm: FormGroup;
  readonly dialogRef = inject(MatDialogRef<AppSetTimerModalPage>);

  constructor() {
    this.deleteForm = new FormGroup({
      password: new FormControl('', [Validators.required]),
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onOk() {
    if (this.deleteForm.valid) {
      const password = this.deleteForm.get('password')?.value;
      this.dialogRef.close(password);
    }
  }
}

@Component({
  selector: 'app-image-upload-modal',
  templateUrl: 'image-upload-modal.html',
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
    ImageCropperComponent,
    TranslatePipe
  ],
})

export class AppImageUploadModalPage {
  readonly dialogRef = inject(MatDialogRef<AppImageUploadModalPage>);
  readonly data = inject<any>(MAT_DIALOG_DATA);
  croppedImage: any = '';

  imageCropped(event: ImageCroppedEvent): void {
    if (event.objectUrl) {
      this.croppedImage = event.blob;
    }
  }

  saveCroppedImage(): void {
    this.dialogRef.close(this.croppedImage);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
