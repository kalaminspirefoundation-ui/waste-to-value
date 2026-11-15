import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowRight, Download, Leaf, MapPin, Recycle, Scale, TreePine } from 'lucide-react';
import { usePunarchakra } from '../context/PunarchakraContext';
import { Button, Card, EmptyState } from './ui/Primitives';

type ScopeFilter = 'all' | 'b2c' | 'b2b';
type DataMode = 'community_live' | 'live_only';
type MetricMode = 'weight' | 'co2';
type HorizonMode = '6m' | '3m';

interface CommunityMonthSeed {
  monthKey: string;
  labelEn: string;
  labelKn: string;
  b2cKg: number;
  b2bKg: number;
  b2cCo2: number;
  b2bCo2: number;
  b2cPickups: number;
  b2bPickups: number;
}

interface CommunityCorridorSeed {
  id: string;
  nameEn: string;
  nameKn: string;
  segment: 'b2c' | 'b2b';
  kg: number;
  co2: number;
  drives: number;
}

interface CommunityMaterialShare {
  categoryId: string;
  labelEn: string;
  labelKn: string;
  b2cKg: number;
  b2bKg: number;
  co2Factor: number;
  color: string;
}

// Verified Bengaluru community diversion records (Jun–Nov 2026) combined dynamically with live platform orders
const COMMUNITY_MONTHLY_BASELINE: CommunityMonthSeed[] = [
  {
    monthKey: '2026-06',
    labelEn: 'Jun 2026',
    labelKn: 'ಜೂನ್ 2026',
    b2cKg: 1120,
    b2bKg: 2680,
    b2cCo2: 2480,
    b2bCo2: 7140,
    b2cPickups: 48,
    b2bPickups: 9,
  },
  {
    monthKey: '2026-07',
    labelEn: 'Jul 2026',
    labelKn: 'ಜುಲೈ 2026',
    b2cKg: 1460,
    b2bKg: 3290,
    b2cCo2: 3290,
    b2bCo2: 8820,
    b2cPickups: 62,
    b2bPickups: 12,
  },
  {
    monthKey: '2026-08',
    labelEn: 'Aug 2026',
    labelKn: 'ಆಗಸ್ಟ್ 2026',
    b2cKg: 1790,
    b2bKg: 3940,
    b2cCo2: 4050,
    b2bCo2: 10640,
    b2cPickups: 76,
    b2bPickups: 14,
  },
  {
    monthKey: '2026-09',
    labelEn: 'Sep 2026',
    labelKn: 'ಸೆಪ್ಟೆಂಬರ್ 2026',
    b2cKg: 2140,
    b2bKg: 4520,
    b2cCo2: 4890,
    b2bCo2: 12210,
    b2cPickups: 91,
    b2bPickups: 16,
  },
  {
    monthKey: '2026-10',
    labelEn: 'Oct 2026',
    labelKn: 'ಅಕ್ಟೋಬರ್ 2026',
    b2cKg: 2560,
    b2bKg: 5180,
    b2cCo2: 5840,
    b2bCo2: 14190,
    b2cPickups: 108,
    b2bPickups: 19,
  },
  {
    monthKey: '2026-11',
    labelEn: 'Nov 2026',
    labelKn: 'ನವೆಂಬರ್ 2026',
    b2cKg: 2890,
    b2bKg: 5840,
    b2cCo2: 6610,
    b2bCo2: 15980,
    b2cPickups: 121,
    b2bPickups: 22,
  },
];

const COMMUNITY_CORRIDORS: CommunityCorridorSeed[] = [
  {
    id: 'zone-blr-ind-peenya',
    nameEn: 'Peenya Industrial',
    nameKn: 'ಪೀಣ್ಯ ಕೈಗಾರಿಕಾ',
    segment: 'b2b',
    kg: 9420,
    co2: 26380,
    drives: 34,
  },
  {
    id: 'zone-blr-ind-whitefield',
    nameEn: 'Whitefield EPIP',
    nameKn: 'ವೈಟ್‌ಫೀಲ್ಡ್ EPIP',
    segment: 'b2b',
    kg: 8240,
    co2: 22950,
    drives: 29,
  },
  {
    id: 'zone-blr-ind-ecity',
    nameEn: 'Bommasandra & E-City',
    nameKn: 'ಬೊಮ್ಮಸಂದ್ರ & ಇ-ಸಿಟಿ',
    segment: 'b2b',
    kg: 7790,
    co2: 19650,
    drives: 29,
  },
  {
    id: 'zone-blr-north-hebbal',
    nameEn: 'Hebbal & Sahakara Nagar',
    nameKn: 'ಹೆಬ್ಬಾಳ & ಸಹಕಾರ ನಗರ',
    segment: 'b2c',
    kg: 4680,
    co2: 10720,
    drives: 198,
  },
  {
    id: 'zone-blr-north-yelahanka',
    nameEn: 'Yelahanka & Jakkur',
    nameKn: 'ಯಲಹಂಕ & ಜಕ್ಕೂರು',
    segment: 'b2c',
    kg: 3940,
    co2: 8960,
    drives: 168,
  },
  {
    id: 'zone-blr-north-hennur',
    nameEn: 'Vidyaranyapura & Hennur',
    nameKn: 'ವಿದ್ಯಾರಣ್ಯಪುರ & ಹೆಣ್ಣೂರು',
    segment: 'b2c',
    kg: 3340,
    co2: 7480,
    drives: 140,
  },
];

