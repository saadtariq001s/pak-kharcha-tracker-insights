
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePakistanEconomy } from '@/context/PakistanEconomyContext';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const EconomyMetrics: React.FC = () => {
  const { economicMetrics } = usePakistanEconomy();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pakistan Economy Indicators</CardTitle>
        <CardDescription>Current economic indicators affecting your finances</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {economicMetrics.map((metric) => (
            <div key={metric.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">{metric.name}</p>
                <p className="text-lg font-bold">{metric.value}</p>
              </div>
              <div className="flex flex-col items-end">
                <Badge 
                  variant="outline"
                  className={cn(
                    "flex items-center gap-1",
                    metric.impact === 'positive' ? "border-green-500 text-green-500" :
                    metric.impact === 'negative' ? "border-red-500 text-red-500" :
                    "border-yellow-500 text-yellow-500"
                  )}
                >
                  {metric.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : 
                   metric.trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
                  {metric.trend}
                </Badge>
                <span className="mt-1 text-xs text-muted-foreground">
                  {metric.impact === 'positive' ? 'Favorable' : 
                   metric.impact === 'negative' ? 'Unfavorable' : 
                   'Neutral'} impact
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default EconomyMetrics;
