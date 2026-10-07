const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const {
  createCategorySchema,
  updateCategorySchema,
  createMenuItemSchema,
  updateMenuItemSchema,
} = require('../validations/menu.validation');

// Public / Customer Menu Endpoints
router.get('/restaurants/:restaurantId/menu', menuController.getRestaurantMenu);
router.get('/menu/items/:id', menuController.getMenuItem);

// Owner / Manager Menu Management Endpoints
router.post(
  '/owner/menu/categories',
  authenticate,
  authorize('owner', 'manager', 'admin'),
  validate(createCategorySchema),
  menuController.createCategory
);

router.patch(
  '/owner/menu/categories/:id',
  authenticate,
  authorize('owner', 'manager', 'admin'),
  validate(updateCategorySchema),
  menuController.updateCategory
);

router.delete(
  '/owner/menu/categories/:id',
  authenticate,
  authorize('owner', 'manager', 'admin'),
  menuController.deleteCategory
);

router.post(
  '/owner/menu/items',
  authenticate,
  authorize('owner', 'manager', 'admin'),
  validate(createMenuItemSchema),
  menuController.createMenuItem
);

router.patch(
  '/owner/menu/items/:id',
  authenticate,
  authorize('owner', 'manager', 'admin'),
  validate(updateMenuItemSchema),
  menuController.updateMenuItem
);

router.patch(
  '/owner/menu/items/:id/toggle',
  authenticate,
  authorize('owner', 'manager', 'admin'),
  menuController.toggleItemAvailability
);

router.delete(
  '/owner/menu/items/:id',
  authenticate,
  authorize('owner', 'manager', 'admin'),
  menuController.deleteMenuItem
);

module.exports = router;
