"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../components/AdminSidebar";
import AdminNotificationsBell from "../components/AdminNotificationsBell";

interface Slider {
  id: number;
  url: string;
  title: string;
  subtitle: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  weight: string;
}

interface HeroContent {
  title: string;
  subtitle: string;
  imageUrl: string;
}

export default function AdminManagePage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hero, setHero] = useState<HeroContent>({
    title: "",
    subtitle: "",
    imageUrl: "",
  });
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    image: "",
    description: "",
    category: "",
    weight: "",
  });

  useEffect(() => {
    const isAdminLoggedIn =
      localStorage.getItem("munch_admin_logged_in") === "true";
    if (!isAdminLoggedIn) {
      router.replace("/admin/login?redirect=/admin/manage");
      return;
    }
    setIsCheckingAuth(false);
  }, [router]);

  useEffect(() => {
    if (isCheckingAuth) {
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [heroRes, sliderRes, productRes] = await Promise.all([
          fetch("/api/hero"),
          fetch("/api/sliders"),
          fetch("/api/products"),
        ]);

        if (!heroRes.ok || !sliderRes.ok || !productRes.ok) {
          throw new Error("Failed to load admin data.");
        }

        const heroBody = (await heroRes.json()) as { hero: HeroContent | null };
        const sliderBody = (await sliderRes.json()) as { sliders: Slider[] | null };
        const productBody = (await productRes.json()) as { products: Product[] };

        setHero(
          heroBody.hero ?? {
            title: "",
            subtitle: "",
            imageUrl: "",
          },
        );
        setSliders(Array.isArray(sliderBody.sliders) ? sliderBody.sliders : []);
        setProducts(productBody.products);
      } catch (fetchError) {
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load admin data.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isCheckingAuth]);

  const saveHero = async () => {
    try {
      setError("");
      setSuccess("");
      const response = await fetch("/api/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hero),
      });
      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message || "Failed to update hero.");
      }
      setSuccess("Hero content updated.");
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Failed to update hero.";
      setError(message);
    }
  };

  const updateSlider = (
    index: number,
    key: "url" | "title" | "subtitle",
    value: string,
  ) => {
    setSliders((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)),
    );
  };

  const saveSliders = async () => {
    try {
      setError("");
      setSuccess("");
      const response = await fetch("/api/sliders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sliders }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message || "Failed to update sliders.");
      }
      setSuccess("Slider content updated.");
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Failed to update sliders.";
      setError(message);
    }
  };

  const addProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setError("");
      setSuccess("");
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProduct.name,
          price: Number(newProduct.price),
          image: newProduct.image,
          description: newProduct.description,
          category: newProduct.category,
          weight: newProduct.weight,
        }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message || "Failed to add product.");
      }

      const body = (await response.json()) as { product: Product };
      setProducts((prev) => [...prev, body.product]);
      setNewProduct({
        name: "",
        price: "",
        image: "",
        description: "",
        category: "",
        weight: "",
      });
      setSuccess("Product added.");
    } catch (addError) {
      const message =
        addError instanceof Error ? addError.message : "Failed to add product.";
      setError(message);
    }
  };

  const deleteProduct = async (productId: number) => {
    try {
      setError("");
      setSuccess("");
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message || "Failed to delete product.");
      }
      setProducts((prev) => prev.filter((product) => product.id !== productId));
      setSuccess("Product deleted.");
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete product.";
      setError(message);
    }
  };

  if (isCheckingAuth || loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Loading admin page...
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-4 text-zinc-900 dark:bg-black dark:text-zinc-100 sm:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-start">
        <AdminSidebar />

        <div className="flex-1 space-y-6">
          <header className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Admin Manage
              </p>
              <h1 className="mt-1 text-2xl font-bold">Hero, Slider & Products</h1>
            </div>
            <div className="flex items-center gap-2">
              <AdminNotificationsBell />
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("munch_admin_logged_in");
                  router.replace("/admin/login");
                }}
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Logout
              </button>
            </div>
          </header>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {success}
            </p>
          )}

          <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Hero Section</h2>
            <button
              onClick={saveHero}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
            >
              Save Hero
            </button>
          </div>
          <div className="grid gap-3">
            <input
              value={hero.title}
              onChange={(e) => setHero((prev) => ({ ...prev, title: e.target.value }))}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="Hero Title"
            />
            <textarea
              value={hero.subtitle}
              onChange={(e) =>
                setHero((prev) => ({ ...prev, subtitle: e.target.value }))
              }
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="Hero Subtitle"
              rows={3}
            />
            <input
              value={hero.imageUrl}
              onChange={(e) =>
                setHero((prev) => ({ ...prev, imageUrl: e.target.value }))
              }
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="Hero Image URL"
            />
          </div>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Slider Content</h2>
            <button
              onClick={saveSliders}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
            >
              Save Sliders
            </button>
          </div>
          <div className="space-y-3">
            {sliders.map((slider, index) => (
              <div
                key={slider.id}
                className="grid gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800 md:grid-cols-3"
              >
                <input
                  value={slider.url}
                  onChange={(e) => updateSlider(index, "url", e.target.value)}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  placeholder="Image URL"
                />
                <input
                  value={slider.title}
                  onChange={(e) => updateSlider(index, "title", e.target.value)}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  placeholder="Title"
                />
                <input
                  value={slider.subtitle}
                  onChange={(e) =>
                    updateSlider(index, "subtitle", e.target.value)
                  }
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  placeholder="Subtitle"
                />
              </div>
            ))}
          </div>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold">Add Product</h2>
          <form onSubmit={addProduct} className="grid gap-3 md:grid-cols-2">
            <input
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct((prev) => ({ ...prev, name: e.target.value }))
              }
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="Name"
              required
            />
            <input
              value={newProduct.price}
              onChange={(e) =>
                setNewProduct((prev) => ({ ...prev, price: e.target.value }))
              }
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="Price"
              type="number"
              min="0.01"
              step="0.01"
              required
            />
            <input
              value={newProduct.image}
              onChange={(e) =>
                setNewProduct((prev) => ({ ...prev, image: e.target.value }))
              }
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 md:col-span-2"
              placeholder="Image URL"
              required
            />
            <input
              value={newProduct.category}
              onChange={(e) =>
                setNewProduct((prev) => ({ ...prev, category: e.target.value }))
              }
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="Category"
            />
            <input
              value={newProduct.weight}
              onChange={(e) =>
                setNewProduct((prev) => ({ ...prev, weight: e.target.value }))
              }
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="Weight"
            />
            <textarea
              value={newProduct.description}
              onChange={(e) =>
                setNewProduct((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 md:col-span-2"
              placeholder="Description"
              rows={3}
            />
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
            >
              Add Product
            </button>
          </form>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold">Delete Product</h2>
          <div className="space-y-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-zinc-500">Rs {product.price.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => deleteProduct(product.id)}
                  className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
          </section>
        </div>
      </div>
    </main>
  );
}
