"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  clampWidth,
  GROUPS_COOKIE,
  SIDEBAR_COOKIE,
  serializeGroups,
  WIDTH_COOKIE,
  writeCookie,
} from "@/lib/sidebar-cookies";

// Mirrors --breakpoint-shell: 52rem in src/app/globals.css. Kept in rem so it
// tracks the CSS breakpoint when the browser's default font size changes.
export const DESKTOP_QUERY = "(min-width: 52rem)";

type SidebarContextValue = {
  open: boolean;
  toggleNav: (origin?: "button") => void;
  consumeNavHandoff: () => boolean;
  expanded: string[];
  toggleGroup: (id: string) => void;
  expandGroup: (id: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  width: number;
  setWidth: (width: number) => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within SidebarProvider");
  return context;
}

export function SidebarProvider({
  defaultOpen,
  defaultExpanded,
  defaultWidth,
  children,
}: {
  defaultOpen: boolean;
  defaultExpanded: string[];
  defaultWidth: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [width, setWidthState] = useState(defaultWidth);
  const [mobileOpen, setMobileOpenState] = useState(false);
  const [paletteOpen, setPaletteOpenState] = useState(false);
  // Set when a toggle came from one of the two visible toggle buttons — the
  // shell then hands keyboard focus to the counterpart button, since the
  // activated one gets hidden or inerted by the toggle itself.
  const handoffRef = useRef(false);
  // The drawer and the palette are modal (the rest of the shell goes inert
  // while they are open, which blurs whatever had focus). Capture the trigger
  // at open time — before the commit that inerts it — and give focus back on
  // close.
  const drawerReturnFocusRef = useRef<HTMLElement | null>(null);
  const paletteReturnFocusRef = useRef<HTMLElement | null>(null);

  const setMobileOpen = useCallback((next: boolean) => {
    setMobileOpenState((prev) => {
      if (!prev && next) {
        drawerReturnFocusRef.current =
          document.activeElement instanceof HTMLElement ? document.activeElement : null;
      }
      return next;
    });
  }, []);

  const setPaletteOpen = useCallback((next: boolean) => {
    setPaletteOpenState((prev) => {
      if (!prev && next) {
        paletteReturnFocusRef.current =
          document.activeElement instanceof HTMLElement ? document.activeElement : null;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!mobileOpen && drawerReturnFocusRef.current) {
      drawerReturnFocusRef.current.focus();
      drawerReturnFocusRef.current = null;
    }
  }, [mobileOpen]);

  useEffect(() => {
    if (!paletteOpen && paletteReturnFocusRef.current) {
      paletteReturnFocusRef.current.focus();
      paletteReturnFocusRef.current = null;
    }
  }, [paletteOpen]);

  useEffect(() => {
    writeCookie(SIDEBAR_COOKIE, open ? "open" : "closed");
  }, [open]);

  useEffect(() => {
    writeCookie(GROUPS_COOKIE, serializeGroups(expanded));
  }, [expanded]);

  useEffect(() => {
    writeCookie(WIDTH_COOKIE, String(width));
  }, [width]);

  const setWidth = useCallback((next: number) => {
    setWidthState(clampWidth(next));
  }, []);

  // The mobile drawer is ephemeral; only the desktop column persists.
  const toggleNav = useCallback(
    (origin?: "button") => {
      if (window.matchMedia(DESKTOP_QUERY).matches) {
        handoffRef.current = origin === "button";
        setOpen((o) => !o);
      } else {
        setMobileOpen(!mobileOpen);
      }
    },
    [mobileOpen, setMobileOpen],
  );

  const consumeNavHandoff = useCallback(() => {
    const value = handoffRef.current;
    handoffRef.current = false;
    return value;
  }, []);

  const toggleGroup = useCallback((id: string) => {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const expandGroup = useCallback((id: string) => {
    setExpanded((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        // preventDefault: ⌘B toggles the favorites bar in Safari
        event.preventDefault();
        toggleNav();
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(!paletteOpen);
      } else if (event.key === "Escape") {
        if (paletteOpen) setPaletteOpen(false);
        else setMobileOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [paletteOpen, setPaletteOpen, setMobileOpen, toggleNav]);

  const value = useMemo(
    () => ({
      open,
      toggleNav,
      consumeNavHandoff,
      expanded,
      toggleGroup,
      expandGroup,
      mobileOpen,
      setMobileOpen,
      paletteOpen,
      setPaletteOpen,
      width,
      setWidth,
    }),
    [
      open,
      toggleNav,
      consumeNavHandoff,
      expanded,
      toggleGroup,
      expandGroup,
      mobileOpen,
      setMobileOpen,
      paletteOpen,
      setPaletteOpen,
      width,
      setWidth,
    ],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}
