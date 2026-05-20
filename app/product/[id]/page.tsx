'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/app/context/CartContext';
import { Product } from '@/app/types/cart';
import { clearAuthSession, getAuthExpiry, isAuthSessionValid } from "@/lib/auth";
import ProfileMenu from "@/app/components/ProfileMenu";

interface ProductReview {
  id: number;
  name: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

interface ProductResponse {
  product: Product;
  relatedProducts: Product[];
  customerReviews: ProductReview[];
}

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [data, setData] = useState<ProductResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const { id } = use(params);

  useEffect(() => {
    const valid = isAuthSessionValid();
    setIsLoggedIn(valid);

    if (!valid) {
      return;
    }

    const expiry = getAuthExpiry();
    if (!expiry) {
      return;
    }

    const timeout = expiry - Date.now();
    if (timeout <= 0) {
      clearAuthSession();
      setIsLoggedIn(false);
      return;
    }

    const timer = window.setTimeout(() => {
      clearAuthSession();
      setIsLoggedIn(false);
    }, timeout);

    return () => window.clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    setIsLoggedIn(false);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await fetch(`/api/products/${id}`);
        if (!response.ok) {
          throw new Error('Product not found');
        }
        const result = (await response.json()) as ProductResponse;
        setData(result);
      } catch (fetchError) {
        const message =
          fetchError instanceof Error ? fetchError.message : 'Product not found';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading product...</p>
      </div>
    );
  }

  if (!data || error) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">{error || 'Product not found'}</h2>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-foreground text-background rounded-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const { product, customerReviews, relatedProducts } = data;

  const images = [
    product.image,
    `https://picsum.photos/seed/${product.id}-2/400/300`,
    `https://picsum.photos/seed/${product.id}-3/400/300`,
    `https://picsum.photos/seed/${product.id}-4/400/300`,
  ];

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    alert(`Added ${quantity} ${product.name} to cart!`);
  };

  const handleBuyNow = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <Image src="/next.svg" alt="logo" width={36} height={12} className="dark:invert" />
            <h1 className="text-xl font-semibold">Snack Shop</h1>
          </div>
          <nav className="flex items-center gap-4">
            <Link className="text-sm text-zinc-700 dark:text-zinc-300 hover:underline" href="/">
              Home
            </Link>
            <Link className="text-sm text-zinc-700 dark:text-zinc-300 hover:underline" href="/#products">
              Shop
            </Link>
            {isLoggedIn ? (
              <ProfileMenu isLoggedIn={isLoggedIn} onLogout={handleLogout} />
            ) : (
              <>
                <Link
                  className="text-sm text-zinc-700 dark:text-zinc-300 hover:underline"
                  href="/auth/login"
                >
                  Login
                </Link>
                <Link
                  className="text-sm text-zinc-700 dark:text-zinc-300 hover:underline"
                  href="/auth/signup"
                >
                  Signup
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-white dark:bg-zinc-900 shadow-md">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === idx
                      ? 'border-blue-600'
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">{product.category}</p>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating || 0)
                          ? 'text-yellow-400 fill-current'
                          : 'text-zinc-300 dark:text-zinc-700'
                      }`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                  <span className="ml-2 text-sm font-medium">{product.rating}</span>
                </div>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  ({product.reviews} reviews)
                </span>
              </div>
              <p className="text-4xl font-bold text-green-600">Rs {product.price.toFixed(2)}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">Weight: {product.weight}</p>
            </div>

            <div className="border-t border-b border-zinc-200 dark:border-zinc-800 py-4">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-zinc-600 dark:text-zinc-400">{product.description}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Ingredients</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{product.ingredients}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Nutritional Information (per serving)</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Calories</p>
                  <p className="text-lg font-semibold">{product.nutritionalInfo?.calories}</p>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Protein</p>
                  <p className="text-lg font-semibold">{product.nutritionalInfo?.protein}</p>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Carbs</p>
                  <p className="text-lg font-semibold">{product.nutritionalInfo?.carbs}</p>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Fat</p>
                  <p className="text-lg font-semibold">{product.nutritionalInfo?.fat}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="font-medium">Quantity:</span>
                <div className="flex items-center border border-zinc-300 dark:border-zinc-700 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    -
                  </button>
                  <span className="px-6 py-2 border-x border-zinc-300 dark:border-zinc-700">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-3 border-2 border-foreground rounded-lg font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 py-3 bg-foreground text-background rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  Buy Now
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm">
                {product.inStock ? (
                  <>
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-600 font-medium">In Stock</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-red-600 font-medium">Out of Stock</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Why Choose This Product?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex gap-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Quality Assured</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Premium ingredients sourced from trusted suppliers</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Fast Delivery</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Get your order delivered within 2-3 business days</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Easy Returns</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">7-day return policy for your peace of mind</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Customer Reviews</h2>
            <button className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              Write a Review
            </button>
          </div>

          <div className="space-y-6">
            {customerReviews.map((review) => (
              <div key={review.id} className="border-b border-zinc-200 dark:border-zinc-800 pb-6 last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{review.name}</span>
                      {review.verified && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-zinc-300 dark:text-zinc-700'
                            }`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">{review.date}</span>
                    </div>
                  </div>
                </div>
                <p className="text-zinc-700 dark:text-zinc-300 mt-2">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <div
                key={relatedProduct.id}
                className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/product/${relatedProduct.id}`)}
              >
                <div className="aspect-square rounded-lg overflow-hidden mb-3">
                  <img src={relatedProduct.image} alt={relatedProduct.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-semibold mb-1">{relatedProduct.name}</h3>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.floor(relatedProduct.rating || 0)
                          ? 'text-yellow-400 fill-current'
                          : 'text-zinc-300 dark:text-zinc-700'
                      }`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                  <span className="text-xs text-zinc-600 dark:text-zinc-400 ml-1">({relatedProduct.reviews})</span>
                </div>
                <p className="text-lg font-bold text-green-600">Rs {relatedProduct.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
