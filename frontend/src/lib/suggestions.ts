/**
 * Comprehensive Datasets & Detailed Location Search Engine for Indian Farmers
 */

import { SuggestionItem } from '@/components/ui/AutoSuggestInput';

export interface DetailedIndianLocation {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  latitude: number;
  longitude: number;
  village: string;
  district: string;
  state: string;
  pincode: string;
  locationName: string;
}

export const POPULAR_INDIAN_CROPS: SuggestionItem[] = [
  { id: 'crop-paddy', title: 'Paddy (Rice / ಭತ್ತ / धान)', subtitle: 'Kharif staple cereal', category: 'Cereal' },
  { id: 'crop-sugarcane', title: 'Sugarcane (ಕಬ್ಬು / गन्ना)', subtitle: 'Annual cash crop', category: 'Cash Crop' },
  { id: 'crop-cotton', title: 'Cotton (ಹತ್ತಿ / कपास)', subtitle: 'Kharif fiber crop', category: 'Cash Crop' },
  { id: 'crop-wheat', title: 'Wheat (ಗೋಧಿ / गेहूं)', subtitle: 'Rabi winter cereal', category: 'Cereal' },
  { id: 'crop-ragi', title: 'Ragi (Finger Millet / ರಾಗಿ)', subtitle: 'Nutri-cereal dryland', category: 'Millets' },
  { id: 'crop-maize', title: 'Maize (Corn / ಮೆಕ್ಕೆಜೋಳ / मक्का)', subtitle: 'Kharif / Rabi fodder & grain', category: 'Cereal' },
  { id: 'crop-groundnut', title: 'Groundnut (ಕಡಲೆಕಾಯಿ / मूंगफली)', subtitle: 'Oilseed crop', category: 'Oilseeds' },
  { id: 'crop-soybean', title: 'Soybean (ಸೋಯಾಬೀನ್ / सोयाबीन)', subtitle: 'Oilseed & protein', category: 'Oilseeds' },
  { id: 'crop-mustard', title: 'Mustard (ಸಾಸಿವೆ / सरसों)', subtitle: 'Rabi oilseed', category: 'Oilseeds' },
  { id: 'crop-tur', title: 'Tur / Arhar Dal (ತೊಗರಿ ಬೇಳೆ / अरहर)', subtitle: 'Kharif pulse', category: 'Pulses' },
  { id: 'crop-chana', title: 'Chana / Bengal Gram (ಕಡಲೆ / चना)', subtitle: 'Rabi pulse', category: 'Pulses' },
  { id: 'crop-moong', title: 'Moong Dal (ಹೆಸರು ಕಾಳು / मूंग)', subtitle: 'Short duration pulse', category: 'Pulses' },
  { id: 'crop-urad', title: 'Urad Dal (ಉದ್ದಿನ ಬೇಳೆ / उड़द)', subtitle: 'Black gram pulse', category: 'Pulses' },
  { id: 'crop-turmeric', title: 'Turmeric (ಅರಿಶಿನ / हल्दी)', subtitle: 'Commercial spice', category: 'Spices' },
  { id: 'crop-chilli', title: 'Chilli (ಹಸಿಮೆಣಸಿನಕಾಯಿ / मिर्च)', subtitle: 'Cash spice', category: 'Spices' },
  { id: 'crop-onion', title: 'Onion (ಈರುಳ್ಳಿ / प्याज)', subtitle: 'Horticulture crop', category: 'Horticulture' },
  { id: 'crop-tomato', title: 'Tomato (ಟೊಮೇಟೊ / टमाटर)', subtitle: 'Vegetable crop', category: 'Vegetables' },
  { id: 'crop-potato', title: 'Potato (ಆಲೂಗಡ್ಡೆ / आलू)', subtitle: 'Tuber vegetable', category: 'Vegetables' },
  { id: 'crop-ginger', title: 'Ginger (ಶುಂಠಿ / अदरक)', subtitle: 'Spice crop', category: 'Spices' },
  { id: 'crop-arecanut', title: 'Arecanut (ಅಡಿಕೆ / सुपारी)', subtitle: 'Plantation crop', category: 'Plantation' },
  { id: 'crop-coconut', title: 'Coconut (ತೆಂಗಿನಕಾಯಿ / नारियल)', subtitle: 'Perennial plantation', category: 'Plantation' },
  { id: 'crop-coffee', title: 'Coffee (ಕಾಫಿ / कॉफी)', subtitle: 'Shade plantation crop', category: 'Plantation' },
  { id: 'crop-cardamom', title: 'Cardamom (ಏಲಕ್ಕಿ / इलायची)', subtitle: 'Queen of spices', category: 'Spices' },
  { id: 'crop-mango', title: 'Mango (ಮಾವಿನಹಣ್ಣು / आम)', subtitle: 'Horticulture fruit', category: 'Fruit' },
  { id: 'crop-banana', title: 'Banana (ಬಾಳೆಹಣ್ಣು / केला)', subtitle: 'Horticulture fruit', category: 'Fruit' },
  { id: 'crop-pomegranate', title: 'Pomegranate (ದಾಳಿಂಬೆ / अनार)', subtitle: 'Arid fruit crop', category: 'Fruit' },
  { id: 'crop-grapes', title: 'Grapes (ದ್ರಾಕ್ಷಿ / अंगूर)', subtitle: 'High value vineyard', category: 'Fruit' },
];

