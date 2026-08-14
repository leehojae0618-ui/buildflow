# RECIPE-FIRST-BUILD-PACKAGE-001 Contract

## BuildPackage Boundary

BuildPackage is a BuildFlow canonical, engine-independent preparation artifact.
It records Recipe intent, selected/alternative engine, service graph, trigger,
steps, connection state, configuration requirements, approvals, cost, test
plan, and provenance. It is not a copied external workflow artifact.

## Truth Boundary

```text
Connection state: READY or NOT_CONNECTED only.
Test state: PLANNED only.
Actual OAuth, credential handling, remote build, Provider call, external write,
and execution: NOT PERFORMED.
```

## Engine Policy

Compatibility ranks Make, Pipedream, Activepieces, and n8n with explicit
reasons and limitations. Selecting an alternative only changes local package
planning; it does not create, connect, or run an engine.
