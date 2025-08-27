const { connectDB } = require('./utils/db.js');
const { HarvestEntry, ProduceType, ProduceCategory } = require('./utils/models.js');
const { createResponse, createErrorResponse, handleCORS } = require('./utils/auth.js');

exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS();
  }

  if (event.httpMethod !== 'GET') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  try {
    await connectDB();

    // Get query parameters
    const queryParams = event.queryStringParameters || {};
    const { date, limit = 100, page = 1, search = '', sortBy = 'harvestDate', sortOrder = 'desc' } = queryParams;

    // Build query
    let query = {};
    if (date) {
      query.harvestDate = date;
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { notes: { $regex: search, $options: 'i' } },
        { harvesterName: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Fetch harvest entries with populated produce type, category, and pantry
    const [entries, total] = await Promise.all([
      HarvestEntry.find(query)
        .populate({
          path: 'produceTypeId',
          populate: {
            path: 'categoryId',
            model: 'ProduceCategory'
          }
        })
        .populate('pantryId')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      HarvestEntry.countDocuments(query)
    ]);

    // Transform data to match frontend expectations
    const transformedEntries = entries.map(entry => {
      // Check if produceTypeId was populated
      if (!entry.produceTypeId) {
        console.warn('Harvest entry missing produce type:', entry._id);
        return {
          _id: entry._id,
          produce_type_id: null,
          produceTypeId: null,
          pantry_id: entry.pantryId?._id || null,
          pantryId: entry.pantryId?._id || null,
          quantity: entry.quantity,
          unit: entry.unit,
          weight: entry.weight,
          weightEstimated: entry.weightEstimated,
          harvestDate: entry.harvestDate.toISOString().split('T')[0],
          harvester_name: entry.harvesterName,
          harvesterName: entry.harvesterName,
          notes: entry.notes,
          created_at: entry.createdAt,
          createdAt: entry.createdAt,
          updated_at: entry.updatedAt,
          updatedAt: entry.updatedAt,
          produceType: null,
          pantry: entry.pantryId ? {
            _id: entry.pantryId._id,
            name: entry.pantryId.name
          } : null
        };
      }

      return {
        _id: entry._id,
        produce_type_id: entry.produceTypeId._id,
        produceTypeId: entry.produceTypeId._id,
        pantry_id: entry.pantryId?._id || null,
        pantryId: entry.pantryId?._id || null,
        quantity: entry.quantity,
        unit: entry.unit,
        weight: entry.weight,
        weightEstimated: entry.weightEstimated,
        weight_estimated: entry.weightEstimated,
        harvestDate: entry.harvestDate.toISOString().split('T')[0],
        harvest_date: entry.harvestDate.toISOString().split('T')[0],
        harvester_name: entry.harvesterName,
        harvesterName: entry.harvesterName,
        notes: entry.notes,
        created_at: entry.createdAt,
        createdAt: entry.createdAt,
        updated_at: entry.updatedAt,
        updatedAt: entry.updatedAt,
        produceType: {
          _id: entry.produceTypeId._id,
          name: entry.produceTypeId.name,
          unitType: entry.produceTypeId.unitType,
          unit_type: entry.produceTypeId.unitType,
          conversionFactor: entry.produceTypeId.conversionFactor,
          conversion_factor: entry.produceTypeId.conversionFactor,
          categoryId: entry.produceTypeId.categoryId?._id,
          category: entry.produceTypeId.categoryId ? {
            _id: entry.produceTypeId.categoryId._id,
            name: entry.produceTypeId.categoryId.name,
            description: entry.produceTypeId.categoryId.description
          } : null
        },
        pantry: entry.pantryId ? {
          _id: entry.pantryId._id,
          name: entry.pantryId.name
        } : null
      };
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);

    return createResponse(200, {
      success: true,
      data: {
        entries: transformedEntries,
        pagination: {
          current: pageNum,
          pages: totalPages,
          total: total,
          limit: limitNum,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Harvest list error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};