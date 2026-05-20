import clientPromise from "./mongodb";
import { ObjectId, Document } from "mongodb";
import {
  ProductRecord,
  UserRecord,
  AdminRecord,
  OrderRecord,
  AddressRecord,
  SliderRecord,
  HeroRecord,
  LoginOtpRecord,
  PendingSignupRecord,
  ProductReview,
} from "./mockDb";

const DB_NAME = "munch";

async function getCollection<T extends Document>(
  collectionName: string
) {
  const client = await clientPromise;
  return client.db(DB_NAME).collection<T>(collectionName);
}

function buildObjectIdQuery(id: string): { _id: ObjectId | string } {
  try {
    return { _id: new ObjectId(id) };
  } catch {
    return { _id: id };
  }
}

export async function getAllProducts(): Promise<ProductRecord[]> {
  const productsCollection = await getCollection<ProductRecord>("products");
  const products = await productsCollection.find({}).toArray();
  return products.map((product) => {
    const { _id, ...rest } = product as any;
    return {
      ...rest,
      id: rest.id ?? _id?.toString?.(),
    } as ProductRecord;
  });
}

export async function addProduct(input: {
  name: string;
  price: number;
  image: string;
  description?: string;
  category?: string;
  weight?: string;
}) {
  const name = input.name.trim();
  const image = input.image.trim();
  if (!name || !image || Number.isNaN(input.price) || input.price <= 0) {
    return { error: "Name, valid price and image are required." };
  }

  const productsCollection = await getCollection<ProductRecord>("products");
 const product: Omit<ProductRecord, "id"> & {
  _id?: any;
} = {
  name,
  price: input.price,
  image,

  description:
    input.description?.trim() ||
    "No description added yet.",

  category:
    input.category?.trim() || "General",

  weight:
    input.weight?.trim() || "N/A",

  ingredients: "Not specified",

  nutritionalInfo: {
    calories: "N/A",
    protein: "N/A",
    carbs: "N/A",
    fat: "N/A",
  },

  inStock: true,

  stockQuantity: 100,

  rating: 4.0,

  reviews: 0,
};

  const result = await productsCollection.insertOne(product as any);
  product._id = result.insertedId;

  const insertedProduct = { ...product, id: result.insertedId.toString() };
  delete insertedProduct._id;

  return { product: insertedProduct as any };
}

export async function getProductById(
  id: string,
): Promise<ProductRecord | null> {
  const productsCollection = await getCollection<ProductRecord>("products");
  let query: any = { _id: id as any };
  try {
    query = { _id: new ObjectId(id) };
  } catch {
    query = { _id: id as any };
  }

  const product = await productsCollection.findOne(query);
  if (!product) {
    return null;
  }
  const { _id, ...rest } = product as any;
  return { ...rest, id: rest.id ?? _id.toString() };
}

export async function deleteProductById(id: string) {
  const productsCollection = await getCollection<ProductRecord>("products");
  let query: any = { _id: id as any };
  try {
    query = { _id: new ObjectId(id) };
  } catch {
    query = { _id: id as any };
  }

  const result = await productsCollection.deleteOne(query);
  if (result.deletedCount === 0) {
    return { error: "Product not found." };
  }
  return { product: { id } };
}

export async function getProductDetails(id: string) {
  const product = await getProductById(id);
  if (!product) {
    return null;
  }

  // TODO: Implement fetching related products and reviews from MongoDB
  const relatedProducts: ProductRecord[] = [];
  const customerReviews: ProductReview[] = [];

  return {
    product,
    relatedProducts,
    customerReviews,
  };
}

export async function login(email: string, password: string) {
  const usersCollection = await getCollection<UserRecord>("users");
  const normalizedEmail = email.trim().toLowerCase();
  const user = await usersCollection.findOne({
    email: normalizedEmail,
    password,
  });
  return user ?? null;
}

