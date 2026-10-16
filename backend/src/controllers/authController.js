const AuthService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { serializeUser } = require('../utils/serializers');

exports.register = asyncHandler(async (req, res) => {
  const user = await AuthService.register(req.body);

  res.status(201).json({ 
    data: serializeUser(user)
  });
});

exports.login = asyncHandler(async (req, res) => {
  const result = await AuthService.login(req.body);

  // result = { token, role }
  res.json({ 
    token: result.token,
    role: result.role  
  });
});

exports.requestRecovery = asyncHandler(async (req, res) => {
  const result = await AuthService.requestRecovery(req.body);
  res.json({ message: result.message, recoveryId: result.recoveryId });
});

exports.confirmRecovery = asyncHandler(async (req, res) => {
  const result = await AuthService.confirmRecovery(req.body);
  res.json(result);
});
