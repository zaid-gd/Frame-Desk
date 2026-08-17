// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { SafeMarkdown } from "./safe-markdown";

test("renders Markdown as copyable text without creating raw HTML elements", () => {
  const { container } = render(<SafeMarkdown source={'# Notes\n\nHello **Zaid**.\n\n<img src=x onerror="alert(1)">Keep this visible.'} />);
  expect(screen.getByRole("heading", { name: "Notes" })).toBeTruthy();
  expect(screen.getByText("Zaid").closest("p")?.textContent).toBe("Hello Zaid.");
  expect(screen.getByText(/Keep this visible/)).toBeTruthy();
  expect(container.querySelector("img")).toBeNull();
  expect(container.textContent).toContain("Keep this visible.");
});
