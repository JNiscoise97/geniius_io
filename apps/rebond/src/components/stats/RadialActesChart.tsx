// components/stats/RadialActesChart.tsx
import { formatNombre } from '@/utils/number';
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#3b82f6', '#ec4899', '#8b5cf6'];

export function RadialActesChart({
  actes_estimes,
  actes_releves,
  actes_transcrits,
}: {
  actes_estimes: number;
  actes_releves: number;
  actes_transcrits: number;
}) {
  const data = [
    {
      name: "Nombre d'actes estimés",
      value: actes_estimes,
      max: actes_estimes || 1,
      fill: COLORS[0],
    },
    {
      name: "Nombre d'actes relevés",
      value: actes_releves,
      max: actes_releves || 1,
      fill: COLORS[1],
    },
    {
      name: "Nombre d'actes transcrits",
      value: actes_transcrits,
      max: actes_transcrits || 1,
      fill: COLORS[2],
    },
  ];

  const chartData = data.map((d) => ({
    name: d.name,
    fill: d.fill,
    uv: d.value,
    max: d.max,
  }));

  return (
    <div className='flex flex-col items-center gap-4'>
  <div className='w-full max-w-[280px] h-[300px]'>
    <ResponsiveContainer>
      <RadialBarChart
        innerRadius='40%'
        outerRadius='100%'
        barSize={12}
        data={chartData}
        startAngle={180}
        endAngle={0}
      >
        <PolarAngleAxis
          type='number'
          domain={[0, (dataMax) => Math.max(...chartData.map((d) => d.max))]}
          tick={false}
        />
        {chartData.map((entry) => (
          <RadialBar
            key={entry.name}
            dataKey='uv'
            cornerRadius={10}
            background
            fill={entry.fill}
            data={[entry]}
          />
        ))}
      </RadialBarChart>
    </ResponsiveContainer>
  </div>

  {/* 🔽 Légende verticale */}
  <div className='flex flex-col items-start text-sm mt-[-120px]'>
    {chartData.map((entry) => (
      <div key={entry.name} className='flex items-center gap-2 py-1'>
        <span
          className='inline-block w-3 h-3 rounded-full'
          style={{ backgroundColor: entry.fill }}
        ></span>
        <span className='text-gray-700 font-medium'>{entry.name} :</span>
        <span className='text-gray-900 font-bold'>{formatNombre(entry.uv)}</span>
      </div>
    ))}
  </div>
</div>

  );
}