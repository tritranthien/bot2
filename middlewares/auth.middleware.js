import jwt from 'jsonwebtoken';
export const ROLE_HIERARCHY = {
    'SUPER_ADMIN': 4,
    'ADMIN': 3,
    'MANAGER': 2,
    'USER': 1,
    'GUEST': 0
  };
export const authenticateUser = (req, res, next) => {
    const token = req.cookies.accessToken;
    if (!token) {
      if (req.xhr || req.headers.accept.indexOf("json") > -1) {
        return res.status(401).json({ error: "Unauthorized - Please login" });
      }
      return res.redirect("/login");
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'luuluandbot');
      req.user = decoded;
      next();
    } catch (error) {
      res.clearCookie("accessToken");
      return res.redirect("/login");
    }
  };
 export const checkPermission = (roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ 
          message: 'Không có quyền truy cập' 
        });
      }
      next();
    };
  }
  export const permissions = {
    requireSuperAdmin: checkPermission(['SUPER_ADMIN']),
    requireAdmin: checkPermission(['SUPER_ADMIN', 'ADMIN']),
    requireManager: checkPermission(['SUPER_ADMIN', 'ADMIN', 'MANAGER']),
    requireUser: checkPermission(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER'])
  };
