// basename and the initial history.state are both read once at module
// evaluation, so every case stubs the env and the URL first, then reimports.

import { afterEach, describe, expect, it, vi } from "vitest";

function setUrl(path: string) {
  window.history.replaceState(null, "", path);
}

async function loadLocationModule() {
  vi.resetModules();
  return import("../../src/lib/router/location.svelte");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("reading the location", () => {
  it("leaves pathname alone when the basename is /", async () => {
    setUrl("/search?q=apl");
    const { location } = await loadLocationModule();
    expect(location.pathname).toBe("/search");
    expect(location.search).toBe("?q=apl");
  });

  it("strips a real basename", async () => {
    vi.stubEnv("VITE_BASENAME", "/video-library");
    setUrl("/video-library/search?q=apl");
    const { location } = await loadLocationModule();
    expect(location.pathname).toBe("/search");
    expect(location.search).toBe("?q=apl");
  });

  it("strips to / when the path is exactly the basename", async () => {
    vi.stubEnv("VITE_BASENAME", "/video-library");
    setUrl("/video-library");
    const { location } = await loadLocationModule();
    expect(location.pathname).toBe("/");
  });

  it("tolerates a trailing slash on the basename", async () => {
    vi.stubEnv("VITE_BASENAME", "/video-library/");
    setUrl("/video-library/search");
    const { location } = await loadLocationModule();
    expect(location.pathname).toBe("/search");
  });

  it("seeds a key on the initial entry", async () => {
    setUrl("/");
    const { location } = await loadLocationModule();
    expect(location.key).toBeTruthy();
    expect(window.history.state).toEqual({ key: location.key });
  });

  it("keeps an existing key instead of reseeding", async () => {
    setUrl("/");
    window.history.replaceState({ key: "existing" }, "", "/");
    const { location } = await loadLocationModule();
    expect(location.key).toBe("existing");
  });
});

describe("navigate", () => {
  it("prepends a real basename on write", async () => {
    vi.stubEnv("VITE_BASENAME", "/video-library");
    setUrl("/video-library");
    const { location, navigate } = await loadLocationModule();

    navigate("/search?q=apl");

    expect(window.location.pathname).toBe("/video-library/search");
    expect(location.pathname).toBe("/search");
  });

  it("prepends the bare basename for the root path", async () => {
    vi.stubEnv("VITE_BASENAME", "/video-library");
    setUrl("/video-library/search");
    const { navigate } = await loadLocationModule();

    navigate("/");

    expect(window.location.pathname).toBe("/video-library");
  });

  it("pushes by default: action PUSH, history.length grows", async () => {
    setUrl("/");
    const { location, navigate } = await loadLocationModule();
    const before = window.history.length;

    navigate("/search");

    expect(location.action).toBe("PUSH");
    expect(window.history.length).toBe(before + 1);
  });

  it("replace: true uses action REPLACE and does not grow history.length", async () => {
    setUrl("/");
    const { location, navigate } = await loadLocationModule();
    const before = window.history.length;

    navigate("/search", { replace: true });

    expect(location.action).toBe("REPLACE");
    expect(window.history.length).toBe(before);
  });

  it("mints a new key on every navigation", async () => {
    setUrl("/");
    const { location, navigate } = await loadLocationModule();
    const initialKey = location.key;

    navigate("/search");

    expect(location.key).not.toBe(initialKey);
  });
});

describe("popstate", () => {
  it("sets action POP and reads the key back out of history.state", async () => {
    setUrl("/");
    const { location } = await loadLocationModule();

    const priorState = { key: "abc123" };
    window.history.pushState(priorState, "", "/watch?id=1");
    window.dispatchEvent(new PopStateEvent("popstate", { state: priorState }));

    expect(location.pathname).toBe("/watch");
    expect(location.search).toBe("?id=1");
    expect(location.action).toBe("POP");
    expect(location.key).toBe("abc123");
  });

  it("seeds and stores a key when the entry has none", async () => {
    setUrl("/");
    const { location } = await loadLocationModule();

    window.history.pushState(null, "", "/watch?id=1");
    window.dispatchEvent(new PopStateEvent("popstate", { state: null }));

    // Written back, so returning to this entry a second time reads the same
    // key rather than minting another one.
    expect(location.key).toBeTruthy();
    expect(window.history.state).toEqual({ key: location.key });
  });

  it("strips the basename on a popstate too", async () => {
    vi.stubEnv("VITE_BASENAME", "/video-library");
    setUrl("/video-library");
    const { location } = await loadLocationModule();

    const priorState = { key: "abc123" };
    window.history.pushState(priorState, "", "/video-library/search");
    window.dispatchEvent(new PopStateEvent("popstate", { state: priorState }));

    expect(location.pathname).toBe("/search");
  });
});
