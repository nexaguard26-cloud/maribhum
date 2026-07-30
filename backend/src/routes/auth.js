import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabase.js';
import { config } from '../config/env.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'يرجى إدخال رقم الهاتف وكلمة المرور' 
      });
    }

    // Find staff member
    const { data: staff, error } = await supabaseAdmin
      .from('staff')
      .select('*')
      .eq('phone', phone)
      .eq('is_active', true)
      .single();

    if (error || !staff) {
      return res.status(401).json({ 
        success: false, 
        error: 'بيانات الدخول غير صحيحة' 
      });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, staff.password_hash);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'بيانات الدخول غير صحيحة' 
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { 
        id: staff.id, 
        phone: staff.phone, 
        role: staff.role,
        organization_id: staff.organization_id 
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: staff.id,
          full_name: staff.full_name,
          phone: staff.phone,
          role: staff.role,
          organization_id: staff.organization_id,
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Register (Public for first admin, then protected)
router.post('/register', async (req, res, next) => {
  try {
    const { full_name, phone, password, role, organization_id } = req.body;

    // Check if this is the first user (make them admin)
    const { count } = await supabaseAdmin.from('staff').select('id', { count: 'exact' });
    const isFirstUser = count === 0;
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabaseAdmin
      .from('staff')
      .insert({
        full_name,
        phone,
        password_hash,
        role: isFirstUser ? 'admin' : (role || 'coordinator'),
        organization_id,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }

    res.status(201).json({
      success: true,
      data: {
        id: data.id,
        full_name: data.full_name,
        phone: data.phone,
        role: data.role,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('staff')
      .select('*, organizations(name, name_ar)')
      .eq('id', req.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ 
        success: false, 
        error: 'المستخدم غير موجود' 
      });
    }

    res.json({
      success: true,
      data: {
        id: data.id,
        full_name: data.full_name,
        phone: data.phone,
        role: data.role,
        organization: data.organizations,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.post('/change-password', authMiddleware, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get current user
    const { data: staff } = await supabaseAdmin
      .from('staff')
      .select('password_hash')
      .eq('id', req.user.id)
      .single();

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, staff.password_hash);
    if (!validPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'كلمة المرور الحالية غير صحيحة' 
      });
    }

    // Update password
    const newHash = await bcrypt.hash(newPassword, 10);
    await supabaseAdmin
      .from('staff')
      .update({ password_hash: newHash })
      .eq('id', req.user.id);

    res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
