
import dotenv from 'dotenv';
import { generateItinerary } from './backend/services/groqService.js';

dotenv.config({ path: './backend/.env' });

async function test() {
  const rfqData = {
    destinations: [
      { destination: 'Paris', dateOfArrival: '2026-05-10', numberOfNights: 3 },
      { destination: 'London', dateOfArrival: '2026-05-13', numberOfNights: 3 }
    ],
    guestCountry: 'India',
    numberOfAdults: 2
  };

  try {
    console.log('Testing generateItinerary...');
    const result = await generateItinerary(rfqData);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Test failed:', err);
  }
}

test();
