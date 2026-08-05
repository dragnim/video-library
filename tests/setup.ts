// Adds jest-dom matchers (toBeInTheDocument, etc.) to Vitest's expect, and
// unmounts Svelte components rendered by @testing-library/svelte after each test.
import "@testing-library/jest-dom/vitest";

import { afterAll, afterEach, beforeAll } from "vitest";
import { installAnimate } from "./mocks/animate";
import { installIntersectionObserver } from "./mocks/intersectionObserver";
import { server } from "./mocks/server";

// The advanced-search panel slides, and jsdom has no Web Animations API.
installAnimate();

// The list's sentinel constructs an IntersectionObserver on mount and jsdom has
// none, so anything rendering a list needs one to exist. A test that drives the
// sentinel installs its own, which it can fire.
installIntersectionObserver();

// A request to a URL no handler matches fails the test by name, rather than resolving to nothing and mysteriously rendering empty later.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Undo any server.use(...) a test installed, so per-test overrides don't leak.
afterEach(() => server.resetHandlers());

afterAll(() => server.close());
