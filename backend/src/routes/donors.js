const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/donorController');

router.get('/search', authenticate, ctrl.findDonors);
router.post('/register', authenticate, ctrl.registerDonor);
router.put('/availability', authenticate, ctrl.toggleAvailability);

module.exports = router;