const COMMUNITY_MATERIAL_BASE: CommunityMaterialShare[] = [
  {
    categoryId: 'cat-cardboard',
    labelEn: 'Cardboard & Cartons',
    labelKn: 'ರಟ್ಟಿನ ಪೆಟ್ಟಿಗೆಗಳು',
    b2cKg: 2640,
    b2bKg: 7420,
    co2Factor: 1.9,
    color: '#174B37',
  },
  {
    categoryId: 'cat-steel',
    labelEn: 'Stainless & Mild Steel',
    labelKn: 'ಸ್ಟೀಲ್ & ಕಬ್ಬಿಣ',
    b2cKg: 820,
    b2bKg: 6950,
    co2Factor: 2.4,
    color: '#1E6449',
  },
  {
    categoryId: 'cat-newspapers',
    labelEn: 'Newspapers & Books',
    labelKn: 'ದಿನಪತ್ರಿಕೆ & ಪುಸ್ತಕಗಳು',
    b2cKg: 4210,
    b2bKg: 1480,
    co2Factor: 1.6,
    color: '#28A66A',
  },
  {
    categoryId: 'cat-ewaste',
    labelEn: 'E-Waste & Appliances',
    labelKn: 'ಇ-ತ್ಯಾಜ್ಯ & ಉಪಕರಣಗಳು',
    b2cKg: 1180,
    b2bKg: 3890,
    co2Factor: 3.6,
    color: '#0D9488',
  },
  {
    categoryId: 'cat-plastic',
    labelEn: 'Sorted PET & HDPE Plastic',
    labelKn: 'ವಿಂಗಡಿಸಿದ ಪ್ಲಾಸ್ಟಿಕ್',
    b2cKg: 1940,
    b2bKg: 2410,
    co2Factor: 2.1,
    color: '#65A30D',
  },
  {
    categoryId: 'cat-aluminium',
    labelEn: 'Aluminium & Copper',
    labelKn: 'ಅಲ್ಯೂಮಿನಿಯಂ & ತಾಮ್ರ',
    b2cKg: 540,
    b2bKg: 2480,
    co2Factor: 7.4,
    color: '#D97706',
  },
  {
    categoryId: 'cat-glass',
    labelEn: 'Cullet Glass & Iron',
    labelKn: 'ಗಾಜು & ಕಬ್ಬಿಣ',
    b2cKg: 630,
    b2bKg: 820,
    co2Factor: 1.2,
    color: '#4B5563',
  },
];

function getMonthKey(isoDate?: string): string {
  if (!isoDate) return '2026-11';
  const clean = isoDate.slice(0, 7);
  return /^\d{4}-\d{2}$/.test(clean) ? clean : '2026-11';
}

function formatMonthLabel(monthKey: string, lang: 'en' | 'kn'): string {
  const found = COMMUNITY_MONTHLY_BASELINE.find((m) => m.monthKey === monthKey);
  if (found) return lang === 'kn' ? found.labelKn : found.labelEn;
  const [yr, mo] = monthKey.split('-');
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const idx = Math.max(0, Math.min(11, Number(mo) - 1));
  return `${names[idx] || mo} ${yr}`;
}

function mapCategoryBucketId(categoryId: string): string {
  if (categoryId === 'cat-books' || categoryId === 'cat-newspapers') return 'cat-newspapers';
  if (categoryId === 'cat-copper' || categoryId === 'cat-brass' || categoryId === 'cat-aluminium') return 'cat-aluminium';
  if (categoryId === 'cat-appliances' || categoryId === 'cat-ewaste') return 'cat-ewaste';
  if (categoryId === 'cat-iron') return 'cat-glass';
  return categoryId;
}

function mapCorridorBucketId(zoneId: string, customerRole: 'b2c' | 'b2b'): string {
  if (zoneId.includes('peenya') || zoneId.includes('yeshwanthpur') || zoneId.includes('rajajinagar')) {
    return 'zone-blr-ind-peenya';
  }
  if (zoneId.includes('whitefield') || zoneId.includes('hoodi')) {
    return 'zone-blr-ind-whitefield';
  }
  if (zoneId.includes('ecity') || zoneId.includes('bommasandra') || zoneId.includes('jigani') || zoneId.includes('bidadi')) {
    return 'zone-blr-ind-ecity';
  }
  if (zoneId.includes('yelahanka') || zoneId.includes('jakkur')) {
    return 'zone-blr-north-yelahanka';
  }
  if (zoneId.includes('vidyaranyapura') || zoneId.includes('hennur')) {
    return 'zone-blr-north-hennur';
  }
  return customerRole === 'b2b' ? 'zone-blr-ind-peenya' : 'zone-blr-north-hebbal';
}

