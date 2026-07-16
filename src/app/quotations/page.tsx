'use client'

import { Fragment, useEffect, useState } from 'react'
import { getNormalizedFieldValue, normalizeCapitalizedText } from '@/lib/text-format'

const furnitureDescriptionOptionsByArea: Record<string, string[]> = {
  'Living Room': [
    'Tv Unit',
    'Sofa 2 +1',
    'L shape Sofa',
    'TV unit Paneling',
    'TV unit Drawer box',
    'Sofa Back Paneling',
    'TV unit storage box',
    'Mandir',
  ],
  'Entrance Area': [
    'Shoe Rack',
    'Entrance lobby',
    'Entrance Paneling',
    'Entrance wall area',
  ],
  'Master Bed Room': [
    'Wardrob Sliding Doors',
    'Wardrob with Opening Doors',
    'Side Tables',
    'Queen Size Bed',
    'King Size Bed',
    'Bed Back Head Board',
    'Bed Back Paneling',
    'Dressing Table',
    'Dressing Table box',
    'Window Sitting',
    'Loft',
    'TV unit',
  ],
  'Kids Room': [
    'Wardrob Sliding Doors',
    'Wardrob with Opening Doors',
    'Side Tables',
    'Queen Size Bed',
    'King Size Bed',
    'Bed Back Head Board',
    'Bed Back Paneling',
    'Dressing Table',
    'Dressing Table box',
    'Window Sitting',
    'Loft',
    'TV unit',
  ],
  'Guest Bed Room': [
    'Wardrob Sliding Doors',
    'Wardrob with Opening Doors',
    'Side Tables',
    'Queen Size Bed',
    'King Size Bed',
    'Bed Back Head Board',
    'Bed Back Paneling',
    'Dressing Table',
    'Dressing Table box',
    'Window Sitting',
    'Loft',
    'TV unit',
  ],
  Kitchen: [
    'Loft L shape',
    'Krokery Unit',
    'Tandom Drawers',
    'SS Drawers',
    'Oven Unit',
    'Trolly Shutters',
    'Loft C shape',
  ],
}
const areaOptions = [
  ...Object.keys(furnitureDescriptionOptionsByArea),
  'Dining Area',
  'Balcony',
]
const categoryOptions = ['Painting', 'Furniture', 'Electrical', 'POP', 'Flooring', 'Lighting', 'Decor', 'Other']
const DEFAULT_EXECUTION_FEE_PERCENT = 6
const COMPANY_DETAILS = {
  title: 'Space Shashtra Interiors',
  proprietor: 'Prop : Rajshree S. Bagul.',
  address: 'Dynasty Society, Near Chhatrapati Chowk, Kaspate Waste, Wakad Pune. 411057',
  mobile: '7775000900',
}
const PAYMENT_DETAILS = {
  accountName: 'Space Shashtra Interiors',
  bankAccount: 'Axis Bank - A/C No: 924020031966288',
  ifsc: 'UTIB0001893',
  upi: 'spaceshashtradrive-1@okaxis',
  gpayPhonePe: '7775000900',
}
const FULL_SCOPE_CATEGORY_TITLES: Record<string, string> = {
  pop: 'POP Work',
  electrical: 'Electrical Work',
  painting: 'Painting Work',
}
const FULL_SCOPE_CATEGORY_ORDER = ['pop', 'electrical', 'painting']
const FURNITURE_AREA_ORDER = [
  'entrance area',
  'living room',
  'master bed room',
  'guest bed room',
  'kids room',
]

