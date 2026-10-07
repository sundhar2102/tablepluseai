const menuService = require('../services/menu.service');

async function getRestaurantMenu(req, res, next) {
  try {
    const restaurantId = req.params.restaurantId || req.params.id;
    const menu = await menuService.getRestaurantMenu(restaurantId);
    res.json({
      success: true,
      data: menu,
    });
  } catch (err) {
    next(err);
  }
}

async function getMenuItem(req, res, next) {
  try {
    const item = await menuService.getMenuItemById(req.params.id);
    res.json({
      success: true,
      data: item,
    });
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const category = await menuService.createCategory(req.user, req.body);
    res.status(201).json({
      success: true,
      message: 'Menu category created successfully',
      data: category,
    });
  } catch (err) {
    next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const category = await menuService.updateCategory(req.user, req.params.id, req.body);
    res.json({
      success: true,
      message: 'Menu category updated successfully',
      data: category,
    });
  } catch (err) {
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const result = await menuService.deleteCategory(req.user, req.params.id);
    res.json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
}

async function createMenuItem(req, res, next) {
  try {
    const item = await menuService.createMenuItem(req.user, req.body);
    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: item,
    });
  } catch (err) {
    next(err);
  }
}

async function updateMenuItem(req, res, next) {
  try {
    const item = await menuService.updateMenuItem(req.user, req.params.id, req.body);
    res.json({
      success: true,
      message: 'Menu item updated successfully',
      data: item,
    });
  } catch (err) {
    next(err);
  }
}

async function toggleItemAvailability(req, res, next) {
  try {
    const item = await menuService.toggleItemAvailability(req.user, req.params.id);
    res.json({
      success: true,
      message: `Item availability updated to ${item.is_available ? 'available' : 'unavailable'}`,
      data: item,
    });
  } catch (err) {
    next(err);
  }
}

async function deleteMenuItem(req, res, next) {
  try {
    const result = await menuService.deleteMenuItem(req.user, req.params.id);
    res.json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getRestaurantMenu,
  getMenuItem,
  createCategory,
  updateCategory,
  deleteCategory,
  createMenuItem,
  updateMenuItem,
  toggleItemAvailability,
  deleteMenuItem,
};
