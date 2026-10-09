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
import { NavLinks, type NavVariant } from "./nav-links";

export function MobileNav({
  variant,
  badges,
}: {
  variant: NavVariant;
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
      <SheetContent side="left" className="p-4">
        <SheetHeader className="p-0">
          <SheetTitle>Test platformasi</SheetTitle>
        </SheetHeader>
        <NavLinks
          variant={variant}
          badges={badges}
          onNavigate={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
