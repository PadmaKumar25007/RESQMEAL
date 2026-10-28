import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../db/index.js';
import { User, Donation, Request, Delivery } from '../models/index.js';

export const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    await connectDB();

    // Clear existing collections
    await User.deleteMany({});
    await Donation.deleteMany({});
    await Request.deleteMany({});
    await Delivery.deleteMany({});

    console.log('🧹 Cleared existing data');

    // 1. Seed Users
    const users = await User.insertMany([
      {
        name: 'Ananya Sharma',
        email: 'ananya@sunriseevents.com',
        passwordHash: 'dummy_hash_for_prototype',
        role: 'donor',
        status: 'verified',
        phone: '+91 98765 43210',
        organizationName: 'Sunrise Events & Catering',
        address: 'Indiranagar, Bengaluru',
      },
      {
        name: 'Hope Foundation',
        email: 'contact@hopefoundation.org',
        passwordHash: 'dummy_hash_for_prototype',
        role: 'ngo',
        status: 'verified',
        phone: '+91 98765 12345',
        organizationName: 'Hope Foundation Community Kitchen',
        address: 'Koramangala, Bengaluru',
      },
      {
        name: 'Rahul Verma',
        email: 'rahul.verma@gmail.com',
        passwordHash: 'dummy_hash_for_prototype',
        role: 'volunteer',
        status: 'verified',
        phone: '+91 98765 67890',
        address: 'HSR Layout, Bengaluru',
      },
      {
        name: 'Priya Nair',
        email: 'priya@resqmeal.org',
        passwordHash: 'dummy_hash_for_prototype',
        role: 'admin',
        status: 'verified',
        phone: '+91 98765 99999',
        organizationName: 'ResQMeal Operations Team',
      },
    ]);

    const [donorUser, ngoUser, volunteerUser] = users;

    console.log(`✅ Seeded ${users.length} users`);

    // 2. Seed Donations
    const now = Date.now();
    const donations = await Donation.insertMany([
      {
        donor: donorUser._id,
        foodName: 'Fresh Vegetable Pulao',
        category: 'Cooked meal',
        quantity: '12 kg',
        servings: 48,
        pickupLocation: 'Lake View Community Hall',
        distance: '1.2 km',
        preparedTime: 'Prepared 35 min ago',
        expiryText: '3h 25m left',
        emoji: '🍛',
        description: 'Freshly prepared and packed in food-safe insulated containers.',
        expiresAt: new Date(now + 3.5 * 60 * 60 * 1000),
        status: 'available',
      },
      {
        donor: donorUser._id,
        foodName: 'Whole Wheat Sandwiches',
        category: 'Bakery',
        quantity: '80 pieces',
        servings: 40,
        pickupLocation: 'Green Park Bakery',
        distance: '2.4 km',
        preparedTime: 'Prepared 50 min ago',
        expiryText: '2h 10m left',
        emoji: '🥪',
        description: 'Nutritious veggie sandwiches individually wrapped in parchment.',
        expiresAt: new Date(now + 2 * 60 * 60 * 1000),
        status: 'requested',
        claimedBy: ngoUser._id,
      },
      {
        donor: donorUser._id,
        foodName: 'Mixed Fruit Boxes',
        category: 'Produce',
        quantity: '24 boxes',
        servings: 24,
        pickupLocation: 'Orchid Residency',
        distance: '3.1 km',
        preparedTime: 'Prepared 20 min ago',
        expiryText: '5h 40m left',
        emoji: '🍱',
        description: 'Fresh sliced seasonal fruits in hygienic portion boxes.',
        expiresAt: new Date(now + 5.5 * 60 * 60 * 1000),
        status: 'accepted',
        claimedBy: ngoUser._id,
      },
      {
        donor: donorUser._id,
        foodName: 'Fresh Naan & Paneer Butter Masala',
        category: 'Cooked meal',
        quantity: '15 kg',
        servings: 50,
        pickupLocation: 'Grand Palace Banquet',
        distance: '1.8 km',
        preparedTime: 'Prepared 40 min ago',
        expiryText: '4h 00m left',
        emoji: '🍲',
        description: 'Surplus buffet catering food from an afternoon reception.',
        expiresAt: new Date(now + 4 * 60 * 60 * 1000),
        status: 'available',
      },
      {
        donor: donorUser._id,
        foodName: 'Artisan Assorted Pastries',
        category: 'Bakery',
        quantity: '35 boxes',
        servings: 35,
        pickupLocation: 'Sweet Delights Cafe',
        distance: '2.1 km',
        preparedTime: 'Prepared 15 min ago',
        expiryText: '6h 30m left',
        emoji: '🥐',
        description: 'Fresh baked croissants, danishes, and whole grain buns.',
        expiresAt: new Date(now + 6.5 * 60 * 60 * 1000),
        status: 'available',
      },
    ]);

    console.log(`✅ Seeded ${donations.length} donations`);

    // 3. Seed Requests
    const requests = await Request.insertMany([
      {
        donation: donations[1]._id,
        ngo: ngoUser._id,
        requiredQuantity: '80 pieces',
        peopleToServe: 40,
        note: 'We can collect within 20 minutes for our evening distribution drive. Thank you!',
        status: 'pending',
      },
      {
        donation: donations[2]._id,
        ngo: ngoUser._id,
        requiredQuantity: '24 boxes',
        peopleToServe: 24,
        note: 'Assigned for children at Sahara Care Centre.',
        status: 'accepted',
      },
    ]);

    console.log(`✅ Seeded ${requests.length} requests`);

    // 4. Seed Delivery Tasks
    const deliveries = await Delivery.insertMany([
      {
        donation: donations[0]._id,
        volunteer: volunteerUser._id,
        food: 'Vegetable Pulao',
        quantity: '48 meals',
        from: 'Lake View Community Hall',
        to: 'Hope Foundation Kitchen',
        distance: '3.6 km',
        eta: '18 min',
        urgency: 'High',
        status: 'Available',
      },
      {
        donation: donations[2]._id,
        volunteer: volunteerUser._id,
        food: 'Fruit Boxes',
        quantity: '24 boxes',
        from: 'Orchid Residency',
        to: 'Sahara Care Centre',
        distance: '4.8 km',
        eta: '24 min',
        urgency: 'Medium',
        status: 'Available',
      },
      {
        donation: donations[4]._id,
        volunteer: volunteerUser._id,
        food: 'Pastries & Breads',
        quantity: '35 boxes',
        from: 'Sweet Delights Cafe',
        to: 'City Children Shelter',
        distance: '2.2 km',
        eta: '12 min',
        urgency: 'Delivered',
        status: 'Delivered',
        deliveredAt: new Date(now - 2 * 60 * 60 * 1000),
      },
    ]);

    console.log(`✅ Seeded ${deliveries.length} deliveries`);
    console.log('🎉 Database seeded successfully!');

    return { users, donations, requests, deliveries };
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
};

// If run directly from CLI
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase().then(() => {
    mongoose.connection.close();
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
