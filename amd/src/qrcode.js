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
 * @module     tiny_qrcode/qrcode
 * @copyright  2024 Brain Station 23 Ltd. <brainstation-23.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 *
 */

import QrcodeModal from './qrcodemodal';
import {getString} from 'core/str';

export default class QrcodeImage {
    editor = null;
    currentModal = null;
    /**
     * @type {HTMLElement|null} The root element.
     */
    root = null;

    constructor(editor) {
        this.editor = editor;
    }
    async displayDialogue() {
        // Use the fetched string in the modal
        this.currentModal = await QrcodeModal.create({
            title: getString('title', 'tiny_qrcode'),
        });
    }
}