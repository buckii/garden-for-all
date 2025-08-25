import * as XLSX from 'xlsx'


type HarvestEntry = Database['public']['Tables']['harvest_entries']['Row']
type ProduceType = Database['public']['Tables']['produce_types']['Row']
type ProduceCategory = Database['public']['Tables']['produce_categories']['Row']
type FoodPantry = Database['public']['Tables']['food_pantries']['Row']

interface ExportOptions {
  startDate?: string
  endDate?: string
  format?: 'summary' | 'detailed' | 'pantry'
  includeImages?: boolean
}

export const exportHarvestData = async (
  harvestEntries: HarvestEntry[],
  produceTypes: ProduceType[],
  categories: ProduceCategory[],
  foodPantries?: FoodPantry[],
  options: ExportOptions = {}
) => {
  const {
    startDate,
    endDate,
    format = 'detailed'
  } = options

  // Filter entries by date if specified
  let filteredEntries = harvestEntries
  if (startDate || endDate) {
    filteredEntries = harvestEntries.filter(entry => {
      const entryDate = entry.harvest_date
      if (startDate && entryDate < startDate) return false
      if (endDate && entryDate > endDate) return false
      return true
    })
  }

  const workbook = XLSX.utils.book_new()

  if (format === 'summary' || format === 'detailed') {
    // Create summary worksheet
    const summaryData = createSummaryData(filteredEntries, produceTypes, categories)
    const summarySheet = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
  }

  if (format === 'detailed') {
    // Create detailed worksheet
    const detailedData = createDetailedData(filteredEntries, produceTypes, categories)
    const detailedSheet = XLSX.utils.json_to_sheet(detailedData)
    XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed Entries')

    // Create produce types reference
    const produceTypesData = produceTypes.map(pt => {
      const category = categories.find(c => c.id === pt.category_id)
      return {
        'Produce Name': pt.name,
        'Category': category?.name || 'Unknown',
        'Unit Type': pt.unit_type,
        'Value per Unit ($)': pt.conversion_factor,
        'Created': new Date(pt.created_at).toLocaleDateString()
      }
    })
    const produceTypesSheet = XLSX.utils.json_to_sheet(produceTypesData)
    XLSX.utils.book_append_sheet(workbook, produceTypesSheet, 'Produce Types')
  }

  if (format === 'pantry' && foodPantries) {
    // Create pantry commitment tracking
    const pantryData = createPantryData(filteredEntries, produceTypes, categories, foodPantries)
    const pantrySheet = XLSX.utils.json_to_sheet(pantryData)
    XLSX.utils.book_append_sheet(workbook, pantrySheet, 'Pantry Commitments')
  }

  // Generate filename
  const dateRange = startDate && endDate 
    ? `_${startDate}_to_${endDate}`
    : startDate 
    ? `_from_${startDate}`
    : endDate
    ? `_to_${endDate}`
    : `_${new Date().toISOString().split('T')[0]}`

  const filename = `garden_for_all_${format}${dateRange}.xlsx`

  // Save file
  XLSX.writeFile(workbook, filename)

  return {
    filename,
    recordCount: filteredEntries.length,
    dateRange: { startDate, endDate }
  }
}

