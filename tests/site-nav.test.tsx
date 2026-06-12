import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SiteNav } from "@/components/site-nav";

describe("SiteNav", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
    });
  });

  it("shows Customer, Business, Admin, and Auth links in the mobile menu", () => {
    render(<SiteNav />);

    fireEvent.click(screen.getByRole("button", { name: /Open navigation menu/i }));

    expect(screen.getAllByRole("link", { name: /Customer/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /Business/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /Admin/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Auth/i })).toHaveAttribute("href", "/auth");
  });
});
