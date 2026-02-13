import React from "react";

const SectionSeparator = ({ title, icon, className = "" }) => {
  return (
    <div className={`relative my-3 sm:my-4 ${className}`}>
      {/* Background line */}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full h-px bg-border/50"></div>
      </div>

      {/* Centered pill */}
      <div className="relative flex justify-center">
        <div className="bg-background px-4 py-2 rounded-full border border-border/50 shadow-sm">
          <div className="flex items-center gap-2">
            {icon && (
              <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs text-primary">{icon}</span>
              </div>
            )}
            <h2 className="text-sm font-medium text-foreground">{title}</h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionSeparator;
