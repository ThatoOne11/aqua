import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';

export function registerCustomSvgIcons(
  iconRegistry: MatIconRegistry,
  sanitizer: DomSanitizer
): void {
  const assetsIconPath = 'assets/icons/';
  const icons: Array<{ name: string; path: string }> = []; //Keeping this to possibly to change icon to svg in future

  for (const icon of icons) {
    iconRegistry.addSvgIcon(
      icon.name,
      sanitizer.bypassSecurityTrustResourceUrl(icon.path)
    );
  }
}
