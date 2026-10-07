const { pool } = require('../config/db');
const AppError = require('../utils/AppError');
const {
  emitMenuUpdated,
  emitMenuItemUpdated,
  emitItemAvailabilityChanged,
} = require('../socket/socket.emitter');

/**
 * Menu Service
 * Handles Digital Menu retrieval and owner menu management.
 */

// Helper to resolve owner's restaurant
async function getOwnerRestaurant(userId, role) {
  if (role === 'admin') return null; // Admin can bypass or specify
  const [rows] = await pool.query(
    'SELECT id, name, is_active FROM restaurants WHERE owner_id = ? LIMIT 1',
    [userId]
  );
  if (!rows.length) {
    throw new AppError(404, 'RESTAURANT_NOT_FOUND', 'No restaurant profile found for this owner account');
  }
  return rows[0];
}

/**
 * Get digital menu for a restaurant (Categories + Items)
 */
async function getRestaurantMenu(restaurantId) {
  const [restRows] = await pool.query(
    'SELECT id, name, is_active FROM restaurants WHERE id = ?',
    [restaurantId]
  );
  if (!restRows.length) {
    throw new AppError(404, 'RESTAURANT_NOT_FOUND', 'Restaurant not found');
  }

  // Fetch categories
  const [categories] = await pool.query(
    'SELECT id, restaurant_id, name, display_order FROM menu_categories WHERE restaurant_id = ? ORDER BY display_order ASC, id ASC',
    [restaurantId]
  );

  // Fetch items
  const [items] = await pool.query(
    `SELECT mi.id, mi.restaurant_id, mi.category_id, mc.name AS category_name,
            mi.name, mi.description, mi.price, mi.is_vegetarian, mi.photo_url,
            mi.is_available, mi.preparation_time_mins, mi.display_order
     FROM menu_items mi
     JOIN menu_categories mc ON mi.category_id = mc.id
     WHERE mi.restaurant_id = ?
     ORDER BY mc.display_order ASC, mi.display_order ASC, mi.id ASC`,
    [restaurantId]
  );

  // Group items by category
  const categoryMap = categories.map((cat) => ({
    ...cat,
    items: items.filter((item) => item.category_id === cat.id),
  }));

  return {
    restaurant: restRows[0],
    categories: categoryMap,
    allItems: items,
  };
}

/**
 * Get single menu item details
 */
async function getMenuItemById(itemId) {
  const [rows] = await pool.query(
    `SELECT mi.*, mc.name AS category_name, r.name AS restaurant_name
     FROM menu_items mi
     JOIN menu_categories mc ON mi.category_id = mc.id
     JOIN restaurants r ON mi.restaurant_id = r.id
     WHERE mi.id = ?`,
    [itemId]
  );

  if (!rows.length) {
    throw new AppError(404, 'ITEM_NOT_FOUND', 'Menu item not found');
  }

  return rows[0];
}

/**
 * Owner: Create menu category
 */
async function createCategory(user, data) {
  let restaurantId;
  if (user.role === 'admin' && data.restaurantId) {
    restaurantId = data.restaurantId;
  } else {
    const rest = await getOwnerRestaurant(user.userId, user.role);
    restaurantId = rest.id;
  }

  const [result] = await pool.query(
    'INSERT INTO menu_categories (restaurant_id, name, display_order) VALUES (?, ?, ?)',
    [restaurantId, data.name, data.displayOrder || 0]
  );

  const [newCat] = await pool.query('SELECT * FROM menu_categories WHERE id = ?', [result.insertId]);
  emitMenuUpdated(restaurantId);
  return newCat[0];
}

/**
 * Owner: Update category
 */
async function updateCategory(user, categoryId, data) {
  const [catRows] = await pool.query(
    `SELECT mc.*, r.owner_id
     FROM menu_categories mc
     JOIN restaurants r ON mc.restaurant_id = r.id
     WHERE mc.id = ?`,
    [categoryId]
  );

  if (!catRows.length) {
    throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Menu category not found');
  }

  const cat = catRows[0];
  if (user.role !== 'admin' && Number(cat.owner_id) !== Number(user.userId)) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to modify this category');
  }

  const updates = [];
  const params = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    params.push(data.name);
  }
  if (data.displayOrder !== undefined) {
    updates.push('display_order = ?');
    params.push(data.displayOrder);
  }

  if (updates.length > 0) {
    params.push(categoryId);
    await pool.query(`UPDATE menu_categories SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  const [updated] = await pool.query('SELECT * FROM menu_categories WHERE id = ?', [categoryId]);
  emitMenuUpdated(cat.restaurant_id);
  return updated[0];
}

/**
 * Owner: Delete category
 */
async function deleteCategory(user, categoryId) {
  const [catRows] = await pool.query(
    `SELECT mc.*, r.owner_id
     FROM menu_categories mc
     JOIN restaurants r ON mc.restaurant_id = r.id
     WHERE mc.id = ?`,
    [categoryId]
  );

  if (!catRows.length) {
    throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Menu category not found');
  }

  const cat = catRows[0];
  if (user.role !== 'admin' && Number(cat.owner_id) !== Number(user.userId)) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to delete this category');
  }

  // Check if items exist
  const [items] = await pool.query('SELECT COUNT(*) AS cnt FROM menu_items WHERE category_id = ?', [categoryId]);
  if (items[0].cnt > 0) {
    throw new AppError(400, 'CATEGORY_NOT_EMPTY', 'Cannot delete category that contains menu items. Delete or move items first.');
  }

  await pool.query('DELETE FROM menu_categories WHERE id = ?', [categoryId]);
  emitMenuUpdated(cat.restaurant_id);
  return { message: 'Category deleted successfully' };
}

/**
 * Owner: Create menu item
 */
async function createMenuItem(user, data) {
  let restaurantId;
  if (user.role === 'admin' && data.restaurantId) {
    restaurantId = data.restaurantId;
  } else {
    const rest = await getOwnerRestaurant(user.userId, user.role);
    restaurantId = rest.id;
  }

  // Verify category belongs to this restaurant
  const [catRows] = await pool.query(
    'SELECT id FROM menu_categories WHERE id = ? AND restaurant_id = ?',
    [data.categoryId, restaurantId]
  );
  if (!catRows.length) {
    throw new AppError(400, 'INVALID_CATEGORY', 'Selected category does not exist for your restaurant');
  }

  const isVeg = data.isVegetarian === true || data.isVegetarian === 1 ? 1 : 0;
  const isAvail = data.isAvailable !== false ? 1 : 0;
  const prepTime = data.preparationTimeMins ? Number(data.preparationTimeMins) : 15;

  const [result] = await pool.query(
    `INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_vegetarian, photo_url, is_available, preparation_time_mins, display_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      restaurantId,
      data.categoryId,
      data.name,
      data.description || null,
      data.price,
      isVeg,
      data.photoUrl || null,
      isAvail,
      prepTime,
      data.displayOrder || 0,
    ]
  );

  const newItem = await getMenuItemById(result.insertId);
  emitMenuItemUpdated(restaurantId, newItem);
  return newItem;
}

