import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { MonthlyDataPoint } from '@client-dashboard/models/data-summary/data-summary.model';

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
}
