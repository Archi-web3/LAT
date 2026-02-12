const Config = require('../models/Config');

// Get Configuration
exports.getConfig = async (req, res) => {
    try {
        let config = await Config.findOne({ key: 'app-config' }).lean();
        if (!config) {
            // Return null or empty object if not found, let frontend handle default
            return res.json(null);
        }
        res.json(config);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Save Configuration
exports.saveConfig = async (req, res) => {
    try {
        const { sections, settings } = req.body;

        let config = await Config.findOne({ key: 'app-config' });

        if (config) {
            config.sections = sections;
            config.settings = settings;
            config.updatedAt = Date.now();
            await config.save();
        } else {
            config = new Config({
                key: 'app-config',
                sections,
                settings
            });
            await config.save();
        }

        res.json(config);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
