const defaults = require( '@wordpress/scripts/config/webpack.config' );

// Two bundles: the tool under Werkzeuge and the media library's additions (tiles, filter).
module.exports = {
	...defaults,
	entry: {
		admin: './src/admin/index.js',
		media: './src/media/index.js',
	},
};