export async function startLoginWithOtp(email: string, password: string) {
  const user = await login(email, password);
  if (!user) {
    return { error: "Invalid email or password." };
  }

  const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
  const expiresAt = Date.now() + 5 * 60 * 1000;
  const normalizedEmail = user.email.toLowerCase();

  const loginOtpsCollection = await getCollection<LoginOtpRecord>("loginOtps");
  await loginOtpsCollection.updateOne(
    { email: normalizedEmail },
    { $set: { otp, expiresAt } },
    { upsert: true },
  );

  return {
    email: normalizedEmail,
    // Mock email sending; replace with real mail provider integration.
    otp,
  };
}

export async function verifyLoginOtp(email: string, otp: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const usersCollection = await getCollection<UserRecord>("users");
  const user = await usersCollection.findOne({ email: normalizedEmail });
  if (!user) {
    return { error: "Account not found." };
  }

  const loginOtpsCollection = await getCollection<LoginOtpRecord>("loginOtps");
  const otpRecord = await loginOtpsCollection.findOne({
    email: normalizedEmail,
  });
  if (!otpRecord) {
    return { error: "OTP not requested. Please sign in again." };
  }

  if (Date.now() > otpRecord.expiresAt) {
    return { error: "OTP expired. Please request a new one." };
  }

  if (otpRecord.otp !== otp.trim()) {
    return { error: "Invalid OTP." };
  }

  await loginOtpsCollection.deleteOne({ email: normalizedEmail });

  return {
    user: { id: user._id.toString(), name: user.name, email: user.email },
    token: `mock-token-${user._id.toString()}`,
  };
}

export async function signup(name: string, email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const usersCollection = await getCollection<UserRecord>("users");
  const exists = await usersCollection.findOne({ email: normalizedEmail });
  if (exists) {
    return { error: "An account with this email already exists." };
  }

  const result = await usersCollection.insertOne({
    name: name.trim(),
    email: normalizedEmail,
    password,
  } as any);

  return {
    user: {
      id: result.insertedId.toString(),
      name: name.trim(),
      email: normalizedEmail,
    },
  };
}

export async function startSignupWithOtp(
  name: string,
  email: string,
  password: string,
) {
  const normalizedEmail = email.trim().toLowerCase();
  const usersCollection = await getCollection<UserRecord>("users");
  const exists = await usersCollection.findOne({ email: normalizedEmail });
  if (exists) {
    return { error: "An account with this email already exists." };
  }

  const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
  const expiresAt = Date.now() + 5 * 60 * 1000;

  const pendingSignupsCollection = await getCollection<PendingSignupRecord>(
    "pendingSignups",
  );
  await pendingSignupsCollection.updateOne(
    { email: normalizedEmail },
    {
      $set: {
        name: name.trim(),
        password,
        otp,
        expiresAt,
      },
    },
    { upsert: true },
  );

  return {
    email: normalizedEmail,
    otp,
  };
}

export async function verifySignupOtp(email: string, otp: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const pendingSignupsCollection = await getCollection<PendingSignupRecord>(
    "pendingSignups",
  );
  const pending = await pendingSignupsCollection.findOne({
    email: normalizedEmail,
  });
  if (!pending) {
    return { error: "Signup OTP not requested. Please create account again." };
  }

  if (Date.now() > pending.expiresAt) {
    return { error: "OTP expired. Please request a new one." };
  }

  if (pending.otp !== otp.trim()) {
    return { error: "Invalid OTP." };
  }

  const usersCollection = await getCollection<UserRecord>("users");
  const exists = await usersCollection.findOne({ email: normalizedEmail });
  if (exists) {
    return { error: "An account with this email already exists." };
  }

  const result = await usersCollection.insertOne({
    name: pending.name,
    email: pending.email,
    password: pending.password,
  } as any);

  await pendingSignupsCollection.deleteOne({ email: normalizedEmail });

  return {
    user: {
      id: result.insertedId.toString(),
      name: pending.name,
      email: pending.email,
    },
    token: `mock-token-${result.insertedId.toString()}`,
  };
}

export async function forgotPassword(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const usersCollection = await getCollection<UserRecord>("users");
  const userExists = await usersCollection.findOne({ email: normalizedEmail });

  return {
    success: true,
    userExists: !!userExists,
  };
}

