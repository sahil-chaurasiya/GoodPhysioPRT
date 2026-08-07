const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  mapDoctorToPrt,
  unmapDoctorFromPrt,
  createDoctorLogin,
} = require('../controllers/doctorController');

router.use(protect);

router.get('/', getAllDoctors); // all logged-in roles can view (needed for patient registration dropdown)
router.get('/:id', getDoctorById);

router.post('/', authorize('admin'), createDoctor);
router.put('/:id', authorize('admin'), updateDoctor);
router.delete('/:id', authorize('admin'), deleteDoctor);

router.post('/map', authorize('admin'), mapDoctorToPrt);
router.delete('/:id/map/:prtId', authorize('admin'), unmapDoctorFromPrt);

// Give a doctor portal access (Admin only)
router.post('/:id/create-login', authorize('admin'), createDoctorLogin);

module.exports = router;
