import * as db from "./db";
import { createCashfreeOrder, verifyCashfreeOrder } from "./cashfree";
import {
  AddressRecord,
  HeroRecord,
  OrderRecord,
  ProductRecord,
  SliderRecord,
  products as mockProducts,
  sliders as mockSliders,
  hero as mockHero,
  reviewsByProductId,
} from "./mockDb";

export async function getAllProducts(): Promise<ProductRecord[]> {
  return mockProducts;
}

export async function addProduct(input: {
  name: string;
  price: number;
  image: string;
  description?: string;
  category?: string;
  weight?: string;
  stockQuantity?: number;
}) {
  const name = input.name.trim();
  const image = input.image.trim();
  if (!name || !image || Number.isNaN(input.price) || input.price <= 0) {
    return { error: "Name, valid price and image are required." };
  }

  const stockQuantity =
    typeof input.stockQuantity === "number" && Number.isFinite(input.stockQuantity)
      ? Math.max(0, Math.floor(input.stockQuantity))
      : 0;

  const nextId = mockProducts.reduce((maxId, product) => Math.max(maxId, product.id), 0) + 1;
  const product: ProductRecord = {
    id: nextId,
    name,
    price: input.price,
    image,
    description: input.description?.trim() || "No description added yet.",
    category: input.category?.trim() || "General",
    weight: input.weight?.trim() || "N/A",
    stockQuantity,
    ingredients: "Not specified",
    nutritionalInfo: {
      calories: "N/A",
      protein: "N/A",
      carbs: "N/A",
      fat: "N/A",
    },
    inStock: stockQuantity > 0,
    rating: 4.0,
    reviews: 0,
  };

  mockProducts.push(product);
  return { product };
}

export async function getProductById(
  id: string | number,
): Promise<ProductRecord | null> {
  const productId = typeof id === "string" ? Number.parseInt(id, 10) : id;
  if (Number.isNaN(productId)) {
    return null;
  }
  return mockProducts.find((product) => product.id === productId) ?? null;
}

export async function deleteProductById(id: string | number) {
  const productId = typeof id === "string" ? Number.parseInt(id, 10) : id;
  if (Number.isNaN(productId)) {
    return { error: "Product not found." };
  }
  const index = mockProducts.findIndex((product) => product.id === productId);
  if (index === -1) {
    return { error: "Product not found." };
  }
  mockProducts.splice(index, 1);
  return { product: { id: productId } };
}

export async function updateProductStock(
  id: string | number,
  input: { inStock?: boolean; stockQuantity?: number },
) {
  const productId = typeof id === "string" ? Number.parseInt(id, 10) : id;
  if (Number.isNaN(productId)) {
    return { error: "Product not found." };
  }
  const product = mockProducts.find((p) => p.id === productId);
  if (!product) {
    return { error: "Product not found." };
  }

  if (typeof input.stockQuantity === "number" && Number.isFinite(input.stockQuantity)) {
    product.stockQuantity = Math.max(0, Math.floor(input.stockQuantity));
  }

  if (typeof input.inStock === "boolean") {
    product.inStock = input.inStock;
  } else {
    product.inStock = product.stockQuantity > 0;
  }

  return { product };
}

export async function getProductDetails(id: string | number) {
  const product = await getProductById(id);
  if (!product) {
    return null;
  }

  const productId = product.id;
  const relatedProducts = mockProducts.filter((item) => item.id !== productId);
  const customerReviews = reviewsByProductId[productId] ?? [];

  return {
    product,
    relatedProducts,
    customerReviews,
  };
}

export async function login(email: string, password: string) {
  return db.login(email, password);
}

export async function startLoginWithOtp(email: string, password: string) {
  return db.startLoginWithOtp(email, password);
}

export async function verifyLoginOtp(email: string, otp: string) {
  return db.verifyLoginOtp(email, otp);
}

export async function signup(name: string, email: string, password: string) {
  return db.signup(name, email, password);
}

export async function startSignupWithOtp(
  name: string,
  email: string,
  password: string,
) {
  return db.startSignupWithOtp(name, email, password);
}

export async function verifySignupOtp(email: string, otp: string) {
  return db.verifySignupOtp(email, otp);
}

export async function forgotPassword(email: string) {
  return db.forgotPassword(email);
}

export async function adminLogin(email: string, password: string) {
  return db.adminLogin(email, password);
}

export async function createAdmin(name: string, email: string, password: string) {
  return db.createAdmin(name, email, password);
}

export async function getAddresses(): Promise<AddressRecord[]> {
  return db.getAddresses();
}

export async function addAddress(
  address: Omit<AddressRecord, "id">,
): Promise<AddressRecord> {
  return db.addAddress(address);
}

export async function createOrder(
  input: Omit<OrderRecord, "id" | "createdAt" | "status">,
): Promise<OrderRecord> {
  return db.createOrder(input);
}

