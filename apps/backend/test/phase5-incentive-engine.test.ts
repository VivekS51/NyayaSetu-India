import { dbStore } from '../src/config/database';
import { IncentivesService } from '../src/modules/incentives/incentives.service';
import { TierLevel, PointsType } from '../src/common/types';

async function runPhase5VerificationTests() {
  console.log('🧪 Starting Phase 5 Comprehensive Test Suite (Incentive Engine, Rules, Ledger, Tiers, Referrals)...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    const incentivesService = new IncentivesService();

    const advocateProfile = dbStore.providerProfiles.find((p) => p.barRegistrationNo === 'D/1428/2012');
    const advocateUser = dbStore.users.find((u) => u.id === advocateProfile?.userId);

    assert(!!advocateProfile && !!advocateUser, 'Seeded advocate user and profile exist');

    // 1. Wallet & Tier Details
    console.log('[Test Suite 1: Wallet, Tiers & Active Perks Evaluation]');
    const walletDetails = await incentivesService.getWalletDetails(advocateUser!.id);
    assert(walletDetails.rewardPointsBalance > 0, 'Wallet reward points balance is active');
    assert(walletDetails.tier !== null, 'Provider tier successfully evaluated');
    assert(walletDetails.tier?.level === TierLevel.SILVER, 'Advocate is evaluated at SILVER tier based on points');
    assert(walletDetails.tier?.platformFeeDiscountPercent === 2.5, 'Silver tier grants 2.5% platform fee discount perk');
    assert(walletDetails.activePerks.length >= 3, 'Active perks populated from tier benefits');

    // 2. Immutable Points Ledger Audit
    console.log('\n[Test Suite 2: Immutable Double-Entry Points Ledger]');
    const ledger = await incentivesService.getPointsLedger(advocateUser!.id);
    assert(ledger.total >= 2, 'Points ledger contains immutable audit records');
    const hasCredit = ledger.items.some((i) => i.type === PointsType.CREDIT && i.points > 0);
    assert(hasCredit, 'Points credit ledger transaction verified');

    // 3. Points Redemption Flow
    console.log('\n[Test Suite 3: Points Redemption & Voucher Generation]');
    const initialPoints = walletDetails.rewardPointsBalance;

    const redemptionResult = await incentivesService.redeemPoints(advocateUser!.id, {
      rewardType: 'FEE_WAIVER_VOUCHER_100',
    });
    assert(redemptionResult.voucherCode.startsWith('VCHR-FEE_WAIV'), 'Valid voucher code issued on points redemption');
    assert(redemptionResult.pointsDeducted === 100, 'Exact 100 points deducted');
    assert(redemptionResult.remainingPoints === initialPoints - 100, 'Wallet balance updated accurately in memory');

    // Verify DEBIT entry was written to points ledger
    const updatedLedger = await incentivesService.getPointsLedger(advocateUser!.id);
    const debitEntry = updatedLedger.items.find((i) => i.type === PointsType.DEBIT);
    assert(!!debitEntry && debitEntry.points === -100, 'Immutable DEBIT record written to points ledger');

    // Test Insufficient Points Protection
    let insufficientPointsBlocked = false;
    try {
      await incentivesService.redeemPoints(advocateUser!.id, {
        rewardType: 'CPD_MASTERCLASS_PASS', // Requires 250 points
      });
      // Try again to exceed balance
      await incentivesService.redeemPoints(advocateUser!.id, {
        rewardType: 'CASE_MANAGEMENT_PRO_TRIAL', // Requires 300 points
      });
    } catch {
      insufficientPointsBlocked = true;
    }
    assert(insufficientPointsBlocked, 'Anti-fraud safeguard prevents overdrawn point redemption');

    // 4. Provider Referral Engine
    console.log('\n[Test Suite 4: Provider-to-Provider Referral System]');
    const referralInfo = await incentivesService.getReferralDetails(advocateUser!.id);
    assert(referralInfo.referralCode.startsWith('REF-'), 'Custom statutory referral code generated');
    assert(referralInfo.perReferralRewardPoints === 50, 'Referral incentive rule is set to 50 points');
    assert(
      referralInfo.qualificationRequirement.includes('Anti-Fraud Safeguard'),
      'Strict anti-fraud qualification requirement stated'
    );

    // 5. Monthly Impact Report Generator
    console.log('\n[Test Suite 5: Monthly Social & Judicial Impact Report]');
    const impactReport = await incentivesService.generateImpactReport(advocateUser!.id);
    assert(impactReport.practitionerName === advocateUser!.fullName, 'Impact report addresses practitioner');
    assert(impactReport.proBonoCasesCompleted >= 1, 'Tracks pro-bono / DLSA legal aid cases');
    assert(impactReport.dlsaLegalAidHours > 0, 'Accredits legal aid volunteering hours');
    assert(impactReport.averageRating >= 4.5, 'Computes verified client satisfaction index');

    // 6. Admin Dynamic Rule Engine
    console.log('\n[Test Suite 6: Admin Configurable Rule Module]');
    const newRule = await incentivesService.createRule({
      ruleCode: 'RULE_TELELAW_RURAL_OUTREACH',
      name: 'Completed Tele-Law Rural Gram Panchayat Case',
      triggerEvent: 'PRO_BONO_CASE_COMPLETED',
      pointsAwarded: 80,
      isActive: true,
    });
    assert(newRule.ruleCode === 'RULE_TELELAW_RURAL_OUTREACH', 'Admin successfully created dynamic incentive rule without redeployment');

    const updatedRule = await incentivesService.updateRule(newRule.id, {
      pointsAwarded: 90,
      isActive: false,
    });
    assert(updatedRule.pointsAwarded === 90 && updatedRule.isActive === false, 'Admin successfully updated rule reward points and toggled status');

    // 7. Opt-in Anonymized Leaderboard
    console.log('\n[Test Suite 7: Opt-In Anonymized Leaderboard]');
    const leaderboard = await incentivesService.getLeaderboard();
    assert(leaderboard.length >= 3, 'Leaderboard lists top practitioners');
    assert(leaderboard[0].rank === 1, 'Leaderboard items ordered by impact rank');

    console.log('\n================================================================');
    console.log(`Phase 5 Test Execution Summary: ${passed} Passed, ${failed} Failed`);
    console.log('================================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Phase 5 Test Suite encountered an error:', err);
    process.exit(1);
  }
}

runPhase5VerificationTests();

