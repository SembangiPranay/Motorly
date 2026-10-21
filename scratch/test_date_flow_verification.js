// scratch/test_date_flow_verification.js
// Automated verification for Date Arrangement & Complete Booking Flow

const BASE_URL = 'http://localhost:3001';

async function runDateFlowTests() {
  console.log('🧪 Starting Comprehensive Date Arrangement & Flow Verification:\n');

  // --- TEST 1: Date String Formats & Duration Math ---
  console.log('--- TEST 1: Date Calculations & Math ---');
  const testCases = [
    { start: 'Mar 15, 2026', end: 'Mar 16, 2026', expectedDays: 1 },
    { start: 'Mar 15, 2026', end: 'Mar 18, 2026', expectedDays: 3 },
    { start: 'Mar 15, 2026', end: 'Mar 22, 2026', expectedDays: 7 },
    { start: 'Apr 01, 2026', end: 'Apr 15, 2026', expectedDays: 14 },
    { start: 'May 01, 2026', end: 'May 31, 2026', expectedDays: 30 }
  ];

  for (const tc of testCases) {
    const s = Date.parse(tc.start);
    const e = Date.parse(tc.end);
    const days = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)));
    if (days === tc.expectedDays) {
      console.log(`✓ ${tc.start} → ${tc.end} correctly calculates to ${days} day(s)`);
    } else {
      console.error(`✗ FAILED: Expected ${tc.expectedDays} days, got ${days}`);
      process.exit(1);
    }
  }

  // --- TEST 2: Dynamic Fleet Availability for Existing Booked Dates ---
  console.log('\n--- TEST 2: Backend Live Fleet Query for Arranged Dates ---');
  // Toyota Camry is booked for Mar 15 - Mar 18 in initial DB
  const resOverlap = await fetch(`${BASE_URL}/api/cars?pickupDate=Mar+15%2C+2026&returnDate=Mar+18%2C+2026`);
  const carsOverlap = await resOverlap.json();
  const camryOverlap = carsOverlap.find(c => c.id === 'toyota-camry');
  const crvOverlap = carsOverlap.find(c => c.id === 'honda-crv');

  console.log(`Toyota Camry availability for Mar 15 - 18: isAvailableForDates = ${camryOverlap?.isAvailableForDates}, status = ${camryOverlap?.statusForDates}`);
  if (camryOverlap && camryOverlap.isAvailableForDates === false) {
    console.log('✓ PASS: Reserved vehicle correctly marked unavailable for overlapping dates');
  } else {
    console.error('✗ FAILED: Toyota Camry should be unavailable for Mar 15 - 18');
    process.exit(1);
  }

  if (crvOverlap && crvOverlap.isAvailableForDates === true) {
    console.log(`✓ PASS: Unreserved vehicle (Honda CR-V) correctly marked available for same dates`);
  } else {
    console.error('✗ FAILED: Honda CR-V should be available');
    process.exit(1);
  }

  // --- TEST 3: Arranging Different Future Dates (June 10 - June 15, 2026) ---
  console.log('\n--- TEST 3: Live Query for Newly Arranged Future Dates (Jun 10 - Jun 15) ---');
  const resFuture = await fetch(`${BASE_URL}/api/cars?pickupDate=Jun+10%2C+2026&returnDate=Jun+15%2C+2026`);
  const carsFuture = await resFuture.json();
  const camryFuture = carsFuture.find(c => c.id === 'toyota-camry');

  if (camryFuture && camryFuture.isAvailableForDates === true) {
    console.log('✓ PASS: Vehicle is completely free & available for future arranged dates');
  } else {
    console.error('✗ FAILED: Vehicle should be available for future dates');
    process.exit(1);
  }

  // --- TEST 4: Complete End-to-End Booking with Arranged Dates ---
  console.log('\n--- TEST 4: Complete End-to-End Booking with Arranged Dates ---');
  const arrangedDatesBooking = {
    carId: 'bmw-3-series',
    customerName: 'Sarah Connor',
    customerEmail: 'sarah.connor@cyberdyne.org',
    customerPhone: '(305) 999-8888',
    pickupLocation: 'Miami International Airport (MIA)',
    returnLocation: 'Miami International Airport (MIA)',
    pickupDate: 'Jul 20, 2026',
    pickupTime: '09:00 AM',
    returnDate: 'Jul 25, 2026',
    returnTime: '05:00 PM',
    rentalDurationDays: 5,
    totalPrice: 425.00,
    licenseFrontUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    licenseBackUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
  };

  const createRes = await fetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arrangedDatesBooking)
  });
  const createData = await createRes.json();
  console.log(`Created new reservation ${createData.booking?.id || createData.id} for BMW 3 Series (Jul 20 - Jul 25, 2026)`);

  // Verify that BMW 3 Series is now blocked for those dates
  const checkConflictRes = await fetch(`${BASE_URL}/api/cars/bmw-3-series/availability?pickupDate=Jul+22%2C+2026&returnDate=Jul+24%2C+2026`);
  const checkConflictData = await checkConflictRes.json();
  console.log(`Availability check for overlapping sub-range (Jul 22 - Jul 24): isAvailable = ${checkConflictData.isAvailable}`);

  if (checkConflictData.isAvailable === false) {
    console.log(`✓ PASS: Backend verified conflict: ${checkConflictData.conflict?.id} (${checkConflictData.conflict?.pickupDate} - ${checkConflictData.conflict?.returnDate})`);
  } else {
    console.error('✗ FAILED: Expected conflict check to return isAvailable = false');
    process.exit(1);
  }

  // Verify that BMW 3 Series is still available for August
  const checkAugRes = await fetch(`${BASE_URL}/api/cars/bmw-3-series/availability?pickupDate=Aug+01%2C+2026&returnDate=Aug+05%2C+2026`);
  const checkAugData = await checkAugRes.json();
  if (checkAugData.isAvailable === true) {
    console.log('✓ PASS: Vehicle remains available for non-overlapping future dates (Aug 1 - Aug 5)');
  } else {
    console.error('✗ FAILED: Vehicle should be available for Aug 1 - Aug 5');
    process.exit(1);
  }

  console.log('\n🎉 ALL DATE ARRANGEMENT & DATA FLOW VERIFICATIONS PASSED 100%!');
}

runDateFlowTests().catch(err => {
  console.error('Error during test execution:', err);
  process.exit(1);
});
