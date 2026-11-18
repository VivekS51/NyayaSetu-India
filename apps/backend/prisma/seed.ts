import { dbStore } from '../src/config/database';

async function main() {
  console.log('🌱 Commencing statutory seed for Indian Legal Services eMarketplace...');

  console.log(`✅ Loaded ${dbStore.users.length} default users:`);
  dbStore.users.forEach((u) => {
    const roles = dbStore.userRoles.filter((r) => r.userId === u.id).map((r) => r.role);
    console.log(`   - ${u.fullName} (${u.phone}) -> Roles: [${roles.join(', ')}]`);
  });

  console.log(`✅ Loaded ${dbStore.tiers.length} provider incentive tiers:`);
  dbStore.tiers.forEach((t) => {
    console.log(`   - [${t.level}] ${t.name} (Min Points: ${t.minPoints}, Discount: ${t.platformFeeDiscountPercent}%)`);
  });

  console.log(`✅ Loaded ${dbStore.badges.length} statutory trust badges:`);
  dbStore.badges.forEach((b) => {
    console.log(`   - [${b.code}] ${b.title}`);
  });

  console.log(`✅ Loaded ${dbStore.incentiveRules.length} dynamic incentive rules:`);
  dbStore.incentiveRules.forEach((r) => {
    console.log(`   - [${r.ruleCode}] ${r.name} (+${r.pointsAwarded} pts)`);
  });

  console.log('🎉 Seed operation completed successfully.');
}

main().catch((e) => {
  console.error('Seed error:', e);
  process.exit(1);
});

