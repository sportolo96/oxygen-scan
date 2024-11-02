import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AuthService } from '../../shared/services/auth.service';
import { BleClient, ScanResult } from '@capacitor-community/bluetooth-le';

export interface MeasurementResult {
  spo2: number | null;
  pulse: number | null;
  pi: number | null;
}

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})

export class WelcomeComponent implements OnInit {

  bluetoothConnectedDevice?: ScanResult;
  loading = false;
  user = JSON.parse(localStorage.getItem('user') || '{}');
  averageMeasurementResult: MeasurementResult = JSON.parse(localStorage.getItem('averageMeasurementResult') || '{}');

  constructor(private router: Router, private authService: AuthService, private alertController: AlertController) { 
    this.bluetoothConnectedDevice = JSON.parse(localStorage.getItem('bluetoothConnectedDevice') || '{}');
  }

  ngOnInit(): void {}

  goToPage(pageName: string){
    this.router.navigate([`${pageName}`]);
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
      'Sikeres kijelentkezés!',
      `Sikeresen kijelentkezett fiókjából`
    );
    window.location.reload()
  }

  async disconnectFromBluetoothDevice(scanResult: ScanResult) {
    const device = scanResult.device;
    try {
      await BleClient.disconnect(scanResult.device.deviceId);
      const deviceName = device.name ?? device.deviceId;
      this.bluetoothConnectedDevice = undefined;
      localStorage.removeItem('bluetoothConnectedDevice')
    } catch (error) {
      this.bluetoothConnectedDevice = undefined;
      console.error('disconnectFromDevice', error);
    }
  }

}
