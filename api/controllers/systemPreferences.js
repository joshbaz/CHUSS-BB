const mongoose = require('mongoose');
const SystemModel = require('../models/systemPreferences');
const AdminModel = require('../models/administrator');

/** update preference */
exports.updateSystemPreferences = async (req, res, next) => {
    try {
     const {smsActive, emailActive} = req.body

        const findPreference = await SystemModel.findOne();

        if (!findPreference) {
            const createPreference = new SystemModel({
                _id: new mongoose.Types.ObjectId(),
                smsActive,
                emailActive
            })

            await createPreference.save();

            res.status(200).json('Preference has been added')
        } else {
            findPreference.smsActive = smsActive,
                findPreference.emailActive = emailActive;
            
            await findPreference.save()

            res.status(200).json('system preference updated')
        }

 } catch (error) {
     if (!error.statusCode) {
         error.statusCode = 500
     }
     next(error)
 }
}

/** get preference */
/** add preference to the projects */

