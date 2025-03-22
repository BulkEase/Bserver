const Batch = require('../models/Batch');

// Get all batches
exports.getAllBatches = async (req, res) => {
  try {
    const batches = await Batch.find().populate('product');
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get batch by ID
exports.getBatchById = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id).populate('product');
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }
    res.json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new batch
exports.createBatch = async (req, res) => {
  try {
    const batch = new Batch(req.body);
    const newBatch = await batch.save();
    res.status(201).json(newBatch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update batch
exports.updateBatch = async (req, res) => {
  try {
    const batch = await Batch.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }
    res.json(batch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete batch
exports.deleteBatch = async (req, res) => {
  try {
    const batch = await Batch.findByIdAndDelete(req.params.id);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }
    res.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update booking count
exports.updateBookingCount = async (req, res) => {
  try {
    const { bookingCount } = req.body;
    const batch = await Batch.findByIdAndUpdate(
      req.params.id,
      { bookingCount },
      { new: true, runValidators: true }
    );
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }
    res.json(batch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 