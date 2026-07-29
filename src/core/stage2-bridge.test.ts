import { describe, expect, it } from 'vitest';
import {
  createStage2BridgeEnvelope,
  isStage2BridgeEnvelope,
  STAGE2_PROTOCOL_VERSION,
} from './stage2-bridge';

describe('Stage 2 bridge contract', () => {
  it('creates a versioned request with a stable request ID', () => {
    const message = createStage2BridgeEnvelope('bridge.health', {}, 'request-1');
    expect(message.protocolVersion).toBe(STAGE2_PROTOCOL_VERSION);
    expect(message.requestId).toBe('request-1');
    expect(isStage2BridgeEnvelope(message)).toBe(true);
  });

  it('rejects unversioned or malformed responses', () => {
    expect(isStage2BridgeEnvelope({ messageType: 'bridge.health.result' })).toBe(false);
    expect(isStage2BridgeEnvelope(null)).toBe(false);
  });
});
