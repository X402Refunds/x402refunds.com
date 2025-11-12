"use client";

import { CopyButton } from "@/components/ui/copy-button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CopyableFieldProps {
  value: string;
  label?: string;
  truncate?: boolean;
  truncateLength?: number;
  className?: string;
  displayValue?: string;
}

export function CopyableField({ 
  value, 
  label, 
  truncate = false, 
  truncateLength = 20,
  className = "",
  displayValue
}: CopyableFieldProps) {
  const display = displayValue || (truncate && value.length > truncateLength 
    ? `${value.substring(0, truncateLength)}...` 
    : value);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <code className="text-sm font-mono bg-muted px-2 py-1 rounded flex-1 truncate">
              {display}
            </code>
          </TooltipTrigger>
          {truncate && value.length > truncateLength && (
            <TooltipContent>
              <p className="text-xs font-mono break-all max-w-md">{value}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      <CopyButton value={value} label={label} />
    </div>
  );
}

