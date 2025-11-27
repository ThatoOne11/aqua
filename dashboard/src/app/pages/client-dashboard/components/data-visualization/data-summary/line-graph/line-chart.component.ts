import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables, ChartData, ChartOptions } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { LineChartRow } from '@client-dashboard/models/filters/filters.model';
import {
  CHART_UI_COLORS,
  PREDEFINED_COLORS,
  PREDEFINED_SHAPES,
} from './chart.constants';

Chart.register(...registerables);

@Component({
  selector: 'app-reading-results-line-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss'],
})
export class ReadingResultsLineChartComponent implements OnChanges {
  @Input({ required: true }) rows!: LineChartRow[];

  @Input() showPoints = true;
  @Input() beginAtZero = true;

  protected unit: string | null = null;
  protected lineData: ChartData<'line'> = { datasets: [] };
  protected lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
  };

  ngOnChanges(_: SimpleChanges) {
    const rows = (this.rows ?? []).filter(
      (r) => r && r.sample_dt && Number.isFinite(r.value)
    );

    this.unit = rows.find((r) => r.unit)?.unit ?? null;

    type Pt = { x: number; y: number; originalRow: LineChartRow };
    const series = new Map<string, Pt[]>();

    let minT = Number.POSITIVE_INFINITY;
    let maxT = Number.NEGATIVE_INFINITY;

    for (const r of rows) {
      const label = `${r.feed_type ?? 'Unspecified feed'} / ${
        r.flush_type ?? 'Unspecified flush'
      }`;
      const arr = series.get(label) ?? [];
      const t = new Date(r.sample_dt).getTime();
      minT = Math.min(minT, t);
      maxT = Math.max(maxT, t);
      arr.push({ x: t, y: r.value, originalRow: r });
      series.set(label, arr);
    }

    const datasets = Array.from(series.entries()).map(([label, pts], i) => {
      pts.sort((a, b) => a.x - b.x);
      const color = PREDEFINED_COLORS[i % PREDEFINED_COLORS.length];
      const shape = PREDEFINED_SHAPES[i % PREDEFINED_SHAPES.length];
      return {
        label,
        data: pts,
        parsing: false as const,
        tension: 0.25,
        borderColor: color,
        backgroundColor: withAlpha(color, 0.15),
        pointStyle: shape,
        pointRadius: this.showPoints ? 3 : 0,
        pointHoverRadius: 5,
        pointBackgroundColor: color,
        pointBorderColor: color,
        borderWidth: 2,
        fill: false,
      };
    });

    this.lineData = { datasets };

    const days =
      Number.isFinite(minT) && Number.isFinite(maxT)
        ? Math.max(1, Math.round((maxT - minT) / (1000 * 60 * 60 * 24)))
        : 1;
    const unit =
      days <= 3 ? 'hour' : days <= 90 ? 'day' : days <= 730 ? 'month' : 'year';

    this.lineOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: CHART_UI_COLORS.AXIS,
          },
        },
        tooltip: {
          titleColor: CHART_UI_COLORS.AXIS,
          bodyColor: CHART_UI_COLORS.AXIS,
          backgroundColor: CHART_UI_COLORS.TOOLTIP_BACKGROUND,
          borderColor: CHART_UI_COLORS.TOOLTIP_BORDER,
          borderWidth: 1,
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed.y as number;
              const index = ctx.dataset.data[ctx.dataIndex] as Pt; //index of a specific point in the data
              const originalDataPoint = index.originalRow; // Get the original row from the type
              return [
                `${ctx.dataset.label}: ${formatNumber(v)}${
                  this.unit ? ' ' + this.unit : ''
                }`,
                `Temperature: ${originalDataPoint?.temperature}`,
              ];
            },
            title: (items) => {
              if (!items.length) return '';
              const utcDate = new Date(items[0].parsed.x as number);
              return utcDate.toISOString().slice(0, 16).replace('T', ' ');
            },
          },
        },
      },
      scales: {
        x: {
          type: 'time',
          time: { unit },
          ticks: {
            autoSkip: true,
            maxTicksLimit: 10,
            color: CHART_UI_COLORS.AXIS,
          },
          grid: { display: false, color: CHART_UI_COLORS.GRID_LINES },
        },
        y: {
          beginAtZero: this.beginAtZero,
          ticks: {
            callback: (v) => formatNumber(Number(v as number)),
            color: CHART_UI_COLORS.AXIS,
          },
          grid: {
            color: CHART_UI_COLORS.GRID_LINES,
          },
          title: this.unit
            ? { display: true, text: this.unit, color: CHART_UI_COLORS.AXIS }
            : undefined,
        },
      },
    };
  }
}

function toBoolean(value: boolean | string): boolean {
  return value != null && `${value}` !== 'false';
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '' + n;
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  if (Math.abs(n) >= 1) return n.toFixed(2).replace(/\.00$/, '');
  return n.toPrecision(2);
}

function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return hex; // Return original if parsing fails
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
