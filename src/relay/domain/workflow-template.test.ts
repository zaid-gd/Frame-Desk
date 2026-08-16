import { describe, expect, test } from "vitest";
import {
  createDefaultWorkflowTemplate,
  validateWorkflowTemplate,
} from "./workflow-template";

describe("Workflow Template rules", () => {
  test("the default path has the six fixed purposes and editable labels", () => {
    const template = createDefaultWorkflowTemplate("template_default", "Default workflow");

    expect(template.stages.map(({ purpose }) => purpose)).toEqual([
      "planned",
      "editing",
      "clientReview",
      "revisions",
      "approved",
      "delivered",
    ]);
    expect(template.stages.map(({ label }) => label)).toEqual([
      "Planned",
      "Editing",
      "Client Review",
      "Revisions",
      "Approved",
      "Delivered",
    ]);
    expect(template.cancelledLabel).toBe("Cancelled");
  });

  test("a template must retain exactly one Delivered-purpose stage", () => {
    const template = createDefaultWorkflowTemplate("template_default", "Default workflow");
    expect(validateWorkflowTemplate({ ...template, stages: template.stages.filter((stage) => stage.purpose !== "delivered") })).toBe(
      "Every Workflow Template must contain exactly one Delivered-purpose stage.",
    );
    expect(validateWorkflowTemplate({ ...template, stages: [...template.stages, { id: "also-delivered", label: "Shipped", purpose: "delivered" }] })).toBe(
      "Every Workflow Template must contain exactly one Delivered-purpose stage.",
    );
  });

  test("gives each Template its own stage identifiers", () => {
    const first = createDefaultWorkflowTemplate("template_first", "First");
    const second = createDefaultWorkflowTemplate("template_second", "Second");

    const secondIds = new Set(second.stages.map(({ id }) => id));
    expect(first.stages.every(({ id }) => !secondIds.has(id))).toBe(true);
  });
});
