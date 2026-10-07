const express = require('express');
const router = express.Router();
const tableController = require('../controllers/table.controller');

// QR Token Resolution (Public so any dining customer can scan QR)
router.get('/tables/qr/:qrToken', tableController.getTableByQrToken);

// Restaurant Table listing
router.get('/restaurants/:restaurantId/tables', tableController.getRestaurantTables);

// Table details by ID
router.get('/tables/:id', tableController.getTableById);

module.exports = router;
