"use client";

import { useState } from "react";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NavMenu, type NavVariant } from "./nav-menu";

export function MobileNav({
  variant,
  title,
  badges,
}: {
  variant: NavVariant;
  title: string;
  badges?: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Menyuni ochish" />
        }
      >
        <MenuIcon />
      </SheetTrigger>
      <SheetContent side="left" className="overflow-y-auto p-4">
        <SheetHeader className="p-0">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <NavMenu
          variant={variant}
          badges={badges}
          onNavigate={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
