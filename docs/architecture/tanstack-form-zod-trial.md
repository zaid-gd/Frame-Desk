# TanStack Form with Zod trial

Date: 2026-08-17
Scope: ticket 07 new-Project form

## Result

The trial passed. Keep TanStack Form with Zod for later Relay forms named in the rebuild spec.

The form binds exactly six values: Project name, Client, optional Project Group, Workflow Template, due date, and financial type. TanStack Form owns field state and submit state. Zod gives one typed browser schema and clear errors without a second hand-written client validator.

The added client code and packages are small enough for this form. Field markup remains more verbose than plain React state, but the bound values and submit flow stay easy to trace. We found no need for TanStack Query, TanStack Router, or another state library.

## Validation boundary

Zod improves browser feedback only. The Project controller checks the schema before it calls a port. Convex remains authoritative: its mutation validates the input shape, signed-in owner, active Client, Project Group ownership and archive state, active Workflow Template, date, and name before it writes. A caller can skip the form and still cannot bypass those rules.

## Evidence

- `src/relay/domain/project.ts` holds the Zod form schema.
- `src/relay/presentation/relay-experience.tsx` binds it through TanStack Form.
- `src/relay/application/project-controller.test.ts` covers invalid and valid form submissions.
- `convex/relayProjects.test.ts` proves server checks and Workflow Template copying.
