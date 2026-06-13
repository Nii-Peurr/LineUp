import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthOnboarding } from "@/components/auth/auth-onboarding";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams()
}));

function mockJsonResponse(payload: unknown, init: { ok?: boolean; status?: number } = {}) {
  return Promise.resolve({
    ok: init.ok ?? true,
    status: init.status ?? (init.ok === false ? 400 : 200),
    json: () => Promise.resolve(payload)
  } as Response);
}

describe("AuthOnboarding", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows visible validation when the primary auth button is clicked without a password", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<AuthOnboarding />);
    fireEvent.click(screen.getByRole("button", { name: /Create Business/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Email and password are required."
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits the auth form and shows the API error message", async () => {
    const fetchMock = vi.fn(() =>
      mockJsonResponse({ error: "Supabase Auth is not configured." }, { ok: false, status: 503 })
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<AuthOnboarding />);
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "password123" }
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Business/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/sign-up",
        expect.objectContaining({ method: "POST" })
      )
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Supabase Auth is not configured."
    );
  });
});
