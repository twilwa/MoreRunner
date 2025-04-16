// IMPORTANT: All threat action potential (AP) changes must use the utility functions in this file.
// Do NOT modify threat.actionPotential directly anywhere else in the codebase. This ensures correct play/deferred logic.

// Utility functions for threat action potential (AP) logic
// This module centralizes AP gain and card play logic for threats

export interface Threat {
  id: string;
  name: string;
  actionPotential: number;
  maxActionPotential: number;
  playCard: () => void;
  isActive?: boolean; // Optional for backward compatibility
  // ...other threat properties
}

/**
 * Increments a threat's action potential by a given amount.
 * If AP exceeds max (crosses from less than or equal to max to greater than max), triggers playCard.
 * If AP reaches max exactly, defers play until next gain.
 * Returns true if playCard was triggered.
 */
export function gainThreatAP(threat: Threat, amount: number): boolean {
  const wasBelowOrAtMax = threat.actionPotential <= threat.maxActionPotential;
  threat.actionPotential += amount;
  if (wasBelowOrAtMax && threat.actionPotential > threat.maxActionPotential) {
    threat.playCard();
    return true;
  }
  return false;
}

/**
 * Grant AP after execution (active threats only).
 */
export function grantAPAfterExecution(threats: Threat[]): void {
  threats.forEach(threat => {
    // Only active threats get AP after execution
    if (threat.isActive) gainThreatAP(threat, 1);
  });
}

/**
 * Grant AP after reshuffle (all threats).
 */
export function grantAPAfterReshuffle(threats: Threat[]): void {
  threats.forEach(threat => gainThreatAP(threat, 1));
}
