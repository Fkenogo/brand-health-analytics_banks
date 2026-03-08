import React from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ReferenceLine, LabelList, Cell } from 'recharts';

interface DriverDataPoint {
  driver: string;
  importance: number; // X-axis (0-1 or 0-100)
  performance: number; // Y-axis (0-100)
  impact: 'positive' | 'negative' | 'neutral';
}

interface PriorityScatterChartProps {
  data: DriverDataPoint[];
}

export const PriorityScatterChart: React.FC<PriorityScatterChartProps> = ({ data }) => {
  return (
    <div className="h-[400px] w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            type="number" 
            dataKey="importance" 
            name="Importance" 
            unit="%" 
            domain={[0, 100]}
            label={{ value: 'Importance', position: 'bottom', offset: 0 }} 
          />
          <YAxis 
            type="number" 
            dataKey="performance" 
            name="Performance" 
            unit="%" 
            domain={[0, 100]}
            label={{ value: 'Performance', angle: -90, position: 'left' }} 
          />
          <ZAxis type="number" range={[100, 100]} /> {/* Constant size dots */}
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          
          {/* Quadrant Lines (assuming 50% split for now, adjustable) */}
          <ReferenceLine x={50} stroke="#9CA3AF" strokeDasharray="3 3" />
          <ReferenceLine y={50} stroke="#9CA3AF" strokeDasharray="3 3" />

          {/* Quadrant Labels - Manually positioned via CSS in parent usually, or SVG text here */}
          
          <Scatter name="Drivers" data={data} fill="#8884d8">
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.impact === 'positive' ? '#10B981' : entry.impact === 'negative' ? '#EF4444' : '#6B7280'} 
              />
            ))}
            <LabelList dataKey="driver" position="top" offset={10} style={{ fontSize: '10px', fill: '#666' }} />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      
      {/* HTML Overlay for Quadrants (Example) */}
      <div className="absolute top-2 right-2 text-xs font-bold text-gray-400 opacity-50">MAINTAIN</div>
      <div className="absolute top-2 left-2 text-xs font-bold text-emerald-500 opacity-50">OPPORTUNITY</div>
      <div className="absolute bottom-2 right-2 text-xs font-bold text-red-500 opacity-50">CRITICAL</div>
      <div className="absolute bottom-2 left-2 text-xs font-bold text-gray-400 opacity-50">LOW PRIORITY</div>
    </div>
  );
};
