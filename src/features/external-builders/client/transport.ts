import type { ExternalBuilderTransport, ExternalBuilderTransportRequest, ExternalBuilderTransportResponse } from "./types";

export class MockExternalBuilderTransport implements ExternalBuilderTransport {
  readonly mode = "MOCK" as const;
  readonly requests: ExternalBuilderTransportRequest[] = [];

  constructor(private readonly responder: (request: ExternalBuilderTransportRequest) => ExternalBuilderTransportResponse | Promise<ExternalBuilderTransportResponse>) {}

  async request(input: ExternalBuilderTransportRequest): Promise<ExternalBuilderTransportResponse> {
    this.requests.push(input);
    return this.responder(input);
  }
}

export function createProductionTransportBoundary(): ExternalBuilderTransport {
  return {
    mode: "PRODUCTION_UNIMPLEMENTED",
    async request() {
      throw new Error("PRODUCTION_TRANSPORT_NOT_IMPLEMENTED");
    },
  };
}
