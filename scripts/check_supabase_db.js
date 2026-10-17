import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wwvjqonaonfluvugtpxl.supabase.co';
const supabaseKey = 'sb_publishable_1eibi8KmCaKoyQ5F_d_dvQ_CwlORkGE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  const { data: projects, error: projErr } = await supabase.from('portfolio_projects').select('id, slug, title, category, is_published, display_order');
  console.log('Projects in DB:', projErr ? projErr.message : projects);

  const { data: images, error: imgErr } = await supabase.from('portfolio_images').select('id, project_id, image_url, display_order');
  console.log('Images in DB count:', imgErr ? imgErr.message : (images ? images.length : 0));
}

checkDb();
