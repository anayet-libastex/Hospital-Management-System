import LabTestRequest from '../models/LabTestRequest.js';

// @desc    Get all pending + assigned requests
export const getAssignedRequests = async (req, res) => {
  try {
    const labStaffId = req.user.id;
    const requests = await LabTestRequest.find({
      status: { $in: ['pending', 'assigned'] },
      $or: [{ labStaffId: null }, { labStaffId: labStaffId }],
    })
      .populate('patientId', 'name email')
      .populate('doctorId', 'name specialization')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error('❌ Error in getAssignedRequests:', err);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
};

// @desc    Assign request to logged-in staff
export const assignRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const labStaffId = req.user.id;
    const request = await LabTestRequest.findById(id);
    if (!request) return res.status(404).json({ msg: 'Request not found' });
    if (request.status !== 'pending') {
      return res.status(400).json({ msg: 'Request is not pending' });
    }
    if (request.labStaffId && request.labStaffId.toString() !== labStaffId) {
      return res.status(403).json({ msg: 'Already assigned to another staff' });
    }
    request.labStaffId = labStaffId;
    request.status = 'assigned';
    await request.save();
    res.json({ msg: 'Request assigned successfully', request });
  } catch (err) {
    console.error('❌ Error in assignRequest:', err);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
};

// @desc    Submit results for each test
export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { testResults, status } = req.body; // testResults: [{testName, result}]

    if (!testResults || !Array.isArray(testResults) || testResults.length === 0) {
      return res.status(400).json({ msg: 'Please provide test results.' });
    }

    const request = await LabTestRequest.findById(id);
    if (!request) return res.status(404).json({ msg: 'Request not found' });
    if (!request.labStaffId || request.labStaffId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    if (request.status === 'reported') {
      return res.status(400).json({ msg: 'Already reported' });
    }

    // Save each test result
    request.testResults = testResults.map(tr => ({
      testName: tr.testName,
      result: tr.result || '',
    }));

    // Update status to 'reported' or 'completed'
    request.status = status || 'reported';
    if (request.status === 'reported') request.reportDate = new Date();

    // For backward compatibility: create a combined result string
    request.result = testResults.map(tr => `${tr.testName}: ${tr.result || 'N/A'}`).join(' | ');

    await request.save();

    res.json({ msg: 'Results submitted successfully', request });
  } catch (err) {
    console.error('❌ Error in updateRequestStatus:', err);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
};

// @desc    Get reports (reported requests)
export const getReports = async (req, res) => {
  try {
    const labStaffId = req.user.id;
    const reports = await LabTestRequest.find({ labStaffId, status: 'reported' })
      .populate('patientId', 'name')
      .populate('doctorId', 'name')
      .sort({ reportDate: -1 });
    res.json(reports);
  } catch (err) {
    console.error('❌ Error in getReports:', err);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
};