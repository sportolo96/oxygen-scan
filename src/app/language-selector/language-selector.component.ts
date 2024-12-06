import {Component, OnInit} from '@angular/core';
import { Location } from '@angular/common';
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-language-selector',
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.scss'],
})
export class LanguageSelectorComponent{
  languages = [
    { code: 'en', label: 'EN' },
    { code: 'hu', label: 'HU' }
  ];

  currentLang: string = 'en';

  constructor(private translateService: TranslateService) {
    this.getCurrentLang();
  }

  getCurrentLang(): void {
    this.currentLang = localStorage.getItem('lang' || 'hu');
  }

  switchLanguage(lang: string) {
    localStorage.setItem('lang', lang);
    this.translateService.use(lang);
    this.getCurrentLang();
    location.reload()
  }
}
