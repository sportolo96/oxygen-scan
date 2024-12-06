import {Component, OnDestroy, OnInit} from '@angular/core';
import {AlertController, IonicModule} from '@ionic/angular';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
} from 'chart.js';
import {BleClient, ScanResult} from '@capacitor-community/bluetooth-le';
import {Subscription} from "rxjs";

import {inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {HeaderTitleService} from "../shared/services/headerTitle.service";
import {MeasurementResult} from "../shared/models/MeasurementResult";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {FhirObservation} from "../shared/models/FhirObservation";
import {StorageService} from "../shared/services/storage.service";
import {ObservationService} from "../shared/services/observation.service";

Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale);

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.component.html',
  styleUrls: ['./scanner.component.scss'],
})

export class ScannerComponent implements OnInit, OnDestroy {
  bluetoothScanResults: ScanResult[] = [];
  endScan = true;
  loading = false;
  connectionCheckSubscription: Subscription | null = null;
  averageMeasurementResult: MeasurementResult = {spo2: null, pulse: null, pi: null};
  started = false;
  foundData = false;
  dps: MeasurementResult[] = [];
  bluetoothIsScanning = false;
  bluetoothConnectedDevice?: ScanResult;
  services = [];
  pulseChart: Chart | null = null;
  user: any;

  measurementResult: MeasurementResult = {
    spo2: null,
    pulse: null,
    pi: null
  };

  readonly viatomServiceUUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E'.toUpperCase();
  readonly viatomCharacteristicUUID = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E'.toUpperCase();

  readonly dialog = inject(MatDialog);

  constructor(
    private alertController: AlertController,
    private headerTitleService: HeaderTitleService,
    private translateService: TranslateService,
    private storageService: StorageService,
    private observationService: ObservationService
  ) {
    this.headerTitleService.changeTitle(this.translateService.instant('measurement'));

    this.bluetoothConnectedDevice = JSON.parse(localStorage.getItem('bluetoothConnectedDevice') || '{}');
    if (!this.bluetoothConnectedDevice.device) {
      this.bluetoothConnectedDevice = undefined;
    }

    this.init().then(r => console.log('The module was loaded'));
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(AppManualModalPage, {
      data: {measurementResult: this.measurementResult.spo2},
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      console.log(result);
      if (result !== undefined) {
        this.averageMeasurementResult = (result);
        this.addData().then(r => console.log("Measurement result is stored", r));
      }
    });
  }

  openInfoDialog(): void {
    const dialogRef = this.dialog.open(AppInfoModalPage, {
      width: '100%',
      maxWidth: '100vw',
      height: 'auto'
    });
  }

  async init() {
    await BleClient.initialize();
  }

  calculateAverage(array: MeasurementResult[] = []) {
    if (!array.length) {
      return;
    }

    let sumSpo2 = 0;
    let sumPulse = 0;
    let sumPi = 0;

    array.forEach(object => {
      sumSpo2 += object.spo2 ?? 0;
      sumPulse += object.pulse ?? 0;
      sumPi += object.pi ?? 0;
    });

    this.averageMeasurementResult = {
      spo2: this.round(sumSpo2 / array.length, 1),
      pulse: this.round(sumPulse / array.length, 1),
      pi: this.round(sumPi / array.length, 1)
    };
  }

  round(value: number | null, precision: number | undefined): number | null {
    if (value === null) return null;
    const multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
  }

  async addData() {
    if (this.averageMeasurementResult?.pulse >= 130 ||
      this.averageMeasurementResult?.spo2 <= 92 ||
      (this.averageMeasurementResult?.pi <= 0.2 || this.averageMeasurementResult?.pi >= 20)
    ) {
      await this.presentAlert(
        this.translateService.instant('critical_values_title'),
        this.translateService.instant('critical_values_long_text'),
      );
    }

    localStorage.setItem('averageMeasurementResult', JSON.stringify(this.averageMeasurementResult))

    if (!this.user.uid) {
      console.log("We cannot sync data without registered user")
      return;
    }

    const date = new Date();

    localStorage.setItem('averageMeasurementResult', JSON.stringify(this.averageMeasurementResult))

    let observations: FhirObservation[] = [];
    observations.push(await this.saveMeasurement('spo2', date));
    observations.push(await this.saveMeasurement('pulse', date));
    observations.push(await this.saveMeasurement('pi', date));

    await this.storageService.saveObservationData(this.user.uid, observations);

  }

