const tableService = require('../services/table.service');

async function getTableByQrToken(req, res, next) {
  try {
    const { qrToken } = req.params;
    const result = await tableService.getTableByQrToken(qrToken);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

async function getRestaurantTables(req, res, next) {
  try {
    const restaurantId = req.params.restaurantId || req.params.id;
    const tables = await tableService.getRestaurantTables(restaurantId);
    res.json({
      success: true,
      data: tables,
    });
  } catch (err) {
    next(err);
  }
}

async function getTableById(req, res, next) {
  try {
    const table = await tableService.getTableById(req.params.id);
    res.json({
      success: true,
      data: table,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTableByQrToken,
  getRestaurantTables,
  getTableById,
};
