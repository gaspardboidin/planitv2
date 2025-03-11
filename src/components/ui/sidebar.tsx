
import React from "react";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface SidebarProps {
  children: React.ReactNode;
  className?: string;
  triggerButton?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Sidebar({
  children,
  className,
  triggerButton,
  isOpen,
  onOpenChange
}: SidebarProps) {
  const isMobile = useMobile();

  return isMobile ? (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      {triggerButton && <SheetTrigger asChild>{triggerButton}</SheetTrigger>}
      <SheetContent side="left" className={cn("p-0", className)}>
        {children}
      </SheetContent>
    </Sheet>
  ) : (
    <div className={cn("h-full", className)}>{children}</div>
  );
}
