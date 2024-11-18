import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AlertController, IonicModule} from '@ionic/angular';
import {DataService} from '../shared/services/data.service';
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

  measurementResult: MeasurementResult = {
    spo2: null,
    pulse: null,
    pi: null
  };

  readonly viatomServiceUUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E'.toUpperCase();
  readonly viatomCharacteristicUUID = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E'.toUpperCase();

  readonly dialog = inject(MatDialog);

  openDialog(): void {
    const dialogRef = this.dialog.open(AppManualModalPage, {
      data: {measurementResult: this.measurementResult.spo2},
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      console.log(result);
      if (result !== undefined) {
        this.averageMeasurementResult = (result);
        this.addData();
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

  constructor(
    private router: Router,
    private dataService: DataService,
    private alertController: AlertController,
    private headerTitleService: HeaderTitleService
  ) {
    this.headerTitleService.changeTitle('Mérés');

    this.bluetoothConnectedDevice = JSON.parse(localStorage.getItem('bluetoothConnectedDevice') || '{}');
    if (!this.bluetoothConnectedDevice.device) {
      this.bluetoothConnectedDevice = undefined;
    }

    this.init().then(r => console.log('The module was loaded'));
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
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (this.averageMeasurementResult?.pulse >= 130 || this.averageMeasurementResult?.spo2 <= 92 || (this.averageMeasurementResult?.pi <= 0.2 || this.averageMeasurementResult?.pi >= 20)) {
      await this.presentAlert(
        'Kritikus értékek!',
        'Mielőbb végezzen új mérést. Amennyiben a továbbiakban is fenn állnak a mért értékek, kérjen mielőbbi segítséget!',
      );
    }

    // Ensure values are not null
    const spo2 = this.averageMeasurementResult.spo2 ?? 0; // Use a default value if null
    const pi = this.averageMeasurementResult.pi ?? 0; // Use a default value if null
    const pulse = this.averageMeasurementResult.pulse ?? 0; // Use a default value if null

    if (
      spo2 === 0 ||
      !user.email //||
      //this.dps.length < 7
    ) {
      return;
    }

    const data = new Date().getTime();

    localStorage.setItem('averageMeasurementResult', JSON.stringify(this.averageMeasurementResult))

    this.dataService.create({
      id: Math.random().toString().substr(2, 8),
      email: user.email,
      spo2: spo2,
      pi: pi,
      pulse: pulse,
      date: data
    }).then(() => {
      console.log('Sikeres adatmentés!', 'Sikeres adatmentés a felhőbe, később visszanézheti az archív eredmények között.');
    }).catch(error => {
      console.error(error);
    });
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
              label: 'SpO2',
              data: result.spo2Values,
              borderColor: '#FF5733', // Customize color for SpO2
              borderWidth: 1,
            },
            {
              label: 'Pulse',
              data: result.pulseValues,
              borderColor: '#33C1FF', // Customize color for Pulse
              borderWidth: 1,
            },
            {
              label: 'PI',
              data: result.piValues,
              borderColor: '#82E0AA', // Customize color for PI
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

    // Convert labels from number[] to string[]
    const stringLabels = result.labels.map(label => label.toString());

    if (this.pulseChart) {
      this.pulseChart.data.labels = stringLabels; // Use string array here
      this.pulseChart.data.datasets[0].data = result.spo2Values; // SpO2 data
      this.pulseChart.data.datasets[1].data = result.pulseValues; // Pulse data
      this.pulseChart.data.datasets[2].data = result.piValues; // PI data
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
        'A méréshez csatlakoztatni kell egy oxigénszintmérő eszközt!',
      );
      this.endScan = true;
      this.started = false;
      return;
    }

    if (!await this.connectToBluetoothDevice(this.bluetoothConnectedDevice)) {
      await this.presentAlert(
        '',
        `A(z) (${this.bluetoothConnectedDevice?.device?.name ?? this.bluetoothConnectedDevice?.device?.deviceId}) oxigénszintmérőt nem lehet elérni.`,
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
    this.addData();
  }

  async getDeviceNotify() {
    if (this.endScan) {
      // Safely access deviceId using optional chaining and provide a fallback
      const deviceId = this.bluetoothConnectedDevice?.device?.deviceId ?? 'defaultId';
      await BleClient.stopNotifications(deviceId, this.viatomServiceUUID, this.viatomCharacteristicUUID);
      return;
    }

    try {
      // Check if the bluetoothConnectedDevice and device are defined
      if (!this.bluetoothConnectedDevice || !this.bluetoothConnectedDevice.device) {
        console.warn('Bluetooth device not connected');
        return;
      }

      const deviceId = this.bluetoothConnectedDevice.device.deviceId; // Safe to access now
      const stopScanAfterMilliSeconds = 10;

      // Start notifications for the connected device
      await BleClient.startNotifications(
        deviceId,
        this.viatomServiceUUID,
        this.viatomCharacteristicUUID,
        (value) => {
          this.parseData(value);
        }
      );

      // Set a timeout to stop notifications after a certain period
      setTimeout(async () => {
        if (this.started && this.foundData) {
          await BleClient.stopNotifications(deviceId, this.viatomServiceUUID, this.viatomCharacteristicUUID);
          this.foundData = false; // Reset foundData flag
        }
      }, stopScanAfterMilliSeconds);

      // Recursive call to continue getting notifications if needed
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
          // Use a simple assignment instead of nullish coalescing
          this.measurementResult.spo2 = byteArray[index + 2] || null; // Use || to default to null
          this.measurementResult.pulse = byteArray[index + 3] || null; // Use || to default to null
          this.measurementResult.pi = (byteArray[index + 5] !== undefined ? byteArray[index + 5] / 10 : null); // Use ternary to handle division

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
    console.log('received new scan result', result);
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

      console.log('Sikeresen párosítás!', `Sikeresen párosította az (${device.name ?? device.deviceId}) oxigénszintmérőt.`);

      return true;

    } catch (error) {
      console.error('connectToDevice', error);
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
    console.log(`A párosított (${disconnectedDeviceId}) oxigénszintmérő lecsatlakoztatva!`);
    this.measurementResult = {spo2: null, pulse: null, pi: null};
    this.dps = [];
    this.bluetoothConnectedDevice = undefined;
    this.bluetoothScanResults = [];
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
      console.error('Hiba történt a csatlakozási állapot ellenőrzése során:', error);
      return false;
    }
  }

  async presentAlert(text: string, subtext: string) {
    const alert = await this.alertController.create({
      subHeader: text,
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
  ],
})
export class AppInfoModalPage {
  readonly dialogRef = inject(MatDialogRef<AppManualModalPage>);

  onClose(): void {
    this.dialogRef.close();
  }
}
