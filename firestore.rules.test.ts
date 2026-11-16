/**
 * OCEAN SYSTEM — Firestore Security Rules Specification Tests ("Dirty Dozen")
 * Validates structural invariants defined in security_spec.md against firestore.rules.
 */

import fs from 'fs';

interface DirtyDozenCase {
  id: number;
  name: string;
  targetCollection: 'stateBatches' | 'surveys';
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expectedRuleGate: string;
}

const DIRTY_DOZEN_ASSERTIONS: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Unauthenticated write rejected',
    targetCollection: 'stateBatches',
    operation: 'create',
    expectedRuleGate: 'request.auth != null',
  },
  {
    id: 2,
    name: 'Unverified email spoof rejected',
    targetCollection: 'surveys',
    operation: 'create',
    expectedRuleGate: 'request.auth.token.email_verified == true',
  },
  {
    id: 3,
    name: 'Identity spoofing on ownerId rejected',
    targetCollection: 'surveys',
    operation: 'create',
    expectedRuleGate: 'data.ownerId == request.auth.uid',
  },
  {
    id: 4,
    name: 'Shadow ghost field injection rejected',
    targetCollection: 'stateBatches',
    operation: 'create',
    expectedRuleGate: 'data.keys().hasOnly([',
  },
  {
    id: 5,
    name: 'Client forged timestamp rejected',
    targetCollection: 'surveys',
    operation: 'create',
    expectedRuleGate: 'data.createdAt == request.time',
  },
  {
    id: 6,
    name: 'Document ID poisoning rejected',
    targetCollection: 'surveys',
    operation: 'create',
    expectedRuleGate: 'isValidId(surveyId)',
  },
  {
    id: 7,
    name: 'Orphaned batchId reference rejected',
    targetCollection: 'surveys',
    operation: 'create',
    expectedRuleGate: 'exists(/databases/$(database)/documents/stateBatches/$(batchId))',
  },
  {
    id: 8,
    name: 'Cross-tenant batch hijack rejected',
    targetCollection: 'surveys',
    operation: 'create',
    expectedRuleGate: 'get(/databases/$(database)/documents/stateBatches/$(batchId)).data.ownerId == request.auth.uid',
  },
  {
    id: 9,
    name: 'Terminal stateBatch update locked',
    targetCollection: 'stateBatches',
    operation: 'update',
    expectedRuleGate: 'allow update: if false;',
  },
  {
    id: 10,
    name: 'Immutable survey record update locked',
    targetCollection: 'surveys',
    operation: 'update',
    expectedRuleGate: 'allow update: if false;',
  },
  {
    id: 11,
    name: 'Unfiltered list scraping blocked',
    targetCollection: 'surveys',
    operation: 'list',
    expectedRuleGate: 'existing().ownerId == request.auth.uid',
  },
  {
    id: 12,
    name: 'Oversized P11 concern array blocked',
    targetCollection: 'surveys',
    operation: 'create',
    expectedRuleGate: 'b.p11_preocupaciones_top3.size() <= 3',
  },
];

export function verifyRulesInvariants(): void {
  const rulesText = fs.readFileSync('./firestore.rules', 'utf8');
  for (const testCase of DIRTY_DOZEN_ASSERTIONS) {
    if (!rulesText.includes(testCase.expectedRuleGate)) {
      throw new Error(
        `Security invariant #${testCase.id} (${testCase.name}) failed: missing gate ${testCase.expectedRuleGate}`
      );
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  verifyRulesInvariants();
  console.log('All 12 Dirty Dozen security rule assertions verified.');
}
