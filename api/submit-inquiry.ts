import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  // 1. Enforce POST method
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  // 2. Body size limit safeguard (< 50KB)
  const contentLength = req.headers['content-length'];
  if (contentLength && parseInt(contentLength, 10) > 50000) {
    return res.status(413).json({ success: false, error: 'Payload exceeds size limit.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    // 3. Anti-spam honeypot detection
    if (body.website_source_hp || body.hp || body.fax) {
      // Return 400 without revealing details to bot
      return res.status(400).json({ success: false, error: 'Invalid submission request.' });
    }

    // 4. Extract and sanitize fields
    const name = (body.name || body.customer_name || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const phone = (body.phone || body.mobile || '').trim();
    const whatsapp = (body.whatsapp || '').trim();
    const eventType = (body.eventType || body.event_type || 'General').trim();
    const eventDate = body.eventDate || body.event_date || null;
    const location = (body.location || body.event_location || '').trim();
    const budget = (body.budget || '').trim();
    const message = (body.message || '').trim();
    // Only two known sources are accepted; anything else is stored as a normal website enquiry.
    const source = body.source === 'training' ? 'training' : 'website';

    // 5. Server-side validation
    if (!name || name.length < 2 || name.length > 100) {
      return res.status(400).json({ success: false, error: 'Full name is required (between 2 and 100 characters).' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email) || email.length > 150) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (!phone || phoneDigits.length < 7 || phoneDigits.length > 20) {
      return res.status(400).json({ success: false, error: 'A valid phone number with 7-20 digits is required.' });
    }

    if (!message || message.length < 5 || message.length > 4000) {
      return res.status(400).json({ success: false, error: 'Inquiry details / message is required (between 5 and 4000 characters).' });
    }

    if (eventDate) {
      const selected = new Date(eventDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(selected.getTime())) {
        return res.status(400).json({ success: false, error: 'Invalid event date provided.' });
      }
      if (selected < today) {
        return res.status(400).json({ success: false, error: 'Event date cannot be in the past.' });
      }
    }

    // 6. Connect to Supabase with server-side credentials
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project')) {
      return res.status(503).json({
        success: false,
        error: 'Our enquiry service is temporarily unavailable. Please contact us directly via WhatsApp.',
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 7. Persistent Rate Limiting & Stored Procedure Execution
    // Try executing the database-level stored procedure with transactional rate limiting
    const { data: rpcData, error: rpcError } = await supabase.rpc('submit_customer_inquiry', {
      p_customer_name: name,
      p_email: email,
      p_phone: phone,
      p_whatsapp: whatsapp || phone,
      p_event_type: eventType,
      p_event_date: eventDate || null,
      p_event_location: location || null,
      p_budget: budget || null,
      p_message: message,
      p_source: source,
    });

    if (!rpcError && rpcData) {
      if (rpcData.success) {
        return res.status(200).json({ success: true, id: rpcData.id });
      } else {
        return res.status(429).json({ success: false, error: rpcData.error });
      }
    }

    // Fallback: Persistent duplicate check in PostgreSQL inquiries table
    const { data: recentDuplicate } = await supabase
      .from('inquiries')
      .select('id')
      .eq('email', email)
      .eq('message', message)
      .gte('created_at', new Date(Date.now() - 60 * 1000).toISOString())
      .limit(1);

    if (recentDuplicate && recentDuplicate.length > 0) {
      return res.status(429).json({
        success: false,
        error: 'A duplicate inquiry was recently received. Please allow a minute before submitting again.',
      });
    }

    // Persistent hourly rate limiting: Max 5 submissions per email per hour
    const { count: hourlyCount } = await supabase
      .from('inquiries')
      .select('id', { count: 'exact', head: true })
      .eq('email', email)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    if (typeof hourlyCount === 'number' && hourlyCount >= 5) {
      return res.status(429).json({
        success: false,
        error: 'Submission rate limit reached for this email. Please contact our studio directly via WhatsApp.',
      });
    }

    // Direct insert into PostgreSQL inquiries table
    const { error: insertError } = await supabase
      .from('inquiries')
      .insert([
        {
          customer_name: name,
          email: email,
          phone: phone,
          whatsapp: whatsapp || phone,
          event_type: eventType,
          event_date: eventDate || null,
          event_location: location || null,
          budget: budget || null,
          message: message,
          inquiry_status: 'new',
          source,
        },
      ]);

    if (insertError) {
      console.error('[Inquiries API] Insert error:', insertError.message);
      return res.status(500).json({
        success: false,
        error: 'Unable to record your inquiry. Please try again or reach out via WhatsApp.',
      });
    }

    return res.status(200).json({
      success: true,
      id: `APP-${Date.now().toString().slice(-6)}`,
    });
  } catch {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while processing your inquiry.',
    });
  }
}
