import { ChangeDetectionStrategy, Component, HostListener, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { METER_TEMPLATES, PoetryStoreService } from './services/poetry-store.service';
import type { AntithesisPositionCheck, AntithesisStatus } from './models/poem.models';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    FormsModule,
    NzAlertModule,
    NzBadgeModule,
    NzButtonModule,
    NzDividerModule,
    NzEmptyModule,
    NzInputModule,
    NzProgressModule,
    NzSelectModule,
    NzSwitchModule,
    NzTabsModule,
    NzTagModule,
    NzToolTipModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly store = inject(PoetryStoreService);
  readonly templates = METER_TEMPLATES;
  readonly selectedCell = computed(() => this.store.selectedCell());

  get totalErrors(): number {
    return this.store.issues().filter((issue) => issue.level === 'error').length;
  }

  get totalWarnings(): number {
    return this.store.issues().filter((issue) => issue.level === 'warning').length;
  }

  get checkedRate(): number {
    const cells = this.store.analysis().flatMap((line) => line.cells);
    if (!cells.length) return 0;
    return Math.round((cells.filter((cell) => cell.actual !== '?').length / cells.length) * 100);
  }

  setTone(tone: '平' | '仄' | '中' | '?'): void {
    this.store.setMark({ tone });
  }

  antithesisFailedCount(): number {
    return this.store.antithesisChecks().filter((check) => check.status === 'mismatch' || check.status === 'length-mismatch').length;
  }

  pairStatusLabel(status: AntithesisStatus): string {
    return { match: '对仗合格', mismatch: '失对', 'length-mismatch': '失对·字数不一', indeterminate: '平仄未定' }[status];
  }

  pairTagColor(status: AntithesisStatus): string {
    return { match: 'success', mismatch: 'error', 'length-mismatch': 'error', indeterminate: 'warning' }[status];
  }

  pairCharClass(position: AntithesisPositionCheck, side: 'left' | 'right'): string {
    const present = side === 'left' ? !!position.leftChar : !!position.rightChar;
    if (!present) return 'pair-char is-gap';
    switch (position.status) {
      case 'match': return 'pair-char is-match';
      case 'mismatch': return 'pair-char is-mismatch';
      case 'missing': return 'pair-char is-missing';
      case 'unknown': return 'pair-char is-unknown';
      case 'skipped-rhyme':
      case 'skipped-neutral':
        return 'pair-char is-skip';
      default: return 'pair-char';
    }
  }

  updateSource(source: string): void {
    this.store.setMark({ basis: source });
  }

  updateVersionSource(source: string): void {
    this.store.updateVersionSource(source);
  }

  trackTemplate(index: number, item: (typeof METER_TEMPLATES)[number]): string {
    return item.id;
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const inTextEntry = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.getAttribute('contenteditable') === 'true';
    const command = event.ctrlKey || event.metaKey;

    if (command && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      event.shiftKey ? this.store.redo() : this.store.undo();
      return;
    }
    if (command && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      this.store.redo();
      return;
    }
    if (command && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.store.toast.set('内容已保存在本机');
      return;
    }
    if (inTextEntry) return;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const line = this.store.analysis()[this.store.selectedLine()];
      const next = Math.max(0, this.store.selectedPosition() - 1);
      this.store.selectCell(this.store.selectedLine(), Math.min(next, Math.max(0, line?.cells.length - 1)));
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      const line = this.store.analysis()[this.store.selectedLine()];
      const next = Math.min((line?.cells.length ?? 1) - 1, this.store.selectedPosition() + 1);
      this.store.selectCell(this.store.selectedLine(), next);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const next = Math.max(0, this.store.selectedLine() - 1);
      const max = Math.max(0, (this.store.analysis()[next]?.cells.length ?? 1) - 1);
      this.store.selectCell(next, Math.min(this.store.selectedPosition(), max));
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = Math.min(this.store.analysis().length - 1, this.store.selectedLine() + 1);
      const max = Math.max(0, (this.store.analysis()[next]?.cells.length ?? 1) - 1);
      this.store.selectCell(next, Math.min(this.store.selectedPosition(), max));
    } else if (event.key === '1') {
      this.setTone('平');
    } else if (event.key === '2') {
      this.setTone('仄');
    } else if (event.key === '3') {
      this.setTone('中');
    } else if (event.key === ' ') {
      event.preventDefault();
      this.store.togglePause();
    } else if (event.key.toLowerCase() === 'r') {
      this.store.cycleRhyme();
    }
  }
}
