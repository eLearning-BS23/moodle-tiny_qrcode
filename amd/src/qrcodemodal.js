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
 * QR Code insertion modal dialog with sliding live preview and contrast diagnostics.
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
import {debounce} from 'core/utils';

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

        const modalDialog = this.getModal()[0];
        if (modalDialog) {
            modalDialog.classList.add('tiny_qrcode_modal_dialog');
        }
    }

    /**
     * Set visibility of the sliding preview component.
     *
     * @param {boolean} visible
     */
    setPreviewVisibility(visible) {
        const root = this.getRoot()[0];
        const modalDialog = this.getModal()[0];
        const form = root ? root.querySelector('#tiny_qrcode_form') : null;

        if (visible) {
            if (form) {
                form.classList.add('has-preview');
            }
            if (modalDialog) {
                modalDialog.classList.add('has-preview');
            }
        } else {
            if (form) {
                form.classList.remove('has-preview');
            }
            if (modalDialog) {
                modalDialog.classList.remove('has-preview');
            }
        }
    }

    /**
     * Register DOM event listeners for the modal.
     */
    registerEventListeners() {
        super.registerEventListeners();

        this.registerCloseOnCancel();

        const root = this.getRoot();
        const debouncedPreview = debounce(() => this.updateLivePreview(), 250);

        root.on('submit', '#tiny_qrcode_form', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        root.on('click', '#qrcode-submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        root.on('input change paste keyup', '#qrcodecontent', (e) => {
            const hasContent = e.target.value.trim().length > 0;
            this.setPreviewVisibility(hasContent);
            debouncedPreview();
        });

        root.on('input change', 'input:not(#qrcodecontent), select', () => {
            this.updateColorLabels();
            this.updateContrastIndicator();
            debouncedPreview();
        });

        // Initialize state on attach.
        setTimeout(() => {
            this.updateColorLabels();
            this.updateContrastIndicator();
            const rootElem = this.getRoot()[0];
            const contentInput = rootElem ? rootElem.querySelector('#qrcodecontent') : null;
            if (contentInput && contentInput.value.trim()) {
                this.setPreviewVisibility(true);
                this.updateLivePreview();
            } else {
                this.setPreviewVisibility(false);
            }
        }, 50);
    }

    /**
     * Convert hexadecimal color string to RGB object.
     *
     * @param {string} hex
     * @return {{r: number, g: number, b: number}}
     */
    hexToRgb(hex) {
        const clean = hex.replace(/^#/, '');
        const bigint = parseInt(clean, 16);
        return {
            r: Math.floor(bigint / 65536) % 256,
            g: Math.floor(bigint / 256) % 256,
            b: bigint % 256,
        };
    }

    /**
     * Calculate relative luminance for an sRGB component.
     *
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @return {number}
     */
    getLuminance(r, g, b) {
        const a = [r, g, b].map((v) => {
            const c = v / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    }

    /**
     * Calculate WCAG contrast ratio between two RGB colors.
     *
     * @param {{r: number, g: number, b: number}} rgb1
     * @param {{r: number, g: number, b: number}} rgb2
     * @return {number}
     */
    getContrastRatio(rgb1, rgb2) {
        const lum1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
        const lum2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        return (brightest + 0.05) / (darkest + 0.05);
    }

    /**
     * Update color picker hex code display labels.
     */
    updateColorLabels() {
        const root = this.getRoot()[0];
        if (!root) {
            return;
        }
        const bgInput = root.querySelector('#bgtemplateColor');
        const fgInput = root.querySelector('#templateColor');
        const bgVal = root.querySelector('#bgtemplateColorVal');
        const fgVal = root.querySelector('#templateColorVal');

        if (bgInput && bgVal) {
            bgVal.textContent = bgInput.value.toUpperCase();
        }
        if (fgInput && fgVal) {
            fgVal.textContent = fgInput.value.toUpperCase();
        }
    }

    /**
     * Update the WCAG contrast status badge and diagnostic text.
     */
    async updateContrastIndicator() {
        const root = this.getRoot()[0];
        if (!root) {
            return;
        }
        const bgInput = root.querySelector('#bgtemplateColor');
        const fgInput = root.querySelector('#templateColor');
        const badge = root.querySelector('#qrcode-contrast-badge');
        const hint = root.querySelector('#qrcode-contrast-text');

        if (!bgInput || !fgInput || !badge || !hint) {
            return;
        }

        const bgRgb = this.hexToRgb(bgInput.value);
        const fgRgb = this.hexToRgb(fgInput.value);
        const ratio = this.getContrastRatio(bgRgb, fgRgb);
        const ratioStr = ratio.toFixed(1);

        if (ratio >= 4.5) {
            badge.className = 'badge bg-success';
            badge.textContent = `WCAG Pass (${ratioStr}:1)`;
            hint.textContent = await getString('contrast_good', component, ratioStr);
            hint.className = 'small text-success text-start mt-2 border-top pt-2 d-block';
        } else {
            badge.className = 'badge bg-warning text-dark';
            badge.textContent = `Low Contrast (${ratioStr}:1)`;
            hint.textContent = await getString('contrast_warning', component, ratioStr);
            hint.className = 'small text-danger text-start mt-2 border-top pt-2 d-block';
        }
    }

    /**
     * Fetch and render live QR code preview in the modal.
     */
    async updateLivePreview() {
        const root = this.getRoot()[0];
        if (!root) {
            return;
        }

        const contentInput = root.querySelector('#qrcodecontent');
        const sizeInput = root.querySelector('#qrcode_size');
        const marginInput = root.querySelector('#qrcode_margin');
        const formatSelect = root.querySelector('#qrcode_format');
        const eccSelect = root.querySelector('#qrcode_ecc');
        const bgInput = root.querySelector('#bgtemplateColor');
        const fgInput = root.querySelector('#templateColor');

        const previewImg = root.querySelector('#qrcode-preview-img');
        const placeholder = root.querySelector('#qrcode-preview-placeholder');

        const content = contentInput ? contentInput.value.trim() : '';

        if (!content) {
            this.setPreviewVisibility(false);
            if (previewImg) {
                previewImg.classList.add('d-none');
            }
            if (placeholder) {
                placeholder.classList.remove('d-none');
            }
            return;
        }

        this.setPreviewVisibility(true);

        const size = Math.min(parseInt(sizeInput?.value, 10) || 200, 300);
        const margin = parseInt(marginInput?.value, 10) || 10;
        const format = formatSelect ? formatSelect.value : 'png';
        const ecc = eccSelect ? eccSelect.value : 'medium';

        try {
            const response = await AJAX.call([{
                methodname: 'tiny_qrcode_generate_qr_code',
                args: {
                    content,
                    size,
                    margin,
                    bgcolor: this.hexToRgb(bgInput.value),
                    fgcolor: this.hexToRgb(fgInput.value),
                    ecc,
                    format,
                },
            }])[0];

            if (response.status && previewImg && placeholder) {
                previewImg.src = response.datauri;
                previewImg.classList.remove('d-none');
                placeholder.classList.add('d-none');
            }
        } catch (error) {
            // Silently ignore transient preview errors while author is typing.
        }
    }

    /**
     * Handle form submission and insert generated QR code into TinyMCE editor.
     */
    async handleFormSubmit() {
        const root = this.getRoot()[0];
        const contentInput = root.querySelector('#qrcodecontent');
        const sizeInput = root.querySelector('#qrcode_size');
        const marginInput = root.querySelector('#qrcode_margin');
        const formatSelect = root.querySelector('#qrcode_format');
        const eccSelect = root.querySelector('#qrcode_ecc');
        const bgColorInput = root.querySelector('#bgtemplateColor');
        const fgColorInput = root.querySelector('#templateColor');
        const submitBtn = root.querySelector('#qrcode-submit');

        const content = contentInput.value.trim();
        const size = parseInt(sizeInput.value, 10) || 200;
        const margin = parseInt(marginInput.value, 10) || 10;
        const format = formatSelect ? formatSelect.value : 'png';
        const ecc = eccSelect ? eccSelect.value : 'medium';

        if (!content) {
            contentInput.classList.add('is-invalid');
            contentInput.focus();
            return;
        }
        contentInput.classList.remove('is-invalid');

        submitBtn.disabled = true;

        try {
            const altPrefix = await getString('altTextPrefix', component);
            const response = await AJAX.call([{
                methodname: 'tiny_qrcode_generate_qr_code',
                args: {
                    content,
                    size,
                    margin,
                    bgcolor: this.hexToRgb(bgColorInput.value),
                    fgcolor: this.hexToRgb(fgColorInput.value),
                    ecc,
                    format,
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
