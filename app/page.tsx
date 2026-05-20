'use client';

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./context/CartContext";
import Cart from "./components/Cart/Cart";
import { Product } from "./types/cart";
import { clearAuthSession, getAuthExpiry, isAuthSessionValid } from "@/lib/auth";
import ProfileMenu from "./components/ProfileMenu";

interface Slider {
  id: number;
  url: string;
  title: string;
  subtitle: string;
}

interface HeroContent {
  title: string;
  subtitle: string;
  imageUrl: string;
}

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [hero, setHero] = useState<HeroContent | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const { addToCart, toggleCart, totalItems } = useCart();

  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  const handleBuyNow = (product: Product) => {
    addToCart(product);
    router.push("/checkout");
  };

  useEffect(() => {
    if (sliders.length === 0) {
      return;
    }
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliders.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [sliders.length]);

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        setProductsLoading(true);
        setProductsError("");
        const [productResponse, sliderResponse, heroResponse] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/sliders"),
          fetch("/api/hero"),
        ]);
        if (!productResponse.ok || !sliderResponse.ok || !heroResponse.ok) {
          throw new Error("Failed to load page data.");
        }
        const productData = (await productResponse.json()) as {
          products: Product[];
        };
        const sliderData = (await sliderResponse.json()) as { sliders: Slider[] };
        const heroData = (await heroResponse.json()) as { hero: HeroContent };
        setProducts(productData.products);
        setSliders(sliderData.sliders);
        setHero(heroData.hero);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load page data.";
        setProductsError(message);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchPageData();
  }, []);

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

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    if (sliders.length === 0) {
      return;
    }
    setCurrentSlide((prev) => (prev + 1) % sliders.length);
  };

  const prevSlide = () => {
    if (sliders.length === 0) {
      return;
    }
    setCurrentSlide((prev) => (prev - 1 + sliders.length) % sliders.length);
  };

  const heroContent = hero ?? {
    title: "Healthy snacks, delivered fast.",
    subtitle:
      "Browse curated snacks made from real ingredients. Small-batch, sustainably sourced, and crowd-approved.",
    imageUrl: "https://picsum.photos/seed/hero/800/600",
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-foreground font-sans">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/next.svg" alt="logo" width={36} height={12} className="dark:invert" />
            <h1 className="text-xl font-semibold">Snack Shop</h1>
          </div>
          <nav className="flex items-center gap-4">
            <a className="text-sm text-zinc-700 dark:text-zinc-300" href="#">Shop</a>
            <a className="text-sm text-zinc-700 dark:text-zinc-300" href="#">About</a>
            <button
              onClick={toggleCart}
              className="rounded-full border px-3 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors relative"
            >
              Cart ({totalItems})
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
            {isLoggedIn ? (
              <ProfileMenu isLoggedIn={isLoggedIn} onLogout={handleLogout} />
            ) : (
              <>
                <Link
                  className="text-sm text-zinc-700 hover:underline dark:text-zinc-300"
                  href="/auth/login"
                >
                  Login
                </Link>
                <Link
                  className="text-sm text-zinc-700 hover:underline dark:text-zinc-300"
                  href="/auth/signup"
                >
                  Signup
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {sliders.length > 0 && (
          <section className="relative mb-12 rounded-xl overflow-hidden shadow-lg">
            <div className="relative h-64 md:h-96">
              {sliders.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    index === currentSlide ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <img
                    src={slide.url}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
                    <div className="px-8 md:px-12 text-white">
                      <h2 className="text-3xl md:text-4xl font-bold mb-2">{slide.title}</h2>
                      <p className="text-lg md:text-xl">{slide.subtitle}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black rounded-full p-2 transition-all"
              aria-label="Previous slide"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black rounded-full p-2 transition-all"
              aria-label="Next slide"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {sliders.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentSlide ? "bg-white w-8" : "bg-white/50"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 gap-8 md:grid-cols-2 items-center">
          <div>
            <h2 className="text-3xl font-bold leading-tight">{heroContent.title}</h2>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">{heroContent.subtitle}</p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => router.push("/checkout")}
                className="inline-block rounded-lg bg-foreground px-5 py-3 text-background hover:opacity-90 transition-opacity"
              >
                Shop Now
              </button>
              <button
                onClick={() => router.push("/product/1")}
                className="inline-block rounded-lg border px-5 py-3 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Learn More
              </button>
            </div>
          </div>
          <div className="rounded-lg overflow-hidden shadow-md">
            <img src={heroContent.imageUrl} alt={heroContent.title} className="w-full h-auto object-cover" />
          </div>
        </section>

        <section className="mt-12">
          <h3 className="text-2xl font-semibold">Popular picks</h3>
          {productsLoading && (
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Loading products...
            </p>
          )}
          {productsError && (
            <p className="mt-4 text-sm text-red-600">{productsError}</p>
          )}
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <article key={p.id} className="rounded-lg border bg-white p-4 shadow-sm dark:bg-zinc-900">
                <div
                  className="mb-3 h-40 overflow-hidden rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => router.push(`/product/${p.id}`)}
                >
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4
                    className="text-sm font-medium cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => router.push(`/product/${p.id}`)}
                  >
                    {p.name}
                  </h4>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{p.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-lg font-semibold">Rs {p.price.toFixed(2)}</div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleAddToCart(p)}
                      className="flex-1 rounded-lg px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={() => handleBuyNow(p)}
                      className="flex-1 rounded-lg px-3 py-2 text-sm bg-foreground text-background hover:opacity-90 transition-opacity"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-zinc-600 dark:text-zinc-400">
          © {new Date().getFullYear()} Snack Shop - healthy snacks for everyone.
        </div>
      </footer>

      <Cart />
    </div>
  );
}

