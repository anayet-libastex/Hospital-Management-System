const roleCheck = (allowedRoles) => {
  // Convert to array if single string
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    // Ensure auth middleware ran first and attached user
    if (!req.user) {
      return res.status(401).json({ msg: 'Unauthorized - no user context' });
    }

    const userRole = req.user.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        msg: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${userRole}`,
      });
    }

    next();
  };
};

export default roleCheck;