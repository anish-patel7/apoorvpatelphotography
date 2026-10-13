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
}

export interface Service {
  id: string;
  title: string;
  slug?: string;
  category: 'photography' | 'videography' | 'editing';
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
  name: string;
  client_name?: string;
  client_location?: string;
  review: string;
  testimonial?: string;
  service: string;
  date: string;
  rating: number;
  approved?: boolean;
  is_approved?: boolean;
  is_featured?: boolean;
  image_url?: string;
}

export interface InstagramReel {
  id: string;
  thumbnail: string;
  thumbnail_url?: string;
  url: string;
  instagram_url?: string;
  title: string;
  featured: boolean;
  is_featured?: boolean;
  is_published?: boolean;
  status?: 'configured' | 'incomplete';
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