/**
 * Owner: Update menu item
 */
async function updateMenuItem(user, itemId, data) {
  const [itemRows] = await pool.query(
    `SELECT mi.*, r.owner_id
     FROM menu_items mi
     JOIN restaurants r ON mi.restaurant_id = r.id
     WHERE mi.id = ?`,
    [itemId]
  );

  if (!itemRows.length) {
    throw new AppError(404, 'ITEM_NOT_FOUND', 'Menu item not found');
  }

  const item = itemRows[0];
  if (user.role !== 'admin' && Number(item.owner_id) !== Number(user.userId)) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to modify this menu item');
  }

  // If category changed, verify it belongs to this restaurant
  if (data.categoryId) {
    const [catRows] = await pool.query(
      'SELECT id FROM menu_categories WHERE id = ? AND restaurant_id = ?',
      [data.categoryId, item.restaurant_id]
    );
    if (!catRows.length) {
      throw new AppError(400, 'INVALID_CATEGORY', 'Selected category does not belong to this restaurant');
    }
  }

  const updates = [];
  const params = [];

  if (data.categoryId !== undefined) {
    updates.push('category_id = ?');
    params.push(data.categoryId);
  }
  if (data.name !== undefined) {
    updates.push('name = ?');
    params.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    params.push(data.description || null);
  }
  if (data.price !== undefined) {
    updates.push('price = ?');
    params.push(data.price);
  }
  if (data.isVegetarian !== undefined) {
    updates.push('is_vegetarian = ?');
    params.push(data.isVegetarian ? 1 : 0);
  }
  if (data.photoUrl !== undefined) {
    updates.push('photo_url = ?');
    params.push(data.photoUrl || null);
  }
  if (data.isAvailable !== undefined) {
    updates.push('is_available = ?');
    params.push(data.isAvailable ? 1 : 0);
  }
  if (data.preparationTimeMins !== undefined) {
    updates.push('preparation_time_mins = ?');
    params.push(data.preparationTimeMins);
  }
  if (data.displayOrder !== undefined) {
    updates.push('display_order = ?');
    params.push(data.displayOrder);
  }

  if (updates.length > 0) {
    params.push(itemId);
    await pool.query(`UPDATE menu_items SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  const updatedItem = await getMenuItemById(itemId);
  emitMenuItemUpdated(item.restaurant_id, updatedItem);
  return updatedItem;
}

/**
 * Owner: Toggle menu item availability
 */
async function toggleItemAvailability(user, itemId) {
  const [itemRows] = await pool.query(
    `SELECT mi.*, r.owner_id
     FROM menu_items mi
     JOIN restaurants r ON mi.restaurant_id = r.id
     WHERE mi.id = ?`,
    [itemId]
  );

  if (!itemRows.length) {
    throw new AppError(404, 'ITEM_NOT_FOUND', 'Menu item not found');
  }

  const item = itemRows[0];
  if (user.role !== 'admin' && Number(item.owner_id) !== Number(user.userId)) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to modify this menu item');
  }

  const newStatus = item.is_available ? 0 : 1;
  await pool.query('UPDATE menu_items SET is_available = ? WHERE id = ?', [newStatus, itemId]);

  const updatedItem = await getMenuItemById(itemId);
  emitItemAvailabilityChanged(item.restaurant_id, updatedItem);
  return updatedItem;
}

/**
 * Owner: Delete menu item
 */
async function deleteMenuItem(user, itemId) {
  const [itemRows] = await pool.query(
    `SELECT mi.*, r.owner_id
     FROM menu_items mi
     JOIN restaurants r ON mi.restaurant_id = r.id
     WHERE mi.id = ?`,
    [itemId]
  );

  if (!itemRows.length) {
    throw new AppError(404, 'ITEM_NOT_FOUND', 'Menu item not found');
  }

  const item = itemRows[0];
  if (user.role !== 'admin' && Number(item.owner_id) !== Number(user.userId)) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to delete this menu item');
  }

  await pool.query('DELETE FROM menu_items WHERE id = ?', [itemId]);
  emitMenuUpdated(item.restaurant_id);
  return { message: 'Menu item deleted successfully' };
}

module.exports = {
  getRestaurantMenu,
  getMenuItemById,
  createCategory,
  updateCategory,
  deleteCategory,
  createMenuItem,
  updateMenuItem,
  toggleItemAvailability,
  deleteMenuItem,
};
