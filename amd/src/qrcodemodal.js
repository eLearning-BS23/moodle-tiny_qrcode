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
 * QR Code insertion modal dialog.
 *
 * @module     tiny_qrcode/qrcodemodal
 * @copyright  2024 Brain Station 23 Ltd. <brainstation-23.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import Modal from 'core/modal';
import {component, qrcodeModalType} from './common';
import AJAX from 'core/ajax';
import {getString} from 'core/str';
import Notification from 'core/notification';

export default class QrcodeModal extends Modal {

    static TYPE = qrcodeModalType;
    static TEMPLATE = `${component}/insert_qrcode_modal`;

    editor = null;

    /**
     * Factory method to create modal with editor reference.
     *
     * @param {Object} modalConfig
     * @param {Object} editor
     * @return {Promise<QrcodeModal>}
     */
    static async create(modalConfig = {}, editor = null) {
        const modal = await super.create(modalConfig);
        modal.editor = editor;
        return modal;
    }

    /**
     * Configure modal defaults.
     *
     * @param {Object} modalConfig
     */
    configure(modalConfig) {
        modalConfig.show = true;
        modalConfig.removeOnClose = true;

        super.configure(modalConfig);
    }

    registerEventListeners() {
        super.registerEventListeners();

        this.registerCloseOnCancel();

        const root = this.getRoot();

        root.on('submit', '#tiny_qrcode_form', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        root.on('click', '#qrcode-submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });
    }

    async handleFormSubmit() {
        const root = this.getRoot()[0];
        const contentInput = root.querySelector('#qrcodecontent');
        const sizeInput = root.querySelector('#qrcode_size');
        const marginInput = root.querySelector('#qrcode_margin');
        const bgColorInput = root.querySelector('#bgtemplateColor');
        const fgColorInput = root.querySelector('#templateColor');
        const submitBtn = root.querySelector('#qrcode-submit');

        const content = contentInput.value.trim();
        const size = parseInt(sizeInput.value, 10) || 200;
        const margin = parseInt(marginInput.value, 10) || 10;

        if (!content) {
            contentInput.classList.add('is-invalid');
            contentInput.focus();
            return;
        }
        contentInput.classList.remove('is-invalid');

        const hexToRgb = (hex) => {
            const clean = hex.replace(/^#/, '');
            const bigint = parseInt(clean, 16);
            return {
                r: Math.floor(bigint / 65536) % 256,
                g: Math.floor(bigint / 256) % 256,
                b: bigint % 256,
            };
        };

        submitBtn.disabled = true;

        try {
            const altPrefix = await getString('altTextPrefix', component);
            const response = await AJAX.call([{
                methodname: 'tiny_qrcode_generate_qr_code',
                args: {
                    content,
                    size,
                    margin,
                    bgcolor: hexToRgb(bgColorInput.value),
                    fgcolor: hexToRgb(fgColorInput.value),
                },
            }])[0];

            if (response.status && this.editor) {
                const escapeAttr = (str) => {
                    return String(str)
                        .replace(/&/g, '&amp;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#39;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                };

                const safeAlt = escapeAttr(`${altPrefix}: ${content}`);
                const safeSrc = escapeAttr(response.datauri);

                this.editor.insertContent(
                    `<img src="${safeSrc}" alt="${safeAlt}" class="img-fluid tiny-qrcode" />`
                );
                this.destroy();
            } else {
                Notification.addNotification({
                    message: response.error || await getString('qrcode_insert_failed', component),
                    type: 'error',
                });
                submitBtn.disabled = false;
            }
        } catch (error) {
            Notification.exception(error);
            submitBtn.disabled = false;
        }
    }
}

QrcodeModal.registerModalType();
