import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CustomerPortal } from "@/components/customer/customer-portal";
import { getQueueHistory, getQueueSnapshot, listDirectory } from "@/lib/store";
import type { QueueEntry, QueueSnapshot } from "@/lib/types";

function cloneSnapshot() {
  return JSON.parse(JSON.stringify(getQueueSnapshot())) as QueueSnapshot;
}

function renderPortal(snapshot = cloneSnapshot()) {
  return render(
    <CustomerPortal
      directory={listDirectory()}
      initialSnapshot={snapshot}
      history={getQueueHistory()}
    />
  );
}

function mockJsonResponse(
  payload: unknown,
  init: { ok?: boolean; status?: number } = {}
) {
  return Promise.resolve({
    ok: init.ok ?? true,
    status: init.status ?? (init.ok === false ? 400 : 200),
    json: () => Promise.resolve(payload)
  } as Response);
}

describe("CustomerPortal", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders safely on page refresh with the current queue snapshot", () => {
    renderPortal();

    expect(screen.getAllByText("Fade Masters").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Demo Mode").length).toBeGreaterThan(0);
    expect(screen.getByText("Move closer to the front of the line")).toBeInTheDocument();
    expect(screen.getByText("People Ahead")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Fast Pass/i })).toBeEnabled();
  });

  it("joins a queue and updates the active position", async () => {
    const snapshot = cloneSnapshot();
    const entry: QueueEntry = {
      ...snapshot.waitingEntries[0],
      id: "entry_new",
      customerName: "Maya Johnson",
      position: 5
    };
    const nextSnapshot: QueueSnapshot = {
      ...snapshot,
      entries: snapshot.entries.concat(entry),
      activeEntries: snapshot.activeEntries.concat(entry),
      waitingEntries: snapshot.waitingEntries.concat(entry)
    };
    const fetchMock = vi.fn(() => mockJsonResponse({ entry, snapshot: nextSnapshot }));
    vi.stubGlobal("fetch", fetchMock);

    renderPortal(snapshot);
    fireEvent.click(screen.getByRole("button", { name: /Join Queue/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/queues/queue_greenbelt_walkins/join",
      expect.objectContaining({ method: "POST" })
    ));
    await waitFor(() => expect(screen.getAllByText("5").length).toBeGreaterThan(0));
  });

  it("applies Fast Pass after joining with a newly created entry", async () => {
    const snapshot = cloneSnapshot();
    const entry: QueueEntry = {
      ...snapshot.waitingEntries[0],
      id: "entry_new_fast_pass",
      customerName: "Maya Johnson",
      position: 5
    };
    const joinedSnapshot: QueueSnapshot = {
      ...snapshot,
      entries: snapshot.entries.concat(entry),
      activeEntries: snapshot.activeEntries.concat(entry),
      waitingEntries: snapshot.waitingEntries.concat(entry)
    };
    const promotedEntries = joinedSnapshot.entries.map((candidate) =>
      candidate.id === entry.id ? { ...candidate, fastPass: true, position: 1 } : candidate
    );
    const promotedSnapshot: QueueSnapshot = {
      ...joinedSnapshot,
      entries: promotedEntries,
      activeEntries: promotedEntries.filter(
        (candidate) => candidate.status === "serving" || candidate.status === "waiting"
      ),
      waitingEntries: promotedEntries.filter((candidate) => candidate.status === "waiting")
    };
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() =>
        mockJsonResponse({ entry, snapshot: joinedSnapshot }, { status: 201 })
      )
      .mockImplementationOnce(() => mockJsonResponse({ snapshot: promotedSnapshot }));
    vi.stubGlobal("fetch", fetchMock);

    renderPortal(snapshot);
    fireEvent.click(screen.getByRole("button", { name: /Join Queue/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/queues/queue_greenbelt_walkins/join",
      expect.objectContaining({ method: "POST" })
    ));
    await waitFor(() => expect(screen.getAllByText("5").length).toBeGreaterThan(0));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Fast Pass/i })).toBeEnabled()
    );

    fireEvent.click(screen.getByRole("button", { name: /Fast Pass/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/queue-entries/entry_new_fast_pass/fast-pass",
      expect.objectContaining({ method: "POST" })
    ));
    await waitFor(() => expect(screen.getAllByText("1").length).toBeGreaterThan(0));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("clears the active entry and keeps rendering when leave returns no snapshot", async () => {
    const fetchMock = vi.fn(() => mockJsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);

    renderPortal();
    fireEvent.click(screen.getByRole("button", { name: /Leave/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/queue-entries/entry_3",
      expect.objectContaining({ method: "PATCH" })
    ));
    expect(await screen.findByText("Not in queue")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Fast Pass/i })).toBeDisabled();
  });

  it("applies Fast Pass only while the customer is actively in queue", async () => {
    const snapshot = cloneSnapshot();
    const promotedEntries = snapshot.entries.map((entry) =>
      entry.id === "entry_3" ? { ...entry, fastPass: true, position: 1 } : entry
    );
    const nextSnapshot: QueueSnapshot = {
      ...snapshot,
      entries: promotedEntries,
      activeEntries: promotedEntries.filter(
        (entry) => entry.status === "serving" || entry.status === "waiting"
      ),
      waitingEntries: promotedEntries.filter((entry) => entry.status === "waiting")
    };
    const fetchMock = vi.fn(() => mockJsonResponse({ snapshot: nextSnapshot }));
    vi.stubGlobal("fetch", fetchMock);

    renderPortal(snapshot);
    fireEvent.click(screen.getByRole("button", { name: /Fast Pass/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/queue-entries/entry_3/fast-pass",
      expect.objectContaining({ method: "POST" })
    ));
    await waitFor(() => expect(screen.getAllByText("1").length).toBeGreaterThan(0));
  });

  it("shows a clear message when Fast Pass is not allowed", async () => {
    const fetchMock = vi.fn(() =>
      mockJsonResponse(
        { message: "Fast Pass is temporarily sold out for this queue." },
        { ok: false, status: 400 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    renderPortal();
    fireEvent.click(screen.getByRole("button", { name: /Fast Pass/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Fast Pass is temporarily sold out for this queue."
    );
  });
});
