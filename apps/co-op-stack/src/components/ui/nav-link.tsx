import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface NavLinkProps {
  to: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "desktop" | "mobile";
  matchSearch?: string;
}

export function NavLink({ 
  to, 
  icon: Icon, 
  children, 
  onClick,
  variant = "desktop",
  matchSearch
}: NavLinkProps) {
  const location = useLocation();
  
  const isActive = () => {
    const basePath = to.split('?')[0];
    const pathMatch = location.pathname === basePath || location.pathname.startsWith(`${basePath}/`);
    if (matchSearch) {
      return pathMatch && location.search.includes(matchSearch);
    }
    return pathMatch;
  };

  const active = isActive();

  const baseStyles = "font-medium transition-all duration-200 flex items-center relative";
  
  const variantStyles = {
    desktop: cn(
      "px-4 py-2 rounded-lg text-sm",
      active
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-foreground hover:bg-muted hover:scale-[1.02] active:scale-[0.98]"
    ),
    mobile: cn(
      "w-full px-4 py-3 rounded-lg text-sm",
      active
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-foreground hover:bg-muted active:scale-[0.99]"
    )
  };

  const iconMargin = variant === "mobile" ? "mr-2" : "mr-1.5";

  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(baseStyles, variantStyles[variant])}
      aria-current={active ? "page" : undefined}
    >
      {Icon && (
        <Icon 
          className={cn(
            "w-4 h-4 transition-transform duration-200", 
            iconMargin,
            active && "scale-110"
          )} 
        />
      )}
      <span className="relative">
        {children}
        {/* Active indicator underline for desktop */}
        {variant === "desktop" && active && (
          <span 
            className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-primary-foreground/30 rounded-full animate-scale-in"
          />
        )}
      </span>
    </Link>
  );
}
