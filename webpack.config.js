const defaults = require( '@wordpress/scripts/config/webpack.config' );

// Two bundles: the tool under Werkzeuge (not `admin`: WP-CLI's make-json turns build/admin.js into build/a.js) and the media library's additions (tiles, filter).
module.exports = {
	...defaults,
	entry: {
		tool: './src/admin/index.js',
		media: './src/media/index.js',
	},
};
