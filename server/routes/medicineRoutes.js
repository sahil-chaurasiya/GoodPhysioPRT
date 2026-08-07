const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
} = require('../controllers/medicineController');

router.use(protect);

router.get('/', getAllMedicines);
router.post('/', authorize('admin'), createMedicine);
router.put('/:id', authorize('admin'), updateMedicine);
router.delete('/:id', authorize('admin'), deleteMedicine);

module.exports = router;
