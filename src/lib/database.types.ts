export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'requirement_confirmed'
  | 'quotation_sent'
  | 'follow_up'
  | 'confirmed'
  | 'completed'
  | 'lost'
  | 'cancelled';

export interface Database {
  public: {
    Tables: {
      portfolio_projects: {
        Row: {
          id: string;
          title: string;
          slug: string;
          category: string;
          cover_image: string;
          images: string[];
          video_url: string | null;
          reel_url: string | null;
          description: string;
          date: string;
          location: string;
          featured: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          category: string;
          cover_image: string;
          images?: string[];
          video_url?: string | null;
          reel_url?: string | null;
          description?: string;
          date?: string;
          location?: string;
          featured?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database['public']['Tables']['portfolio_projects']['Insert']>;
      };
      services: {
        Row: {
          id: string;
          title: string;
          category: 'photography' | 'videography' | 'editing';
          description: string;
          icon: string;
          features: string[];
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          category: 'photography' | 'videography' | 'editing';
          description?: string;
          icon?: string;
          features?: string[];
          sort_order?: number;
        };
        Update: Partial<Database['public']['Tables']['services']['Insert']>;
      };
      training_courses: {
        Row: {
          id: string;
          title: string;
          description: string;
          duration: string;
          level: string;
          curriculum: string[];
          tools: string[];
          fee: string;
          mode: string;
          image: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          duration?: string;
          level?: string;
          curriculum?: string[];
          tools?: string[];
          fee?: string;
          mode?: string;
          image?: string;
          sort_order?: number;
        };
        Update: Partial<Database['public']['Tables']['training_courses']['Insert']>;
      };
      testimonials: {
        Row: {
          id: string;
          name: string;
          review: string;
          service: string;
          date: string;
          rating: number;
          approved: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          review: string;
          service?: string;
          date?: string;
          rating?: number;
          approved?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database['public']['Tables']['testimonials']['Insert']>;
      };
      instagram_reels: {
        Row: {
          id: string;
          thumbnail: string;
          url: string;
          title: string;
          featured: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          thumbnail: string;
          url: string;
          title?: string;
          featured?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database['public']['Tables']['instagram_reels']['Insert']>;
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
        };
        Update: Partial<Database['public']['Tables']['leads']['Insert']>;
      };
      lead_notes: {
        Row: {
          id: string;
          lead_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          content: string;
        };
        Update: Partial<Database['public']['Tables']['lead_notes']['Insert']>;
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