export async function createCashfreePayment(
  input: Omit<OrderRecord, "id" | "createdAt" | "status"> & {
    customerEmail: string;
    customerPhone?: string;
    couponCode?: string;      // ← NEW optional field

  },
) {
  const { customerEmail, customerPhone,couponCode, ...orderPayload } = input;
  const normalizedEmail = customerEmail.trim().toLowerCase();
  let discountAmount = 0;
    if (couponCode) {
          const couponResult = await db.applyCoupon(couponCode, orderPayload.total);
              if (couponResult.error) {
      return { error: couponResult.error };  // bubble up to client
    }
    discountAmount = couponResult.discountAmount ?? 0;
    orderPayload.total = parseFloat((orderPayload.total - discountAmount).toFixed(2));
  }

  const order = await db.createOrder({
    ...orderPayload,
    customerEmail: normalizedEmail,
    couponCode: couponCode?.toUpperCase(),
    discountAmount,

  });
    if (couponCode) {
          await db.redeemCoupon(couponCode);
  }

  const returnUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  const cashfreeOrder = await createCashfreeOrder({
    orderId: String(order.id),
    orderAmount: order.total.toFixed(2),
    orderCurrency: "INR",
    customerEmail: normalizedEmail,
    customerPhone,
    returnUrl: `${returnUrl}/payment/status?orderId=${String(order.id)}`,
  });

  return {
    order,
    paymentLink: cashfreeOrder.paymentLink,
    paymentSessionId: cashfreeOrder.paymentSessionId,
    cashfreeRaw: cashfreeOrder.rawBody,
  };
}

export async function getAllOrders() {
  return db.getAllOrders();
}

export async function getOrdersByCustomerEmail(customerEmail: string) {
  return db.getOrdersByCustomerEmail(customerEmail);
}

export async function cancelOrder(orderId: string, customerEmail: string) {
  return db.cancelOrder(orderId, customerEmail);
}

export async function cancelOrderAdmin(orderId: string) {
  return db.cancelOrderAdmin(orderId);
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderRecord["status"],
) {
  return db.updateOrderStatus(orderId, status);
}

export async function verifyCashfreePayment(orderId: string) {
  const raw = (await verifyCashfreeOrder(orderId)) as unknown;
  const rawRecord =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
  const providerStatus = String(
    rawRecord?.order_status ?? rawRecord?.orderStatus ?? "",
  )
    .trim()
    .toUpperCase();

  // AFTER
const mappedStatus: OrderRecord["status"] | null = (() => {
  if (["PAID", "SUCCESS", "COMPLETED"].includes(providerStatus)) {
    return "confirmed";
  }
  if (["PENDING", "INITIATED"].includes(providerStatus)) {
    return "pending";
  }
  if (["ACTIVE", "CANCELLED", "FAILED", "EXPIRED", "TERMINATED"].includes(providerStatus)) {
    return "cancelled";
  }
  return null;
})();

  // Update order for ALL terminal statuses including cancelled/failed
  if (mappedStatus && mappedStatus !== "pending") {
    try {
      await db.updateOrderStatus(orderId, mappedStatus);
    } catch {}
  }

  const paymentStatus: "success" | "failed" | "pending" =
    mappedStatus === "confirmed"
      ? "success"
      : mappedStatus === "cancelled"
        ? "failed"
        : "pending";

  return { ok: true as const, paymentStatus, providerStatus, raw };
}

export async function getSliders(): Promise<SliderRecord[]> {
  return mockSliders;
}

export async function replaceSliders(input: SliderRecord[]) {
  if (input.length === 0) {
    return { error: "At least one slider is required." };
  }

  const normalized = input.map((item) => ({
    id: item.id,
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

  mockSliders.length = 0;
  mockSliders.push(...normalized);

  return { sliders: mockSliders };
}

export async function getHero(): Promise<HeroRecord | null> {
  return mockHero;
}

export async function updateHero(input: HeroRecord) {
  const title = input.title.trim();
  const subtitle = input.subtitle.trim();
  const imageUrl = input.imageUrl.trim();

  if (!title || !subtitle || !imageUrl) {
    return { error: "Title, subtitle and image URL are required." };
  }

  mockHero.title = title;
  mockHero.subtitle = subtitle;
  mockHero.imageUrl = imageUrl;

  return { hero: mockHero };
}

export async function returnOrder(orderId: string, customerEmail: string) {
  return db.requestReturn(orderId, customerEmail);
}

export async function returnOrderAdmin(orderId: string) {
  return db.updateOrderStatus(orderId, "return_requested");
}
// ─────────────────────────────────────────────────────────────────────────────
// ADD these functions to your existing lib/actions.ts
// ─────────────────────────────────────────────────────────────────────────────

import { CouponRecord } from "./mockDb";

// ── Admin: full CRUD ──────────────────────────────────────────────────────────

export async function getAllCoupons(): Promise<CouponRecord[]> {
  return db.getAllCoupons();
}

export async function createCoupon(
  input: Omit<CouponRecord, "id" | "usedCount" | "createdAt">,
) {
  return db.createCoupon(input);
}

export async function updateCoupon(
  id: string,
  input: Partial<Omit<CouponRecord, "id" | "usedCount" | "createdAt">>,
) {
  return db.updateCoupon(id, input);
}

export async function toggleCouponActive(id: string) {
  return db.toggleCouponActive(id);
}

export async function deleteCoupon(id: string) {
  return db.deleteCoupon(id);
}

// ── Customer: apply coupon at checkout ───────────────────────────────────────

export async function applyCoupon(code: string, cartTotal: number) {
  return db.applyCoupon(code, cartTotal);
}

// ── Internal: redeem after a successful order ─────────────────────────────────
// Call this inside createCashfreePayment / createOrder when a coupon is used.

export async function redeemCoupon(code: string) {
  return db.redeemCoupon(code);
}