export const POPULAR_FARM_MACHINERY: SuggestionItem[] = [
  { id: 'mach-tractor-4wd', title: 'Tractor (4WD / 2WD 45HP+)', subtitle: 'Heavy land preparation', category: 'Tractor' },
  { id: 'mach-power-tiller', title: 'Power Tiller / Rotary Weeder', subtitle: 'Paddy & inter-cultivation', category: 'Tillage' },
  { id: 'mach-combine', title: 'Combine Harvester', subtitle: 'Paddy & wheat harvesting', category: 'Harvesting' },
  { id: 'mach-rotavator', title: 'Rotavator & Disc Plough', subtitle: 'Soil pulverization', category: 'Tillage' },
  { id: 'mach-solar-pump', title: 'Solar Water Pump (PM-KUSUM)', subtitle: 'Renewable irrigation', category: 'Irrigation' },
  { id: 'mach-drip-kit', title: 'Micro Drip Irrigation System', subtitle: 'Water-saving technology', category: 'Irrigation' },
  { id: 'mach-sprayer', title: 'Battery / Boom Power Sprayer', subtitle: 'Pest & nutrient application', category: 'Sprayer' },
  { id: 'mach-seed-drill', title: 'Zero-Till Seed-cum-Fertilizer Drill', subtitle: 'Direct precision sowing', category: 'Sowing' },
  { id: 'mach-chaff-cutter', title: 'Chaff Cutter / Silage Machine', subtitle: 'Dairy fodder processing', category: 'Dairy' },
  { id: 'mach-none', title: 'Manual Tools Only (No Heavy Machinery)', subtitle: 'Smallholding grower', category: 'Manual' },
];

export const POPULAR_FARMING_TECHNIQUES: SuggestionItem[] = [
  { id: 'tech-drip', title: 'Micro-Drip & Fertigation System', subtitle: 'High water-use efficiency', category: 'Irrigation' },
  { id: 'tech-organic', title: 'Certified Organic & Jeevamrutha', subtitle: 'Chemical-free natural farming', category: 'Organic' },
  { id: 'tech-zbnf', title: 'Zero Budget Natural Farming (ZBNF)', subtitle: 'Subhash Palekar methodology', category: 'Natural' },
  { id: 'tech-sri', title: 'System of Rice Intensification (SRI)', subtitle: 'Low water paddy cultivation', category: 'Paddy' },
  { id: 'tech-intercrop', title: 'Multi-Tier Intercropping (Paddy + Pulses)', subtitle: 'Soil nitrogen fixation', category: 'Cropping' },
  { id: 'tech-polyhouse', title: 'Polyhouse / Shade Net Horticulture', subtitle: 'Controlled environment', category: 'High-Tech' },
  { id: 'tech-solar', title: 'Grid-Interactive Solar Agri-Voltaics', subtitle: 'PM-KUSUM Component A & C', category: 'Renewable' },
];

/**
 * Detailed Indian Location Search (Supports Villages, Hoblis, Taluks, Districts, Pincodes, States)
 */
export async function searchDetailedIndianLocations(query: string): Promise<DetailedIndianLocation[]> {
  if (!query || query.trim().length < 2) return [];

  const cleanQuery = query.trim();
  const isPincode = /^[1-9][0-9]{5}$/.test(cleanQuery);

  // Search parameters targeting Indian administrative boundaries
  const queryParam = isPincode
    ? `postalcode=${encodeURIComponent(cleanQuery)}&country=India`
    : `q=${encodeURIComponent(cleanQuery)}&countrycodes=in`;

  const url = `https://nominatim.openstreetmap.org/search?format=json&${queryParam}&limit=8&addressdetails=1`;

  try {
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en,kn,hi,te,ta,mr',
      },
    });

    if (!res.ok) return [];
    const data = await res.json();

    return data.map((item: any) => {
      const addr = item.address || {};
      const village =
        addr.village ||
        addr.hamlet ||
        addr.suburb ||
        addr.town ||
        addr.neighbourhood ||
        addr.locality ||
        addr.city ||
        item.name ||
        '';

      const district =
        addr.state_district ||
        addr.county ||
        addr.district ||
        addr.city_district ||
        addr.city ||
        '';

      const state = addr.state || '';
      const pincode = addr.postcode || (isPincode ? cleanQuery : '');

      const titleParts = [village, district].filter(Boolean);
      const title = titleParts.length > 0 ? titleParts.join(', ') : item.display_name?.split(',')[0] || query;

      const subtitleParts = [district, state, pincode ? `PIN: ${pincode}` : ''].filter(Boolean);
      const subtitle = subtitleParts.join(' • ');

      const formattedLocationName = [village, district, state].filter(Boolean).join(', ');

      return {
        id: String(item.place_id || item.osm_id),
        title,
        subtitle,
        category: addr.village
          ? 'Village'
          : addr.hamlet
          ? 'Hamlet'
          : addr.town
          ? 'Town'
          : addr.state_district
          ? 'District'
          : 'Location',
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        village: village || 'Local Area',
        district: district || 'District',
        state: state || 'State',
        pincode: pincode || '',
        locationName: formattedLocationName || title,
      };
    });
  } catch (err) {
    console.warn('Location search error:', err);
    return [];
  }
}

/**
 * Helper for AutoSuggestInput backward compatibility
 */
export async function fetchIndianLocations(query: string): Promise<SuggestionItem[]> {
  const detailed = await searchDetailedIndianLocations(query);
  return detailed.map((d) => ({
    id: d.id,
    title: d.locationName,
    subtitle: d.subtitle,
    category: d.category,
  }));
}
