const Medicine = require('../models/Medicine');
const generateId = require('../utils/generateId');

// GET /api/medicines
exports.getAllMedicines = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    const medicines = await Medicine.find(filter).sort({ createdAt: -1 });
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch medicines', error: err.message });
  }
};

// POST /api/medicines  (Admin: "Add New Medicine")
exports.createMedicine = async (req, res) => {
  try {
    const { name, composition, dosageForm, manufacturer, imageUrl } = req.body;
    if (!name) return res.status(400).json({ message: 'Medicine name is required' });

    const medicineId = await generateId(Medicine, 'medicineId', 'MED', { withYear: false, padding: 4 });

    const medicine = await Medicine.create({
      medicineId,
      name,
      composition,
      dosageForm,
      manufacturer,
      imageUrl,
      createdBy: req.user._id,
    });

    res.status(201).json(medicine);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create medicine', error: err.message });
  }
};

// PUT /api/medicines/:id
exports.updateMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });

    ['name', 'composition', 'dosageForm', 'manufacturer', 'imageUrl'].forEach((f) => {
      if (req.body[f] !== undefined) medicine[f] = req.body[f];
    });

    await medicine.save();
    res.json(medicine);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update medicine', error: err.message });
  }
};

// DELETE /api/medicines/:id
exports.deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
    res.json({ message: 'Medicine deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete medicine', error: err.message });
  }
};
