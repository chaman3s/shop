export interface ProductReview {
  id: number;
  name: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

export interface ProductRecord {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  weight: string;
  stockQuantity: number;
  ingredients: string;
  nutritionalInfo: {
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
  };
  inStock: boolean;
  rating: number;
  reviews: number;
}

export interface SliderRecord {
  id: number;
  url: string;
  title: string;
  subtitle: string;
}

export interface HeroRecord {
  title: string;
  subtitle: string;
  imageUrl: string;
}

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  password: string;
}

export interface AdminRecord {
  id: number;
  name: string;
  email: string;
  password: string;
}

export interface LoginOtpRecord {
  email: string;
  otp: string;
  expiresAt: number;
}

export interface PendingSignupRecord {
  name: string;
  email: string;
  password: string;
  otp: string;
  expiresAt: number;
}

export interface AddressRecord {
  id: string;
  name: string;
  mobile: string;
  pincode: string;
  address: string;
  locality: string;
  city: string;
  state: string;
  addressType: "home" | "work";
}

export interface OrderRecord {
  id: number;
  createdAt: string;
  customerEmail?: string;
  items: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  addressId: number;
  paymentMethod: string;
  total: number;
  status:
    | "pending"
    | "confirmed"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "return_requested"
    | "returned";
  cashfreeOrderId?: string;
  cashfreePaymentLink?: string;
  couponCode?: string; 
  discountAmount?: number;   

}

export const products: ProductRecord[] = [
  {
    id: 1,
    name: "Sea Salt Chips",
    price: 3.5,
    image: "https://picsum.photos/seed/chips/400/300",
    description:
      "Crispy and perfectly salted chips made from premium potatoes. These chips are lightly seasoned with sea salt for the perfect crunch and flavor balance.",
    category: "Chips",
    weight: "150g",
    ingredients: "Potatoes, Sunflower Oil, Sea Salt",
    nutritionalInfo: {
      calories: "150",
      protein: "2g",
      carbs: "15g",
      fat: "9g",
    },
    inStock: true,
    rating: 4.5,
    reviews: 128,
  },
  {
    id: 2,
    name: "Caramel Popcorn",
    price: 4.0,
    image: "https://picsum.photos/seed/popcorn/400/300",
    description:
      "Sweet and crunchy caramel-coated popcorn that melts in your mouth. Perfect for movie nights and snacking any time of the day.",
    category: "Popcorn",
    weight: "200g",
    ingredients: "Popcorn, Caramel, Butter, Brown Sugar, Salt",
    nutritionalInfo: {
      calories: "180",
      protein: "2g",
      carbs: "28g",
      fat: "7g",
    },
    inStock: true,
    rating: 4.7,
    reviews: 95,
  },
  {
    id: 3,
    name: "Nutty Trail Mix",
    price: 5.25,
    image: "https://picsum.photos/seed/trail/400/300",
    description:
      "A healthy blend of premium nuts, dried fruits, and seeds. Perfect for hiking, gym, or as a nutritious snack throughout the day.",
    category: "Trail Mix",
    weight: "250g",
    ingredients:
      "Almonds, Cashews, Raisins, Cranberries, Pumpkin Seeds, Sunflower Seeds",
    nutritionalInfo: {
      calories: "210",
      protein: "6g",
      carbs: "18g",
      fat: "14g",
    },
    inStock: true,
    rating: 4.8,
    reviews: 156,
  },
  {
    id: 4,
    name: "Fruit Gummies",
    price: 2.75,
    image: "https://picsum.photos/seed/gummies/400/300",
    description:
      "Soft and chewy fruit-flavored gummies made with real fruit juice. A delightful treat for kids and adults alike.",
    category: "Candy",
    weight: "100g",
    ingredients: "Fruit Juice, Sugar, Gelatin, Natural Flavors, Citric Acid",
    nutritionalInfo: {
      calories: "120",
      protein: "1g",
      carbs: "28g",
      fat: "0g",
    },
    inStock: true,
    rating: 4.3,
    reviews: 87,
  },
  {
    id: 5,
    name: "Protein Bars",
    price: 3.95,
    image: "https://picsum.photos/seed/bars/400/300",
    description:
      "High-protein energy bars packed with wholesome ingredients. Perfect for post-workout recovery or as a meal replacement.",
    category: "Protein Bar",
    weight: "60g",
    ingredients: "Oats, Whey Protein, Honey, Peanut Butter, Dark Chocolate",
    nutritionalInfo: {
      calories: "220",
      protein: "15g",
      carbs: "22g",
      fat: "8g",
    },
    inStock: true,
    rating: 4.6,
    reviews: 203,
  },
  {
    id: 6,
    name: "Roasted Almonds",
    price: 6.5,
    image: "https://picsum.photos/seed/almonds/400/300",
    description:
      "Premium California almonds, lightly roasted to perfection. Rich in nutrients and perfect for healthy snacking.",
    category: "Nuts",
    weight: "300g",
    ingredients: "Almonds, Sea Salt",
    nutritionalInfo: {
      calories: "170",
      protein: "6g",
      carbs: "6g",
      fat: "15g",
    },
    inStock: true,
    rating: 4.9,
    reviews: 241,
  },
];

