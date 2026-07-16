import type { Connector, ConnectionStatus } from "./types";
import type { CredentialReference } from "../credentials/types";

export type AccountWizardStep = { id: string; providerId: string; title: string; description: string; requiresConsent: boolean; consented: boolean; status: ConnectionStatus; credentialReference?: CredentialReference };
export type AccountConnectionSession = { version: "account-connection-v1"; currentStepIndex: number; steps: AccountWizardStep[]; completed: number; total: number; summary: string };

export function createAccountConnectionSession(connectors: Connector[]): AccountConnectionSession {
  const steps = connectors.filter((connector) => connector.required).map((connector) => ({ id: `account-${connector.providerId}`, providerId: connector.providerId, title: `${connector.providerName} 계정 준비`, description: `${connector.providerName} 연결에 필요한 동의와 Credential 상태를 확인합니다.`, requiresConsent: true, consented: false, status: connector.status, credentialReference: connector.credentialReference }));
  return { version: "account-connection-v1", currentStepIndex: 0, steps, completed: 0, total: steps.length, summary: `${steps.length}개 계정 연결 단계가 준비되었습니다.` };
}

export function acknowledgeConsent(session: AccountConnectionSession, stepId: string): AccountConnectionSession {
  const steps = session.steps.map((step) => step.id === stepId ? { ...step, consented: true } : step);
  return { ...session, steps, completed: steps.filter((step) => step.consented && step.status === "CONNECTED").length };
}

export function updateConnectionStatus(session: AccountConnectionSession, stepId: string, status: ConnectionStatus): AccountConnectionSession {
  const steps = session.steps.map((step) => step.id === stepId ? { ...step, status } : step);
  return { ...session, steps, completed: steps.filter((step) => step.consented && step.status === "CONNECTED").length };
}

export function canConfirmConnection(step: AccountWizardStep) { return step.consented && step.status === "CONNECTED"; }
