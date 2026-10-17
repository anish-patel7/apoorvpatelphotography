import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wwvjqonaonfluvugtpxl.supabase.co';
const supabaseKey = 'sb_publishable_1eibi8KmCaKoyQ5F_d_dvQ_CwlORkGE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testImageUpload() {
  const dummyWebp = Buffer.from('RIFF\x1a\x00\x00\x00WEBPVP8 \x0e\x00\x00\x00\xb0\x01\x00\x9d\x01\x2a\x01\x00\x01\x00\x00', 'binary');
  const { data, error } = await supabase.storage.from('portfolio-images').upload('test/test.webp', dummyWebp, {
    contentType: 'image/webp',
    upsert: true
  });
  console.log('Upload result:', error ? error.message : data);
}

testImageUpload();
