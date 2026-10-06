export type Category = 
  | 'TEXTBOOKS'
  | 'ELECTRONICS'
  | 'FURNITURE'
  | 'TICKETS'
  | 'CLOTHING'
  | 'OTHER';

export type ListingStatus = 
  | 'ACTIVE'
  | 'PENDING'
  | 'SOLD'
  | 'DELETED';

export interface User {
  id: number;
  email: string;
  realName: string;
  preferredName?: string;
  avatarUrl?: string;
  phone?: string;
  academicYear?: string;
  branch?: string;
  onboardingCompleted: boolean;
  role: 'STUDENT' | 'ADMIN';
  createdAt: string;
}

export interface ListingImage {
  id: number;
  imageUrl: string;
  cloudinaryPublicId?: string;
}

export interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  itemCondition: string;
  category: Category;
  seller: User;
  status: ListingStatus;
  images: ListingImage[];
  createdAt: string;
}

export const APP_NAME = "CampusCart";

export interface ChatSession {
  id: number;
  listing: Listing;
  buyer: User;
  seller: User;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: number;
  session: ChatSession;
  sender: User;
  content: string;
  timestamp: string;
}
