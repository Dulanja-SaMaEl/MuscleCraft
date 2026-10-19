/**
 * IronForge Athletic Platform Test Runner
 * Verifies RBAC, Manual Bank Transfer Workflows, IDOR Prevention, and Video Access Control
 */

const assert = require('assert');

// Mock data and services directly
const { db } = require('../lib/db/mock-db');
const { AuthService } = require('../lib/services/auth-service');
const { PaymentService } = require('../lib/services/payment-service');
const { CoachingService } = require('../lib/services/coaching-service');
const { VideoService } = require('../lib/services/video-service');
const { AdminService } = require('../lib/services/admin-service');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
  }
}

console.log('\n======================================================');
console.log('⚡ RUNNING IRONFORGE FITNESS PLATFORM TEST SUITE');
console.log('======================================================\n');

// 1. Unique Bank Transfer Reference Code Test
runTest('PaymentService generates unique reference format TRF-IRON-XXXXXX', () => {
  const code = PaymentService.generateReferenceCode();
  assert(code.startsWith('TRF-IRON-'), 'Reference code must start with TRF-IRON-');
  assert.strictEqual(code.length, 15, 'Reference code should have exact length of 15 chars');
});

// 2. Manual Bank Transfer Submission Test
runTest('Client can submit manual bank transfer with pending status', () => {
  const payment = PaymentService.submitBankTransfer({
    userId: 'usr_client_month',
    referenceCode: 'TRF-IRON-999999',
    tier: 'monthly',
    bankName: 'Test Bank USA',
    transferDate: '2026-10-15',
    senderAccountName: 'Sarah Jenkins',
    receiptNotes: 'Automated test wire transfer',
  });

  assert.strictEqual(payment.status, 'pending', 'Newly submitted payment must be pending');
  assert.strictEqual(payment.amount, 50.0, 'Monthly fee must equal $50.00');
  assert.strictEqual(payment.referenceCode, 'TRF-IRON-999999');
});

// 3. Admin Payment Approval Test
runTest('Admin can approve pending bank transfer and activate membership', () => {
  const admin = db.users.find((u) => u.role === 'admin');
  assert(admin, 'Admin must exist in DB');

  const pendingPayment = db.payments.find((p) => p.status === 'pending');
  assert(pendingPayment, 'Should have pending payment in test DB');

  const approved = PaymentService.approvePayment(admin, pendingPayment.id, 'Wire verified in test');
  assert.strictEqual(approved.status, 'approved', 'Payment status must update to approved');
  assert.strictEqual(approved.reviewedBy, admin.id, 'Payment must record reviewer ID');

  const activatedUser = db.users.find((u) => u.id === approved.userId);
  assert.strictEqual(activatedUser.status, 'active', 'User status must become active');
  assert(activatedUser.membershipExpiresAt, 'User must have membership expiration date');
});

// 4. Non-Admin Approval Rejection (RBAC)
runTest('Client cannot approve payment (RBAC Security Enforcement)', () => {
  const client = db.users.find((u) => u.role === 'client');
  assert.throws(
    () => {
      PaymentService.approvePayment(client, 'pay_001', 'Illegal attempt');
    },
    /Unauthorized/,
    'Should throw unauthorized exception'
  );
});

// 5. IDOR Prevention: Client accessing other client measurements
runTest('Client cannot view another client measurements (IDOR Prevention)', () => {
  const marcus = db.users.find((u) => u.id === 'usr_client_90');
  assert.throws(
    () => {
      // Marcus Vance attempts to read David Reynolds measurements
      CoachingService.getMeasurements(marcus, 'usr_client_pending');
    },
    /Forbidden/,
    'Should throw forbidden error for cross-client measurement access'
  );
});

// 6. Assigned Coach Can Access Assigned Client Measurements
runTest('Assigned Coach can view assigned client measurements', () => {
  const coachElena = db.users.find((u) => u.id === 'usr_inst_1');
  const marcusMeas = CoachingService.getMeasurements(coachElena, 'usr_client_90');
  assert(Array.isArray(marcusMeas), 'Coach should receive measurements array');
  assert(marcusMeas.length > 0, 'Marcus should have baseline measurements');
});

// 7. Video Access Control: Common vs 90-Day VIP
runTest('Monthly gym client only receives common videos (Tier Enforcement)', () => {
  const sarahMonthly = db.users.find((u) => u.id === 'usr_client_month');
  sarahMonthly.tier = 'monthly';
  const permittedVideos = VideoService.getPermittedVideos(sarahMonthly);

  const vipExclusive = permittedVideos.filter((v) => v.accessLevel === 'coaching_90');
  assert.strictEqual(vipExclusive.length, 0, 'Monthly member must not see 90-day VIP videos');
});

runTest('90-Day VIP client receives all videos including exclusive clinics', () => {
  const marcusVip = db.users.find((u) => u.id === 'usr_client_90');
  marcusVip.tier = 'coaching_90';
  const permittedVideos = VideoService.getPermittedVideos(marcusVip);

  const vipExclusive = permittedVideos.filter((v) => v.accessLevel === 'coaching_90');
  assert(vipExclusive.length > 0, '90-Day VIP client must have access to VIP clinic videos');
});

// 8. Audit Logging Test
runTest('Security and payment events are recorded in audit logs', () => {
  assert(db.auditLogs.length > 0, 'Audit logs must contain recorded security events');
  const paymentAudit = db.auditLogs.find((l) => l.action === 'PAYMENT_APPROVED');
  assert(paymentAudit, 'Must record payment approval audit entry');
});

console.log('\n------------------------------------------------------');
console.log(`RESULTS: ${passedTests}/${totalTests} Tests Passed Successfully!`);
console.log('------------------------------------------------------\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
