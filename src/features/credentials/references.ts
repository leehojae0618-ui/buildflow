import type { Connector } from "../connectors/types";
import { findCredentialDefinition } from "./definitions";
import type { CredentialReference } from "./types";

export function createCredentialReferences(connectors: Connector[]): CredentialReference[] { return connectors.flatMap((connector) => { const definition = findCredentialDefinition(connector.providerId); return definition ? [{ id: `credential-ref-${connector.providerId}`, providerId: connector.providerId, definitionId: definition.id, status: "MISSING" as const, configured: false }] : []; }); }
