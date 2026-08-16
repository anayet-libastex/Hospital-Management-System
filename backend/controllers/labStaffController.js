import LabTestRequest from '../models/LabTestRequest.js';

// @desc    Get assigned lab test requests
// @route   GET /api/labstaff/requests
export const getAssignedRequests = async (req, res) => {
  try {
    const labStaffId = req.user.id;
    const requests = await LabTestRequest.find({ labStaffId })
      .populate('patientId', 'name email')
      .populate('doctorId', 'name');
    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Update request status and add result
// @route   PUT /api/labstaff/requests/:id/status
export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, result } = req.body;
    if (!['completed', 'reported'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status. Allowed: completed, reported' });
    }

    const request = await LabTestRequest.findById(id);
    if (!request) return res.status(404).json({ msg: 'Request not found' });
    if (request.labStaffId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to update this request' });
    }

    request.status = status;
    if (result) request.result = result;
    if (status === 'reported') request.reportDate = new Date();
    await request.save();

    res.json({ msg: 'Request updated', request });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get reports (own generated)
// @route   GET /api/labstaff/reports
export const getReports = async (req, res) => {
  try {
    // Here you could fetch generated reports; for simplicity, we return lab requests with results
    const labStaffId = req.user.id;
    const reports = await LabTestRequest.find({ labStaffId, status: 'reported' })
      .populate('patientId', 'name')
      .populate('doctorId', 'name');
    res.json(reports);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};