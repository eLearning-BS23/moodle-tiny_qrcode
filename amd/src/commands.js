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
 * @module     tiny_qrcode/commands
 * @copyright  2024 Brain Station 23 Ltd. <brainstation-23.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 *
 */

import { qrcodeButtonName, component } from './common';
import QrcodeImage from './qrcode';
import {get_string as getString} from 'core/str';


const registerImageCommand = (editor, qrcodeButtonText) => {
    const imageIcon = 'qrcode';

    const handleImageAction = async () => {
        // Store a reference to the current editor when the QR code dialogue is opened
        window.currentQRCodeEditor = editor;
        const qrcodeImage = new QrcodeImage(editor);
        qrcodeImage.displayDialogue();
    };

    editor.ui.registry.addToggleButton(qrcodeButtonName, {
        icon: imageIcon,
        tooltip: qrcodeButtonText,
        onAction: handleImageAction,
        onSetup: (api) => {
            return editor.selection.selectorChangedWithUnbind(
                'img:not([data-mce-object]):not([data-mce-placeholder]),figure.image',
                api.setActive
            ).unbind;
        },
    });
};
export const getSetup = async () => {
    const qrcodeButtonText = await getString('insertqrcode', component);
    return (editor) => {
        registerImageCommand(editor, qrcodeButtonText);
    };
};

export default { getSetup };
