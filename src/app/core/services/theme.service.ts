import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  readonly isDarkMode = signal<boolean>(this.checkInitialTheme());

  constructor() {
    this.applyTheme(this.isDarkMode());
  }

  private checkInitialTheme(): boolean {
    const stored = localStorage.getItem('dipwise_theme');
    if (stored) {
      return stored === 'dark';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  toggleTheme(): void {
    const next = !this.isDarkMode();
    this.isDarkMode.set(next);
    this.applyTheme(next);
    localStorage.setItem('dipwise_theme', next ? 'dark' : 'light');
  }

  private applyTheme(dark: boolean): void {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
