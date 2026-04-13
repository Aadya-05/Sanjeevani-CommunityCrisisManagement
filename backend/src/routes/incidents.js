const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const ctrl = require('../controllers/incidentController');

router.get('/', authenticate, ctrl.getIncidents);
router.post('/', authenticate, upload.array('photos', 5), ctrl.createIncident);
router.get('/:id', authenticate, ctrl.getIncidentById);
router.put('/:id', authenticate, authorize('police','hospital','fire_department','admin'), ctrl.updateIncident);
router.get('/:id/messages', authenticate, ctrl.getIncidentMessages);
router.post('/:id/respond', authenticate, ctrl.joinAsResponder);

module.exports = router;