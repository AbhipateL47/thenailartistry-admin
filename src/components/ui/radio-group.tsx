import * as React from "react";
import { cn } from "@/shared/utils/cn";

interface RadioGroupContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue>({});

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, ...props }, ref) => {
    return (
      <RadioGroupContext.Provider value={{ value, onValueChange }}>
        <div
          className={cn("flex gap-4", className)}
          role="radiogroup"
          ref={ref}
          {...props}
        />
      </RadioGroupContext.Provider>
    );
  }
);
RadioGroup.displayName = "RadioGroup";

interface RadioGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  label?: string;
}

const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(
  ({ className, value: itemValue, label, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext);
    const isChecked = context.value === itemValue;

    return (
      <div className="flex items-center space-x-2">
        <button
          type="button"
          role="radio"
          aria-checked={isChecked}
          onClick={() => context.onValueChange?.(itemValue)}
          className={cn(
            "relative flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors",
            isChecked
              ? "border-primary"
              : "border-muted-foreground",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        >
          {isChecked && (
            <span className="h-2 w-2 rounded-full bg-primary" />
          )}
        </button>
        {label && (
          <label
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            onClick={() => context.onValueChange?.(itemValue)}
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
