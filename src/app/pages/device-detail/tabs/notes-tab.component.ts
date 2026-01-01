import { Component, Input, Output, EventEmitter, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Device } from '../../../core/services/device.service';
import { FieldConfig } from '../../../core/services/rbac.service';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-notes-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notes-tab.component.html',
  styleUrl: './notes-tab.component.scss'
})
export class NotesTabComponent implements OnDestroy {
  @Input() device: Device | null = null;
  @Input() fieldConfigs: { [key: string]: FieldConfig } = {};
  @Input() isUpdating: boolean = false;
  @Output() fieldUpdate = new EventEmitter<{ field: string; value: any; reason?: string }>();

  notes: string = '';
  isSaving: boolean = false;
  lastSaved: Date | null = null;
  private notesChanged$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private cdr: ChangeDetectorRef) {
    // Auto-save after 2 seconds of inactivity
    this.notesChanged$
      .pipe(debounceTime(2000))
      .subscribe(value => {
        this.saveNotes(value);
      });
  }

  ngOnInit(): void {
    // Initialize notes from device
    this.notes = this.device?.notes || '';
  }

  ngOnChanges(): void {
    // Update notes if device changes
    if (this.device && this.notes !== this.device.notes) {
      this.notes = this.device.notes || '';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.notesChanged$.complete();
  }

  onNotesChange(): void {
    // Trigger auto-save
    this.notesChanged$.next(this.notes);
  }

  saveNotes(value: string): void {
    if (!this.device || this.isUpdating) return;

    // Check if value changed
    if (value === (this.device.notes || '')) {
      return;
    }

    this.isSaving = true;

    // Emit update event to parent
    this.fieldUpdate.emit({
      field: 'notes',
      value: value,
      reason: 'Updated notes via web interface'
    });

    // Simulate saving state (parent will handle actual API call)
    setTimeout(() => {
      this.isSaving = false;
      this.lastSaved = new Date();
      this.cdr.detectChanges();
    }, 500);
  }

  get characterCount(): number {
    return this.notes?.length || 0;
  }

  get maxLength(): number {
    return this.fieldConfigs['notes']?.maxLength || 5000;
  }

  get characterCountClass(): string {
    const percentage = (this.characterCount / this.maxLength) * 100;
    if (percentage >= 90) return 'count-danger';
    if (percentage >= 75) return 'count-warning';
    return 'count-normal';
  }

  get saveStatusText(): string {
    if (this.isSaving) return 'Saving...';
    if (this.lastSaved) {
      const now = new Date();
      const diff = Math.floor((now.getTime() - this.lastSaved.getTime()) / 1000);

      if (diff < 60) return `Saved ${diff} seconds ago`;
      if (diff < 3600) return `Saved ${Math.floor(diff / 60)} minutes ago`;
      return `Saved at ${this.lastSaved.toLocaleTimeString()}`;
    }
    return '';
  }
}
