const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const registrationController = require('../controllers/registrationController');

// Multer fields configuration for handling upload proof keys
const uploadFields = upload.fields([
  { name: 'youtubeProofs', maxCount: 5 },
  { name: 'instagramProofs', maxCount: 5 }
]);

// Routing mapping
router.post('/', uploadFields, registrationController.createRegistration);
router.get('/', registrationController.getRegistrations);
router.get('/stats', registrationController.getStats);
router.get('/:id', registrationController.getRegistrationById);
router.delete('/:id', registrationController.deleteRegistration);

module.exports = router;