// Color scheme for room identification
const ROOM_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'entrance area': { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-800' },
  'living room': { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800' },
  'master bed room': { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-800' },
  'guest bed room': { bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-800' },
  'kids room': { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-800' },
  'dining area': { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-800' },
  'balcony': { bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-800' },
  'kitchen': { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800' },
  'full flat': { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-800' },
}

const QUOTATION_NOTES = [
  'Rates are based on the current discussion, floor plan, and site conditions available at the time of quotation.',
  'Final quantities and execution values may be refined after approved design, site measurement, and material selection.',
  'Any item, finish, or accessory outside this quotation scope will be billed separately as per actual.',
  'Shade, laminate, hardware, lighting, and decorative finish selections may change the final project value.',
]
const QUOTATION_TERMS = [
  'Order once placed cannot be cancelled.',
  'Payments must be made within the agreed slots; delays may affect the progress of work.',
  'Cost will be extra other than quotation products.',
  'Payment: 20% quotation finalization, 50% advance, 20% after furniture structure 5% before painting 5% handover day(compulsory)',
  'Payments must be made within the agreed slots; delays may affect the progress of work.',
  'Delivery Time: Depends on order, Revised delivery dates once order is confirmed.(material order)',
  'Quotation Validity: 15 days from the date of quotation.',
  'All Hardware will be Godrej and onyx',
  'After completion the projects Entire flat basic cleaning in our scope & deep cleaning in client scope.',
  'Additional item/Non-quoted item will be charged extra as per actual.',
  'Quantity will be measured as per actual on site.',
  'We have considered all the basic rates (as mentioned in quote) in this budget, If the selection is out of this budget then the client will have to pay the above rate different only.',
  'Plywood will be alternate Garjan face and inner outer laminate will be 1 mm thickness.',
  'If any changes done after cost finalisation it will be charged accordingly.',
  'Delay of payment will increase the working days.',
  'If any design or finishes change done directly on site after 3D views finalisation designer is not responsible for the final outcome.',
  'All the decorative items in 3D views are for reference except the considered in quotation',
  'Items purchased form market like decorative article, decorative lights, etc will be charged as per its actual market rate, these rates are not considered in the above quotation.',
  'Society permission if any needed will be in clients scope',
  'if site stopped or delayed from client and exceeds beyond 2 months there will be hike in quotation',
  "We don't share any type of design via what's app, email or any type of digital platform.",
  'Bathroom accessories, Electrical fittings (Fan, Chandeliers), Curtain rods, Extra drillings will cost extra at actual',
  'All Drawers channels will be non- soft close.',
  'The client must always interact with our workers in a respectful and professional manner.',
  'In case the lift is unavailable or unsuitable, client shall bear the mathadi charges for manual shifting.',
  'Client must ensure proper site access, electricity, water and working permissions during working hours.',
  'Any work not mentioned in the quotation will be considered as extra and charged separately.',
  'The company reserves the right to use site photographs for portfolio and marketing purposes.',
  'Any changes after design finalization will be charged extra and may affect delivery timelines',
  'Order once confirmed cannot be cancelled. If cancelled during execution, 10% cancellation charges will be applicable. Advance payment is non-refundable.',
]

interface QuotationItem {
  id?: string
  area: string
  category: string
  description: string
  quantity: string
  lengthIn: string
  widthIn: string
  lengthCm?: number | null
  widthCm?: number | null
  areaSqFt?: number | null
  rate: string
  total: number
  manualTotal?: boolean
}

interface Quotation {
  id: string
  quotationNo: string
  amount: number
  executionFeePercent?: number
  status: string
  issueDate: string
  clientId: string
  projectId: string
  notes?: string
  client: {
    firstName: string
    lastName: string
    address?: string
  }
  project?: {
    name: string
    address?: string
    areaSqFt?: number
  }
  items: QuotationItem[]
}

interface Client {
  id: string
  firstName: string
  lastName: string
}

interface Project {
  id: string
  name: string
}

interface ImportedQuotationPreview {
  quotationNo: string
  clientName: string
  projectName: string
  notes: string
  warnings: string[]
  items: QuotationItem[]
}

interface ComputedQuotationItem {
  id?: string
  area: string
  category: string
  description: string
  quantity: number
  lengthIn: number
  widthIn: number
  unitValue: number
  rate: number
  total: number
}

interface QuotationSection {
  key: string
  title: string
  items?: ComputedQuotationItem[]
  areaGroups?: {
    area: string
    items: ComputedQuotationItem[]
  }[]
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

const formatOptionalNumber = (value: number) => (value > 0 ? value.toFixed(2).replace(/\.00$/, '') : '-')

const formatDisplayDate = (value: string) =>
  new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const formatCurrencyWithSymbol = (amount: number) => `₹${formatCurrency(amount)}`

const getQuotationNoteLines = (customNotes?: string) => {
  const notes = [...QUOTATION_NOTES]
  if (customNotes?.trim()) {
    notes.push(customNotes.trim())
  }
  return notes
}

const normalizeLookupValue = (value?: string | null) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')

const isFurnitureCategory = (category: string) => category.trim().toLowerCase() === 'furniture'
const furnitureAreaAliases: Record<string, string> = {
  'master bedroom': 'Master Bed Room',
  'guest bedroom': 'Guest Bed Room',
  'children bedroom': 'Kids Room',
  'kids bedroom': 'Kids Room',
  entrance: 'Entrance Area',
}
const getCanonicalFurnitureArea = (area?: string | null) => {
  const normalizedArea = normalizeLookupValue(area)
  const aliasedArea = furnitureAreaAliases[normalizedArea]
  if (aliasedArea) return aliasedArea
  return areaOptions.includes(area || '') ? area || 'Living Room' : area || 'Living Room'
}
const normalizeFurnitureAreaKey = (area?: string | null) => {
  return normalizeLookupValue(getCanonicalFurnitureArea(area))
}
const getFurnitureAreaRank = (area?: string | null) => {
  const index = FURNITURE_AREA_ORDER.indexOf(normalizeFurnitureAreaKey(area))
  return index >= 0 ? index : FURNITURE_AREA_ORDER.length
}
const getQuotationItemSortRank = (item: Pick<QuotationItem, 'category' | 'area'>) => {
  const category = normalizeLookupValue(item.category)
  const fullScopeIndex = FULL_SCOPE_CATEGORY_ORDER.indexOf(category)
  if (fullScopeIndex >= 0) return [fullScopeIndex, 0] as const
  if (isFurnitureCategory(item.category)) return [FULL_SCOPE_CATEGORY_ORDER.length, getFurnitureAreaRank(item.area)] as const
  return [FULL_SCOPE_CATEGORY_ORDER.length + 1, 0] as const
}
const getSortedQuotationItemsWithIndex = (items: QuotationItem[]) =>
  items
    .map((item, originalIndex) => ({ item, originalIndex }))
    .sort((a, b) => {
      const [categoryRankA, areaRankA] = getQuotationItemSortRank(a.item)
      const [categoryRankB, areaRankB] = getQuotationItemSortRank(b.item)
      return (
        categoryRankA - categoryRankB ||
        areaRankA - areaRankB ||
        a.item.area.localeCompare(b.item.area) ||
        a.item.description.localeCompare(b.item.description) ||
        a.originalIndex - b.originalIndex
      )
    })
const getFurnitureDescriptionOptions = (area?: string | null) => {
  const areaKey = getCanonicalFurnitureArea(area)
  return furnitureDescriptionOptionsByArea[areaKey] || []
}

const getRoomColor = (area?: string | null) => {
  const normalizedArea = (area ?? 'full flat').trim().toLowerCase()
  return ROOM_COLORS[normalizedArea] || ROOM_COLORS['full flat']
}

const groupQuotationItemsByArea = (items: QuotationItem[]) => {
  const grouped: Record<string, QuotationItem[]> = {}
  items.forEach((item) => {
    const area = isFurnitureCategory(item.category) ? getCanonicalFurnitureArea(item.area) : 'Full Flat'
    const areaKey = area.toLowerCase()
    if (!grouped[areaKey]) {
      grouped[areaKey] = []
    }
    grouped[areaKey].push(item)
  })
  return grouped
}

const getExecutionFeePercent = (quotation?: Pick<Quotation, 'executionFeePercent'> | null) =>
  quotation?.executionFeePercent ?? DEFAULT_EXECUTION_FEE_PERCENT
const getQuotationGrandTotal = (quotation: Pick<Quotation, 'amount' | 'executionFeePercent'>) => {
  const subtotal = Number(quotation.amount || 0)
  return subtotal + subtotal * (getExecutionFeePercent(quotation) / 100)
}

const getComputedQuotationItems = (items: QuotationItem[]): ComputedQuotationItem[] =>
  items.map((item) => {
    const quantity = Number(item.quantity || 0)
    const lengthFt = Number((item as any).lengthCm ?? item.lengthIn ?? 0)
    const widthFt = Number((item as any).widthCm ?? item.widthIn ?? 0)
    const rate = Number(item.rate || 0)
    const storedArea = Number((item as any).areaSqFt ?? 0)
    const unitValue = storedArea || (lengthFt > 0 && widthFt > 0 ? lengthFt * widthFt : quantity)

    return {
      id: item.id,
      category: item.category,
      area: isFurnitureCategory(item.category) ? getCanonicalFurnitureArea(item.area) : 'Full Flat',
      description: item.description,
      quantity,
      lengthIn: lengthFt,
      widthIn: widthFt,
      unitValue,
      rate,
      total: Number(item.total || 0),
    }
  })

const getQuotationSections = (items: ComputedQuotationItem[]): QuotationSection[] => {
  const fullScopeBuckets = new Map<string, ComputedQuotationItem[]>()
  const furnitureAreaBuckets = new Map<string, ComputedQuotationItem[]>()
  const categoryBuckets = new Map<string, ComputedQuotationItem[]>()
  const categoryTitles = new Map<string, string>()

  items.forEach((item) => {
    const normalizedCategory = item.category.trim().toLowerCase()
    if (FULL_SCOPE_CATEGORY_TITLES[normalizedCategory]) {
      if (!fullScopeBuckets.has(normalizedCategory)) fullScopeBuckets.set(normalizedCategory, [])
      fullScopeBuckets.get(normalizedCategory)!.push(item)
      return
    }

    if (isFurnitureCategory(item.category)) {
      const areaKey = item.area?.trim() || 'General'
      if (!furnitureAreaBuckets.has(areaKey)) furnitureAreaBuckets.set(areaKey, [])
      furnitureAreaBuckets.get(areaKey)!.push(item)
      return
    }

    const categoryKey = normalizedCategory || 'other'
    if (!categoryBuckets.has(categoryKey)) categoryBuckets.set(categoryKey, [])
    if (!categoryTitles.has(categoryKey)) categoryTitles.set(categoryKey, item.category?.trim() || 'Other')
    categoryBuckets.get(categoryKey)!.push(item)
  })

  const sections: QuotationSection[] = []

  FULL_SCOPE_CATEGORY_ORDER.forEach((categoryKey) => {
    const itemsForCategory = fullScopeBuckets.get(categoryKey)
    if (!itemsForCategory?.length) return
    sections.push({
      key: `full-${categoryKey}`,
      title: FULL_SCOPE_CATEGORY_TITLES[categoryKey],
      items: itemsForCategory,
    })
  })

  if (furnitureAreaBuckets.size > 0) {
    const furnitureAreaGroups = Array.from(furnitureAreaBuckets.entries())
      .sort(([areaA], [areaB]) => {
        const rankDiff = getFurnitureAreaRank(areaA) - getFurnitureAreaRank(areaB)
        return rankDiff || areaA.localeCompare(areaB)
      })
      .map(([area, sectionItems]) => ({
        area,
        items: sectionItems,
      }))

    sections.push({
      key: 'furniture-work',
      title: 'Furniture Work',
      areaGroups: furnitureAreaGroups,
    })
  }

  categoryBuckets.forEach((sectionItems, categoryKey) => {
    sections.push({
      key: `category-${categoryKey}`,
      title: categoryTitles.get(categoryKey) || 'Other',
      items: sectionItems,
    })
  })

  return sections
}

function buildQuotationPrintHtml(quotation: Quotation) {
  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/dashboard-logo.png` : ''
  const qrUrl = typeof window !== 'undefined' ? `${window.location.origin}/payment-qr.png` : ''
  const items = getComputedQuotationItems(quotation.items)
  const sections = getQuotationSections(items)
  const subtotal = Number(quotation.amount)
  const executionFeePercent = getExecutionFeePercent(quotation)
  const executionFee = subtotal * (executionFeePercent / 100)
  const grandTotal = subtotal + executionFee
  const noteRows = getQuotationNoteLines(quotation.notes)
    .map((note) => `<li>${escapeHtml(note)}</li>`)
    .join('')

  const groupedRows = sections
    .map((section, sectionIndex) => {
      let itemCounter = 0
      const renderItemRow = (item: ComputedQuotationItem) => {
        itemCounter += 1
        return `
          <tr>
            <td class="center">${sectionIndex + 1}.${itemCounter}</td>
            <td>
              <div class="item-title">${escapeHtml(item.description)}</div>
              <div class="item-subtitle">${escapeHtml(item.category || 'Work item')}</div>
            </td>
            <td class="center">${formatOptionalNumber(item.lengthIn)}</td>
            <td class="center">${formatOptionalNumber(item.widthIn)}</td>
            <td class="center">${formatOptionalNumber(item.unitValue)}</td>
            <td class="amount">${formatCurrencyWithSymbol(item.total)}</td>
          </tr>
        `
      }

      const itemRows = section.areaGroups
        ? section.areaGroups
            .map((group) => `
              <tr class="area-row">
                <td></td>
                <td colspan="5">${escapeHtml(group.area)}</td>
              </tr>
              ${group.items.map(renderItemRow).join('')}
            `)
            .join('')
        : (section.items || []).map(renderItemRow).join('')

      return `
        <tr class="section-row">
          <td colspan="6">
            <div class="section-title">${escapeHtml(section.title)}</div>
          </td>
        </tr>
        ${itemRows}
      `
    })
    .join('')

  const termsRows = QUOTATION_TERMS.map((term, index) => `
    <tr>
      <td class="center">${index + 1}</td>
      <td>${escapeHtml(term)}</td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Quotation ${escapeHtml(quotation.quotationNo)}</title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @page { size: A4 portrait; margin: 8mm; }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 0;
            color: #223247;
            background: linear-gradient(180deg, #eef4fb 0%, #dfeaf6 48%, #f7fbff 100%);
          }
          .sheet {
            max-width: 194mm;
            margin: 0 auto;
            background: linear-gradient(180deg, #fbfdff 0%, #f7fbff 100%);
            border: 1px solid #7ea8c9;
            box-shadow: 0 24px 54px rgba(38, 65, 98, 0.12);
          }
          .sheet-inner {
            padding: 11px;
            border: 3px solid #7ea8c9;
            background:
              radial-gradient(circle at top left, rgba(77, 132, 180, 0.18), transparent 26%),
              radial-gradient(circle at top right, rgba(63, 112, 163, 0.16), transparent 24%),
              linear-gradient(90deg, rgba(39, 77, 118, 0.04) 0, rgba(39, 77, 118, 0.04) 7px, transparent 7px, transparent 100%),
              linear-gradient(180deg, #fbfdff 0%, #f7fbff 100%);
          }
          .brand {
            display: block;
            width: 100%;
            border-bottom: 2px solid #7ea8c9;
            padding: 8px 9px 9px;
            background: linear-gradient(180deg, #6f9fc4 0%, #4d7fa9 100%);
            border-radius: 14px;
          }
          .brand-top {
            display: flex;
            align-items: stretch;
            gap: 10px;
            min-width: 0;
          }
          .brand-logo {
            width: 160px;
            border-radius: 18px;
            overflow: hidden;
            padding: 7px 10px;
            border: 1px solid rgba(255,255,255,0.34);
            background: #1b4f9c;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.18), 0 6px 18px rgba(20, 40, 65, 0.16);
            flex-shrink: 0;
          }
          .brand-logo img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: contain;
            object-position: center;
          }
          .brand-copy-wrap {
            min-width: 0;
            padding: 0 8px 0 0;
            flex: 1;
            min-height: 126px;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .brand-title {
            font-family: Romantic, 'Modern No. 20', Georgia, 'Times New Roman', serif;
            display: block;
            max-width: 100%;
            font-size: 64px;
            line-height: 1.02;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: 0;
            white-space: nowrap;
            text-align: center;
            will-change: font-size;
          }
          .brand-copy {
            margin-top: 11px;
            color: #dbe7f3;
            font-size: 12.6px;
            line-height: 1.42;
            text-align: center;
          }
          .quote-card, .meta-grid, .quotation-table, .terms-table, .summary-table {
            width: 100%;
            border-collapse: collapse;
          }
          .quote-card {
            width: 100%;
            margin-top: 8px;
          }
          .quote-card td, .meta-grid td, .quotation-table th, .quotation-table td, .terms-table td, .summary-table td, .payment-table td {
            border: 1px solid #c5d8e7;
            padding: 5px 6px;
            font-size: 10.2px;
          }
          .quote-card td {
            background: rgba(255,255,255,0.98);
            color: #18314a;
            font-weight: 600;
          }
          .quote-card .label {
            color: #1f446b;
          }
          .label {
            background: linear-gradient(180deg, #f1f8fc 0%, #e3f0f8 100%);
            font-weight: 700;
            white-space: nowrap;
            color: #29496c;
          }
          .meta-grid {
            margin-top: 8px;
          }
          .intro {
            margin-top: 8px;
            padding: 7px 10px;
            background: linear-gradient(180deg, #f3f9fd 0%, #e4f0f8 100%);
            border: 1px solid #bfd6e6;
            font-size: 10px;
            font-weight: 600;
            line-height: 1.28;
            text-align: center;
            color: #556d85;
          }
          .quotation-table {
            margin-top: 8px;
          }
          .quotation-table thead th {
            background: linear-gradient(180deg, #5d8eb5 0%, #416f97 100%);
            color: #f7f8fb;
            font-size: 9.2px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .center { text-align: center; }
          .amount { text-align: right; white-space: nowrap; }
          .section-row td {
            background: linear-gradient(180deg, #f0f7fc 0%, #e2eff8 100%);
          }
          .section-title {
            font-size: 10.3px;
            font-weight: 800;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: #1f446b;
          }
          .area-row td {
            background: linear-gradient(180deg, #dff0fa 0%, #c9e1f2 100%);
            color: #15395c;
            font-size: 10.8px;
            font-weight: 800;
            letter-spacing: 0.06em;
            text-transform: uppercase;
          }
          .item-title {
            font-weight: 700;
            color: #1f2f43;
            line-height: 1.18;
          }
          .item-subtitle {
            margin-top: 1px;
            font-size: 8.1px;
            color: #547a9a;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          .summary-label { background: #f8fbfe; font-weight: 700; }
          .summary-accent { background: linear-gradient(180deg, #f1f8fc 0%, #e3f0f8 100%); font-weight: 700; color: #26486b; }
          .summary-final { background: linear-gradient(180deg, #5d8eb5 0%, #416f97 100%); color: #f8fbff; font-weight: 800; font-size: 11px; }
          .block {
            margin-top: 8px;
            page-break-inside: avoid;
          }
          .panel {
            border: 1px solid #c5d8e7;
          }
          .panel-title {
            padding: 6px 9px;
            border-bottom: 1px solid #c5d8e7;
            background: linear-gradient(180deg, #5d8eb5 0%, #416f97 100%);
            font-size: 11px;
            font-weight: 700;
            color: #f8fbff;
          }
          .panel-body {
            padding: 7px 9px;
          }
          .notes-list {
            margin: 0;
            padding-left: 18px;
          }
          .notes-list li {
            margin-bottom: 3px;
            font-size: 9.7px;
            line-height: 1.24;
          }
          .summary-table td:first-child {
            width: 62%;
            background: #fbfdff;
          }
          .terms-table {
            margin-top: 8px;
          }
          .terms-header {
            background: linear-gradient(180deg, #5d8eb5 0%, #416f97 100%);
            font-weight: 700;
            text-align: center;
            font-size: 11px;
            color: #f8fbff;
          }
          .payment-strip {
            margin-top: 8px;
            border: 1.5px solid #9fbad1;
            border-radius: 10px;
            overflow: hidden;
            background: #f4f9fd;
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.75);
            page-break-inside: avoid;
          }
          .payment-title {
            padding: 7px 10px;
            background: linear-gradient(180deg, #dcecf8 0%, #c4dced 100%);
            color: #173b5d;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 13px;
            font-weight: 900;
            letter-spacing: 0.02em;
          }
          .payment-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 128px;
            align-items: stretch;
            background: linear-gradient(180deg, #fbfdff 0%, #edf6fc 100%);
          }
          .payment-table {
            width: 100%;
            min-width: 0;
            border-collapse: collapse;
          }
          .payment-table td {
            height: 27px;
            padding-top: 5px;
            padding-bottom: 5px;
            border-color: #b7cade;
            color: #173b5d;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12.2px;
            font-weight: 900;
            line-height: 1.18;
          }
          .payment-table td:first-child {
            background: linear-gradient(180deg, #eaf4fb 0%, #d5e8f5 100%);
            color: #173b5d;
            font-weight: 900;
            width: 46%;
          }
          .payment-table td:last-child {
            background: rgba(255, 255, 255, 0.96);
            font-size: 12.4px;
          }
          .payment-qr {
            border-left: 1px solid #b7cade;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(180deg, #f7fbff 0%, #ffffff 100%);
            padding: 5px;
            color: #6a7f95;
            font-size: 9px;
            text-align: center;
          }
          .payment-qr img {
            display: block;
            width: 108px;
            height: 108px;
            object-fit: contain;
          }
          @media (max-width: 900px) {
            .brand-top {
              align-items: center;
            }
            .brand-title {
              white-space: normal;
              font-size: 30px;
            }
            .brand-copy-wrap {
              text-align: center;
            }
            .payment-grid {
              grid-template-columns: 1fr;
            }
            .payment-qr {
              border-left: 0;
              border-top: 1px solid #b7cade;
              min-height: 90px;
            }
          }
          @media print {
            body {
              background: #fff;
            }
            .sheet {
              box-shadow: none;
              border: 0;
              max-width: none;
            }
            .payment-grid {
              display: grid;
              grid-template-columns: minmax(0, 1fr) 128px;
            }
            .payment-qr {
              border-top: 0;
              border-left: 1px solid #b7cade;
              min-height: 0;
            }
          }
        </style>
      </head>
      <body>
          <div class="sheet">
          <div class="sheet-inner">
            <div class="brand">
              <div class="brand-top">
                <div class="brand-logo"><img src="${logoUrl}" alt="Space Shastra logo" /></div>
                <div class="brand-copy-wrap">
                  <div class="brand-title">${COMPANY_DETAILS.title}</div>
                  <div class="brand-copy">
                    ${COMPANY_DETAILS.proprietor}<br>
                    ${COMPANY_DETAILS.address}<br>
                    Mob.: ${COMPANY_DETAILS.mobile}
                  </div>
                </div>
              </div>
              <table class="quote-card">
                <tr>
                  <td class="label">Date</td>
                  <td>${escapeHtml(formatDisplayDate(quotation.issueDate))}</td>
                </tr>
                <tr>
                  <td class="label">Quotation No</td>
                  <td>${escapeHtml(quotation.quotationNo)}</td>
                </tr>
              </table>
            </div>

            <table class="meta-grid">
              <tr>
                <td class="label">To</td>
                <td>${escapeHtml(`${quotation.client.firstName} ${quotation.client.lastName}`)}</td>
                <td class="label">Project</td>
                <td>${escapeHtml(quotation.project?.name || '-')}</td>
              </tr>
              <tr>
                <td class="label">Address</td>
                <td>${escapeHtml(quotation.project?.address || quotation.client.address || '-')}</td>
                <td class="label">Area</td>
                <td>${escapeHtml(`${formatOptionalNumber(quotation.project?.areaSqFt || 0)} Sq.ft`)}</td>
              </tr>
            </table>

            <div class="intro">
              Thank you for giving us an opportunity to prepare your interior quotation. The estimate below is arranged in a clear work-wise and room-wise format so it remains easy to review, approve, and execute.
            </div>

            <table class="quotation-table">
              <thead>
                <tr>
                  <th style="width:52px;">Sr No</th>
                  <th>Item Description</th>
                  <th style="width:68px;">Length</th>
                  <th style="width:68px;">Width</th>
                  <th style="width:74px;">Unit</th>
                  <th style="width:112px;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${groupedRows}
                <tr>
                  <td colspan="5" class="summary-label amount">Total Amount</td>
                  <td class="summary-accent amount">${formatCurrencyWithSymbol(subtotal)}</td>
                </tr>
                <tr>
                  <td class="center">*</td>
                  <td colspan="3">Interior execution fees / supervision / designing</td>
                  <td class="center">${executionFeePercent.toFixed(2).replace(/\.00$/, '')}%</td>
                  <td class="amount">${formatCurrencyWithSymbol(executionFee)}</td>
                </tr>
                <tr>
                  <td colspan="5" class="summary-accent center">Grand Total</td>
                  <td class="summary-final amount">${formatCurrencyWithSymbol(grandTotal)}</td>
                </tr>
              </tbody>
            </table>

            <div class="block panel">
              <div class="panel-title">Quotation Notes</div>
              <div class="panel-body">
                <ul class="notes-list">${noteRows}</ul>
              </div>
            </div>

            <div class="block panel">
              <div class="panel-title">Commercial Summary</div>
              <div class="panel-body" style="padding:0;">
                <table class="summary-table">
                  <tr>
                    <td>Base quotation value</td>
                    <td class="amount"><strong>${formatCurrencyWithSymbol(subtotal)}</strong></td>
                  </tr>
                  <tr>
                    <td>Execution fee</td>
                    <td class="amount"><strong>${formatCurrencyWithSymbol(executionFee)} (${executionFeePercent.toFixed(2).replace(/\.00$/, '')}%)</strong></td>
                  </tr>
                  <tr>
                    <td>Final grand total</td>
                    <td class="amount"><strong>${formatCurrencyWithSymbol(grandTotal)}</strong></td>
                  </tr>
                  <tr>
                    <td>Status</td>
                    <td class="amount"><strong>${escapeHtml(quotation.status)}</strong></td>
                  </tr>
                </table>
              </div>
            </div>

            <table class="terms-table">
              <tr>
                <td colspan="2" class="terms-header">Terms and Conditions</td>
              </tr>
              ${termsRows}
            </table>

            <div class="payment-strip">
              <div class="payment-title">Payment Details:</div>
              <div class="payment-grid">
                <table class="payment-table">
                  <tr>
                    <td>A/C Name</td>
                    <td>${escapeHtml(PAYMENT_DETAILS.accountName)}</td>
                  </tr>
                  <tr>
                    <td>Bank Account</td>
                    <td>${escapeHtml(PAYMENT_DETAILS.bankAccount)}</td>
                  </tr>
                  <tr>
                    <td>IFSC</td>
                    <td>${escapeHtml(PAYMENT_DETAILS.ifsc)}</td>
                  </tr>
                  <tr>
                    <td>UPI</td>
                    <td>${escapeHtml(PAYMENT_DETAILS.upi)}</td>
                  </tr>
                  <tr>
                    <td>GPay/PhonePe</td>
                    <td>${escapeHtml(PAYMENT_DETAILS.gpayPhonePe)}</td>
                  </tr>
                </table>
                <div class="payment-qr">
                  ${qrUrl ? `<img src="${qrUrl}" alt="Payment QR" />` : 'QR code can be placed here'}
                </div>
              </div>
            </div>
          </div>
        </div>
        <script>
          (function () {
            function fitBrandTitle() {
              var title = document.querySelector('.brand-title');
              var wrap = document.querySelector('.brand-copy-wrap');
              if (!title || !wrap) return;

              var minSize = 42;
              var maxSize = 82;
              var availableWidth = Math.max(120, wrap.clientWidth - 18);
              var availableHeight = 70;
              var low = minSize;
              var high = maxSize;

              title.style.fontSize = maxSize + 'px';
              title.style.maxWidth = availableWidth + 'px';

              for (var i = 0; i < 12; i += 1) {
                var mid = (low + high) / 2;
                title.style.fontSize = mid + 'px';
                if (title.scrollWidth <= availableWidth && title.scrollHeight <= availableHeight) {
                  low = mid;
                } else {
                  high = mid;
                }
              }

              title.style.fontSize = Math.floor(low) + 'px';
            }

            window.fitBrandTitle = fitBrandTitle;
            window.addEventListener('load', fitBrandTitle);
            if (document.fonts && document.fonts.ready) {
              document.fonts.ready.then(fitBrandTitle);
            }
          })();
        </script>
      </body>
    </html>
  `
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [viewingQuotation, setViewingQuotation] = useState<Quotation | null>(null)
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null)
  const [copySourceQuotation, setCopySourceQuotation] = useState<Quotation | null>(null)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState('')
  const [importPreview, setImportPreview] = useState<ImportedQuotationPreview | null>(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [formData, setFormData] = useState({
    quotationNo: '',
    clientId: '',
    projectId: '',
    amount: '',
    executionFeePercent: '0',
    notes: '',
    status: 'draft'
  })
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([])
  const [newItem, setNewItem] = useState<QuotationItem>({ area: 'Full Flat', category: 'Painting', description: '', quantity: '1', lengthIn: '0', widthIn: '0', rate: '0', total: 0 })

  useEffect(() => {
    fetchQuotations()
    fetchClients()
    fetchProjects()
  }, [])

  useEffect(() => {
    if (!saveMessage || saveMessage.type !== 'success') return

    const timeout = window.setTimeout(() => {
      setSaveMessage(null)
    }, 5000)

    return () => window.clearTimeout(timeout)
  }, [saveMessage])

  const fetchQuotations = async () => {
    try {
      const res = await fetch('/api/quotations', { credentials: 'include' })
      const data = await res.json()
      setQuotations(data)
    } catch (error) {
      console.error('Failed to fetch quotations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients', { credentials: 'include' })
      const data = await res.json()
      setClients(data)
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    }
  }

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects', { credentials: 'include' })
      const data = await res.json()
      setProjects(data)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  const calculateTotal = (items: QuotationItem[]) => {
    return items.reduce((sum, item) => sum + item.total, 0)
  }

  const calculateItemTotal = (item: Pick<QuotationItem, 'quantity' | 'lengthIn' | 'widthIn' | 'rate'>) => {
    const quantity = parseFloat(item.quantity) || 0
    const lengthFt = parseFloat(item.lengthIn) || 0
    const widthFt = parseFloat(item.widthIn) || 0
    const rate = parseFloat(item.rate) || 0
    const areaSqFt = lengthFt > 0 && widthFt > 0 ? lengthFt * widthFt : 0
    const total = areaSqFt > 0 ? areaSqFt * rate * (quantity || 1) : quantity * rate
    return Number(total.toFixed(2))
  }

  const findMatchingClientId = (clientName: string) => {
    const normalizedClientName = normalizeLookupValue(clientName)
    if (!normalizedClientName) return ''

    const matchedClient = clients.find((client) => {
      const fullName = normalizeLookupValue(`${client.firstName} ${client.lastName}`)
      return fullName === normalizedClientName
    })

    return matchedClient?.id || ''
  }

  const findMatchingProjectId = (projectName: string) => {
    const normalizedProjectName = normalizeLookupValue(projectName)
    if (!normalizedProjectName) return ''

    const matchedProject = projects.find((project) => normalizeLookupValue(project.name) === normalizedProjectName)
    return matchedProject?.id || ''
  }

  const resetImportState = () => {
    setImportFile(null)
    setImportLoading(false)
    setImportError('')
    setImportPreview(null)
  }

  const openImportModal = () => {
    resetImportState()
    setShowImportModal(true)
  }

  const applyImportedQuotation = () => {
    if (!importPreview) return

    const matchedClientId = findMatchingClientId(importPreview.clientName)
    const matchedProjectId = findMatchingProjectId(importPreview.projectName)
    const importedItems = importPreview.items.map((item) => ({
      ...item,
      area: isFurnitureCategory(item.category) ? getCanonicalFurnitureArea(item.area) : 'Full Flat',
      total: calculateItemTotal(item),
    }))

    setEditingQuotation(null)
    setCopySourceQuotation(null)
    setFormData({
      quotationNo: importPreview.quotationNo,
      clientId: matchedClientId,
      projectId: matchedProjectId,
      amount: String(calculateTotal(importedItems)),
      executionFeePercent: '0',
      notes: importPreview.notes || '',
      status: 'draft',
    })
    setQuotationItems(importedItems)
    setNewItem({ area: 'Full Flat', category: 'Painting', description: '', quantity: '1', lengthIn: '0', widthIn: '0', rate: '0', total: 0 })
    setShowImportModal(false)
    setShowModal(true)
  }

  const handleImportFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importFile) {
      setImportError('Please choose an Excel or CSV file first.')
      return
    }

    try {
      setImportLoading(true)
      setImportError('')
      const uploadData = new FormData()
      uploadData.append('file', importFile)

      const res = await fetch('/api/quotations/import', {
        method: 'POST',
        body: uploadData,
        credentials: 'include',
      })

      const data = await res.json()
      if (!res.ok) {
        setImportError(data?.error || 'Failed to import quotation file.')
        setImportPreview(null)
        return
      }

      setImportPreview({
        quotationNo: data.quotationNo || '',
        clientName: data.clientName || '',
        projectName: data.projectName || '',
        notes: data.notes || '',
        warnings: Array.isArray(data.warnings) ? data.warnings : [],
        items: Array.isArray(data.items)
          ? data.items.map((item: any) => ({
              category: item.category || 'Furniture',
              area: isFurnitureCategory(item.category || 'Furniture') ? getCanonicalFurnitureArea(item.area) : 'Full Flat',
              description: item.description || '',
              quantity: String(item.quantity || '1'),
              lengthIn: String(item.lengthIn || '0'),
              widthIn: String(item.widthIn || '0'),
              rate: String(item.rate || '0'),
              total: Number(item.total || 0),
              manualTotal: false,
            }))
          : [],
      })
    } catch (error) {
      setImportError('Failed to import quotation file.')
    } finally {
      setImportLoading(false)
    }
  }

  const handleNewItemChange = (field: 'area' | 'category' | 'description' | 'quantity' | 'lengthIn' | 'widthIn' | 'rate', value: string) => {
    const normalizedValue = field === 'description' ? normalizeCapitalizedText(value) : value

    setNewItem((currentItem) => {
      const updatedItem = { ...currentItem, [field]: normalizedValue }

      if (field === 'area' && isFurnitureCategory(updatedItem.category)) {
        updatedItem.area = getCanonicalFurnitureArea(normalizedValue)
      }

      if (field === 'category') {
        if (isFurnitureCategory(normalizedValue)) {
          if (!currentItem.area || currentItem.area === 'Full Flat') {
            updatedItem.area = 'Living Room'
          } else {
            updatedItem.area = getCanonicalFurnitureArea(currentItem.area)
          }
        } else {
          updatedItem.area = 'Full Flat'
        }
      }

      const quantity = parseFloat(updatedItem.quantity) || 0
      const lengthFt = parseFloat(updatedItem.lengthIn) || 0
      const widthFt = parseFloat(updatedItem.widthIn) || 0
      const rate = parseFloat(updatedItem.rate) || 0
      const areaSqFt = lengthFt > 0 && widthFt > 0 ? lengthFt * widthFt : 0
      const total = areaSqFt > 0 ? areaSqFt * rate * (quantity || 1) : quantity * rate

      return { ...updatedItem, total: Number(total.toFixed(2)) }
    })
  }

  const handleItemChange = (index: number, field: 'area' | 'category' | 'description' | 'quantity' | 'lengthIn' | 'widthIn' | 'rate' | 'total', value: string) => {
    const updatedItems = quotationItems.map((item, idx) => {
      if (idx !== index) return item
      const normalizedValue = field === 'description' ? normalizeCapitalizedText(value) : value
      const updatedItem = {
        ...item,
        [field]: normalizedValue,
      }
      if (field === 'total') {
        const manualTotal = Number(parseFloat(value || '0').toFixed(2))
        return {
          ...item,
          total: Number.isFinite(manualTotal) ? manualTotal : 0,
          manualTotal: true,
        }
      }
      if (field === 'area' && isFurnitureCategory(updatedItem.category)) {
        updatedItem.area = getCanonicalFurnitureArea(normalizedValue)
      }
      if (field === 'category') {
        if (isFurnitureCategory(normalizedValue)) {
          if (!item.area || item.area === 'Full Flat') {
            updatedItem.area = 'Living Room'
          } else {
            updatedItem.area = getCanonicalFurnitureArea(item.area)
          }
        } else {
          updatedItem.area = 'Full Flat'
        }
      }
      const quantity = parseFloat(updatedItem.quantity) || 0
      const lengthFt = parseFloat(updatedItem.lengthIn) || 0
      const widthFt = parseFloat(updatedItem.widthIn) || 0
      const rate = parseFloat(updatedItem.rate) || 0
      const areaSqFt = lengthFt > 0 && widthFt > 0 ? lengthFt * widthFt : 0
      const total = areaSqFt > 0 ? areaSqFt * rate * (quantity || 1) : quantity * rate
      return {
        ...updatedItem,
        total: Number(total.toFixed(2)),
        manualTotal: false,
        lengthIn: updatedItem.lengthIn,
        widthIn: updatedItem.widthIn,
        rate: updatedItem.rate,
      }
    })
    setQuotationItems(updatedItems)
    setFormData({
      ...formData,
      amount: calculateTotal(updatedItems).toString(),
    })
  }

  const addItem = () => {
    if (newItem.description.trim()) {
      const itemToAdd = {
        ...newItem,
        area: isFurnitureCategory(newItem.category) ? getCanonicalFurnitureArea(newItem.area) : 'Full Flat',
      }
      const updatedItems = [...quotationItems, itemToAdd]
      setQuotationItems(updatedItems)
      setFormData({
        ...formData,
        amount: calculateTotal(updatedItems).toString(),
      })
      setNewItem({ area: 'Full Flat', category: 'Painting', description: '', quantity: '1', lengthIn: '0', widthIn: '0', rate: '0', total: 0 })
    }
  }

  const removeItem = (index: number) => {
    const updatedItems = quotationItems.filter((_, idx) => idx !== index)
    setQuotationItems(updatedItems)
    setFormData({
      ...formData,
      amount: calculateTotal(updatedItems).toString(),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saveLoading) return

    try {
      setSaveLoading(true)
      setSaveMessage(null)
      const url = editingQuotation ? `/api/quotations/${editingQuotation.id}` : '/api/quotations'
      const method = editingQuotation ? 'PUT' : 'POST'
      const isEditing = Boolean(editingQuotation)

      const itemData = quotationItems.map((item) => {
        const quantity = parseFloat(item.quantity) || 0
        const lengthFt = parseFloat(item.lengthIn) || 0
        const widthFt = parseFloat(item.widthIn) || 0
        const rate = parseFloat(item.rate) || 0
        const areaSqFt = lengthFt > 0 && widthFt > 0 ? lengthFt * widthFt : 0
        const calculatedTotal = areaSqFt > 0 ? areaSqFt * rate * (quantity || 1) : quantity * rate
        const total = item.manualTotal ? Number(item.total || 0) : calculatedTotal

        return {
          id: item.id,
          area: isFurnitureCategory(item.category) ? getCanonicalFurnitureArea(item.area) : 'Full Flat',
          category: item.category,
          description: item.description,
          quantity,
          lengthCm: lengthFt,
          widthCm: widthFt,
          rate,
          areaSqFt: Number(areaSqFt.toFixed(2)),
          total: Number(total.toFixed(2)),
        }
      })
      const amount = calculateTotal(quotationItems)

      const submitData = {
        ...formData,
        amount,
        executionFeePercent: Number(formData.executionFeePercent) || 0,
        notes: formData.notes,
        quotationNo: formData.quotationNo || `QT-${Date.now()}`,
        items: itemData,
      }

      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), 60000)

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
        signal: controller.signal,
        credentials: 'include',
      })
      window.clearTimeout(timeoutId)
      const savedQuotation = await res.json().catch(() => null)

      if (res.ok) {
        if (savedQuotation) {
          setQuotations((currentQuotations) => {
            if (isEditing) {
              return currentQuotations.map((quotation) =>
                quotation.id === savedQuotation.id ? savedQuotation : quotation,
              )
            }

            return [savedQuotation, ...currentQuotations]
          })
        }

        setShowModal(false)
        setEditingQuotation(null)
        setCopySourceQuotation(null)
        setSaveMessage({
          type: 'success',
          text: isEditing ? 'Quotation updated successfully.' : 'Quotation created successfully.',
        })
        setFormData({
          quotationNo: '',
          clientId: '',
          projectId: '',
          amount: '',
          executionFeePercent: '0',
          notes: '',
          status: 'draft'
        })
        setQuotationItems([])
        setNewItem({ area: 'Full Flat', category: 'Painting', description: '', quantity: '1', lengthIn: '0', widthIn: '0', rate: '0', total: 0 })
      } else {
        setSaveMessage({
          type: 'error',
          text: savedQuotation?.error || 'Failed to save quotation. Please try again.',
        })
        console.error('Failed to save quotation')
      }
    } catch (error) {
      const isTimeout = error instanceof DOMException && error.name === 'AbortError'
      setSaveMessage({
        type: 'error',
        text: isTimeout
          ? 'The update is taking too long. Please try again after a moment.'
          : 'Failed to save quotation. Please check your connection and try again.',
      })
      console.error('Error saving quotation:', error)
    } finally {
      setSaveLoading(false)
    }
  }

  const handleEdit = (quotation: Quotation) => {
    setSaveMessage(null)
    setEditingQuotation(quotation)
    setCopySourceQuotation(null)
    setFormData({
      quotationNo: quotation.quotationNo,
      clientId: quotation.clientId,
      projectId: quotation.projectId,
      amount: quotation.amount.toString(),
      executionFeePercent: String(quotation.executionFeePercent ?? DEFAULT_EXECUTION_FEE_PERCENT),
      notes: quotation.notes || '',
      status: quotation.status,
    })
    setQuotationItems(quotation.items.map((item) => ({
      id: item.id,
      category: item.category || 'Painting',
      area: isFurnitureCategory(item.category || 'Painting') ? getCanonicalFurnitureArea(item.area) : 'Full Flat',
      description: item.description,
      quantity: String(item.quantity),
      lengthIn: String(item.lengthCm || 0),
      widthIn: String(item.widthCm || 0),
      rate: String(item.rate || 0),
      total: item.total,
      manualTotal: false,
    })))
    setShowModal(true)
  }

  const handleCopyQuotation = (quotation: Quotation) => {
    setSaveMessage(null)
    const copiedItems = quotation.items.map((item) => ({
      category: item.category || 'Painting',
      area: isFurnitureCategory(item.category || 'Painting') ? getCanonicalFurnitureArea(item.area) : 'Full Flat',
      description: item.description,
      quantity: String(item.quantity),
      lengthIn: String(item.lengthCm || 0),
      widthIn: String(item.widthCm || 0),
      rate: String(item.rate || 0),
      total: item.total,
      manualTotal: false,
    }))

    setEditingQuotation(null)
    setCopySourceQuotation(quotation)
    setFormData({
      quotationNo: '',
      clientId: '',
      projectId: '',
      amount: calculateTotal(copiedItems).toString(),
      executionFeePercent: String(quotation.executionFeePercent ?? DEFAULT_EXECUTION_FEE_PERCENT),
      notes: quotation.notes || '',
      status: 'draft',
    })
    setQuotationItems(copiedItems)
    setNewItem({ area: 'Full Flat', category: 'Painting', description: '', quantity: '1', lengthIn: '0', widthIn: '0', rate: '0', total: 0 })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this quotation?')) {
      try {
        const res = await fetch(`/api/quotations/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        })

        if (res.ok) {
          fetchQuotations()
        } else {
          console.error('Failed to delete quotation')
        }
      } catch (error) {
        console.error('Error deleting quotation:', error)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: getNormalizedFieldValue(e.target),
    })
  }

  const openAddModal = () => {
    setSaveMessage(null)
    setEditingQuotation(null)
    setCopySourceQuotation(null)
    setFormData({
      quotationNo: '',
      clientId: '',
      projectId: '',
      amount: '',
      executionFeePercent: '0',
      notes: '',
      status: 'draft'
    })
    setQuotationItems([])
    setNewItem({ area: 'Full Flat', category: 'Painting', description: '', quantity: '1', lengthIn: '0', widthIn: '0', rate: '0', total: 0 })
    setShowModal(true)
  }

  const openViewQuotation = (quotation: Quotation) => {
    setViewingQuotation(quotation)
  }

  const handlePrintQuotation = () => {
    if (!viewingQuotation) return

    const printWindow = window.open('', '_blank', 'width=1000,height=900')
    if (!printWindow) return

    printWindow.document.write(buildQuotationPrintHtml(viewingQuotation))
    printWindow.document.close()

    const waitForImagesAndPrint = () => {
      const images = Array.from(printWindow.document.images)
      const imagePromises = images.map(
        (image) =>
          new Promise<void>((resolve) => {
            if (image.complete) {
              resolve()
              return
            }

            image.onload = () => resolve()
            image.onerror = () => resolve()
          }),
      )

      Promise.all(imagePromises).then(() => {
        const fitAndPrint = () => {
          const fitBrandTitle = (printWindow as Window & { fitBrandTitle?: () => void }).fitBrandTitle
          fitBrandTitle?.()
          printWindow.focus()
          printWindow.print()
        }

        if (printWindow.document.fonts?.ready) {
          printWindow.document.fonts.ready.then(() => {
            fitAndPrint()
          })
        } else {
          fitAndPrint()
        }
      })
    }

    if (printWindow.document.readyState === 'complete') {
      waitForImagesAndPrint()
    } else {
      printWindow.onload = waitForImagesAndPrint
    }
  }

  return (
    <div className="py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold">Quotations</h2>
          <p className="text-sm text-gray-600">Create a detailed quotation report with item-level pricing.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={openImportModal}
            className="border border-black px-5 py-2 rounded hover:bg-gray-50"
          >
            Import Quotation
          </button>
          <button
            onClick={openAddModal}
            className="bg-black text-white px-5 py-2 rounded hover:bg-gray-900"
          >
            Create Quotation
          </button>
        </div>
      </div>

      {saveMessage && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm font-medium ${
            saveMessage.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
          role="status"
        >
          {saveMessage.text}
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">Import Quotation</h3>
                <p className="text-sm text-gray-600">
                  Upload an existing `.xlsx`, `.xls`, or `.csv` quotation file. We will extract the quotation items, sizes, and rates into your normal quotation form.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetImportState()
                  setShowImportModal(false)
                }}
                className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Close
              </button>
            </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <form onSubmit={handleImportFileSubmit} className="space-y-4">
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
                <label className="block text-sm font-medium text-gray-800">Quotation File</label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => {
                    setImportFile(e.target.files?.[0] || null)
                    setImportError('')
                  }}
                  className="mt-2 block w-full text-sm"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Best results come from structured Excel sheets with headers like Description, Qty, Length, Width, Rate, Total.
                </p>
              </div>

              {importError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {importError}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={importLoading}
                  className="rounded bg-black px-5 py-2 text-white hover:bg-gray-900 disabled:opacity-60"
                >
                  {importLoading ? 'Reading File...' : 'Read Import File'}
                </button>
              </div>
            </form>

            {importPreview && (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Detected Quotation No</p>
                    <p className="mt-2 font-semibold text-gray-900">{importPreview.quotationNo || 'Not detected'}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Detected Client</p>
                    <p className="mt-2 font-semibold text-gray-900">{importPreview.clientName || 'Not detected'}</p>
                    {importPreview.clientName && (
                      <p className="mt-1 text-xs text-gray-500">
                        Match in system: {findMatchingClientId(importPreview.clientName) ? 'Found' : 'Please select manually'}
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Detected Project</p>
                    <p className="mt-2 font-semibold text-gray-900">{importPreview.projectName || 'Not detected'}</p>
                    {importPreview.projectName && (
                      <p className="mt-1 text-xs text-gray-500">
                        Match in system: {findMatchingProjectId(importPreview.projectName) ? 'Found' : 'Please select manually'}
                      </p>
                    )}
                  </div>
                </div>

                {importPreview.warnings.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-900">Import Notes</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
                      {importPreview.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-lg font-semibold">Imported Items Preview</h4>
                    <p className="text-sm text-gray-600">{importPreview.items.length} items detected</p>
                  </div>
                  <div className="max-h-[42vh] overflow-auto rounded-lg border border-gray-200">
                    <table className="min-w-[980px] w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left">Category</th>
                          <th className="px-3 py-2 text-left">Area</th>
                          <th className="px-3 py-2 text-left">Description</th>
                          <th className="px-3 py-2 text-right">Qty</th>
                          <th className="px-3 py-2 text-right">Length (ft)</th>
                          <th className="px-3 py-2 text-right">Width (ft)</th>
                          <th className="px-3 py-2 text-right">Rate</th>
                          <th className="px-3 py-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {importPreview.items.map((item, index) => (
                          <tr key={`${item.description}-${index}`}>
                            <td className="px-3 py-2">{item.category}</td>
                            <td className="px-3 py-2">{item.area}</td>
                            <td className="px-3 py-2">{item.description}</td>
                            <td className="px-3 py-2 text-right">{item.quantity}</td>
                            <td className="px-3 py-2 text-right">{item.lengthIn}</td>
                            <td className="px-3 py-2 text-right">{item.widthIn}</td>
                            <td className="px-3 py-2 text-right">₹{Number(item.rate || 0).toFixed(2)}</td>
                            <td className="px-3 py-2 text-right">₹{Number(item.total || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            </div>
            <div className="border-t border-gray-200 bg-white px-6 py-4">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    resetImportState()
                  }}
                  className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
                >
                  Reset
                </button>
                {importPreview && (
                  <button
                    type="button"
                    onClick={applyImportedQuotation}
                    className="rounded bg-black px-5 py-2 text-white hover:bg-gray-900"
                  >
                    Use Imported Items
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-6xl overflow-y-auto max-h-[92vh] shadow-2xl">
            <h3 className="text-xl font-bold mb-4">
              {editingQuotation ? 'Edit Quotation' : copySourceQuotation ? 'Copy Quotation' : 'Create New Quotation'}
            </h3>
            {copySourceQuotation && (
              <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                Copying items and notes from quotation <strong>{copySourceQuotation.quotationNo}</strong>. Select the new client and project, then save to create a separate quotation.
              </div>
            )}
            {saveLoading && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900" role="status">
                {editingQuotation ? 'Updating quotation. Please wait...' : 'Saving quotation. Please wait...'}
              </div>
            )}
            {saveMessage?.type === 'error' && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
                {saveMessage.text}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Quotation Number</label>
                  <input
                    type="text"
                    name="quotationNo"
                    value={formData.quotationNo}
                    onChange={handleInputChange}
                    placeholder="Auto-generated if empty"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Client</label>
                  <select
                    name="clientId"
                    value={formData.clientId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">Select Client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.firstName} {client.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Project</label>
                  <select
                    name="projectId"
                    value={formData.projectId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">Select Project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="accepted">Accepted</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                {formData.status === 'draft' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Execution Fee %</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="executionFeePercent"
                      value={formData.executionFeePercent}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Add Quotation Item</label>
                <div className="grid grid-cols-12 gap-3 items-end mb-4">
                  <div className="col-span-12 sm:col-span-2">
                    <label className="block text-xs font-medium mb-1">Category</label>
                    <select
                      value={newItem.category}
                      onChange={(e) => handleNewItemChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      {categoryOptions.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  {isFurnitureCategory(newItem.category) && (
                    <div className="col-span-12 sm:col-span-2">
                      <label className="block text-xs font-medium mb-1">Area</label>
                      <select
                        value={getCanonicalFurnitureArea(newItem.area)}
                        onChange={(e) => handleNewItemChange('area', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                      >
                        {areaOptions.map((area) => (
                          <option key={area} value={area}>{area}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-xs font-medium mb-1">Description</label>
                    <input
                      type="text"
                      list={isFurnitureCategory(newItem.category) ? 'new-furniture-description-options' : undefined}
                      value={newItem.description}
                      onChange={(e) => handleNewItemChange('description', e.target.value)}
                      placeholder={isFurnitureCategory(newItem.category) ? 'Select or enter item description' : 'Enter item description'}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    {isFurnitureCategory(newItem.category) && (
                      <datalist id="new-furniture-description-options">
                        {getFurnitureDescriptionOptions(newItem.area).map((description) => (
                          <option key={description} value={description} />
                        ))}
                      </datalist>
                    )}
                  </div>
                  <div className="col-span-6 sm:col-span-1">
                    <label className="block text-xs font-medium mb-1">Qty</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={newItem.quantity}
                      onChange={(e) => handleNewItemChange('quantity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black text-right min-w-[80px]"
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-1">
                    <label className="block text-xs font-medium mb-1">Length (ft)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={newItem.lengthIn}
                      onChange={(e) => handleNewItemChange('lengthIn', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black text-right min-w-[80px]"
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-1">
                    <label className="block text-xs font-medium mb-1">Width (ft)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={newItem.widthIn}
                      onChange={(e) => handleNewItemChange('widthIn', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black text-right min-w-[80px]"
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-1">
                    <label className="block text-xs font-medium mb-1">Rate</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newItem.rate}
                      onChange={(e) => handleNewItemChange('rate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black text-right min-w-[80px]"
                    />
                  </div>
                  <div className="col-span-12 sm:col-span-1">
                    <button
                      type="button"
                      onClick={addItem}
                      className="w-full px-3 py-2 bg-black text-white rounded hover:bg-gray-900"
                    >
                      Add Item
                    </button>
                  </div>
                </div>

                {quotationItems.length > 0 && (
                  <>
                    <label className="block text-sm font-medium mb-2">Added Items</label>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="min-w-[1100px] w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-gray-600 w-32">Category</th>
                            <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-gray-600 w-32">Area</th>
                            <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-gray-600 w-52">Description</th>
                            <th className="px-3 py-2 text-right text-xs uppercase tracking-wide text-gray-600 w-28">Qty</th>
                            <th className="px-3 py-2 text-right text-xs uppercase tracking-wide text-gray-600 w-28">Length (ft)</th>
                            <th className="px-3 py-2 text-right text-xs uppercase tracking-wide text-gray-600 w-28">Width (ft)</th>
                            <th className="px-3 py-2 text-right text-xs uppercase tracking-wide text-gray-600 w-28">Rate</th>
                            <th className="px-3 py-2 text-right text-xs uppercase tracking-wide text-gray-600 w-28">Size (ft²)</th>
                            <th className="px-3 py-2 text-right text-xs uppercase tracking-wide text-gray-600 w-28">Total</th>
                            <th className="px-3 py-2 text-right text-xs uppercase tracking-wide text-gray-600 w-20">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const grouped = groupQuotationItemsByArea(quotationItems)
                            const sortedAreas = Object.keys(grouped).sort((a, b) => {
                              const areaA = Object.keys(ROOM_COLORS).find(k => k.toLowerCase() === a) || a
                              const areaB = Object.keys(ROOM_COLORS).find(k => k.toLowerCase() === b) || b
                              return Object.keys(ROOM_COLORS).indexOf(areaA) - Object.keys(ROOM_COLORS).indexOf(areaB)
                            })
                            
                            return sortedAreas.map((areaKey) => {
                              const items = grouped[areaKey]
                              const colors = getRoomColor(areaKey)
                              
                              return (
                                <Fragment key={areaKey}>
                                  <tr className={`${colors.bg} border-t-2 ${colors.border} hover:opacity-80`}>
                                    <td colSpan={10} className={`px-3 py-2 font-semibold ${colors.text}`}>
                                      <div className={`flex items-center gap-2 py-1`}>
                                        <span className={`inline-block w-3 h-3 rounded-full ${colors.border.replace('border', 'bg')}`}></span>
                                        {items[0].area ? items[0].area.toUpperCase() : 'FULL FLAT'}
                                      </div>
                                    </td>
                                  </tr>
                                  {getSortedQuotationItemsWithIndex(items).map(({ item }) => {
                                    const originalIndex = quotationItems.findIndex(
                                      (qi) => qi.id === item.id && qi.description === item.description && 
                                             qi.category === item.category && qi.area === item.area
                                    )
                                    return (
                                      <tr key={`${originalIndex}-${item.id || item.description}`} className={`border-t ${colors.bg}`}>
                                        <td className="px-3 py-2 text-sm">
                                          <select
                                            value={item.category}
                                            onChange={(e) => handleItemChange(originalIndex, 'category', e.target.value)}
                                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                                          >
                                            {categoryOptions.map((category) => (
                                              <option key={category} value={category}>{category}</option>
                                            ))}
                                          </select>
                                        </td>
                                        <td className="px-3 py-2 text-sm">
                                          {isFurnitureCategory(item.category) ? (
                                            <select
                                              value={getCanonicalFurnitureArea(item.area)}
                                              onChange={(e) => handleItemChange(originalIndex, 'area', e.target.value)}
                                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                                            >
                                              {areaOptions.map((area) => (
                                                <option key={area} value={area}>{area}</option>
                                              ))}
                                            </select>
                                          ) : (
                                            <span>-</span>
                                          )}
                                        </td>
                                        <td className="px-3 py-2 text-sm">
                                          <input
                                            type="text"
                                            list={isFurnitureCategory(item.category) ? `furniture-description-options-${originalIndex}` : undefined}
                                            value={item.description}
                                            onChange={(e) => handleItemChange(originalIndex, 'description', e.target.value)}
                                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                                          />
                                          {isFurnitureCategory(item.category) && (
                                            <datalist id={`furniture-description-options-${originalIndex}`}>
                                              {getFurnitureDescriptionOptions(item.area).map((description) => (
                                                <option key={description} value={description} />
                                              ))}
                                            </datalist>
                                          )}
                                        </td>
                                        <td className="px-3 py-2 text-right text-sm">
                                          <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(originalIndex, 'quantity', e.target.value)}
                                            className="w-full rounded border border-gray-300 px-2 py-1 text-right text-sm"
                                          />
                                        </td>
                                        <td className="px-3 py-2 text-right text-sm">
                                          <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={item.lengthIn}
                                            onChange={(e) => handleItemChange(originalIndex, 'lengthIn', e.target.value)}
                                            className="w-full rounded border border-gray-300 px-2 py-1 text-right text-sm"
                                          />
                                        </td>
                                        <td className="px-3 py-2 text-right text-sm">
                                          <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={item.widthIn}
                                            onChange={(e) => handleItemChange(originalIndex, 'widthIn', e.target.value)}
                                            className="w-full rounded border border-gray-300 px-2 py-1 text-right text-sm"
                                          />
                                        </td>
                                        <td className="px-3 py-2 text-right text-sm">
                                          <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.rate}
                                            onChange={(e) => handleItemChange(originalIndex, 'rate', e.target.value)}
                                            className="w-full rounded border border-gray-300 px-2 py-1 text-right text-sm"
                                          />
                                        </td>
                                        <td className="px-3 py-2 text-right text-sm">
                                          {(() => {
                                            const lengthFt = Number(item.lengthIn || 0)
                                            const widthFt = Number(item.widthIn || 0)
                                            const areaSqFt = lengthFt > 0 && widthFt > 0 ? lengthFt * widthFt : 0
                                            return areaSqFt > 0 ? areaSqFt.toFixed(2) : '-'
                                          })()}
                                        </td>
                                        <td className="px-3 py-2 text-right text-sm">
                                          <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.total}
                                            onChange={(e) => handleItemChange(originalIndex, 'total', e.target.value)}
                                            className="w-full rounded border border-gray-300 px-2 py-1 text-right text-sm"
                                          />
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                          <button
                                            type="button"
                                            onClick={() => removeItem(originalIndex)}
                                            className="text-red-600 hover:underline"
                                          >
                                            Remove
                                          </button>
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </Fragment>
                              )
                            })
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                <div className="mt-3 text-right">
                  <p className="text-sm font-semibold text-gray-700">Current subtotal: ₹{calculateTotal(quotationItems).toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total Amount</label>
                  <input
                    type="text"
                    value={calculateTotal(quotationItems).toFixed(2)}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  disabled={saveLoading}
                  onClick={() => {
                    setShowModal(false)
                    setCopySourceQuotation(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-5 py-2 bg-black text-white rounded hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saveLoading
                    ? editingQuotation
                      ? 'Updating...'
                      : 'Saving...'
                    : editingQuotation
                      ? 'Update Quotation'
                      : copySourceQuotation
                        ? 'Create Copied Quotation'
                        : 'Create Quotation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingQuotation && (() => {
        const computedItems = getComputedQuotationItems(viewingQuotation.items)
        const sections = getQuotationSections(computedItems)
        const subtotal = Number(viewingQuotation.amount || 0)
        const executionFeePercent = getExecutionFeePercent(viewingQuotation)
        const executionFee = subtotal * (executionFeePercent / 100)
        const grandTotal = subtotal + executionFee
        const clientName = `${viewingQuotation.client.firstName} ${viewingQuotation.client.lastName}`.trim()
        const noteLines = getQuotationNoteLines(viewingQuotation.notes)

        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[28px] bg-white shadow-[0_28px_80px_rgba(18,13,6,0.35)]">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#b7cade] bg-white px-6 py-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.28em] text-[#37658f]">{COMPANY_DETAILS.title}</p>
                <h2 className="text-2xl font-bold text-gray-900">Quotation Report</h2>
                <p className="text-sm text-gray-600">Quotation #{viewingQuotation.quotationNo}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrintQuotation}
                  className="rounded-full bg-[#274d76] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#37658f]"
                >
                  Print Quotation
                </button>
                <button
                  type="button"
                  onClick={() => setViewingQuotation(null)}
                  className="rounded-full border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="bg-[linear-gradient(180deg,#f4f9fd_0%,#e7f2f9_52%,#f8fcff_100%)] p-6">
              <div className="mx-auto max-w-[980px] border-[3px] border-[#7ea8c9] bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] p-6 text-[#1f2f43] shadow-[0_18px_40px_rgba(61,92,122,0.08)]">
                <div className="mb-5 grid gap-5 border-b-2 border-[#7ea8c9] pb-5 md:grid-cols-[1fr_250px] md:items-center">
                  <div className="min-w-0 flex-1 pt-1 text-sm leading-6">
                    <p className="font-sans text-[2.35rem] font-black leading-none tracking-normal text-[#234d72] md:text-[3.15rem]">{COMPANY_DETAILS.title}</p>
                    <div className="mt-4 space-y-1 text-[15px] leading-7 text-[#48667f]">
                      <p>{COMPANY_DETAILS.proprietor}</p>
                      <p>{COMPANY_DETAILS.address}</p>
                      <p>Mob.: {COMPANY_DETAILS.mobile}</p>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-[#b8cfdf] bg-[linear-gradient(180deg,#ffffff_0%,#edf6fc_100%)]">
                    <div className="grid grid-cols-[120px_1fr]">
                      <div className="border-b border-r border-[#b8cfdf] bg-[linear-gradient(180deg,#edf6fc_0%,#dbeaf5_100%)] px-3 py-3 font-semibold text-[#234d72]">Date</div>
                      <div className="border-b border-[#b8cfdf] px-3 py-3">{formatDisplayDate(viewingQuotation.issueDate)}</div>
                      <div className="border-r border-[#b8cfdf] bg-[linear-gradient(180deg,#edf6fc_0%,#dbeaf5_100%)] px-3 py-3 font-semibold text-[#234d72]">Quotation No</div>
                      <div className="px-3 py-3">{viewingQuotation.quotationNo}</div>
                    </div>
                  </div>
                </div>

                <div className="mb-5 overflow-hidden rounded-2xl border border-[#b8cfdf] bg-[linear-gradient(180deg,#ffffff_0%,#f6fbfe_100%)] text-sm">
                  <div className="grid md:grid-cols-2">
                  <div className="grid grid-cols-[120px_1fr] border-b border-[#b8cfdf] md:border-b-0 md:border-r">
                    <div className="border-r border-[#b8cfdf] bg-[linear-gradient(180deg,#edf6fc_0%,#dbeaf5_100%)] px-3 py-3 font-semibold text-[#234d72]">To</div>
                    <div className="px-3 py-3">{clientName || '-'}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] border-b border-[#b8cfdf] md:border-b-0">
                    <div className="border-r border-[#b8cfdf] bg-[linear-gradient(180deg,#edf6fc_0%,#dbeaf5_100%)] px-3 py-3 font-semibold text-[#234d72]">Project</div>
                    <div className="px-3 py-3">{viewingQuotation.project?.name || '-'}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] border-b border-[#b8cfdf] md:border-b-0 md:border-r">
                    <div className="border-r border-[#b8cfdf] bg-[linear-gradient(180deg,#edf6fc_0%,#dbeaf5_100%)] px-3 py-3 font-semibold text-[#234d72]">Address</div>
                    <div className="px-3 py-3">{viewingQuotation.project?.address || viewingQuotation.client.address || '-'}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr]">
                    <div className="border-r border-[#b8cfdf] bg-[linear-gradient(180deg,#edf6fc_0%,#dbeaf5_100%)] px-3 py-3 font-semibold text-[#234d72]">Area</div>
                    <div className="px-3 py-3">{formatOptionalNumber(viewingQuotation.project?.areaSqFt || 0)} Sq.ft</div>
                  </div>
                  </div>
                </div>

                <div className="mb-5 rounded-2xl border border-[#bfd6e6] bg-[linear-gradient(180deg,#f3f9fd_0%,#e4f0f8_100%)] px-5 py-4 text-center text-[15px] font-medium leading-7 text-[#38556d]">
                  Thank you for giving us an opportunity to prepare your interior quotation. The estimate below is arranged in a room-wise and work-wise format so it stays easy to understand for discussion, approval, and execution.
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-[#b8cfdf] text-sm">
                    <thead>
                      <tr className="bg-[linear-gradient(180deg,#e9f4fb_0%,#d4e7f4_100%)] text-center text-[#1d3950]">
                        <th className="border border-[#b8cfdf] px-2 py-3 font-semibold uppercase tracking-[0.04em]">Sr No</th>
                        <th className="border border-[#b8cfdf] px-2 py-3 font-semibold uppercase tracking-[0.04em]">Item Description</th>
                        <th className="border border-[#b8cfdf] px-2 py-3 font-semibold uppercase tracking-[0.04em]">Length</th>
                        <th className="border border-[#b8cfdf] px-2 py-3 font-semibold uppercase tracking-[0.04em]">Width</th>
                        <th className="border border-[#b8cfdf] px-2 py-3 font-semibold uppercase tracking-[0.04em]">Unit</th>
                        <th className="border border-[#b8cfdf] px-2 py-3 font-semibold uppercase tracking-[0.04em]">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sections.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="border border-[#b8cfdf] px-3 py-4 text-center text-gray-500">
                            No quotation items added yet.
                          </td>
                        </tr>
                      ) : (
                        sections.map((section, sectionIndex) => (
                          <Fragment key={section.key}>
                            <tr className="bg-[linear-gradient(180deg,#f5fbff_0%,#e8f3fa_100%)]">
                              <td colSpan={6} className="border border-[#b8cfdf] px-4 py-3">
                                <p className="text-base font-bold uppercase tracking-[0.06em] text-[#234d72]">{section.title}</p>
                              </td>
                            </tr>
                            {(() => {
                              let itemCounter = 0
                              const renderItem = (item: ComputedQuotationItem, keySuffix: string) => {
                                itemCounter += 1
                                return (
                                  <tr key={item.id || `${section.key}-${item.description}-${keySuffix}`}>
                                    <td className="border border-[#b8cfdf] px-2 py-3 text-center align-top">{sectionIndex + 1}.{itemCounter}</td>
                                    <td className="border border-[#b8cfdf] px-3 py-3 align-top">
                                      <p className="font-semibold text-[#1f2f43]">{item.description || '-'}</p>
                                      <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[#6a89a1]">{item.category || 'Work item'}</p>
                                    </td>
                                    <td className="border border-[#b8cfdf] px-2 py-3 text-center align-top">{formatOptionalNumber(item.lengthIn)}</td>
                                    <td className="border border-[#b8cfdf] px-2 py-3 text-center align-top">{formatOptionalNumber(item.widthIn)}</td>
                                    <td className="border border-[#b8cfdf] px-2 py-3 text-center align-top">{formatOptionalNumber(item.unitValue)}</td>
                                    <td className="border border-[#b8cfdf] px-2 py-3 text-right align-top">{formatCurrencyWithSymbol(item.total)}</td>
                                  </tr>
                                )
                              }

                              if (section.areaGroups) {
                                return section.areaGroups.map((group, groupIndex) => (
                                  <Fragment key={`${section.key}-${group.area}-${groupIndex}`}>
                                    <tr className="bg-[linear-gradient(180deg,#dff0fa_0%,#c9e1f2_100%)]">
                                      <td className="border border-[#b8cfdf] px-2 py-2"></td>
                                      <td colSpan={5} className="border border-[#b8cfdf] px-3 py-2 text-sm font-extrabold uppercase tracking-[0.08em] text-[#15395c]">
                                        {group.area}
                                      </td>
                                    </tr>
                                    {group.items.map((item, itemIndex) => renderItem(item, `${groupIndex}-${itemIndex}`))}
                                  </Fragment>
                                ))
                              }

                              return (section.items || []).map((item, itemIndex) => renderItem(item, String(itemIndex)))
                            })()}
                          </Fragment>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={5} className="border border-[#b8cfdf] bg-[#f5fbff] px-3 py-3 text-right font-semibold">Total Amount</td>
                        <td className="border border-[#b8cfdf] bg-[linear-gradient(180deg,#dcecf8_0%,#bdd5e6_100%)] px-3 py-3 text-right font-semibold">{formatCurrencyWithSymbol(subtotal)}</td>
                      </tr>
                      <tr>
                        <td colSpan={5} className="border border-[#b8cfdf] px-3 py-3 text-right">
                          Interior Execution Fees / Supervision / Designing ({executionFeePercent.toFixed(2).replace(/\.00$/, '')}%)
                        </td>
                        <td className="border border-[#b8cfdf] px-3 py-3 text-right">{formatCurrencyWithSymbol(executionFee)}</td>
                      </tr>
                      <tr className="bg-[linear-gradient(180deg,#d6ebf8_0%,#b5d3e8_100%)]">
                        <td colSpan={5} className="border border-[#b8cfdf] px-3 py-3 text-right text-base font-bold">Grand Total</td>
                        <td className="border border-[#b8cfdf] px-3 py-3 text-right text-base font-bold">{formatCurrencyWithSymbol(grandTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                  <div className="overflow-hidden rounded-2xl border border-[#b8cfdf]">
                    <div className="border-b border-[#b8cfdf] bg-[linear-gradient(180deg,#edf6fc_0%,#dbeaf5_100%)] px-4 py-3 font-semibold text-[#234d72]">Quotation Notes</div>
                    <ul className="space-y-3 px-6 py-4 text-sm leading-7 text-[#48667f]">
                      {noteLines.map((note) => (
                        <li key={note} className="list-disc">
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-[#b8cfdf]">
                    <div className="border-b border-[#b8cfdf] bg-[linear-gradient(180deg,#edf6fc_0%,#dbeaf5_100%)] px-4 py-3 font-semibold text-[#234d72]">Commercial Summary</div>
                    <div className="space-y-3 px-4 py-4 text-sm">
                      <div className="flex items-center justify-between border-b border-dashed border-[#c8dbe8] pb-3">
                        <span>Status</span>
                        <span className="font-semibold capitalize">{viewingQuotation.status}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-dashed border-[#c8dbe8] pb-3">
                        <span>Base quotation value</span>
                        <span className="font-semibold">{formatCurrencyWithSymbol(subtotal)}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-dashed border-[#c8dbe8] pb-3">
                        <span>Execution fee</span>
                        <span className="font-semibold">{formatCurrencyWithSymbol(executionFee)} ({executionFeePercent.toFixed(2).replace(/\.00$/, '')}%)</span>
                      </div>
                      <div className="flex items-center justify-between text-base">
                        <span className="font-bold">Final grand total</span>
                        <span className="font-bold text-[#234d72]">{formatCurrencyWithSymbol(grandTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-2xl border border-[#b8cfdf]">
                  <div className="border-b border-[#b8cfdf] bg-[linear-gradient(180deg,#e3f0f8_0%,#c7dceb_100%)] px-4 py-3 text-center text-lg font-semibold text-[#234d72]">Terms and Conditions</div>
                  <table className="w-full border-collapse text-sm">
                    <tbody>
                      {QUOTATION_TERMS.map((term, index) => (
                        <tr key={term}>
                          <td className="w-14 border border-[#b8cfdf] px-3 py-3 text-center font-medium">{index + 1}</td>
                          <td className="border border-[#b8cfdf] px-4 py-3 leading-6">{term}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 overflow-hidden rounded-2xl border-2 border-[#9fbad1] bg-[#f4f9fd]">
                  <div className="border-b border-[#b7cade] bg-[linear-gradient(180deg,#dcecf8_0%,#c4dced_100%)] px-4 py-3 text-center font-sans text-xl font-black tracking-wide text-[#173b5d]">Payment Details:</div>
                  <div className="grid bg-[linear-gradient(180deg,#fbfdff_0%,#edf6fc_100%)] md:grid-cols-[minmax(0,1fr)_150px]">
                    <table className="w-full border-collapse text-sm">
                      <tbody>
                        <tr>
                          <td className="w-48 border border-[#b7cade] bg-[linear-gradient(180deg,#eaf4fb_0%,#d5e8f5_100%)] px-4 py-3 font-sans text-base font-black leading-snug text-[#173b5d]">A/C Name</td>
                          <td className="border border-[#b7cade] bg-white/95 px-4 py-3 font-sans text-base font-black leading-snug text-[#173b5d]">{PAYMENT_DETAILS.accountName}</td>
                        </tr>
                        <tr>
                          <td className="border border-[#b7cade] bg-[linear-gradient(180deg,#eaf4fb_0%,#d5e8f5_100%)] px-4 py-3 font-sans text-base font-black leading-snug text-[#173b5d]">Bank Account</td>
                          <td className="border border-[#b7cade] bg-white/95 px-4 py-3 font-sans text-base font-black leading-snug text-[#173b5d]">{PAYMENT_DETAILS.bankAccount}</td>
                        </tr>
                        <tr>
                          <td className="border border-[#b7cade] bg-[linear-gradient(180deg,#eaf4fb_0%,#d5e8f5_100%)] px-4 py-3 font-sans text-base font-black leading-snug text-[#173b5d]">IFSC</td>
                          <td className="border border-[#b7cade] bg-white/95 px-4 py-3 font-sans text-base font-black leading-snug text-[#173b5d]">{PAYMENT_DETAILS.ifsc}</td>
                        </tr>
                        <tr>
                          <td className="border border-[#b7cade] bg-[linear-gradient(180deg,#eaf4fb_0%,#d5e8f5_100%)] px-4 py-3 font-sans text-base font-black leading-snug text-[#173b5d]">UPI</td>
                          <td className="border border-[#b7cade] bg-white/95 px-4 py-3 font-sans text-base font-black leading-snug text-[#173b5d]">{PAYMENT_DETAILS.upi}</td>
                        </tr>
                        <tr>
                          <td className="border border-[#b7cade] bg-[linear-gradient(180deg,#eaf4fb_0%,#d5e8f5_100%)] px-4 py-3 font-sans text-base font-black leading-snug text-[#173b5d]">GPay/PhonePe</td>
                          <td className="border border-[#b7cade] bg-white/95 px-4 py-3 font-sans text-base font-black leading-snug text-[#173b5d]">{PAYMENT_DETAILS.gpayPhonePe}</td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="flex items-center justify-center border border-[#b7cade] bg-[linear-gradient(180deg,#f7fbff_0%,#ffffff_100%)] p-3">
                      <img src="/payment-qr.png" alt="Payment QR" className="h-32 w-32 object-contain" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/*
              <div>
                <p className="font-semibold">Client</p>
                <p>{viewingQuotation.client.firstName} {viewingQuotation.client.lastName}</p>
              </div>
              <div>
                <p className="font-semibold">Project</p>
                <p>{viewingQuotation.project?.name || '-'}</p>
              </div>
              <div>
                <p className="font-semibold">Date</p>
                <p>{new Date(viewingQuotation.issueDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="font-semibold">Status</p>
                <p className="uppercase text-sm tracking-[0.2em] text-black">{viewingQuotation.status}</p>
              </div>
            </div>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border border-gray-200">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm">Description</th>
                    <th className="px-4 py-3 text-right text-sm">Size (ft²)</th>
                    <th className="px-4 py-3 text-right text-sm">Qty</th>
                    <th className="px-4 py-3 text-right text-sm">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(
                    viewingQuotation.items.reduce((acc: Record<string, Record<string, typeof viewingQuotation.items>>, item) => {
                      if (!acc[item.category]) acc[item.category] = {}
                      if (!acc[item.category][item.area]) acc[item.category][item.area] = []
                      acc[item.category][item.area].push(item)
                      return acc
                    }, {})
                  ).map(([category, areas]) => (
                    <Fragment key={category}>
                      <tr>
                        <td colSpan={4} className="px-4 py-3 bg-gray-200 text-sm font-semibold text-gray-900 uppercase">
                          {category}
                        </td>
                      </tr>
                      {Object.entries(areas).map(([area, areaItems]) => (
                        <Fragment key={`${category}-${area}`}>
                          <tr>
                            <td colSpan={4} className="px-4 py-3 bg-gray-100 text-sm font-medium text-gray-900">
                              {area}
                            </td>
                          </tr>
                          {areaItems.map((item) => {
                            const lengthFt = Number(item.lengthCm || 0)
                            const widthFt = Number(item.widthCm || 0)
                            const areaSqFt = lengthFt > 0 && widthFt > 0
                              ? (lengthFt * widthFt).toFixed(2)
                              : '-'
                            return (
                              <tr key={item.id || `${category}-${area}-${item.description}`} className="border-t border-gray-200">
                                <td className="px-4 py-3 text-sm">{item.description}</td>
                                <td className="px-4 py-3 text-right text-sm">{areaSqFt}</td>
                                <td className="px-4 py-3 text-right text-sm">{item.quantity}</td>
                                <td className="px-4 py-3 text-right text-sm">${item.total.toFixed(2)}</td>
                              </tr>
                            )
                          })}
                        </Fragment>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-6 md:flex-row md:justify-between text-sm text-gray-700">
              <div>
                <p className="font-semibold">Notes</p>
                <p>{viewingQuotation.notes || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">Grand Total</p>
                <p className="text-2xl font-bold">${viewingQuotation.amount.toFixed(2)}</p>
              </div>
            
            */}
          </div>
        </div>
        )
      })()}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Quotation #</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Client</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Date</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {quotations.map((quotation) => (
                <tr key={quotation.id}>
                  <td className="px-6 py-3 font-semibold">{quotation.quotationNo}</td>
                  <td className="px-6 py-3">{quotation.client.firstName} {quotation.client.lastName}</td>
                  <td className="px-6 py-3">{formatCurrencyWithSymbol(getQuotationGrandTotal(quotation))}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded text-sm ${
                      quotation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      quotation.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {quotation.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">{new Date(quotation.issueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => openViewQuotation(quotation)}
                      className="text-black hover:underline mr-4"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEdit(quotation)}
                      className="text-blue-600 hover:underline mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleCopyQuotation(quotation)}
                      className="text-emerald-700 hover:underline mr-4"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => handleDelete(quotation.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
