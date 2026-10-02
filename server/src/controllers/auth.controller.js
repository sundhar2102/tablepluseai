const authService = require('../services/auth.service');
const catchAsync  = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');

/**
 * POST /api/auth/register
 */
const register = catchAsync(async (req, res) => {
  const user = await authService.register(req.body);
  sendSuccess(res, 201, null, `Account created successfully. Welcome, ${user.name}!`);
});

/**
 * POST /api/auth/login
 */
const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);
  sendSuccess(res, 200, result, 'Login successful');
});

/**
 * POST /api/auth/logout
 * Stateless JWT — client deletes token. Server acknowledges.
 */
const logout = (req, res) => {
  sendSuccess(res, 200, null, 'Logged out successfully');
};

/**
 * GET /api/users/me
 */
const getMe = catchAsync(async (req, res) => {
  const user = await authService.getUserById(req.user.userId);
  sendSuccess(res, 200, user);
});

/**
 * PATCH /api/users/me
 */
const updateMe = catchAsync(async (req, res) => {
  const user = await authService.updateProfile(req.user.userId, req.body);
  sendSuccess(res, 200, user, 'Profile updated');
});

/**
 * PATCH /api/users/me/password
 */
const changePassword = catchAsync(async (req, res) => {
  await authService.changePassword(req.user.userId, req.body);
  sendSuccess(res, 200, null, 'Password changed successfully');
});

module.exports = { register, login, logout, getMe, updateMe, changePassword };
