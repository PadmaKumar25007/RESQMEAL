import 'dotenv/config';
import { pool } from '../db/index.js';

export const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    await pool.query('DELETE FROM donation_requests');
    await pool.query('DELETE FROM donations');
    await pool.query('DELETE FROM deliveries');
    await pool.query('DELETE FROM users');
    console.log('🧹 Cleared existing data');

    const users = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, status, phone, organization_name, address) VALUES
       ($1,$2,$3,'donor','verified',$4,$5,$6),
       ($7,$8,$9,'ngo','verified',$10,$11,$12),
       ($13,$14,$15,'volunteer','verified',$16,NULL,$17),
       ($18,$19,$20,'admin','verified',NULL,$21,NULL)
       RETURNING *`,
      [
        'Ananya Sharma', 'ananya@sunriseevents.com', 'dummy_hash_for_prototype', '+91 98765 43210', 'Sunrise Events & Catering', 'Indiranagar, Bengaluru',
        'Hope Foundation', 'contact@hopefoundation.org', 'dummy_hash_for_prototype', '+91 98765 12345', 'Hope Foundation Community Kitchen', 'Koramangala, Bengaluru',
        'Rahul Verma', 'rahul.verma@gmail.com', 'dummy_hash_for_prototype', '+91 98765 67890', 'HSR Layout, Bengaluru',
        'Priya Nair', 'priya@resqmeal.org', 'dummy_hash_for_prototype', NULL, 'ResQMeal Operations Team',
      ]
    );
    const usersData = users.rows;
    const donorUser = usersData[0];
    const ngoUser = usersData[1];
    const volunteerUser = usersData[2];
    console.log(`✅ Seeded ${usersData.length} users`);

    const donationSeeds = [
      { foodName: 'Fresh Vegetable Pulao', category: 'Cooked meal', quantity: '12 kg', servings: 48, pickupLocation: 'Lake View Community Hall', distance: '1.2 km', preparedTime: 'Prepared 35 min ago', expiryText: '3h 25m left', emoji: '🍛', description: 'Freshly prepared and packed in food-safe insulated containers.', status: 'available', claimedBy: null, expiresInHours: 3 },
      { foodName: 'Whole Wheat Sandwiches', category: 'Bakery', quantity: '80 pieces', servings: 40, pickupLocation: 'Green Park Bakery', distance: '2.4 km', preparedTime: 'Prepared 50 min ago', expiryText: '2h 10m left', emoji: '🥪', description: 'Nutritious veggie sandwiches individually wrapped in parchment.', status: 'requested', claimedBy: ngoUser.id, expiresInHours: 2 },
      { foodName: 'Mixed Fruit Boxes', category: 'Produce', quantity: '24 boxes', servings: 24, pickupLocation: 'Orchid Residency', distance: '3.1 km', preparedTime: 'Prepared 20 min ago', expiryText: '5h 40m left', emoji: '🍱', description: 'Fresh sliced seasonal fruits in hygienic portion boxes.', status: 'accepted', claimedBy: ngoUser.id, expiresInHours: 5 },
      { foodName: 'Fresh Naan & Paneer Butter Masala', category: 'Cooked meal', quantity: '15 kg', servings: 50, pickupLocation: 'Grand Palace Banquet', distance: '1.8 km', preparedTime: 'Prepared 40 min ago', expiryText: '4h 00m left', emoji: '🍲', description: 'Surplus buffet catering food from an afternoon reception.', status: 'available', claimedBy: null, expiresInHours: 4 },
      { foodName: 'Artisan Assorted Pastries', category: 'Bakery', quantity: '35 boxes', servings: 35, pickupLocation: 'Sweet Delights Cafe', distance: '2.1 km', preparedTime: 'Prepared 15 min ago', expiryText: '6h 30m left', emoji: '🥐', description: 'Fresh baked croissants, danishes, and whole grain buns.', status: 'available', claimedBy: null, expiresInHours: 6 },
    ];

    const donations = [];
    for (const d of donationSeeds) {
      const result = await pool.query(
        `INSERT INTO donations (donor_id, food_name, category, quantity, servings, pickup_location, distance, prepared_time, expiry_text, emoji, description, status, claimed_by, expires_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, now() + ($14 || ' hours')::interval)
         RETURNING *`,
        [
          donorUser.id, d.foodName, d.category, d.quantity, d.servings, d.pickupLocation, d.distance, d.preparedTime, d.expiryText, d.emoji, d.description, d.status, d.claimedBy, String(d.expiresInHours),
        ]
      );
      donations.push(result.rows[0]);
    }
    console.log(`✅ Seeded ${donations.length} donations`);

    const requests = await pool.query(
      `INSERT INTO donation_requests (donation_id, ngo_id, required_quantity, people_to_serve, note, status) VALUES
       ($1,$2,'80 pieces',40,'We can collect within 20 minutes for our evening distribution drive. Thank you!','pending'),
       ($3,$2,'24 boxes',24,'Assigned for children at Sahara Care Centre.','accepted')
       RETURNING *`,
      [donations[1].id, ngoUser.id, donations[2].id]
    );
    const requestsData = requests.rows;
    console.log(`✅ Seeded ${requestsData.length} requests`);

    const deliveries = await pool.query(
      `INSERT INTO deliveries (donation_id, volunteer_id, food, quantity, from_location, to_location, distance, eta, urgency, status, delivered_at) VALUES
       ($1,$2,'Vegetable Pulao','48 meals','Lake View Community Hall','Hope Foundation Kitchen','3.6 km','18 min','High','Available',NULL),
       ($3,$2,'Fruit Boxes','24 boxes','Orchid Residency','Sahara Care Centre','4.8 km','24 min','Medium','Available',NULL),
       ($4,$2,'Pastries & Breads','35 boxes','Sweet Delights Cafe','City Children Shelter','2.2 km','12 min','Delivered', now() - interval '2 hours')
       RETURNING *`,
      [donations[0].id, volunteerUser.id, donations[2].id, donations[4].id]
    );
    const deliveriesData = deliveries.rows;
    console.log(`✅ Seeded ${deliveriesData.length} deliveries`);

    return { users: usersData, donations, requests: requestsData, deliveries: deliveriesData };
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
};

if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase().then(() => {
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