export async function adminLogin(email: string, password: string) {
  const adminsCollection = await getCollection<AdminRecord>("admins");
  const admin = await adminsCollection.findOne({
    email: email.trim().toLowerCase(),
    password,
  });
  if (!admin) {
    return { error: "Invalid admin credentials." };
  }

  return {
    admin: {
      name: admin.name,
      email: admin.email,
      role: "admin",
    },
    token: "mock-admin-token",
  };
}

export async function createAdmin(name: string, email: string, password: string) {
  const trimmedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedPassword = password.trim();

  if (!trimmedName || !normalizedEmail || !trimmedPassword) {
    return { error: "Name, email, and password are required." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return { error: "Please provide a valid email address." };
  }

  if (trimmedPassword.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const adminsCollection = await getCollection<AdminRecord>("admins");
  const exists = await adminsCollection.findOne({ email: normalizedEmail });
  if (exists) {
    return { error: "Admin with this email already exists." };
  }

  const result = await adminsCollection.insertOne({
    name: trimmedName,
    email: normalizedEmail,
    password: trimmedPassword,
  } as any);

  return {
    admin: {
      id: result.insertedId.toString(),
      name: trimmedName,
      email: normalizedEmail,
    },
  };
}

export async function getAddresses(): Promise<AddressRecord[]> {
  const addressesCollection = await getCollection<AddressRecord>("addresses");
  const addresses = await addressesCollection.find({}).toArray();
  return addresses.map((address) => {
    const { _id, ...rest } = address as any;
    return { ...rest, id: rest.id ?? _id?.toString?.() } as AddressRecord;
  });
}

export async function addAddress(
  address: Omit<AddressRecord, "id">,
): Promise<AddressRecord> {
  const addressesCollection = await getCollection<AddressRecord>("addresses");
  const result = await addressesCollection.insertOne(address as any);
  return { ...address, id: result.insertedId.toString() };
}

export async function createOrder(
  input: Omit<OrderRecord, "id" | "createdAt" | "status">,
): Promise<OrderRecord> {
  const ordersCollection = await getCollection<OrderRecord>("orders");
  const order = {
    ...input,
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  const result = await ordersCollection.insertOne(order as any);
  return { ...order, id: result.insertedId.toString() };
}

export async function getAllOrders() {
  const ordersCollection = await getCollection<OrderRecord>("orders");
  const addressesCollection = await getCollection<AddressRecord>("addresses");

  const orders = await ordersCollection
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  const ordersWithAddresses = await Promise.all(
    orders.map(async (order) => {
      const address = await addressesCollection.findOne({
        _id: order.addressId as any,
      });
      return {
        ...order,
        id: (order as any)._id.toString(),
        address: address
          ? { ...address, id: (address as any)._id.toString() }
          : null,
      };
    }),
  );

  return ordersWithAddresses;
}

export async function getOrdersByCustomerEmail(customerEmail: string) {
  const normalizedEmail = customerEmail.trim().toLowerCase();
  if (!normalizedEmail) {
    return [];
  }

  const ordersCollection = await getCollection<OrderRecord>("orders");
  const addressesCollection = await getCollection<AddressRecord>("addresses");

  const orders = await ordersCollection
    .find({ customerEmail: normalizedEmail })
    .sort({ createdAt: -1 })
    .toArray();

  const ordersWithAddresses = await Promise.all(
    orders.map(async (order) => {
      const address = await addressesCollection.findOne({
        _id: order.addressId as any,
      });
      return {
        ...order,
        id: (order as any)._id.toString(),
        address: address
          ? { ...address, id: (address as any)._id.toString() }
          : null,
      };
    }),
  );

  return ordersWithAddresses;
}

export async function cancelOrder(orderId: string, customerEmail: string) {
  const normalizedEmail = customerEmail.trim().toLowerCase();
  if (!normalizedEmail) {
    return { error: "Email is required." };
  }

  const ordersCollection = await getCollection<OrderRecord>("orders");
  const query = buildObjectIdQuery(orderId);

  const existing = (await ordersCollection.findOne(query)) as unknown;
  if (!existing) {
    return { error: "Order not found." };
  }

  const existingRecord =
    existing && typeof existing === "object"
      ? (existing as Record<string, unknown>)
      : null;

  const existingEmail = String(existingRecord?.customerEmail ?? "")
    .trim()
    .toLowerCase();
  if (!existingEmail || existingEmail !== normalizedEmail) {
    return { error: "Not allowed to cancel this order." };
  }

  const currentStatus = String(existingRecord?.status ?? "") as OrderRecord["status"];
  if (currentStatus === "delivered") {
    return { error: "Delivered orders cannot be cancelled." };
  }
  if (currentStatus === "cancelled") {
    return { order: { id: orderId, status: "cancelled" as const } };
  }

  const result = await ordersCollection.updateOne(query, { $set: { status: "cancelled" } });
  if (result.matchedCount === 0) {
    return { error: "Order not found." };
  }
  return { order: { id: orderId, status: "cancelled" as const } };
}

export async function requestReturn(orderId: string, customerEmail: string) {
  const normalizedEmail = customerEmail.trim().toLowerCase();
  if (!normalizedEmail) {
    return { error: "Email is required." };
  }

  const ordersCollection = await getCollection<OrderRecord>("orders");
  const query = buildObjectIdQuery(orderId);

  const existing = (await ordersCollection.findOne(query)) as unknown;
  if (!existing) {
    return { error: "Order not found." };
  }

  const existingRecord =
    existing && typeof existing === "object"
      ? (existing as Record<string, unknown>)
      : null;

  const existingEmail = String(existingRecord?.customerEmail ?? "")
    .trim()
    .toLowerCase();
  if (!existingEmail || existingEmail !== normalizedEmail) {
    return { error: "Not allowed to return this order." };
  }

  const currentStatus = String(existingRecord?.status ?? "") as OrderRecord["status"];
  if (currentStatus === "return_requested") {
    return { order: { id: orderId, status: "return_requested" as const } };
  }
  if (currentStatus === "returned") {
    return { order: { id: orderId, status: "returned" as const } };
  }
  if (currentStatus !== "delivered") {
    return { error: "Only delivered orders can be returned." };
  }

  const result = await ordersCollection.updateOne(query, {
    $set: { status: "return_requested" },
  });
  if (result.matchedCount === 0) {
    return { error: "Order not found." };
  }
  return { order: { id: orderId, status: "return_requested" as const } };
}

export async function cancelOrderAdmin(orderId: string) {
  const ordersCollection = await getCollection<OrderRecord>("orders");
  const query = buildObjectIdQuery(orderId);

  const existing = (await ordersCollection.findOne(query)) as unknown;
  if (!existing) {
    return { error: "Order not found." };
  }

  const existingRecord =
    existing && typeof existing === "object"
      ? (existing as Record<string, unknown>)
      : null;

  const currentStatus = String(existingRecord?.status ?? "") as OrderRecord["status"];
  if (currentStatus === "delivered") {
    return { error: "Delivered orders cannot be cancelled." };
  }
  if (currentStatus === "cancelled") {
    return { order: { id: orderId, status: "cancelled" as const } };
  }

  const result = await ordersCollection.updateOne(query, { $set: { status: "cancelled" } });
  if (result.matchedCount === 0) {
    return { error: "Order not found." };
  }
  return { order: { id: orderId, status: "cancelled" as const } };
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderRecord["status"],
) {
  const ordersCollection = await getCollection<OrderRecord>("orders");
  const query = buildObjectIdQuery(orderId);

  const update: Record<string, unknown> = { status };
  if (status === "delivered") {
    update.deliveredAt = new Date().toISOString();
  }

  const result = await ordersCollection.updateOne(query, { $set: update });
  if (result.matchedCount === 0) {
    return { error: "Order not found." };
  }
  return { order: { id: orderId, status } };
}

export async function getSliders(): Promise<SliderRecord[]> {
  const slidersCollection = await getCollection<SliderRecord>("sliders");
  return slidersCollection.find({}).toArray();
}

export async function replaceSliders(input: SliderRecord[]) {
  if (input.length === 0) {
    return { error: "At least one slider is required." };
  }

  const normalized = input.map((item) => ({
    url: item.url.trim(),
    title: item.title.trim(),
    subtitle: item.subtitle.trim(),
  }));

  const invalid = normalized.some(
    (item) => !item.url || !item.title || !item.subtitle,
  );
  if (invalid) {
    return { error: "Each slider needs image URL, title and subtitle." };
  }

  const slidersCollection = await getCollection<SliderRecord>("sliders");
  await slidersCollection.deleteMany({});
  const result = await slidersCollection.insertMany(normalized as any[]);
  const insertedIds = Object.values(result.insertedIds);
  const sliders = normalized.map((slider, i) => ({
    ...slider,
    id: insertedIds[i].toString(),
  }));

  return { sliders };
}

export async function getHero(): Promise<HeroRecord | null> {
  const heroCollection = await getCollection<HeroRecord>("hero");
  return heroCollection.findOne({});
}

export async function updateHero(input: HeroRecord) {
  const title = input.title.trim();
  const subtitle = input.subtitle.trim();
  const imageUrl = input.imageUrl.trim();

  if (!title || !subtitle || !imageUrl) {
    return { error: "Title, subtitle and image URL are required." };
  }

  const heroCollection = await getCollection<HeroRecord>("hero");
  await heroCollection.updateOne(
    {},
    { $set: { title, subtitle, imageUrl } },
    { upsert: true },
  );

  return { hero: { title, subtitle, imageUrl } };
}
// ─────────────────────────────────────────────────────────────────────────────
// ADD these functions to your existing lib/db.ts
// They use the same clientPromise + getCollection pattern you already have.
// ─────────────────────────────────────────────────────────────────────────────

import { CouponRecord } from "./mockDb"; // add CouponRecord to your mockDb exports

// ── helpers ───────────────────────────────────────────────────────────────────

function isExpired(expiresAt: string) {
  return new Date(expiresAt) < new Date();
}

// ── READ ──────────────────────────────────────────────────────────────────────

export async function getAllCoupons(): Promise<CouponRecord[]> {
  const col = await getCollection<CouponRecord>("coupons");
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map((d) => {
    const { _id, ...rest } = d as any;
    return { ...rest, id: rest.id ?? _id?.toString() } as CouponRecord;
  });
}

export async function getCouponById(id: string): Promise<CouponRecord | null> {
  const col = await getCollection<CouponRecord>("coupons");
  const query = buildObjectIdQuery(id);
  const doc = await col.findOne(query);
  if (!doc) return null;
  const { _id, ...rest } = doc as any;
  return { ...rest, id: rest.id ?? _id?.toString() } as CouponRecord;
}

export async function getCouponByCode(
  code: string,
): Promise<CouponRecord | null> {
  const col = await getCollection<CouponRecord>("coupons");
  const doc = await col.findOne({ code: code.trim().toUpperCase() });
  if (!doc) return null;
  const { _id, ...rest } = doc as any;
  return { ...rest, id: rest.id ?? _id?.toString() } as CouponRecord;
}

// ── CREATE ────────────────────────────────────────────────────────────────────

export async function createCoupon(
  input: Omit<CouponRecord, "id" | "usedCount" | "createdAt">,
): Promise<{ coupon?: CouponRecord; error?: string }> {
  const code = input.code.trim().toUpperCase().replace(/\s+/g, "");
  if (!code || !input.title.trim() || !input.expiresAt) {
    return { error: "Code, title and expiry date are required." };
  }
  if (input.discountValue <= 0) {
    return { error: "Discount value must be greater than 0." };
  }
  if (input.discountType === "percentage" && input.discountValue > 100) {
    return { error: "Percentage discount cannot exceed 100." };
  }

  const col = await getCollection<CouponRecord>("coupons");

  // enforce unique code
  const existing = await col.findOne({ code });
  if (existing) return { error: "A coupon with this code already exists." };

  const doc: Omit<CouponRecord, "id"> = {
    ...input,
    code,
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    minOrder: Math.max(0, input.minOrder ?? 0),
    maxUses: Math.max(0, input.maxUses ?? 0),
    usedCount: 0,
    createdAt: new Date().toISOString(),
  };

  const result = await col.insertOne(doc as any);
  return {
    coupon: { ...doc, id: result.insertedId.toString() } as CouponRecord,
  };
}

// ── UPDATE ────────────────────────────────────────────────────────────────────

export async function updateCoupon(
  id: string,
  input: Partial<Omit<CouponRecord, "id" | "usedCount" | "createdAt">>,
): Promise<{ coupon?: CouponRecord; error?: string }> {
  const col = await getCollection<CouponRecord>("coupons");
  const query = buildObjectIdQuery(id);

  const existing = await col.findOne(query);
  if (!existing) return { error: "Coupon not found." };

  const patch: Partial<CouponRecord> = {};

  if (input.code !== undefined) {
    const code = input.code.trim().toUpperCase().replace(/\s+/g, "");
    // check uniqueness only if code changed
    if (code !== (existing as any).code) {
      const clash = await col.findOne({ code });
      if (clash) return { error: "A coupon with this code already exists." };
    }
    patch.code = code;
  }
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.description !== undefined) patch.description = input.description.trim();
  if (input.type !== undefined) patch.type = input.type;
  if (input.discountType !== undefined) patch.discountType = input.discountType;
  if (input.discountValue !== undefined) {
    if (input.discountValue <= 0)
      return { error: "Discount value must be greater than 0." };
    patch.discountValue = input.discountValue;
  }
  if (input.minOrder !== undefined) patch.minOrder = Math.max(0, input.minOrder);
  if (input.maxUses !== undefined) patch.maxUses = Math.max(0, input.maxUses);
  if (input.expiresAt !== undefined) patch.expiresAt = input.expiresAt;
  if (input.active !== undefined) patch.active = input.active;

  await col.updateOne(query, { $set: patch });

  const updated = await col.findOne(query);
  const { _id, ...rest } = updated as any;
  return { coupon: { ...rest, id: rest.id ?? _id?.toString() } as CouponRecord };
}

// ── TOGGLE active ─────────────────────────────────────────────────────────────

export async function toggleCouponActive(
  id: string,
): Promise<{ coupon?: CouponRecord; error?: string }> {
  const col = await getCollection<CouponRecord>("coupons");
  const query = buildObjectIdQuery(id);

  const existing = await col.findOne(query);
  if (!existing) return { error: "Coupon not found." };

  const newActive = !(existing as any).active;
  await col.updateOne(query, { $set: { active: newActive } });

  const { _id, ...rest } = existing as any;
  return {
    coupon: {
      ...rest,
      id: rest.id ?? _id?.toString(),
      active: newActive,
    } as CouponRecord,
  };
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function deleteCoupon(
  id: string,
): Promise<{ id?: string; error?: string }> {
  const col = await getCollection<CouponRecord>("coupons");
  const query = buildObjectIdQuery(id);
  const result = await col.deleteOne(query);
  if (result.deletedCount === 0) return { error: "Coupon not found." };
  return { id };
}

// ── APPLY (validate at checkout) ──────────────────────────────────────────────

export async function applyCoupon(
  code: string,
  cartTotal: number,
): Promise<{
  valid?: boolean;
  discountAmount?: number;
  coupon?: CouponRecord;
  error?: string;
}> {
  const coupon = await getCouponByCode(code);
  if (!coupon) return { error: "Invalid coupon code." };
  if (!coupon.active) return { error: "This coupon is no longer active." };
  if (isExpired(coupon.expiresAt)) return { error: "This coupon has expired." };
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses)
    return { error: "This coupon has reached its usage limit." };
  if (coupon.minOrder > 0 && cartTotal < coupon.minOrder)
    return {
      error: `Minimum order of ₹${coupon.minOrder} required for this coupon.`,
    };

  const discountAmount =
    coupon.discountType === "percentage"
      ? parseFloat(((cartTotal * coupon.discountValue) / 100).toFixed(2))
      : Math.min(coupon.discountValue, cartTotal); // flat can't exceed cart total

  return { valid: true, discountAmount, coupon };
}

// ── REDEEM (increment usedCount after successful order) ───────────────────────

export async function redeemCoupon(
  code: string,
): Promise<{ ok?: boolean; error?: string }> {
  const col = await getCollection<CouponRecord>("coupons");
  const result = await col.updateOne(
    { code: code.trim().toUpperCase() },
    { $inc: { usedCount: 1 } },
  );
  if (result.matchedCount === 0) return { error: "Coupon not found." };
  return { ok: true };
}