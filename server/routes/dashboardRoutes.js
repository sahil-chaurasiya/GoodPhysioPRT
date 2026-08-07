const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getSummary,
  getAllVisitData,
  createVisit,
  getAllSessions,
  getAllPatientMedicines,
} = require('../controllers/dashboardController');

router.use(protect);

router.get('/summary', getSummary);
router.get('/all-visit-data', getAllVisitData);
router.post('/visits', createVisit);
router.get('/all-sessions', authorize('admin'), getAllSessions);
router.get('/all-medicines', authorize('admin'), getAllPatientMedicines);

module.exports = router;
