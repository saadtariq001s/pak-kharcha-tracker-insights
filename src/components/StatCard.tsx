
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string | number;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
  className,
}) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && trendValue && (
          <div className="flex items-center mt-2">
            <div
              className={cn(
                "flex items-center text-xs font-medium mr-2",
                trend === 'up' ? "text-green-500" : trend === 'down' ? "text-red-500" : "text-gray-500"
              )}
            >
              {trend === 'up' ? (
                <TrendingUp className="mr-1 h-3 w-3" />
              ) : trend === 'down' ? (
                <TrendingDown className="mr-1 h-3 w-3" />
              ) : null}
              {trendValue}
            </div>
            <span className="text-xs text-muted-foreground">vs. last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
