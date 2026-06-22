import jwt from 'jsonwebtoken';
import supabase from '../config/supabase.js';

// Officer Login
export const loginOfficer = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get user details
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        initials: user.initials,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Verify token
export const verifyToken = async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        initials: req.user.initials,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Logout (handled client-side with token)
export const logout = async (req, res) => {
  try {
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
