'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getChaupalMarketplaceItem, type ChaupalMarketplaceItem } from '@/services/api';

export default function MarketplaceProductDetailPage() {
  const params = useParams();
  const itemId = (params?.id as string) || '';

  const [item, setItem] = useState<ChaupalMarketplaceItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (itemId) {
      loadItem();
    }
  }, [itemId]);

  const loadItem = async () => {
    setIsLoading(true);
    try {
      const res = await getChaupalMarketplaceItem(itemId);
      if (res && res.item) setItem(res.item);
    } catch (err) {
      console.warn('Error loading product details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-16 rounded-2xl border border-slate-200 bg-white text-center space-y-3 shadow-xs">
        <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-mono">Loading product listing details...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-4xl mx-auto p-16 rounded-2xl border border-slate-200 bg-white text-center space-y-3 shadow-xs">
        <h2 className="text-base font-bold text-slate-900">Product Listing Not Found</h2>
        <p className="text-xs text-slate-500">This item may have been sold or removed by the farmer.</p>
        <Link
          href="/dashboard/chaupal/marketplace"
          className="inline-block px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
        >
          ← Return to Krishi Marketplace
        </Link>
      </div>
    );
  }

  const whatsappMessage = `Namaskara ${item.seller.name}, I am interested in purchasing "${item.title}" listed on GramSetu Kisan Chaupal for ₹${item.price}/${item.unit}. Could you share more details on delivery and minimum quantity?`;

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-left pb-16">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <Link href="/dashboard/chaupal/marketplace" className="hover:text-slate-900 font-mono">
          ← Back to Krishi Marketplace
        </Link>
        <span className="font-mono text-[11px]">Listing ID: {item.id}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: IMAGE GALLERY */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-4/3 rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xs">
            <img
              src={item.images[activeImageIndex] || item.images[0]}
              alt={item.title}
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80';
              }}
              className="w-full h-full object-cover"
            />
            {item.organic_certified && (
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-emerald-700/90 backdrop-blur-md text-white text-xs font-bold shadow-md flex items-center gap-1.5">
                <span>Certified Chemical-Free</span>
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {item.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {item.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-18 h-18 rounded-2xl overflow-hidden border-2 transition cursor-pointer shrink-0 ${
                    activeImageIndex === idx ? 'border-slate-900 shadow-xs scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt="Thumb"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80';
                    }}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Description Section */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Produce Details &amp; Specifications</h3>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
              {item.description || 'Verified agricultural produce directly from the farmer. High quality harvest adhering to APMC standards.'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
              <div className="p-2.5 rounded-xl bg-slate-50">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Category</span>
                <span className="text-xs font-bold text-slate-800">{item.category}</span>
              </div>
              {item.variety && (
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Variety / Hybrid</span>
                  <span className="text-xs font-bold text-slate-800">{item.variety}</span>
                </div>
              )}
              {item.grade && (
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Quality Grade</span>
                  <span className="text-xs font-bold text-slate-800">{item.grade}</span>
                </div>
              )}
              {item.moisture_content && (
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Moisture Content</span>
                  <span className="text-xs font-bold text-slate-800">{item.moisture_content}</span>
                </div>
              )}
              {item.packaging_type && (
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Packaging Type</span>
                  <span className="text-xs font-bold text-slate-800">{item.packaging_type}</span>
                </div>
              )}
              {item.delivery_mode && (
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Delivery Mode</span>
                  <span className="text-xs font-bold text-slate-800">{item.delivery_mode}</span>
                </div>
              )}
              {item.negotiation_terms && (
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Negotiation</span>
                  <span className="text-xs font-bold text-slate-800">{item.negotiation_terms}</span>
                </div>
              )}
              {item.payment_terms && (
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Payment Terms</span>
                  <span className="text-xs font-bold text-slate-800">{item.payment_terms}</span>
                </div>
              )}
              <div className="p-2.5 rounded-xl bg-slate-50">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Min Order</span>
                <span className="text-xs font-bold text-slate-800">{item.min_order || '1 Unit'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Location</span>
                <span className="text-xs font-bold text-slate-800">{item.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PRICING & SELLER ACTIONS */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main Price Card */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-5">
            <div className="space-y-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold uppercase">
                {item.category}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {item.title}
              </h1>
              <p className="text-xs text-slate-500 font-mono">
                {item.location} • Listed on {new Date(item.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-baseline justify-between">
              <div>
                <span className="text-[11px] font-mono text-emerald-800 font-bold block uppercase">Direct Farm Gate Price</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono">
                  ₹{item.price.toLocaleString()}
                </span>
                <span className="text-xs text-emerald-800 ml-1">/ {item.unit}</span>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-emerald-700 block">Stock Available</span>
                <span className="text-xs font-bold text-emerald-900">{item.quantity_available}</span>
              </div>
            </div>

            {/* Direct Contact Buttons */}
            <div className="space-y-2.5 pt-2">
              <a
                href={`https://api.whatsapp.com/send?phone=${item.seller.whatsapp}&text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Chat &amp; Negotiate on WhatsApp</span>
              </a>

              <a
                href={`tel:${item.seller.phone}`}
                className="w-full h-11 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-900 text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>Call Farmer: {item.seller.phone}</span>
              </a>
            </div>
          </div>

          {/* Seller Card */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">
              VERIFIED FARMER SELLER
            </span>

            <Link
              href={`/dashboard/chaupal/profile/${item.seller.username}`}
              className="flex items-center gap-3.5 group"
            >
              <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-emerald-500 to-amber-500 shrink-0">
                <img
                  src={item.seller.avatar_url}
                  alt={item.seller.name}
                  className="w-full h-full rounded-full object-cover bg-white"
                />
              </div>

              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition truncate">
                    {item.seller.name}
                  </h4>
                  {item.seller.is_verified && (
                    <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  @{item.seller.username} • {item.seller.village}
                </p>
              </div>
            </Link>

            <Link
              href={`/dashboard/chaupal/profile/${item.seller.username}`}
              className="block w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold text-center transition"
            >
              View Farmer Profile &amp; Feed Posts →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
