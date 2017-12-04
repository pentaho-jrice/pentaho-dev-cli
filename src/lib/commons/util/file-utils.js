const fs = require('fs');

module.exports = {
    isFileSync: function(filePath) {
        try {
            return fs.statSync(filePath).isFile();
        } catch (e) {
            if (e.code === 'ENOENT') {
                return false;
            } else {
                throw e;
            }
        }
    },

    isFile: function(filePath, cb) {
        fs.stat(filePath, function fsStat(err, stats) {
        if (err) {
            if (err.code === 'ENOENT') {
                return cb(null, false);
            } else {
                return cb(err);
            }
        }
        return cb(null, stats.isFile());
    });
}
}