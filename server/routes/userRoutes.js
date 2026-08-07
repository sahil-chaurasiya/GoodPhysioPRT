const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getPrtStats,
} = require('../controllers/userController');

router.use(protect);

router.get('/prt-stats', getPrtStats); // any logged-in user can view dashboard stats
router.get('/', getAllUsers);
router.get('/:id', getUserById);

router.post('/', authorize('admin'), createUser);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
