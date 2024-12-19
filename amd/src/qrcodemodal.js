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
 * @module     tiny_qrcode/qrcodemodal
 * @copyright  2024 Brain Station 23 Ltd. <brainstation-23.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 *
 */

import Modal from 'core/modal';
import {component} from './common';
import AJAX from 'core/ajax';
import ModalRegistry from 'core/modal_registry';

const QrcodeModal = class extends Modal {
    static TYPE = `${component}/qrcodemodal`;

    static TEMPLATE = `${component}/insert_qrcode_modal`;

    registerEventListeners() {

        const attachSubmitHandler = () => {
            const qrcodeForm = window.document.getElementById('qrcode-submit');
            const closebtn= window.document.querySelector('div.modal div.modal-content div.modal-header button.btn-close');
            const closebtn1= window.document.querySelector('div.modal div.modal-content div.modal-header button.close');
            if (closebtn){
                closebtn.addEventListener( 'click', (event) => {
                    this.destroy();
                });}
            if (closebtn1){
                closebtn1.addEventListener( 'click', (event) => {
                    this.destroy();
                });}

            if (qrcodeForm) {
                if (!qrcodeForm.dataset.listenerAttached) {
                    qrcodeForm.addEventListener( 'click', (event) => {
                        event.preventDefault();
                        let flag=0;

                        const qrsize = window.document.querySelector('#qrcode_size').value;
                        if(qrsize > 1000 || qrsize < 25){
                            window.document.querySelector('#qrcode_size').style.border = '2px solid red';
                            flag=1;
                        } else{
                            window.document.querySelector('#qrcode_size').style.border = '1px solid black';
                        }

                        const qrmargin = window.document.querySelector('#qrcode_margin').value;
                        if(qrmargin> 100 || qrmargin < 5){
                            window.document.querySelector('#qrcode_margin').style.border = '2px solid red';
                            flag=1;
                        } else {
                            window.document.querySelector('#qrcode_margin').style.border = '1px solid black';
                        }

                        const contentInput = window.document.querySelector('#qrcodecontent');
                        if(contentInput.value.trim() === ''){
                            contentInput.style.border = '2px solid red';
                            flag=1;
                        }else{
                            contentInput.style.border = '1px solid black';
                        }

                        if(flag) return;
                        flag=0;

                        if(contentInput.value.trim() !== ''){
                        const hexToRgba = (hex, alpha = 1) => {
                            hex = hex.replace(/^#/, '');
                            const bigint = parseInt(hex, 16);
                            const r = (bigint >> 16) & 255;
                            const g = (bigint >> 8) & 255;
                            const b = bigint & 255;
                            return {
                                r: r,
                                g: g,
                                b: b,
                                a: alpha
                            };
                        };
                        // Prepare form data for submission
                        const formData = {
                            content: document.querySelector('#qrcodecontent').value,
                            size: parseInt(document.querySelector('#qrcode_size').value),
                            margin: parseInt(document.querySelector('#qrcode_margin').value),
                            bgColor: hexToRgba(
                                document.querySelector('#bgtemplateColor').value,
                                parseFloat(document.querySelector('#bgcolor_a')?.value || 1)
                            ),
                            fgColor: hexToRgba(
                                document.querySelector('#templateColor').value,
                                parseFloat(document.querySelector('#color_a')?.value || 1)
                            ),
                        };
                        // Moodle AJAX call to web service
                        AJAX.call([{
                            methodname: 'tiny_qrcode_generate_qr_code',
                            args: {data: JSON.stringify({
                                content: formData.content,
                                size: formData.size,
                                margin: formData.margin,
                                bgColor: formData.bgColor,
                                fgColor: formData.fgColor,
                            })},
                            done: function(response) {
                                if (response.status) {
                                    const targetEditor = window.currentQRCodeEditor;
                                    if (targetEditor) {
                                        targetEditor.insertContent(`<img src="${response.datauri}" alt="QR Code for ${formData.content}" />`);
                                    } else {
                                        console.error('No target editor found');
                                    }
                                } else {
                                    console.error('QR Code generation failed');
                                }
                                // Clean up the stored editor reference
                                window.currentQRCodeEditor = null;
                            },
                            fail: function(ex) {
                                console.error('Web service call failed', ex);
                                // Clean up the stored editor reference
                                window.currentQRCodeEditor = null;
                            }
                        }]);
                        this.destroy();
                    }
                    else{
                       contentInput.style.border = '2px solid red';
                     //  return;
                    }
                    });
                    qrcodeForm.dataset.listenerAttached = true;
                }
            } else {
                console.warn('Form not found. Retrying...');
                setTimeout(attachSubmitHandler, 500);
            }
        };
        // Attach the submit handler
        attachSubmitHandler();
    }
};
ModalRegistry.register(QrcodeModal.TYPE, QrcodeModal, QrcodeModal.TEMPLATE);

export default QrcodeModal;
