'use client'

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type AlertPriority, getPriorityLabel, getPriorityGroupColor, getPriorityGroupBgColor } from '@/lib/utils/alert-grouping';
import { Badge } from '@/components/ui/badge';

interface PriorityGroupProps {
  priority: AlertPriority;
  count: number;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export function PriorityGroup({ priority, count, children, defaultExpanded = true }: PriorityGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (count === 0) return null;

  return (
    <div className={cn("border-l-4 rounded-r-lg overflow-hidden", getPriorityGroupColor(priority))}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between p-3 sm:p-4 transition-colors hover:opacity-80",
          getPriorityGroupBgColor(priority)
        )}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
          <h3 className="font-semibold text-sm sm:text-base">{getPriorityLabel(priority)}</h3>
          <Badge variant="secondary" className="text-xs">
            {count}
          </Badge>
        </div>
      </button>
      
      {isExpanded && (
        <div className="p-2 sm:p-3 space-y-2 sm:space-y-3 bg-white dark:bg-slate-950">
          {children}
        </div>
      )}
    </div>
  );
}
