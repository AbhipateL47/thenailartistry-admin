import * as React from "react";

import { cn } from "@/shared/utils/cn";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, autoComplete, ...props }, ref) => {
    // Default to "off" for autocomplete, but allow override via props
    // For password fields, use "new-password" which is more effective at disabling autocomplete
    const defaultAutoComplete = autoComplete !== undefined 
      ? autoComplete 
      : type === "password" 
        ? "new-password" 
        : "off";
    
    return (
      <input
        type={type}
        autoComplete={defaultAutoComplete}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };

