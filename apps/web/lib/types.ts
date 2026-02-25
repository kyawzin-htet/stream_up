export type MembershipType = 'FREE' | 'PREMIUM';
export type MembershipUpgradeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type User = {
  id: string;
  email: string;
  telegramUserId: string | null;
  membershipType: MembershipType;
  membershipExpiresAt: string | null;
  isAdmin: boolean;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

export type Video = {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  category: Category;
  categoryId: string;
  isPremium: boolean;
  hasGif: boolean;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
};

export type CommentUser = {
  id: string;
  email: string;
};

export type Comment = {
  id: string;
  body: string;
  createdAt: string;
  videoId: string;
  userId: string;
  parentId?: string | null;
  user: CommentUser;
  replies?: Comment[];
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type Member = {
  id: string;
  email: string;
  telegramUserId: string | null;
  membershipType: MembershipType;
  membershipExpiresAt: string | null;
  createdAt: string;
};

export type PricingPlan = {
  id: string;
  code: string;
  name: string;
  durationMonths: number | null;
  amount: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PricingPlansResponse = {
  currency: string;
  plans: PricingPlan[];
};

export type MembershipUpgradeRequest = {
  id: string;
  userId: string;
  planId: string;
  status: MembershipUpgradeStatus;
  note: string | null;
  amountSnapshot: string;
  currencySnapshot: string;
  planNameSnapshot: string;
  durationMonthsSnapshot: number | null;
  paymentSlipFileId: string;
  paymentSlipMessageId: string;
  paymentSlipChannelId: string;
  reviewedById: string | null;
  reviewedAt: string | null;
  createdAt: string;
  user?: User;
  plan?: PricingPlan;
};
