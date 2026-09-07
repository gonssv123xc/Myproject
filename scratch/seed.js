const { createClient } = require('@supabase/supabase-js');

// Fix URL by removing /rest/v1/ if present
const url = 'https://lvjhnuluvsuaqcmnmsht.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2amhudWx1dnN1YXFjbW5tc2h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzM5MDcsImV4cCI6MjA4Nzk0OTkwN30.a2X8Wa7hSpo00xprLSKWC5Kah8Tpcac18H_qa5ZN3XM';

const supabase = createClient(url, key);

async function seed() {
  const users = [
    { email: 'owner@test.com', password: 'password123', firstName: 'Admin', lastName: 'Owner', role: 'OWNER' },
    { email: 'barber1@test.com', password: 'password123', firstName: 'John', lastName: 'Barber', role: 'BARBER' },
    { email: 'customer1@test.com', password: 'password123', firstName: 'Somchai', lastName: 'Customer', role: 'CUSTOMER' }
  ];

  console.log('Seeding test accounts...');

  for (const u of users) {
    console.log(`Creating ${u.email}...`);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: u.email,
      password: u.password,
    });
    
    if (authError) {
      console.error(`  [!] Error signing up ${u.email}:`, authError.message);
      continue;
    }
    
    if (authData.user) {
      const profile = {
        id: authData.user.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        password: u.password,
        role: u.role,
        updatedAt: new Date().toISOString()
      };
      
      const { error: dbError } = await supabase.from('User').upsert(profile);
      if (dbError) {
        console.error(`  [!] Error saving profile for ${u.email}:`, dbError.message);
      } else {
        console.log(`  [+] Successfully created ${u.email} as ${u.role}`);
      }
      
      if (u.role === 'BARBER') {
         await supabase.from('Barber').upsert({
           id: authData.user.id,
           userId: authData.user.id,
           nickname: 'John',
           bio: 'Expert barber with 5 years experience',
           status: 'AVAILABLE',
           isActive: true,
           updatedAt: new Date().toISOString()
         });
         console.log(`  [+] Created Barber record for ${u.email}`);
      }
    }
  }
  console.log('Done!');
}

seed();
