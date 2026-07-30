export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Supabase errors
  if (err.code) {
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'هذا السجل موجود مسبقاً',
      });
    }
    if (err.code === '23503') {
      return res.status(400).json({
        success: false,
        error: 'بيانات مرتبطة غير صالحة',
      });
    }
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'جلسة غير صالحة',
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    error: config.nodeEnv === 'development' 
      ? err.message 
      : 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً',
  });
};
