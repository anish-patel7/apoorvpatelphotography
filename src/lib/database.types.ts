export type InquiryStatus =
  | 'new'
  | 'contacted'
  | 'requirement_confirmed'
  | 'quotation_sent'
  | 'follow_up'
  | 'confirmed'
  | 'completed'
  | 'lost'
  | 'cancelled';

export type LeadStatus = InquiryStatus;

export interface Database {
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: 'admin' | 'super_admin';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          email: string;
          role?: 'admin' | 'super_admin';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['admin_profiles']['Insert']>;
      };
      portfolio_projects: {
        Row: {
          id: string;
          slug: string;
          title: string;
          category: string;
          description: string;
          location: string;
          event_date: string;
          cover_image_url: string;
          cover_image?: string;
          instagram_url: string | null;
          video_url: string | null;
          reel_url: string | null;
          content_type: 'post' | 'reel' | 'carousel' | 'photo';
          is_real_work: boolean;
          is_featured: boolean;
          is_published: boolean;
          display_order: number;
          sort_order?: number;
          images?: string[];
          date?: string;
          video_width?: number | null;
          video_height?: number | null;
          aspect_ratio?: number | null;
          orientation?: 'portrait' | 'landscape' | 'square' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          category: string;
          description?: string;
          location?: string;
          event_date?: string;
          cover_image_url: string;
          cover_image?: string;
          instagram_url?: string | null;
          video_url?: string | null;
          reel_url?: string | null;
          content_type?: 'post' | 'reel' | 'carousel' | 'photo';
          is_real_work?: boolean;
          is_featured?: boolean;
          is_published?: boolean;
          display_order?: number;
          sort_order?: number;
          images?: string[];
          date?: string;
          video_width?: number | null;
          video_height?: number | null;
          aspect_ratio?: number | null;
          orientation?: 'portrait' | 'landscape' | 'square' | null;
        };
        Update: Partial<Database['public']['Tables']['portfolio_projects']['Insert']>;
      };
      portfolio_images: {
        Row: {
          id: string;
          project_id: string;
          image_url: string;
          alt_text: string;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          image_url: string;
          alt_text?: string;
          display_order?: number;
        };
        Update: Partial<Database['public']['Tables']['portfolio_images']['Insert']>;
      };
      services: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string;
          category: 'photography' | 'videography' | 'editing' | 'multimedia' | 'design';
          icon: string;
          features: string[];
          price_label: string;
          is_active: boolean;
          display_order: number;
          sort_order?: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description?: string;
          category: 'photography' | 'videography' | 'editing' | 'multimedia' | 'design';
          icon?: string;
          features?: string[];
          price_label?: string;
          is_active?: boolean;
          display_order?: number;
          sort_order?: number;
        };
        Update: Partial<Database['public']['Tables']['services']['Insert']>;
      };
      testimonials: {
        Row: {
          id: string;
          client_name: string;
          client_location: string;
          testimonial: string;
          service: string;
          date: string;
          rating: number;
          image_url: string | null;
          is_featured: boolean;
          is_approved: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_name: string;
          client_location?: string;
          testimonial: string;
          service?: string;
          date?: string;
          rating?: number;
          image_url?: string | null;
          is_featured?: boolean;
          is_approved?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['testimonials']['Insert']>;
      };
      instagram_reels: {
        Row: {
          id: string;
          title: string;
          instagram_url: string;
          thumbnail_url: string;
          content_type: 'post' | 'reel' | 'carousel' | 'photo';
          status: 'configured' | 'incomplete';
          is_featured: boolean;
          display_order: number;
          video_width?: number | null;
          video_height?: number | null;
          aspect_ratio?: number | null;
          orientation?: 'portrait' | 'landscape' | 'square' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title?: string;
          instagram_url: string;
          thumbnail_url: string;
          content_type?: 'post' | 'reel' | 'carousel' | 'photo';
          status?: 'configured' | 'incomplete';
          is_featured?: boolean;
          display_order?: number;
          video_width?: number | null;
          video_height?: number | null;
          aspect_ratio?: number | null;
          orientation?: 'portrait' | 'landscape' | 'square' | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['instagram_reels']['Insert']>;
      };
      inquiries: {
        Row: {
          id: string;
          customer_name: string;
          email: string;
          phone: string;
          whatsapp?: string | null;
          event_type: string | null;
          event_date: string | null;
          event_location: string | null;
          budget: string | null;
          message: string;
          inquiry_status: InquiryStatus;
          notes: string[];
          source: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_name: string;
          email: string;
          phone?: string;
          whatsapp?: string | null;
          event_type?: string | null;
          event_date?: string | null;
          event_location?: string | null;
          budget?: string | null;
          message: string;
          inquiry_status?: InquiryStatus;
          notes?: string[];
          source?: string;
        };
        Update: Partial<Database['public']['Tables']['inquiries']['Insert']>;
      };
      leads: {
        Row: {
          id: string;
          name: string;
          mobile: string;
          whatsapp: string;
          email: string;
          service_type: string;
          event_type: string | null;
          event_date: string | null;
          location: string | null;
          budget: string | null;
          message: string;
          status: LeadStatus;
          source: string;
          notes?: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          mobile?: string;
          whatsapp?: string;
          email?: string;
          service_type?: string;
          event_type?: string | null;
          event_date?: string | null;
          location?: string | null;
          budget?: string | null;
          message?: string;
          status?: LeadStatus;
          source?: string;
          notes?: string[];
        };
        Update: Partial<Database['public']['Tables']['leads']['Insert']>;
      };
      training_courses: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string;
          duration: string;
          level: string;
          curriculum: string[];
          tools: string[];
          price_label: string;
          fee?: string;
          mode: string;
          image_url: string;
          image?: string;
          is_active: boolean;
          display_order: number;
          sort_order?: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description?: string;
          duration?: string;
          level?: string;
          curriculum?: string[];
          tools?: string[];
          price_label?: string;
          fee?: string;
          mode?: string;
          image_url?: string;
          image?: string;
          is_active?: boolean;
          display_order?: number;
          sort_order?: number;
        };
        Update: Partial<Database['public']['Tables']['training_courses']['Insert']>;
      };
      website_settings: {
        Row: {
          id: string;
          business_name: string;
          tagline: string;
          contact_email: string;
          whatsapp_number: string;
          instagram_url: string;
          public_description: string;
          social_links: Record<string, unknown>;
          stats: Record<string, unknown>;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_name?: string;
          tagline?: string;
          contact_email?: string;
          whatsapp_number?: string;
          instagram_url?: string;
          public_description?: string;
          social_links?: Record<string, unknown>;
          stats?: Record<string, unknown>;
        };
        Update: Partial<Database['public']['Tables']['website_settings']['Insert']>;
      };
      site_settings: {
        Row: {
          key: string;
          value: Record<string, unknown>;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Record<string, unknown>;
        };
        Update: {
          value?: Record<string, unknown>;
        };
      };
    };
  };
}
