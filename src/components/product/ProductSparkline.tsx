import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';
import { getProductPriceHistory, PricePoint } from '../../lib/priceTrackerService';

interface ProductSparklineProps {
  productId: string;
  currentPrice: number;
}

export const ProductSparkline: React.FC<ProductSparklineProps> = ({ productId, currentPrice }) => {
  const [data, setData] = useState<PricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getProductPriceHistory(productId, currentPrice).then((points) => {
      if (isMounted) {
        setData(points);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [productId, currentPrice]);

  if (isLoading || data.length === 0) {
    return <div className="h-7 w-28 bg-slate-100 dark:bg-slate-800/60 rounded animate-pulse" />;
  }

  const startPrice = data[0]?.price || currentPrice;
  const latestPrice = data[data.length - 1]?.price || currentPrice;
  const isDrop = latestPrice <= startPrice;
  const lineColor = isDrop ? '#10b981' : '#f59e0b';

  return (
    <div className="flex items-center gap-2 group/spark">
      <div className="w-24 h-7 relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Tooltip
              formatter={(val: any) => [`$${Number(val || 0).toFixed(2)}`, 'Price']}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '10px',
                padding: '4px 8px'
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={lineColor}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[10px] font-extrabold flex flex-col">
        <span className={isDrop ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
          {isDrop ? '📉 Trend' : '📈 Trend'}
        </span>
        <span className="text-slate-400 text-[9px]">6-Mo Spark</span>
      </div>
    </div>
  );
};
