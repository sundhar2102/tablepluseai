const orderService = require('../services/order.service');

async function createOrder(req, res, next) {
  try {
    const order = await orderService.createOrder(req.user, req.body);
    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order,
    });
  } catch (err) {
    next(err);
  }
}

async function getMyOrders(req, res, next) {
  try {
    const orders = await orderService.getCustomerOrders(req.user.userId);
    res.json({
      success: true,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
}

async function getOrderById(req, res, next) {
  try {
    const order = await orderService.getOrderById(req.user, req.params.id);
    res.json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
}

async function cancelOrder(req, res, next) {
  try {
    const order = await orderService.cancelOrder(req.user, req.params.id);
    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    });
  } catch (err) {
    next(err);
  }
}

async function getOwnerOrders(req, res, next) {
  try {
    const result = await orderService.getOwnerOrders(req.user, req.query);
    res.json({
      success: true,
      data: result.orders,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body;
    const order = await orderService.updateOrderStatus(req.user, req.params.id, status);
    res.json({
      success: true,
      message: `Order status updated to "${status}"`,
      data: order,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getOwnerOrders,
  updateOrderStatus,
};
