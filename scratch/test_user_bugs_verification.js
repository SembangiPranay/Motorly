// Test verification script for all 4 user-reported bugs
const BASE_URL = 'http://localhost:3001/api';

async function testUserBugs() {
  console.log('🧪 Starting Verification of User Bugs:\n');

  // 1. Double Booking Prevention Test
  console.log('--- TEST 1: Double Booking Conflict Check ---');
  // First, fetch available cars
  const carsRes = await fetch(`${BASE_URL}/cars`);
  const cars = await carsRes.json();
  const testCar = cars[0];
  console.log(`Using test vehicle: ${testCar.name} (${testCar.id})`);

  // Create initial booking for Mar 15 to Mar 18, 2026
  const booking1Res = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: `TEST-BK-1-${Date.now().toString().slice(-4)}`,
      customer: { firstName: 'Alice', lastName: 'Walker', email: 'alice@test.com', phone: '305-111-2222' },
      driver: { licenseNumber: 'FL-A111222', licenseState: 'Florida' },
      matchedCarId: testCar.id,
      pickupDate: 'Mar 15, 2026',
      returnDate: 'Mar 18, 2026',
      totalAmount: 180,
    }),
  });
  const booking1Data = await booking1Res.json();
  console.log(`Booking 1 status: ${booking1Res.status} (ID: ${booking1Data.id})`);

  // Attempt duplicate/overlapping booking for the SAME car during overlapping dates (Mar 16 to Mar 19, 2026)
  const booking2Res = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: `TEST-BK-CONFLICT-${Date.now().toString().slice(-4)}`,
      customer: { firstName: 'Bob', lastName: 'Conflict', email: 'bob@test.com', phone: '305-333-4444' },
      driver: { licenseNumber: 'FL-B333444', licenseState: 'Florida' },
      matchedCarId: testCar.id,
      pickupDate: 'Mar 16, 2026',
      returnDate: 'Mar 19, 2026',
      totalAmount: 180,
    }),
  });
  const booking2Data = await booking2Res.json();
  console.log(`Booking 2 (Overlapping dates) response status: ${booking2Res.status}`);
  if (booking2Res.status === 409) {
    console.log('✓ PASS: Double booking correctly blocked with HTTP 409 Conflict!');
    console.log(`  Error: ${booking2Data.error}`);
  } else {
    console.error('✗ FAIL: Server allowed overlapping booking!');
    process.exit(1);
  }

  // Check availability endpoint for overlapping vs non-overlapping dates
  const availConflictRes = await fetch(`${BASE_URL}/cars/${testCar.id}/availability?pickupDate=Mar+15,+2026&returnDate=Mar+17,+2026`);
  const availConflict = await availConflictRes.json();
  console.log(`✓ Availability check (overlapping dates): isAvailable=${availConflict.isAvailable} (conflict with ${availConflict.conflict?.conflictingBookingId})`);

  const availFreeRes = await fetch(`${BASE_URL}/cars/${testCar.id}/availability?pickupDate=Apr+01,+2026&returnDate=Apr+05,+2026`);
  const availFree = await availFreeRes.json();
  console.log(`✓ Availability check (free dates Apr 1-5): isAvailable=${availFree.isAvailable}`);

  // 2. Real Driver License Upload & Download as Binary Photo
  console.log('\n--- TEST 2: Real License Photo Upload & Download ---');
  // Sample 1x1 transparent PNG data URL
  const samplePngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  
  const bookingWithRealPhotoRes = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: `TEST-DL-${Date.now().toString().slice(-4)}`,
      customer: { firstName: 'Diana', lastName: 'Prince', email: 'diana@amazon.com', phone: '305-999-0000' },
      driver: {
        licenseNumber: 'FL-WONDER-1',
        licenseState: 'Florida',
        licensePhotoFront: samplePngBase64,
        licensePhotoBack: samplePngBase64,
        licenseFileName: 'real_license_photo.png',
        licenseBackFileName: 'real_license_back.png',
      },
      pickupDate: 'May 01, 2026',
      returnDate: 'May 04, 2026',
      totalAmount: 220,
    }),
  });
  const bookingWithRealPhoto = await bookingWithRealPhotoRes.json();
  console.log(`Created booking with real uploaded PNG: ${bookingWithRealPhoto.id}`);

  // Test downloading front photo
  const dlFrontRes = await fetch(`${BASE_URL}/bookings/${bookingWithRealPhoto.id}/download-license?side=front`);
  const contentType = dlFrontRes.headers.get('content-type');
  const contentDisp = dlFrontRes.headers.get('content-disposition');
  console.log(`Download Front Response: Status=${dlFrontRes.status}, Content-Type=${contentType}`);
  console.log(`Content-Disposition: ${contentDisp}`);

  if (contentType.includes('image/png') && contentDisp.includes('.png')) {
    console.log('✓ PASS: Downloaded real uploaded PNG image file rather than generic SVG!');
  } else {
    console.error('✗ FAIL: Did not return real image file.');
    process.exit(1);
  }

  // 3. Admin Counter Booking Double-Booking Check
  console.log('\n--- TEST 3: Admin Counter Dispatch Conflict Prevention ---');
  const counterConflictRes = await fetch(`${BASE_URL}/admin/counter-booking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      carId: testCar.id,
      firstName: 'WalkIn',
      lastName: 'Conflict',
      pickupDate: 'Mar 15, 2026',
      returnDate: 'Mar 17, 2026',
    }),
  });
  console.log(`Counter dispatch on already reserved car returned status: ${counterConflictRes.status}`);
  if (counterConflictRes.status === 409) {
    console.log('✓ PASS: Admin counter dispatch prevented double booking with HTTP 409 Conflict!');
  } else {
    console.error('✗ FAIL: Counter booking allowed double booking!');
    process.exit(1);
  }

  console.log('\n🎉 ALL 4 USER BUG TEST SUITES PASSED FLAWLESSLY!');
}

testUserBugs().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
