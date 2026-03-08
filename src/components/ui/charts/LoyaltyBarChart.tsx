import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface LoyaltyBarChartProps {
  data: Array<{ name: string; value: number }>;
  colors?: string[];
}

const DEFAULT_COLORS = ['#10B981', '#34D399', '#60A5FA', '#EF4444', '#9CA3AF']; // Committed -> Accessibles colors

export const LoyaltyBarChart: React.FC<LoyaltyBarChartProps> = ({ data, colors = DEFAULT_COLORS }) => {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
          <XAxis type="number" hide />
          <YAxis 
            type="category" 
            dataKey="name" 
            tick={{ fontSize: 12, fontWeight: 500 }} 
            width={80}
          />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