const createSummaryData = (
  entries: HarvestEntry[],
  produceTypes: ProduceType[],
  categories: ProduceCategory[]
) => {
  const categoryTotals = new Map<string, { quantity: number; value: number; entries: number }>()
  const produceTypeTotals = new Map<string, { quantity: number; value: number; entries: number }>()
  
  let totalQuantity = 0
  let totalValue = 0

  entries.forEach(entry => {
    const produceType = produceTypes.find(pt => pt.id === entry.produce_type_id)
    const category = categories.find(c => c.id === produceType?.category_id)
    
    const quantity = entry.quantity
    const value = quantity * (produceType?.conversion_factor || 0)
    
    totalQuantity += quantity
    totalValue += value

    // Category totals
    if (category) {
      const existing = categoryTotals.get(category.name) || { quantity: 0, value: 0, entries: 0 }
      categoryTotals.set(category.name, {
        quantity: existing.quantity + quantity,
        value: existing.value + value,
        entries: existing.entries + 1
      })
    }

    // Produce type totals
    if (produceType) {
      const existing = produceTypeTotals.get(produceType.name) || { quantity: 0, value: 0, entries: 0 }
      produceTypeTotals.set(produceType.name, {
        quantity: existing.quantity + quantity,
        value: existing.value + value,
        entries: existing.entries + 1
      })
    }
  })

  const summaryData = [
    {
      'Report Type': 'Overall Summary',
      'Total Entries': entries.length,
      'Total Quantity': totalQuantity.toFixed(2),
      'Total Value ($)': totalValue.toFixed(2),
      'Date Range': `${entries.length ? entries[0].harvest_date : 'N/A'} to ${entries.length ? entries[entries.length - 1].harvest_date : 'N/A'}`
    },
    { 'Report Type': '', 'Total Entries': '', 'Total Quantity': '', 'Total Value ($)': '', 'Date Range': '' },
    { 'Report Type': 'BY CATEGORY', 'Total Entries': '', 'Total Quantity': '', 'Total Value ($)': '', 'Date Range': '' }
  ]

  Array.from(categoryTotals.entries()).forEach(([name, totals]) => {
    summaryData.push({
      'Report Type': name,
      'Total Entries': totals.entries,
      'Total Quantity': totals.quantity.toFixed(2),
      'Total Value ($)': totals.value.toFixed(2),
      'Date Range': ''
    })
  })

  summaryData.push(
    { 'Report Type': '', 'Total Entries': '', 'Total Quantity': '', 'Total Value ($)': '', 'Date Range': '' },
    { 'Report Type': 'BY PRODUCE TYPE', 'Total Entries': '', 'Total Quantity': '', 'Total Value ($)': '', 'Date Range': '' }
  )

  Array.from(produceTypeTotals.entries()).forEach(([name, totals]) => {
    summaryData.push({
      'Report Type': name,
      'Total Entries': totals.entries,
      'Total Quantity': totals.quantity.toFixed(2),
      'Total Value ($)': totals.value.toFixed(2),
      'Date Range': ''
    })
  })

  return summaryData
}

const createDetailedData = (
  entries: HarvestEntry[],
  produceTypes: ProduceType[],
  categories: ProduceCategory[]
) => {
  return entries.map(entry => {
    const produceType = produceTypes.find(pt => pt.id === entry.produce_type_id)
    const category = categories.find(c => c.id === produceType?.category_id)
    const value = entry.quantity * (produceType?.conversion_factor || 0)

    return {
      'Date': entry.harvest_date,
      'Time': new Date(entry.created_at).toLocaleTimeString(),
      'Category': category?.name || 'Unknown',
      'Produce Type': produceType?.name || 'Unknown',
      'Quantity': entry.quantity,
      'Unit': entry.unit,
      'Value per Unit ($)': produceType?.conversion_factor || 0,
      'Total Value ($)': value.toFixed(2),
      'Harvester': entry.harvester_name || '',
      'Notes': entry.notes || '',
      'Entry ID': entry.id
    }
  })
}

const createPantryData = (
  entries: HarvestEntry[],
  produceTypes: ProduceType[],
  categories: ProduceCategory[],
  pantries: FoodPantry[]
) => {
  // Calculate total production by category
  const categoryTotals = new Map<string, number>()
  
  entries.forEach(entry => {
    const produceType = produceTypes.find(pt => pt.id === entry.produce_type_id)
    const category = categories.find(c => c.id === produceType?.category_id)
    const value = entry.quantity * (produceType?.conversion_factor || 0)
    
    if (category) {
      const existing = categoryTotals.get(category.name) || 0
      categoryTotals.set(category.name, existing + value)
    }
  })

  const totalProduction = Array.from(categoryTotals.values()).reduce((sum, value) => sum + value, 0)

  return pantries.map(pantry => {
    const commitments = pantry.commitment_amounts || {}
    const totalCommitment = commitments.total || 0
    
    return {
      'Pantry Name': pantry.name,
      'Phone': pantry.contact_info?.phone || '',
      'Email': pantry.contact_info?.email || '',
      'Address': pantry.contact_info?.address || '',
      'Total Commitment ($)': totalCommitment,
      'Vegetables Commitment ($)': commitments.vegetables || 0,
      'Fruits Commitment ($)': commitments.fruits || 0,
      'Herbs Commitment ($)': commitments.herbs || 0,
      'Flowers Commitment ($)': commitments.flowers || 0,
      'Production Available ($)': totalProduction.toFixed(2),
      'Commitment vs Production': totalCommitment > 0 
        ? `${((totalProduction / totalCommitment) * 100).toFixed(1)}%`
        : 'N/A'
    }
  })
}

export const exportCurrentYearData = async () => {
  const currentYear = new Date().getFullYear()
  const startDate = `${currentYear}-01-01`
  const endDate = `${currentYear}-12-31`
  
  // This would typically fetch data from the store or API
  // For now, returning a placeholder
  console.log(`Exporting data from ${startDate} to ${endDate}`)
  
  return {
    filename: `garden_for_all_${currentYear}.xlsx`,
    recordCount: 0,
    dateRange: { startDate, endDate }
  }
}