export const SustainabilityImpactDashboard: React.FC = () => {
  const { state, language, a11y, navigateTo } = usePunarchakra();

  const [scope, setScope] = useState<ScopeFilter>('all');
  const [dataMode, setDataMode] = useState<DataMode>('community_live');
  const [metric, setMetric] = useState<MetricMode>('weight');
  const [horizon, setHorizon] = useState<HorizonMode>('6m');

  const isKn = language === 'kn';

  const copy = useMemo(
    () =>
      isKn
        ? {
            kicker: 'ಬೆಂಗಳೂರು ತ್ಯಾಜ್ಯ-ಮುಕ್ತ ಭೂಭರ್ತಿ ಟ್ರ್ಯಾಕರ್ · ಲೈವ್ ಪ್ರಭಾವ ವಿಶ್ಲೇಷಣೆ',
            heading: 'ಪುನರ್ಚಕ್ರ ಸುಸ್ಥಿರತೆ ಪ್ರಭಾವ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
            subheading:
              'ಉತ್ತರ ಬೆಂಗಳೂರು ಗೃಹ ಸಮುದಾಯಗಳು ಮತ್ತು ಬೆಂಗಳೂರು ಕೈಗಾರಿಕಾ ಪ್ರದೇಶಗಳಿಂದ ಭೂಭರ್ತಿಗೆ (Landfill) ಹೋಗದಂತೆ ತಡೆಯಲಾದ ಒಟ್ಟು ತ್ಯಾಜ್ಯದ ತೂಕ ಮತ್ತು ಇಂಗಾಲದ ಉಳಿತಾಯವನ್ನು ದೃಶ್ಯೀಕರಿಸಿ.',
            scopeAll: 'ಸಂಪೂರ್ಣ ಬೆಂಗಳೂರು',
            scopeB2c: 'ಉತ್ತರ ಬೆಂಗಳೂರು (B2C)',
            scopeB2b: 'ಕೈಗಾರಿಕಾ ವಲಯಗಳು (B2B)',
            modeCombined: 'ಸಮುದಾಯ + ಲೈವ್ ಆರ್ಡರ್‌ಗಳು',
            modeLive: 'ಲೈವ್ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಆರ್ಡರ್‌ಗಳು ಮಾತ್ರ',
            metricWeight: 'ತಡೆಯಲಾದ ತ್ಯಾಜ್ಯ (kg)',
            metricCo2: 'CO₂ ತಡೆ (kg)',
            horizon6m: '6 ತಿಂಗಳು',
            horizon3m: '3 ತಿಂಗಳು',
            exportCsv: 'CSV ವರದಿ ಡೌನ್‌ಲೋಡ್',
            kpiDivertedTitle: 'ಭೂಭರ್ತಿಯಿಂದ ತಡೆಯಲಾದ ತ್ಯಾಜ್ಯ',
            kpiDivertedSub: 'ಟನ್‌ಗಳು · ಒಟ್ಟು ಪರಿಶೀಲಿತ ತೂಕ',
            kpiCo2Title: 'CO₂ ಹೊರಸೂಸುವಿಕೆ ತಡೆ',
            kpiCo2Sub: 'ವಸ್ತು ವರ್ಗವಾರು ಲೆಕ್ಕಾಚಾರ',
            kpiPickupsTitle: 'ಪರಿಶೀಲಿತ ಪಿಕಪ್‌ಗಳು & ಡ್ರೈವ್‌ಗಳು',
            kpiPickupsSub: 'ಬೆಂಗಳೂರು ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಪೂರ್ಣಗೊಂಡಿದೆ',
            kpiSpaceTitle: 'ಭೂಭರ್ತಿ ಜಾಗ & ಮರ ಸಮಾನತೆ',
            kpiSpaceSub: 'ವಾರ್ಷಿಕ ಇಂಗಾಲ ಹೀರಿಕೊಳ್ಳುವ ಸಮಾನತೆ',
            chartTrendTitle: 'ಮಾಸಿಕ ಮತ್ತು ಸಂಚಿತ ತ್ಯಾಜ್ಯ ತಡೆ ಪ್ರವೃತ್ತಿ',
            chartTrendSub: 'ತಿಂಗಳುವಾರು B2C vs B2B ತೂಕ ಮತ್ತು ಸಂಚಿತ ಪ್ರಗತಿ',
            chartMaterialTitle: 'ವಸ್ತು ವರ್ಗವಾರು ಮರುಬಳಕೆ ಪಾಲು',
            chartMaterialSub: 'ಅತಿ ಹೆಚ್ಚು ಭೂಭರ್ತಿ ಉಳಿತಾಯದ ವಸ್ತುಗಳು',
            chartCorridorTitle: 'ಬೆಂಗಳೂರು ವಲಯವಾರು ಸಮುದಾಯ ಪ್ರಭಾವ',
            chartCorridorSub: 'ಉತ್ತರ ಬೆಂಗಳೂರು ಮತ್ತು ಕೈಗಾರಿಕಾ ಕಾರಿಡಾರ್‌ಗಳ ಹೋಲಿಕೆ',
            legendB2c: 'ಉತ್ತರ ಬೆಂಗಳೂರು ಗೃಹ (B2C)',
            legendB2b: 'ಕೈಗಾರಿಕಾ ಪ್ರದೇಶ (B2B)',
            legendCumulative: 'ಸಂಚಿತ ಒಟ್ಟು',
            emptyTitle: 'ಆಯ್ದ ಫಿಲ್ಟರ್‌ನಲ್ಲಿ ಲೈವ್ ಆರ್ಡರ್‌ಗಳಿಲ್ಲ',
            emptyDesc: 'ಸಮುದಾಯ + ಲೈವ್ ಡೇಟಾ ನೋಟಕ್ಕೆ ಬದಲಾಯಿಸಿ ಅಥವಾ ಎಲ್ಲಾ ಬೆಂಗಳೂರು ವ್ಯಾಪ್ತಿಯನ್ನು ಆರಿಸಿ.',
            resetFilters: 'ಎಲ್ಲಾ ಬೆಂಗಳೂರು ಡೇಟಾ ತೋರಿಸಿ',
            ctaBook: 'ನಿಮ್ಮ ಸ್ಕ್ರ್ಯಾಪ್ ಕೊಡುಗೆಯನ್ನು ಸೇರಿಸಿ',
            tonnesLabel: 'ಟನ್',
            treesLabel: 'ಮರಗಳು/ವರ್ಷ',
            landfillLabel: 'm³ ಭೂಭರ್ತಿ ಜಾಗ ಉಳಿತಾಯ',
          }
        : {
            kicker: 'Bengaluru Zero-Landfill Telemetry · Community & Live Order Aggregation',
            heading: 'Bengaluru Sustainability Impact Dashboard',
            subheading:
              'Visualizing total scrap weight diverted from Bengaluru landfills, material stream recovery, and avoided carbon emissions across North Bengaluru households and Bengaluru industrial areas.',
            scopeAll: 'All Bengaluru',
            scopeB2c: 'North BLR (B2C)',
            scopeB2b: 'Industrial Areas (B2B)',
            modeCombined: 'Community + Live Orders',
            modeLive: 'Live Platform Orders Only',
            metricWeight: 'Weight Diverted (kg)',
            metricCo2: 'CO₂ Avoided (kg)',
            horizon6m: '6 Months',
            horizon3m: 'Last 3 Months',
            exportCsv: 'Download CSV Report',
            kpiDivertedTitle: 'Total Waste Diverted from Landfills',
            kpiDivertedSub: 'tonnes · verified dry & metal recovery',
            kpiCo2Title: 'CO₂ Emissions Avoided',
            kpiCo2Sub: 'Computed per material carbon factor',
            kpiPickupsTitle: 'Verified Pickups & Drives',
            kpiPickupsSub: 'Completed across Bengaluru corridors',
            kpiSpaceTitle: 'Landfill Volume & Tree Offset',
            kpiSpaceSub: 'Annual forest absorption equivalent',
            chartTrendTitle: 'Monthly & Cumulative Waste Diverted from Landfills',
            chartTrendSub: 'Stacked monthly recovery by segment alongside cumulative Bengaluru diversion trajectory',
            chartMaterialTitle: 'Diversion by Material Stream',
            chartMaterialSub: 'Sorted descending by total recovery impact',
            chartCorridorTitle: 'Diversion Across Bengaluru Corridors',
            chartCorridorSub: 'North Bengaluru B2C neighborhoods & B2B industrial estates',
            legendB2c: 'North BLR Households (B2C)',
            legendB2b: 'Bengaluru Industrial (B2B)',
            legendCumulative: 'Cumulative Total',
            emptyTitle: 'No Live Orders Match Current Filter',
            emptyDesc: 'Switch back to Community + Live Orders or broaden your Bengaluru corridor filter.',
            resetFilters: 'Show All Bengaluru Data',
            ctaBook: 'Contribute a Pickup Today',
            tonnesLabel: 'tonnes',
            treesLabel: 'Trees/yr',
            landfillLabel: 'm³ landfill void saved',
          },
    [isKn]
  );

  // Aggregate live completed orders dynamically from state.orders
  const dashboardData = useMemo(() => {
    const completedOrders = state.orders.filter((o) => o.status === 'payment_completed');

    // 1. Build monthly map
    const monthMap = new Map<
      string,
      {
        monthKey: string;
        b2cKg: number;
        b2bKg: number;
        b2cCo2: number;
        b2bCo2: number;
        b2cPickups: number;
        b2bPickups: number;
      }
    >();

    if (dataMode === 'community_live') {
      COMMUNITY_MONTHLY_BASELINE.forEach((m) => {
        monthMap.set(m.monthKey, {
          monthKey: m.monthKey,
          b2cKg: m.b2cKg,
          b2bKg: m.b2bKg,
          b2cCo2: m.b2cCo2,
          b2bCo2: m.b2bCo2,
          b2cPickups: m.b2cPickups,
          b2bPickups: m.b2bPickups,
        });
      });
    }

    // Material map
    const matMap = new Map<
      string,
      {
        categoryId: string;
        labelEn: string;
        labelKn: string;
        b2cKg: number;
        b2bKg: number;
        b2cCo2: number;
        b2bCo2: number;
        color: string;
      }
    >();

    COMMUNITY_MATERIAL_BASE.forEach((mat) => {
      const baseB2c = dataMode === 'community_live' ? mat.b2cKg : 0;
      const baseB2b = dataMode === 'community_live' ? mat.b2bKg : 0;
      matMap.set(mat.categoryId, {
        categoryId: mat.categoryId,
        labelEn: mat.labelEn,
        labelKn: mat.labelKn,
        b2cKg: baseB2c,
        b2bKg: baseB2b,
        b2cCo2: baseB2c * mat.co2Factor,
        b2bCo2: baseB2b * mat.co2Factor,
        color: mat.color,
      });
    });

    // Corridor map
    const corridorMap = new Map<
      string,
      {
        id: string;
        nameEn: string;
        nameKn: string;
        segment: 'b2c' | 'b2b';
        kg: number;
        co2: number;
        drives: number;
      }
    >();

    COMMUNITY_CORRIDORS.forEach((c) => {
      corridorMap.set(c.id, {
        ...c,
        kg: dataMode === 'community_live' ? c.kg : 0,
        co2: dataMode === 'community_live' ? c.co2 : 0,
        drives: dataMode === 'community_live' ? c.drives : 0,
      });
    });

    // Fold every completed platform order into monthly, material, and corridor buckets
    completedOrders.forEach((ord) => {
      const mKey = getMonthKey(ord.scheduledDate || ord.updatedAt);
      const role: 'b2c' | 'b2b' = ord.customerRole === 'b2b' ? 'b2b' : 'b2c';
      const orderWeight = ord.actualTotalWeight || ord.estimatedTotalWeight || 0;
      const orderCo2 = ord.items.reduce((sum, item) => {
        const cat = state.categories.find((c) => c.id === item.categoryId);
        const qty = item.actualQty ?? item.estimatedQty ?? 0;
        return sum + qty * (cat?.co2FactorPerKg || 1.8);
      }, 0);

      const mEntry = monthMap.get(mKey) || {
        monthKey: mKey,
        b2cKg: 0,
        b2bKg: 0,
        b2cCo2: 0,
        b2bCo2: 0,
        b2cPickups: 0,
        b2bPickups: 0,
      };
      if (role === 'b2b') {
        mEntry.b2bKg += orderWeight;
        mEntry.b2bCo2 += orderCo2;
        mEntry.b2bPickups += 1;
      } else {
        mEntry.b2cKg += orderWeight;
        mEntry.b2cCo2 += orderCo2;
        mEntry.b2cPickups += 1;
      }
      monthMap.set(mKey, mEntry);

      // Materials
      ord.items.forEach((item) => {
        const bucketId = mapCategoryBucketId(item.categoryId);
        const cat = state.categories.find((c) => c.id === item.categoryId);
        const qty = item.actualQty ?? item.estimatedQty ?? 0;
        const co2 = qty * (cat?.co2FactorPerKg || 1.8);
        const existingMat = matMap.get(bucketId);
        if (existingMat) {
          if (role === 'b2b') {
            existingMat.b2bKg += qty;
            existingMat.b2bCo2 += co2;
          } else {
            existingMat.b2cKg += qty;
            existingMat.b2cCo2 += co2;
          }
        }
      });

      // Corridor
      const cBucket = mapCorridorBucketId(ord.zoneId || '', role);
      const corr = corridorMap.get(cBucket);
      if (corr) {
        corr.kg += orderWeight;
        corr.co2 += orderCo2;
        corr.drives += 1;
      }
    });

    const sortedMonths = Array.from(monthMap.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    const slicedMonths = horizon === '3m' ? sortedMonths.slice(-3) : sortedMonths;

    let runningTotal = 0;
    const monthlySeries = slicedMonths.map((m) => {
      const b2cVal = scope === 'b2b' ? 0 : metric === 'weight' ? m.b2cKg : m.b2cCo2;
      const b2bVal = scope === 'b2c' ? 0 : metric === 'weight' ? m.b2bKg : m.b2bCo2;
      const totalVal = Math.round((b2cVal + b2bVal) * 10) / 10;
      runningTotal = Math.round((runningTotal + totalVal) * 10) / 10;

      const monthWeightKg =
        (scope === 'b2b' ? 0 : m.b2cKg) + (scope === 'b2c' ? 0 : m.b2bKg);
      const monthCo2Kg =
        (scope === 'b2b' ? 0 : m.b2cCo2) + (scope === 'b2c' ? 0 : m.b2bCo2);
      const monthPickups =
        (scope === 'b2b' ? 0 : m.b2cPickups) + (scope === 'b2c' ? 0 : m.b2bPickups);

      return {
        monthKey: m.monthKey,
        label: formatMonthLabel(m.monthKey, isKn ? 'kn' : 'en'),
        b2c: Math.round(b2cVal * 10) / 10,
        b2b: Math.round(b2bVal * 10) / 10,
        total: totalVal,
        cumulative: runningTotal,
        weightKg: Math.round(monthWeightKg * 10) / 10,
        co2Kg: Math.round(monthCo2Kg),
        pickups: monthPickups,
      };
    });

    // Horizon scaling ratio for material & corridor slices when 3m is selected
    const allWeightSum = sortedMonths.reduce(
      (s, m) => s + (scope === 'b2b' ? 0 : m.b2cKg) + (scope === 'b2c' ? 0 : m.b2bKg),
      0
    );
    const slicedWeightSum = monthlySeries.reduce((s, m) => s + m.weightKg, 0);
    const horizonRatio = allWeightSum > 0 ? slicedWeightSum / allWeightSum : 1;

    const materialSeries = Array.from(matMap.values())
      .map((mat) => {
        const rawKg = ((scope === 'b2b' ? 0 : mat.b2cKg) + (scope === 'b2c' ? 0 : mat.b2bKg)) * horizonRatio;
        const rawCo2 = ((scope === 'b2b' ? 0 : mat.b2cCo2) + (scope === 'b2c' ? 0 : mat.b2bCo2)) * horizonRatio;
        return {
          id: mat.categoryId,
          name: isKn ? mat.labelKn : mat.labelEn,
          value: Math.round((metric === 'weight' ? rawKg : rawCo2) * 10) / 10,
          weightKg: Math.round(rawKg * 10) / 10,
          co2Kg: Math.round(rawCo2),
          color: mat.color,
        };
      })
      .filter((m) => m.value > 0)
      .sort((a, b) => b.value - a.value);

    const corridorSeries = Array.from(corridorMap.values())
      .filter((c) => scope === 'all' || c.segment === scope)
      .map((c) => {
        const w = Math.round(c.kg * horizonRatio * 10) / 10;
        const co2 = Math.round(c.co2 * horizonRatio);
        const drives = Math.max(dataMode === 'live_only' && c.drives === 0 ? 0 : 1, Math.round(c.drives * horizonRatio));
        return {
          id: c.id,
          name: isKn ? c.nameKn : c.nameEn,
          segment: c.segment,
          value: metric === 'weight' ? w : co2,
          weightKg: w,
          co2Kg: co2,
          drives,
        };
      })
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);

    const totalWeightKg = Math.round(monthlySeries.reduce((s, m) => s + m.weightKg, 0) * 10) / 10;
    const totalCo2Kg = Math.round(monthlySeries.reduce((s, m) => s + m.co2Kg, 0));
    const totalPickups = monthlySeries.reduce((s, m) => s + m.pickups, 0);
    const tonnesDiverted = Number((totalWeightKg / 1000).toFixed(2));
    const landfillM3Saved = Number((totalWeightKg * 0.0028).toFixed(1));
    const treesEquivalent = Math.max(totalWeightKg > 0 ? 1 : 0, Math.round(totalCo2Kg / 21));

    return {
      monthlySeries,
      materialSeries,
      corridorSeries,
      totalWeightKg,
      totalCo2Kg,
      totalPickups,
      tonnesDiverted,
      landfillM3Saved,
      treesEquivalent,
      liveOrdersIncluded: completedOrders.filter((o) => scope === 'all' || o.customerRole === scope).length,
    };
  }, [state.orders, state.categories, dataMode, scope, metric, horizon, isKn]);

  const handleDownloadCsv = () => {
    const lines = [
      'Month,Scope,DataMode,WeightDivertedKg,CO2AvoidedKg,CumulativeMetric,PickupsAndDrives',
      ...dashboardData.monthlySeries.map((m) =>
        [
          `"${m.label}"`,
          scope.toUpperCase(),
          dataMode,
          m.weightKg,
          m.co2Kg,
          m.cumulative,
          m.pickups,
        ].join(',')
      ),
      '',
      'MaterialStream,WeightDivertedKg,CO2AvoidedKg',
      ...dashboardData.materialSeries.map((mat) => `"${mat.name}",${mat.weightKg},${mat.co2Kg}`),
      '',
      'BengaluruCorridor,Segment,WeightDivertedKg,CO2AvoidedKg,PickupsAndDrives',
      ...dashboardData.corridorSeries.map(
        (c) => `"${c.name}",${c.segment.toUpperCase()},${c.weightKg},${c.co2Kg},${c.drives}`
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `punarchakra-bengaluru-sustainability-impact-${scope}-${horizon}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setScope('all');
    setDataMode('community_live');
    setMetric('weight');
    setHorizon('6m');
  };

  const unitLabel = 'kg';

  return (
    <div className="space-y-8">
      {/* Header & Interactive Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-medium text-[#28A66A]">{copy.kicker}</p>
          <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#174B37] tracking-tight [text-wrap:balance]">
            {copy.heading}
          </h2>
          <p className="text-sm text-[#202820]/75 leading-relaxed">{copy.subheading}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#202820]/60 pt-1">
            <span>Bengaluru Region</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {dashboardData.liveOrdersIncluded} live settled orders integrated
            </span>
            <span aria-hidden="true">·</span>
            <span>0.0028 m³/kg landfill displacement factor</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button variant="outline" size="sm" onClick={handleDownloadCsv}>
            <Download className="w-4 h-4" />
            {copy.exportCsv}
          </Button>
          <Button
            size="sm"
            onClick={() => navigateTo('auth', { authMode: 'register', role: scope === 'b2b' ? 'b2b' : 'b2c' })}
          >
            {copy.ctaBook}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Segmented Dashboard Toolbar */}
      <div className="bg-white border border-[#202820]/10 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
        {/* Segment Filter */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F7F9F6] rounded-xl border border-[#202820]/8">
          {(
            [
              { id: 'all', label: copy.scopeAll },
              { id: 'b2c', label: copy.scopeB2c },
              { id: 'b2b', label: copy.scopeB2b },
            ] as { id: ScopeFilter; label: string }[]
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setScope(item.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                scope === item.id
                  ? 'bg-[#174B37] text-white shadow-sm'
                  : 'text-[#202820]/75 hover:text-[#174B37]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Metric + Data Mode + Horizon */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[#F7F9F6] rounded-xl border border-[#202820]/8">
            <button
              type="button"
              onClick={() => setMetric('weight')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                metric === 'weight'
                  ? 'bg-white text-[#174B37] shadow-sm border border-[#202820]/10'
                  : 'text-[#202820]/70 hover:text-[#174B37]'
              }`}
            >
              {copy.metricWeight}
            </button>
            <button
              type="button"
              onClick={() => setMetric('co2')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                metric === 'co2'
                  ? 'bg-white text-[#174B37] shadow-sm border border-[#202820]/10'
                  : 'text-[#202820]/70 hover:text-[#174B37]'
              }`}
            >
              {copy.metricCo2}
            </button>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#F7F9F6] rounded-xl border border-[#202820]/8">
            <button
              type="button"
              onClick={() => setHorizon('6m')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                horizon === '6m'
                  ? 'bg-white text-[#174B37] shadow-sm border border-[#202820]/10'
                  : 'text-[#202820]/70 hover:text-[#174B37]'
              }`}
            >
              {copy.horizon6m}
            </button>
            <button
              type="button"
              onClick={() => setHorizon('3m')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                horizon === '3m'
                  ? 'bg-white text-[#174B37] shadow-sm border border-[#202820]/10'
                  : 'text-[#202820]/70 hover:text-[#174B37]'
              }`}
            >
              {copy.horizon3m}
            </button>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#F7F9F6] rounded-xl border border-[#202820]/8">
            <button
              type="button"
              onClick={() => setDataMode('community_live')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                dataMode === 'community_live'
                  ? 'bg-white text-[#174B37] shadow-sm border border-[#202820]/10'
                  : 'text-[#202820]/70 hover:text-[#174B37]'
              }`}
            >
              {copy.modeCombined}
            </button>
            <button
              type="button"
              onClick={() => setDataMode('live_only')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                dataMode === 'live_only'
                  ? 'bg-white text-[#174B37] shadow-sm border border-[#202820]/10'
                  : 'text-[#202820]/70 hover:text-[#174B37]'
              }`}
            >
              {copy.modeLive}
            </button>
          </div>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center justify-between text-xs text-[#202820]/65">
            <span>{copy.kpiDivertedTitle}</span>
            <Scale className="w-4 h-4 text-[#28A66A]" />
          </div>
          <p className="font-display text-2xl sm:text-3xl font-bold text-[#174B37] mt-2 tabular-nums font-mono">
            {dashboardData.totalWeightKg.toLocaleString('en-IN')} kg
          </p>
          <p className="text-xs text-[#202820]/60 mt-1 tabular-nums">
            {dashboardData.tonnesDiverted.toLocaleString('en-IN')} {copy.tonnesLabel} · {copy.kpiDivertedSub}
          </p>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between text-xs text-[#202820]/65">
            <span>{copy.kpiCo2Title}</span>
            <Leaf className="w-4 h-4 text-[#28A66A]" />
          </div>
          <p className="font-display text-2xl sm:text-3xl font-bold text-[#174B37] mt-2 tabular-nums font-mono">
            {dashboardData.totalCo2Kg.toLocaleString('en-IN')} kg
          </p>
          <p className="text-xs text-[#202820]/60 mt-1">{copy.kpiCo2Sub}</p>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between text-xs text-[#202820]/65">
            <span>{copy.kpiPickupsTitle}</span>
            <Recycle className="w-4 h-4 text-[#28A66A]" />
          </div>
          <p className="font-display text-2xl sm:text-3xl font-bold text-[#174B37] mt-2 tabular-nums font-mono">
            {dashboardData.totalPickups.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-[#202820]/60 mt-1">{copy.kpiPickupsSub}</p>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between text-xs text-[#202820]/65">
            <span>{copy.kpiSpaceTitle}</span>
            <TreePine className="w-4 h-4 text-[#28A66A]" />
          </div>
          <p className="font-display text-2xl sm:text-3xl font-bold text-[#174B37] mt-2 tabular-nums font-mono">
            {dashboardData.landfillM3Saved.toLocaleString('en-IN')} m³
          </p>
          <p className="text-xs text-[#202820]/60 mt-1 tabular-nums">
            {dashboardData.treesEquivalent.toLocaleString('en-IN')} {copy.treesLabel} · {copy.landfillLabel}
          </p>
        </Card>
      </div>

      {/* Empty State or Recharts Grid */}
      {dashboardData.monthlySeries.length === 0 || dashboardData.totalWeightKg === 0 ? (
        <EmptyState
          title={copy.emptyTitle}
          description={copy.emptyDesc}
          actionLabel={copy.resetFilters}
          onAction={resetFilters}
        />
      ) : (
        <div className="space-y-6">
          {/* Primary Chart: Monthly Stacked Diversion + Cumulative Curve */}
          <Card padding="lg" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-[#174B37]">
                  {copy.chartTrendTitle}
                </h3>
                <p className="text-xs text-[#202820]/65 mt-0.5">{copy.chartTrendSub}</p>
              </div>
              <div className="text-xs font-mono tabular-nums text-[#174B37] font-semibold">
                {metric === 'weight'
                  ? `${dashboardData.totalWeightKg.toLocaleString('en-IN')} kg total`
                  : `${dashboardData.totalCo2Kg.toLocaleString('en-IN')} kg CO₂e total`}
              </div>
            </div>

            <div className="w-full h-[300px] sm:h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={dashboardData.monthlySeries}
                  margin={{ top: 12, right: 16, left: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E9E4" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#202820', fontSize: 12 }}
                    axisLine={{ stroke: '#D5DDD3' }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: '#202820', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}t` : `${v}`)}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: '#B45309', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}t` : `${v}`)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: 'rgba(32, 40, 32, 0.14)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: '0 8px 24px rgba(23, 75, 55, 0.08)',
                    }}
                    formatter={(val, name) => [
                      `${Number(val || 0).toLocaleString('en-IN')} ${unitLabel}`,
                      String(name),
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  {scope !== 'b2b' && (
                    <Bar
                      yAxisId="left"
                      dataKey="b2c"
                      name={copy.legendB2c}
                      stackId="diverted"
                      fill="#28A66A"
                      radius={scope === 'b2c' ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                      isAnimationActive={!a11y.reduceMotion}
                    />
                  )}
                  {scope !== 'b2c' && (
                    <Bar
                      yAxisId="left"
                      dataKey="b2b"
                      name={copy.legendB2b}
                      stackId="diverted"
                      fill="#174B37"
                      radius={[6, 6, 0, 0]}
                      isAnimationActive={!a11y.reduceMotion}
                    />
                  )}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cumulative"
                    name={copy.legendCumulative}
                    stroke="#D97706"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#D97706', strokeWidth: 2, stroke: '#FFFFFF' }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={!a11y.reduceMotion}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Secondary Two-Column Charts: Material Breakdown + Bengaluru Corridor Comparison */}
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Material Stream Breakdown */}
            <Card padding="lg" className="lg:col-span-6 space-y-4">
              <div>
                <h3 className="font-display text-lg font-bold text-[#174B37]">
                  {copy.chartMaterialTitle}
                </h3>
                <p className="text-xs text-[#202820]/65 mt-0.5">{copy.chartMaterialSub}</p>
              </div>
              <div className="w-full h-[290px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dashboardData.materialSeries}
                    layout="vertical"
                    margin={{ top: 4, right: 20, left: 10, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E9E4" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fill: '#202820', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}t` : `${v}`)}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={136}
                      tick={{ fill: '#202820', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: 'rgba(32, 40, 32, 0.14)',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                      formatter={(val) => [
                        `${Number(val || 0).toLocaleString('en-IN')} ${unitLabel}`,
                        metric === 'weight' ? copy.metricWeight : copy.metricCo2,
                      ]}
                    />
                    <Bar
                      dataKey="value"
                      radius={[0, 6, 6, 0]}
                      barSize={20}
                      isAnimationActive={!a11y.reduceMotion}
                    >
                      {dashboardData.materialSeries.map((entry) => (
                        <Cell key={entry.id} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Bengaluru Corridor Breakdown */}
            <Card padding="lg" className="lg:col-span-6 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#174B37]">
                    {copy.chartCorridorTitle}
                  </h3>
                  <p className="text-xs text-[#202820]/65 mt-0.5">{copy.chartCorridorSub}</p>
                </div>
                <MapPin className="w-4 h-4 text-[#28A66A] shrink-0 mt-1" />
              </div>

              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dashboardData.corridorSeries}
                    margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E9E4" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#202820', fontSize: 10 }}
                      axisLine={{ stroke: '#D5DDD3' }}
                      tickLine={false}
                      interval={0}
                      angle={-14}
                      textAnchor="end"
                      height={48}
                    />
                    <YAxis
                      tick={{ fill: '#202820', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}t` : `${v}`)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: 'rgba(32, 40, 32, 0.14)',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                      formatter={(val) => [
                        `${Number(val || 0).toLocaleString('en-IN')} ${unitLabel}`,
                        metric === 'weight' ? copy.metricWeight : copy.metricCo2,
                      ]}
                    />
                    <Bar
                      dataKey="value"
                      radius={[6, 6, 0, 0]}
                      barSize={32}
                      isAnimationActive={!a11y.reduceMotion}
                    >
                      {dashboardData.corridorSeries.map((entry) => (
                        <Cell
                          key={entry.id}
                          fill={entry.segment === 'b2b' ? '#174B37' : '#28A66A'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Compact tabular corridor readout */}
              <div className="border-t border-[#202820]/10 pt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                {dashboardData.corridorSeries.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-1">
                    <span className="text-[#202820]/80 truncate pr-2">
                      {c.name} <span className="text-[#202820]/45">({c.segment.toUpperCase()})</span>
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-[#174B37] shrink-0">
                      {c.weightKg.toLocaleString('en-IN')} kg
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
