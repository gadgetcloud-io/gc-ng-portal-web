import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HelpDialogComponent } from '../help-dialog/help-dialog';

@Component({
  selector: 'gc-floating-help-button',
  standalone: true,
  imports: [CommonModule, HelpDialogComponent],
  templateUrl: './floating-help-button.html',
  styleUrl: './floating-help-button.scss'
})
export class FloatingHelpButtonComponent {
  isDialogOpen = false;

  openDialog(): void {
    this.isDialogOpen = true;
  }

  closeDialog(): void {
    this.isDialogOpen = false;
  }
}
