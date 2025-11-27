import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import {
  ChartConfiguration,
  ChartOptions,
  ActiveElement,
  ChartEvent,
} from 'chart.js';
import { MonthlyDataPoint } from '@client-dashboard/models/data-summary/data-summary.model';
import { MatDialog } from '@angular/material/dialog';
import { BarChartModalComponent } from '../bar-chart-modal/bar-chart-modal';
import { ReadingResultViewRow } from '@client-dashboard/models/filters/filters.model';

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './bar-chart.html',
  styleUrls: ['./bar-chart.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarChartComponent {
  monthlyData = input.required<MonthlyDataPoint[] | null>();
  clientName = input.required<string>();
  rawResults = input<ReadingResultViewRow[] | null>();

  private readonly dialog = inject(MatDialog);
  chart = viewChild(BaseChartDirective);

  readonly barChartType: 'bar' = 'bar';
  readonly barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 20,
        },
      },
    },
    scales: {
      x: { stacked: false },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
    onClick: (event: ChartEvent, activeElements: ActiveElement[]) => {
      this.onChartClick(event, activeElements);
    },
  };

  readonly barChartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const data = this.monthlyData();
    if (!data || data.length === 0) {
      return { labels: [], datasets: [] };
    }

    const sortedData = [...data].sort(
      (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
    );

    const labels = sortedData.map((d) => {
      const date = new Date(d.month);
      return isNaN(date.getTime())
        ? 'Invalid Date'
        : date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    });

    const passedData = sortedData.map((d) => d.passed);
    const failedData = sortedData.map((d) => d.failed);

    return {
      labels: labels,
      datasets: [
        {
          label: 'Passed',
          data: passedData,
          backgroundColor: '#32ADE6',
        },
        {
          label: 'Failed',
          data: failedData,
          backgroundColor: 'red',
        },
      ],
    };
  });

  onChartClick(event: ChartEvent, activeElements: ActiveElement[]): void {
    const allRows = this.rawResults() ?? [];

    const monthlyData = this.monthlyData();
    if (!monthlyData || monthlyData.length === 0) return;

    const sortedData = [...monthlyData].sort(
      (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
    );

    let filteredRows = allRows;

    if (activeElements.length > 0) {
      const { datasetIndex, index } = activeElements[0];
      const isFail = datasetIndex === 1;
      const clickedMonth = sortedData[index]?.month?.substring(0, 7);

      filteredRows = allRows.filter(
        (r) =>
          (r.month_start ?? '').substring(0, 7) === clickedMonth &&
          r.is_fail === isFail
      );
    }

    this.dialog.open(BarChartModalComponent, {
      panelClass: 'bar-chart-modal',
      width: '1200px',
      maxWidth: '1200px',
      maxHeight: '2000px',
      data: {
        clientName: this.clientName(),
        data: filteredRows,
      },
    });
  }
}
