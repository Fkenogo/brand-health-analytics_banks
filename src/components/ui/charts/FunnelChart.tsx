import React from 'react';
import { ResponsiveContainer, FunnelChart as RechartsFunnelChart, Funnel, Tooltip, LabelList } from 'recharts';

interface FunnelStep {
  name: string;
  value: number;
  fill: string;
}

interface FunnelChartProps {
  data: FunnelStep[];
}

export const FunnelChart: React.FC<FunnelChartProps> = ({ data }) => {
  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsFunnelChart>
          <Tooltip />
          <Funnel
            dataKey="value"
            data={data}
            isAnimationActive
          >
            <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
          </Funnel>
        </RechartsFunnelChart>
      </ResponsiveContainer>
    </div>
  );
};
