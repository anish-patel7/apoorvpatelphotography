import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wwvjqonaonfluvugtpxl.supabase.co';
const supabaseKey = 'sb_publishable_1eibi8KmCaKoyQ5F_d_dvQ_CwlORkGE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorage() {
  const dummyBuffer = Buffer.from('test');
  const { data, error } = await supabase.storage.from('portfolio-images').upload('test/test.txt', dummyBuffer, {
    contentType: 'text/plain',
    upsert: true
  });
  console.log('Upload result:', error ? error.message : data);

  // Also check database insert test
  const { data: dbData, error: dbError } = await supabase.from('portfolio_projects').insert([{
    title: 'Test Project',
    slug: 'test-project-' + Date.now(),
    category: 'Wedding',
    cover_image_url: 'https://test.com/img.jpg',
    is_published: false
  }]).select();
  console.log('DB insert result:', dbError ? dbError.message : dbData);

  // If dbData succeeded, clean it up
  if (dbData && dbData[0]) {
    await supabase.from('portfolio_projects').delete().eq('id', dbData[0].id);
    console.log('Cleaned up test DB row');
  }
}

testStorage();