export const sliders: SliderRecord[] = [
  {
    id: 1,
    url: "https://picsum.photos/seed/slide1/1200/400",
    title: "Premium Organic Snacks",
    subtitle: "Sourced from the finest ingredients",
  },
  {
    id: 2,
    url: "https://picsum.photos/seed/slide2/1200/400",
    title: "Free Shipping on Orders Rs 25+",
    subtitle: "Fast delivery to your doorstep",
  },
  {
    id: 3,
    url: "https://picsum.photos/seed/slide3/1200/400",
    title: "New Flavors Every Month",
    subtitle: "Discover exciting taste combinations",
  },
];

export const hero: HeroRecord = {
  title: "Healthy snacks, delivered fast.",
  subtitle:
    "Browse curated snacks made from real ingredients. Small-batch, sustainably sourced, and crowd-approved.",
  imageUrl: "https://picsum.photos/seed/hero/800/600",
};

export const reviewsByProductId: Record<number, ProductReview[]> = {
  1: [
    {
      id: 1,
      name: "Sarah Johnson",
      rating: 5,
      date: "2 weeks ago",
      comment:
        "Absolutely love this product! The quality is exceptional and the taste is incredible. Will definitely buy again!",
      verified: true,
    },
    {
      id: 2,
      name: "Mike Chen",
      rating: 4,
      date: "1 month ago",
      comment:
        "Great snack option. Good packaging and fresh product. Only wish it came in larger sizes.",
      verified: true,
    },
  ],
};

export const users: UserRecord[] = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    password: "password123",
  },
];

export const admins: AdminRecord[] = [
  {
    id: 1,
    name: "Super Admin",
    email: "chamanggarwal@gmail.com",
    password: "admin123",
  },
];

export const loginOtps: LoginOtpRecord[] = [];
export const pendingSignups: PendingSignupRecord[] = [];

export const addresses: AddressRecord[] = [
  {
    id: 1,
    name: "John Doe",
    mobile: "9876543210",
    pincode: "400001",
    address: "123 Main Street",
    locality: "Colaba",
    city: "Mumbai",
    state: "Maharashtra",
    addressType: "home",
  },
];

export const orders: OrderRecord[] = [];

export type DiscountType = "percentage" | "flat";
export type OfferType = "coupon" | "offer";

export interface CouponRecord {
  id: string;
  type: OfferType;
  code: string;          // unique, uppercase
  title: string;
  description: string;
  discountType: DiscountType;
  discountValue: number; // % or ₹ amount
  minOrder: number;      // minimum cart total required (0 = no minimum)
  maxUses: number;       // max redemptions (0 = unlimited)
  usedCount: number;     // how many times redeemed so far
  expiresAt: string;     // ISO date string "YYYY-MM-DD"
  active: boolean;
  createdAt: string;     // ISO datetime
}