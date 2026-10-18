export type InstagramContentType = 'photo' | 'carousel' | 'reel' | 'post';
export type InstagramUrl = string;
export type ThumbnailUrl = string;

export interface PortfolioMedia {
  url: string;
  type: 'image' | 'video' | 'instagram';
  thumbnailUrl?: ThumbnailUrl;
  instagramUrl?: InstagramUrl;
}

export interface PortfolioProject {
  id: string;
  title: string;
  category: string;
  coverImage: ThumbnailUrl;
  images: string[];
  videoUrl?: string;
  reelUrl?: string;
  instagramUrl?: InstagramUrl;
  contentType?: InstagramContentType;
  description: string;
  date: string;
  location: string;
  featured: boolean;
  isRealWork?: boolean;
  video_width?: number;
  video_height?: number;
  aspect_ratio?: number;
  orientation?: 'portrait' | 'landscape' | 'square';
}

export interface Service {
  id: string;
  title: string;
  slug?: string;
  category: 'photography' | 'videography' | 'editing' | 'multimedia' | 'design';
  description: string;
  icon: string;
  features: string[];
  price_label?: string;
  is_active?: boolean;
  display_order?: number;
}

export interface TrainingCourse {
  id: string;
  title: string;
  slug?: string;
  description: string;
  duration: string;
  level: string;
  curriculum: string[];
  syllabus?: string[];
  tools: string[];
  fee: string;
  price_label?: string;
  mode: string;
  image: string;
  is_active?: boolean;
  display_order?: number;
}

export interface Testimonial {
  id: string;
  client_name?: string;
  name?: string;
  client_location?: string;
  testimonial?: string;
  review?: string;
  service?: string;
  date?: string;
  rating?: number;
  image_url?: string | null;
  is_approved?: boolean;
  approved?: boolean;
  is_featured?: boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

export type ReelMediaType = 'instagram' | 'video';

export interface InstagramReel {
  id: string;
  thumbnail: string;
  thumbnail_url?: string;
  url: string;
  instagram_url?: string;
  /** Public Supabase Storage URL of an uploaded video (media_type 'video'). */
  video_url?: string;
  media_type?: ReelMediaType;
  title: string;
  featured: boolean;
  is_featured?: boolean;
  is_published?: boolean;
  display_order?: number;
  content_type?: 'post' | 'reel' | 'carousel' | 'photo';
  status?: 'configured' | 'incomplete';
  video_width?: number;
  video_height?: number;
  aspect_ratio?: number;
  orientation?: 'portrait' | 'landscape' | 'square';
  created_at?: string;
  updated_at?: string;
}

export interface Lead {
  id: string;
  name: string;
  mobile: string;
  whatsapp: string;
  email: string;
  serviceType: string;
  eventType?: string;
  eventDate?: string;
  location?: string;
  message: string;
  status: 'new' | 'contacted' | 'confirmed' | 'quotation_sent' | 'follow_up' | 'completed' | 'lost' | 'cancelled';
  source: string;
  createdAt: string;
  notes: string[];
}
