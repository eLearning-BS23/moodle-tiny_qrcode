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
 * Commands registration for tiny_qrcode.
 *
 * @module     tiny_qrcode/commands
 * @copyright  2024 Brain Station 23 Ltd. <brainstation-23.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {component, qrcodeButtonName} from './common';
import QrcodeModal from './qrcodemodal';
import {getString} from 'core/str';

const registerImageCommand = (editor, buttonTitle) => {
    editor.ui.registry.addButton(qrcodeButtonName, {
        icon: 'qrcode',
        tooltip: buttonTitle,
        onAction: () => {
            QrcodeModal.create({
                title: getString('title', component),
            }, editor);
        },
    });
};

export const getSetup = async() => {
    const buttonTitle = await getString('insertqrcode', component);
    return (editor) => {
        registerImageCommand(editor, buttonTitle);
    };
};

export default {getSetup};
