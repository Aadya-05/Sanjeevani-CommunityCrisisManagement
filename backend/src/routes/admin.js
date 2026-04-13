const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');

router.use(authenticate, authorize('admin','police','hospital'));
router.get('/stats', ctrl.getDashboardStats);
router.get('/users', ctrl.getUsers);
router.put('/users/:id', ctrl.updateUserStatus);
router.put('/incidents/:id/verify', ctrl.verifyIncident);

module.exports = router;