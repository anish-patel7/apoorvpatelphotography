export interface PortfolioProject {
  id: string;
  title: string;
  category: string;
  coverImage: string;
  images: string[];
  videoUrl?: string;
  reelUrl?: string;
  description: string;
  date: string;
  location: string;
  featured: boolean;
}

export interface Service {
  id: string;
  title: string;
  category: 'photography' | 'videography' | 'editing';
  description: string;
  icon: string;
  features: string[];
}

export interface TrainingCourse {
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
}

export interface Testimonial {
  id: string;
  name: string;
  review: string;
  service: string;
  date: string;
  rating: number;
}

export interface InstagramReel {
  id: string;
  thumbnail: string;
  url: string;
  title: string;
  featured: boolean;
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
