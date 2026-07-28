import type {
  ConsumeRuntimeApprovalInput,
  CreateRuntimeApprovalInput,
  DecideRuntimeApprovalInput,
  RuntimeApprovalFailure,
  RuntimeApprovalRequest,
} from "./types";

export type RuntimeApprovalRepositoryResult<T> =
  | { status: "OK"; value: T; failures: [] }
  | { status: "FAILED"; failures: RuntimeApprovalFailure[] };

/** Product-layer port. Core Runtime never imports this repository. */
export interface RuntimeApprovalRepository {
  create(input: CreateRuntimeApprovalInput): Promise<RuntimeApprovalRepositoryResult<RuntimeApprovalRequest>>;
  decide(input: DecideRuntimeApprovalInput): Promise<RuntimeApprovalRepositoryResult<RuntimeApprovalRequest>>;
  consume(input: ConsumeRuntimeApprovalInput): Promise<RuntimeApprovalRepositoryResult<RuntimeApprovalRequest>>;
  get(approvalId: string, projectId: string, userId: string): Promise<RuntimeApprovalRepositoryResult<RuntimeApprovalRequest>>;
}
