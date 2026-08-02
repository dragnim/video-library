// Adds jest-dom matchers (toBeInTheDocument, etc.) to Vitest's expect, and
// unmounts Svelte components rendered by @testing-library/svelte after each test.
import "@testing-library/jest-dom/vitest";

import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./mocks/server";

// A request to a URL no handler matches fails the test by name, rather than resolving to nothing and mysteriously rendering empty later.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Undo any server.use(...) a test installed, so per-test overrides don't leak.
afterEach(() => server.resetHandlers());

afterAll(() => server.close());
