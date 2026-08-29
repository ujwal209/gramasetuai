'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getChaupalMarketplace, type ChaupalMarketplaceItem } from '@/services/api';
import { ChaupalBottomNav } from '@/components/ChaupalBottomNav';

export default function KrishiMarketplacePage() {
  const [items, setItems] = useState<ChaupalMarketplaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMarketplace();
  }, [selectedCategory]);

  const loadMarketplace = async () => {
    setIsLoading(true);
    try {
      const res = await getChaupalMarketplace({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        query: searchQuery || undefined,
      });
      if (res && res.items) setItems(res.items);
    } catch (err) {
      console.warn('Error loading marketplace:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    'All',
    'Crops & Grains',
    'Fruits & Vegetables',
    'Cattle & Livestock',
    'Farm Equipment & Rental',
    'Seeds & Fertilizers',
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadMarketplace();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left pb-24">
      {/* 1. Header Banner */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider font-mono">
              DIRECT FARMER-TO-BUYER BAZAR
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Krishi Mandi &amp; Produce Marketplace
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Trade agricultural produce, seeds, cattle, tractors, and equipment directly with zero middlemen commission. Connect via WhatsApp or phone call.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/dashboard/chaupal"
            className="h-10 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
          >
            <span>Feed &amp; Stories</span>
          </Link>
          <Link
            href="/dashboard/chaupal/create"
            className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <span>+ Sell Your Produce</span>
          </Link>
        </div>
      </div>

      {/* 2. Search & Category Filters */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search crops (e.g. Sona Masoori, Tomatoes, Sugarcane, Mahindra Tractor, HF Cow)..."
              className="w-full h-11 pl-10 pr-4 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-800 transition"
            />
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <button
            type="submit"
            className="h-11 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs font-bold'
                  : 'bg-slate-100/80 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Product Listings Grid */}
      {isLoading ? (
        <div className="p-16 rounded-2xl border border-slate-200 bg-white text-center space-y-3 shadow-xs">
          <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono">Fetching active Krishi Mandi listings...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="p-16 rounded-2xl border border-slate-200 bg-white text-center space-y-3 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900">No listings found</h3>
          <p className="text-xs text-slate-500">
            Be the first farmer to list produce or farm equipment in this category.
          </p>
          <Link
            href="/dashboard/chaupal/create"
            className="inline-block px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
          >
            + List Produce
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div>
                {/* Product Image */}
                <div className="relative aspect-16/10 bg-slate-100 overflow-hidden">
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold font-mono">
                      {item.category}
                    </span>
                  </div>

                  {item.organic_certified && (
                    <div className="absolute top-2.5 right-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold font-mono">
                        ORGANIC
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{item.title}</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-lg font-black text-slate-900 font-mono">
                        ₹{item.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">/ {item.unit}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-mono">
                    <div>
                      <span className="text-slate-400 block">Available:</span>
                      <span className="font-bold text-slate-800">{item.quantity_available}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Harvested:</span>
                      <span className="font-bold text-slate-800">{item.harvest_date || 'Recent'}</span>
                    </div>
                  </div>

                  {/* Seller info */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/dashboard/chaupal/profile/${item.seller.username}`}
                      className="flex items-center gap-2 group/seller"
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-200">
                        <img src={item.seller.avatar_url || '/logo.png'} alt={item.seller.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 group-hover/seller:text-emerald-700">
                        {item.seller.name}
                      </span>
                    </Link>

                    <span className="text-[11px] text-slate-400 font-mono truncate">
                      {item.location.split(',')[0]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                <a
                  href={`https://api.whatsapp.com/send?phone=${item.seller.whatsapp}&text=${encodeURIComponent(
                    `Namaskara ${item.seller.name}, I saw your listing for "${item.title}" on GramSetu Kisan Chaupal. Is it currently available for purchase?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 h-9 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <span>WhatsApp</span>
                </a>

                <a
                  href={`tel:${item.seller.phone}`}
                  className="px-3 h-9 rounded-xl border border-slate-200 hover:bg-white text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs"
                >
                  <span>Call</span>
                </a>

                <Link
                  href={`/dashboard/chaupal/marketplace/${item.id}`}
                  className="px-3 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center"
                >
                  <span>Details</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Instagram-Style Bottom Navigation Bar */}
      <ChaupalBottomNav />
    </div>
  );
}
