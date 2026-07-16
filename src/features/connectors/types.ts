export type ConnectionStatus = "NOT_CONNECTED" | "CONNECTED" | "INVALID" | "EXPIRED" | "ERROR";
export type ConnectorCategory = "AI" | "DATABASE" | "CODE" | "AUTH" | "COMMUNICATION" | "EMAIL" | "AUTOMATION";
export type ConnectorCapability = { id: string; name: string; description: string };
export type ConnectorProvider = { id: string; name: string; category: ConnectorCategory; capabilities: ConnectorCapability[]; credentialRequired: boolean };
export type ConnectorCredential = { providerId: string; label: string; configured: boolean };
export type Connector = { providerId: string; providerName: string; status: ConnectionStatus; required: boolean; capabilities: ConnectorCapability[]; credential?: ConnectorCredential; credentialReference?: import("../credentials/types").CredentialReference };
export type ConnectorResult = { status: ConnectionStatus; message: string };
export type ConnectorAdapter = { connect(): Promise<ConnectorResult>; disconnect(): Promise<ConnectorResult>; validate(): Promise<ConnectorResult>; health(): Promise<ConnectorResult>; capabilities(): ConnectorCapability[] };
