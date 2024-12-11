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
 * Generate the QR code.
 *
 * @module     tiny_qrcode/configuration
 * @copyright  2024 Brain Station 23 Ltd. <brainstation-23.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 *
 */

import {qrcodeButtonName} from './common';
import { addContextmenuItem,} from 'editor_tiny/utils';

const configureMenu = (menu) => {
    return menu;
};

const configureToolbar = (toolbar) => {
    // The toolbar contains an array of named sections.
    // The Moodle integration ensures that there is a section called 'content'.

    return toolbar.map((section) => {
        if (section.name === 'content') {
            section.items.unshift(qrcodeButtonName);
        }
        return section;
    });
};

export const configure = (instanceConfig) => {
    // Update the instance configuration to add the Qrcode menu option to the menus and toolbars and upload_handler.
    return {
        contextmenu: addContextmenuItem(instanceConfig.contextmenu, qrcodeButtonName),
        menu: configureMenu(instanceConfig.menu),
        toolbar: configureToolbar(instanceConfig.toolbar),
    };
};