  createChart(result: { labels: string[]; spo2Values: number[]; pulseValues: number[]; piValues: number[] }) {
    const canvas = document.getElementById('pulseChart') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      this.pulseChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: result.labels,
          datasets: [
            {
              label: this.translateService.instant('spo2_short'),
              data: result.spo2Values,
              borderColor: '#FF5733',
              borderWidth: 1,
            },
            {
              label: this.translateService.instant('pulse.short'),
              data: result.pulseValues,
              borderColor: '#33C1FF',
              borderWidth: 1,
            },
            {
              label: this.translateService.instant('pi_short'),
              data: result.piValues,
              borderColor: '#82E0AA',
              borderWidth: 1,
            }
          ]
        },
        options: {
          scales: {
            y: {
              min: 0,
              max: 200,
            }
          }
        }
      });
    }
  }

  updateChart(array: MeasurementResult[]) {
    if (!array.length) {
      return;
    }

    const result = this.getValues(array);
    const stringLabels = result.labels.map(label => label.toString());

    if (this.pulseChart) {
      this.pulseChart.data.labels = stringLabels;
      this.pulseChart.data.datasets[0].data = result.spo2Values;
      this.pulseChart.data.datasets[1].data = result.pulseValues;
      this.pulseChart.data.datasets[2].data = result.piValues;
      this.pulseChart.update();
    } else {
      this.createChart({
        labels: stringLabels,
        spo2Values: result.spo2Values,
        pulseValues: result.pulseValues,
        piValues: result.piValues
      });
    }
  }

  getValues(array: MeasurementResult[]): {
    labels: number[];
    spo2Values: number[];
    pulseValues: number[];
    piValues: number[]
  } {
    const spo2Values: number[] = [];
    const pulseValues: number[] = [];
    const piValues: number[] = [];
    const labelsArray: number[] = [];

    array.forEach((valueObject, index) => {
      spo2Values.push(valueObject.spo2 || 0);
      pulseValues.push(valueObject.pulse || 0);
      piValues.push(valueObject.pi || 0);
      labelsArray.push(index);
    });

    return {labels: labelsArray, spo2Values, pulseValues, piValues};
  }

  async stopScanForBluetoothDevices() {
    try {
      await BleClient.stopLEScan();
      this.bluetoothIsScanning = false;
    } catch (error) {
      this.bluetoothIsScanning = false;
      console.error('StopScanning', error);
    }
  }

  async scanForBluetoothDevices() {
    try {
      this.bluetoothScanResults = [];
      this.bluetoothIsScanning = true;

      await BleClient.requestLEScan(
        {services: [this.viatomServiceUUID]},
        this.onBluetoothDeviceFound.bind(this)
      );

      const stopScanAfterMilliSeconds = 3500;
      setTimeout(async () => {
        await this.stopScanForBluetoothDevices();
      }, stopScanAfterMilliSeconds);
    } catch (error) {
      this.bluetoothIsScanning = false;
      console.error('scanForBluetoothDevices', error);
    }
  }

  async startMonitoring() {
    this.endScan = false;
    this.started = true;

    if (!this.bluetoothConnectedDevice?.device.deviceId) {
      await this.presentAlert(
        '',
        this.translateService.instant('need_to_connect_device'),
      );
      this.endScan = true;
      this.started = false;
      return;
    }

    if (!await this.connectToBluetoothDevice(this.bluetoothConnectedDevice)) {
      await this.presentAlert(
        '',
        `${this.translateService.instant('the')} (${this.bluetoothConnectedDevice?.device?.name ??
        this.bluetoothConnectedDevice?.device?.deviceId}) ${this.translateService.instant('cannot_reach_device_end')}`,
      );
      this.endScan = true;
      this.started = false;
      return;
    }

    this.averageMeasurementResult = {spo2: null, pulse: null, pi: null};
    this.measurementResult = {spo2: null, pulse: null, pi: null};
    this.dps = [];
    this.startStopTimer();
    await this.getDeviceNotify();
    this.calculateAverage(this.dps);
    this.updateChart(this.dps);
    await this.addData();
  }

  async getDeviceNotify() {
    if (this.endScan) {
      const deviceId = this.bluetoothConnectedDevice?.device?.deviceId ?? 'defaultId';
      await BleClient.stopNotifications(deviceId, this.viatomServiceUUID, this.viatomCharacteristicUUID);
      return;
    }

    try {
      if (!this.bluetoothConnectedDevice || !this.bluetoothConnectedDevice.device) {
        console.warn('Bluetooth device not connected');
        return;
      }

      const deviceId = this.bluetoothConnectedDevice.device.deviceId;
      const stopScanAfterMilliSeconds = 10;

      await BleClient.startNotifications(
        deviceId,
        this.viatomServiceUUID,
        this.viatomCharacteristicUUID,
        (value) => {
          this.parseData(value);
        }
      );

      setTimeout(async () => {
        if (this.started && this.foundData) {
          await BleClient.stopNotifications(deviceId, this.viatomServiceUUID, this.viatomCharacteristicUUID);
          this.foundData = false;
        }
      }, stopScanAfterMilliSeconds);

      await this.getDeviceNotify();
    } catch (error) {
      console.error('Error while getting data', error);
    }
  }


  parseData(value: DataView) {
    const byteArray = new Uint8Array(value.buffer);

    if (byteArray.length > 0) {
      for (let index = 0; index < byteArray.length; index++) {
        if (byteArray[index] === 0x08 && byteArray[index + 1] === 0x01 && byteArray[index + 5] !== undefined) {
          this.measurementResult.spo2 = byteArray[index + 2] || null;
          this.measurementResult.pulse = byteArray[index + 3] || null;
          this.measurementResult.pi = (byteArray[index + 5] !== undefined ? byteArray[index + 5] / 10 : null);

          this.dps.push({
            spo2: this.measurementResult.spo2,
            pulse: this.measurementResult.pulse,
            pi: this.measurementResult.pi,
          });

          this.foundData = true;
          this.updateChart(this.dps);
          break;
        }
      }
    }
  }

  startStopTimer() {
    setTimeout(async () => {
      this.endScan = true;
      this.started = false;
    }, 10000);
  }

  onBluetoothDeviceFound(result: ScanResult) {
    console.log('Received new scan result', result);
    this.bluetoothScanResults.push(result);
  }

  async connectToBluetoothDevice(scanResult: ScanResult) {
    const device = scanResult.device;
    try {
      let devices = await BleClient.getConnectedDevices([this.viatomServiceUUID]);
      if (!devices.length) {
        devices = await BleClient.getDevices([device.deviceId]);
      }

      if (!devices.length) {
        throw new Error('Not connected device');
      }

      await BleClient.connect(
        devices[0]?.deviceId,
        this.onBluetoothDeviceDisconnected.bind(this)
      );

      this.bluetoothConnectedDevice = scanResult;
      localStorage.setItem('bluetoothConnectedDevice', JSON.stringify(scanResult))

      console.log('Success pairing!', `Successfully paired (${device.name ?? device.deviceId}) sensor.`);

      return true;

    } catch (error) {
      console.error('ConnectToDevice', error);
      return false;
    }
  }

  async disconnectFromBluetoothDevice(scanResult: ScanResult) {
    this.bluetoothConnectedDevice = undefined;
    localStorage.removeItem('bluetoothConnectedDevice');

    try {
      await BleClient.disconnect(scanResult.device.deviceId);
      this.bluetoothConnectedDevice = undefined;
      this.bluetoothScanResults = [];
      localStorage.removeItem('bluetoothConnectedDevice')
    } catch (error) {
      this.bluetoothScanResults = [];
      this.bluetoothConnectedDevice = undefined;
      console.error('disconnectFromDevice', error);
    }
  }

  onBluetoothDeviceDisconnected(disconnectedDeviceId: string) {
    console.log(`The paired (${disconnectedDeviceId}) sensor is disconnected!`);
    this.measurementResult = {spo2: null, pulse: null, pi: null};
    this.dps = [];
    this.bluetoothConnectedDevice = undefined;
    this.bluetoothScanResults = [];
  }

  async saveMeasurement(measurementType: string, date: Date) {
    let observation: FhirObservation;

    switch (measurementType) {
      case 'spo2':
        observation = this.observationService.createObservation(this.user.uid, date.toISOString(), 'spo2', '2708-6', 'SPO2', this.averageMeasurementResult.spo2, '%');
        break;
      case 'pulse':
        observation = this.observationService.createObservation(this.user.uid, date.toISOString(), 'pulse', '8867-4', 'Pulse', this.averageMeasurementResult.pulse, 'bpm');
        break;
      case 'pi':
        observation = this.observationService.createObservation(this.user.uid, date.toISOString(), 'pi', '9279-1', 'PI', this.averageMeasurementResult.pi, 'unit');
        break;
      default:
        console.error('Ismeretlen mérés típusa');
        return null;
    }

    return observation;
  }

  ngOnInit() {
    this.averageMeasurementResult = JSON.parse(localStorage.getItem('averageMeasurementResult') || '{}');

    this.createChart({
      labels: [],
      spo2Values: [],
      pulseValues: [],
      piValues: []
    });
  }

  ngOnDestroy() {
    if (this.connectionCheckSubscription) {
      this.connectionCheckSubscription.unsubscribe();
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      const connectedDevices = await BleClient.getConnectedDevices([this.viatomServiceUUID]);
      return Boolean(connectedDevices.length);

    } catch (error) {
      console.error('Cannot check connection:', error);
      return false;
    }
  }

  async presentAlert(text: string, subtext: string) {
    const alert = await this.alertController.create({
      header: text,
      message: subtext,
      buttons: ['OK']
    });

    await alert.present();
  }
}

@Component({
  selector: 'app-manual-modal',
  templateUrl: 'manual-modal.html',
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
    TranslatePipe,
  ],
})
export class AppManualModalPage {
  readonly dialogRef = inject(MatDialogRef<AppManualModalPage>);
  readonly data = inject<MeasurementResult>(MAT_DIALOG_DATA);
  readonly measurement: MeasurementResult = this.data;

  onClose(): void {
    this.dialogRef.close();
  }

  onSubmit() {
    if (!this.measurement.spo2 || !this.measurement.pi || !this.measurement.pulse) {
      return;
    }

    this.dialogRef.close(this.measurement);
  }
}

@Component({
  selector: 'app-info-modal',
  templateUrl: 'info-modal.html',
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
    IonicModule,
    TranslatePipe,
  ],
})
export class AppInfoModalPage {
  readonly dialogRef = inject(MatDialogRef<AppManualModalPage>);

  onClose(): void {
    this.dialogRef.close();
  }
}
