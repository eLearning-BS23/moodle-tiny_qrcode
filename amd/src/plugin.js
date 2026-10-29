// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Tiny QR code plugin entry point.
 *
 * @module     tiny_qrcode/plugin
 * @copyright  2024 Brain Station 23 Ltd. <brainstation-23.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {getTinyMCE} from 'editor_tiny/loader';
import {getPluginMetadata} from 'editor_tiny/utils';
import {component, pluginName} from './common';
import * as Commands from './commands';
import * as Configuration from './configuration';

const qrcodeIcon = '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">' +
    '<rect width="20" height="20" fill="white"/>' +
    '<g fill="black">' +
    '<rect x="0" y="0" width="7" height="7"/>' +
    '<rect x="1" y="1" width="5" height="5" fill="white"/>' +
    '<rect x="2" y="2" width="3" height="3"/>' +
    '<rect x="13" y="0" width="7" height="7"/>' +
    '<rect x="14" y="1" width="5" height="5" fill="white"/>' +
    '<rect x="15" y="2" width="3" height="3"/>' +
    '<rect x="0" y="13" width="7" height="7"/>' +
    '<rect x="1" y="14" width="5" height="5" fill="white"/>' +
    '<rect x="2" y="15" width="3" height="3"/>' +
    '<rect x="13" y="13" width="7" height="7"/>' +
    '<rect x="14" y="14" width="5" height="5" fill="white"/>' +
    '<rect x="15" y="15" width="3" height="3"/>' +
    '<rect x="8" y="2" width="2" height="2"/>' +
    '<rect x="10" y="4" width="2" height="2"/>' +
    '<rect x="2" y="8" width="2" height="2"/>' +
    '<rect x="4" y="10" width="2" height="2"/>' +
    '<rect x="12" y="8" width="2" height="2"/>' +
    '<rect x="14" y="10" width="2" height="2"/>' +
    '<rect x="8" y="12" width="2" height="2"/>' +
    '<rect x="10" y="14" width="2" height="2"/>' +
    '</g></svg>';

export default new Promise((resolve) => {
    Promise.all([
        getTinyMCE(),
        Commands.getSetup(),
        getPluginMetadata(component, pluginName),
    ]).then(([tinyMCE, setupCommands, pluginMetadata]) => {
        tinyMCE.PluginManager.add(`${component}/plugin`, (editor) => {
            editor.ui.registry.addIcon('qrcode', qrcodeIcon);
            setupCommands(editor);
            return pluginMetadata;
        });

        resolve([`${component}/plugin`, Configuration]);
        return;
    }).catch((error) => {
        throw error;
    });
});
